import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { labels, noteLabels, notes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { broadcastNoteUpdated } from "@/lib/sse";

/**
 * Note Labels API Routes
 * Manage labels assigned to specific notes
 */

// GET /api/notes/labels?noteId=xxx - Get labels for a note
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify note belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Get labels for note
    const noteLabelList = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        emoji: labels.emoji,
      })
      .from(noteLabels)
      .innerJoin(labels, eq(noteLabels.labelId, labels.id))
      .where(eq(noteLabels.noteId, noteId));

    return NextResponse.json(noteLabelList);
  } catch (error) {
    console.error("Failed to fetch note labels:", error);
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

// POST /api/notes/labels - Add labels to note
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { noteId, labelIds } = body;

    if (!noteId || !Array.isArray(labelIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const db = getDb();

    // Verify note belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Verify labels belong to user
    const userLabels = await db
      .select({ id: labels.id })
      .from(labels)
      .where(and(eq(labels.userId, session.user.id), inArray(labels.id, labelIds)));

    const validLabelIds = userLabels.map((l) => l.id);

    // Insert junction records (ignore duplicates)
    for (const labelId of validLabelIds) {
      try {
        await db.insert(noteLabels).values({ noteId, labelId });
      } catch {
        // Ignore duplicate key errors
      }
    }

    // Broadcast update
    broadcastNoteUpdated(session.user.id, { ...note, updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, added: validLabelIds.length });
  } catch (error) {
    console.error("Failed to add labels:", error);
    return NextResponse.json({ error: "Failed to add labels" }, { status: 500 });
  }
}

// DELETE /api/notes/labels?noteId=xxx&labelId=xxx - Remove label from note
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");
    const labelId = searchParams.get("labelId");

    if (!noteId || !labelId) {
      return NextResponse.json({ error: "Note ID and Label ID required" }, { status: 400 });
    }

    const db = getDb();

    // Verify note belongs to user
    const [note] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, session.user.id)));

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Delete junction record
    await db
      .delete(noteLabels)
      .where(and(eq(noteLabels.noteId, noteId), eq(noteLabels.labelId, labelId)));

    // Broadcast update
    broadcastNoteUpdated(session.user.id, { ...note, updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove label:", error);
    return NextResponse.json({ error: "Failed to remove label" }, { status: 500 });
  }
}
