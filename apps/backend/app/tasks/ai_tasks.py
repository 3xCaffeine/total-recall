from app.celery import celery_app
from app.schemas.extraction import ExtractionResult
from app.services.graph_service import GraphService
from app.services.vector_service import VectorService
from app.services.todo_service import TodoService
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


@celery_app.task
def ingest_vectors_to_cosdata(extraction: dict, journal_entry_id: int, content: str,
                            title: Optional[str], user_id: str):
    """
    Ingest journal entry content into Cosdata vector database.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        content: Content of the journal entry
        title: Title of the journal entry (optional)
        user_id: User ID owning the entry
    """
    print(f"DEBUG: Starting ingest_vectors_to_cosdata for journal_entry_id: {journal_entry_id}")
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)
    vector_service = VectorService()
    vector_service.process_journal_entry(journal_entry_id, content, title, extraction_result, user_id)


@celery_app.task
def process_todos_from_extraction(extraction: dict, journal_entry_id: int, user_id: str):
    """
    Process and create todos from extracted data.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        user_id: User ID owning the entry
    """
    print(f"DEBUG: Starting process_todos_from_extraction for journal_entry_id: {journal_entry_id}")
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)
    
    # For now, just print the todos
    for todo in extraction_result.todos:
        print(f"TODO: {todo.task}, Priority: {todo.priority}, Due: {todo.due}")


@celery_app.task
def process_calendar_events_from_extraction(extraction: dict, journal_entry_id: int, user_id: str):
    """
    Process and sync calendar events from extracted data.

    Args:
        extraction: Dict representation of ExtractionResult
        journal_entry_id: ID of the journal entry
        user_id: User ID owning the entry
    """
    print(f"DEBUG: Starting process_calendar_events_from_extraction for journal_entry_id: {journal_entry_id}")
    # Convert dict back to ExtractionResult
    extraction_result = ExtractionResult(**extraction)
    
    # For now, just print the events
    for event in extraction_result.events:
        print(f"EVENT: {event.title}, Datetime: {event.datetime}, Location: {event.location}")