# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fastify-based REST API service with JWT authentication and Prisma ORM for PostgreSQL. The application provides user registration/login with bcrypt password hashing and protected routes using JWT tokens.

## Development Commands

```bash
# Install dependencies
pnpm install

# Development with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Run production build
pnpm start

# Database operations
pnpm db:generate    # Generate Prisma Client
pnpm db:migrate     # Deploy migrations to database
pnpm db:studio      # Open Prisma Studio (database GUI)
```

## Environment Setup

Required environment variables (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment (development/production)

The application will fail to start if `DATABASE_URL` or `JWT_SECRET` are missing (validated in `src/config.ts:10-16`).

## Architecture

**Entry Point**: `src/index.ts` - Fastify server setup with plugin registration, route mounting, and graceful shutdown handlers.

**Authentication Flow**:
1. JWT tokens generated via `@fastify/jwt` plugin (registered in `src/index.ts:20-22`)
2. Auth routes (`src/routes/auth.ts`) handle registration and login, issuing JWT tokens on success
3. Protected routes use `authMiddleware` (`src/middleware/auth.ts`) as a preHandler to verify JWT and attach user to request
4. User data attached to `request.user` via type augmentation in `src/types.ts`

**Database Layer**:
- Prisma Client singleton pattern in `src/db.ts` prevents multiple instances in development
- Schema in `prisma/schema.prisma` with single User model
- Connection tested in `/health` endpoint

**Route Structure**:
- Public routes: `/health`, `/api/auth/register`, `/api/auth/login`
- Protected routes: `/api/me` (requires Authorization header with Bearer token)
- Auth routes mounted with `/api/auth` prefix

**Password Security**: bcrypt with salt rounds of 10 (`src/routes/auth.ts:42`)

**Type Safety**: TypeScript strict mode with Fastify type extensions for request augmentation

## Database Schema Changes

After modifying `prisma/schema.prisma`:
1. Create migration: `npx prisma migrate dev --name <migration_name>`
2. Generate client: `pnpm db:generate`

For production deployment, use `pnpm db:migrate` instead of `migrate dev`.
