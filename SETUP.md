# Setup Guide - Notes App

Complete setup instructions for running the Notes App locally and deploying to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Authentication Setup](#authentication-setup)
7. [Running the App](#running-the-app)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or 20.x | Runtime environment |
| npm | 9.x+ | Package manager |
| PostgreSQL | 14+ | Database (Neon provides this) |
| Git | 2.x+ | Version control |

### Required Accounts

1. **Neon** (https://neon.tech) - Serverless PostgreSQL
2. **GitHub** or **Google Account** - For OAuth authentication
3. **Netlify** or **Vercel** (optional) - For deployment

---

## Quick Start

For experienced developers:

```bash
# 1. Clone the repository
git clone https://github.com/Brian125bot/notesv2.git
cd notesv2

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Set up Neon database (see Database Setup section)
# 5. Configure OAuth (see Authentication Setup section)

# 6. Run the app
npm run dev
```

App will be available at http://localhost:3000

---

## Detailed Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/Brian125bot/notesv2.git
cd notesv2
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14 with App Router
- React and TypeScript
- Drizzle ORM
- Better Auth
- Tailwind CSS + shadcn/ui
- Dexie.js for IndexedDB
- And all other dependencies

### Step 3: Environment Configuration

Create your environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values (see [Environment Variables](#environment-configuration) section).

---

## Environment Configuration

### Required Variables

```env
# Database (from Neon Console)
DATABASE_URL=postgresql://user:password@host.neon.tech/database?sslmode=require

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_secret_here

# Public URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3000

# OAuth - Google (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth - GitHub (from GitHub Developer Settings)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

### Generating Secrets

**Better Auth Secret:**
```bash
openssl rand -base64 32
```

Copy the output and set as `BETTER_AUTH_SECRET`.

---

## Database Setup

### Option 1: Using Neon (Recommended)

1. **Sign up** at https://neon.tech
2. **Create a new project**
3. **Get connection string:**
   - Go to Project Dashboard
   - Click "Connect"
   - Copy the connection string
   - Paste into `.env.local` as `DATABASE_URL`

4. **Run migrations:**
```bash
npm run db:migrate
```

Or manually apply the schema:
```bash
npx drizzle-kit push:pg
```

### Option 2: Local PostgreSQL

If you prefer local development:

```bash
# Install PostgreSQL (macOS)
brew install postgresql@14
brew services start postgresql@14

# Create database
createdb notes_app

# Set connection string
DATABASE_URL=postgresql://localhost:5432/notes_app
```

### Database Schema

The app uses these tables:
- `notes` - User notes with content, color, pin status
- `labels` - Note labels/tags
- `note_labels` - Many-to-many relationship
- `neon_auth` - Managed by Better Auth

### Verifying Database Connection

```bash
# Test connection
npx drizzle-kit studio
```

This opens Drizzle Studio at http://localhost:4983 for database management.

---

## Authentication Setup

### Google OAuth

1. **Go to Google Cloud Console:**
   - https://console.cloud.google.com

2. **Create a new project** (or use existing)

3. **Enable Google+ API:**
   - APIs & Services → Library
   - Search "Google+ API"
   - Click Enable

4. **Create OAuth Credentials:**
   - APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: Web application
   - Name: Notes App
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

5. **Copy credentials:**
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

### GitHub OAuth

1. **Go to GitHub Settings:**
   - https://github.com/settings/developers

2. **Create a new OAuth App:**
   - Click "New OAuth App"
   - Application name: Notes App
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL:
     - `http://localhost:3000/api/auth/callback/github` (development)

3. **Copy credentials:**
   - Client ID → `GITHUB_CLIENT_ID`
   - Generate Client Secret → `GITHUB_CLIENT_SECRET`

---

## Running the App

### Development Mode

```bash
npm run dev
```

Features in dev mode:
- Hot reloading
- Source maps
- API routes available at `/api/*`

### Production Build (Local)

```bash
# Build
npm run build

# Start production server
npm start
```

### With HTTPS (for PWA testing)

```bash
# Generate certificates
mkcert localhost

# Run with HTTPS
npm run dev -- --experimental-https
```

---

## Deployment

### Option 1: Netlify (Recommended)

1. **Push to GitHub:**
```bash
git push origin main
```

2. **Connect to Netlify:**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository

3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Set environment variables:**
   - Go to Site settings → Environment variables
   - Add all variables from `.env.local`
   - Update `NEXT_PUBLIC_AUTH_URL` to your production URL

5. **Update OAuth redirect URIs:**
   - Add `https://your-site.netlify.app/api/auth/callback/google`
   - Add `https://your-site.netlify.app/api/auth/callback/github`

### Option 2: Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Set environment variables in dashboard**

### Option 3: Self-Hosted

1. **Build the app:**
```bash
npm run build
```

2. **Set up environment variables on server**

3. **Start with PM2:**
```bash
npm install -g pm2
pm2 start npm --name "notes-app" -- start
```

---

## Post-Deployment Checklist

### Essential Checks

- [ ] App loads without errors
- [ ] OAuth login works (Google & GitHub)
- [ ] Notes can be created/edited/deleted
- [ ] Sync works across devices
- [ ] Offline mode works (test in DevTools)
- [ ] PWA install prompt appears
- [ ] Search returns results
- [ ] Labels can be created and assigned

### PWA Verification

1. Open Chrome DevTools → Application → Manifest
2. Verify manifest is loaded
3. Check Service Worker is registered
4. Test "Add to Home Screen" functionality

### Performance Checks

Run Lighthouse audit:
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-site.com --view
```

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90
- PWA: All checks passed

---

## Troubleshooting

### Common Issues

#### Issue: "Database connection failed"

**Solution:**
```bash
# Verify DATABASE_URL format
postgresql://user:pass@host.neon.tech/db?sslmode=require

# Test connection
psql "$DATABASE_URL" -c "SELECT 1"
```

#### Issue: "OAuth callback error"

**Solution:**
- Check redirect URIs match exactly (including protocol)
- Ensure `NEXT_PUBLIC_AUTH_URL` matches your domain
- Verify client ID and secret are correct

#### Issue: "Service Worker not registering"

**Solution:**
- Must use HTTPS or localhost
- Check `public/sw.js` exists
- Clear browser cache and reload

#### Issue: "Sync not working offline"

**Solution:**
```bash
# Check IndexedDB in DevTools
# Application → Storage → IndexedDB → NotesDatabase

# Clear and re-register SW
# DevTools → Application → Service Workers → Unregister
```

#### Issue: "Build fails with memory error"

**Solution:**
```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Getting Help

1. **Check logs:**
```bash
# Development
npm run dev

# Check browser console for errors
```

2. **Enable debug mode:**
```env
DEBUG=true
```

3. **Open an issue:**
   - https://github.com/Brian125bot/notesv2/issues
   - Include error messages and steps to reproduce

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run database migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format
```

---

## Project Structure

```
notesv2/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── manifest.ts        # PWA manifest
│   └── page.tsx           # Main app
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── notes/            # Note components
│   ├── labels/           # Label components
│   ├── search/           # Search components
│   └── ...
├── db/                    # Database schema
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Database connection
│   ├── indexeddb.ts      # Offline storage
│   └── ...
├── public/               # Static files
│   ├── icons/           # PWA icons
│   └── sw.js            # Service worker
├── types/                # TypeScript types
├── .env.local           # Environment variables
├── next.config.ts       # Next.js config
└── package.json
```

---

## Next Steps

After setup, explore these features:

1. **Create your first note**
2. **Try offline mode** (disconnect internet)
3. **Test on mobile** (responsive design)
4. **Enable dark mode** (user menu)
5. **Create labels** to organize notes
6. **Search** your notes
7. **Share** notes with others

---

## Resources

- **Documentation:** See `README.md` and `PHASE*.md` files
- **Issues:** https://github.com/Brian125bot/notesv2/issues
- **Discussions:** https://github.com/Brian125bot/notesv2/discussions

---

**Happy note-taking!** 📝✨
