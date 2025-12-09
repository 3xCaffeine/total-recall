"""
Security utilities for Better Auth session verification.
This module reads and validates sessions created by Better Auth on the frontend.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.auth import User, Session as AuthSession


def verify_session_token(
    db: Session,
    session_token: str
) -> Optional[dict]:
    """
    Verify a Better Auth session token by looking it up in the auth database.

    Better Auth session cookies have format: sessionId.signature
    The token column in the database contains the sessionId.

    Args:
        db: Auth database session
        session_token: The session token from the cookie

    Returns:
        User data dict if valid, None if invalid/expired
    """
    if not session_token:
        return None

    # Extract session ID from token (first part before dot)
    session_id = session_token.split('.')[0]

    # Query the session with user data using ORM
    stmt = (
        select(AuthSession, User)
        .join(User, AuthSession.userId == User.id)
        .where(AuthSession.token == session_id)
    )

    result = db.execute(stmt)
    session_row, user_row = result.first() or (None, None)

    if not session_row or not user_row:
        return None

    # Check if session is expired
    if session_row.expiresAt < datetime.now(timezone.utc):
        return None

    user_data = {
        "id": user_row.id,
        "email": user_row.email,
        "name": user_row.name,
        "image": user_row.image,
        "email_verified": user_row.emailVerified,
    }
    return user_data