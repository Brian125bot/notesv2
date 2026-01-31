import type { Note } from "@/types";

export interface ConflictResult {
  winner: "local" | "server" | "merge";
  note: Note;
  hasConflict: boolean;
}

/**
 * Resolve conflicts between local and server note states
 * Uses last-write-wins strategy with pending change awareness
 */
export function resolveConflict(
  localNote: Note | undefined,
  serverNote: Note
): ConflictResult {
  // If no local note, server wins
  if (!localNote) {
    return {
      winner: "server",
      note: serverNote,
      hasConflict: false,
    };
  }

  // If local has pending changes, local wins (will overwrite server on next sync)
  if (localNote.syncStatus === "pending") {
    const localUpdatedAt = new Date(localNote.updatedAt).getTime();
    const serverUpdatedAt = new Date(serverNote.updatedAt).getTime();

    // Only accept server if it's significantly newer (30+ seconds)
    // This handles the case where another device made changes while we were editing
    if (serverUpdatedAt > localUpdatedAt + 30000) {
      return {
        winner: "server",
        note: serverNote,
        hasConflict: true,
      };
    }

    return {
      winner: "local",
      note: localNote,
      hasConflict: false,
    };
  }

  // Both synced - compare timestamps
  const localUpdatedAt = new Date(localNote.updatedAt).getTime();
  const serverUpdatedAt = new Date(serverNote.updatedAt).getTime();

  if (serverUpdatedAt > localUpdatedAt) {
    return {
      winner: "server",
      note: serverNote,
      hasConflict: false,
    };
  }

  // Local is newer or equal - keep local
  return {
    winner: "local",
    note: localNote,
    hasConflict: false,
  };
}

/**
 * Resolve batch conflicts for multiple notes
 */
export function resolveBatchConflicts(
  localNotes: Map<string, Note>,
  serverNotes: Note[]
): {
  toApply: Note[];
  conflicts: Array<{ local: Note; server: Note }>;
} {
  const toApply: Note[] = [];
  const conflicts: Array<{ local: Note; server: Note }> = [];

  for (const serverNote of serverNotes) {
    const localNote = localNotes.get(serverNote.id);
    const result = resolveConflict(localNote, serverNote);

    if (result.winner === "server") {
      toApply.push(result.note);
    }

    if (result.hasConflict) {
      conflicts.push({
        local: localNote!,
        server: serverNote,
      });
    }
  }

  return { toApply, conflicts };
}

/**
 * Check if a note has meaningful changes compared to another
 */
export function hasChanges(
  noteA: Partial<Note>,
  noteB: Partial<Note>
): boolean {
  const fields: (keyof Note)[] = [
    "title",
    "content",
    "color",
    "isPinned",
    "isArchived",
  ];

  return fields.some((field) => noteA[field] !== noteB[field]);
}

/**
 * Merge two notes - used for conflict resolution UI
 */
export function mergeNotes(localNote: Note, serverNote: Note): Note {
  // For now, prefer server for content but preserve local pin/archive preferences
  return {
    ...serverNote,
    isPinned: localNote.isPinned || serverNote.isPinned,
    updatedAt: new Date().toISOString(),
    syncStatus: "pending",
  };
}
