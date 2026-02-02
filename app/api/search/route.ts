import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";

/**
 * Full-text Search API
 * PostgreSQL tsvector-based search with highlighting
 */

// GET /api/search?q=query&filters=color:yellow,archived:false
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const filters = searchParams.get("filters");
    const limit = parseInt(searchParams.get("limit") || "20");

    const whereConditions = [];

    // Parse and apply filters
    if (filters) {
      const filterPairs = filters.split(",");
      for (const pair of filterPairs) {
        const [key, value] = pair.split(":");
        if (key === "color") {
          whereConditions.push(eq(notes.color, value));
        } else if (key === "archived") {
          whereConditions.push(eq(notes.isArchived, value === "true"));
        } else if (key === "pinned") {
          whereConditions.push(eq(notes.isPinned, value === "true"));
        }
      }
    }

    const db = getDb();

    let searchResults;
    if (query.trim()) {
      // Full-text search with ranking
      const searchQuery = query
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .join(" & ");

      searchResults = await db
        .select({
          id: notes.id,
          title: notes.title,
          content: notes.content,
          color: notes.color,
          isPinned: notes.isPinned,
          isArchived: notes.isArchived,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
          rank: sql<number>`ts_rank(search_vector, to_tsquery('english', ${searchQuery}))`.as(
            "rank"
          ),
        })
        .from(notes)
        .where(
          and(
            ...whereConditions,
            sql`search_vector @@ to_tsquery('english', ${searchQuery})`
          )
        )
        .orderBy(desc(sql`rank`), desc(notes.updatedAt))
        .limit(limit);
    } else {
      // No query, just filters - return recent notes
      searchResults = await db
        .select()
        .from(notes)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(notes.updatedAt))
        .limit(limit);
    }

    // Highlight matching text
    let highlightRegex: RegExp | null = null;
    if (query.trim()) {
      const terms = query
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean);

      if (terms.length > 0) {
        // Sort by length desc to ensure longest match wins
        terms.sort((a, b) => b.length - a.length);
        const pattern = terms.map(escapeRegex).join("|");
        highlightRegex = new RegExp(`(${pattern})`, "gi");
      }
    }

    const highlightedResults = searchResults.map((note) => ({
      ...note,
      titleHighlighted: highlightRegex
        ? highlightMatches(note.title, highlightRegex)
        : note.title,
      contentHighlighted: highlightRegex
        ? highlightMatches(note.content, highlightRegex)
        : note.content,
    }));

    return NextResponse.json({
      results: highlightedResults,
      query,
      total: highlightedResults.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

// Highlight matching text with <mark> tags
function highlightMatches(text: string, regex: RegExp): string {
  return text.replace(regex, "<mark>$1</mark>");
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
