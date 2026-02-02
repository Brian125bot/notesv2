import { NextRequest } from "next/server";

// Map of clientId to their active connections
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

/**
 * SSE Endpoint for real-time note updates
 * Clients connect here to receive live updates when notes change
 */
export async function GET(req: NextRequest) {
  try {
    const clientId = "guest";

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        // Add this connection to global connections
        if (!connections.has(clientId)) {
          connections.set(clientId, new Set());
        }
        connections.get(clientId)!.add(controller);

        // Send initial connection message
        const message = formatSSEMessage("connected", {
          clientId,
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
            cleanupConnection(clientId, controller);
          }
        }, HEARTBEAT_INTERVAL);

        // Handle client disconnect
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          cleanupConnection(clientId, controller);
        });
      },
      cancel(controller) {
        cleanupConnection(clientId, controller);
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
  clientId: string,
  controller: ReadableStreamDefaultController
) {
  const userConnections = connections.get(clientId);
  if (userConnections) {
    userConnections.delete(controller);
    if (userConnections.size === 0) {
      connections.delete(clientId);
    }
  }
}

/**
 * Broadcast an event to all connections for a client group
 */
export function broadcastToClient(
  clientId: string,
  event: string,
  data: unknown
) {
  const userConnections = connections.get(clientId);
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
    cleanupConnection(clientId, controller);
  }
}

/**
 * Broadcast a note creation event
 */
export function broadcastNoteCreated(clientId: string, note: unknown) {
  broadcastToClient(clientId, "note_created", { note });
}

/**
 * Broadcast a note update event
 */
export function broadcastNoteUpdated(clientId: string, note: unknown) {
  broadcastToClient(clientId, "note_updated", { note });
}

/**
 * Broadcast a note deletion event
 */
export function broadcastNoteDeleted(clientId: string, noteId: string) {
  broadcastToClient(clientId, "note_deleted", { noteId });
}

/**
 * Broadcast a sync completion event
 */
export function broadcastSyncComplete(clientId: string, timestamp: number) {
  broadcastToClient(clientId, "sync_complete", { timestamp });
}
