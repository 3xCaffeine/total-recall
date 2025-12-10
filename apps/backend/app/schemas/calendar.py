"""
Pydantic schemas for Google Calendar API requests and responses.
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime


class EventTime(BaseModel):
    """Event time - either dateTime (for timed events) or date (for all-day events)."""
    dateTime: Optional[str] = None  # ISO 8601 format: '2023-12-01T10:00:00Z'
    date: Optional[str] = None  # YYYY-MM-DD for all-day events
    timeZone: Optional[str] = None


class Attendee(BaseModel):
    """Event attendee."""
    email: str
    displayName: Optional[str] = None
    responseStatus: Optional[str] = None  # accepted, declined, tentative, needsAction
    optional: Optional[bool] = None


class Reminder(BaseModel):
    """Individual reminder."""
    method: str  # email, popup
    minutes: int


class Reminders(BaseModel):
    """Event reminders configuration."""
    useDefault: bool = True
    overrides: Optional[List[Reminder]] = None


# ============== Request Schemas ==============

class EventCreate(BaseModel):
    """Schema for creating a new event."""
    summary: str
    start: Optional[EventTime] = None
    end: Optional[EventTime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[Attendee]] = None
    reminders: Optional[Reminders] = None


class EventUpdate(BaseModel):
    """Schema for updating an event. All fields optional."""
    summary: Optional[str] = None
    start: Optional[EventTime] = None
    end: Optional[EventTime] = None
    description: Optional[str] = None
    location: Optional[str] = None
    attendees: Optional[List[Attendee]] = None
    reminders: Optional[Reminders] = None
    transparency: Optional[str] = None


class EventListQuery(BaseModel):
    """Query parameters for listing events."""
    calendar_id: str = "primary"
    time_min: Optional[str] = None  # ISO 8601 datetime
    time_max: Optional[str] = None  # ISO 8601 datetime
    max_results: int = 10


# ============== Response Schemas ==============

class EventResponse(BaseModel):
    """Schema for event response from Google Calendar API."""
    id: str
    summary: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start: Dict[str, Any]
    end: Dict[str, Any]
    htmlLink: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    status: Optional[str] = None  # confirmed, tentative, cancelled
    creator: Optional[Dict[str, Any]] = None
    organizer: Optional[Dict[str, Any]] = None
    attendees: Optional[List[Dict[str, Any]]] = None
    reminders: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="allow")


class EventListResponse(BaseModel):
    """Schema for list events response."""
    events: List[EventResponse]
    count: int


class DeleteResponse(BaseModel):
    """Schema for delete operation response."""
    success: bool
    message: str
    event_id: str
