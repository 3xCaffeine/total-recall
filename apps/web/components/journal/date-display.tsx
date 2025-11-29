"use client";

import { useEffect, useState } from "react";
import { useWeather } from "@/components/focus/use-weather";
import { Skeleton } from "@/components/ui/skeleton";

interface DateDisplayProps {
  date?: Date;
  showWeather?: boolean;
  mood?: string;
}

export function DateDisplay({
  date = new Date(),
  showWeather = true,
  mood,
}: DateDisplayProps) {
  const [currentTime, setCurrentTime] = useState(date);
  const { weather, isLoading } = useWeather();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-2">
      {/* Main date */}
      <h1 className="text-3xl font-light tracking-tight text-foreground">
        {formatDate(currentTime)}
      </h1>

      {/* Time and optional metadata */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>

        {showWeather && (
          <>
            {isLoading ? (
              <Skeleton className="h-4 w-24" />
            ) : weather ? (
              <span>
                {weather.temperature}°C · {weather.condition}
              </span>
            ) : null}
          </>
        )}

        {mood && (
          <div className="flex items-center gap-1.5">
            <span>{mood}</span>
          </div>
        )}
      </div>
    </div>
  );
}
