import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notes } from "@/db/schema";
import { eq, gt } from "drizzle-orm";

/**
 * Sync API Routes
 * Bidirectional sync between client and server
 */

// GET /api/sync?since=timestamp - Get notes updated since timestamp
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const since = searchParams.get("since");

    const db = getDb();
    
    const userNotes = await (since 
      ? db.select().from(notes).where(gt(notes.updatedAt, new Date(parseInt(since))))
      : db.select().from(notes));

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
    const body = await req.json();
    const { actions } = body;

    const db = getDb();
    const results = [];

    for (const action of actions) {
      try {
        switch (action.type) {
          case "create": {
            const [note] = await db
              .insert(notes)
              .values({
                ...action.note,
              })
              .returning();
            results.push({ type: "create", success: true, note });
            break;
          }

          case "update": {
            const [note] = await db
              .update(notes)
              .set(action.note)
              .where(eq(notes.id, action.note.id))
              .returning();
            results.push({ type: "update", success: !!note, note });
            break;
          }

          case "delete": {
            const [note] = await db
              .delete(notes)
              .where(eq(notes.id, action.noteId))
              .returning();
            results.push({ type: "delete", success: !!note, noteId: action.noteId });
            break;
          }

          case "archive": {
            const [note] = await db
              .update(notes)
              .set({ isArchived: action.isArchived })
              .where(eq(notes.id, action.noteId))
              .returning();
            results.push({ type: "archive", success: !!note, note });
            break;
          }

          case "pin": {
            const [note] = await db
              .update(notes)
              .set({ isPinned: action.isPinned })
              .where(eq(notes.id, action.noteId))
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
