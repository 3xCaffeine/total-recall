from contextlib import asynccontextmanager
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan - startup and shutdown."""
    # Startup
    print("🚀 Starting up Total Recall Backend...")
    
    # Check for API key
    if not settings.GOOGLE_API_KEY or settings.GOOGLE_API_KEY == "":
        print("⚠️  Warning: GOOGLE_API_KEY not set. LLM features will be disabled.")
        api_key_available = False
    else:
        api_key_available = True

    # Initialize databases
    postgres_available = False
    try:
        await PostgresConnection.init(settings.POSTGRES_URL)
        print("✓ PostgreSQL connected")
        postgres_available = True
    except Exception as e:
        print(f"⚠️  PostgreSQL connection failed: {e}")

    neo4j_available = False
    try:
        await Neo4jConnection.init(
            settings.NEO4J_URL,
            settings.NEO4J_USER,
            settings.NEO4J_PASSWORD,
        )
        print("✓ Neo4j connected")
        neo4j_available = True
    except Exception as e:
        print(f"⚠️  Neo4j connection failed: {e}")

    # Initialize Cosdata client
    cosdata_available = False
    cosdata_client = CosdataClient(
        base_url=settings.COSDATA_URL,
        collection=settings.COSDATA_COLLECTION,
        timeout=settings.COSDATA_TIMEOUT,
    )
    try:
        await cosdata_client.init()
        print("✓ Cosdata connected")
        cosdata_available = True
    except Exception as e:
        print(f"⚠️  Cosdata connection failed: {e}")

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
            print("✓ All services initialized")
        except Exception as e:
            print(f"✗ Service initialization failed: {e}")
            vector_service = None
            graph_service = None
            brain_service = None
    else:
        print("⚠️  Skipping service initialization (no API key)")

    # Register services with API routes (may be None)
    v1.set_services(brain_service, vector_service, graph_service)

    # Print status summary
    print("\n📊 Backend Status:")
    print(f"  Database Connections: {sum([postgres_available, neo4j_available, cosdata_available])}/3")
    print(f"  Services Ready: {'✓ Yes' if all([vector_service, graph_service, brain_service]) else '⚠️  Partial/No'}")
    print("🧠 Total Recall Backend is ready!\n")

    yield

    # Shutdown
    print("🛑 Shutting down Total Recall Backend...")
    if cosdata_available:
        await cosdata_client.close()
    if neo4j_available:
        await Neo4jConnection.close()
    if postgres_available:
        await PostgresConnection.close()
    print("✓ All connections closed")


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
