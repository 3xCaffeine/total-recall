"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import type { CreateTodoRequest, Todo } from "@/lib/types/todo";

export interface UseTodosReturn {
  todos: Todo[];
  isLoading: boolean;
  error: string | null;
  fetchTodos: () => Promise<void>;
  createTodo: (data: CreateTodoRequest) => Promise<Todo | null>;
}

export function useTodos(): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async <T>(
    url: string,
    options: RequestInit,
    successMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      if (successMessage) {
        toast.success(successMessage);
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTodos = useCallback(async (): Promise<void> => {
    const result = await handleApiCall<Todo[]>(
      "/api/todos",
      { method: "GET" }
    );

    if (result) {
      setTodos(result);
    }
  }, [handleApiCall]);

  const createTodo = useCallback(async (data: CreateTodoRequest): Promise<Todo | null> => {
    const result = await handleApiCall<Todo>(
      "/api/todos",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Task added"
    );

    if (result) {
      setTodos(prev => [result, ...prev]);
    }

    return result;
  }, [handleApiCall]);

  return {
    todos,
    isLoading,
    error,
    fetchTodos,
    createTodo,
  };
}