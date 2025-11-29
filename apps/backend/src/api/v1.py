"""API v1 routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
import uuid

# Placeholder for actual service instances (will be injected via dependency)
from ..core.auth import get_current_user
from ..services.brain import BrainService
from ..services.vector import VectorService
from ..services.graph import GraphService

router = APIRouter(prefix="/api/v1", tags=["v1"])

# Dependency injection helpers (these will be populated in main.py)
_brain_service: Optional[BrainService] = None
_vector_service: Optional[VectorService] = None
_graph_service: Optional[GraphService] = None


def set_services(brain: Optional[BrainService], vector: Optional[VectorService], graph: Optional[GraphService]) -> None:
    """Set service instances."""
    global _brain_service, _vector_service, _graph_service
    _brain_service = brain
    _vector_service = vector
    _graph_service = graph


def get_brain_service() -> Optional[BrainService]:
    """Get brain service."""
    return _brain_service


def get_vector_service() -> Optional[VectorService]:
    """Get vector service."""
    return _vector_service


def get_graph_service() -> Optional[GraphService]:
    """Get graph service."""
    return _graph_service


# ===================== System & Auth =====================

@router.get("/health")
async def health():
    """Health check."""
    return {"status": "ok"}


@router.get("/users/me")
async def get_current_user_info(user: dict = Depends(get_current_user)):
    """Get current user profile."""
    return {
        "user_id": user["user_id"],
        "message": "User profile endpoint - TODO: Implement full profile",
    }


# ===================== Journal Entries =====================

class JournalEntryCreate(BaseModel):
    """Journal entry creation schema."""
    content: str
    tags: Optional[List[str]] = None
    source: str = "text"


class JournalEntryResponse(BaseModel):
    """Journal entry response schema."""
    entry_id: str
    content: str
    timestamp: str
    source: str
    tags: List[str]


@router.post("/journal", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry: JournalEntryCreate,
    user: dict = Depends(get_current_user),
    brain: Optional[BrainService] = Depends(get_brain_service),
):
    """Create a journal entry."""
    
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Brain service not available. Check GOOGLE_API_KEY configuration.",
        )
    
    # Process the entry
    result = await brain.process_entry(
        user_id=user["user_id"],
        content=entry.content,
        source=entry.source,
    )

    return {
        "entry_id": result["entry_id"],
        "content": entry.content,
        "timestamp": "2025-11-29T00:00:00Z",  # TODO: Use actual timestamp
        "source": entry.source,
        "tags": entry.tags or [],
    }


@router.get("/journal")
async def list_journal_entries(
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user),
):
    """List journal entries with pagination."""
    return {
        "page": page,
        "limit": limit,
        "entries": [],  # TODO: Implement actual listing from DB
        "message": "Journal listing endpoint - TODO: Implement pagination",
    }


@router.get("/journal/{entry_id}")
async def get_journal_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
):
    """Get full entry details."""
    return {
        "entry_id": entry_id,
        "message": "Journal detail endpoint - TODO: Implement full details",
    }


@router.delete("/journal/{entry_id}")
async def delete_journal_entry(
    entry_id: str,
    user: dict = Depends(get_current_user),
    vector: Optional[VectorService] = Depends(get_vector_service),
):
    """Delete an entry."""
    if not vector:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector service not available.",
        )
    await vector.delete_entry(entry_id)
    return {"status": "deleted", "entry_id": entry_id}


# ===================== Brain (Cognition & Retrieval) =====================

class SearchQuery(BaseModel):
    """Search query schema."""
    query: str
    limit: int = 10


class ChatQuery(BaseModel):
    """Chat query schema."""
    query: str
    system_prompt: Optional[str] = None


@router.post("/brain/search")
async def search_brain(
    search: SearchQuery,
    user: dict = Depends(get_current_user),
    brain: Optional[BrainService] = Depends(get_brain_service),
):
    """Hybrid search (vector + graph)."""
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Brain service not available. Check GOOGLE_API_KEY configuration.",
        )
    result = await brain.query_brain(
        user_id=user["user_id"],
        query=search.query,
        vector_limit=search.limit,
    )
    return result


@router.post("/brain/chat")
async def chat_brain(
    chat: ChatQuery,
    user: dict = Depends(get_current_user),
    brain: Optional[BrainService] = Depends(get_brain_service),
):
    """Text-based RAG chat."""
    if not brain:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Brain service not available. Check GOOGLE_API_KEY configuration.",
        )
    response = await brain.rag_response(
        user_id=user["user_id"],
        query=chat.query,
        system_prompt=chat.system_prompt,
    )
    return {"query": chat.query, "response": response}


@router.get("/brain/graph")
async def get_graph_topology(
    user: dict = Depends(get_current_user),
):
    """Fetch graph topology for visualization."""
    return {
        "nodes": [],
        "edges": [],
        "message": "Graph endpoint - TODO: Implement topology fetch",
    }


@router.get("/brain/graph/node/{node_id}")
async def get_graph_node(
    node_id: str,
    user: dict = Depends(get_current_user),
    graph: Optional[GraphService] = Depends(get_graph_service),
):
    """Get specific node and immediate neighbors."""
    if not graph:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Graph service not available.",
        )
    details = await graph.get_node_details(
        user_id=user["user_id"],
        node_id=node_id,
    )
    return details


# ===================== Tasks & Actions =====================

@router.get("/tasks")
async def list_tasks(
    user: dict = Depends(get_current_user),
):
    """List tasks extracted from journal entries."""
    return {
        "tasks": [],
        "message": "Tasks endpoint - TODO: Implement task listing",
    }


@router.patch("/tasks/{task_id}")
async def update_task(
    task_id: str,
    status: str,
    user: dict = Depends(get_current_user),
):
    """Update task status."""
    return {
        "task_id": task_id,
        "status": status,
        "message": "Task update - TODO: Implement task updates",
    }


@router.post("/tasks/sync")
async def sync_tasks(
    user: dict = Depends(get_current_user),
):
    """Manually trigger task sync (e.g., to Google Calendar)."""
    return {
        "status": "synced",
        "message": "Task sync - TODO: Implement calendar integration",
    }
