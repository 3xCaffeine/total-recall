# API Testing Guide

Complete walkthrough for testing Total Recall backend endpoints with curl and Swagger UI.

## Prerequisites

- Docker Compose running: `docker compose up -d` in `infra/`
- All 4 services healthy: backend (8000), postgres (5432), neo4j (7687), cosdata (8443)
- Python 3.11+ for JWT token generation

---

## Method 1: Swagger UI (Easiest)

### Access the Interactive API Documentation

1. **Open in browser:**
   ```
   http://localhost:8000/docs
   ```

2. **Or ReDoc (alternative format):**
   ```
   http://localhost:8000/redoc
   ```

3. **Authenticate:**
   - Click the green "Authorize" button in top-right
   - Enter a valid JWT token (see token generation below)
   - All subsequent requests will include the `Authorization: Bearer <token>` header

4. **Test endpoints:**
   - Click on any endpoint to expand it
   - Click "Try it out"
   - Modify request body/params as needed
   - Click "Execute"
   - See response immediately below

---

## Method 2: Curl Commands (Terminal)

### Step 1: Generate a JWT Token

**PowerShell:**
```powershell
cd c:\Vinayak\Programmes\Python\total-recall\apps\backend

python -c "
import jwt
from datetime import datetime, timedelta

SECRET_KEY = 'your-secret-key-change-in-production'
ALGORITHM = 'HS256'

payload = {
    'sub': 'test-user',
    'exp': datetime.utcnow() + timedelta(hours=1)
}
token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
print(token)
" 2>$null
```

**Bash/Linux:**
```bash
cd apps/backend

python -c "
import jwt
from datetime import datetime, timedelta

SECRET_KEY = 'your-secret-key-change-in-production'
ALGORITHM = 'HS256'

payload = {
    'sub': 'test-user',
    'exp': datetime.utcnow() + timedelta(hours=1)
}
token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
print(token)
"
```

Save the token output for use in all authenticated requests:
```
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjE3NjQ0MzI5MDZ9.Kll7_f8UMR2IhBxW-UoQENlhdkuwBn6j6xuBIxiciRI
```

### Step 2: Test Each Endpoint

#### Health Check (No Auth Required)
```bash
curl http://localhost:8000/api/v1/health
```

**Expected Response (200):**
```json
{"status": "ok"}
```

---

#### Get Current User

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/users/me" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/users/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response (200):**
```json
{
  "user_id": "test-user",
  "email": null,
  "created_at": "2025-11-29T00:00:00Z"
}
```

---

#### Create Journal Entry

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

$json = @{
    content = "Had a productive meeting with the team about Q4 goals"
    tags = @("meeting", "planning")
    source = "text"
} | ConvertTo-Json

curl -X POST "http://localhost:8000/api/v1/journal" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $json
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST "http://localhost:8000/api/v1/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Had a productive meeting with the team about Q4 goals",
    "tags": ["meeting", "planning"],
    "source": "text"
  }'
```

**Expected Response (200):**
```json
{
  "entry_id": "f1371b2f-84af-40f9-b615-83b459d7f177",
  "content": "Had a productive meeting with the team about Q4 goals",
  "timestamp": "2025-11-29T15:30:00.000Z",
  "source": "text",
  "tags": ["meeting", "planning"]
}
```

---

#### List Journal Entries

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/journal" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" | ConvertFrom-Json | ConvertTo-Json -Depth 3
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

**Expected Response (200):**
```json
{
  "entries": [
    {
      "entry_id": "f1371b2f-84af-40f9-b615-83b459d7f177",
      "content": "Had a productive meeting with the team about Q4 goals",
      "timestamp": "2025-11-29T15:30:00.000Z",
      "source": "text",
      "tags": ["meeting", "planning"]
    }
  ],
  "total": 1
}
```

---

#### Get Specific Journal Entry

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$entryId = "f1371b2f-84af-40f9-b615-83b459d7f177"

curl -X GET "http://localhost:8000/api/v1/journal/$entryId" `
  -H "Authorization: Bearer $token"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"
ENTRY_ID="f1371b2f-84af-40f9-b615-83b459d7f177"

curl -X GET "http://localhost:8000/api/v1/journal/$ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "entry_id": "f1371b2f-84af-40f9-b615-83b459d7f177",
  "content": "Had a productive meeting with the team about Q4 goals",
  "timestamp": "2025-11-29T15:30:00.000Z",
  "source": "text",
  "tags": ["meeting", "planning"]
}
```

---

#### Delete Journal Entry

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$entryId = "f1371b2f-84af-40f9-b615-83b459d7f177"

curl -X DELETE "http://localhost:8000/api/v1/journal/$entryId" `
  -H "Authorization: Bearer $token"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"
ENTRY_ID="f1371b2f-84af-40f9-b615-83b459d7f177"

curl -X DELETE "http://localhost:8000/api/v1/journal/$ENTRY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (204):**
```
(No Content)
```

---

#### Search Brain (Vector + Graph Search)

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/brain/search?query=Q4%20goals" `
  -H "Authorization: Bearer $token"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/brain/search?query=Q4%20goals" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "results": [
    {
      "type": "vector",
      "score": 0.92,
      "entry_id": "f1371b2f-84af-40f9-b615-83b459d7f177",
      "content": "Had a productive meeting with the team about Q4 goals"
    }
  ]
}
```

---

#### Chat with Brain (RAG Query)

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

$json = @{
    query = "What meetings did I have about goals?"
} | ConvertTo-Json

curl -X POST "http://localhost:8000/api/v1/brain/chat" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $json
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST "http://localhost:8000/api/v1/brain/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What meetings did I have about goals?"
  }'
```

