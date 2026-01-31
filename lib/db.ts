import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

/**
 * Database connection management
 * Uses lazy initialization for serverless compatibility (Vercel)
 */

type DatabaseInstance = NeonHttpDatabase<typeof schema>;

// Module-level cache for database instance
let dbInstance: DatabaseInstance | null = null;
let sqlInstance: NeonQueryFunction<false, false> | null = null;

/**
 * Get or create the database connection
 * Lazy initialization for serverless environments
 */
export function getDb(): DatabaseInstance {
  // Return cached instance if available
  if (dbInstance) {
    return dbInstance;
  }

  // Validate DATABASE_URL is set
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not set.\n" +
        "Please add your Neon database connection string to .env.local"
    );
  }

  // Create new connection
  try {
    sqlInstance = neon(databaseUrl);
    dbInstance = drizzle(sqlInstance, { schema });
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database connection:", error);
    throw new Error(
      `Database connection failed: ${(error as Error).message}\n` +
        `Please check your DATABASE_URL configuration.`
    );
  }
}

/**
 * Reset the database connection
 * Useful for testing or when connection needs to be refreshed
 */
export function resetDb(): void {
  dbInstance = null;
  sqlInstance = null;
}

/**
 * Check if database is connected
 */
export function isDbConnected(): boolean {
  return dbInstance !== null;
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use getDb() for new code
 */
export const db = getDb();

/**
 * Database connection configuration
 * Optimized for serverless environments
 */
export const dbConfig = {
  // Connection pooling settings for Neon
  poolSize: process.env.VERCEL ? 1 : 10,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
  
  // Query timeout
  queryTimeout: 30000, // 30 seconds
};

/**
 * Execute database query with retry logic
 * Useful for handling transient connection errors
 */
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  retries = dbConfig.maxRetries
): Promise<T> {
  try {
    return await queryFn();
  } catch (error) {
    // Retry on connection errors
    if (
      retries > 0 &&
      (error as Error).message?.includes("connection")
    ) {
      console.warn(`Database query failed, retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, dbConfig.retryDelay));
      return queryWithRetry(queryFn, retries - 1);
    }
    throw error;
  }
}

/**
 * Health check for database connection
 */
export async function checkDbHealth(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = Date.now();
  
  try {
    const db = getDb();
    // Simple query to test connection
    await db.select({ id: schema.notes.id }).from(schema.notes).limit(1);
    
    return {
      connected: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      connected: false,
      latency: Date.now() - start,
      error: (error as Error).message,
    };
  }
}
