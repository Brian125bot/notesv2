import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Map of userId to their active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

/**
 * SSE Endpoint for real-time note updates
 * Clients connect here to receive live updates when notes change
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Add this connection to user's connections
        if (!connections.has(userId)) {
          connections.set(userId, new Set());
        }
        connections.get(userId)!.add(controller);

        // Send initial connection message
        const message = formatSSEMessage("connected", {
          userId,
          timestamp: Date.now(),
        });
        controller.enqueue(message);

        // Set up heartbeat to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(formatSSEMessage("ping", { timestamp: Date.now() }));
          } catch {
            // Connection closed, clean up
            clearInterval(heartbeat);
            cleanupConnection(userId, controller);
          }
        }, HEARTBEAT_INTERVAL);

        // Handle client disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          cleanupConnection(userId, controller);
        });
      },
      cancel(controller) {
        cleanupConnection(userId, controller);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * Format a message for SSE
 */
function formatSSEMessage(event: string, data: unknown): Uint8Array {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(message);
}

/**
 * Clean up a closed connection
 */
function cleanupConnection(
  userId: string,
  controller: ReadableStreamDefaultController
) {
  const userConnections = connections.get(userId);
  if (userConnections) {
    userConnections.delete(controller);
    if (userConnections.size === 0) {
      connections.delete(userId);
    }
  }
}

/**
 * Broadcast an event to all connections for a user
 */
export function broadcastToUser(
  userId: string,
  event: string,
  data: unknown
) {
  const userConnections = connections.get(userId);
  if (!userConnections || userConnections.size === 0) return;

  const message = formatSSEMessage(event, data);
  const deadConnections: ReadableStreamDefaultController[] = [];

  for (const controller of userConnections) {
    try {
      controller.enqueue(message);
    } catch {
      // Connection is dead, mark for cleanup
      deadConnections.push(controller);
    }
  }

  // Clean up dead connections
  for (const controller of deadConnections) {
    cleanupConnection(userId, controller);
  }
}

/**
 * Broadcast a note creation event
 */
export function broadcastNoteCreated(userId: string, note: unknown) {
  broadcastToUser(userId, "note_created", { note });
}

/**
 * Broadcast a note update event
 */
export function broadcastNoteUpdated(userId: string, note: unknown) {
  broadcastToUser(userId, "note_updated", { note });
}

/**
 * Broadcast a note deletion event
 */
export function broadcastNoteDeleted(userId: string, noteId: string) {
  broadcastToUser(userId, "note_deleted", { noteId });
}

/**
 * Broadcast a sync completion event
 */
export function broadcastSyncComplete(userId: string, timestamp: number) {
  broadcastToUser(userId, "sync_complete", { timestamp });
}
