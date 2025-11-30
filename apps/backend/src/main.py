from contextlib import asynccontextmanager
import sys
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import get_settings
from .core.postgres import PostgresConnection
from .core.neo4j import Neo4jConnection
from .core.cosdata import CosdataClient
from .services.vector import VectorService
from .services.graph import GraphService
from .services.brain import BrainService
from .api import v1

settings = get_settings()

# Setup logging
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown."""
    # Startup - use stderr to ensure output shows in Docker logs
    sys.stderr.write("🚀 Starting up Total Recall Backend...\n")
    sys.stderr.flush()
    
    # Check for API key
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "":
        sys.stderr.write("⚠️  Warning: GOOGLE_API_KEY not set. LLM features will be disabled.\n")
        sys.stderr.flush()
        api_key_available = False
    else:
        api_key_available = True

    # Initialize databases
    postgres_available = False
    try:
        await PostgresConnection.init(settings.POSTGRES_URL)
        sys.stderr.write("✓ PostgreSQL connected\n")
        sys.stderr.flush()
        postgres_available = True
    except Exception as e:
        sys.stderr.write(f"⚠️  PostgreSQL connection failed: {e}\n")
        sys.stderr.flush()

    neo4j_available = False
    try:
        await Neo4jConnection.init(
            settings.NEO4J_URL,
            settings.NEO4J_USER,
            settings.NEO4J_PASSWORD,
        )
        sys.stderr.write("✓ Neo4j connected\n")
        sys.stderr.flush()
        neo4j_available = True
    except Exception as e:
        sys.stderr.write(f"⚠️  Neo4j connection failed: {e}\n")
        sys.stderr.flush()

    # Initialize Cosdata client with gRPC parameters
    cosdata_available = False
    cosdata_client = CosdataClient(
        host=settings.COSDATA_HOST,
        port=settings.COSDATA_PORT,
        collection=settings.COSDATA_COLLECTION,
        vector_dim=settings.COSDATA_VECTOR_DIM,
    )
    try:
        await cosdata_client.init()
        sys.stderr.write("✓✓✓ COSDATA CONNECTED ✓✓✓\n")
        sys.stderr.flush()
        cosdata_available = True
    except Exception as e:
        sys.stderr.write(f"⚠️  Cosdata connection failed: {e}\n")
        sys.stderr.flush()

    # Initialize services only if API key is available
    vector_service = None
    graph_service = None
    brain_service = None
    
    if api_key_available:
        try:
            # Pass embedding model from settings to VectorService
            vector_service = VectorService(
                cosdata_client,
                settings.GOOGLE_API_KEY,
                embedding_model=getattr(settings, 'EMBEDDING_MODEL', 'models/text-embedding-004'),
            )
            graph_service = GraphService(settings.GOOGLE_API_KEY)
            brain_service = BrainService(vector_service, graph_service, settings.GOOGLE_API_KEY)
            sys.stderr.write("✓ All services initialized\n")
            sys.stderr.flush()
        except Exception as e:
            sys.stderr.write(f"✗ Service initialization failed: {e}\n")
            sys.stderr.flush()
            vector_service = None
            graph_service = None
            brain_service = None
    else:
        sys.stderr.write("⚠️  Skipping service initialization (no API key)\n")
        sys.stderr.flush()

    # Register services with API routes (may be None)
    v1.set_services(brain_service, vector_service, graph_service)

    # Print status summary
    sys.stderr.write("\n📊 Backend Status:\n")
    sys.stderr.write(f"  Database Connections: {sum([postgres_available, neo4j_available, cosdata_available])}/3\n")
    sys.stderr.write(f"  Services Ready: {'✓ Yes' if all([vector_service, graph_service, brain_service]) else '⚠️  Partial/No'}\n")
    sys.stderr.write("🧠 Total Recall Backend is ready!\n\n")
    sys.stderr.flush()

    yield

    # Shutdown
    sys.stderr.write("🛑 Shutting down Total Recall Backend...\n")
    sys.stderr.flush()
    if cosdata_available:
        await cosdata_client.close()
    if neo4j_available:
        await Neo4jConnection.close()
    if postgres_available:
        await PostgresConnection.close()
    sys.stderr.write("✓ All connections closed\n")
    sys.stderr.flush()


app = FastAPI(
    title=settings.APP_NAME,
    description="Second Brain AI Journaling Application",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(v1.router)
