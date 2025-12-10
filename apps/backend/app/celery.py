# Celery app instance and task configurations
from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "total_recall_backend",
    broker=settings.valkey_url,
    backend=settings.valkey_url,
    include=["app.tasks.ai_tasks"]
)

# Optional configurations
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)