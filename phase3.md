# Phase 3: Search, Labels, and Mobile Optimizations

## Overview
Phase 3 focuses on enhancing the user experience with powerful search capabilities, note organization through labels/tags, and mobile-first optimizations for a smooth native-like experience.

---

## 🎯 Objectives

1. **Full-Text Search** - Fast, intelligent search across all notes
2. **Labels System** - Organize notes with customizable tags
3. **Mobile Optimizations** - Touch gestures, pull-to-refresh, responsive design
4. **Dark Mode** - Complete dark theme support
5. **Performance** - Virtualization for large note collections
6. **UX Polish** - Animations, transitions, accessibility improvements

---

## 📋 Implementation Tasks

### 1. Full-Text Search

#### 1.1 Database Setup
**File:** Database migration

- [ ] Add `tsvector` column to notes table for full-text search
- [ ] Create GIN index on search vector for fast queries
- [ ] Set up PostgreSQL triggers to auto-update search index
- [ ] Create search ranking/scoring function

**SQL Changes:**
```sql
-- Add search vector column
ALTER TABLE notes ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_note_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER note_search_update
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_note_search_vector();
```

#### 1.2 Search API
**File:** `app/api/search/route.ts`

- [ ] Create search endpoint with query parameter
- [ ] Implement fuzzy search with trigram similarity
- [ ] Add search result highlighting
- [ ] Support advanced filters (by color, date range, archived)
- [ ] Implement search suggestions/autocomplete

**API Endpoints:**
```
GET /api/search?q=query&filters=color:yellow,archived:false
GET /api/search/suggestions?q=par
```

#### 1.3 Search UI
**Files:**
- `components/search/SearchBar.tsx` - Enhanced search input
- `components/search/SearchResults.tsx` - Results display
- `components/search/SearchFilters.tsx` - Filter chips

- [ ] Replace header search with full search component
- [ ] Real-time search as user types (debounced 300ms)
- [ ] Highlight matching text in results
- [ ] Search filters (color, date, archived status)
- [ ] Recent searches dropdown
- [ ] Empty state with suggestions

#### 1.4 Local Search (Offline)
**File:** `lib/search/localSearch.ts`

- [ ] Implement client-side search for offline mode
- [ ] Index notes in IndexedDB for fast querying
- [ ] Sync search index with server updates

---

### 2. Labels System

#### 2.1 Database Schema
**File:** `db/schema.ts` (enhance)

```sql
-- Labels table (already exists, enhance with)
- Add description field
- Add icon/emoji field
- Add sort_order for custom ordering

-- Junction table note_labels (already exists)
```

#### 2.2 Labels API
**File:** `app/api/labels/route.ts` (new)

- [ ] CRUD endpoints for labels
- [ ] Bulk add/remove labels from notes
- [ ] Get notes by label
- [ ] Label statistics (count per label)

**API Endpoints:**
```
GET    /api/labels
POST   /api/labels
PATCH  /api/labels/:id
DELETE /api/labels/:id
POST   /api/notes/:id/labels (add labels to note)
DELETE /api/notes/:id/labels/:labelId
```

#### 2.3 Labels UI Components
**Files:**
- `components/labels/LabelManager.tsx` - Create/edit labels
- `components/labels/LabelPicker.tsx` - Add labels to note
- `components/labels/LabelChip.tsx` - Display label badge
- `components/labels/LabelFilter.tsx` - Filter notes by label

- [ ] Label sidebar section
- [ ] Color picker for labels
- [ ] Drag-to-reorder labels
- [ ] Label chips on note cards
- [ ] Click label to filter notes

#### 2.4 Label-Note Integration
**Files:**
- `components/notes/NoteCard.tsx` (enhance)
- `components/notes/NoteEditor.tsx` (enhance)

- [ ] Show labels on note cards
- [ ] Add/remove labels in note editor
- [ ] Label autocomplete in editor

---

### 3. Mobile Optimizations

#### 3.1 Touch Gestures
**File:** `hooks/useTouchGestures.ts` (new)

- [ ] Swipe to archive/delete notes
- [ ] Pull-to-refresh
- [ ] Long-press for context menu
- [ ] Pinch to zoom (for images if added later)
- [ ] Swipe between views (notes ↔ archive)

#### 3.2 Pull-to-Refresh
**File:** `components/PullToRefresh.tsx` (new)

```typescript
// Features:
- Pull down gesture detection
- Loading spinner animation
- Trigger sync on release
- Elastic bounce effect
```

#### 3.3 Mobile Navigation
**File:** `components/MobileNav.tsx` (new)

- [ ] Bottom tab bar for mobile
- [ ] Hamburger menu for sidebar
- [ ] Floating Action Button (FAB) for new note
- [ ] Swipeable drawer for filters

#### 3.4 Responsive Improvements
**Files:** All component files

- [ ] Optimize masonry grid for mobile
- [ ] Full-screen note editor on mobile
- [ ] Touch-friendly button sizes (min 44px)
- [ ] Bottom sheets instead of modals
- [ ] Collapsible sidebar on small screens

---

### 4. Dark Mode

#### 4.1 Theme System
**File:** `lib/theme/theme-provider.tsx` (new)

- [ ] Theme context provider
- [ ] System preference detection
- [ ] LocalStorage persistence
- [ ] Theme toggle component

**Files:**
- `components/ThemeToggle.tsx` - Toggle button
- `app/globals.css` - Dark mode CSS variables

#### 4.2 CSS Variables
**File:** `app/globals.css` (enhance)

```css
:root {
  /* Light mode (existing) */
}

.dark {
  /* Dark mode overrides */
  --background: #1f2937;
  --foreground: #f3f4f6;
  /* Note colors in dark mode */
  --note-white: #374151;
  --note-yellow: #713f12;
  /* ... etc */
}
```

#### 4.3 Component Updates
All components need dark mode variants:

- [ ] Header - Dark background
- [ ] Sidebar - Dark theme
- [ ] Note cards - Adjust note colors for dark mode
- [ ] Editor - Dark background
- [ ] Modal/dialogs - Dark overlay

---

### 5. Performance Optimizations

#### 5.1 Virtualization
**File:** `components/VirtualizedNoteGrid.tsx` (new)

- [ ] Implement virtual scrolling for large note lists
- [ ] Windowing with react-window or @tanstack/react-virtual
- [ ] Dynamic item heights for masonry
- [ ] Preserve scroll position on refresh

#### 5.2 Image Optimization
**File:** `lib/image-utils.ts` (new)

- [ ] Lazy load images
- [ ] Blur placeholder effect
- [ ] Responsive image sizing

#### 5.3 Bundle Optimization
- [ ] Code splitting for routes
- [ ] Lazy load heavy components
- [ ] Tree-shaking unused code

---

### 6. UX Polish

#### 6.1 Animations
**File:** `lib/animations.ts` (new)

- [ ] Page transitions
- [ ] Note card enter/exit animations
- [ ] Modal/dialog animations
- [ ] Toast notifications
- [ ] Skeleton loading states

#### 6.2 Keyboard Shortcuts
**File:** `hooks/useKeyboardShortcuts.ts` (new)

```typescript
Shortcuts:
- Cmd/Ctrl + N     → New note
- Cmd/Ctrl + F     → Focus search
- Cmd/Ctrl + /     → Toggle sidebar
- Escape           → Close modal/editor
- Cmd/Ctrl + D     → Archive note
- Cmd/Ctrl + P     → Pin note
- Cmd/Ctrl + Shift + N → New note with current search
```

#### 6.3 Accessibility (a11y)
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation support
- [ ] Focus management in modals
- [ ] Screen reader announcements for sync status
- [ ] Reduced motion support

---

## 📁 Files to Create

### New Files
```
app/api/search/route.ts                # Search API endpoint
app/api/search/suggestions/route.ts    # Search suggestions
app/api/labels/route.ts                # Labels CRUD

components/search/
  ├── SearchBar.tsx                    # Main search component
  ├── SearchResults.tsx                # Results list
  ├── SearchFilters.tsx                # Filter chips
  └── HighlightText.tsx                # Text highlighting

components/labels/
  ├── LabelManager.tsx                 # Create/edit labels
  ├── LabelPicker.tsx                  # Add labels to notes
  ├── LabelChip.tsx                    # Label badge
  └── LabelFilter.tsx                  # Filter by label

components/
  ├── PullToRefresh.tsx                # Mobile pull gesture
  ├── MobileNav.tsx                    # Bottom nav for mobile
  ├── VirtualizedNoteGrid.tsx          # Performance virtualization
  ├── ThemeToggle.tsx                  # Dark mode toggle
  └── SkeletonCard.tsx                 # Loading placeholder

hooks/
  ├── useTouchGestures.ts              # Touch gesture handling
  ├── useKeyboardShortcuts.ts          # Keyboard shortcuts
  └── useTheme.ts                      # Theme management

lib/
  ├── search/
  │   ├── localSearch.ts               # Client-side search
  │   └── highlight.ts                 # Text highlighting
  ├── theme/
  │   ├── theme-provider.tsx           # Theme context
  │   └── theme-utils.ts               # Theme utilities
  └── animations.ts                    # Animation configs
```

### Modified Files
```
db/schema.ts                           # Add search vector, enhance labels
app/api/notes/route.ts                 # Add label handling
app/api/sync/route.ts                  # Sync labels
hooks/useNotes.ts                      # Add label operations
hooks/useSync.ts                       # Sync label changes
components/notes/NoteCard.tsx          # Show labels
components/notes/NoteEditor.tsx        # Add label picker
components/Header.tsx                  # Enhanced search
components/Sidebar.tsx                 # Add labels section
app/globals.css                        # Dark mode styles
app/layout.tsx                         # Theme provider
app/page.tsx                           # PullToRefresh, keyboard shortcuts
```

