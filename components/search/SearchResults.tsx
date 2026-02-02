"use client";

import { FileSearch } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { HighlightText } from "./HighlightText";
import { Pin, Archive } from "lucide-react";
import { NOTE_COLORS } from "@/types";
import type { Note } from "@/types";

interface SearchResult {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  titleHighlighted?: string;
  contentHighlighted?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  query: string;
  onNoteSelect: (note: Note) => void;
}

export function SearchResults({
  results,
  isLoading,
  query,
  onNoteSelect,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!query.trim() && results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Start typing to search your notes</p>
        <p className="text-sm mt-2">Search by title, content, or use filters</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <FileSearch className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No notes found</p>
        <p className="text-sm mt-2">Try different keywords or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>

      <div className="grid gap-4">
        {results.map((result) => {
          const colors = NOTE_COLORS[result.color as keyof typeof NOTE_COLORS] || NOTE_COLORS.white;

          return (
            <Card
              key={result.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${colors.bg} ${colors.border} border`}
              onClick={() =>
                onNoteSelect({
                  id: result.id,
                  title: result.title,
                  content: result.content,
                  color: result.color as any,
                  isPinned: result.isPinned,
                  isArchived: result.isArchived,
                  createdAt: result.createdAt,
                  updatedAt: result.updatedAt,
                })
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {result.titleHighlighted ? (
                      <h3
                        className="font-semibold text-lg mb-1 text-gray-900"
                        dangerouslySetInnerHTML={{
                          __html: result.titleHighlighted,
                        }}
                      />
                    ) : (
                      <h3 className="font-semibold text-lg mb-1 text-gray-900">
                        {result.title || "Untitled"}
                      </h3>
                    )}

                    {result.contentHighlighted ? (
                      <p
                        className="text-gray-600 line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: result.contentHighlighted,
                        }}
                      />
                    ) : (
                      <p className="text-gray-600 line-clamp-3">{result.content}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {result.isPinned && (
                      <Pin className="h-4 w-4 text-amber-500" fill="currentColor" />
                    )}
                    {result.isArchived && (
                      <Archive className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
