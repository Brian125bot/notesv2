# Phase 4: Collaboration, Rich Media & AI Features

## Overview
Phase 4 transforms the notes app from a personal tool into a collaborative platform with rich media support and AI-powered productivity features.

---

## 🎯 Objectives

1. **Note Collaboration** - Share notes with others, real-time collaborative editing
2. **Rich Media Support** - Images, attachments, voice notes, sketches
3. **AI Integration** - Smart suggestions, auto-categorization, summarization
4. **Advanced Organization** - Folders, nested labels, note linking
5. **Productivity Features** - Reminders, recurring notes, templates
6. **Data Portability** - Import/export, backup, migration tools

---

## 📋 Implementation Tasks

### 1. Note Sharing & Collaboration

#### 1.1 Share System
**Files:**
- `app/api/shares/route.ts` - Share management API
- `app/api/collaboration/route.ts` - Real-time collaboration
- `components/share/ShareDialog.tsx` - Share UI
- `components/share/ShareManager.tsx` - Manage shared notes
- `components/collaboration/CursorPresence.tsx` - Show other users' cursors
- `hooks/useCollaboration.ts` - Collaboration hook

**Features:**
- [ ] Generate share links (view/edit permissions)
- [ ] Email invitations to collaborators
- [ ] Permission levels (viewer, commenter, editor)
- [ ] Real-time collaborative editing (CRDT-based)
- [ ] Presence indicators (who's viewing/editing)
- [ ] Activity feed (who changed what)
- [ ] Comments and mentions (@username)

**Database Schema:**
```sql
CREATE TABLE note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID, -- null = public link
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit')),
  token TEXT UNIQUE, -- for public links
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  position JSONB, -- {x, y} or selection range
  parent_id UUID REFERENCES note_comments(id), -- threaded replies
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE collaboration_cursors (
  note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  position JSONB,
  selection JSONB,
  last_seen TIMESTAMP DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);
```

#### 1.2 WebSocket Collaboration
**File:** `app/api/ws/route.ts`

- [ ] Upgrade SSE to WebSocket for bidirectional sync
- [ ] Operational Transform or CRDT for conflict-free editing
- [ ] Cursor position sharing
- [ ] Selection highlighting

---

### 2. Rich Media Support

#### 2.1 Image Attachments
**Files:**
- `app/api/upload/route.ts` - Image upload handler
- `components/editor/ImageUploader.tsx` - Image upload UI
- `components/editor/ImageGallery.tsx` - Display images in notes
- `lib/upload/storage.ts` - Storage abstraction (S3/Cloudflare R2)

**Features:**
- [ ] Drag-and-drop image upload
- [ ] Copy-paste images from clipboard
- [ ] Image resizing and cropping
- [ ] Gallery/grid view for multiple images
- [ ] Lazy loading with blur placeholder
- [ ] OCR for text extraction from images

**Database Schema:**
```sql
CREATE TABLE note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  ocr_text TEXT, -- extracted text from image
  position INTEGER, -- order in note
  created_at TIMESTAMP DEFAULT now()
);
```

#### 2.2 Voice Notes
**Files:**
- `components/recorder/VoiceRecorder.tsx` - Audio recording UI
- `app/api/transcribe/route.ts` - Speech-to-text API
- `hooks/useVoiceRecorder.ts` - Recording hook

**Features:**
- [ ] Record audio directly in browser
- [ ] Automatic transcription (Whisper API)
- [ ] Playback controls (speed, skip)
- [ ] Waveform visualization

#### 2.3 Drawing/Sketching
**Files:**
- `components/draw/DrawingCanvas.tsx` - Drawing component
- `components/draw/DrawingToolbar.tsx` - Drawing tools
- `hooks/useDrawing.ts` - Drawing hook

**Features:**
- [ ] Freehand drawing with stylus/mouse
- [ ] Shape tools (rectangle, circle, arrow)
- [ ] Text on canvas
- [ ] Export as image

#### 2.4 Rich Text Editor
**Files:**
- `components/editor/RichTextEditor.tsx` - WYSIWYG editor
- `lib/editor/extensions.ts` - Editor extensions

**Features:**
- [ ] Markdown support
- [ ] Checklists/todos with progress
- [ ] Code blocks with syntax highlighting
- [ ] Tables
- [ ] Math equations (KaTeX)
- [ ] Embeds (YouTube, Figma, etc.)

---

### 3. AI-Powered Features

#### 3.1 Smart Organization
**Files:**
- `app/api/ai/categorize/route.ts` - Auto-categorization
- `app/api/ai/summarize/route.ts` - Note summarization
- `components/ai/SmartSuggestions.tsx` - AI suggestions UI

**Features:**
- [ ] Auto-suggest labels based on content
- [ ] Smart folder suggestions
- [ ] Duplicate detection and merging
- [ ] Related notes suggestions
- [ ] Automatic tagging from content

#### 3.2 AI Writing Assistant
**Files:**
- `app/api/ai/rewrite/route.ts` - Text rewriting
- `app/api/ai/complete/route.ts` - Auto-complete
- `components/ai/AIAssistant.tsx` - AI assistant panel

**Features:**
- [ ] Grammar and style suggestions
- [ ] Rewrite options (formal, casual, concise)
- [ ] Auto-complete sentences
- [ ] Generate title from content
- [ ] Bullet point expansion
- [ ] Translation

#### 3.3 Smart Search
**Files:**
- `app/api/ai/semantic-search/route.ts` - Vector similarity search
- `lib/ai/embeddings.ts` - Text embedding utilities

**Features:**
- [ ] Semantic search (meaning-based, not just keyword)
- [ ] Natural language queries ("find my meeting notes from last week")
- [ ] Image search by description
- [ ] Ask questions about your notes (RAG)

**Implementation:**
- Vector embeddings using OpenAI or local model
- pgvector extension for PostgreSQL
- Similarity search with cosine distance

---

### 4. Advanced Organization

#### 4.1 Folders/Notebooks
**Files:**
- `app/api/folders/route.ts` - Folder CRUD
- `components/folders/FolderTree.tsx` - Folder navigation
- `components/folders/FolderManager.tsx` - Folder management

**Features:**
- [ ] Nested folders (tree structure)
- [ ] Drag-and-drop notes between folders
- [ ] Folder sharing
- [ ] Folder templates

#### 4.2 Note Linking (Wiki-style)
**Files:**
- `components/editor/LinkSuggestions.tsx` - Note linking UI
- `app/api/graph/route.ts` - Note graph data
- `components/graph/NoteGraph.tsx` - Visual graph of linked notes

**Features:**
- [ ] `[[Note Title]]` syntax for linking
- [ ] Backlinks panel (notes that link to this one)
- [ ] Graph view of all note connections
- [ ] Unlinked mentions detection

#### 4.3 Note Templates
**Files:**
- `app/api/templates/route.ts` - Template management
- `components/templates/TemplateGallery.tsx` - Template browser
- `components/templates/TemplateEditor.tsx` - Create templates

**Built-in Templates:**
- Daily journal
- Meeting notes
- Project planning
- Book notes
- Recipe
- Travel itinerary

---

### 5. Productivity Features

#### 5.1 Reminders
**Files:**
- `app/api/reminders/route.ts` - Reminder CRUD
- `app/api/reminders/trigger/route.ts` - Scheduled notifications
- `components/reminders/ReminderPicker.tsx` - Set reminder UI
- `lib/notifications/push.ts` - Push notification service

**Features:**
- [ ] One-time and recurring reminders
- [ ] Push notifications (web + mobile)
- [ ] Email reminders
- [ ] Location-based reminders (when near a place)
- [ ] Snooze options

**Database:**
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  recurring TEXT, -- cron expression or null
  message TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

#### 5.2 Recurring Notes
**Files:**
- `components/recurring/RecurringSettings.tsx` - Recurrence UI

**Features:**
- [ ] Daily/weekly/monthly recurring notes
- [ ] Custom schedules (every Monday and Friday)
- [ ] Auto-create from templates

#### 5.3 Tasks & Checklists
**Files:**
- `components/tasks/TaskList.tsx` - Task management
- `app/api/tasks/route.ts` - Task API

**Features:**
- [ ] Convert any note to task list
- [ ] Due dates and priorities
- [ ] Subtasks
- [ ] Progress bars
- [ ] Task views (today, upcoming, completed)

---

### 6. Data Portability

#### 6.1 Import/Export
**Files:**
- `app/api/export/route.ts` - Export functionality
- `app/api/import/route.ts` - Import functionality
- `components/export/ExportDialog.tsx` - Export UI
- `components/import/ImportDialog.tsx` - Import UI

**Formats:**
- [ ] Markdown (with frontmatter)
- [ ] JSON (full data export)
- [ ] HTML
- [ ] PDF
- [ ] Google Keep import
- [ ] Apple Notes import
- [ ] Notion import
- [ ] Evernote (ENEX) import

#### 6.2 Backup & Sync
**Files:**
- `app/api/backup/route.ts` - Backup management
- `lib/backup/scheduler.ts` - Automated backups

**Features:**
- [ ] Automatic daily backups
- [ ] Version history (note revisions)
- [ ] Point-in-time restore
- [ ] Cross-device sync status

---

## 📁 Files to Create

### New API Routes
```
app/api/
├── shares/route.ts
├── collaboration/route.ts
├── comments/route.ts
├── ws/route.ts                    # WebSocket upgrade
├── upload/route.ts
├── transcribe/route.ts
├── ai/
│   ├── categorize/route.ts
│   ├── summarize/route.ts
│   ├── rewrite/route.ts
│   ├── complete/route.ts
│   └── semantic-search/route.ts
├── folders/route.ts
├── templates/route.ts
├── reminders/route.ts
├── reminders/trigger/route.ts
├── tasks/route.ts
├── export/route.ts
├── import/route.ts
├── backup/route.ts
└── graph/route.ts
```

### New Components
```
components/
├── share/
│   ├── ShareDialog.tsx
│   ├── ShareManager.tsx
│   └── ShareLinkCard.tsx
├── collaboration/
│   ├── CursorPresence.tsx
│   ├── UserAvatars.tsx
│   └── ActivityFeed.tsx
├── editor/
│   ├── RichTextEditor.tsx
│   ├── ImageUploader.tsx
│   ├── ImageGallery.tsx
│   └── LinkSuggestions.tsx
├── recorder/
│   ├── VoiceRecorder.tsx
│   └── AudioPlayer.tsx
├── draw/
│   ├── DrawingCanvas.tsx
│   └── DrawingToolbar.tsx
├── ai/
│   ├── SmartSuggestions.tsx
│   ├── AIAssistant.tsx
│   └── AISummaryCard.tsx
├── folders/
│   ├── FolderTree.tsx
│   ├── FolderManager.tsx
│   └── BreadcrumbNav.tsx
├── templates/
│   ├── TemplateGallery.tsx
│   └── TemplateEditor.tsx
├── reminders/
│   ├── ReminderPicker.tsx
│   └── ReminderList.tsx
├── tasks/
│   ├── TaskList.tsx
│   └── TaskItem.tsx
├── export/
│   └── ExportDialog.tsx
├── import/
│   └── ImportDialog.tsx
└── graph/
    └── NoteGraph.tsx
```

### New Hooks & Libraries
```
hooks/
├── useCollaboration.ts
├── useVoiceRecorder.ts
├── useDrawing.ts
├── useRichEditor.ts
└── useAIAssistant.ts

lib/
├── upload/
│   └── storage.ts
├── ai/
│   ├── openai.ts
│   ├── embeddings.ts
│   └── prompts.ts
├── editor/
│   └── extensions.ts
├── notifications/
│   └── push.ts
└── backup/
    └── scheduler.ts
```

---

## 🗄️ Database Migrations

### Migration 1: Sharing & Collaboration
```sql
-- Note shares
CREATE TABLE note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with UUID,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit')),
  token TEXT UNIQUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Comments
CREATE TABLE note_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  position JSONB,
  parent_id UUID REFERENCES note_comments(id),
  created_at TIMESTAMP DEFAULT now()
);

-- Collaboration cursors
CREATE TABLE collaboration_cursors (
  note_id UUID NOT NULL,
  user_id UUID NOT NULL,
  position JSONB,
  selection JSONB,
  last_seen TIMESTAMP DEFAULT now(),
  PRIMARY KEY (note_id, user_id)
);
```

### Migration 2: Media & Attachments
```sql
CREATE TABLE note_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  ocr_text TEXT,
  position INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_attachments_note ON note_attachments(note_id);
```

### Migration 3: Folders & Organization
```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES folders(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Add folder_id to notes
ALTER TABLE notes ADD COLUMN folder_id UUID REFERENCES folders(id);

CREATE INDEX idx_folders_user ON folders(user_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
```

### Migration 4: Reminders & Tasks
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  remind_at TIMESTAMP NOT NULL,
  recurring TEXT,
  message TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  due_date TIMESTAMP,
  priority TEXT DEFAULT 'medium',
  parent_id UUID REFERENCES tasks(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_reminders_user ON reminders(user_id, remind_at);
CREATE INDEX idx_tasks_note ON tasks(note_id);
```

### Migration 5: AI & Vector Search
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Note embeddings for semantic search
CREATE TABLE note_embeddings (
  note_id UUID PRIMARY KEY REFERENCES notes(id) ON DELETE CASCADE,
  embedding vector(1536), -- OpenAI embedding dimension
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_note_embeddings ON note_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 🔧 Technical Requirements

### External Services
- **OpenAI API** - For AI features (categorization, summarization, embeddings)
- **Cloudflare R2 / AWS S3** - For image storage
- **Redis** - For WebSocket pub/sub and caching
- **Firebase Cloud Messaging** - For push notifications
- **Whisper API** - For voice transcription

### New Dependencies
```bash
# Collaboration
npm install yjs y-socket.io y-indexeddb

# Rich text editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder

# AI
npm install openai ai

# Vector search
npm install pgvector

# File upload
npm install @aws-sdk/client-s3

# Push notifications
npm install web-push firebase-admin

# Drawing
npm install react-canvas-draw perfect-freehand

# Audio
npm install react-media-recorder
```

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] AI prompt templates
- [ ] File upload utilities
- [ ] Permission checks

### Integration Tests
- [ ] Real-time collaboration
- [ ] Import/export roundtrip
- [ ] WebSocket connections

### E2E Tests
- [ ] Share flow
- [ ] Collaborative editing
- [ ] Voice recording
- [ ] Reminder notifications

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Collaboration Latency | < 50ms |
| AI Response Time | < 2s |
| Image Upload | < 5s for 10MB |
| Search Accuracy | > 90% relevance |
| WebSocket Uptime | 99.9% |

---

## 🚀 Deployment Considerations

### Infrastructure
- **Redis cluster** - For real-time features
- **WebSocket servers** - Horizontal scaling with sticky sessions
- **CDN** - For image delivery
- **Queue system** - For background AI processing

### Security
- [ ] File upload validation and scanning
- [ ] Rate limiting on AI endpoints
- [ ] Share token rotation
- [ ] Content moderation for shared notes

---

## 💰 Cost Estimates

| Service | Monthly Cost (est.) |
|---------|---------------------|
| OpenAI API | $50-200 |
| File Storage | $10-50 |
| Redis Cloud | $20-80 |
| Push Notifications | Free - $25 |
| **Total** | **$80-355/month** |

---

## 🎯 Phase 4 Completion Criteria

Phase 4 is complete when:
1. ✅ Users can share notes with others
2. ✅ Real-time collaborative editing works
3. ✅ Images and voice notes are supported
4. ✅ AI features provide value (not just gimmicks)
5. ✅ Notes can be organized in folders
6. ✅ Users get reminders on time
7. ✅ Data can be imported/exported easily
8. ✅ Performance remains excellent with all features

---

## 🔮 Beyond Phase 4

Future possibilities:
- **Mobile apps** - Native iOS/Android apps
- **Browser extension** - Quick note capture
- **Desktop app** - Electron wrapper
- **Integrations** - Slack, Discord, Zapier
- **Whiteboarding** - Excalidraw integration
- **Publishing** - Publish notes as blog posts

---

## 📝 Notes

Phase 4 is ambitious and can be broken into sub-phases:
- **4.1** - Sharing & Collaboration
- **4.2** - Rich Media
- **4.3** - AI Features
- **4.4** - Productivity Tools

Each sub-phase can be developed and deployed independently.
