"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type TimerMode = "timer" | "stopwatch";
export type TimerState = "idle" | "running" | "paused";

interface UseTimerOptions {
  initialDuration?: number; // in seconds
  onComplete?: () => void;
}

export function useTimer({ initialDuration = 25 * 60, onComplete }: UseTimerOptions = {}) {
  const [mode, setMode] = useState<TimerMode>("timer");
  const [state, setState] = useState<TimerState>("idle");
  const [duration, setDuration] = useState(initialDuration);
  const [timeRemaining, setTimeRemaining] = useState(initialDuration);
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (state === "running") return;
    
    setState("running");
    
    if (mode === "timer") {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setState("idle");
            onComplete?.();
            return duration;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
  }, [state, mode, duration, clearTimer, onComplete]);

  const pause = useCallback(() => {
    if (state !== "running") return;
    clearTimer();
    setState("paused");
  }, [state, clearTimer]);

  const resume = useCallback(() => {
    if (state !== "paused") return;
    start();
  }, [state, start]);

  const reset = useCallback(() => {
    clearTimer();
    setState("idle");
    setTimeRemaining(duration);
    setElapsedTime(0);
  }, [clearTimer, duration]);

  const stop = useCallback(() => {
    clearTimer();
    setState("idle");
    setTimeRemaining(duration);
    setElapsedTime(0);
  }, [clearTimer, duration]);

  const setTimerDuration = useCallback((newDuration: number) => {
    setDuration(newDuration);
    if (state === "idle") {
      setTimeRemaining(newDuration);
    }
  }, [state]);

  const toggleMode = useCallback((newMode: TimerMode) => {
    if (state !== "idle") return;
    setMode(newMode);
    setTimeRemaining(duration);
    setElapsedTime(0);
  }, [state, duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const currentTime = mode === "timer" ? timeRemaining : elapsedTime;
  const progress = mode === "timer" 
    ? ((duration - timeRemaining) / duration) * 100
    : 0;

  return {
    mode,
    state,
    currentTime,
    duration,
    progress,
    timeRemaining,
    elapsedTime,
    start,
    pause,
    resume,
    reset,
    stop,
    setTimerDuration,
    toggleMode,
  };
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}
