import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "./db";
import { getEnvVar, getBaseURL } from "./env";

/**
 * Better Auth configuration
 * OAuth and session management
 */

// Validate required OAuth credentials
const googleClientId = getEnvVar("GOOGLE_CLIENT_ID");
const googleClientSecret = getEnvVar("GOOGLE_CLIENT_SECRET");
const githubClientId = getEnvVar("GITHUB_CLIENT_ID");
const githubClientSecret = getEnvVar("GITHUB_CLIENT_SECRET");
const betterAuthSecret = getEnvVar("BETTER_AUTH_SECRET");

/**
 * Auth configuration with lazy database initialization
 * Suitable for serverless environments like Vercel
 */
export const auth = betterAuth({
  database: drizzleAdapter(getDb(), {
    provider: "pg",
  }),
  
  // OAuth providers
  socialProviders: {
    google: {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    },
    github: {
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    },
  },
  
  // Cookie configuration
  advanced: {
    cookiePrefix: "notes_app",
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  
  // Session configuration
  session: {
    // Session expires in 7 days
    expiresIn: 60 * 60 * 24 * 7,
    // Update session every day
    updateAge: 60 * 60 * 24,
  },
  
  // App base URL for callbacks
  appOptions: {
    baseURL: getBaseURL(),
  },
  
  // Secret for encryption
  secret: betterAuthSecret,
});

/**
 * Get OAuth redirect URLs for configuration
 * Use these when setting up OAuth providers
 */
export function getOAuthRedirectUrls(): {
  google: string;
  github: string;
} {
  const baseURL = getBaseURL();
  
  return {
    google: `${baseURL}/api/auth/callback/google`,
    github: `${baseURL}/api/auth/callback/github`,
  };
}

/**
 * Print OAuth configuration helper
 * Run this to see what URLs to configure in OAuth providers
 */
export function printOAuthConfig(): void {
  const urls = getOAuthRedirectUrls();
  
  console.log("\n📋 OAuth Configuration");
  console.log("======================\n");
  console.log(`Base URL: ${getBaseURL()}\n`);
  console.log("Google OAuth:");
  console.log(`  Authorized redirect URI: ${urls.google}\n`);
  console.log("GitHub OAuth:");
  console.log(`  Authorization callback URL: ${urls.github}\n`);
  console.log("======================\n");
}

// Print config on module load in development
if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
  printOAuthConfig();
}
