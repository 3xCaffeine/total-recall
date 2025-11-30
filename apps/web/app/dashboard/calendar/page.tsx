"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { JournalHeader } from "@/components/journal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  colorId?: string;
  status?: string;
}

// Color mapping for Google Calendar colors
const EVENT_COLORS: Record<string, string> = {
  "1": "bg-blue-500",
  "2": "bg-green-500",
  "3": "bg-purple-500",
  "4": "bg-red-500",
  "5": "bg-yellow-500",
  "6": "bg-orange-500",
  "7": "bg-cyan-500",
  "8": "bg-gray-500",
  "9": "bg-indigo-500",
  "10": "bg-emerald-500",
  "11": "bg-rose-500",
  default: "bg-primary",
};

function formatEventTime(event: CalendarEvent): string {
  const start = event.start.dateTime || event.start.date;

  if (!start) return "";

  const startDate = new Date(start);

  // All-day event
  if (event.start.date && !event.start.dateTime) {
    return "All day";
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const startTime = startDate.toLocaleTimeString("en-US", timeOptions);
  const end = event.end.dateTime || event.end.date;

  if (end) {
    const endDate = new Date(end);
    const endTime = endDate.toLocaleTimeString("en-US", timeOptions);
    return `${startTime} - ${endTime}`;
  }

  return startTime;
}

function groupEventsByDate(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const grouped = new Map<string, CalendarEvent[]>();

  events.forEach((event) => {
    const dateStr = event.start.dateTime || event.start.date;
    if (!dateStr) return;

    const date = new Date(dateStr);
    const dateKey = date.toISOString().split("T")[0];

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)!.push(event);
  });

  return grouped;
}

function formatDateHeader(dateStr: string): { day: string; weekday: string } {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.getTime() === today.getTime();
  const isTomorrow = date.getTime() === tomorrow.getTime();

  return {
    day: date.getDate().toString(),
    weekday: isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en-US", { weekday: "short" }),
  };
}

function EventCard({ event }: { event: CalendarEvent }) {
  const colorClass = EVENT_COLORS[event.colorId || "default"] || EVENT_COLORS.default;

  return (
    <div className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-start gap-3">
        <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${colorClass}`} />
        <div className="flex-1 space-y-1 min-w-0">
          <h4 className="font-medium leading-tight truncate">{event.summary || "Untitled Event"}</h4>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              {formatEventTime(event)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5 truncate">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 pt-1">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-16 w-14 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

    try {
      const response = await fetch(
        `/api/calendar/events?timeMin=${startOfMonth.toISOString()}&timeMax=${endOfMonth.toISOString()}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const groupedEvents = groupEventsByDate(events);
  const sortedDates = Array.from(groupedEvents.keys()).sort();

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-screen">
      <JournalHeader title="Calendar" />

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl mx-auto p-6">
          {/* Month Navigation */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="size-5 text-primary" />
                  <CardTitle className="text-lg">{monthYear}</CardTitle>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="size-4" />
                  </Button>
                  <Separator orientation="vertical" className="h-6 mx-1" />
                  <Button variant="ghost" size="icon" onClick={fetchEvents} disabled={loading}>
                    <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Events List */}
          <ScrollArea className="h-[calc(100vh-16rem)]">
            {loading ? (
              <CalendarSkeleton />
            ) : error ? (
              <Card className="border-destructive/50">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="size-12 text-destructive mb-4" />
                  <h3 className="font-semibold mb-2">Unable to load calendar</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">{error}</p>
                  <Button onClick={fetchEvents} variant="outline">
                    <RefreshCw className="size-4 mr-2" />
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : sortedDates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CalendarIcon className="size-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-semibold mb-2">No events this month</h3>
                  <p className="text-sm text-muted-foreground">
                    Your calendar is clear for {monthYear}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6 pr-4">
                {sortedDates.map((dateStr) => {
                  const dateInfo = formatDateHeader(dateStr);
                  const dayEvents = groupedEvents.get(dateStr) || [];

                  return (
                    <div key={dateStr} className="flex gap-4">
                      {/* Date Column */}
                      <div className="w-14 shrink-0 text-center">
                        <div className="sticky top-0 rounded-lg bg-muted/50 p-2">
                          <div className="text-2xl font-semibold">{dateInfo.day}</div>
                          <div className="text-xs text-muted-foreground">{dateInfo.weekday}</div>
                        </div>
                      </div>

                      {/* Events Column */}
                      <div className="flex-1 space-y-2 min-w-0">
                        {dayEvents.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
