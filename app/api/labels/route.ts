import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { labels, noteLabels, notes } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { broadcastNoteUpdated } from "@/app/api/sse/route";

// GET /api/labels - Get all labels for user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get labels with note counts
    const userLabels = await db
      .select({
        id: labels.id,
        userId: labels.userId,
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
      .where(eq(labels.userId, session.user.id))
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, emoji, description, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }

    const [label] = await db
      .insert(labels)
      .values({
        userId: session.user.id,
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const [label] = await db
      .update(labels)
      .set(updateData)
      .where(and(eq(labels.id, id), eq(labels.userId, session.user.id)))
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
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Label ID required" }, { status: 400 });
    }

    // Delete label (junction records will cascade)
    const [label] = await db
      .delete(labels)
      .where(and(eq(labels.id, id), eq(labels.userId, session.user.id)))
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
