"""Graph database service for managing entities and relationships."""
import uuid
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from pydantic import BaseModel
from ..core.neo4j import Neo4jConnection


class Entity(BaseModel):
    """Extracted entity."""
    name: str
    entity_type: str  # Person, Place, Topic, Project
    properties: Dict[str, Any] = {}


class Relationship(BaseModel):
    """Extracted relationship."""
    source_name: str
    source_type: str
    relationship_type: str  # MENTIONS, RELATED_TO, WORKED_ON, etc.
    target_name: str
    target_type: str


class GraphService:
    """Service for managing knowledge graph."""

    def __init__(self, google_api_key: str = "", model: str = "gemini-2.0-flash"):
        """Initialize graph service."""
        self.model = model
        self.google_api_key = google_api_key
        self.client_available = False
        
        if google_api_key:
            try:
                genai.configure(api_key=google_api_key)
                self.client_available = True
            except Exception as e:
                print(f"Warning: Failed to initialize Gemini client: {e}")
                self.client_available = False

    async def extract_entities_and_relationships(
        self,
        user_id: str,
        text: str,
    ) -> tuple[List[Entity], List[Relationship]]:
        """Extract entities and relationships from text using Gemini."""
        
        if not self.client_available:
            print("Warning: Gemini client not available, returning empty entities")
            return [], []
        
        prompt = f"""
        Extract all entities and relationships from this text. Return as JSON.
        
        For entities, identify: People, Places, Topics, Projects.
        For relationships: MENTIONS, RELATED_TO, WORKED_ON, LOCATED_AT, ASSIGNED_TO.
        
        Text: {text}
        
        Return JSON with this structure:
        {{
            "entities": [
                {{"name": "John", "type": "Person", "properties": {{}}}},
                {{"name": "Project Alpha", "type": "Project", "properties": {{}}}}
            ],
            "relationships": [
                {{"source": "John", "source_type": "Person", "rel_type": "WORKED_ON", "target": "Project Alpha", "target_type": "Project"}}
            ]
        }}
        """

        response = genai.GenerativeModel(self.model).generate_content(prompt)
        result_text = response.text

        # Parse JSON response
        import json
        import re
        
        # Extract JSON from response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            try:
                data = json.loads(json_match.group())
                entities = [
                    Entity(
                        name=e["name"],
                        entity_type=e["type"],
                        properties=e.get("properties", {}),
                    )
                    for e in data.get("entities", [])
                ]
                relationships = [
                    Relationship(
                        source_name=r["source"],
                        source_type=r["source_type"],
                        relationship_type=r["rel_type"],
                        target_name=r["target"],
                        target_type=r["target_type"],
                    )
                    for r in data.get("relationships", [])
                ]
                return entities, relationships
            except json.JSONDecodeError:
                return [], []

        return [], []

    async def sync_graph(
        self,
        user_id: str,
        entities: List[Entity],
        relationships: List[Relationship],
    ) -> None:
        """Sync extracted entities and relationships to Neo4j."""
        
        # Create entity nodes
        for entity in entities:
            node_id = str(uuid.uuid4())
            properties = {
                "id": node_id,
                "name": entity.name,
                **entity.properties,
            }
            await Neo4jConnection.merge_node(
                label=entity.entity_type,
                properties=properties,
                user_id=user_id,
            )

        # Create relationships
        # Note: In production, need to look up node IDs by name
        for rel in relationships:
            # This is simplified; in production, query for node IDs first
            try:
                await Neo4jConnection.create_relationship(
                    start_label=rel.source_type,
                    start_id=rel.source_name,  # Should be UUID
                    rel_type=rel.relationship_type,
                    end_label=rel.target_type,
                    end_id=rel.target_name,  # Should be UUID
                    user_id=user_id,
                )
            except Exception:
                # Handle case where nodes don't exist yet
                pass

    async def extract_tasks(self, text: str) -> List[Dict[str, Any]]:
        """Extract tasks/TODOs from text using Gemini."""
        
        if not self.client_available:
            return []
        
        prompt = f"""
        Extract all actionable tasks or TODOs from this text. Return as JSON array.
        
        Text: {text}
        
        Return JSON array like:
        [
            {{"description": "Call John about Project Alpha", "priority": "high"}},
            {{"description": "Review project timeline", "priority": "medium"}}
        ]
        """

        response = genai.GenerativeModel(self.model).generate_content(prompt)
        result_text = response.text

        import json
        import re
        
        json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
        if json_match:
            try:
                tasks = json.loads(json_match.group())
                return tasks
            except json.JSONDecodeError:
                return []

        return []

    async def get_node_details(
        self,
        user_id: str,
        node_id: str,
        depth: int = 1,
    ) -> Dict[str, Any]:
        """Get node and its neighbors."""
        return await Neo4jConnection.get_node_neighbors(node_id, user_id, depth)
