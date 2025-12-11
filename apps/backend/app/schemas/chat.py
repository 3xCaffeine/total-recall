from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    prompt: str
    user_id: str
    session_id: Optional[str] = None
    previous_chat: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
