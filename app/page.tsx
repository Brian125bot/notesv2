"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { CreateNote } from "@/components/notes/CreateNote";
import { NotesGrid } from "@/components/notes/NotesGrid";
import { MobileNav } from "@/components/MobileNav";
import { PullToRefresh } from "@/components/PullToRefresh";
import { OfflineBanner } from "@/components/SyncStatus";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { useNotes } from "@/hooks/useNotes";
import { useSync } from "@/hooks/useSync";
import { useSSE } from "@/hooks/useSSE";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Note, NoteColor } from "@/types";

export default function Home() {
  const { data: session, isPending } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState<"notes" | "archive" | "labels">("notes");
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const userId = session?.user?.id;

  const {
    notes,
    isLoading,
    isOnline,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    pinNote,
    refresh,
  } = useNotes(userId);

  // Sync state management
  const handleSyncComplete = useCallback(() => {
    refresh();
  }, [refresh]);

  const {
    isSyncing,
    pendingCount,
    lastSyncTime,
    error: syncError,
    sync,
    retryFailed,
  } = useSync({
    userId,
    onSyncComplete: handleSyncComplete,
  });

  // SSE for real-time updates
  const handleServerNoteCreated = useCallback(() => refresh(), [refresh]);
  const handleServerNoteUpdated = useCallback(() => refresh(), [refresh]);
  const handleServerNoteDeleted = useCallback(() => refresh(), [refresh]);

  const { isConnected: isSSEConnected } = useSSE({
    userId,
    onNoteCreated: handleServerNoteCreated,
    onNoteUpdated: handleServerNoteUpdated,
    onNoteDeleted: handleServerNoteDeleted,
    onSyncComplete: handleSyncComplete,
  });

  // Filter notes based on view and label
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Filter by archived status
    if (currentView === "notes") {
      filtered = filtered.filter((n) => !n.isArchived);
    } else if (currentView === "archive") {
      filtered = filtered.filter((n) => n.isArchived);
    }

    // Filter by label if selected
    if (selectedLabelId) {
      filtered = filtered.filter((n) =>
        (n as any).labels?.some((l: any) => l.id === selectedLabelId)
      );
    }

    return filtered;
  }, [notes, currentView, selectedLabelId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewNote: () => setIsCreateOpen(true),
    onCloseModal: () => setIsCreateOpen(false),
    onToggleSidebar: () => setSidebarOpen(!sidebarOpen),
  });

  // Register service worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration);
        })
        .catch((error) => {
          console.log("SW registration failed:", error);
        });
    }
  }, []);

  // Handle note selection from search
  const handleNoteSelect = useCallback((note: Note) => {
    // Open note in editor
    // This would need to be implemented in NotesGrid
    console.log("Selected note:", note);
  }, []);

  // Handle label selection
  const handleLabelSelect = useCallback((labelId: string | null) => {
    setSelectedLabelId(labelId);
    if (labelId) {
      setCurrentView("labels");
    } else {
      setCurrentView("notes");
    }
  }, []);

  // Redirect to login if not authenticated
  if (!isPending && !session) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  // Show loading state
  if (isPending || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await sync(); }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 sm:pb-0">
        <Header
          user={session.user}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          lastSyncTime={lastSyncTime}
          syncError={syncError}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onRefresh={sync}
          onRetrySync={retryFailed}
          onLogout={signOut}
          onNoteSelect={handleNoteSelect}
        />

        <Sidebar
          isOpen={sidebarOpen}
          currentView={currentView}
          selectedLabelId={selectedLabelId}
          onViewChange={setCurrentView}
          onLabelSelect={handleLabelSelect}
          onLabelsChange={refresh}
        />

        <main
          className={`pt-4 transition-all duration-200 ${
            sidebarOpen ? "ml-0 md:ml-64" : "ml-0 sm:ml-16"
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 pb-8">
            {/* SSE Connection Status */}
            {!isSSEConnected && isOnline && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
                Real-time updates unavailable. Changes will sync periodically.
              </div>
            )}

            {/* Create note - only show in notes view */}
            {currentView === "notes" && (
              <CreateNote onCreate={createNote} />
            )}

            {/* Notes grid */}
            {isLoading ? (
              <SkeletonGrid count={8} />
            ) : (
              <NotesGrid
                notes={filteredNotes}
                showArchived={currentView === "archive"}
                onUpdate={updateNote}
                onArchive={archiveNote}
                onPin={pinNote}
                onDelete={deleteNote}
                onColorChange={(id, color) => updateNote(id, { color })}
              />
            )}
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav
          currentView={currentView}
          onViewChange={(view) => {
            setCurrentView(view);
            setSelectedLabelId(null);
          }}
          onCreateNote={() => setIsCreateOpen(true)}
        />

        {/* Create Note Modal for Mobile */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="sm:max-w-2xl">
            <CreateNote
              onCreate={(data) => {
                createNote(data);
                setIsCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Offline Banner */}
        <OfflineBanner isOnline={isOnline} />
      </div>
    </PullToRefresh>
  );
}
