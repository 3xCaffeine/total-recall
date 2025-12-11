"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Video,
  Pencil,
  Trash2,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

import { JournalHeader } from "@/components/journal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
      label?: string;
    }>;
  };
}

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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: (number | null)[] = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

function formatEventTime(event: CalendarEvent): string {
  if (event.start.date && !event.start.dateTime) {
    return "All day";
  }

  const start = event.start.dateTime;
  if (!start) return "";

  const startDate = new Date(start);
  return startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimeRange(event: CalendarEvent): string {
  if (event.start.date && !event.start.dateTime) {
    // All-day event
    const start = new Date(event.start.date);
    const end = new Date(event.end.date!);
    const daysDiff = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000);
    if (daysDiff > 1) {
      const endDisplay = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDisplay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return "All day";
    }
  }

  // Timed event
  const start = event.start.dateTime;
  const end = event.end.dateTime;
  if (!start || !end) return "";

  const startDate = new Date(start);
  const endDate = new Date(end);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  if (startDateStr === endDateStr) {
    // Same day
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${startTime} – ${endTime}`;
  } else {
    // Multi-day
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startFormatted} - ${endFormatted}`;
  }
}

function getDateKey(year: number, month: number, day: number): string {
  // Format as YYYY-MM-DD without timezone conversion
  const yyyy = year.toString();
  const mm = (month + 1).toString().padStart(2, '0');
  const dd = day.toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getEventsForDate(
  events: CalendarEvent[],
  year: number,
  month: number,
  day: number
): CalendarEvent[] {
  const dateKey = getDateKey(year, month, day);
  return events.filter((event) => {
    if (event.start.date && event.end.date) {
      // All-day event: spans from start.date to end.date (exclusive)
      return dateKey >= event.start.date && dateKey < event.end.date;
    } else if (event.start.dateTime && event.end.dateTime) {
      // Timed event: spans from start date to end date (inclusive)
      const startDate = event.start.dateTime.split('T')[0];
      const endDate = event.end.dateTime.split('T')[0];
      return dateKey >= startDate && dateKey <= endDate;
    }
    return false;
  });
}

function getMeetingLink(event: CalendarEvent): string | null {
  if (event.hangoutLink) return event.hangoutLink;
  if (event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find(
      (e) => e.entryPointType === "video"
    );
    if (videoEntry) return videoEntry.uri;
  }
  return null;
}

function toLocalDateTimeString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(
    new Date().getDate()
  );

  // Event management state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    location: "",
    startDateTime: "",
    endDateTime: "",
    allDay: false,
  });

  const today = useMemo(() => new Date(), []);
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const fetchEvents = useCallback(async () => {
    setLoading(true);

    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    try {
      const response = await fetch(
        `/api/calendar/events?timeMin=${startOfMonth.toISOString()}&timeMax=${endOfMonth.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (isCurrentMonth) {
      setSelectedDate(today.getDate());
    } else {
      setSelectedDate(1);
    }
  }, [currentDate, isCurrentMonth, today]);

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const openNewEventSheet = () => {
    const selectedDateTime = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDate || 1,
      9,
      0
    );
    const endDateTime = new Date(selectedDateTime.getTime() + 60 * 60 * 1000);

    setFormData({
      summary: "",
      description: "",
      location: "",
      startDateTime: toLocalDateTimeString(selectedDateTime),
      endDateTime: toLocalDateTimeString(endDateTime),
      allDay: false,
    });
    setEditingEvent(null);
    setSheetOpen(true);
  };

  const openEditEventSheet = (event: CalendarEvent) => {
    const isAllDay = !event.start.dateTime && !!event.start.date;
    const startDate = event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start.date + "T09:00");
    const endDate = event.end.dateTime
      ? new Date(event.end.dateTime)
      : (() => {
          const end = new Date(event.end.date!);
          end.setDate(end.getDate() - 1); // Adjust for all-day end date
          return new Date(end.toISOString().split('T')[0] + "T10:00");
        })();

    setFormData({
      summary: event.summary || "",
      description: event.description || "",
      location: event.location || "",
      startDateTime: toLocalDateTimeString(startDate),
      endDateTime: toLocalDateTimeString(endDate),
      allDay: isAllDay,
    });
    setEditingEvent(event);
    setSheetOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!formData.summary.trim()) {
      toast.error("Please enter an event title");
      return;
    }

    const startDate = new Date(formData.startDateTime);
    const endDate = new Date(formData.endDateTime);

    if (startDate >= endDate) {
      toast.error("Start time must be before end time");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...(editingEvent && { eventId: editingEvent.id }),
        summary: formData.summary,
        description: formData.description,
        location: formData.location,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
        allDay: formData.allDay,
      };

      const response = await fetch("/api/calendar/events", {
        method: editingEvent ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingEvent ? "Event updated" : "Event created");
        setSheetOpen(false);
        fetchEvents();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to save event");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const response = await fetch(
        `/api/calendar/events?eventId=${eventToDelete.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast.success("Event deleted");
        setDeleteDialogOpen(false);
        setEventToDelete(null);
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch {
      toast.error("Something went wrong");
    }
  };

  const calendarDays = getCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  const selectedDateEvents = selectedDate
    ? getEventsForDate(
        events,
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDate
      )
    : [];

  const monthYear = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const selectedDateFormatted = selectedDate
    ? new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        selectedDate
      ).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col h-screen">
      <JournalHeader title="Calendar" />

      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                {monthYear}
              </h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Compact Calendar Grid */}
            <div className="select-none">
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center text-[10px] font-medium text-muted-foreground py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="aspect-square bg-background"
                      />
                    );
                  }

                  const dayEvents = getEventsForDate(
                    events,
                    currentDate.getFullYear(),
                    currentDate.getMonth(),
                    day
                  );
                  const isToday = isCurrentMonth && day === today.getDate();
                  const isSelected = day === selectedDate;
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "aspect-square bg-background flex flex-col items-center justify-center relative transition-colors",
                        "hover:bg-accent/50",
                        isSelected && "bg-accent"
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs leading-none",
                          isToday &&
                            "size-6 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-medium",
                          !isToday && "text-foreground"
                        )}
                      >
                        {day}
                      </span>
                      {hasEvents && !isToday && (
                        <div className="absolute bottom-1 flex gap-0.5">
                          {dayEvents.slice(0, 3).map((event, i) => (
                            <div
                              key={i}
                              className={cn(
                                "size-1 rounded-full",
                                EVENT_COLORS[event.colorId || "default"] ||
                                  EVENT_COLORS.default
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Header with Add Button */}
            <div className="flex items-center justify-between pt-4">
              <h3 className="font-medium">{selectedDateFormatted}</h3>
              <Button size="sm" variant="outline" onClick={openNewEventSheet}>
                <Plus className="size-4 mr-1" />
                Add event
              </Button>
            </div>

            {/* Events List */}
            <div className="space-y-2 pb-8">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 py-12 text-center">
                  No events scheduled
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={() => openEditEventSheet(event)}
                    onDelete={() => {
                      setEventToDelete(event);
                      setDeleteDialogOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </main>

      {/* Event Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <SheetTitle>
              {editingEvent ? "Edit event" : "New event"}
            </SheetTitle>
            <SheetDescription>
              {editingEvent
                ? "Update event details"
                : "Add a new event to your calendar"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="px-6 py-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="summary">Title</Label>
                <Input
                  id="summary"
                  placeholder="Event title"
                  className="border"
                  value={formData.summary}
                  onChange={(e) =>
                    setFormData({ ...formData, summary: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allDay">All day</Label>
                <Switch
                  id="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, allDay: checked })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start</Label>
                  <Input
                    id="start"
                    type={formData.allDay ? "date" : "datetime-local"}
                    className="border"
                    value={
                      formData.allDay
                        ? formData.startDateTime.split("T")[0]
                        : formData.startDateTime
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        startDateTime: formData.allDay
                          ? e.target.value + "T00:00"
                          : e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End</Label>
                  <Input
                    id="end"
                    type={formData.allDay ? "date" : "datetime-local"}
                    className="border"
                    value={
                      formData.allDay
                        ? formData.endDateTime.split("T")[0]
                        : formData.endDateTime
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        endDateTime: formData.allDay
                          ? e.target.value + "T23:59"
                          : e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Add location"
                  className="border"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Add description"
                  className="border"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveEvent}
                disabled={saving}
              >
                {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
                {editingEvent ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{eventToDelete?.summary}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EventCard({
  event,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colorClass =
    EVENT_COLORS[event.colorId || "default"] || EVENT_COLORS.default;
  const meetingLink = getMeetingLink(event);

  return (
    <div className="group rounded-lg border bg-card p-4 transition-all hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cn("mt-1.5 size-2 shrink-0 rounded-full", colorClass)} />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">
              {event.summary || "Untitled Event"}
            </h4>
            <div className="flex items-center gap-1 shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={onEdit}
                  >
                    <Pencil className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3 shrink-0" />
              {formatTimeRange(event)}
            </span>

            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}

            {meetingLink && (
              <a
                href={meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Video className="size-3 shrink-0" />
                <span className="truncate">Join meeting</span>
                <ExternalLink className="size-2.5 shrink-0" />
              </a>
            )}
          </div>

          {event.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2 pt-1">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
