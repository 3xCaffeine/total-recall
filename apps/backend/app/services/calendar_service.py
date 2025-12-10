# Google Calendar API interactions
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class GoogleCalendarService:
    """
    Service class for interacting with Google Calendar API.
    Each user gets their own instance with their OAuth credentials.
    """

    def __init__(
        self,
        access_token: str,
        refresh_token: str,
        token_expiry: Optional[datetime],
        client_id: str,
        client_secret: str,
    ):
        """
        Initialize the Google Calendar service with user credentials.
        
        Args:
            access_token: User's Google OAuth access token
            refresh_token: User's Google OAuth refresh token
            token_expiry: When the access token expires
            client_id: Google OAuth client ID from your app
            client_secret: Google OAuth client secret from your app
        """
        # Ensure token_expiry is timezone-naive (Google library uses naive datetimes)
        expiry = None
        if token_expiry:
            if token_expiry.tzinfo is not None:
                # Convert to naive UTC
                expiry = token_expiry.replace(tzinfo=None)
            else:
                expiry = token_expiry
        
        self.credentials = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=client_id,
            client_secret=client_secret,
            expiry=expiry,
        )
        
        # Refresh token if expired
        if self.credentials.expired and self.credentials.refresh_token:
            self.credentials.refresh(Request())
        
        # Build the Google Calendar service
        self.service = build("calendar", "v3", credentials=self.credentials)

    def create_event(
        self,
        calendar_id: str,
        summary: str,
        start: Dict[str, Any],
        end: Dict[str, Any],
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[Dict[str, str]]] = None,
        reminders: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new event on the specified calendar.
        
        Args:
            calendar_id: Calendar ID (use 'primary' for user's main calendar)
            summary: Event title
            start: Start time dict {'dateTime': 'ISO8601'} or {'date': 'YYYY-MM-DD'}
            end: End time dict {'dateTime': 'ISO8601'} or {'date': 'YYYY-MM-DD'}
            description: Optional event description
            location: Optional event location
            attendees: Optional list of attendees [{'email': 'user@example.com'}]
            reminders: Optional reminders config
            
        Returns:
            Created event data from Google Calendar API
        """
        event_body = {
            "summary": summary,
            "start": start,
            "end": end,
        }
        
        if description:
            event_body["description"] = description
        if location:
            event_body["location"] = location
        if attendees:
            event_body["attendees"] = attendees
        if reminders:
            event_body["reminders"] = reminders

        try:
            event = (
                self.service.events()
                .insert(calendarId=calendar_id, body=event_body)
                .execute()
            )
            logger.info(f"Event created: {event.get('id')}")
            return event
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            raise

    def get_event(self, calendar_id: str, event_id: str) -> Dict[str, Any]:
        """
        Get a single event by ID.
        
        Args:
            calendar_id: Calendar ID (use 'primary' for user's main calendar)
            event_id: The event ID to retrieve
            
        Returns:
            Event data from Google Calendar API
        """
        try:
            event = (
                self.service.events()
                .get(calendarId=calendar_id, eventId=event_id)
                .execute()
            )
            return event
        except Exception as e:
            logger.error(f"Error getting event {event_id}: {e}")
            raise

    def list_events(
        self,
        calendar_id: str,
        time_min: Optional[str] = None,
        time_max: Optional[str] = None,
        max_results: int = 10,
        single_events: bool = True,
        order_by: str = "startTime",
    ) -> List[Dict[str, Any]]:
        """
        List events from the specified calendar.
        
        Args:
            calendar_id: Calendar ID (use 'primary' for user's main calendar)
            time_min: Start of time range (ISO 8601 format)
            time_max: End of time range (ISO 8601 format)
            max_results: Maximum number of events to return
            single_events: Whether to expand recurring events
            order_by: Sort order ('startTime' or 'updated')
            
        Returns:
            List of events from Google Calendar API
        """
        try:
            if not time_min:
                time_min = datetime.now(timezone.utc).isoformat()

            events_result = (
                self.service.events()
                .list(
                    calendarId=calendar_id,
                    timeMin=time_min,
                    timeMax=time_max,
                    maxResults=max_results,
                    singleEvents=single_events,
                    orderBy=order_by,
                )
                .execute()
            )
            events = events_result.get("items", [])
            logger.info(f"Listed {len(events)} events")
            return events
        except Exception as e:
            logger.error(f"Error listing events: {e}")
            raise

    def update_event(
        self,
        calendar_id: str,
        event_id: str,
        summary: Optional[str] = None,
        start: Optional[Dict[str, Any]] = None,
        end: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        location: Optional[str] = None,
        attendees: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Update an existing event.
        
        Args:
            calendar_id: Calendar ID (use 'primary' for user's main calendar)
            event_id: The event ID to update
            summary: New event title (optional)
            start: New start time (optional)
            end: New end time (optional)
            description: New description (optional)
            location: New location (optional)
            attendees: New attendees list (optional)
            
        Returns:
            Updated event data from Google Calendar API
        """
        try:
            # First get the existing event
            existing_event = self.get_event(calendar_id, event_id)

            # Update only provided fields
            if summary is not None:
                existing_event["summary"] = summary
            if start is not None:
                existing_event["start"] = start
            if end is not None:
                existing_event["end"] = end
            if description is not None:
                existing_event["description"] = description
            if location is not None:
                existing_event["location"] = location
            if attendees is not None:
                existing_event["attendees"] = attendees

            updated_event = (
                self.service.events()
                .update(calendarId=calendar_id, eventId=event_id, body=existing_event)
                .execute()
            )
            logger.info(f"Event updated: {event_id}")
            return updated_event
        except Exception as e:
            logger.error(f"Error updating event {event_id}: {e}")
            raise

    def delete_event(self, calendar_id: str, event_id: str) -> bool:
        """
        Delete an event from the calendar.
        
        Args:
            calendar_id: Calendar ID (use 'primary' for user's main calendar)
            event_id: The event ID to delete
            
        Returns:
            True if deletion was successful
        """
        try:
            self.service.events().delete(
                calendarId=calendar_id, eventId=event_id
            ).execute()
            logger.info(f"Event deleted: {event_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {e}")
            raise