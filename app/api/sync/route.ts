import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/sync?since=timestamp - Get notes updated since timestamp
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    let query = db.select().from(notes).where(eq(notes.userId, session.user.id));

    if (since) {
      const sinceDate = new Date(parseInt(since));
      query = db
        .select()
        .from(notes)
        .where(and(eq(notes.userId, session.user.id), gt(notes.updatedAt, sinceDate)));
    }

    const userNotes = await query;

    return NextResponse.json({
      notes: userNotes,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to sync:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}

// POST /api/sync - Apply batch changes from client
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { actions } = body;

    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case "create": {
            const [note] = await db
              .insert(notes)
              .values({
                ...action.note,
                userId: session.user.id,
              })
              .returning();
            results.push({ type: "create", success: true, note });
            break;
          }

          case "update": {
            const [note] = await db
              .update(notes)
              .set(action.note)
              .where(and(eq(notes.id, action.note.id), eq(notes.userId, session.user.id)))
              .returning();
            results.push({ type: "update", success: !!note, note });
            break;
          }

          case "delete": {
            const [note] = await db
              .delete(notes)
              .where(and(eq(notes.id, action.noteId), eq(notes.userId, session.user.id)))
              .returning();
            results.push({ type: "delete", success: !!note, noteId: action.noteId });
            break;
          }

          case "archive": {
            const [note] = await db
              .update(notes)
              .set({ isArchived: action.isArchived })
              .where(and(eq(notes.id, action.noteId), eq(notes.userId, session.user.id)))
              .returning();
            results.push({ type: "archive", success: !!note, note });
            break;
          }

          case "pin": {
            const [note] = await db
              .update(notes)
              .set({ isPinned: action.isPinned })
              .where(and(eq(notes.id, action.noteId), eq(notes.userId, session.user.id)))
              .returning();
            results.push({ type: "pin", success: !!note, note });
            break;
          }
        }
      } catch (err) {
        results.push({ type: action.type, success: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({
      results,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Failed to apply sync:", error);
    return NextResponse.json({ error: "Failed to apply sync" }, { status: 500 });
  }
}
