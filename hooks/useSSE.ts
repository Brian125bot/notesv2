"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { db } from "@/lib/indexeddb";
import { resolveConflict } from "@/lib/sync/conflictResolver";
import type { Note } from "@/types";
import { toast } from "sonner";

interface SSEMessage {
  event: string;
  data: unknown;
}

interface UseSSEOptions {
  onNoteCreated?: (note: Note) => void;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
  onSyncComplete?: () => void;
}

/**
 * Hook for managing Server-Sent Events connection
 * Handles real-time updates from the server
 */
export function useSSE({
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
  onSyncComplete,
}: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 10;
  const RECONNECT_DELAY_BASE = 1000; // Start with 1 second

  // Handle incoming SSE messages
  const handleMessage = useCallback(
    async (event: MessageEvent) => {
      setLastEventTime(new Date());

      try {
        const data = JSON.parse(event.data);

        switch (event.type) {
          case "connected":
            console.log("SSE connected:", data);
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
            break;

          case "ping":
            // Heartbeat received, connection is alive
            break;

          case "note_created":
            await handleNoteCreated(data.note as Note);
            onNoteCreated?.(data.note as Note);
            break;

          case "note_updated":
            await handleNoteUpdated(data.note as Note);
            onNoteUpdated?.(data.note as Note);
            break;

          case "note_deleted":
            await handleNoteDeleted(data.noteId as string);
            onNoteDeleted?.(data.noteId as string);
            break;

          case "sync_complete":
            onSyncComplete?.();
            break;

          default:
            console.log("Unknown SSE event:", event.type, data);
        }
      } catch (error) {
        console.error("Failed to parse SSE message:", error);
      }
    },
    [onNoteCreated, onNoteUpdated, onNoteDeleted, onSyncComplete]
  );

  // Handle note created from server
  const handleNoteCreated = async (serverNote: Note) => {
    const localNote = await db.getNote(serverNote.id);

    if (localNote) {
      // Note already exists locally, check for conflicts
      const result = resolveConflict(localNote, serverNote);
      if (result.winner === "server") {
        await db.saveNote({ ...serverNote, syncStatus: "synced" });
        toast.info("Note updated from another device");
      }
    } else {
      // New note from server
      await db.saveNote({ ...serverNote, syncStatus: "synced" });
    }
  };

  // Handle note updated from server
  const handleNoteUpdated = async (serverNote: Note) => {
    const localNote = await db.getNote(serverNote.id);
    const result = resolveConflict(localNote, serverNote);

    if (result.winner === "server") {
      await db.saveNote({ ...serverNote, syncStatus: "synced" });

      // Show toast only if note was significantly different
      if (localNote && hasMeaningfulChanges(localNote, serverNote)) {
        toast.info("Note updated from another device");
      }
    }
  };

  // Handle note deleted from server
  const handleNoteDeleted = async (noteId: string) => {
    const localNote = await db.getNote(noteId);

    if (localNote?.syncStatus === "pending") {
      // Local has pending changes, don't delete yet
      // It will be recreated on next sync
      return;
    }

    await db.deleteNote(noteId);
    toast.info("Note deleted from another device");
  };

  // Check if notes have meaningful differences
  const hasMeaningfulChanges = (local: Note, server: Note): boolean => {
    return (
      local.title !== server.title ||
      local.content !== server.content ||
      local.color !== server.color ||
      local.isPinned !== server.isPinned ||
      local.isArchived !== server.isArchived
    );
  };

  // Connect to SSE endpoint
  const connect = useCallback(() => {
    if (eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("/api/sse");
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE connection opened");
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = handleMessage;

      // Handle specific event types
      eventSource.addEventListener("connected", handleMessage);
      eventSource.addEventListener("ping", handleMessage);
      eventSource.addEventListener("note_created", handleMessage);
      eventSource.addEventListener("note_updated", handleMessage);
      eventSource.addEventListener("note_deleted", handleMessage);
      eventSource.addEventListener("sync_complete", handleMessage);

      eventSource.onerror = (error) => {
        console.error("SSE error:", error);
        setIsConnected(false);
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay =
            RECONNECT_DELAY_BASE *
            Math.pow(2, reconnectAttemptsRef.current);
          reconnectAttemptsRef.current++;

          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error("Max SSE reconnection attempts reached");
          toast.error("Lost connection to server. Please refresh.");
        }
      };
    } catch (error) {
      console.error("Failed to connect SSE:", error);
    }
  }, [handleMessage]);

  // Disconnect from SSE endpoint
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsConnected(false);
  }, []);

  // Connect when mounted
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Reconnect when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isConnected, connect]);

  return {
    isConnected,
    lastEventTime,
    connect,
    disconnect,
  };
}