**Expected Response (200):**
```json
{
  "response": "Based on your journal entries, you had a productive meeting with the team about Q4 goals on November 29th, 2025.",
  "sources": [
    {
      "entry_id": "f1371b2f-84af-40f9-b615-83b459d7f177",
      "relevance": 0.92
    }
  ]
}
```

---

#### Query Knowledge Graph

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/brain/graph?node_id=team" `
  -H "Authorization: Bearer $token"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/brain/graph?node_id=team" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "node_id": "team",
  "label": "Person",
  "properties": {
    "name": "team"
  },
  "relationships": [
    {
      "type": "WORKED_ON",
      "target": "Q4 goals",
      "target_label": "Project"
    }
  ]
}
```

---

#### Create Task

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

$json = @{
    title = "Review Q4 roadmap"
    description = "Review and approve the Q4 product roadmap"
    priority = "high"
    due_date = "2025-12-15T17:00:00Z"
} | ConvertTo-Json

curl -X POST "http://localhost:8000/api/v1/tasks" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $json
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X POST "http://localhost:8000/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review Q4 roadmap",
    "description": "Review and approve the Q4 product roadmap",
    "priority": "high",
    "due_date": "2025-12-15T17:00:00Z"
  }'
```

**Expected Response (200):**
```json
{
  "task_id": "abc123def456",
  "title": "Review Q4 roadmap",
  "description": "Review and approve the Q4 product roadmap",
  "priority": "high",
  "due_date": "2025-12-15T17:00:00Z",
  "status": "pending",
  "created_at": "2025-11-29T15:30:00Z"
}
```

---

#### List Tasks

**PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/tasks" `
  -H "Authorization: Bearer $token"
```

**Bash:**
```bash
TOKEN="YOUR_TOKEN_HERE"

curl -X GET "http://localhost:8000/api/v1/tasks" \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "tasks": [
    {
      "task_id": "abc123def456",
      "title": "Review Q4 roadmap",
      "status": "pending",
      "priority": "high"
    }
  ],
  "total": 1
}
```

---

## Common Issues & Fixes

### 401 Unauthorized
- **Problem:** Invalid or missing token
- **Solution:** Regenerate token with the script above, ensure it's not expired
- **Check:** Token expiry is 1 hour from generation

### 500 Internal Server Error
- **Problem:** Backend service error
- **Solution:** Check logs: `docker compose logs backend`
- **Common causes:**
  - Cosdata unavailable (non-blocking, entry still saved to Postgres)
  - PostgreSQL/Neo4j connection failed
  - Invalid embedding model name

### 422 Unprocessable Entity
- **Problem:** Invalid request body format
- **Solution:** Check JSON syntax and required fields
- **Example fix:** Use `@{ key = value }` in PowerShell, not `{key: value}`

### Connection Refused
- **Problem:** Services not running
- **Solution:** `docker compose ps` to check; restart with `docker compose up -d`

---

## Quick Testing Script

### PowerShell Full Workflow

```powershell
# 1. Generate token
$token = python -c "import jwt; from datetime import datetime, timedelta; print(jwt.encode({'sub': 'test-user', 'exp': datetime.utcnow() + timedelta(hours=1)}, 'your-secret-key-change-in-production', algorithm='HS256'))"

# 2. Health check
echo "Health check:"
curl http://localhost:8000/api/v1/health

# 3. Create journal entry
echo "`nCreating journal entry:"
$entry = @{
    content = "First test entry with Gemini embeddings"
    tags = @("test", "first")
    source = "text"
} | ConvertTo-Json

$response = curl -X POST "http://localhost:8000/api/v1/journal" `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d $entry

$entry_id = ($response | ConvertFrom-Json).entry_id
echo "Entry ID: $entry_id"

# 4. List entries
echo "`nListing entries:"
curl -X GET "http://localhost:8000/api/v1/journal" `
  -H "Authorization: Bearer $token"

# 5. Search
echo "`nSearching brain:"
curl -X GET "http://localhost:8000/api/v1/brain/search?query=test" `
  -H "Authorization: Bearer $token"
```

### Bash Full Workflow

```bash
# 1. Generate token
TOKEN=$(python -c "
import jwt
from datetime import datetime, timedelta
payload = {'sub': 'test-user', 'exp': datetime.utcnow() + timedelta(hours=1)}
print(jwt.encode(payload, 'your-secret-key-change-in-production', algorithm='HS256'))
")

# 2. Health check
echo "Health check:"
curl http://localhost:8000/api/v1/health

# 3. Create journal entry
echo -e "\nCreating journal entry:"
ENTRY_ID=$(curl -s -X POST "http://localhost:8000/api/v1/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "First test entry with Gemini embeddings",
    "tags": ["test", "first"],
    "source": "text"
  }' | jq -r '.entry_id')

echo "Entry ID: $ENTRY_ID"

# 4. List entries
echo -e "\nListing entries:"
curl -s -X GET "http://localhost:8000/api/v1/journal" \
  -H "Authorization: Bearer $TOKEN" | jq .

# 5. Search
echo -e "\nSearching brain:"
curl -s -X GET "http://localhost:8000/api/v1/brain/search?query=test" \
  -H "Authorization: Bearer $TOKEN" | jq .
```

---

## Service Status

Check if all services are healthy:

```bash
docker compose ps
```

Should show:
- ✅ `total_recall_backend` — Up (port 8000)
- ✅ `total_recall_postgres` — Up (healthy)
- ✅ `total_recall_neo4j` — Up (healthy)
- ⚠️ `total_recall_cosdata` — Up (vector DB, optional)

---

## Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Backend Logs:** `docker compose logs backend -f`
- **RUN_GUIDE.md:** Complete Docker setup instructions
- **COSDATA_API_GUIDE.md:** Vector database API reference (Cosdata integration in progress)

