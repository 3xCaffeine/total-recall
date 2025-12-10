"""
API v1 router - aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import calendar, journal

api_router = APIRouter(prefix="/api/v1")

# Include all endpoint routers
api_router.include_router(calendar.router)
api_router.include_router(journal.router) 
