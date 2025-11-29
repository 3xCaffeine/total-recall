"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun } from "lucide-react";

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

  // Simple weather icon (placeholder - would be replaced with real weather API)
  const WeatherIcon = () => {
    const hour = currentTime.getHours();
    if (hour >= 6 && hour < 18) {
      return <Sun className="size-5 text-amber-500" />;
    }
    return <Cloud className="size-5 text-slate-400" />;
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
          <div className="flex items-center gap-1.5">
            <WeatherIcon />
            <span>Sunny</span>
          </div>
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
