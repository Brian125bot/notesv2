import { getRedisPublisher } from "./redis";

/**
 * Server-Sent Events (SSE) Logic
 * Manages active connections and broadcasting events using Redis Pub/Sub
 * Compatible with Vercel Serverless environment
 */

/**
 * Format a message for SSE
 */
export function formatSSEMessage(event: string, data: unknown): Uint8Array {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(message);
}

/**
 * Broadcast an event to all connections for a user via Redis
 */
export async function broadcastToUser(
  userId: string,
  event: string,
  data: unknown
) {
  try {
    const publisher = getRedisPublisher();
    const message = JSON.stringify({ event, data });
    await publisher.publish(`user:${userId}:updates`, message);
  } catch (error) {
    console.error(`Failed to broadcast event ${event} to user ${userId}:`, error);
  }
}

/**
 * Broadcast a note creation event
 */
export async function broadcastNoteCreated(userId: string, note: unknown) {
  await broadcastToUser(userId, "note_created", { note });
}

/**
 * Broadcast a note update event
 */
export async function broadcastNoteUpdated(userId: string, note: unknown) {
  await broadcastToUser(userId, "note_updated", { note });
}

/**
 * Broadcast a note deletion event
 */
export async function broadcastNoteDeleted(userId: string, noteId: string) {
  await broadcastToUser(userId, "note_deleted", { noteId });
}

/**
 * Broadcast a sync completion event
 */
export async function broadcastSyncComplete(userId: string, timestamp: number) {
  await broadcastToUser(userId, "sync_complete", { timestamp });
}
