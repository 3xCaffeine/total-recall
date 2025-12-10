second-brain-monolith/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app instance and global configurations
│   ├── celery.py                # Celery app instance and task configurations
│   ├── core/                    # Shared core utilities
│   │   ├── __init__.py
│   │   ├── config.py            # Configuration settings (environment variables, constants)
│   │   ├── database.py          # Database connection managers (SQL, Neo4j, cosdata OSS)
│   │   ├── security.py          # JWT handling, password hashing
│   │   └── utils.py             # Shared helper functions (e.g., date formatting)
│   ├── api/                     # API routes (Routers)
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/       # Individual API endpoint files
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py       # Login, register
│   │   │   │   ├── journal.py    # CRUD for journal entries
│   │   │   │   └── chat.py       # WebSocket for conversational AI
│   │   │   └── dependencies.py   # FastAPI dependencies (e.g., get_current_user)
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   ├── auth_service.py      # Authentication logic
│   │   ├── journal_service.py   # Journal entry CRUD logic
│   │   ├── ai_service.py        # AI processing logic (LLM calls, extraction)
│   │   ├── vector_service.py    # cosdata OSS interactions
│   │   ├── graph_service.py     # Neo4j interactions
│   │   ├── calendar_service.py  # Google Calendar API interactions
│   │   └── chat_service.py      # Conversational AI logic (RAG)
│   ├── models/                  # SQL database models (SQLAlchemy)
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── journal_entry.py
│   ├── schemas/                 # Pydantic models for request/response validation
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── journal_entry.py
│   │   └── chat.py
│   └── tasks/                   # Celery tasks for background processing
│       ├── __init__.py
│       └── ai_tasks.py           # Tasks for AI processing (vectorization, graph updates)
├── tests/                       # Test suite
│   ├── __init__.py
│   ├── unit/
│   └── integration/
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Container configuration
├── docker-compose.yml           # For local development (app, redis, db's)
├── .env.example                # Example environment variables
├── .gitignore
└── README.md
