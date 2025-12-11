# Journal entry CRUD logic
"""
Journal service for CRUD operations.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.journal_entry import JournalEntry
from app.schemas.journal_entry import JournalEntryCreate, JournalEntryUpdate
<<<<<<< Updated upstream

=======
from app.services.ai_service import AIService
from app.services.auth_service import AuthService
from app.core.database import get_auth_db
from app.core.config import get_settings
#from app.tasks.ai_tasks import ingest_vectors_to_cosdata
from app.tasks.ai_tasks import process_todos_from_extraction, process_calendar_events_from_extraction
>>>>>>> Stashed changes

class JournalService:
    def __init__(self, db: Session):
        self.db = db

    def get_entries(self, user_id: str, skip: int = 0, limit: int = 100) -> List[JournalEntry]:
        return (
            self.db.query(JournalEntry)
            .filter(JournalEntry.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_entry(self, entry_id: int, user_id: str) -> Optional[JournalEntry]:
        return (
            self.db.query(JournalEntry)
            .filter(JournalEntry.id == entry_id, JournalEntry.user_id == user_id)
            .first()
        )

    def create_entry(self, user_id: str, entry: JournalEntryCreate) -> JournalEntry:
        db_entry = JournalEntry(
            user_id=user_id,
            title=entry.title,
            content=entry.content,
        )
<<<<<<< Updated upstream
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
=======
        await asyncio.to_thread(lambda: (self.db.add(db_entry), self.db.commit(), self.db.refresh(db_entry)))
        # Trigger extraction
        ai_service = AIService()
        try:
            # Format current date for LLM context (use entry creation time)
            current_date = db_entry.created_at.strftime("%B %d, %Y")
            # Use timezone from request, or default to UTC
            timezone = entry.timezone or "UTC"
            extraction = await ai_service.extract_from_journal_entry(db_entry, current_date, timezone)
            # Trigger graph ingestion task
            # ingest_extraction_to_graph.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title)
            # # Trigger vector ingestion task
            # ingest_vectors_to_cosdata.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title, user_id)
            # # Trigger todo processing task
            process_todos_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
            
            # Trigger calendar events processing task with user's Google OAuth tokens
            auth_db = next(get_auth_db())
            try:
                auth_service = AuthService(auth_db)
                user_data = auth_service.get_user(user_id)
                
                print(f"\n{'='*60}")
                print(f"JOURNAL SERVICE - Checking calendar sync for user: {user_id}")
                print(f"User data found: {bool(user_data)}")
                if user_data:
                    print(f"Has google_access_token: {bool(user_data.get('google_access_token'))}")
                    print(f"Has google_refresh_token: {bool(user_data.get('google_refresh_token'))}")
                print(f"{'='*60}\n")
                
                if user_data and user_data.get("google_access_token"):
                    settings = get_settings()
                    print(f"Triggering calendar sync Celery task...")
                    process_calendar_events_from_extraction.delay(
                        extraction.model_dump(),
                        db_entry.id,
                        user_id,
                        user_data["google_access_token"],
                        user_data["google_refresh_token"],
                        str(user_data["google_token_expires_at"]) if user_data.get("google_token_expires_at") else None,
                        settings.google_client_id,
                        settings.google_client_secret,
                        timezone  # Pass user's timezone to calendar task
                    )
                    print(f"Calendar sync task triggered successfully!\n")
                else:
                    print(f"Skipping calendar sync - User does not have Google OAuth tokens\n")
            finally:
                auth_db.close()
            
        except ValueError:
            # Handle extraction failure, perhaps set status to failed
            pass
>>>>>>> Stashed changes
        return db_entry

    def update_entry(self, entry_id: int, user_id: str, entry: JournalEntryUpdate) -> Optional[JournalEntry]:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return None

        update_data = entry.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(db_entry, field, value)

<<<<<<< Updated upstream
        self.db.commit()
        self.db.refresh(db_entry)
=======
        await asyncio.to_thread(lambda: (self.db.commit(), self.db.refresh(db_entry)))
        # Trigger extraction
        ai_service = AIService()
        try:
            # Format current date for LLM context (use entry update time)
            current_date = db_entry.updated_at.strftime("%B %d, %Y")
            # Use timezone from request if provided, otherwise default to UTC
            timezone = entry.timezone if hasattr(entry, 'timezone') and entry.timezone else "UTC"
            extraction = await ai_service.extract_from_journal_entry(db_entry, current_date, timezone)
            # Trigger graph ingestion task
            # ingest_extraction_to_graph.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title)
            # Trigger vector ingestion task
            #ingest_vectors_to_cosdata.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title, user_id)
            # Trigger todo processing task
            process_todos_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
            
            # Trigger calendar events processing task with user's Google OAuth tokens
            auth_db = next(get_auth_db())
            try:
                auth_service = AuthService(auth_db)
                user_data = auth_service.get_user(user_id)
                
                if user_data and user_data.get("google_access_token"):
                    settings = get_settings()
                    process_calendar_events_from_extraction.delay(
                        extraction.model_dump(),
                        db_entry.id,
                        user_id,
                        user_data["google_access_token"],
                        user_data["google_refresh_token"],
                        str(user_data["google_token_expires_at"]) if user_data.get("google_token_expires_at") else None,
                        settings.google_client_id,
                        settings.google_client_secret,
                        timezone  # Pass user's timezone to calendar task
                    )
            finally:
                auth_db.close()
        except ValueError:
            # Handle extraction failure
            pass
>>>>>>> Stashed changes
        return db_entry

    def delete_entry(self, entry_id: int, user_id: str) -> bool:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return False

        self.db.delete(db_entry)
        self.db.commit()
        return True