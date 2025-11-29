"""Authentication and authorization."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import jwt
from typing import Optional

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Extract and validate JWT token from Bearer header."""
    token = credentials.credentials
    
    try:
        # In production, use proper JWT validation with your secret key
        # For now, accept any token and extract a user_id claim
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

    return {"user_id": user_id}


def create_access_token(
    user_id: str,
    expires_delta: Optional[timedelta] = None,
    secret_key: str = "your-secret-key",
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)

    to_encode = {
        "sub": user_id,
        "exp": expire,
    }
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt
