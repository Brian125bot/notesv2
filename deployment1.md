# Deployment Checklist: Step 1 - Database Schema Alignment

This document outlines the critical steps to resolve the "Schema Drift" identified in the production readiness review. The goal is to synchronize the Drizzle ORM schema with the actual PostgreSQL features (Full-Text Search) being used in the codebase.

## 1. Schema Update (`db/schema.ts`)
The ORM is currently unaware of the `search_vector` column used in `app/api/search/route.ts`.

- [ ] **Define `tsvector` Type:** Add a custom type definition for PostgreSQL's `tsvector` if not natively supported by the current Drizzle version.
- [ ] **Add `searchVector` Column:** Add the column to the `notes` table definition.
- [ ] **Add GIN Index:** Add a Generalized Inverted Index (GIN) on the `search_vector` column for high-performance search.

### Implementation Snippet:
```typescript
import { customType, index } from "drizzle-orm/pg-core";

// Define tsvector custom type
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const notes = pgTable("notes", {
  // ... existing columns
  searchVector: tsvector("search_vector"),
}, (table) => ({
  searchIndex: index("idx_notes_search").using("gin", table.searchVector),
}));
```

## 2. Migration Management
Since the database might already have these columns from manual Phase 3 setup, we need to reconcile the state.

- [ ] **Generate Migration:** Run `npx drizzle-kit generate` to create a new migration file.
- [ ] **Review Migration:** Check the generated SQL. If the column already exists in your Neon production/dev branch, you may need to use `drizzle-kit introspect` or manually flag the migration as completed.
- [ ] **Manage Triggers:** Drizzle Kit does not track PostgreSQL triggers. Ensure the `note_search_update` trigger is documented in a `migrations/triggers.sql` file or included in your deployment script.

## 3. Trigger & Function Verification
The search API relies on the `search_vector` being automatically updated.

- [ ] **Check Function:** Verify `update_note_search_vector()` exists in the database.
- [ ] **Check Trigger:** Verify the trigger is active on the `notes` table.
- [ ] **Manual Refresh:** If adding this to existing data, run a one-time update:
  ```sql
  UPDATE notes SET search_vector = 
    setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
    setweight(to_tsvector('english', coalesce(content, '')), 'B');
  ```

## 4. Environment Validation
- [ ] **DATABASE_URL:** Confirm the connection string in production has sufficient permissions to create indexes and triggers (Owner/Admin permissions).
- [ ] **Neon Branching:** If using Neon, test this migration on a temporary branch before applying to `main`.

## 5. Verification Steps
- [ ] **Run Type Check:** `npx tsc --noEmit` to ensure Drizzle's generated types match the API usage.
- [ ] **Test API:** Execute a GET request to `/api/search?q=test` and verify it returns a 200 OK without "column does not exist" errors.
- [ ] **Explain Query:** Run an `EXPLAIN` on the search query to ensure the GIN index is actually being utilized.

---
**Status:** ⏳ Pending Implementation
**Assigned to:** Full Stack Developer
