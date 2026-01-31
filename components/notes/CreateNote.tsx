"use client";

import { useState } from "react";
import { Plus, CheckSquare, Image, PenSquare } from "lucide-react";
import { NoteEditor } from "./NoteEditor";
import type { Note } from "@/types";

interface CreateNoteProps {
  onCreate: (data: Partial<Note>) => void;
}

export function CreateNote({ onCreate }: CreateNoteProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Collapsed state */}
      {!isExpanded && (
        <div
          className="w-full max-w-2xl mx-auto mb-8 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 flex items-center justify-between hover:shadow-lg transition-shadow">
            <span className="text-gray-500">Take a note...</span>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <CheckSquare className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <PenSquare className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <Image className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded state */}
      <NoteEditor
        isOpen={isExpanded}
        onClose={() => setIsExpanded(false)}
        onSave={onCreate}
      />
    </>
  );
}
