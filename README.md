# Total Recall

An AI-powered productivity application designed to help users capture, organize, and retrieve their thoughts, tasks, and knowledge through intelligent journaling, conversational AI, and knowledge graph visualization.
## Demo Video 🎥
[Click here to watch the demo video](https://drive.google.com/file/d/1TnpLAqBhdyoaQos0Yoaz1Zjfu6_26aje/view?usp=sharing)

## 🚀 Key Features

- **AI-Enhanced Journaling**: Write journal entries and let AI automatically extract and create related tasks
- **Conversational AI Chat**: Engage in natural conversations with an AI assistant that has access to your personal knowledge base
- **Knowledge Graph**: Visualize connections between your thoughts, tasks, and calendar events
- **Task Management**: Create and manage todos, optionally linked to journal entries
- **Google Calendar Integration**: Sync with Google Calendar for seamless scheduling
- **Secure Authentication**: Google OAuth-based user authentication

## 🛠️ Technology Stack

### Backend

- **Python 3.11+** with FastAPI
- **PostgreSQL** for relational data
- **Neo4j** for graph database
- **Cosdata** for vector embeddings and semantic search
- **Redis/Valkey** for caching and Celery task queue
- **Google Gemini AI** for natural language processing
- **Google Calendar API** for calendar integration

### Frontend

- **Next.js 16** with React 19
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Cytoscape & Sigma** for graph visualization

## 📋 Prerequisites

- Docker and Docker Compose
- Node.js 18+ and npm
- Python 3.11+
- Google Cloud Project with enabled APIs (Calendar, Gemini AI)
- Google OAuth credentials

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd total-recall
```

### 2. Environment Setup

Copy the example environment files and configure your settings:

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Infra environment
cp infra/.env.example infra/.env
```

Edit the `.env` files with your configuration:

**Required Environment Variables:**

```env
# Database
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=total_recall
DATABASE_URL=postgresql://user:password@localhost:5432/total_recall
AUTH_DATABASE_URL=postgresql://user:password@localhost:5432/total_recall

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# Neo4j
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_neo4j_password

# Cosdata
COSDATA_HOST=localhost
COSDATA_PORT=50051
```

### 3. Start Infrastructure Services

```bash
cd infra
docker-compose up -d
```

This will start PostgreSQL, Neo4j, Cosdata, and Redis services.

### 4. Backend Setup

```bash
cd apps/backend

# Install dependencies (using uv for faster installs)
pip install uv
uv sync

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with documentation at `http://localhost:8000/docs`.

### 5. Frontend Setup

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1. **Sign Up/Login**: Use Google OAuth to create an account
2. **Create Journal Entries**: Write your thoughts and let AI extract actionable tasks
3. **Manage Tasks**: View and complete todos generated from your journals
4. **Chat with AI**: Ask questions about your knowledge base
5. **Explore Knowledge Graph**: Visualize connections between your data
6. **Calendar Integration**: Sync events and schedule based on your insights

## 🏗️ Project Structure

```
total-recall/
├── apps/
│   ├── backend/          # FastAPI backend application
│   │   ├── app/
│   │   │   ├── api/      # API routes
│   │   │   ├── core/     # Configuration and utilities
│   │   │   ├── models/   # Database models
│   │   │   ├── schemas/  # Pydantic schemas
│   │   │   ├── services/ # Business logic
│   │   │   └── tasks/    # Celery background tasks
│   │   └── alembic/      # Database migrations
│   └── web/              # Next.js frontend application
├── infra/                # Infrastructure configuration
│   └── docker-compose.yaml
└── README.md
```

## 🤝 Contributing

This is a hackathon project. Contributions are welcome! Please feel free to submit issues and pull requests.
