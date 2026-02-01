"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/indexeddb";
import type { Note, NoteColor, SyncAction } from "@/types";

export function useNotes(userId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  // Load notes from IndexedDB
  const loadNotes = useCallback(async () => {
    if (!userId) return;
    
    try {
      const userNotes = await db.getNotes(userId);
      setNotes(userNotes);
      
      // Count pending sync items
      const queue = await db.getSyncQueue();
      setPendingCount(queue.length);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Create note
  const createNote = useCallback(async (data: Partial<Note>): Promise<Note> => {
    const now = new Date().toISOString();
    const clientId = crypto.randomUUID();
    
    const newNote: Note = {
      id: clientId,
      userId: userId || "",
      title: data.title || "",
      content: data.content || "",
      color: data.color || "white",
      isPinned: data.isPinned || false,
      isArchived: data.isArchived || false,
      createdAt: now,
      updatedAt: now,
      clientId,
      syncStatus: "pending",
    };

    // Save to IndexedDB
    await db.saveNote(newNote);
    
    // Add to sync queue
    const action: SyncAction = {
      type: "create",
      note: newNote,
      timestamp: Date.now(),
    };
    await db.addToSyncQueue(action);

    // Update local state
    setNotes((prev) => [newNote, ...prev]);
    setPendingCount((prev) => prev + 1);

    return newNote;
  }, [userId]);

  // Update note
  const updateNote = useCallback(async (id: string, data: Partial<Note>): Promise<void> => {
    const note = await db.getNote(id);
    if (!note) return;

    const updatedNote = { ...note, ...data };
    await db.saveNote(updatedNote);

    // Add to sync queue
    const action: SyncAction = {
      type: "update",
      note: { id, ...data },
      timestamp: Date.now(),
    };
    await db.addToSyncQueue(action);

    // Update local state
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? updatedNote : n))
    );
    setPendingCount((prev) => prev + 1);
  }, []);

  // Delete note
  const deleteNote = useCallback(async (id: string): Promise<void> => {
    await db.deleteNote(id);

    // Add to sync queue
    const action: SyncAction = {
      type: "delete",
      noteId: id,
      timestamp: Date.now(),
    };
    await db.addToSyncQueue(action);

    // Update local state
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setPendingCount((prev) => prev + 1);
  }, []);

  // Archive note
  const archiveNote = useCallback(async (id: string, isArchived: boolean): Promise<void> => {
    await db.archiveNote(id, isArchived);

    // Add to sync queue
    const action: SyncAction = {
      type: "archive",
      noteId: id,
      isArchived,
      timestamp: Date.now(),
    };
    await db.addToSyncQueue(action);

    // Update local state
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isArchived } : n))
    );
    setPendingCount((prev) => prev + 1);
  }, []);

  // Pin note
  const pinNote = useCallback(async (id: string, isPinned: boolean): Promise<void> => {
    await db.pinNote(id, isPinned);

    // Add to sync queue
    const action: SyncAction = {
      type: "pin",
      noteId: id,
      isPinned,
      timestamp: Date.now(),
    };
    await db.addToSyncQueue(action);

    // Update local state - re-sort notes
    setNotes((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isPinned } : n));
      return updated.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    });
    setPendingCount((prev) => prev + 1);
  }, []);

  return {
    notes,
    isLoading,
    isOnline,
    pendingCount,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    pinNote,
    refresh: loadNotes,
  };
}
