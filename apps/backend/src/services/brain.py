"""Brain service - RAG orchestrator combining vector and graph searches."""
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from .vector import VectorService
from .graph import GraphService
import asyncio


class BrainService:
    """RAG orchestrator for semantic search and synthesis."""

    def __init__(
        self,
        vector_service: VectorService,
        graph_service: GraphService,
        google_api_key: str = "",
        model: str = "gemini-2.0-flash",
    ):
        """Initialize brain service."""
        self.vector_service = vector_service
        self.graph_service = graph_service
        self.model = model
        self.google_api_key = google_api_key
        self.client_available = False
        
        if google_api_key:
            try:
                genai.configure(api_key=google_api_key)
                self.client_available = True
            except Exception as e:
                print(f"Warning: Failed to initialize Gemini client: {e}")
                self.client = None

    async def query_brain(
        self,
        user_id: str,
        query: str,
        vector_limit: int = 10,
        include_graph: bool = True,
    ) -> Dict[str, Any]:
        """
        Query the brain using parallel vector and graph searches.
        
        Returns synthesized context and search results.
        """
        
        # Parallel searches
        vector_results, graph_results = await asyncio.gather(
            self.vector_service.search_similar(user_id, query, limit=vector_limit),
            self._search_graph(user_id, query) if include_graph else self._empty_graph_search(),
        )

        # Synthesize context for LLM
        context = self._synthesize_context(vector_results, graph_results)

        return {
            "query": query,
            "vector_results": vector_results,
            "graph_results": graph_results,
            "synthesized_context": context,
        }

    async def _search_graph(self, user_id: str, query: str) -> List[Dict[str, Any]]:
        """Search graph for relevant entities (simplified version)."""
        # In production, implement semantic entity search in Neo4j
        # For now, return empty list
        return []

    async def _empty_graph_search(self) -> List[Dict[str, Any]]:
        """Return empty graph results."""
        return []

    def _synthesize_context(
        self,
        vector_results: List[Dict[str, Any]],
        graph_results: List[Dict[str, Any]],
    ) -> str:
        """Synthesize search results into LLM context."""
        
        context_parts = []

        # Add vector search results
        if vector_results:
            context_parts.append("## Similar Entries")
            for result in vector_results:
                payload = result.get("payload", {})
                context_parts.append(f"- {payload.get('content', '')[:100]}...")

        # Add graph results
        if graph_results:
            context_parts.append("\n## Related Entities")
            for result in graph_results:
                context_parts.append(f"- {result.get('name', 'Unknown')}")

        return "\n".join(context_parts)

    async def rag_response(
        self,
        user_id: str,
        query: str,
        system_prompt: Optional[str] = None,
    ) -> str:
        """Generate a response using RAG."""
        
        if not self.client_available:
            return "Error: Gemini client not initialized. Please set GOOGLE_API_KEY."
        
        try:
            # Query brain for context
            brain_result = await self.query_brain(user_id, query)
            context = brain_result["synthesized_context"]

            # Prepare prompt with context
            if not system_prompt:
                system_prompt = "You are a helpful assistant with access to the user's past thoughts and memories."

            full_prompt = f"""
{system_prompt}

Context from memory:
{context}

User query: {query}
"""

            # Generate response
            response = genai.GenerativeModel(self.model).generate_content(full_prompt)
            return response.text
        except Exception as e:
            print(f"Warning: RAG response generation failed: {e}")
            return f"I encountered an error processing your query: {str(e)}"

    async def process_entry(
        self,
        user_id: str,
        content: str,
        source: str = "text",
    ) -> Dict[str, Any]:
        """
        Process a journal entry:
        1. Store in vector DB
        2. Extract entities and relationships
        3. Sync to graph DB
        4. Extract tasks
        """

        # Store in vector DB
        entry_id = await self.vector_service.upsert_entry(
            user_id=user_id,
            content=content,
            source=source,
        )

        # Extract entities and relationships
        entities, relationships = await self.graph_service.extract_entities_and_relationships(
            user_id, content
        )

        # Sync to graph
        if entities or relationships:
            await self.graph_service.sync_graph(user_id, entities, relationships)

        # Extract tasks
        tasks = await self.graph_service.extract_tasks(content)

        return {
            "entry_id": entry_id,
            "entities": entities,
            "relationships": relationships,
            "tasks": tasks,
        }
