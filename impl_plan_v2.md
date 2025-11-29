# Second Brain AI Journaling App - Implementation Plan

## 1. Executive Summary
This document outlines the technical implementation plan for the "Second Brain" AI Journaling Application. The system is designed as an active cognitive support tool that ingests user thoughts (voice/text), processes them into a "Dual-Memory" system (Associative + Structured), and allows interaction via a low-latency lifelike voice interface.

## 2. Architecture & Tech Stack

### Core Components
*   **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, ShadcnUI, `react-force-graph-3d`.
*   **Auth**: **Better Auth** (implemented in Next.js).
*   **Backend**: Python FastAPI (Async), `uv` for package management, WebSockets.
*   **AI/Cognition**: Google Gemini 2.5 Pro (Multimodal Live API) for end-to-end voice-to-voice interaction and logic.
*   **Inference (Text/RAG)**: Google Gemini (Flash/Pro) for entity extraction and text generation when voice is not active.

### Data Layer (The "Brain")
1.  **Associative Memory (Vector DB)**: **Cosdata OSS**.
    *   *Role*: Semantic search, fuzzy retrieval ("Find notes like this").
    *   *Key Feature*: Hybrid Search (Dense + Sparse) & Transactional Upserts.
2.  **Structured Memory (Graph DB)**: **Neo4j**.
    *   *Role*: Entity relationships ("How is Project X related to Person Y?").
    *   *Key Feature*: Knowledge Graph visualization.
3.  **State & Metadata (SQL)**: **PostgreSQL**.
    *   *Role*: User profiles, raw journal logs, application state.

### Audio Pipeline (No Deepgram)
*   **Transport**: WebSocket (Client <-> FastAPI <-> Gemini Live API).
*   **Flow**: Audio is streamed directly to Gemini 2.5 Pro, which handles ASR (Speech-to-Text), Reasoning, and TTS (Text-to-Speech) in a single session.

---

## 3. Database Schema Design

### A. Cosdata (Vector Store)
*   **Collection**: `journal_entries`
*   **Dimension**: 768 (assuming Gemini or standard embedding model).
*   **Payload**:
    ```json
    {
      "entry_id": "uuid",
      "user_id": "uuid",  // CRITICAL: For multi-tenancy isolation
      "content": "text_chunk",
      "timestamp": "ISO8601",
      "tags": ["tag1", "tag2"],
      "source": "voice"
    }
    ```

### B. Neo4j (Graph Store)
*   **Nodes** (All nodes must have `user_id` property for isolation):
    *   `Entry` {id, user_id, date, sentiment}
    *   `Person` {name, user_id, role}
    *   `Topic` {name, user_id, category}
    *   `Location` {name, user_id}
    *   `Task` {description, user_id, due_date, status}
*   **Relationships**:
    *   `(Entry)-[:MENTIONS]->(Person)`
    *   `(Person)-[:RELATED_TO]->(Topic)`
    *   `(Entry)-[:GENERATED]->(Task)`

### C. PostgreSQL (Relational)
*   `user`, `session`, `account`: **Managed by Better Auth** (Frontend/Next.js).
*   `entries`: `id`, `user_id` (FK), raw text, audio paths.
*   `tasks`: `id`, `user_id` (FK), synced state.

---

## 4. API Specification (FastAPI)

### A. System & Auth
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check for container orchestration. |
| `GET` | `/api/v1/users/me` | Get current user profile and settings. |

### B. Journaling (The "Feed")
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/journal` | Submit a text-based entry (triggers RAG & storage). |
| `GET` | `/api/v1/journal` | List entries with pagination (`page`, `limit`). |
| `GET` | `/api/v1/journal/{id}` | Get full entry details (transcript, audio URL, entities). |
| `DELETE` | `/api/v1/journal/{id}` | Delete an entry and clean up associated memory. |

### C. The Brain (Cognition & Retrieval)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/brain/search` | Hybrid search (Cosdata Vector + Neo4j Graph). |
| `POST` | `/api/v1/brain/chat` | Text-based RAG chat interface (streaming response). |
| `GET` | `/api/v1/brain/graph` | Fetch graph topology for 3D visualization. |
| `GET` | `/api/v1/brain/graph/node/{id}` | Get specific node details and immediate neighbors. |

