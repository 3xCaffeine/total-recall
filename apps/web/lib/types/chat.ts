export interface ChatRequest {
  prompt: string;
  user_id: string;
  session_id?: string | null;
  previous_chat?: string | null;
}

export interface ChatResponse {
  response: string;
  session_id: string;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
}
