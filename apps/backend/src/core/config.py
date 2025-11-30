"""Configuration management using environment variables."""
import os
from pathlib import Path
from functools import lru_cache
from typing import Optional
from dotenv import load_dotenv

# Load .env file from project root (going up from apps/backend/src/core/)
project_root = Path(__file__).parent.parent.parent.parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=str(env_path))


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        # App Config
        self.APP_NAME = os.getenv("APP_NAME", "Total Recall Backend")
        self.DEBUG = os.getenv("DEBUG", "False").lower() == "true"
        self.API_V1_STR = os.getenv("API_V1_STR", "/api/v1")

        # Database URLs
        self.POSTGRES_URL = os.getenv(
            "POSTGRES_URL",
            "postgresql+asyncpg://user:password@localhost:5432/total_recall",
        )
        self.NEO4J_URL = os.getenv("NEO4J_URL", "bolt://localhost:7687")
        self.NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
        self.NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")
        # Cosdata gRPC Config (replaces HTTP)
        self.COSDATA_HOST = os.getenv("COSDATA_HOST", "localhost")
        self.COSDATA_PORT = int(os.getenv("COSDATA_PORT", "50051"))

        # AI/LLM Config
        self.GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
        self.GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
        self.GEMINI_FLASH_MODEL = os.getenv("GEMINI_FLASH_MODEL", "gemini-2.0-flash")
        self.EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-004")
        self.EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "768"))

        # Vector DB Config
        self.COSDATA_COLLECTION = os.getenv("COSDATA_COLLECTION", "journal_entries")
        self.COSDATA_VECTOR_DIM = int(os.getenv("COSDATA_VECTOR_DIM", "768"))

        # Auth
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self.ALGORITHM = os.getenv("ALGORITHM", "HS256")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
