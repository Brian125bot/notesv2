"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NOTE_COLORS } from "@/types";

interface Label {
  id: string;
  name: string;
  color: string;
  emoji: string;
  noteCount?: number;
}

interface LabelFilterProps {
  selectedLabelId: string | null;
  onSelectLabel: (labelId: string | null) => void;
}

export function LabelFilter({ selectedLabelId, onSelectLabel }: LabelFilterProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLabels = useCallback(async () => {
    try {
      const response = await fetch("/api/labels");
      const data = await response.json();
      setLabels(data);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  if (isLoading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="py-4 text-center text-gray-400 text-sm">
        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No labels yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-1 pr-2">
        <Button
          variant={selectedLabelId === null ? "secondary" : "ghost"}
          size="sm"
          className="w-full justify-start font-normal"
          onClick={() => onSelectLabel(null)}
        >
          <span className="mr-2">📁</span>
          All notes
        </Button>

        {labels.map((label) => {
          const isSelected = selectedLabelId === label.id;
          const colorStyle = NOTE_COLORS[label.color as keyof typeof NOTE_COLORS] || NOTE_COLORS.white;

          return (
            <Button
              key={label.id}
              variant={isSelected ? "secondary" : "ghost"}
              size="sm"
              className={`w-full justify-start font-normal ${isSelected ? "bg-amber-100 text-amber-900" : ""}`}
              onClick={() => onSelectLabel(isSelected ? null : label.id)}
            >
              <span className="mr-2">{label.emoji}</span>
              <span
                className={`w-2 h-2 rounded-full mr-2 ${colorStyle.bg} border`}
              />
              <span className="flex-1 text-left truncate">{label.name}</span>
              {label.noteCount !== undefined && (
                <span className="text-xs text-gray-400 ml-2">{label.noteCount}</span>
              )}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
