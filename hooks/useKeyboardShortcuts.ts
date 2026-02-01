"use client";

import { useEffect, useCallback } from "react";

interface ShortcutHandlers {
  onNewNote?: () => void;
  onFocusSearch?: () => void;
  onToggleSidebar?: () => void;
  onArchive?: () => void;
  onPin?: () => void;
  onCloseModal?: () => void;
  onSave?: () => void;
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        // Allow Escape to close modal even when typing
        if (event.key === "Escape" && handlers.onCloseModal) {
          handlers.onCloseModal();
          return;
        }
        // Allow Cmd/Ctrl+Enter to save
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && handlers.onSave) {
          event.preventDefault();
          handlers.onSave();
          return;
        }
        return;
      }

      const isMac = typeof window !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifierKey = isMac ? event.metaKey : event.ctrlKey;

      switch (event.key.toLowerCase()) {
        case "n":
          if (modifierKey) {
            event.preventDefault();
            handlers.onNewNote?.();
          }
          break;
        case "f":
          if (modifierKey) {
            event.preventDefault();
            handlers.onFocusSearch?.();
          }
          break;
        case "/":
          if (modifierKey) {
            event.preventDefault();
            handlers.onToggleSidebar?.();
          }
          break;
        case "d":
          if (modifierKey) {
            event.preventDefault();
            handlers.onArchive?.();
          }
          break;
        case "p":
          if (modifierKey) {
            event.preventDefault();
            handlers.onPin?.();
          }
          break;
        case "escape":
          handlers.onCloseModal?.();
          break;
        case "s":
          if (modifierKey) {
            event.preventDefault();
            handlers.onSave?.();
          }
          break;
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for touch gestures on mobile
 */
export function useTouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onPullDown,
  threshold = 50,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPullDown?: (distance: number) => void;
  threshold?: number;
}) {
  const handleTouchStart = useCallback(() => {
    // Touch handling is implemented in PullToRefresh component
  }, []);

  return { handleTouchStart };
}
