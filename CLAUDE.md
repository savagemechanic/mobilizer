# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobilizer v2 is a community engagement and mobilization platform built as a Turborepo monorepo. It consists of a NestJS GraphQL backend, a Next.js 15 frontend, and shared packages.

## Development Commands

```bash
# Install dependencies
yarn install

# Start all apps in development mode
yarn dev

# Start specific apps
yarn dev --filter=backend
yarn dev --filter=web

# Build all apps
yarn build

# Lint and type check
yarn lint
yarn typecheck

# Format code
yarn format

# Clean build artifacts
yarn clean
```

### Database Commands (run from apps/backend)

```bash
yarn prisma migrate dev          # Create and apply migrations
yarn prisma generate             # Generate Prisma client
yarn prisma studio               # Open GUI database browser
yarn prisma db seed              # Seed database
yarn prisma migrate reset        # Reset database (destructive)
```

### Docker Services

```bash
docker-compose up -d             # Start PostgreSQL (5432) + Redis (6379)
docker-compose down              # Stop services
docker-compose logs -f           # View logs
```

### Testing

```bash
# Backend tests (from apps/backend)
yarn test                        # Unit tests
yarn test:watch                  # Watch mode
yarn test:cov                    # Coverage
yarn test:e2e                    # E2E tests

# Frontend tests (from apps/web)
yarn test
```

## Architecture

### Monorepo Structure

- **apps/backend** - NestJS GraphQL API with Prisma ORM
- **apps/web** - Next.js 15 app with React 18
- **packages/shared** - TypeScript types, enums, constants, utilities
- **packages/eslint-config** - Shared ESLint configuration

### Backend (NestJS + GraphQL)

The backend uses a modular architecture with feature-based modules:

```
apps/backend/src/
├── modules/
│   ├── auth/           # Authentication (JWT)
│   ├── users/          # User management
│   ├── movements/      # Top-level campaign containers
│   ├── organizations/  # Support groups within movements
│   ├── posts/          # Social feed posts, polls
│   ├── events/         # Event management
│   ├── chat/           # Direct and group messaging
│   ├── notifications/  # Push notifications
│   ├── admin/          # Organization admin features
│   ├── platform-admin/ # Global platform administration
│   ├── locations/      # Geographic hierarchy (Country > State > LGA > Ward > PollingUnit)
│   └── audit/          # Audit logging
├── prisma/             # Prisma service
├── config/             # Configuration (database, redis, jwt)
└── common/             # Shared decorators, guards, filters
```

**Key patterns:**
- GraphQL schema auto-generated to `src/schema.gql`
- Prisma ORM with PostgreSQL
- JWT authentication with refresh tokens
- Redis for caching and sessions

### Frontend (Next.js 15 + App Router)

```
apps/web/src/
├── app/
│   ├── (auth)/         # Public auth routes (login, signup)
│   ├── (user)/         # Protected user routes
│   ├── admin/          # Organization admin dashboard
│   └── platform-admin/ # Platform-wide administration
├── components/         # Reusable UI components (Radix UI based)
├── store/              # Zustand state stores
├── lib/
│   ├── apollo-client.ts    # GraphQL client setup
│   └── graphql/            # GraphQL queries/mutations
├── hooks/              # Custom React hooks
└── types/              # TypeScript types
```

**Key patterns:**
- Apollo Client for GraphQL with WebSocket subscriptions
- Zustand for client state (auth, UI, platform-admin)
- Radix UI + Tailwind CSS for components
- React Hook Form + Zod for form validation

### Shared Package (@mobilizer/shared)

Import shared code in both apps:

```typescript
import {
  // Enums
  Gender, OrgLevel, PostType, EventType, UserRole,

  // Constants
  VALIDATION, FILE_UPLOAD, PAGINATION, HTTP_STATUS, ERROR_CODES, WS_EVENTS,

  // Utilities
  slugify, truncate, isValidEmail, formatDate, normalizePagination,
} from '@mobilizer/shared';
```

After modifying shared package, rebuild:
```bash
cd packages/shared && yarn build
```

### Data Model Hierarchy

The platform uses a hierarchical structure:

1. **Movement** - Top-level campaign/cause (e.g., political campaign)
2. **Organization** (Support Group) - Groups within a movement at various levels
3. **OrgMembership** - User membership in organizations with roles

**Admin hierarchy:**
- **Platform Admin** (`user.isPlatformAdmin`) - God mode, manages all movements
- **Super Admin** (`MovementAdmin`) - Manages a specific movement
- **Org Admin** (`OrgMembership.isAdmin`) - Manages a specific organization

### Authentication Flow

- JWT tokens stored in `localStorage` as `token`
- Auth state managed by Zustand (`useAuthStore`)
- Apollo Client automatically attaches Bearer token to requests
- Refresh tokens stored server-side in database

## Environment Variables

Copy `.env.example` to `.env` and configure:

**Critical variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Token signing key
- `NEXT_PUBLIC_GRAPHQL_HTTP_URL` - GraphQL endpoint for frontend
- `NEXT_PUBLIC_GRAPHQL_WS_URL` - WebSocket endpoint for subscriptions

## Workspace Commands

Run commands in specific workspaces:
```bash
yarn workspace @mobilizer/backend [command]
yarn workspace @mobilizer/web [command]
yarn workspace @mobilizer/shared [command]
```

## Ports

- Frontend: http://localhost:3000 (Next.js default)
- Backend API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql
- Prisma Studio: http://localhost:5555
- PostgreSQL: 5432
- Redis: 6379
