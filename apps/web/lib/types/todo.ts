export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Todo {
  id: number;
  user_id: string;
  task: string;
  priority: Priority;
  due_date: string | null;
  journal_entry_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTodoRequest {
  task: string;
  priority?: Priority;
  due_date?: string | null;
  journal_entry_id?: number | null;
  user_id?: string;
}