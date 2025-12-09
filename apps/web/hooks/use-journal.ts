"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import type {
  JournalEntry,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
} from "@/lib/types/journal";

export interface UseJournalReturn {
  entries: JournalEntry[];
  isLoading: boolean;
  error: string | null;
  createEntry: (data: CreateJournalEntryRequest) => Promise<JournalEntry | null>;
  updateEntry: (id: number, data: UpdateJournalEntryRequest) => Promise<JournalEntry | null>;
  deleteEntry: (id: number) => Promise<boolean>;
  fetchEntries: (skip?: number, limit?: number) => Promise<void>;
  getEntry: (id: number) => Promise<JournalEntry | null>;
}

export function useJournal(): UseJournalReturn {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
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
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createEntry = useCallback(async (data: CreateJournalEntryRequest): Promise<JournalEntry | null> => {
    const result = await handleApiCall<JournalEntry>(
      "/api/journal",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Entry saved successfully"
    );

    if (result) {
      setEntries(prev => [result, ...prev]);
    }

    return result;
  }, [handleApiCall]);

  const updateEntry = useCallback(async (id: number, data: UpdateJournalEntryRequest): Promise<JournalEntry | null> => {
    const result = await handleApiCall<JournalEntry>(
      `/api/journal/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      "Entry updated successfully"
    );

    if (result) {
      setEntries(prev => prev.map(entry => entry.id === id ? result : entry));
    }

    return result;
  }, [handleApiCall]);

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    const result = await handleApiCall<{ message: string }>(
      `/api/journal/${id}`,
      {
        method: "DELETE",
      },
      "Entry deleted successfully"
    );

    if (result) {
      setEntries(prev => prev.filter(entry => entry.id !== id));
      return true;
    }

    return false;
  }, [handleApiCall]);

  const fetchEntries = useCallback(async (skip = 0, limit = 100): Promise<void> => {
    const queryParams = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });

    const result = await handleApiCall<JournalEntry[]>(
      `/api/journal?${queryParams}`,
      {
        method: "GET",
      }
    );

    if (result) {
      setEntries(result);
    }
  }, [handleApiCall]);

  const getEntry = useCallback(async (id: number): Promise<JournalEntry | null> => {
    return handleApiCall<JournalEntry>(
      `/api/journal/${id}`,
      {
        method: "GET",
      }
    );
  }, [handleApiCall]);

  return {
    entries,
    isLoading,
    error,
    createEntry,
    updateEntry,
    deleteEntry,
    fetchEntries,
    getEntry,
  };
}