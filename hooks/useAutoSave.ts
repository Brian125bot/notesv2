"use client";

import { useCallback, useRef, useState } from "react";
import type { Note } from "@/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
  onSave: (data: Partial<Note>) => Promise<void>;
  delay?: number;
}

/**
 * Hook for debounced auto-save functionality
 * Saves changes after user stops typing for a specified delay
 */
export function useAutoSave({ onSave, delay = 2000 }: UseAutoSaveOptions) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<Partial<Note> | null>(null);
  const isSavingRef = useRef(false);

  // Trigger auto-save with debounce
  const triggerSave = useCallback(
    (data: Partial<Note>) => {
      // Store the latest data
      pendingDataRef.current = data;

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set status to saving (pending)
      setSaveStatus("saving");

      // Create new timeout
      timeoutRef.current = setTimeout(async () => {
        if (isSavingRef.current || !pendingDataRef.current) return;

        isSavingRef.current = true;
        setSaveStatus("saving");

        try {
          await onSave(pendingDataRef.current);
          setSaveStatus("saved");

          // Reset to idle after showing "saved" briefly
          setTimeout(() => {
            setSaveStatus((current) =>
              current === "saved" ? "idle" : current
            );
          }, 1500);
        } catch (error) {
          console.error("Auto-save failed:", error);
          setSaveStatus("error");
        } finally {
          isSavingRef.current = false;
          pendingDataRef.current = null;
        }
      }, delay);
    },
    [onSave, delay]
  );

  // Force immediate save
  const saveNow = useCallback(async () => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Save pending data if exists
    if (pendingDataRef.current && !isSavingRef.current) {
      isSavingRef.current = true;
      setSaveStatus("saving");

      try {
        await onSave(pendingDataRef.current);
        setSaveStatus("saved");
      } catch (error) {
        console.error("Immediate save failed:", error);
        setSaveStatus("error");
      } finally {
        isSavingRef.current = false;
        pendingDataRef.current = null;
      }
    }
  }, [onSave]);

  // Cancel pending save
  const cancelSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
    setSaveStatus("idle");
  }, []);

  return {
    saveStatus,
    triggerSave,
    saveNow,
    cancelSave,
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
  };
}

/**
 * Hook for tracking note edit state
 * Combines local state with auto-save
 */
export function useNoteEditor(
  note: Note | null,
  onSave: (id: string, data: Partial<Note>) => Promise<void>
) {
  const [localTitle, setLocalTitle] = useState(note?.title || "");
  const [localContent, setLocalContent] = useState(note?.content || "");

  const handleSave = useCallback(
    async (data: Partial<Note>) => {
      if (!note) return;
      await onSave(note.id, data);
    },
    [note, onSave]
  );

  const { saveStatus, triggerSave, saveNow } = useAutoSave({
    onSave: handleSave,
    delay: 1500,
  });

  // Update local state when note changes
  useState(() => {
    setLocalTitle(note?.title || "");
    setLocalContent(note?.content || "");
  });

  const setTitle = useCallback(
    (title: string) => {
      setLocalTitle(title);
      if (note) {
        triggerSave({ title });
      }
    },
    [note, triggerSave]
  );

  const setContent = useCallback(
    (content: string) => {
      setLocalContent(content);
      if (note) {
        triggerSave({ content });
      }
    },
    [note, triggerSave]
  );

  return {
    title: localTitle,
    content: localContent,
    setTitle,
    setContent,
    saveStatus,
    saveNow,
  };
}
