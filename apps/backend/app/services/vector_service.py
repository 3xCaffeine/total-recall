from typing import List, Dict, Any, Optional
import re
from fastembed import TextEmbedding
from app.core.cosdata_client import get_collection 
from app.schemas.extraction import ExtractionResult

class VectorService:
    def __init__(self):
        # Initialize embedding model (adjust model based on dimension)
        self.embedding_model = TextEmbedding(model_name="thenlper/gte-base")
        # Store chunk texts for retrieval
        self.chunk_texts = {}

    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Simple text chunking by sentences with overlap."""
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        chunks = []
        current_chunk = ""

        for sentence in sentences:
            if len(current_chunk) + len(sentence) <= chunk_size:
                current_chunk += sentence + " "
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence + " "

        if current_chunk:
            chunks.append(current_chunk.strip())

        # Add overlap if needed (simple implementation)
        if overlap > 0 and len(chunks) > 1:
            overlapped = []
            for i, chunk in enumerate(chunks):
                if i > 0:
                    prev_end = chunks[i-1][-overlap:]
                    chunk = prev_end + chunk
                overlapped.append(chunk)
            chunks = overlapped

        return chunks

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of text chunks."""
        return [emb.tolist() for emb in self.embedding_model.embed(texts)]

    def upsert_vectors(self, vectors: List[Dict[str, Any]]) -> None:
        """Upsert vectors to Cosdata collection."""
        collection = get_collection()
        with collection.transaction() as txn:
            txn.batch_upsert_vectors(vectors)

    def process_journal_entry(self, journal_entry_id: int, content: str, title: Optional[str],
                            extraction: ExtractionResult, user_id: str) -> None:
        """Process journal entry: chunk, embed, and upsert vectors."""
        # Chunk the content
        chunks = self.chunk_text(content)

        # Generate embeddings
        embeddings = self.generate_embeddings(chunks)

        # Prepare vectors for upsert
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector_id = f"user_{user_id}_journal_{journal_entry_id}_chunk_{i}"
            metadata = {
                "journal_entry_id": journal_entry_id,
                "chunk_index": i,
                "title": title or "",
                "user_id": user_id,
                "extraction_entities": len(extraction.entities),
                "extraction_relationships": len(extraction.relationships),
                "extraction_todos": len(extraction.todos),
                "extraction_events": len(extraction.events),
            }
            vectors.append({
                "id": vector_id,
                "dense_values": embedding,
                "document_id": f"user_{user_id}_journal_{journal_entry_id}",
                "metadata": metadata,
                "text": chunk,  # Store original chunk for hybrid search
            })
            # Store chunk text for retrieval
            self.chunk_texts[vector_id] = chunk

        # Upsert to Cosdata
        self.upsert_vectors(vectors)

    def search(self, query: str, user_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for relevant journal entry chunks using vector similarity."""
        print("DEBUG: Starting vector_service.search")
        # Generate embedding for the query
        query_embedding = self.generate_embeddings([query])[0]
        print("DEBUG: Query embedding generated")

        # Perform dense vector search
        print("DEBUG: About to get collection")
        collection = get_collection()
        print("DEBUG: Collection obtained")
        results = collection.search.dense(
            query_vector=query_embedding,
            top_k=top_k * 2,  # Retrieve more to account for filtering
            return_raw_text=True
        )
        
        print(f"DEBUG: dense search results: {results}")
        
        # Filter results by user_id
        # filtered_results = [
        #     result for result in results['results']
        #     if result['document_id'].startswith(f"user_{user_id}_")
        # ]

        # Fetch text for results where it's null
        # for result in filtered_results:
        for result in results['results']:
            if result.get('text') is None:
                result['text'] = self.chunk_texts.get(result['id'], None)

        # Return top_k filtered results
        return results['results'][:top_k]