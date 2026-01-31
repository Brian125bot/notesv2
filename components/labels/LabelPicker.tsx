"use client";

import { useState, useEffect, useCallback } from "react";
import { Tag, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { NOTE_COLORS } from "@/types";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface LabelPickerProps {
  noteId: string;
  selectedLabels: Label[];
  onLabelsChange: () => void;
}

export function LabelPicker({ noteId, selectedLabels, onLabelsChange }: LabelPickerProps) {
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLabels = useCallback(async () => {
    try {
      const response = await fetch("/api/labels");
      const data = await response.json();
      setAllLabels(data);
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen, fetchLabels]);

  const handleAddLabel = async (labelId: string) => {
    try {
      const response = await fetch("/api/notes/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, labelIds: [labelId] }),
      });

      if (response.ok) {
        onLabelsChange();
      }
    } catch (error) {
      toast.error("Failed to add label");
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      const response = await fetch(
        `/api/notes/labels?noteId=${noteId}&labelId=${labelId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onLabelsChange();
      }
    } catch (error) {
      toast.error("Failed to remove label");
    }
  };

  const selectedLabelIds = new Set(selectedLabels.map((l) => l.id));

  const availableLabels = allLabels.filter(
    (label) =>
      !selectedLabelIds.has(label.id) &&
      label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {/* Selected Labels */}
      <div className="flex flex-wrap gap-1">
        {selectedLabels.map((label) => (
          <span
            key={label.id}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${NOTE_COLORS[label.color as keyof typeof NOTE_COLORS]?.bg || NOTE_COLORS.white.bg} border`}
          >
            <span>{label.emoji}</span>
            <span className="truncate max-w-[100px]">{label.name}</span>
            <button
              onClick={() => handleRemoveLabel(label.id)}
              className="ml-1 hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Add Label Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Tag className="h-3 w-3 mr-1" />
              Add label
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <Input
                placeholder="Search labels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8"
              />

              <div className="max-h-48 overflow-y-auto space-y-1">
                {availableLabels.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">
                    {searchQuery ? "No labels found" : "All labels added"}
                  </p>
                ) : (
                  availableLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => {
                        handleAddLabel(label.id);
                        setSearchQuery("");
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-left"
                    >
                      <span>{label.emoji}</span>
                      <div
                        className={`w-3 h-3 rounded-full ${NOTE_COLORS[label.color as keyof typeof NOTE_COLORS]?.bg || NOTE_COLORS.white.bg}`}
                      />
                      <span className="text-sm truncate">{label.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
