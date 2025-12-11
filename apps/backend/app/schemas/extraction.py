"""
Pydantic schemas for LLM extraction results from journal entries.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ExtractionMetadata(BaseModel):
    entry_datetime: Optional[str] = Field(None, description="The datetime of the journal entry if mentioned.")
    source_title: Optional[str] = Field(None, description="The title or source of the entry if available.")
    timezone: Optional[str] = Field(None, description="The timezone associated with the entry.")


class Entity(BaseModel):
    id: str = Field(description="Unique identifier for the entity, e.g., 'e1', 'e2'.")
    name: str = Field(description="The name of the entity as mentioned in the text.")
    normalized_name: Optional[str] = Field(None, description="Normalized or canonical name if different from the mentioned name.")
    type: str = Field(description="Type of entity, such as 'person', 'location', 'organization'.")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Additional attributes related to the entity.")


class Relationship(BaseModel):
    source: str = Field(description="ID of the source entity in the relationship.")
    type: str = Field(description="Type of relationship, e.g., 'meeting', 'friendship'.")
    target: str = Field(description="ID of the target entity in the relationship.")
    description: str = Field(description="Description of the relationship or interaction.")
    datetime: Optional[str] = Field(None, description="Datetime when the relationship occurred, if specified.")


class Todo(BaseModel):
    id: str = Field(description="Unique identifier for the todo item, e.g., 't1'.")
    task: str = Field(description="Description of the task to be done.")
    priority: str = Field(description="Priority level of the task, e.g., 'must_do', 'high', 'normal'.")
    due: Optional[str] = Field(None, description="Due date or time for the task, if mentioned.")
    related_entities: List[str] = Field(default_factory=list, description="List of entity IDs related to this todo.")


class Event(BaseModel):
    id: str = Field(description="Unique identifier for the event, e.g., 'ev1'.")
    title: str = Field(description="Title or name of the event.")
    datetime: Optional[str] = Field(None, description="Datetime of the event.")
    location: Optional[str] = Field(None, description="Location where the event takes place.")
    duration_minutes: Optional[int] = Field(None, description="Estimated duration of the event in minutes.")
    related_entities: List[str] = Field(default_factory=list, description="List of entity IDs related to this event.")
    should_sync_calendar: bool = Field(False, description="Whether this event should be synced to a calendar.")


class ExtractionResult(BaseModel):
    metadata: ExtractionMetadata = Field(description="Metadata extracted from the journal entry.")
    entities: List[Entity] = Field(description="List of entities mentioned in the entry.")
    relationships: List[Relationship] = Field(description="List of relationships between entities.")
    todos: List[Todo] = Field(description="List of actionable tasks extracted from the entry.")
    events: List[Event] = Field(description="List of events or planned activities.")