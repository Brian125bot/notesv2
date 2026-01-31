import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createRedisSubscriber } from "@/lib/redis";
import { formatSSEMessage } from "@/lib/sse";

// Heartbeat interval (30 seconds)
const HEARTBEAT_INTERVAL = 30000;

/**
 * SSE Endpoint for real-time note updates
 * Clients connect here to receive live updates when notes change
 * Uses Redis Pub/Sub for scalability and Vercel compatibility
 */
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const subscriber = createRedisSubscriber();
    let heartbeat: NodeJS.Timeout | null = null;

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          formatSSEMessage("connected", {
            userId,
            timestamp: Date.now(),
          })
        );

        // Subscribe to user's channel
        const channel = `user:${userId}:updates`;
        try {
          await subscriber.subscribe(channel);

          subscriber.on("message", (subChannel, message) => {
            if (subChannel === channel) {
              try {
                const { event, data } = JSON.parse(message);
                controller.enqueue(formatSSEMessage(event, data));
              } catch (err) {
                console.error("Failed to parse Redis message:", err);
              }
            }
          });
        } catch (err) {
          console.error("Failed to subscribe to Redis channel:", err);
          controller.error(err);
          return;
        }

        // Set up heartbeat to keep connection alive
        heartbeat = setInterval(() => {
          try {
            controller.enqueue(formatSSEMessage("ping", { timestamp: Date.now() }));
          } catch {
            // Connection closed, cleanup handled by cancel()
            if (heartbeat) clearInterval(heartbeat);
          }
        }, HEARTBEAT_INTERVAL);

        // Handle client disconnect via AbortSignal
        req.signal.addEventListener("abort", () => {
          if (heartbeat) clearInterval(heartbeat);
          subscriber.quit().catch(() => {}); // Best effort cleanup
        });
      },
      cancel() {
        if (heartbeat) clearInterval(heartbeat);
        subscriber.quit().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        // Important for Vercel buffering
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
