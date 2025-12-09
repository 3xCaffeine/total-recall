"""
FastAPI dependencies for authentication and database access.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.database import get_auth_db
from app.core.config import get_settings
from app.core.security import verify_session_token
from app.schemas.user import CurrentUser

settings = get_settings()

def get_session_token(request: Request) -> Optional[str]:
    """
    Extract the Better Auth session token from cookies.
    Better Auth uses a cookie named 'better-auth.session_token' by default.
    """
    return request.cookies.get(settings.session_cookie_name)


def get_current_user(
    request: Request,
    db: Session = Depends(get_auth_db),
) -> CurrentUser:
    """
    Dependency to get the current authenticated user.

    This reads the session cookie set by Better Auth on the frontend,
    validates it against the database, and returns the user data.

    Raises:
        HTTPException: 401 if not authenticated or session invalid
    """
    session_token = get_session_token(request)

    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - no session token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_data = verify_session_token(db, session_token)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return CurrentUser(**user_data)


def get_current_user_optional(
    request: Request,
    db: Session = Depends(get_auth_db),
) -> Optional[CurrentUser]:
    """
    Optional version of get_current_user.
    Returns None instead of raising an exception if not authenticated.
    """
    session_token = get_session_token(request)

    if not session_token:
        return None

    user_data = verify_session_token(db, session_token)

    if not user_data:
        return None

    return CurrentUser(**user_data)