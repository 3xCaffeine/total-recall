"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { JournalHeader } from "@/components/journal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useTodos } from "@/hooks/use-todos";
import type { Priority, Todo } from "@/lib/types/todo";

const PRIORITY_THEME: Record<Priority, { label: string; badge: string }> = {
  HIGH: {
    label: "High focus",
    badge: "bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-50 dark:border-rose-400/30",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-50 dark:border-amber-400/30",
  },
  LOW: {
    label: "Low",
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-50 dark:border-emerald-400/30",
  },
};

const DEFAULT_USER_ID = "demo-user";

function formatDate(value: string | null) {
  if (!value) return "No due date";
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function isDueSoon(value: string | null, days = 7) {
  if (!value) return false;
  const today = new Date();
  const due = new Date(value);
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= days && diff >= 0;
}

function TodoCard({ todo }: { todo: Todo }) {
  const theme = PRIORITY_THEME[todo.priority];

  return (
    <div className="rounded-xl border border-border/70 bg-card/90 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={theme.badge}>{theme.label}</Badge>
          <Badge variant="outline" className="border-dashed text-muted-foreground">
            {formatDate(todo.due_date)}
          </Badge>
          <Badge variant="outline" className="border-dashed text-muted-foreground">
            Added {formatTime(todo.created_at)}
          </Badge>
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">{todo.task}</p>
      </div>
    </div>
  );
}

function TodoSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export default function TasksPage() {
  const { todos, isLoading, fetchTodos, createTodo } = useTodos();
  const [task, setTask] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const stats = useMemo(() => {
    return {
      total: todos.length,
      high: todos.filter(t => t.priority === "HIGH").length,
      dueSoon: todos.filter(t => isDueSoon(t.due_date)).length,
    };
  }, [todos]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!task.trim()) {
      toast.error("Add a task first");
      return;
    }

    const created = await createTodo({
      task: task.trim(),
      priority,
      due_date: dueDate || null,
      user_id: DEFAULT_USER_ID,
    });

    if (created) {
      setTask("");
      setDueDate("");
      setPriority("MEDIUM");
    }
  };

  return (
    <>
      <JournalHeader title="Tasks" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid gap-4 lg:grid-cols-[420px,1fr]">
          <Card className="border-muted/60">
            <CardHeader>
              <CardTitle>Quick capture</CardTitle>
              <CardDescription>
                A calm board for what is next. Save tasks straight into the shared todo database.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="task">Task</Label>
                  <Input
                    id="task"
                    value={task}
                    onChange={event => setTask(event.target.value)}
                    placeholder="Outline a meaningful next step"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={value => setPriority(value as Priority)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due-date">Due date</Label>
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={event => setDueDate(event.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  Add task
                </Button>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{stats.total} tasks</span>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="h-full border-muted/60">
            <CardHeader className="pb-2">
              <CardTitle>Plan for today</CardTitle>
              <CardDescription>
                Mellow overlays hint urgency, native date input keeps it simple.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3 pb-4 text-sm text-muted-foreground">
                <Badge variant="outline" className="border-dashed">{stats.high} high</Badge>
                <Badge variant="outline" className="border-dashed">{stats.dueSoon} due soon</Badge>
                <Badge variant="outline" className="border-dashed">{stats.total} total</Badge>
              </div>
              <ScrollArea className="max-h-[620px] pr-4">
                <div className="space-y-3">
                  {isLoading && todos.length === 0 && (
                    <>
                      <TodoSkeleton />
                      <TodoSkeleton />
                      <TodoSkeleton />
                    </>
                  )}

                  {!isLoading && todos.length === 0 && (
                    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 text-center text-sm text-muted-foreground">
                      <p className="max-w-sm leading-relaxed">
                        Nothing here yet. Add a task with a gentle priority tint to see it glow.
                      </p>
                    </div>
                  )}

                  {todos.map(todo => (
                    <TodoCard key={todo.id} todo={todo} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
