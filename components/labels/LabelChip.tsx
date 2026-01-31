"use client";

import { X } from "lucide-react";
import { NOTE_COLORS } from "@/types";

interface LabelChipProps {
  id: string;
  name: string;
  color: string;
  emoji: string;
  onRemove?: () => void;
  onClick?: () => void;
  size?: "sm" | "md";
}

export function LabelChip({
  name,
  color,
  emoji,
  onRemove,
  onClick,
  size = "sm",
}: LabelChipProps) {
  const colorStyle = NOTE_COLORS[color as keyof typeof NOTE_COLORS] || NOTE_COLORS.white;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium border ${colorStyle.bg} ${sizeClasses[size]} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      <span>{emoji}</span>
      <span className="truncate max-w-[120px]">{name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-500 rounded-full p-0.5 hover:bg-white/50"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
