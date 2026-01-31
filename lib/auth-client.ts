"use client";

import { createAuthClient } from "better-auth/react";
import { getBaseURL } from "./env";

/**
 * Better Auth client for React components
 * Automatically detects the correct base URL
 */

const baseURL = getBaseURL();

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signOut, signUp, useSession } = authClient;

/**
 * Helper to get current auth state
 * Useful for server components
 */
export async function getSession() {
  try {
    const response = await fetch(`${baseURL}/api/auth/get-session`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error("Failed to get session:", error);
    return null;
  }
}
