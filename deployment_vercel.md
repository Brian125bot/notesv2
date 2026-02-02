# 🚀 Vercel Deployment Guide: Notes App

This guide outlines the steps to deploy the offline-first Notes App to Vercel, ensuring a secure, performant, and production-ready environment.

## 1. Prerequisites

Before starting, ensure you have:
-   **Vercel Account:** [Sign up here](https://vercel.com).
-   **Neon Database:** A production Neon project [created here](https://neon.tech).
-   **GitHub Repository:** The project pushed to a GitHub repository.
-   **OAuth Credentials:** Client IDs and Secrets for Google and GitHub.

## 2. Database Preparation (Neon)

Since this app uses a serverless PostgreSQL database (Neon), you must apply schema migrations **before** the application goes live to ensure the database matches the application logic.

### 2.1 Get Connection String
1.  Go to your Neon Console.
2.  Select your project.
3.  Copy the **Connection String**.
    *   *Tip:* Use the **pooled** connection string (usually port 5432 or 6543) if available, though the HTTP driver used in this project handles connections efficiently.

### 2.2 Apply Migrations (Run Locally)
It is safest to run migrations from your local machine to the production database to verify success before deployment.

1.  Open your terminal in the project root.
2.  Navigate to the app directory:
    ```bash
    cd my-app
    ```
3.  Run the migration command using your **Production** Neon connection string:
    ```bash
    DATABASE_URL='postgres://user:pass@ep-xyz.region.neon.tech/neondatabase?sslmode=require' npx drizzle-kit migrate
    ```
4.  **Verify:** Check your Neon dashboard tables to ensure `notes`, `labels`, etc., exist and `notes` has the `search_vector` column and `idx_notes_search` index.

## 3. Vercel Project Configuration

1.  **Import Project:**
    -   Go to the Vercel Dashboard.
    -   Click **"Add New..."** -> **"Project"**.
    -   Import your GitHub repository.

2.  **Configure Settings:**
    -   **Root Directory:** `my-app` (Important: The Next.js app is in this subdirectory).
    -   **Framework Preset:** Next.js.
    -   **Build Command:** `npm run build` (Default).
    -   **Install Command:** `npm install` (Default).

## 4. Environment Variables

Go to the **"Environment Variables"** section in the Vercel project setup and add the following keys.

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Production Connection String | `postgres://user:pass@...` |

## 5. Deployment

1.  Click **"Deploy"**.
2.  Vercel will install dependencies, build the Next.js app, and deploy functions.
3.  **Build Verification:** Watch the logs. Ensure `Compiled successfully` appears.

## 6. Post-Deployment Configuration

Once the deployment is live (e.g., `https://notes-app-xyz.vercel.app`):

### 6.1 Verify Features
1.  **Sync:** Create a note. Refresh the page. Ensure it persists.
2.  **Search:** Try the search bar. This verifies the `tsvector` column and GIN index are working on the production DB.
3.  **Offline:** Turn off network (in DevTools), create a note, turn network back on. Verify it syncs.

## 7. Performance & Optimization Tips

-   **Cold Starts:** The app uses `@neondatabase/serverless` (HTTP), which is optimized for serverless. However, the first request after idle time might be slightly slower.
-   **Region Sync:** Ensure your Vercel Function Region (e.g., `iad1` - Washington, D.C.) matches your Neon Database Region (e.g., `aws-us-east-1`). This minimizes database latency.
    -   *Check:* Vercel Settings -> Functions -> Region.
-   **Caching:** This app uses `next-pwa`. Vercel automatically respects Next.js caching headers. Ensure `sw.js` is loading correctly to enable offline capabilities.

## 8. Troubleshooting

-   **"Relation does not exist"**: You skipped Step 2.2 (Migrations). Run `drizzle-kit migrate`.
-   **"Redirect mismatch"**: You forgot Step 6.1 (OAuth Callbacks).
-   **Build Failures**: Check the Vercel logs. Common issues are `navigator` access in SSR (fixed in latest code) or missing Type definitions (fixed in latest code).

---
**Status:** Ready to Deploy 🚀
