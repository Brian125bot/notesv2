import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  broadcastNoteCreated,
  broadcastNoteUpdated,
  broadcastNoteDeleted,
  broadcastSyncComplete,
} from "@/app/api/sse/route";

/**
 * Notes API Routes
 * CRUD operations for notes with real-time broadcasting
 */

// GET /api/notes - Get all notes for the user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    const db = getDb();
    const userNotes = await db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, session.user.id),
          includeArchived ? undefined : eq(notes.isArchived, false)
        )
      )
      .orderBy(desc(notes.updatedAt));

    return NextResponse.json(userNotes);
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, color, isPinned } = body;

    const db = getDb();
    const [note] = await db
      .insert(notes)
      .values({
        userId: session.user.id,
        title: title || "",
        content: content || "",
        color: color || "white",
        isPinned: isPinned || false,
        isArchived: false,
      })
      .returning();

    // Broadcast to user's other devices
    broadcastNoteCreated(session.user.id, note);
    broadcastSyncComplete(session.user.id, Date.now());

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Failed to create note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}

// PATCH /api/notes - Update a note
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, content, color, isPinned, isArchived } = body;

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const updateData: Partial<typeof notes.$inferInsert> = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    const db = getDb();
    const [note] = await db
      .update(notes)
      .set(updateData)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Broadcast to user's other devices
    broadcastNoteUpdated(session.user.id, note);
    broadcastSyncComplete(session.user.id, Date.now());

    return NextResponse.json(note);
  } catch (error) {
    console.error("Failed to update note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

// DELETE /api/notes - Delete a note
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Note ID required" }, { status: 400 });
    }

    const db = getDb();
    const [note] = await db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
      .returning();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Broadcast to user's other devices
    broadcastNoteDeleted(session.user.id, id);
    broadcastSyncComplete(session.user.id, Date.now());

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
