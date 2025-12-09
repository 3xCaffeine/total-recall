"""
Database connection managers for main application and Better Auth databases.
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.core.config import get_settings

settings = get_settings()

# Main application database
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Better Auth database (separate from main app database)
auth_engine = create_engine(
    settings.auth_database_url,
    echo=settings.debug,
    pool_pre_ping=True,
)

AuthSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=auth_engine
)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for main application database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_auth_db() -> Generator[Session, None, None]:
    """
    Dependency for Better Auth database session.
    """
    db = AuthSessionLocal()
    try:
        yield db
    finally:
        db.close()