import Redis from "ioredis";
import { getEnvVar } from "./env";

// Shared Redis client for publishing
// Lazy initialization for serverless
let publisher: Redis | null = null;

export function getRedisPublisher() {
  if (!publisher) {
    const redisUrl = getEnvVar("REDIS_URL");
    publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null; // Stop retrying
        return Math.min(times * 50, 2000);
      },
    });

    publisher.on("error", (err) => {
      console.error("Redis publisher error:", err);
    });
  }
  return publisher;
}

// Create a new Redis client for subscribing
// Subscribers cannot be shared and must handle their own lifecycle
export function createRedisSubscriber() {
  const redisUrl = getEnvVar("REDIS_URL");
  const subscriber = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Subscribers should retry indefinitely or handle errors
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  subscriber.on("error", (err) => {
    console.error("Redis subscriber error:", err);
  });

  return subscriber;
}
