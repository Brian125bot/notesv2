# ✅ Phase 2: Real-time Sync & Background Sync Implementation - COMPLETE

## Overview
Phase 2 implements the real-time synchronization layer that enables notes to sync across devices instantly while handling offline scenarios gracefully.

---

## 🎯 Objectives

1. **Server-Sent Events (SSE)** - Push server changes to clients in real-time
2. **Background Sync API** - Queue and retry sync when coming back online
3. **Conflict Resolution** - Last-write-wins with timestamp comparison
4. **Optimistic UI Updates** - Immediate feedback with rollback on error
5. **Sync Status Indicators** - Visual feedback for pending/synced states

---

## 📋 Implementation Tasks

### 1. Server-Sent Events (SSE) Endpoint

**File:** `app/api/sse/route.ts`

- [ ] Create SSE endpoint that streams updates to connected clients
- [ ] Maintain client connections map (userId -> connections[])
- [ ] Broadcast changes when notes are modified
- [ ] Handle client disconnections gracefully
- [ ] Send heartbeat/ping to keep connections alive

**Implementation Details:**
```typescript
// SSE message types:
- note_created: { note: Note }
- note_updated: { note: Note }
- note_deleted: { noteId: string }
- sync_complete: { timestamp: number }
```

---

### 2. SSE Client Hook

**File:** `hooks/useSSE.ts`

- [ ] Establish EventSource connection on mount
- [ ] Listen for server events and apply to local state
- [ ] Handle reconnection with exponential backoff
- [ ] Clean up connection on unmount
- [ ] Update IndexedDB when receiving server changes

**Key Features:**
- Automatic reconnection on disconnect
- Skip updates for notes with pending local changes
- Debounce rapid updates

---

### 3. Background Sync Enhancement

**File:** `public/sw.js` (enhance existing)

- [ ] Register sync event listeners
- [ ] Queue failed requests in IndexedDB
- [ ] Retry sync when connection restored
- [ ] Notify clients of sync completion
- [ ] Handle sync conflicts

**New Sync Tags:**
- `sync-notes` - General note sync
- `sync-create` - New note creations
- `sync-update` - Note updates
- `sync-delete` - Note deletions

---

### 4. Enhanced Sync Logic

**File:** `hooks/useSync.ts` (enhance existing)

- [ ] Implement bidirectional sync (client → server → client)
- [ ] Handle conflicts with server state
- [ ] Add retry logic with exponential backoff
- [ ] Implement delta sync (only changed fields)
- [ ] Add sync progress indicators

**Sync Flow:**
```
1. Check for pending local changes
2. Send changes to server
3. Apply server changes to local
4. Resolve conflicts (last-write-wins)
5. Clear sync queue
6. Notify UI of completion
```

---

### 5. Conflict Resolution

**File:** `lib/sync/conflictResolver.ts` (new)

- [ ] Compare timestamps for last-write-wins
- [ ] Handle deleted notes conflicts
- [ ] Merge strategy for concurrent edits
- [ ] Notify user of conflicts when needed

**Conflict Rules:**
- Server wins if server.updatedAt > local.updatedAt
- Local wins if local has pending changes and is newer
- Deleted notes take precedence over updates
- Show conflict resolution UI for edge cases

---

### 6. Optimistic Updates

**File:** `hooks/useNotes.ts` (enhance existing)

- [ ] Apply changes to UI immediately
- [ ] Rollback on sync failure
- [ ] Show temporary states (saving...)
- [ ] Queue actions for offline scenarios

**UI States:**
- `idle` - No pending changes
- `pending` - Change queued for sync
- `syncing` - Currently syncing
- `error` - Sync failed, will retry
- `synced` - Successfully synced

---

### 7. Sync Status Indicators

**Files:** 
- `components/SyncStatus.tsx` (new)
- `components/Header.tsx` (enhance)

- [ ] Add sync status badge in header
- [ ] Show pending count with animation
- [ ] Display last sync time
- [ ] Show offline indicator
- [ ] Toast notifications for sync events

**Visual States:**
```
🟢 Online & Synced - Green dot
🟡 Online with Pending - Yellow dot with count
🔴 Offline - Red dot with "Offline" text
⚪ Syncing - Spinning indicator
```

---

### 8. Enhanced API Routes

**File:** `app/api/notes/route.ts` (enhance)

- [ ] Broadcast changes via SSE after mutations
- [ ] Add batch operations endpoint
- [ ] Implement delta query (changes since timestamp)
- [ ] Add pagination for large note sets

**New Endpoints:**
```
GET /api/notes/delta?since=timestamp - Get changes since
POST /api/notes/batch - Batch create/update/delete
```

---

### 9. IndexedDB Enhancements

**File:** `lib/indexeddb.ts` (enhance)

