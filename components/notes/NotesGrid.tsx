"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { NoteCard } from "./NoteCard";
import { NoteEditor } from "./NoteEditor";
import type { Note, NoteColor, Label } from "@/types";

interface NotesGridProps {
  notes: Note[];
  showArchived?: boolean;
  onUpdate: (id: string, data: Partial<Note>) => void;
  onArchive: (id: string, isArchived: boolean) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: NoteColor) => void;
}

export function NotesGrid({
  notes,
  showArchived = false,
  onUpdate,
  onArchive,
  onPin,
  onDelete,
  onColorChange,
}: NotesGridProps) {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const { pinnedNotes, unpinnedNotes } = useMemo(() => {
    const filtered = notes.filter((n) => n.isArchived === showArchived);
    return {
      pinnedNotes: filtered.filter((n) => n.isPinned),
      unpinnedNotes: filtered.filter((n) => !n.isPinned),
    };
  }, [notes, showArchived]);

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSave = (data: Partial<Note>) => {
    if (editingNote) {
      onUpdate(editingNote.id, data);
    }
  };

  const handleClose = () => {
    setIsEditorOpen(false);
    setEditingNote(null);
  };

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
        <div className="w-32 h-32 mb-4 opacity-30">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z" />
          </svg>
        </div>
        <p className="text-lg">
          {showArchived ? "No archived notes" : "Notes you add appear here"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Pinned section */}
      {pinnedNotes.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-4">
            Pinned
          </h2>
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {pinnedNotes.map((note) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard
                  note={note}
                  onEdit={handleEdit}
                  onArchive={onArchive}
                  onPin={onPin}
                  onDelete={onDelete}
                  onColorChange={onColorChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Others section */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 px-4">
              Others
            </h2>
          )}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {unpinnedNotes.map((note) => (
              <div key={note.id} className="break-inside-avoid">
                <NoteCard
                  note={note}
                  onEdit={handleEdit}
                  onArchive={onArchive}
                  onPin={onPin}
                  onDelete={onDelete}
                  onColorChange={onColorChange}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <NoteEditor
        note={editingNote}
        isOpen={isEditorOpen}
        onClose={handleClose}
        onSave={handleSave}
        onArchive={onArchive}
        onDelete={onDelete}
        onPin={onPin}
        onColorChange={onColorChange}
      />
    </>
  );
}
