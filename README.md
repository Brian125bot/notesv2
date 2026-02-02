# Notes App

A Google Keep-like notes application built with Next.js, Neon PostgreSQL, and offline-first architecture.

## Features

- ✨ **Real-time Sync** - Notes sync across devices instantly
- 📴 **Offline Support** - Works without internet, syncs when reconnected
- 🎨 **Color Coding** - 12 note colors like Google Keep
- 📌 **Pin Notes** - Keep important notes at the top
- 📦 **Archive** - Archive notes without deleting
- 📱 **PWA** - Install as a mobile app

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + React + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Neon PostgreSQL |
| ORM | Drizzle ORM |
| Offline | Dexie.js (IndexedDB) |
| Real-time | Server-Sent Events + Background Sync |
| Deployment | Netlify / Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon account (https://neon.tech)

### Setup

1. **Clone and install dependencies:**
```bash
cd my-app
npm install
```

2. **Configure environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Open http://localhost:3000**

### Database Schema

The app uses these tables:
- `notes` - Store notes with color, pin, and archive status
- `labels` - Note labels/tags
- `note_labels` - Many-to-many relationship

## Architecture

### Offline-First Strategy

```
User Action → IndexedDB (immediate) → Sync Queue → API (when online)
                                    ↓
                              Background Sync API
```

### Sync Flow

1. All changes are saved to IndexedDB first (Dexie.js)
2. Changes are queued in the sync queue
3. When online, the sync queue is processed
4. Server returns the latest state
5. Conflicts are resolved with "last-write-wins"

### Real-time Updates

- Server-Sent Events (SSE) stream updates to connected clients
- Background Sync API handles queued actions when reconnecting

## Deployment

### Deploy to Netlify

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect to Netlify:**
   - Import your GitHub repo
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Set environment variables** in Netlify dashboard

4. **Deploy!**

## Project Structure

```
my-app/
├── app/
│   ├── api/
│   │   ├── notes/             # Notes CRUD API
│   │   ├── labels/            # Labels CRUD API
│   │   ├── sync/              # Sync endpoint
│   │   └── sse/               # Real-time updates
│   ├── globals.css
│   ├── layout.tsx
│   ├── manifest.ts            # PWA manifest
│   └── page.tsx               # Main app
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── notes/                 # Note components
│   ├── labels/                # Label components
│   ├── Header.tsx
│   └── Sidebar.tsx
├── db/
│   └── schema.ts              # Drizzle schema
├── hooks/
│   ├── useNotes.ts            # Notes state management
│   ├── useSync.ts             # Sync logic
│   └── useSSE.ts              # Real-time logic
├── lib/
│   ├── db.ts                  # Neon connection
│   ├── indexeddb.ts           # Dexie.js setup
│   └── utils.ts               # Utilities
├── public/
│   ├── sw.js                  # Service Worker
│   └── icons/                 # PWA icons
└── types/
    └── index.ts               # TypeScript types
```

## License

MIT