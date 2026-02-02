"use client";

import { Pin, Archive, Trash2, Palette } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NoteSyncIndicator } from "@/components/SyncStatus";
import { LabelChip } from "@/components/labels/LabelChip";
import type { Note, NoteColor, Label } from "@/types";
import { NOTE_COLORS } from "@/types";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
}

const COLOR_OPTIONS: NoteColor[] = [
  "white", "red", "orange", "yellow", "green",
  "teal", "blue", "darkblue", "purple", "pink", "brown", "gray",
];

export function NoteCard({
  note,
  onEdit,
  onArchive,
  onPin,
  onDelete,
  onColorChange,
}: NoteCardProps) {
  const colors = NOTE_COLORS[note.color] || NOTE_COLORS.white;

  return (
    <Card
      className={`group relative cursor-pointer transition-all duration-200 hover:shadow-lg ${colors.bg} ${colors.border} border dark:bg-opacity-90`}
      onClick={() => onEdit(note)}
    >
      <CardContent className="p-4 relative">
        {/* Sync indicator */}
        <NoteSyncIndicator status={note.syncStatus} />

        {/* Pin button */}
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-2 right-2 h-8 w-8 transition-opacity ${
            note.isPinned ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          } ${note.isPinned ? "text-amber-500" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"}`}
          onClick={(e) => {
            e.stopPropagation();
            onPin(note.id, !note.isPinned);
          }}
        >
          <Pin className="h-4 w-4" fill={note.isPinned ? "currentColor" : "none"} />
        </Button>

        {/* Title */}
        {note.title && (
          <h3 className={`font-semibold text-lg mb-2 pr-8 ${colors.text} dark:text-gray-100`}>
            {note.title}
          </h3>
        )}

        {/* Content */}
        {note.content && (
          <p className={`text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-10`}>
            {note.content}
          </p>
        )}

        {/* Empty state */}
        {!note.title && !note.content && (
          <p className="text-gray-400 dark:text-gray-500 italic">Empty note</p>
        )}

        {/* Labels */}
        {note.labels && note.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.labels.map((label) => (
              <LabelChip
                key={label.id}
                id={label.id}
                name={label.name}
                color={label.color}
                emoji={label.emoji}
                size="sm"
              />
            ))}
          </div>
        )}

        {/* Footer actions */}
        <div
          className="flex items-center gap-1 mt-4 transition-opacity opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        >
          {/* Color picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="grid grid-cols-4 gap-1 p-2">
              {COLOR_OPTIONS.map((color) => (
                <DropdownMenuItem
                  key={color}
                  className="p-1 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onColorChange(note.id, color);
                  }}
                >
                  <div
                    className={`w-6 h-6 rounded-full border ${NOTE_COLORS[color].bg} ${NOTE_COLORS[color].border}`}
                  />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Archive */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onArchive(note.id, !note.isArchived);
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
