"use client";

import { Pin, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NOTE_COLORS, type NoteColor } from "@/types";

interface SearchFiltersProps {
  filters: {
    color: string;
    archived: boolean;
    pinned: boolean;
  };
  onChange: (filters: { color: string; archived: boolean; pinned: boolean }) => void;
}

const COLORS: NoteColor[] = [
  "white",
  "yellow",
  "orange",
  "red",
  "green",
  "teal",
  "blue",
  "purple",
  "pink",
  "gray",
];

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const toggleColor = (color: string) => {
    onChange({
      ...filters,
      color: filters.color === color ? "" : color,
    });
  };

  const togglePinned = () => {
    onChange({ ...filters, pinned: !filters.pinned });
  };

  const toggleArchived = () => {
    onChange({ ...filters, archived: !filters.archived });
  };

  const clearFilters = () => {
    onChange({ color: "", archived: false, pinned: false });
  };

  const hasActiveFilters = filters.color || filters.pinned || filters.archived;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Color Filter */}
      <div className="mb-4">
        <span className="text-sm font-medium text-gray-700 mb-2 block">Color</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                NOTE_COLORS[color].bg
              } ${filters.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-105"}`}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.pinned ? "default" : "outline"}
          size="sm"
          className={filters.pinned ? "bg-amber-500 hover:bg-amber-600" : ""}
          onClick={togglePinned}
        >
          <Pin className="h-4 w-4 mr-1" />
          Pinned
        </Button>
        <Button
          variant={filters.archived ? "default" : "outline"}
          size="sm"
          className={filters.archived ? "bg-gray-600 hover:bg-gray-700" : ""}
          onClick={toggleArchived}
        >
          <Archive className="h-4 w-4 mr-1" />
          Archived
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-500">
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
