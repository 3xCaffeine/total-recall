"""
Pydantic schemas for user-related data.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None


class CurrentUser(UserBase):
    """Schema for authenticated user data."""
    id: str
    email_verified: bool = False
    
    # Google OAuth tokens for Calendar API access
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None

    class Config:
        from_attributes = True


class User(UserBase):
    """Full user schema."""
    id: str
    email_verified: bool = False

    class Config:
        from_attributes = True