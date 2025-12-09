"""
FastAPI application instance and global configurations.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints.auth import router as auth_router
from app.core.config import get_settings

settings = get_settings()

# Create FastAPI app instance
app = FastAPI(
    title="Total Recall Backend API",
    description="Backend API for Total Recall productivity application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])


@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    Returns basic status information.
    """
    return {
        "status": "healthy",
        "service": "Total Recall Backend API",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """
    Root endpoint with basic API information.
    """
    return {
        "message": "Welcome to Total Recall Backend API",
        "docs": "/docs",
        "health": "/health"
    }