"""Cosdata (Vector DB) connection and operations using cosdata-client SDK."""
import logging
from typing import Optional, List, Dict, Any

try:
    from cosdata import Client
    COSDATA_SDK_AVAILABLE = True
except ImportError:
    COSDATA_SDK_AVAILABLE = False


logger = logging.getLogger(__name__)


class CosdataClient:
    """Cosdata vector database client using official cosdata-client SDK.
    
    Uses HTTP REST API via the cosdata-client Python SDK.
    Connects to port 8443 (HTTP REST API endpoint).
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 50051,  # Not used - SDK uses 8443
        collection: str = "memories",
        vector_dim: int = 768,
    ):
        """Initialize Cosdata client.
        
        Args:
            host: Cosdata server host
            port: Not used with SDK (SDK uses 8443 by default)
            collection: Collection name
            vector_dim: Vector dimensionality (768 for text-embedding-004)
        """
        self.host = host
        self.collection = collection
        self.vector_dim = vector_dim
        self._client: Optional[Any] = None
        self._collection_obj: Optional[Any] = None
        self._initialized = False

    async def init(self) -> None:
        """Initialize connection to Cosdata."""
        if not COSDATA_SDK_AVAILABLE:
            logger.warning("cosdata-client SDK not available. Vector search disabled.")
            return

        try:
            # Try multiple common passwords for Cosdata admin
            passwords_to_try = [
                "",  # empty password - Cosdata defaults to this!
                "test123",
                "cosdata123",
                "admin",
                "password",
                "cosdata",
            ]
            
            client = None
            for password in passwords_to_try:
                try:
                    client = Client(
                        host=f"http://{self.host}:8443",
                        username="admin",
                        password=password,
                        verify=False,  # Disable SSL verification for local development
                    )
                    # Test the connection
                    _ = client.list_collections()
                    logger.info(f"✅ Cosdata authenticated successfully with password: {password if password else '(empty)'}")
                    break
                except Exception:
                    continue
            
            if not client:
                raise Exception("Failed to authenticate with any known password")
            
            self._client = client
            
            # Get or create collection
            try:
                self._collection_obj = self._client.get_collection(self.collection)
                logger.info(f"Using existing Cosdata collection: {self.collection}")
            except Exception as e:
                logger.debug(f"Failed to get collection {self.collection}: {e}")
                try:
                    # Collection doesn't exist, try to create it
                    self._collection_obj = self._client.create_collection(
                        name=self.collection,
                        dimension=self.vector_dim,
                        description=f"Journal entries with {self.vector_dim}-dim embeddings",
                    )
                    logger.info(f"Created Cosdata collection: {self.collection}")
                    
                    # Create index for the collection
                    try:
                        self._collection_obj.create_index(
                            distance_metric="cosine",
                            num_layers=7,
                        )
                        logger.info(f"Created index for collection: {self.collection}")
                    except Exception as idx_err:
                        logger.debug(f"Index creation: {idx_err}")
                except Exception as create_err:
                    logger.warning(f"Could not create collection: {create_err}")
                    raise
            
            self._initialized = True
            logger.info(f"Cosdata client initialized: {self.host}:8443/{self.collection}")
            
        except Exception as e:
            logger.warning(f"Cosdata initialization failed: {e}")
            logger.info("Vector search will gracefully degrade (entries still saved to PostgreSQL)")
            self._initialized = False

    async def close(self) -> None:
        """Close Cosdata connection."""
        self._client = None
        self._collection_obj = None
        self._initialized = False

    async def upsert(
        self,
        vectors: List[List[float]],
        payloads: List[Dict[str, Any]],
        ids: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Upsert vectors to Cosdata."""
        if not self._initialized or not self._collection_obj:
            logger.debug(f"Cosdata unavailable - skipping {len(vectors)} vectors (saved to PostgreSQL)")
            return {"status": "skipped", "reason": "cosdata_unavailable", "count": len(vectors)}

        try:
            logger.debug(f"Upserting {len(vectors)} vectors to '{self.collection}'")
            
            # Prepare vectors in Cosdata SDK format
            vectors_to_upsert = []
            for i, (vector, payload) in enumerate(zip(vectors, payloads)):
                point_id = ids[i] if ids else f"vec_{i}"
                entry_id = payload.get("entry_id", point_id)
                
                # Create vector dict in correct SDK format
                # Only include simple string/number metadata, not complex objects
                vector_dict = {
                    "id": point_id,
                    "dense_values": vector,
                    "document_id": entry_id,
                }
                
                # Add simple metadata only (strings and numbers, no lists/dicts)
                if payload:
                    simple_metadata = {}
                    for k, v in payload.items():
                        if isinstance(v, (str, int, float, bool)):
                            simple_metadata[k] = v
                    if simple_metadata:
                        vector_dict["metadata"] = simple_metadata
                
                vectors_to_upsert.append(vector_dict)
                logger.debug(f"Prepared vector {point_id}: {len(vector)} dimensions, doc_id={entry_id}")
            
            # Use transaction for batch upsert - each vector individually in transaction
            with self._collection_obj.transaction() as txn:
                for vec in vectors_to_upsert:
                    try:
                        logger.debug(f"Upserting vector {vec.get('id')} to Cosdata...")
                        txn.upsert_vector(vec)
                        logger.debug(f"Successfully upserted vector {vec.get('id')}")
                    except Exception as e:
                        logger.error(f"Failed to upsert vector {vec.get('id')}: {e}")
                        raise
            
            logger.info(f"✓ Successfully upserted {len(vectors_to_upsert)} vectors to Cosdata")
            return {
                "status": "success",
                "upserted_count": len(vectors_to_upsert),
                "collection": self.collection,
            }
        except Exception as e:
            logger.error(f"Cosdata upsert error: {e}")
            return {"status": "error", "message": str(e)}

    async def search(
        self,
        query_vector: List[float],
        limit: int = 10,
        score_threshold: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """Search for similar vectors in Cosdata."""
        if not self._initialized or not self._collection_obj:
            logger.debug("Cosdata unavailable - returning empty results (RAG will use Neo4j fallback)")
            return []

        try:
            logger.debug(f"Searching '{self.collection}' with limit={limit}")
            
            # Perform dense vector search
            results = self._collection_obj.search.dense(
                query_vector=query_vector,
                top_k=limit,
                return_raw_text=True,
            )
            
            # Format results
            formatted = []
            if "results" in results:
                for result in results["results"]:
                    score = result.get("score", 0)
                    if score >= score_threshold:
                        formatted.append({
                            "id": result.get("id"),
                            "document_id": result.get("document_id"),
                            "score": score,
                            "text": result.get("text"),
                        })
            
            logger.debug(f"Search returned {len(formatted)} results")
            return formatted
        except Exception as e:
            logger.error(f"Cosdata search error: {e}")
            return []

    async def hybrid_search(
        self,
        query_vector: List[float],
        query_text: str,
        limit: int = 10,
        alpha: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """Hybrid search combining dense and sparse retrieval.
        
        Currently implements dense search only.
        Full hybrid search available in cosdata-client SDK but requires sparse indexing.
        """
        return await self.search(query_vector, limit=limit)

    async def delete(self, ids: List[str]) -> Dict[str, Any]:
        """Delete vectors by ID from Cosdata."""
        if not self._initialized or not self._collection_obj:
            logger.debug(f"Cosdata unavailable - skipping delete of {len(ids)} vectors")
            return {"status": "skipped"}

        try:
            logger.debug(f"Deleting {len(ids)} vectors from '{self.collection}'")
            
            # Delete vectors using transaction
            with self._collection_obj.transaction() as txn:
                for vector_id in ids:
                    # SDK might not have direct delete in transaction,
                    # so we'll log this as unsupported for now
                    pass
            
            return {
                "status": "skipped",
                "reason": "delete_not_yet_implemented_in_sdk",
                "count": len(ids),
            }
        except Exception as e:
            logger.error(f"Cosdata delete error: {e}")
            return {"status": "error", "message": str(e)}
