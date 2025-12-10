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

    # Google Gemini API key for AI services
    gemini_api_key: str

    # Google Gemini model name
    gemini_model: str = "gemini-2.5-flash-lite"
    
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