from app.celery import celery_app
from app.schemas.extraction import ExtractionResult
from app.services.graph_service import GraphService
from app.services.vector_service import VectorService
from app.services.todo_service import TodoService
from app.services.calendar_service import GoogleCalendarService
from app.core.database import get_db
from app.schemas.todo import TodoCreate, Priority
from typing import Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)



@celery_app.task
def ingest_extraction_to_graph(extraction: dict, journal_entry_id: int, content: str, title: Optional[str] = None):
    """
    Ingest extracted data from journal entry into Neo4j graph database.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        content: Content of the journal entry
        title: Title of the journal entry (optional)
    """
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)

    graph_service = GraphService()
    graph_service.ingest_extraction(extraction_result, journal_entry_id, content, title)


@celery_app.task
def ingest_vectors_to_cosdata(extraction: dict, journal_entry_id: int, content: str,
                            title: Optional[str], user_id: str):
    """
    Ingest journal entry content into Cosdata vector database.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        content: Content of the journal entry
        title: Title of the journal entry (optional)
        user_id: User ID owning the entry
    """
    print(f"DEBUG: Starting ingest_vectors_to_cosdata for journal_entry_id: {journal_entry_id}")
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)
    vector_service = VectorService()
    vector_service.process_journal_entry(journal_entry_id, content, title, extraction_result, user_id)


@celery_app.task
def process_todos_from_extraction(extraction: dict, journal_entry_id: int, user_id: str):
    """
    Process and create todos from extracted data.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        user_id: User ID owning the entry
    """
    print(f"DEBUG: Starting process_todos_from_extraction for journal_entry_id: {journal_entry_id}")
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)
    
    # For now, just print the todos
    for todo in extraction_result.todos:
        print(f"TODO: {todo.task}, Priority: {todo.priority}, Due: {todo.due}")


@celery_app.task
def process_calendar_events_from_extraction(
    extraction: dict,
    journal_entry_id: int,
    user_id: str,
    access_token: str,
    refresh_token: str,
    token_expiry: Optional[str],
    client_id: str,
    client_secret: str,
    user_timezone: str = "UTC"
):
    """
    Process and sync calendar events from extracted data to Google Calendar.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        user_id: User ID owning the entry
        access_token: User's Google OAuth access token
        refresh_token: User's Google OAuth refresh token
        token_expiry: When the access token expires (ISO format)
        client_id: Google OAuth client ID
        client_secret: Google OAuth client secret
        user_timezone: User's IANA timezone (e.g., 'Asia/Kolkata', 'America/New_York')
    """
    logger.info(f"Starting process_calendar_events_from_extraction for journal_entry_id: {journal_entry_id}")
    
    extraction_result = ExtractionResult(**extraction)
    
    # Filter events that should be synced to calendar
    events_to_sync = [e for e in extraction_result.events if e.should_sync_calendar]
    
    if not events_to_sync:
        logger.info("No events to sync to calendar")
        return
    
    try:
        # Parse token expiry
        expiry = None
        if token_expiry:
            try:
                expiry = datetime.fromisoformat(token_expiry.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                logger.warning(f"Could not parse token expiry: {token_expiry}")
        
        # Initialize Google Calendar service
        calendar_service = GoogleCalendarService(
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=expiry,
            client_id=client_id,
            client_secret=client_secret
        )
        
        for event in events_to_sync:
            # Parse event datetime
            if not event.datetime:
                logger.warning(f"Event '{event.title}' has no datetime, skipping")
                continue
            
            try:
                start_dt = datetime.fromisoformat(event.datetime.replace("Z", "+00:00"))
            except (ValueError, AttributeError):
                logger.warning(f"Could not parse datetime for event '{event.title}': {event.datetime}")
                continue
            
            # Calculate end time (use duration if provided, otherwise default to 1 hour)
            duration_minutes = event.duration_minutes or 60
            end_dt = start_dt + timedelta(minutes=duration_minutes)
            
            # Format for Google Calendar API with user's timezone
            start = {"dateTime": start_dt.isoformat(), "timeZone": user_timezone}
            end = {"dateTime": end_dt.isoformat(), "timeZone": user_timezone}
            
            # Create event in Google Calendar
            created_event = calendar_service.create_event(
                calendar_id="primary",
                summary=event.title,
                start=start,
                end=end,
                description=f"From journal entry #{journal_entry_id}",
                location=event.location
            )
            
            logger.info(f"Created calendar event: {created_event.get('id')} - {event.title}")
    
    except Exception as e:
        logger.error(f"Error processing calendar events: {e}")
        raise