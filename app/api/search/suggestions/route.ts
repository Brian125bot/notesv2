import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/db/schema";
import { sql, eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Search Suggestions API
 * Returns autocomplete suggestions based on note titles
 */

// GET /api/search/suggestions?q=par
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query.trim() || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchPattern = `%${query.toLowerCase()}%`;
    const db = getDb();

    // Get suggestions from recent notes
    const titleMatches = await db
      .select({
        title: notes.title,
      })
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          sql`LOWER(title) LIKE ${searchPattern}`,
          sql`LENGTH(title) > 0`
        )
      )
      .orderBy(desc(notes.updatedAt))
      .limit(5);

    // Extract unique words from titles and content
    const allText = titleMatches.map((n) => n.title).join(" ");
    const words = allText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && w.includes(query.toLowerCase()));

    // Get unique suggestions
    const suggestions = Array.from(new Set(words)).slice(0, 5);

    // Add note titles as suggestions
    const titleSuggestions = titleMatches
      .map((n) => n.title)
      .filter((t) => t.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3);

    return NextResponse.json({
      suggestions: [...titleSuggestions, ...suggestions],
      query,
    });
  } catch (error) {
    console.error("Suggestions error:", error);
    return NextResponse.json({ suggestions: [] });
  }
}
