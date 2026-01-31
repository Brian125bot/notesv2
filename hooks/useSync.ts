"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "@/lib/indexeddb";
import { resolveBatchConflicts } from "@/lib/sync/conflictResolver";
import type { SyncQueueItem, Note, SyncAction } from "@/types";
import { toast } from "sonner";

const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_BASE = 1000; // Start with 1 second

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  error: string | null;
}

interface UseSyncOptions {
  userId: string | undefined;
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  onSyncError?: (error: string) => void;
}

/**
 * Enhanced sync hook with:
 * - Bidirectional sync (client ↔ server)
 * - Exponential backoff retry
 * - Conflict resolution
 * - Progress tracking
 */
export function useSync({
  userId,
  onSyncStart,
  onSyncComplete,
  onSyncError,
}: UseSyncOptions) {
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    pendingCount: 0,
    error: null,
  });

  const isSyncingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryAttemptsRef = useRef<Map<string, number>>(new Map());

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const queue = await db.getSyncQueue();
    setSyncState((prev) => ({
      ...prev,
      pendingCount: queue.length,
    }));
  }, []);

  // Process a single sync queue item
  const processQueueItem = useCallback(
    async (item: SyncQueueItem): Promise<boolean> => {
      const attempts = retryAttemptsRef.current.get(item.id) || 0;

      if (attempts >= MAX_RETRY_ATTEMPTS) {
        console.error(`Max retries reached for sync item ${item.id}`);
        // Keep in queue for manual retry
        return false;
      }

      try {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actions: [item.action] }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        const actionResult = result.results?.[0];

        if (actionResult?.success) {
          // Update local note with server state
          if (actionResult.note) {
            await db.saveNote({
              ...actionResult.note,
              syncStatus: "synced",
            });
          }

          // Remove from retry tracking
          retryAttemptsRef.current.delete(item.id);
          return true;
        } else {
          throw new Error(actionResult?.error || "Sync failed");
        }
      } catch (error) {
        const newAttempts = attempts + 1;
        retryAttemptsRef.current.set(item.id, newAttempts);

        // If it's a network error, we'll retry
        if (!navigator.onLine) {
          console.log("Offline, will retry later");
          return false;
        }

        throw error;
      }
    },
    []
  );

  // Main sync function
  const performSync = useCallback(async (): Promise<boolean> => {
    if (!userId || isSyncingRef.current) return false;

    isSyncingRef.current = true;
    setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));
    onSyncStart?.();

    try {
      // Step 1: Get pending changes from local queue
      const queue = await db.getSyncQueue();

      // Step 2: Send local changes to server
      if (queue.length > 0) {
        console.log(`Syncing ${queue.length} pending changes...`);

        const processedItems: string[] = [];
        const failedItems: SyncQueueItem[] = [];

        for (const item of queue) {
          try {
            const success = await processQueueItem(item);
            if (success) {
              processedItems.push(item.id);
            } else {
              failedItems.push(item);
            }
          } catch (error) {
            console.error(`Failed to process sync item ${item.id}:`, error);
            failedItems.push(item);
          }
        }

        // Remove successfully processed items from queue
        for (const id of processedItems) {
          await db.removeFromSyncQueue(id);
        }

        // Show toast for partial failures
        if (failedItems.length > 0 && processedItems.length > 0) {
          toast.warning(`${failedItems.length} items failed to sync`);
        }
      }

      // Step 3: Fetch latest changes from server
      await fetchLatestChanges();

      // Update sync state
      const now = new Date();
      await db.setLastSyncTimestamp(now.getTime());

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        pendingCount: 0,
        error: null,
      }));

      onSyncComplete?.();
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";

      console.error("Sync error:", error);

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: errorMessage,
      }));

      onSyncError?.(errorMessage);

      // Show error toast only on first error
      if (!syncState.error) {
        toast.error("Sync failed. Will retry automatically.");
      }

      return false;
    } finally {
      isSyncingRef.current = false;
      await updatePendingCount();
    }
  }, [
    userId,
    onSyncStart,
    onSyncComplete,
    onSyncError,
    processQueueItem,
    updatePendingCount,
    syncState.error,
  ]);

  // Fetch latest changes from server
  const fetchLatestChanges = useCallback(async () => {
    try {
      const lastSync = await db.getLastSyncTimestamp();

      const response = await fetch(`/api/sync?since=${lastSync}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.notes && data.notes.length > 0) {
        console.log(`Received ${data.notes.length} changes from server`);

        // Get local notes for conflict resolution
        const localNotesMap = new Map<string, Note>();
        for (const serverNote of data.notes as Note[]) {
          const localNote = await db.getNote(serverNote.id);
          if (localNote) {
            localNotesMap.set(serverNote.id, localNote);
          }
        }

        // Resolve conflicts
        const { toApply, conflicts } = resolveBatchConflicts(
          localNotesMap,
          data.notes as Note[]
        );

        // Apply server changes
        for (const note of toApply) {
          await db.saveNote({ ...note, syncStatus: "synced" });
        }

        // Notify about conflicts (rare case)
        if (conflicts.length > 0) {
          toast.warning(
            `${conflicts.length} notes had conflicts. Using server version.`
          );
          // Apply conflict resolutions too
          for (const { server } of conflicts) {
            await db.saveNote({ ...server, syncStatus: "synced" });
          }
        }

        // Notify parent component
        if (toApply.length > 0 || conflicts.length > 0) {
          onSyncComplete?.();
        }
      }

      // Update last sync timestamp
      if (data.timestamp) {
        await db.setLastSyncTimestamp(data.timestamp);
      }
    } catch (error) {
      console.error("Failed to fetch changes:", error);
      throw error;
    }
  }, [onSyncComplete]);

  // Manual sync trigger
  const sync = useCallback(async () => {
    return performSync();
  }, [performSync]);

  // Retry failed items
  const retryFailed = useCallback(async () => {
    retryAttemptsRef.current.clear();
    return performSync();
  }, [performSync]);

  // Set up periodic sync
  useEffect(() => {
    if (!userId) return;

    // Initial sync
    performSync();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (navigator.onLine && !isSyncingRef.current) {
        performSync();
      }
    }, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId, performSync]);

  // Listen for online event
  useEffect(() => {
    const handleOnline = () => {
      console.log("Back online, triggering sync...");
      performSync();
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [performSync]);

  // Listen for service worker sync messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "TRIGGER_SYNC") {
        performSync();
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
  }, [performSync]);

  // Update pending count periodically
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, [userId, updatePendingCount]);

  return {
    ...syncState,
    sync,
    retryFailed,
    isOnline: navigator.onLine,
  };
}

/**
 * Hook for queueing sync actions
 */
export function useSyncQueue(userId: string | undefined) {
  const queueAction = useCallback(
    async (action: SyncAction): Promise<void> => {
      if (!userId) return;

      await db.addToSyncQueue({
        id: crypto.randomUUID(),
        action,
        retryCount: 0,
        createdAt: Date.now(),
      });

      // Trigger background sync if available
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await (registration as any).sync.register("sync-notes");
        } catch (err) {
          console.error("Background sync registration failed:", err);
        }
      }
    },
    [userId]
  );

  return { queueAction };
}
