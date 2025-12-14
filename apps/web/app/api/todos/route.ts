import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import type { CreateTodoRequest, Priority, Todo } from "@/lib/types/todo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pool = new Pool({
  connectionString: process.env.TODO_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const PRIORITY_VALUES: Priority[] = ["LOW", "MEDIUM", "HIGH"];

function normalizePriority(priority?: string): Priority {
  const value = (priority || "MEDIUM").toUpperCase();
  if (PRIORITY_VALUES.includes(value as Priority)) {
    return value as Priority;
  }
  throw new Error("Invalid priority");
}

function normalizeDueDate(dueDate?: string | null): Date | null {
  if (!dueDate) return null;
  const normalized = dueDate.includes("T") ? dueDate : `${dueDate}T00:00:00Z`;
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid due date");
  }
  return parsed;
}

function mapRowToTodo(row: any): Todo {
  return {
    id: row.id,
    user_id: row.user_id,
    task: row.task,
    priority: row.priority,
    due_date: row.due_date ? new Date(row.due_date).toISOString() : null,
    journal_entry_id: row.journal_entry_id ?? null,
    created_at: new Date(row.created_at).toISOString(),
    updated_at: new Date(row.updated_at).toISOString(),
  };
}

export async function GET() {
  if (!process.env.TODO_DATABASE_URL) {
    return NextResponse.json(
      { error: "TODO_DATABASE_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, task, priority, due_date, journal_entry_id, created_at, updated_at
       FROM todos
       ORDER BY (due_date IS NULL), due_date ASC, created_at DESC`
    );

    return NextResponse.json(rows.map(mapRowToTodo));
  } catch (error) {
    console.error("Error fetching todos", error);
    return NextResponse.json(
      { error: "Failed to load todos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.TODO_DATABASE_URL) {
    return NextResponse.json(
      { error: "TODO_DATABASE_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json() as CreateTodoRequest;

    if (!body.task || typeof body.task !== "string") {
      return NextResponse.json(
        { error: "Task is required" },
        { status: 400 }
      );
    }

    const task = body.task.trim();
    if (!task) {
      return NextResponse.json(
        { error: "Task cannot be empty" },
        { status: 400 }
      );
    }

    const priority = normalizePriority(body.priority);
    const dueDateValue = normalizeDueDate(body.due_date ?? null);
    const journalEntryId = body.journal_entry_id ?? null;
    const userId = (body.user_id || "demo-user").trim() || "demo-user";

    const insertQuery = `
      INSERT INTO todos (user_id, task, priority, due_date, journal_entry_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id, task, priority, due_date, journal_entry_id, created_at, updated_at
    `;

    const { rows } = await pool.query(insertQuery, [
      userId,
      task,
      priority,
      dueDateValue,
      journalEntryId,
    ]);

    return NextResponse.json(mapRowToTodo(rows[0]), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create todo";
    const status = message.includes("Invalid") ? 400 : 500;
    console.error("Error creating todo", error);
    return NextResponse.json({ error: message }, { status });
  }
}