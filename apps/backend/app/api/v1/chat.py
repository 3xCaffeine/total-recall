from fastapi import APIRouter
from app.services.chat_service import ChatService
from app.schemas.chat import ChatRequest, ChatResponse
router = APIRouter()

chat_service = ChatService()

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    response_text = await chat_service.generate_response(
        prompt=request.prompt,
        user_id=request.user_id,
        session_id=request.session_id,
        previous_chat=request.previous_chat
    )
    return ChatResponse(
        response=response_text,
        session_id=request.session_id or "default"
    )