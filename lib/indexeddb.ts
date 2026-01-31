import Dexie, { type EntityTable } from "dexie";
import type { Note, Label, SyncQueueItem } from "@/types";

interface LocalNote extends Note {
  isDeleted?: boolean;
}

interface LocalLabel extends Label {
  isDeleted?: boolean;
}

class NotesDatabase extends Dexie {
  notes!: EntityTable<LocalNote, "id">;
  labels!: EntityTable<LocalLabel, "id">;
  syncQueue!: EntityTable<SyncQueueItem, "id">;
  metadata!: EntityTable<{ key: string; value: any }, "key">;

  constructor() {
    super("NotesDatabase");
    
    this.version(1).stores({
      notes: "id, userId, isPinned, isArchived, updatedAt, syncStatus, isDeleted",
      labels: "id, userId, name, isDeleted",
      syncQueue: "id, createdAt",
      metadata: "key",
    });
  }

  // Note operations
  async getNotes(userId: string, includeArchived = false): Promise<Note[]> {
    let query = this.notes.where({ userId }).and((n) => !n.isDeleted);
    if (!includeArchived) {
      query = query.and((n) => !n.isArchived);
    }
    return query.reverse().sortBy("updatedAt");
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async saveNote(note: LocalNote): Promise<string> {
    const now = new Date().toISOString();
    const noteToSave = {
      ...note,
      updatedAt: now,
      syncStatus: "pending" as const,
    };
    
    await this.notes.put(noteToSave);
    return note.id;
  }

  async deleteNote(id: string): Promise<void> {
    const note = await this.notes.get(id);
    if (note) {
      await this.notes.put({ ...note, isDeleted: true, syncStatus: "pending" });
    }
  }

  async archiveNote(id: string, isArchived: boolean): Promise<void> {
    const note = await this.notes.get(id);
    if (note) {
      await this.notes.put({ ...note, isArchived, syncStatus: "pending" });
    }
  }

  async pinNote(id: string, isPinned: boolean): Promise<void> {
    const note = await this.notes.get(id);
    if (note) {
      await this.notes.put({ ...note, isPinned, syncStatus: "pending" });
    }
  }

  // Sync queue operations
  async addToSyncQueue(action: SyncQueueItem["action"]): Promise<void> {
    const item: SyncQueueItem = {
      id: crypto.randomUUID(),
      action,
      retryCount: 0,
      createdAt: Date.now(),
    };
    await this.syncQueue.add(item);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.syncQueue.orderBy("createdAt").toArray();
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    await this.syncQueue.delete(id);
  }

  async updateSyncStatus(noteId: string, status: Note["syncStatus"]): Promise<void> {
    const note = await this.notes.get(noteId);
    if (note) {
      await this.notes.put({ ...note, syncStatus: status });
    }
  }

  async clearSyncQueue(): Promise<void> {
    await this.syncQueue.clear();
  }

  // Metadata operations
  async getLastSyncTimestamp(): Promise<number> {
    const record = await this.metadata.get("lastSyncTimestamp");
    return record?.value || 0;
  }

  async setLastSyncTimestamp(timestamp: number): Promise<void> {
    await this.metadata.put({ key: "lastSyncTimestamp", value: timestamp });
  }

  // Bulk operations for sync
  async bulkSyncNotes(notes: Note[]): Promise<void> {
    await this.notes.bulkPut(notes.map((n) => ({ ...n, syncStatus: "synced" as const })));
  }

  async applyServerChanges(serverNotes: Note[]): Promise<void> {
    await this.transaction("rw", this.notes, async () => {
      for (const serverNote of serverNotes) {
        const localNote = await this.notes.get(serverNote.id);
        
        // If local has pending changes, skip server update (last-write-wins)
        if (localNote?.syncStatus === "pending") {
          continue;
        }

        // Apply server changes
        await this.notes.put({ ...serverNote, syncStatus: "synced" });
      }
    });
  }
}

export const db = new NotesDatabase();
