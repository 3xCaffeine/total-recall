# AI processing logic (LLM calls, extraction)
import asyncio
import google.genai as genai
from google.genai import types
from app.core.gemini_client import get_genai_client
from app.core.config import get_settings
from app.schemas.extraction import ExtractionResult
from app.schemas.journal_entry import JournalEntry
from app.core.prompts import SYSTEM_PROMPT, FEW_SHOT_EXAMPLES
import json

class AIService:
    """
    Service for AI-related operations using Google GenAI.
    Handles text generation, extraction, and other AI tasks.
    """

    def __init__(self):
        self.client = get_genai_client()
        self.settings = get_settings()

    async def extract_from_journal_entry(self, entry: JournalEntry) -> ExtractionResult:
        """
        Extract structured information from a journal entry using LLM.

        Args:
            entry: The journal entry to analyze.

        Returns:
            ExtractionResult with metadata, entities, relationships, todos, and events.
        """
        system_instruction = f"{SYSTEM_PROMPT}\n\n{FEW_SHOT_EXAMPLES}"
        contents = f"Journal Entry: {entry.content}\n\nOutput:"
        
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model=self.settings.gemini_model,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_json_schema=ExtractionResult.model_json_schema(),
            ),
            contents=contents,
        )
        try:
            if not response.text:
                raise ValueError("Empty response from LLM")
            return ExtractionResult.model_validate_json(response.text)
        except ValueError as e:
            # Handle parsing errors
            raise ValueError(f"Failed to parse LLM response: {e}")
    
    