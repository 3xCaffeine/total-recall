"""
FastAPI application instance and global configurations.
"""
from fastapi import FastAPI

# Create FastAPI app instance
app = FastAPI(
    title="Total Recall Backend API",
    description="Backend API for Total Recall productivity application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


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