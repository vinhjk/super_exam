"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";

interface TimerDisplayProps {
  secondsLeft: number;
  showWarningThreshold?: number; // threshold in seconds, e.g., 60
}

export const TimerDisplay: React.FC<TimerDisplayProps> = React.memo(({
  secondsLeft,
  showWarningThreshold = 60,
}) => {
  const isLowTime = secondsLeft <= showWarningThreshold;

  const formattedTime = useMemo(() => {
    if (secondsLeft < 0) return "00:00";
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = Math.floor(secondsLeft % 60);

    const pad = (num: number) => String(num).padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }, [secondsLeft]);

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-sm font-semibold transition-all duration-300
        ${
          isLowTime
            ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse"
            : "bg-slate-100 border-slate-200 text-slate-700"
        }
      `}
    >
      <Clock className={`w-4 h-4 ${isLowTime ? "text-rose-500" : "text-slate-500"}`} />
      <span className="tabular-nums tracking-wider">{formattedTime}</span>
    </div>
  );
});

TimerDisplay.displayName = "TimerDisplay";
