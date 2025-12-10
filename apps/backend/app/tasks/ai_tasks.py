from app.celery import celery_app
from app.schemas.extraction import ExtractionResult
from app.services.graph_service import GraphService
from typing import Optional



@celery_app.task
def ingest_extraction_to_graph(extraction: dict, journal_entry_id: int, content: str, title: Optional[str] = None):
    """
    Ingest extracted data from journal entry into Neo4j graph database.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        content: Content of the journal entry
        title: Title of the journal entry (optional)
    """
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)

    graph_service = GraphService()
    graph_service.ingest_extraction(extraction_result, journal_entry_id, content, title)