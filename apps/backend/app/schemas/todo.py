"""
Pydantic schemas for todos.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from enum import Enum as PyEnum


class Priority(PyEnum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TodoBase(BaseModel):
    task: str
    priority: Priority = Priority.MEDIUM
    due_date: Optional[datetime] = None
    journal_entry_id: Optional[int] = None


class TodoCreate(TodoBase):
    pass


class TodoUpdate(TodoBase):
    pass


class Todo(TodoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    created_at: datetime
    updated_at: datetime