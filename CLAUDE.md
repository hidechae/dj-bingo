# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DJ Bingo is an interactive bingo game application for DJ events, built with the T3 Stack (Next.js, TypeScript, Prisma, tRPC). It supports real-time game sessions where administrators manage song playlists and participants play bingo by marking songs as they're played.

### Core Architecture

**Tech Stack:**
- Next.js 15 (Pages Router) with TypeScript
- tRPC for type-safe API layer
- Prisma ORM with PostgreSQL
- NextAuth.js with Google OAuth (admin only)
- TanStack Query for state management
- Tailwind CSS for styling

**Authentication Model:**
- Admins: Google OAuth via NextAuth.js
- Participants: Session-based (no authentication required, uses sessionToken in localStorage)

**Database Schema:**
- `BingoGame`: Main game entity with size (3x3, 4x4, 5x5), title, and isActive status
- `Song`: Belongs to BingoGame, tracks isPlayed and playedAt
- `Participant`: Identified by sessionToken, tracks isGridComplete, hasWon, wonAt
- `ParticipantSong`: Junction table linking participants to songs with position in grid

**API Structure:**
- tRPC routers located in `src/server/api/routers/`
  - `bingoRouter`: Admin operations (create, update, manage songs)
  - `participantRouter`: Participant operations (join, setup grid, check win)
- Root router in `src/server/api/root.ts` combines all routers
- Protected procedures require NextAuth session, public procedures don't

**Key Application Flow:**
1. Admin creates game → generates QR code with game URL
2. Participant scans QR → joins with name → receives sessionToken
3. Participant selects songs from list → positions them in grid
4. Admin marks songs as played → participants see updates
5. System checks for bingo (row/column/diagonal) → marks winner

## Development Commands

### Setup
```bash
npm install                 # Install dependencies
cp .env.example .env       # Create environment file
docker-compose up -d       # Start local PostgreSQL
npm run db:push            # Apply schema to database
```

### Development
```bash
npm run dev                # Start dev server at http://localhost:3000
npm run db:studio          # Open Prisma Studio (database GUI)
npm run type-check         # Run TypeScript type checking
npm run lint               # Run ESLint
```

### Database Operations
```bash
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Create new migration (dev)
npm run db:push            # Push schema without migration (dev/prod)
```

### Production
```bash
npm run build              # Create production build
npm start                  # Start production server
```

## Important Patterns

### Session Management
- Admin sessions: Managed by NextAuth.js, stored in database
- Participant sessions: Client-generated UUID stored in localStorage as sessionToken
- Participant state persists across page refreshes via sessionToken lookup

### Real-time Updates
- Uses TanStack Query's polling/refetching for real-time feel
- No WebSocket implementation currently
- Participants poll for song updates; admins poll for participant status

### Grid Position System
- 3x3 grid: positions 0-8
- 4x4 grid: positions 0-15
- 5x5 grid: positions 0-24
- Position stored in ParticipantSong table

### Win Condition Logic
Located in participant router - checks all rows, columns, and diagonals based on grid size

## Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Application URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## Common Tasks

### Adding a New tRPC Procedure
1. Define procedure in appropriate router file (`src/server/api/routers/`)
2. Use `protectedProcedure` for admin-only, `publicProcedure` for participants
3. Add Zod schema for input validation
4. Return type is automatically inferred on client

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (create migration)
3. Prisma client regenerates automatically

### QR Code Generation
Uses `qrcode` library. Participant URLs follow pattern: `/game/[id]`
