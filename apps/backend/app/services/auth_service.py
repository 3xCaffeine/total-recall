"""
Authentication service for Better Auth integration.
Handles user data retrieval and Google OAuth token management.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import requests
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.auth import User, Account


class AuthService:
    """
    Service class for handling authentication operations with Better Auth.

    Provides methods for user data retrieval, Google OAuth token management,
    and token refresh operations.
    """

    def __init__(self, db: Session, settings: Optional[Any] = None):
        """
        Initialize the auth service.

        Args:
            db: Database session for auth operations
            settings: Application settings (optional, will get from config if not provided)
        """
        self.db = db
        self.settings = settings or get_settings()

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user data and associated Google OAuth tokens from Better Auth database.

        Args:
            user_id: The user's ID

        Returns:
            Dict with user data and Google tokens if found
        """
        # Get user data
        user_stmt = select(User).where(User.id == user_id)
        user_result = self.db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            return None

        # Get Google OAuth tokens
        account_stmt = (
            select(Account)
            .where(
                Account.userId == user_id,
                Account.providerId == "google"
            )
        )
        account_result = self.db.execute(account_stmt)
        account = account_result.scalar_one_or_none()

        user_data = {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "image": user.image,
            "email_verified": user.emailVerified,
        }

        if account:
            user_data.update({
                "google_access_token": account.accessToken,
                "google_refresh_token": account.refreshToken,
                "google_token_expires_at": account.accessTokenExpiresAt,
            })

        return user_data

    def refresh_google_token(self, user_id: str) -> Optional[str]:
        """
        Refresh Google OAuth access token using refresh token.

        Args:
            user_id: The user's ID

        Returns:
            New access token if refresh successful, None otherwise
        """
        # Get current account data
        account_stmt = (
            select(Account)
            .where(
                Account.userId == user_id,
                Account.providerId == "google"
            )
        )
        account_result = self.db.execute(account_stmt)
        account = account_result.scalar_one_or_none()

        if not account or not account.refreshToken:
            return None

        # Refresh token with Google OAuth
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "client_id": self.settings.google_client_id,
            "client_secret": self.settings.google_client_secret,
            "refresh_token": account.refreshToken,
            "grant_type": "refresh_token",
        }

        try:
            response = requests.post(token_url, data=data)
            response.raise_for_status()
            token_data = response.json()

            new_access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)  # Default 1 hour

            if new_access_token:
                # Update account with new token
                account.accessToken = new_access_token
                account.accessTokenExpiresAt = datetime.utcnow() + timedelta(seconds=expires_in)
                account.updatedAt = datetime.utcnow()

                self.db.commit()
                return new_access_token

        except Exception:
            # Log error but don't expose details
            pass

        return None

    def ensure_valid_google_token(self, user_id: str) -> Optional[str]:
        """
        Ensure user has a valid Google access token, refreshing if necessary.

        Args:
            user_id: The user's ID

        Returns:
            Valid access token or None
        """
        user_data = self.get_user(user_id)
        if not user_data or not user_data.get("google_access_token"):
            return None

        # Check if token is expired or will expire soon (within 5 minutes)
        expires_at = user_data.get("google_token_expires_at")
        if expires_at and isinstance(expires_at, datetime):
            if expires_at < datetime.utcnow() + timedelta(minutes=5):
                # Token expired or expiring soon, refresh it
                return self.refresh_google_token(user_id)

        return user_data["google_access_token"]