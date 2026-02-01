export type NoteColor = 
  | "white"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "blue"
  | "darkblue"
  | "purple"
  | "pink"
  | "brown"
  | "gray";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: NoteColor;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  labels?: Label[];
  syncStatus?: "synced" | "pending" | "error";
  clientId?: string; // for optimistic updates before server ID
}

export interface Label {
  id: string;
  userId: string;
  name: string;
  color: NoteColor;
  emoji: string;
  description?: string | null;
  sortOrder: number;
  createdAt: string;
}

export type SyncAction = 
  | { type: "create"; note: Note; timestamp: number }
  | { type: "update"; note: Partial<Note> & { id: string }; timestamp: number }
  | { type: "delete"; noteId: string; timestamp: number }
  | { type: "archive"; noteId: string; isArchived: boolean; timestamp: number }
  | { type: "pin"; noteId: string; isPinned: boolean; timestamp: number };

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  retryCount: number;
  createdAt: number;
}

export const NOTE_COLORS: Record<NoteColor, { bg: string; border: string; text: string }> = {
  white: { bg: "bg-white", border: "border-gray-200", text: "text-gray-900" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-gray-900" },
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-gray-900" },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-gray-900" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-gray-900" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-gray-900" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-gray-900" },
  darkblue: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-gray-900" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-gray-900" },
  pink: { bg: "bg-pink-50", border: "border-pink-200", text: "text-gray-900" },
  brown: { bg: "bg-amber-50", border: "border-amber-200", text: "text-gray-900" },
  gray: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-900" },
};