---

## 🗄️ Database Migrations

### Migration 1: Add Full-Text Search
```sql
-- Add search vector
ALTER TABLE notes ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX idx_notes_search ON notes USING GIN(search_vector);

-- Create trigger function
CREATE OR REPLACE FUNCTION update_note_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER note_search_update
BEFORE INSERT OR UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_note_search_vector();

-- Update existing notes
UPDATE notes SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(content, '')), 'B');
```

### Migration 2: Enhance Labels
```sql
-- Add fields to labels
ALTER TABLE labels ADD COLUMN description TEXT;
ALTER TABLE labels ADD COLUMN emoji TEXT DEFAULT '🏷️';
ALTER TABLE labels ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Create index for sorting
CREATE INDEX idx_labels_sort ON labels(user_id, sort_order);
```

---

## 🎨 UI/UX Design Notes

### Search Experience
```
┌─────────────────────────────────────────┐
│ 🔍 Search notes...              [✕] [⚙️] │
├─────────────────────────────────────────┤
│ Recent: work, ideas, meeting            │
├─────────────────────────────────────────┤
│ Filters: [All] [Yellow] [📌 Pinned]     │
├─────────────────────────────────────────┤
│ 3 results found:                        │
│                                         │
│ ┌──────────────┐  ┌──────────────┐     │
│ │ **Project**  │  │ Meeting      │     │
│ │ Plan for...  │  │ Notes about..│     │
│ └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────┘
```

### Labels Sidebar
```
┌──────────────┐
│ Notes        │
│ Archive      │
│ Trash        │
├──────────────┤
│ LABELS       │
│ 🏷️ Work (5)  │
│ 🏠 Home (3)  │
│ 💡 Ideas (8) │
│ [+ New Label]│
└──────────────┘
```

### Mobile Layout
```
┌──────────────┐
│ ≡ Notes  [👤]│
├──────────────┤
│ 🔍 Search... │
├──────────────┤
│ ┌──────────┐ │
│ │ Note 1   │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │ Note 2   │ │
│ └──────────┘ │
│      ...     │
├──────────────┤
│ [📝] [🏷️] [⚙️]│  ← Bottom nav
└──────────────┘
```

---

## 📱 Mobile-First Features

### Touch Gestures
| Gesture | Action |
|---------|--------|
| Pull down | Refresh/sync |
| Swipe left | Archive note |
| Swipe right | Pin/unpin note |
| Long press | Context menu |
| Double tap | Quick edit |

### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  /* Single column, bottom nav, FAB */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* 2 columns, sidebar collapsible */
}

/* Desktop */
@media (min-width: 1025px) {
  /* 3-4 columns, full sidebar */
}
```

---

## 🧪 Testing Checklist

### Search
- [ ] Search returns relevant results
- [ ] Highlighting works correctly
- [ ] Filters apply properly
- [ ] Search suggestions appear
- [ ] Works offline with local index

### Labels
- [ ] Create label
- [ ] Assign label to note
- [ ] Filter notes by label
- [ ] Delete label
- [ ] Label syncs across devices

### Mobile
- [ ] Pull-to-refresh triggers sync
- [ ] Swipe gestures work
- [ ] Bottom nav accessible
- [ ] Touch targets 44px+
- [ ] Virtual scroll smooth

### Dark Mode
- [ ] Toggle switches theme
- [ ] All components styled
- [ ] Note colors visible
- [ ] Persists across sessions
- [ ] Respects system preference

### Performance
- [ ] Smooth scroll with 100+ notes
- [ ] Search < 100ms
- [ ] No layout shift
- [ ] Works on low-end devices

---

## 🚀 Post-Phase 3 Checklist

Phase 3 is complete when:
1. ✅ Search is fast and accurate
2. ✅ Labels organize notes effectively
3. ✅ Mobile experience feels native
4. ✅ Dark mode works everywhere
5. ✅ Performance is smooth with large datasets
6. ✅ All keyboard shortcuts work
7. ✅ Accessibility audit passes

---

## 🎯 Success Metrics

| Metric | Target |
|--------|--------|
| Search Latency | < 50ms |
| Mobile Lighthouse Score | > 90 |
| Time to Interactive | < 3s |
| Note Scroll FPS | 60fps |
| Accessibility Score | 100 |

---

## 📚 Resources

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)

---

## 🎉 Ready for Phase 3?

Phase 3 transforms the app from functional to polished, with enterprise-grade UX and mobile-native feel.

**Estimated Time:** 2-3 sessions
**Complexity:** Medium-High
**Impact:** High user satisfaction
