"""
Pydantic schemas for journal entries.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str


class JournalEntryCreate(JournalEntryBase):
    pass


class JournalEntryUpdate(JournalEntryBase):
    pass


class JournalEntry(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
