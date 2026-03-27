"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseInterviewTimerReturn {
  timeRemaining: number;
  isOvertime: boolean;
  overtimeSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  elapsedSeconds: number;
}

export function useInterviewTimer(totalSeconds: number = 1800): UseInterviewTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const pausedElapsedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isRunning) return;
    startTimeRef.current = Date.now();
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current !== null) {
        const now = Date.now();
        const delta = Math.floor((now - startTimeRef.current) / 1000);
        setElapsed(pausedElapsedRef.current + delta);
      }
    }, 1000);
  }, [isRunning]);

  const pause = useCallback(() => {
    if (!isRunning) return;
    clearTimer();
    pausedElapsedRef.current = elapsed;
    startTimeRef.current = null;
    setIsRunning(false);
  }, [isRunning, elapsed, clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setElapsed(0);
    setIsRunning(false);
    startTimeRef.current = null;
    pausedElapsedRef.current = 0;
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const timeRemaining = totalSeconds - elapsed;
  const isOvertime = timeRemaining < 0;
  const overtimeSeconds = isOvertime ? Math.abs(timeRemaining) : 0;

  const absSeconds = Math.abs(timeRemaining);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = absSeconds % 60;
  const formattedTime = `${isOvertime ? "+" : ""}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return {
    timeRemaining,
    isOvertime,
    overtimeSeconds,
    formattedTime,
    isRunning,
    start,
    pause,
    reset,
    elapsedSeconds: elapsed,
  };
}
