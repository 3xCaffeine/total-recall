# CRUD for journal entries
"""
Journal entry API endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_db
from app.schemas.user import CurrentUser
from app.schemas.journal_entry import JournalEntry, JournalEntryCreate, JournalEntryUpdate
from app.services.journal_service import JournalService

router = APIRouter()


@router.get("/", response_model=List[JournalEntry])
def read_entries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Get all journal entries for the current user.
    """
    service = JournalService(db)
    entries = service.get_entries(current_user.id, skip=skip, limit=limit)
    return entries


@router.post("/", response_model=JournalEntry)
def create_entry(
    entry: JournalEntryCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Create a new journal entry.
    """
    service = JournalService(db)
    return service.create_entry(current_user.id, entry)


@router.get("/{entry_id}", response_model=JournalEntry)
def read_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Get a specific journal entry by ID.
    """
    service = JournalService(db)
    db_entry = service.get_entry(entry_id, current_user.id)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry


@router.put("/{entry_id}", response_model=JournalEntry)
def update_entry(
    entry_id: int,
    entry: JournalEntryUpdate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Update a journal entry.
    """
    service = JournalService(db)
    db_entry = service.update_entry(entry_id, current_user.id, entry)
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return db_entry


@router.delete("/{entry_id}")
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Delete a journal entry.
    """
    service = JournalService(db)
    success = service.delete_entry(entry_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted successfully"}