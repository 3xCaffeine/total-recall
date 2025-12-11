"""
Pydantic schemas for journal entries.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from enum import Enum as PyEnum


class ProcessingStatus(PyEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    PROCESSED = "PROCESSED"
    FAILED = "FAILED"


class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    status: str = "PENDING"


class JournalEntryCreate(JournalEntryBase):
    timezone: Optional[str] = None  # User's timezone (e.g., "Asia/Kolkata", "America/New_York")


class JournalEntryUpdate(JournalEntryBase):
    timezone: Optional[str] = None  # User's timezone for update operations


class JournalEntry(JournalEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime
