/**
 * Environment variable validation and types
 * Ensures all required variables are set before app starts
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;

const optionalEnvVars = [
  "NEXT_PUBLIC_AUTH_URL",
  "NODE_ENV",
  "VERCEL_URL",
] as const;

type RequiredEnvVar = (typeof requiredEnvVars)[number];
type OptionalEnvVar = (typeof optionalEnvVars)[number];

/**
 * Validate that all required environment variables are set
 * Call this early in app initialization
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing
        .map((v) => `  - ${v}`)
        .join("\n")}\n\n` +
        `Please check your .env.local file or environment configuration.\n` +
        `See SETUP.md for more information.`
    );
  }
}

/**
 * Get environment variable with type safety
 * Throws if required variable is missing
 */
export function getEnvVar(name: RequiredEnvVar): string;
export function getEnvVar(name: OptionalEnvVar): string | undefined;
export function getEnvVar(name: string): string | undefined {
  const value = process.env[name];

  if (requiredEnvVars.includes(name as RequiredEnvVar) && !value) {
    throw new Error(
      `Required environment variable "${name}" is not set.\n` +
        `Please add it to your .env.local file or environment configuration.`
    );
  }

  return value;
}

/**
 * Get the base URL for the application
 * Automatically detects Vercel deployment or uses local config
 */
export function getBaseURL(): string {
  // Vercel production URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Vercel preview URL
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }

  // Custom configured URL
  if (process.env.NEXT_PUBLIC_AUTH_URL) {
    return process.env.NEXT_PUBLIC_AUTH_URL;
  }

  // Local development fallback
  return "http://localhost:3000";
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running on Vercel
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL || !!process.env.VERCEL_URL;
}

/**
 * Validate environment on module load (server-side only)
 * Skips validation during build to prevent errors
 */
if (typeof window === "undefined" && process.env.SKIP_ENV_VALIDATION !== "true") {
  // Don't validate during Next.js build phase
  if (!process.env.NEXT_PHASE) {
    try {
      validateEnv();
    } catch (error) {
      // Log warning but don't crash during development
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️  Environment validation warning:");
        console.warn((error as Error).message);
        console.warn("\nSome features may not work correctly.\n");
      } else {
        // In production, throw the error
        throw error;
      }
    }
  }
}
