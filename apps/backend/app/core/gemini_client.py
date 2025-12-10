"""
Google GenAI client initialization and utilities.
Provides a reusable client for AI services, similar to database connections.
"""
from functools import lru_cache
import google.genai as genai

from app.core.config import get_settings


@lru_cache()
def get_genai_client() -> genai.Client:
    """
    Get cached Google GenAI client instance.
    Uses LRU cache to avoid recreating the client on every call.
    """
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)