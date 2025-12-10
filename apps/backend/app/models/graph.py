"""
Neo4j graph models for knowledge graph storage.
"""
from neomodel import (
    StructuredNode,
    StructuredRel,
    StringProperty,
    DateTimeProperty,
    RelationshipTo,
    RelationshipFrom,
    JSONProperty,
    BooleanProperty,
    IntegerProperty,
)


class EntityRelationshipRel(StructuredRel):
    """Relationship properties between entities (and other nodes using RELATED_TO)."""

    type = StringProperty()
    description = StringProperty()
    datetime = StringProperty()

class EntityNode(StructuredNode):
    """
    Node representing an entity (person, location, organization, etc.)
    """
    node_id = StringProperty(unique_index=True, required=True)
    name = StringProperty(required=True)
    normalized_name = StringProperty()
    type = StringProperty(required=True)  # person, location, etc.
    attributes = JSONProperty()

    # Relationships
    related_to = RelationshipTo('EntityNode', 'RELATED_TO', model=EntityRelationshipRel)


class TodoNode(StructuredNode):
    """
    Node representing a todo item
    """
    node_id = StringProperty(unique_index=True, required=True)
    task = StringProperty(required=True)
    priority = StringProperty()
    due = StringProperty()
    related_entities = JSONProperty()  # List of entity IDs

    # Relationships to entities
    related_entity = RelationshipTo('EntityNode', 'RELATED_TO', model=EntityRelationshipRel)


class EventNode(StructuredNode):
    """
    Node representing an event
    """
    node_id = StringProperty(unique_index=True, required=True)
    title = StringProperty(required=True)
    datetime = StringProperty()
    location = StringProperty()
    duration_minutes = IntegerProperty()
    should_sync_calendar = BooleanProperty(default=False)
    related_entities = JSONProperty()  # List of entity IDs

    # Relationships to entities
    related_entity = RelationshipTo('EntityNode', 'RELATED_TO', model=EntityRelationshipRel)


class JournalEntryNode(StructuredNode):
    """
    Node representing a journal entry (connects to extracted data)
    """
    node_id = StringProperty(unique_index=True, required=True)
    title = StringProperty()
    content = StringProperty(required=True)
    created_at = DateTimeProperty()

    # Relationships to extracted data
    has_entity = RelationshipTo('EntityNode', 'HAS_ENTITY')
    has_todo = RelationshipTo('TodoNode', 'HAS_TODO')
    has_event = RelationshipTo('EventNode', 'HAS_EVENT')