FROM python:3.11-slim

WORKDIR /app

# Install system deps (for asyncpg, etc.)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY src ./src

# Expose port
EXPOSE 8000

# Run app
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