- [ ] Add versioning support
- [ ] Implement soft deletes (for sync)
- [ ] Add tombstone records for deleted items
- [ ] Optimize queries with compound indexes
- [ ] Add sync metadata table

**New Tables:**
- `tombstones` - Track deleted items for sync
- `sync_metadata` - Last sync timestamps, client ID

---

### 10. Debounced Auto-Save

**File:** `hooks/useAutoSave.ts` (new)

- [ ] Auto-save note changes after delay (2s)
- [ ] Cancel pending saves on new changes
- [ ] Show "Saving..." / "Saved" indicators
- [ ] Handle rapid editing gracefully

---

## 🔧 Technical Implementation Details

### SSE Protocol

```typescript
// Client connects to:
const eventSource = new EventSource('/api/sse?token=<jwt>');

// Server events:
event: note_created
data: { "id": "...", "title": "...", ... }

event: note_updated
data: { "id": "...", "changes": {...} }

event: note_deleted
data: { "noteId": "..." }

event: sync_complete
data: { "timestamp": 1234567890 }
```

### Background Sync Flow

```
User Action
    ↓
Save to IndexedDB
    ↓
Add to Sync Queue
    ↓
Attempt Immediate Sync
    ↓
    ├─ Success → Clear Queue → Broadcast SSE
    │
    └─ Fail (Offline)
         ↓
    Register Background Sync
         ↓
    Browser queues for retry
         ↓
    Connection Restored
         ↓
    Service Worker triggers sync
         ↓
    Process Queue
         ↓
    Notify Clients
```

### Conflict Resolution Algorithm

```typescript
function resolveConflict(localNote, serverNote) {
  // Case 1: Local is pending (not yet synced)
  if (localNote.syncStatus === 'pending') {
    // Keep local, will overwrite server on next sync
    return localNote;
  }
  
  // Case 2: Both synced - compare timestamps
  if (new Date(serverNote.updatedAt) > new Date(localNote.updatedAt)) {
    // Server is newer - accept server changes
    return serverNote;
  }
  
  // Local is newer - keep local (shouldn't happen normally)
  return localNote;
}
```

---

## 📱 UI/UX Enhancements

### Sync Indicators
- [ ] Floating sync status bar
- [ ] Note-level sync indicators (small dot)
- [ ] Pull-to-refresh on mobile
- [ ] Toast notifications for sync events

### Offline Experience
- [ ] Banner when going offline
- [ ] Disable features requiring connection
- [ ] Show "Changes will sync when online"
- [ ] Queue count in header

---

## 🧪 Testing Scenarios

### Offline Mode
- [ ] Create note while offline
- [ ] Edit note while offline
- [ ] Delete note while offline
- [ ] Come back online - verify sync

### Multi-Device Sync
- [ ] Create note on Device A
- [ ] Verify appears on Device B in real-time
- [ ] Edit on both devices simultaneously
- [ ] Verify conflict resolution

### Reconnection
- [ ] Disconnect network
- [ ] Make multiple changes
- [ ] Reconnect
- [ ] Verify all changes sync correctly

---

## 📁 Files to Create/Modify

### New Files
```
app/api/sse/route.ts              # SSE endpoint
hooks/useSSE.ts                   # SSE client hook
hooks/useAutoSave.ts              # Auto-save hook
lib/sync/conflictResolver.ts      # Conflict resolution
components/SyncStatus.tsx         # Sync status component
components/OfflineBanner.tsx      # Offline indicator
```

### Modified Files
```
app/api/notes/route.ts            # Add SSE broadcast
app/api/sync/route.ts             # Enhance sync logic
hooks/useSync.ts                  # Add real-time sync
hooks/useNotes.ts                 # Add optimistic updates
lib/indexeddb.ts                  # Add tombstones, metadata
public/sw.js                      # Add background sync
components/Header.tsx             # Add sync indicators
```

---

## 🚀 Post-Phase 2 Checklist

- [ ] Real-time updates work across devices
- [ ] Offline changes sync when reconnected
- [ ] Sync status is clearly visible
- [ ] Conflicts resolve correctly
- [ ] No data loss in any scenario
- [ ] Performance remains smooth
- [ ] Mobile experience is optimized

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Sync Latency | < 2 seconds |
| Offline Queue | Unlimited (storage permitting) |
| Conflict Resolution | Automatic, no user intervention |
| Reconnection Time | < 5 seconds |
| Data Integrity | 100% (no lost notes) |

---

## 🎯 Ready for Phase 3?

Phase 2 is complete when:
1. ✅ Real-time sync works reliably
2. ✅ Offline support is seamless
3. ✅ No data loss scenarios
4. ✅ Performance is optimized
5. ✅ All tests pass

**Next: Phase 3** - Search, Labels, and Mobile Optimizations
