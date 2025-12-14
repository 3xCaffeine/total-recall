import asyncio
from typing import Optional
from google.genai import types
from app.core.gemini_client import get_genai_client
from app.core.config import get_settings
from app.services.vector_service import VectorService

class ChatService:
    def __init__(self):
        self.client = get_genai_client()
        self.settings = get_settings()

    def toolkit(self):
        """Define tools for function calling."""
        query_schema = types.Schema(type=types.Type.STRING, description="User's query to find relevant journal, todo, focus, or event content.")
        user_id_schema = types.Schema(type=types.Type.STRING, description="The ID of the user whose data to search.")
        top_k_schema = types.Schema(type=types.Type.INTEGER, description="Number of top results to return (default: 5).", default=5)

        parameters = types.Schema(
            type=types.Type.OBJECT,
            properties={
                "query": query_schema,
                "user_id": user_id_schema,
                "top_k": top_k_schema
            },
            required=["query", "user_id"]
        )

        vector_search_function = types.FunctionDeclaration(
            name="vector_search",
            description=(
                "Searches the user's saved journal entries, todos, focus notes, and events using vector similarity. "
                "Use this to retrieve past context before answering questions about history, plans, or follow-ups."
            ),
            parameters=parameters
        )
        return types.Tool(function_declarations=[vector_search_function])

    async def generate_response(self, prompt: str, user_id: str, session_id: Optional[str] = None, previous_chat: Optional[str] = None) -> str:
        """Generate a response using Gemini with function calling."""
        tools = self.toolkit()
        system_instruction = (
            "You are the Total Recall assistant. Use the vector_search tool to fetch context from the user's "
            "journal entries, todos, focus notes, and events before answering questions about past items, plans, "
            "or follow-ups. If search returns nothing, ask for a little more detail (e.g., dates, names, topics) "
            "and offer what you can infer—do NOT say you lack access. Summarize clearly and concisely using any "
            "retrieved snippets."
        )

        config = types.GenerateContentConfig(
            tools=[tools],
            system_instruction=system_instruction,
        )

        # Prepare contents with history
        if previous_chat:
            contents = f"Previous Conversation:\n{previous_chat}\n\nCurrent query: {prompt}"
        else:
            contents = prompt

        # Initial call to Gemini
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=self.settings.gemini_model,
            contents=contents,
            config=config,
        )

        # Find the first function call across all candidates/parts
        function_call = None
        for candidate in response.candidates or []:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in content.parts or []:
                if getattr(part, "function_call", None):
                    function_call = part.function_call
                    break
            if function_call:
                break

        if function_call:
            func_name = function_call.name
            args = function_call.args or {}
            print("DEBUG: Function call detected:", func_name, args)

            if func_name == "vector_search":
                print("DEBUG: Preparing to call vector_service.search")
                vector_service = VectorService()
                print("DEBUG: VectorService instance created")
                result = vector_service.search(
                    query=args.get("query", ""),
                    user_id=args.get("user_id", ""),
                    top_k=args.get("top_k", 5)
                )
                print(f"DEBUG: Vector search result: {result}")

                if result:
                    result_context = f"Vector search results: {result}"
                else:
                    result_context = (
                        "Vector search returned no matching entries. Ask for useful clarifications (date, names, topic) "
                        "and give best-effort guidance without saying you lack access."
                    )

                if previous_chat:
                    follow_up_prompt = (
                        f"Previous Conversation:\n{previous_chat}\n\n"
                        f"{result_context}\n\nPlease answer the user's query: {prompt}"
                    )
                else:
                    follow_up_prompt = (
                        f"{result_context}\n\nPlease answer the user's query: {prompt}"
                    )

                final_response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.settings.gemini_model,
                    contents=follow_up_prompt,
                    config=types.GenerateContentConfig(),
                )

                return final_response.text or "No response generated."

        # If no function call, return direct response
        return response.text or "No response generated."