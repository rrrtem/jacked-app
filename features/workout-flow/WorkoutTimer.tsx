"use client";

import { useEffect, useState } from "react";

interface WorkoutTimerProps {
  duration: number; // seconds
  type: "warmup" | "rest" | "exercise";
  onComplete?: () => void;
  autoStart?: boolean;
}

export function WorkoutTimer({
  duration,
  type,
  onComplete,
  autoStart = true,
}: WorkoutTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getTypeLabel = () => {
    switch (type) {
      case "warmup":
        return "Разминка";
      case "rest":
        return "Отдых";
      case "exercise":
        return "Упражнение";
    }
  };

  return (
    <div className="text-center space-y-4">
      <div
        className={`text-supertitle ${
          type === "warmup" || type === "rest" ? "text-accent" : "text-black"
        }`}
      >
        {formatTime(timeLeft)}
      </div>
      <div className="text-body opacity-inactive">{getTypeLabel()}</div>
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-6 py-2 border border-black/10 rounded-button text-body hover:border-accent"
        >
          {isRunning ? "Пауза" : "Старт"}
        </button>
        <button
          onClick={() => {
            setTimeLeft(duration);
            setIsRunning(false);
          }}
          className="px-6 py-2 border border-black/10 rounded-button text-body hover:border-accent"
        >
          Сброс
        </button>
      </div>
    </div>
  );
}

