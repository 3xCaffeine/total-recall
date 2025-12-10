from typing import List, Dict, Any, Optional
import re
from fastembed import TextEmbedding
from app.core.cosdata_client import get_collection 
from app.schemas.extraction import ExtractionResult

class VectorService:
    def __init__(self):
        # Initialize embedding model (adjust model based on dimension)
        self.embedding_model = TextEmbedding(model_name="thenlper/gte-base")

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
        return list(self.embedding_model.embed(texts))

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
            vector_id = f"journal_{journal_entry_id}_chunk_{i}"
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
                "dense_values": embedding.tolist(),
                "document_id": f"journal_{journal_entry_id}",
                "metadata": metadata,
                "text": chunk,  # Store original chunk for hybrid search
            })

        # Upsert to Cosdata
        self.upsert_vectors(vectors)