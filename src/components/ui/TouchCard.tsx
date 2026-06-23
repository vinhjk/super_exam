"use client";

import React from "react";

interface TouchCardProps {
  label: string; // E.g., "A", "B", "C", "D"
  content: string;
  selected?: boolean;
  status?: "correct" | "incorrect" | "neutral";
  disabled?: boolean;
  onClick?: () => void;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  label,
  content,
  selected = false,
  status = "neutral",
  disabled = false,
  onClick,
}) => {
  // Compute classes based on status and selection state
  let cardBorderClass = "border-slate-200 hover:border-slate-300";
  let cardBgClass = "bg-white";
  let labelBgClass = "bg-slate-100 text-slate-700";
  let checkIconColor = "";

  if (selected) {
    if (status === "correct") {
      cardBorderClass = "border-emerald-500 ring-2 ring-emerald-500/20";
      cardBgClass = "bg-emerald-50/50";
      labelBgClass = "bg-emerald-500 text-white";
    } else if (status === "incorrect") {
      cardBorderClass = "border-rose-500 ring-2 ring-rose-500/20";
      cardBgClass = "bg-rose-50/50";
      labelBgClass = "bg-rose-500 text-white";
    } else {
      cardBorderClass = "border-primary-500 ring-2 ring-primary-500/20";
      cardBgClass = "bg-primary-50/30";
      labelBgClass = "bg-primary-600 text-white";
    }
  } else {
    if (status === "correct") {
      cardBorderClass = "border-emerald-500";
      cardBgClass = "bg-emerald-50/20";
      labelBgClass = "bg-emerald-100 text-emerald-800";
    } else if (status === "incorrect") {
      cardBorderClass = "border-rose-300";
      cardBgClass = "bg-rose-50/10";
      labelBgClass = "bg-rose-100 text-rose-800";
    }
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`
        w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
        min-h-[56px] focus:outline-none focus:ring-2 focus:ring-primary-500/40
        ${cardBorderClass} ${cardBgClass}
        ${disabled ? "opacity-75 cursor-not-allowed" : "cursor-pointer active:scale-[0.99]"}
      `}
      style={{ touchAction: "manipulation" }}
    >
      <div
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg text-base font-semibold shrink-0 transition-colors
          ${labelBgClass}
        `}
      >
        {label}
      </div>
      <div className="flex-1 text-sm font-medium text-slate-700 leading-relaxed py-1">
        {content}
      </div>
    </button>
  );
};