### D. Tasks & Actions
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tasks` | List tasks extracted from journal entries. |
| `PATCH` | `/api/v1/tasks/{id}` | Update task status (e.g., mark complete). |
| `POST` | `/api/v1/tasks/sync` | Manually trigger Google Calendar sync. |

### E. Real-time (WebSocket)
| Endpoint | Description |
| :--- | :--- |
| `/ws/live` | **Primary Voice Pipeline**. Bi-directional stream. <br>1. Receives PCM audio from client. <br>2. Proxies to Gemini Live API. <br>3. Intercepts tool calls (e.g., `search_brain`). <br>4. Returns audio/text to client. |

---

## 5. Implementation Roadmap

### Phase 1: Infrastructure & Setup
- [ ] **Docker Environment**: 
    - Create `docker-compose.yaml` for Cosdata, Neo4j, and Postgres.
    - Create `Dockerfile` for Backend (multi-stage build using `uv`).
- [ ] **Project Scaffolding**: 
    - Set up Monorepo structure (`apps/backend`, `apps/web`).
    - Initialize Backend: `uv init` in `apps/backend`.
    - Initialize Frontend: `npx create-next-app@latest` in `apps/web`.
- [ ] **Verification Scripts**: Write Python scripts to verify connectivity to all three databases.

### Phase 2: Backend Core & Memory Systems
- [ ] **Dependency Management (`uv`)**:
    - Configure `pyproject.toml` with dependencies: `fastapi`, `uvicorn`, `google-genai`, `neo4j`, `asyncpg`, `pydantic-settings`, `python-multipart`.
    - Run `uv sync` to generate `uv.lock`.
- [ ] **FastAPI Application Structure**:
    - `app/main.py`: Entry point, lifespan manager for DB connections.
    - `app/config.py`: Environment variables using `pydantic-settings`.
    - `app/routers/`: Separate routers for `journal`, `brain`, `tasks`.
- [ ] **Auth Middleware**:
    - Implement `get_current_user` dependency.
    - Strategy: Verify Bearer Token (JWT) or check `session` table in Postgres (Shared DB access).
- [ ] **Cosdata Integration (Vector)**:
    - Implement `app/services/cosdata.py`.
    - Define `JournalEntry` schema.
    - Implement `upsert_entry(text, metadata)`: Generate embedding -> Upsert to Cosdata.
    - Implement `search_similar(query_embedding)`: Hybrid search logic.
- [ ] **Neo4j Integration (Graph)**:
    - Implement `app/services/graph.py`.
    - Create `EntityExtractor` class using Gemini Flash to parse text into Nodes/Edges.
    - Implement `sync_graph(text)`: Execute Cypher queries to merge nodes.
- [ ] **PostgreSQL Integration (SQL)**:
    - Implement `app/db/postgres.py` with `asyncpg` pool.
    - Create migration scripts (or use `alembic` if needed later) for `users`, `entries` tables.
- [ ] **RAG Orchestrator**:
    - Create `app/services/brain.py`.
    - Implement `query_brain(user_query)`:
        1. Parallel fetch: Vector Search (Cosdata) + Graph Traversal (Neo4j).
        2. Context Synthesis: Format results for LLM context window.

### Phase 3: Real-time Voice & Intelligence
- [ ] **Gemini Live Integration**:
    - Set up Google GenAI SDK.
    - Implement WebSocket proxy in FastAPI.
- [ ] **Tool Use**:
    - Define `search_memory` tool for Gemini.
    - Define `create_calendar_event` tool.
    - Handle tool execution loop within the WebSocket stream.

### Phase 4: Frontend & Visualization
- [ ] **Next.js Configuration**:
    - Configure `next.config.js` for standalone output (Docker friendly).
    - Set up `shadcn/ui` components (Button, Card, Dialog, ScrollArea).
- [ ] **Authentication (Better Auth)**:
    - Install `better-auth`.
    - Configure PostgreSQL adapter.
    - Create Sign-in/Sign-up pages.
- [ ] **Audio Recording Layer**:
    - Implement `useAudioRecorder` hook using MediaRecorder API.
    - Create `AudioWorkletProcessor` for real-time PCM streaming to WebSocket.
- [ ] **3D Graph Visualization**:
    - Create `BrainGraph` component using `react-force-graph-3d`.
    - Implement click handlers to show node details (Side panel).
- [ ] **Chat/Voice Interface**:
    - Build `VoiceMode` component with visualizer (canvas/webgl).
    - Build `TextMode` component for standard chat interaction.

---
Project Structure
second-brain/
├── .github/                   # CI/CD pipelines (GitHub Actions)
├── apps/
│   ├── backend/               # 🧠 FastAPI Service
│   │   ├── src/
│   │   │   ├── api/           # HTTP Routes (REST + WebSockets)
│   │   │   ├── core/          # Config, Security, Logging
│   │   │   ├── services/      # Business Logic (Gemini, Neo4j, Cosdata)
│   │   │   └── main.py        # Entrypoint
│   │   ├── Dockerfile         # Python Container definition
│   │   └── requirements.txt   # Python dependencies
│   │   
│   └── web/                   # 💻 Next.js Frontend
│       ├── src/
│       │   ├── app/           # App Router pages
│       │   ├── components/    # Reusable UI (Tailwind)
│       │   └── lib/           # API clients
│       └── package.json       # JS dependencies
│
├── infra/                     # 🏗 Infrastructure
│   ├── docker-compose.yaml    # The Local "Cloud"
│   └── .env.example           # Environment template
│
├── scripts/                   # 🛠 Utility Scripts
│   └── verify_brain.py        # The script we will write today
│
├── .gitignore
└── README.md 