"""
Pydantic schemas for user-related data.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    name: Optional[str] = None
    image: Optional[str] = None


class CurrentUser(UserBase):
    """Schema for authenticated user data."""
    id: str
    email_verified: bool = False

    class Config:
        from_attributes = True


class User(UserBase):
    """Full user schema."""
    id: str
    email_verified: bool = False

    class Config:
        from_attributes = True