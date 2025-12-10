"""
Google Calendar API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import Optional

from app.api.v1.dependencies import get_current_user
from app.schemas.user import CurrentUser
from app.schemas.calendar import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventListResponse,
    DeleteResponse,
)
from app.services.calendar_service import GoogleCalendarService
from app.core.config import get_settings

router = APIRouter(prefix="/calendar", tags=["calendar"])

settings = get_settings()


def get_calendar_service(current_user: CurrentUser) -> GoogleCalendarService:
    """
    Create a GoogleCalendarService instance for the current user.
    Requires user to have Google OAuth tokens.
    """
    if not current_user.google_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google Calendar not connected. Please link your Google account.",
        )

    return GoogleCalendarService(
        access_token=current_user.google_access_token,
        refresh_token=current_user.google_refresh_token,
        token_expiry=current_user.google_token_expiry,
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
    )


@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event: EventCreate,
    calendar_id: str = Query(default="primary", description="Calendar ID"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Create a new event on the user's Google Calendar.
    
    - Use 'primary' for the user's main calendar
    - For timed events, use start.dateTime and end.dateTime (ISO 8601)
    - For all-day events, use start.date and end.date (YYYY-MM-DD)
    """
    service = get_calendar_service(current_user)
    
    try:
        created_event = service.create_event(
            calendar_id=calendar_id,
            summary=event.summary,
            start=event.start.model_dump(exclude_none=True),
            end=event.end.model_dump(exclude_none=True),
            description=event.description,
            location=event.location,
            attendees=[a.model_dump(exclude_none=True) for a in event.attendees] if event.attendees else None,
            reminders=event.reminders.model_dump(exclude_none=True) if event.reminders else None,
        )
        return EventResponse(**created_event)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create event: {str(e)}",
        )


@router.get("/events", response_model=EventListResponse)
async def list_events(
    calendar_id: str = Query(default="primary", description="Calendar ID"),
    time_min: Optional[str] = Query(default=None, description="Start time (ISO 8601)"),
    time_max: Optional[str] = Query(default=None, description="End time (ISO 8601)"),
    max_results: int = Query(default=10, ge=1, le=100, description="Max events to return"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    List events from the user's Google Calendar.
    
    - Defaults to upcoming events from now
    - Use time_min and time_max to filter by date range
    """
    service = get_calendar_service(current_user)
    
    try:
        events = service.list_events(
            calendar_id=calendar_id,
            time_min=time_min,
            time_max=time_max,
            max_results=max_results,
        )
        return EventListResponse(
            events=[EventResponse(**e) for e in events],
            count=len(events),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to list events: {str(e)}",
        )


@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    calendar_id: str = Query(default="primary", description="Calendar ID"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Get a single event by ID from the user's Google Calendar.
    """
    service = get_calendar_service(current_user)
    
    try:
        event = service.get_event(calendar_id=calendar_id, event_id=event_id)
        return EventResponse(**event)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event not found: {str(e)}",
        )


@router.put("/events/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event: EventUpdate,
    calendar_id: str = Query(default="primary", description="Calendar ID"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Update an existing event on the user's Google Calendar.
    
    Only provided fields will be updated.
    """
    service = get_calendar_service(current_user)
    
    try:
        updated_event = service.update_event(
            calendar_id=calendar_id,
            event_id=event_id,
            summary=event.summary,
            start=event.start.model_dump(exclude_none=True) if event.start else None,
            end=event.end.model_dump(exclude_none=True) if event.end else None,
            description=event.description,
            location=event.location,
            attendees=[a.model_dump(exclude_none=True) for a in event.attendees] if event.attendees else None,
        )
        return EventResponse(**updated_event)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update event: {str(e)}",
        )


@router.delete("/events/{event_id}", response_model=DeleteResponse)
async def delete_event(
    event_id: str,
    calendar_id: str = Query(default="primary", description="Calendar ID"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Delete an event from the user's Google Calendar.
    """
    service = get_calendar_service(current_user)
    
    try:
        service.delete_event(calendar_id=calendar_id, event_id=event_id)
        return DeleteResponse(
            success=True,
            message="Event deleted successfully",
            event_id=event_id,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to delete event: {str(e)}",
        )
