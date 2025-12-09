"""
SQLAlchemy models for Better Auth database tables.
These models represent the tables created by Better Auth in the auth database.
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

# Separate base for auth database models
AuthBase = declarative_base()


class User(AuthBase):
    """Better Auth User table model."""
    __tablename__ = "user"

    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    emailVerified = Column(Boolean, default=False)
    image = Column(String)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Session(AuthBase):
    """Better Auth Session table model."""
    __tablename__ = "session"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("user.id"))
    token = Column(String, unique=True, index=True)
    expiresAt = Column(DateTime)
    ipAddress = Column(String)
    userAgent = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to user
    user = relationship("User", backref="sessions")


class Account(AuthBase):
    """Better Auth Account table model for OAuth providers."""
    __tablename__ = "account"

    id = Column(String, primary_key=True)
    userId = Column(String, ForeignKey("user.id"))
    accountId = Column(String)
    providerId = Column(String)
    accessToken = Column(Text)
    refreshToken = Column(Text)
    accessTokenExpiresAt = Column(DateTime)
    refreshTokenExpiresAt = Column(DateTime)
    scope = Column(String)
    idToken = Column(Text)
    password = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to user
    user = relationship("User", backref="accounts")


class Verification(AuthBase):
    """Better Auth Verification table model."""
    __tablename__ = "verification"

    id = Column(String, primary_key=True)
    identifier = Column(String)
    value = Column(Text)
    expiresAt = Column(DateTime)
    createdAt = Column(DateTime, default=datetime.utcnow)