"""Cosdata (Vector DB) connection and operations."""
import httpx
import asyncio
from typing import Optional, List, Dict, Any


class CosdataClient:
    """Cosdata vector database client."""

    def __init__(self, base_url: str, collection: str, timeout: int = 30):
        """Initialize Cosdata client."""
        self.base_url = base_url.rstrip("/")
        self.collection = collection
        self.timeout = timeout
        self._client: Optional[httpx.AsyncClient] = None

    async def init(self) -> None:
        """Initialize async HTTP client."""
        self._client = httpx.AsyncClient(timeout=self.timeout)
        # Ensure collection exists
        await self._ensure_collection()

    async def close(self) -> None:
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()

    async def _ensure_collection(self) -> None:
        """Ensure collection exists, create if needed."""
        # For now, assume collection exists. In production, implement collection creation.
        pass

    async def upsert(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Upsert vectors with payloads using Cosdata transactions."""
        if not self._client:
            raise RuntimeError("Client not initialized. Call init() first.")

        # Step 1: Create a transaction
        txn_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions"
        txn_response = await self._client.post(txn_url, json={})
        txn_data = txn_response.json()
        txn_id = txn_data.get("transaction_id")
        
        if not txn_id:
            raise RuntimeError(f"Failed to create transaction: {txn_data}")

        # Step 2: Prepare vectors with metadata
        vectors_payload = []
        for i, (vector, payload) in enumerate(zip(vectors, payloads)):
            vectors_payload.append({
                "id": ids[i] if ids else str(i),
                "document_id": payload.get("id", ids[i] if ids else str(i)),
                "dense_values": vector,
                "metadata": payload,
            })

        # Step 3: Upsert vectors within transaction
        upsert_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions/{txn_id}/upsert"
        upsert_response = await self._client.post(upsert_url, json={"vectors": vectors_payload})
        
        # Step 4: Commit transaction
        commit_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions/{txn_id}/commit"
        commit_response = await self._client.post(commit_url, json={})
        
        return commit_response.json()

    async def search(
        self,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors."""
        if not self._client:
            raise RuntimeError("Client not initialized. Call init() first.")

        url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/search"
        
        response = await self._client.post(
            url,
            json={
                "vector": query_vector,
                "limit": limit,
                "with_payload": True,
            },
        )
        return response.json().get("result", [])

    async def hybrid_search(
        self,
        query_vector: List[float],
        query_text: str,
        limit: int = 10,
        alpha: float = 0.5,  # Weight between dense (0) and sparse (1)
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining dense and sparse retrieval."""
        # For now, implement dense search only. Sparse search can use BM25 or similar.
        return await self.search(query_vector, limit=limit)

    async def delete(self, ids: List[str]) -> Dict[str, Any]:
        """Delete vectors by ID using transaction."""
        if not self._client:
            raise RuntimeError("Client not initialized. Call init() first.")

        # Step 1: Create transaction
        txn_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions"
        txn_response = await self._client.post(txn_url, json={})
        txn_data = txn_response.json()
        txn_id = txn_data.get("transaction_id")
        
        if not txn_id:
            raise RuntimeError(f"Failed to create transaction: {txn_data}")

        # Step 2: Delete vectors within transaction
        delete_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions/{txn_id}/delete"
        delete_response = await self._client.post(delete_url, json={"ids": ids})
        
        # Step 3: Commit transaction
        commit_url = f"{self.base_url}/api/v1/vectordb/collections/{self.collection}/transactions/{txn_id}/commit"
        commit_response = await self._client.post(commit_url, json={})
        
        return commit_response.json()
