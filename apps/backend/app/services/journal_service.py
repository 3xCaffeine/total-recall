# Journal entry CRUD logic
"""
Journal service for CRUD operations.
"""
import asyncio
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.journal_entry import JournalEntry
from app.schemas.journal_entry import JournalEntryCreate, JournalEntryUpdate
from app.services.ai_service import AIService
from app.tasks.ai_tasks import ingest_vectors_to_cosdata, process_todos_from_extraction, process_calendar_events_from_extraction, ingest_extraction_to_graph


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

    async def create_entry(self, user_id: str, entry: JournalEntryCreate) -> JournalEntry:
        db_entry = JournalEntry(
            user_id=user_id,
            title=entry.title,
            content=entry.content,
            status=entry.status,
        )
        await asyncio.to_thread(lambda: (self.db.add(db_entry), self.db.commit(), self.db.refresh(db_entry)))
        # Trigger extraction
        ai_service = AIService()
        try:
            extraction = await ai_service.extract_from_journal_entry(db_entry)
            # Trigger graph ingestion task
            ingest_extraction_to_graph.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title)
            # Trigger vector ingestion task
            ingest_vectors_to_cosdata.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title, user_id)
            # Trigger todo processing task
            process_todos_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
            # Trigger calendar events processing task
            process_calendar_events_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
            
        except ValueError:
            # Handle extraction failure, perhaps set status to failed
            pass
        return db_entry

    async def update_entry(self, entry_id: int, user_id: str, entry: JournalEntryUpdate) -> Optional[JournalEntry]:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return None

        update_data = entry.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(db_entry, field, value)

        await asyncio.to_thread(lambda: (self.db.commit(), self.db.refresh(db_entry)))
        # Trigger extraction
        ai_service = AIService()
        try:
            extraction = await ai_service.extract_from_journal_entry(db_entry)
            # Trigger graph ingestion task
            # ingest_extraction_to_graph.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title)
            # Trigger vector ingestion task
            ingest_vectors_to_cosdata.delay(extraction.model_dump(), db_entry.id, db_entry.content, db_entry.title, user_id)
            # Trigger todo processing task
            process_todos_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
            # Trigger calendar events processing task
            process_calendar_events_from_extraction.delay(extraction.model_dump(), db_entry.id, user_id)
        except ValueError:
            # Handle extraction failure
            pass
        return db_entry

    def delete_entry(self, entry_id: int, user_id: str) -> bool:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return False

        self.db.delete(db_entry)
        self.db.commit()
        return True