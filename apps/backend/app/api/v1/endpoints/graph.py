"""Graph-related API endpoints."""
from fastapi import APIRouter

from app.schemas.graph import GraphResponse
from app.services.graph_service import GraphService

router = APIRouter(prefix="", tags=["graph"])


@router.get("/", response_model=GraphResponse)
def read_graph():
    """Return the entire knowledge graph stored in Neo4j."""
    service = GraphService()
    return service.get_graph_snapshot()
