"use client";

import { cn } from "@/lib/utils";
import { Droplets, Wind, Thermometer, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { WeatherData } from "./weather-service";

interface WeatherDisplayProps {
  weather: WeatherData | null;
  isLoading: boolean;
  className?: string;
}

export function WeatherDisplay({ weather, isLoading, className }: WeatherDisplayProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-4 text-sm text-muted-foreground", className)}>
      <div className="flex items-center gap-1.5">
        <MapPin className="size-3.5" />
        <span>{weather.location}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Thermometer className="size-3.5" />
        <span>{weather.temperature}°C</span>
      </div>

      <span>{weather.condition}</span>

      <div className="flex items-center gap-1.5">
        <Droplets className="size-3.5" />
        <span>{weather.humidity}%</span>
      </div>

      <div className="flex items-center gap-1.5">
        <Wind className="size-3.5" />
        <span>{weather.windSpeed} km/h</span>
      </div>
    </div>
  );
}
