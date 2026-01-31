import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { sql, eq, and, desc, gt, lt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/search?q=query&filters=color:yellow,archived:false
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const filters = searchParams.get("filters");
    const limit = parseInt(searchParams.get("limit") || "20");

    let whereConditions = [eq(notes.userId, session.user.id)];

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

    let results;

    if (query.trim()) {
      // Full-text search with ranking
      const searchQuery = query
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .join(" & ");

      results = await db
        .select({
          id: notes.id,
          userId: notes.userId,
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
      results = await db
        .select()
        .from(notes)
        .where(and(...whereConditions))
        .orderBy(desc(notes.updatedAt))
        .limit(limit);
    }

    // Highlight matching text
    const highlightedResults = results.map((note) => ({
      ...note,
      titleHighlighted: query.trim()
        ? highlightMatches(note.title, query)
        : note.title,
      contentHighlighted: query.trim()
        ? highlightMatches(note.content, query)
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
function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const terms = query
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);

  let highlighted = text;
  for (const term of terms) {
    const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
    highlighted = highlighted.replace(regex, "<mark>$1</mark>");
  }

  return highlighted;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
