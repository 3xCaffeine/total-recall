# Journal entry CRUD logic
"""
Journal service for CRUD operations.
"""
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.journal_entry import JournalEntry
from app.schemas.journal_entry import JournalEntryCreate, JournalEntryUpdate


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
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        return db_entry

    def update_entry(self, entry_id: int, user_id: str, entry: JournalEntryUpdate) -> Optional[JournalEntry]:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return None

        update_data = entry.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(db_entry, field, value)

        self.db.commit()
        self.db.refresh(db_entry)
        return db_entry

    def delete_entry(self, entry_id: int, user_id: str) -> bool:
        db_entry = self.get_entry(entry_id, user_id)
        if not db_entry:
            return False

        self.db.delete(db_entry)
        self.db.commit()
        return True