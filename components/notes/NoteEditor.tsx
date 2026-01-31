"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pin, Palette, Archive, Trash2, X, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LabelPicker } from "@/components/labels/LabelPicker";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { Note, NoteColor } from "@/types";
import { NOTE_COLORS } from "@/types";

interface Label {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface NoteEditorProps {
  note?: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Note>) => void;
  onArchive?: (id: string, isArchived: boolean) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onColorChange?: (id: string, color: NoteColor) => void;
}

const COLOR_OPTIONS: NoteColor[] = [
  "white", "red", "orange", "yellow", "green",
  "teal", "blue", "darkblue", "purple", "pink", "brown", "gray",
];

export function NoteEditor({
  note,
  isOpen,
  onClose,
  onSave,
  onArchive,
  onDelete,
  onPin,
  onColorChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [color, setColor] = useState<NoteColor>("white");
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [labels, setLabels] = useState<Label[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = !!note;
  const colors = NOTE_COLORS[color];

  // Fetch note labels
  const fetchLabels = useCallback(async () => {
    if (!note?.id) return;
    try {
      const response = await fetch(`/api/notes/labels?noteId=${note.id}`);
      if (response.ok) {
        const data = await response.json();
        setLabels(data);
      }
    } catch (error) {
      console.error("Failed to fetch labels:", error);
    }
  }, [note?.id]);

  // Load note data
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color);
      setIsPinned(note.isPinned);
      setIsArchived(note.isArchived);
      fetchLabels();
    } else {
      setTitle("");
      setContent("");
      setColor("white");
      setIsPinned(false);
      setIsArchived(false);
      setLabels([]);
    }
  }, [note, isOpen, fetchLabels]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Auto-save for editing
  const handleAutoSave = useCallback(async (data: Partial<Note>) => {
    if (isEditing && note) {
      await onSave({ id: note.id, ...data });
    }
  }, [isEditing, note, onSave]);

  const { saveStatus, triggerSave } = useAutoSave({
    onSave: handleAutoSave,
    delay: 1500,
  });

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (isEditing) {
      triggerSave({ title: value });
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (isEditing) {
      triggerSave({ content: value });
    }
  };

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      onClose();
      return;
    }

    onSave({
      title,
      content,
      color,
      isPinned,
      isArchived,
    });
    onClose();
  };

  const handleColorChange = (newColor: NoteColor) => {
    setColor(newColor);
    if (isEditing && onColorChange && note) {
      onColorChange(note.id, newColor);
    }
  };

  const handlePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    if (isEditing && onPin && note) {
      onPin(note.id, newPinned);
    }
  };

  const handleArchive = () => {
    const newArchived = !isArchived;
    setIsArchived(newArchived);
    if (isEditing && onArchive && note) {
      onArchive(note.id, newArchived);
      onClose();
    }
  };

  const handleDelete = () => {
    if (isEditing && onDelete && note) {
      onDelete(note.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={handleSave} />

      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl mx-4 z-50 rounded-lg shadow-2xl ${colors.bg} ${colors.border} border dark:bg-gray-800 dark:border-gray-700`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-2 mb-3">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className={`flex-1 border-0 bg-transparent text-lg font-semibold focus-visible:ring-0 focus-visible:ring-offset-0 ${colors.text} dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            />
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isPinned ? "text-amber-500" : "text-gray-400 dark:text-gray-500"}`}
                onClick={handlePin}
              >
                <Pin className="h-4 w-4" fill={isPinned ? "currentColor" : "none"} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 dark:text-gray-500 hover:text-gray-600"
              onClick={handleSave}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <Textarea
            ref={textareaRef}
            placeholder="Take a note..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className={`w-full min-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${colors.text} dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500`}
          />

          {/* Labels */}
          {isEditing && (
            <div className="mt-4">
              <LabelPicker
                noteId={note?.id || ""}
                selectedLabels={labels}
                onLabelsChange={fetchLabels}
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1">
              {/* Color picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 dark:text-gray-400">
                    <Palette className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="grid grid-cols-4 gap-1 p-2">
                  {COLOR_OPTIONS.map((c) => (
                    <DropdownMenuItem
                      key={c}
                      className="p-1 cursor-pointer"
                      onClick={() => handleColorChange(c)}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border ${NOTE_COLORS[c].bg} ${NOTE_COLORS[c].border}`}
                      />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 dark:text-gray-400"
                    onClick={handleArchive}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-500 dark:text-gray-400 hover:text-red-600"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Auto-save indicator */}
              {isEditing && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex items-center gap-1">
                  {saveStatus === "saving" ? (
                    <>
                      <Clock className="h-3 w-3" />
                      Saving...
                    </>
                  ) : saveStatus === "saved" ? (
                    <>
                      <Check className="h-3 w-3" />
                      Saved
                    </>
                  ) : null}
                </span>
              )}
            </div>

            <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
              {isEditing ? "Done" : "Create Note"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
