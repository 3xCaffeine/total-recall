# Neo4j interactions
from datetime import datetime
from typing import Any, Dict, List, Optional, Sequence

from neomodel import db, StructuredNode  # type: ignore[attr-defined]
from app.core.config import get_settings
from app.schemas.extraction import ExtractionResult
from app.models.graph import EntityNode, EventNode, JournalEntryNode, TodoNode


class GraphService:
    """
    Service for interacting with Neo4j graph database.
    """

    def __init__(self):
        settings = get_settings()
        db.set_connection(settings.neo4j_url)
        db.install_all_labels()  # Install labels and constraints

    def ingest_extraction(self, extraction: ExtractionResult, journal_entry_id: int, content: str, title: Optional[str] = None):
        """
        Ingest extracted data into the graph database.

        Args:
            extraction: The extraction result
            journal_entry_id: ID of the journal entry
            content: Content of the journal entry
            title: Title of the journal entry (optional)
        """
        print(f"DEBUG: Starting ingestion for journal_entry_id {journal_entry_id}")
        
        # Create journal entry node if not exists
        try:
            journal_node = JournalEntryNode.nodes.get(node_id=str(journal_entry_id))
            print(f"DEBUG: Found existing journal node {journal_node.node_id}")
        except JournalEntryNode.DoesNotExist:
            result = JournalEntryNode.get_or_create({
                "node_id": str(journal_entry_id),
                "content": content,
                "title": title,
            })  # type: ignore[arg-type]
            journal_node = result[0]
            print(f"DEBUG: Created journal node {journal_node.node_id}")

        # Ingest entities
        entity_id_map = {}
        for entity in extraction.entities:
            prefixed_id = f"{journal_entry_id}_{entity.id}"
            entity_id_map[entity.id] = prefixed_id
            entity_node = EntityNode.get_or_create({
                'node_id': prefixed_id,
                'name': entity.name,
                'type': entity.type
            })[0]  # type: ignore[arg-type] - neomodel accepts dict for props
            if entity.normalized_name:
                entity_node.normalized_name = entity.normalized_name
            entity_node.attributes = entity.attributes
            entity_node.save()
            print(f"DEBUG: Created entity {prefixed_id}")

            # Connect to journal entry
            journal_node.has_entity.connect(entity_node)

        # Ingest todos
        todo_id_map = {}
        for todo in extraction.todos:
            prefixed_id = f"{journal_entry_id}_{todo.id}"
            todo_id_map[todo.id] = prefixed_id
            todo_node = TodoNode.get_or_create({
                'node_id': prefixed_id,
                'task': todo.task
            })[0]  # type: ignore[arg-type]
            todo_node.priority = todo.priority
            todo_node.due = todo.due
            # Update related_entities with prefixed IDs
            prefixed_related = [entity_id_map.get(eid, eid) for eid in todo.related_entities]
            todo_node.related_entities = prefixed_related
            todo_node.save()
            print(f"DEBUG: Created todo {prefixed_id}")

            # Connect to journal entry
            journal_node.has_todo.connect(todo_node)

            # Connect to related entities
            for entity_id in prefixed_related:
                try:
                    entity_node = EntityNode.nodes.get(node_id=entity_id)
                    todo_node.related_entity.connect(entity_node)
                except EntityNode.DoesNotExist:
                    print(f"DEBUG: Entity {entity_id} not found for todo {prefixed_id}")

        # Ingest events
        event_id_map = {}
        for event in extraction.events:
            prefixed_id = f"{journal_entry_id}_{event.id}"
            event_id_map[event.id] = prefixed_id
            event_node = EventNode.get_or_create({
                'node_id': prefixed_id,
                'title': event.title
            })[0]  # type: ignore[arg-type]
            event_node.datetime = event.datetime
            event_node.location = event.location
            event_node.duration_minutes = event.duration_minutes
            event_node.should_sync_calendar = event.should_sync_calendar
            # Update related_entities with prefixed IDs
            prefixed_related = [entity_id_map.get(eid, eid) for eid in event.related_entities]
            event_node.related_entities = prefixed_related
            event_node.save()
            print(f"DEBUG: Created event {prefixed_id}")

            # Connect to journal entry
            journal_node.has_event.connect(event_node)

            # Connect to related entities
            for entity_id in prefixed_related:
                try:
                    entity_node = EntityNode.nodes.get(node_id=entity_id)
                    event_node.related_entity.connect(entity_node)
                except EntityNode.DoesNotExist:
                    print(f"DEBUG: Entity {entity_id} not found for event {prefixed_id}")

        # Ingest relationships between entities
        for relationship in extraction.relationships:
            if relationship.target == "null":
                print(f"DEBUG: Skipping relationship with null target: {relationship}")
                continue
            source_id = entity_id_map.get(relationship.source, relationship.source)
            target_id = entity_id_map.get(relationship.target, relationship.target)
            try:
                source_node = EntityNode.nodes.get(node_id=source_id)
                target_node = EntityNode.nodes.get(node_id=target_id)
                # Create relationship
                source_node.related_to.connect(target_node, {
                    'type': relationship.type,
                    'description': relationship.description,
                    'datetime': relationship.datetime
                })
                print(f"DEBUG: Created relationship {source_id} -> {target_id}")
            except EntityNode.DoesNotExist as e:
                print(f"DEBUG: Entity not found for relationship: {e}")
        
        print(f"DEBUG: Ingestion complete for journal_entry_id {journal_entry_id}")

    def get_graph_snapshot(self) -> Dict[str, Sequence[Any]]:
        """Return all nodes and relationships stored in Neo4j."""

        return {
            "nodes": self._collect_nodes(),
            "edges": self._collect_relationships(),
        }

    def _collect_nodes(self) -> List[Dict[str, Any]]:
        node_types = [
            (JournalEntryNode, "JournalEntry"),
            (EntityNode, "Entity"),
            (TodoNode, "Todo"),
            (EventNode, "Event"),
        ]

        nodes: List[Dict[str, Any]] = []
        for model, type_name in node_types:
            for node in model.nodes:
                nodes.append(self._serialize_node(node, type_name))
        return nodes

    def _collect_relationships(self) -> List[Dict[str, Any]]:
        query = """
            MATCH (source)-[rel]->(target)
            WHERE source.node_id IS NOT NULL AND target.node_id IS NOT NULL
            RETURN source.node_id AS source, type(rel) AS type, properties(rel) AS properties, target.node_id AS target
        """
        results, _ = db.cypher_query(query)
        edges: List[Dict[str, Any]] = []
        for source, rel_type, properties, target in results:
            edges.append({
                "source": source,
                "target": target,
                "type": rel_type,
                "properties": self._serialize_value(properties or {}),
            })
        return edges

    def _serialize_node(self, node: "StructuredNode", type_name: str) -> Dict[str, Any]:
        metadata: Dict[str, Any] = {}
        prop_names = node.__properties__.keys()
        for prop_name in prop_names:
            if prop_name == "node_id":
                continue
            if not hasattr(node, prop_name):
                continue
            metadata[prop_name] = self._serialize_value(getattr(node, prop_name))

        label = getattr(node.__class__, "__label__", node.__class__.__name__)

        return {
            "id": getattr(node, "node_id", ""),
            "type": type_name,
            "label": label,
            "metadata": metadata,
        }

    def _serialize_value(self, value: Any) -> Any:
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        if isinstance(value, dict):
            return {key: self._serialize_value(sub) for key, sub in value.items()}
        return value