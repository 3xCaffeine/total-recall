"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { MessageSquare, Sparkles, Loader2, RefreshCw } from "lucide-react";

import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ChatClientProps {
  userId: string;
}

export function ChatClient({ userId }: ChatClientProps) {
  const { messages, isLoading, error, sessionId, sendMessage, resetChat } = useChat({ userId });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>Session</span>
          <Badge variant="secondary">{sessionId ?? "new"}</Badge>
          {error && <span className="text-destructive">{error}</span>}
        </div>
        <Button variant="ghost" size="sm" onClick={resetChat} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          New chat
        </Button>
      </div>

      <div className="rounded-xl border bg-card/60 shadow-sm">
        <ScrollArea className="h-[60vh] p-4">
          <div className="flex flex-col gap-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex items-center gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Ask me about your journal, events, or tasks.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex w-full gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-xl border p-3 text-sm shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground/70">
                    <Badge variant={message.role === "user" ? "outline" : "secondary"} className="text-[10px] uppercase">
                      {message.role === "user" ? "You" : "Assistant"}
                    </Badge>
                    <Separator orientation="vertical" className="h-3" />
                    <span>
                      {message.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-foreground">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about your notes, tasks, or schedule..."
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Powered by Gemini · Vector search aware
          </div>
          <Button type="submit" disabled={isLoading || !input.trim()} className="gap-2">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
