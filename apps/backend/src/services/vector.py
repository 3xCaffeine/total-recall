"""Vector database service for managing embeddings and semantic search."""
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai
from ..core.cosdata import CosdataClient


class VectorService:
    """Service for managing vector embeddings and semantic search."""

    def __init__(self, cosdata_client: CosdataClient, google_api_key: str = "", embedding_model: str = "text-embedding-004"):
        """Initialize vector service."""
        self.cosdata = cosdata_client
        self.embedding_model = embedding_model
        self.google_api_key = google_api_key
        self.client_available = False
        
        if google_api_key:
            try:
                genai.configure(api_key=google_api_key)
                self.client_available = True
            except Exception as e:
                print(f"Warning: Failed to initialize Gemini client: {e}")
                self.client_available = False

    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding for text using Google's embedding model."""
        if not self.client_available:
            raise RuntimeError("Gemini client not initialized. Set GOOGLE_API_KEY environment variable.")
        response = genai.embed_content(
            model=self.embedding_model,
            content=text,
        )
        return response["embedding"]

    async def upsert_entry(
        self,
        user_id: str,
        content: str,
        tags: Optional[List[str]] = None,
        source: str = "text",
        entry_id: Optional[str] = None,
        timestamp: Optional[str] = None,
    ) -> str:
        """Store a journal entry in the vector database."""
        if not entry_id:
            entry_id = str(uuid.uuid4())
        if not timestamp:
            timestamp = datetime.utcnow().isoformat()

        # Generate embedding
        embedding = await self.embed_text(content)

        # Upsert to Cosdata (gracefully handle if unavailable)
        payload = {
            "entry_id": entry_id,
            "user_id": user_id,
            "content": content,
            "timestamp": timestamp,
            "tags": tags or [],
            "source": source,
        }

        try:
            await self.cosdata.upsert(
                vectors=[embedding],
                payloads=[payload],
                ids=[entry_id],
            )
        except Exception as e:
            print(f"Warning: Failed to upsert to Cosdata: {e}")
            # Continue without Cosdata - entry will be stored in Postgres by caller

        return entry_id

    async def search_similar(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        score_threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Search for entries similar to query."""
        try:
            # Generate embedding for query
            query_embedding = await self.embed_text(query)

            # Search in Cosdata (gracefully handle if unavailable)
            results = await self.cosdata.search(
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
            )

            # Filter by user_id
            user_results = [
                r for r in results
                if r.get("payload", {}).get("user_id") == user_id
            ]

            return user_results
        except Exception as e:
            print(f"Warning: Cosdata search failed: {e}")
            # Return empty results if Cosdata unavailable
            return []

    async def hybrid_search(
        self,
        user_id: str,
        query: str,
        limit: int = 10,
        alpha: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining dense and sparse retrieval."""
        try:
            query_embedding = await self.embed_text(query)
            
            results = await self.cosdata.hybrid_search(
                query_vector=query_embedding,
                query_text=query,
                limit=limit,
                alpha=alpha,
            )

            # Filter by user_id
            user_results = [
                r for r in results
                if r.get("payload", {}).get("user_id") == user_id
            ]

            return user_results
        except Exception as e:
            print(f"Warning: Cosdata hybrid search failed: {e}")
            return []
        user_results = [
            r for r in results
            if r.get("payload", {}).get("user_id") == user_id
        ]

        return user_results

    async def delete_entry(self, entry_id: str) -> None:
        """Delete an entry from the vector database."""
        await self.cosdata.delete([entry_id])
