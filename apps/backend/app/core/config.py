"""
Configuration settings using Pydantic BaseSettings.
Loads environment variables from .env file.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    # Application settings
    app_name: str = "Total Recall Backend"
    debug: bool = False

    # Database settings (shared with Better Auth)
    auth_database_url: str
    database_url: str

    # Google OAuth settings (same credentials as frontend)
    google_client_id: str
    google_client_secret: str

    # Frontend URL for CORS
    frontend_url: str = "http://localhost:3000"

    # Session cookie name (must match Better Auth's cookie name)
    session_cookie_name: str = "better-auth.session_token"

<<<<<<< Updated upstream
=======
    # Google Gemini API key for AI services
    gemini_api_key: str

    # Google Gemini model name
    gemini_model: str = "gemini-2.5-flash-lite"

    # Valkey (Redis clone) URL for Celery
    valkey_url: str = "redis://localhost:6379/0"

    # Neo4j database URL
    neo4j_url: str = "bolt://localhost:7687"
    
    #cosdata database config
    cosdata_host: str = "http://127.0.0.1:8443"
    cosdata_username: str = "admin"
    cosdata_password: str = "admin"
    cosdata_collection_name: str = "total_recall_collection"

    # Google OAuth tokens
    google_access_token: str = ""
    google_refresh_token: str = ""
    google_token_expiry: str = ""
    
>>>>>>> Stashed changes
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    Uses LRU cache to avoid reloading settings on every call.
    """
    return Settings()