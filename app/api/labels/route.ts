import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { labels, noteLabels } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Labels API Routes
 * CRUD operations for note labels
 */

// GET /api/labels - Get all labels
export async function GET(req: NextRequest) {
  try {
    const db = getDb();

    // Get labels with note counts
    const userLabels = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        emoji: labels.emoji,
        description: labels.description,
        sortOrder: labels.sortOrder,
        createdAt: labels.createdAt,
        noteCount: sql<number>`COUNT(${noteLabels.noteId})`.as("note_count"),
      })
      .from(labels)
      .leftJoin(noteLabels, eq(labels.id, noteLabels.labelId))
      .groupBy(labels.id)
      .orderBy(labels.sortOrder, desc(labels.createdAt));

    return NextResponse.json(userLabels);
  } catch (error) {
    console.error("Failed to fetch labels:", error);
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 });
  }
}

// POST /api/labels - Create new label
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, color, emoji, description, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const db = getDb();
    const [label] = await db
      .insert(labels)
      .values({
        name: name.trim(),
        color: color || "gray",
        emoji: emoji || "🏷️",
        description: description || null,
        sortOrder: sortOrder || 0,
      })
      .returning();

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("Failed to create label:", error);
    return NextResponse.json({ error: "Failed to create label" }, { status: 500 });
  }
}

// PATCH /api/labels?id=xxx - Update label
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Label ID required" }, { status: 400 });
    }

    const body = await req.json();
    const updateData: Partial<typeof labels.$inferInsert> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.color !== undefined) updateData.color = body.color;
    if (body.emoji !== undefined) updateData.emoji = body.emoji;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder;

    const db = getDb();
    const [label] = await db
      .update(labels)
      .set(updateData)
      .where(eq(labels.id, id))
      .returning();

    if (!label) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    return NextResponse.json(label);
  } catch (error) {
    console.error("Failed to update label:", error);
    return NextResponse.json({ error: "Failed to update label" }, { status: 500 });
  }
}

// DELETE /api/labels?id=xxx - Delete label
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Label ID required" }, { status: 400 });
    }

    const db = getDb();

    // Delete label (junction records will cascade)
    const [label] = await db
      .delete(labels)
      .where(eq(labels.id, id))
      .returning();

    if (!label) {
      return NextResponse.json({ error: "Label not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete label:", error);
    return NextResponse.json({ error: "Failed to delete label" }, { status: 500 });
  }
}
