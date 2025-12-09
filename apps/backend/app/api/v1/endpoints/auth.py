"""
Authentication endpoints for Better Auth integration.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.v1.dependencies import get_current_user
from app.core.database import get_auth_db
from app.schemas.user import CurrentUser
from app.services import AuthService

router = APIRouter()


@router.get("/me", response_model=CurrentUser)
async def get_current_user_info(
    current_user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """
    Get current authenticated user information.
    Requires valid Better Auth session.
    """
    return current_user


@router.post("/refresh-token")
def refresh_google_access_token(
    current_user: CurrentUser = Depends(get_current_user),
    db: Session = Depends(get_auth_db),
):
    """
    Manually refresh Google OAuth access token.
    Requires valid Better Auth session.
    """
    if not current_user.id:
        raise HTTPException(status_code=400, detail="User ID not found")

    auth_service = AuthService(db)
    new_token = auth_service.ensure_valid_google_token(current_user.id)

    if new_token:
        return {"message": "Token refreshed successfully", "access_token": new_token[:10] + "..."}
    else:
        raise HTTPException(status_code=400, detail="Failed to refresh token")
