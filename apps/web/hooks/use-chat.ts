"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import type { ChatMessage, ChatRequest, ChatResponse } from "@/lib/types/chat";

function buildTranscript(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
}

export interface UseChatParams {
  userId: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sessionId?: string;
  sendMessage: (prompt: string) => Promise<void>;
  resetChat: () => void;
}

export function useChat({ userId }: UseChatParams): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetChat = useCallback(() => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsLoading(true);
      setError(null);

      const payload: ChatRequest = {
        prompt: trimmed,
        user_id: userId,
        session_id: sessionId,
        previous_chat: buildTranscript(nextMessages),
      };

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data: ChatResponse = await response.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.response,
          createdAt: new Date(),
        };

        setSessionId(data.session_id || sessionId);
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred";
        setError(errorMessage);
        toast.error(errorMessage);
        // rollback last user message on error?
      } finally {
        setIsLoading(false);
      }
    },
    [messages, sessionId, userId]
  );

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    resetChat,
  };
}
