"use client";

import { useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Square, Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CircularProgress } from "./circular-progress";
import { WeatherDisplay } from "./weather-background";
import { useTimer, formatTime, type TimerMode } from "./use-timer";
import { useWeather } from "./use-weather";

const DURATION_OPTIONS = [
  { label: "5 minutes", value: "300" },
  { label: "10 minutes", value: "600" },
  { label: "15 minutes", value: "900" },
  { label: "25 minutes", value: "1500" },
  { label: "30 minutes", value: "1800" },
  { label: "45 minutes", value: "2700" },
  { label: "60 minutes", value: "3600" },
  { label: "90 minutes", value: "5400" },
];

export function FocusTimer() {
  const timer = useTimer({
    initialDuration: 25 * 60,
    onComplete: () => {
      toast.success("Focus session complete!", {
        description: "Great job staying focused.",
      });
      try {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(() => {});
      } catch {}
    },
  });

  const { weather, isLoading: weatherLoading } = useWeather();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault();
          if (timer.state === "idle") {
            timer.start();
          } else if (timer.state === "running") {
            timer.pause();
          } else if (timer.state === "paused") {
            timer.resume();
          }
          break;
        case "Escape":
          e.preventDefault();
          timer.stop();
          break;
        case "KeyR":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            timer.reset();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [timer]);

  const handleModeChange = useCallback((value: string) => {
    timer.toggleMode(value as TimerMode);
  }, [timer]);

  const handleDurationChange = useCallback((value: string) => {
    timer.setTimerDuration(parseInt(value));
  }, [timer]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-6">
      {/* Mode Toggle */}
      <Tabs value={timer.mode} onValueChange={handleModeChange}>
        <TabsList>
          <TabsTrigger value="timer" disabled={timer.state !== "idle"}>
            Timer
          </TabsTrigger>
          <TabsTrigger value="stopwatch" disabled={timer.state !== "idle"}>
            Stopwatch
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Timer Display */}
      <CircularProgress
        progress={timer.mode === "timer" ? timer.progress : 0}
        size={280}
        strokeWidth={6}
      >
        <div className="flex flex-col items-center gap-1">
          <span className="text-5xl font-light tracking-tight tabular-nums">
            {formatTime(timer.currentTime)}
          </span>
          {timer.state !== "idle" && (
            <span className="text-sm text-muted-foreground">
              {timer.state === "running" ? "Focusing" : "Paused"}
            </span>
          )}
        </div>
      </CircularProgress>

      {/* Duration Select - only in timer mode when idle */}
      <div className="h-10 flex items-center">
        {timer.mode === "timer" && timer.state === "idle" && (
          <Select
            value={timer.duration.toString()}
            onValueChange={handleDurationChange}
          >
            <SelectTrigger className="w-40">
              <Clock className="size-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {timer.state === "idle" ? (
          <Button size="lg" onClick={timer.start}>
            <Play className="size-5 mr-2" />
            Start
          </Button>
        ) : (
          <>
            {timer.state === "running" ? (
              <Button size="lg" variant="outline" onClick={timer.pause}>
                <Pause className="size-5 mr-2" />
                Pause
              </Button>
            ) : (
              <Button size="lg" onClick={timer.resume}>
                <Play className="size-5 mr-2" />
                Resume
              </Button>
            )}
            <Button size="lg" variant="outline" onClick={timer.reset}>
              <RotateCcw className="size-5 mr-2" />
              Reset
            </Button>
            <Button size="lg" variant="destructive" onClick={timer.stop}>
              <Square className="size-5 mr-2" />
              Stop
            </Button>
          </>
        )}
      </div>

      {/* Weather Display */}
      <WeatherDisplay weather={weather} isLoading={weatherLoading} />

      {/* Keyboard Shortcuts */}
      <p className="text-xs text-muted-foreground">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Space</kbd> start/pause
        {" · "}
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd> stop
      </p>
    </div>
  );
}
