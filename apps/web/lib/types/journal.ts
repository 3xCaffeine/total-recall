// Types for journal entries
export interface JournalEntry {
  id: number;
  user_id: string;
  title?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryRequest {
  title?: string;
  content: string;
}

export interface UpdateJournalEntryRequest {
  title?: string;
  content?: string;
}

export interface JournalEntryFilters {
  skip?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
}