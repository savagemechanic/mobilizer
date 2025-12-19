# Mobilizer v2

A modern, scalable community engagement and mobilization platform built as a monorepo.

## Project Structure

```
mobilizerv2/
├── apps/
│   ├── backend/          # NestJS backend API
│   └── web/              # React frontend application
├── packages/
│   ├── shared/           # Shared types, utils, and constants
│   └── eslint-config/    # Shared ESLint configuration
├── package.json          # Monorepo root with Yarn workspaces
├── turbo.json            # Turborepo configuration
├── tsconfig.base.json    # Base TypeScript configuration
└── docker-compose.yml    # PostgreSQL + Redis services
```

## Prerequisites

- Node.js >= 18.0.0
- Yarn >= 1.22.21
- Docker & Docker Compose (for local development)

## Getting Started

### 1. Install Dependencies

```bash
yarn install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration values.

### 3. Start Database Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379

### 4. Run Development Servers

```bash
# Run all apps in development mode
yarn dev

# Or run specific apps
yarn workspace @mobilizer/backend dev
yarn workspace @mobilizer/web dev
```

## Available Scripts

- `yarn dev` - Start all applications in development mode
- `yarn build` - Build all applications for production
- `yarn lint` - Lint all applications and packages
- `yarn typecheck` - Run TypeScript type checking
- `yarn clean` - Clean all build artifacts and node_modules
- `yarn format` - Format code with Prettier

## Workspaces

### Apps

- **@mobilizer/backend** - NestJS REST API with PostgreSQL and Redis
- **@mobilizer/web** - React SPA with Vite and Redux Toolkit

### Packages

- **@mobilizer/shared** - Shared TypeScript types, enums, constants, and utilities
- **@mobilizer/eslint-config** - Shared ESLint configuration

## Tech Stack

### Backend
- NestJS
- PostgreSQL (via Prisma ORM)
- Redis (caching & sessions)
- Socket.io (real-time features)
- JWT authentication

### Frontend
- React 18
- TypeScript
- Vite
- Redux Toolkit
- React Router v6
- Material-UI

### Infrastructure
- Turborepo (monorepo orchestration)
- Docker & Docker Compose
- Yarn Workspaces

## Development Workflow

1. All shared types and constants should be added to `packages/shared`
2. Use the shared ESLint config from `packages/eslint-config`
3. Follow the established TypeScript patterns and conventions
4. Use Turborepo for efficient builds and caching

## Database

The application uses PostgreSQL with Prisma ORM. Database migrations are managed in the backend app.

```bash
# Run migrations
yarn workspace @mobilizer/backend prisma migrate dev

# Generate Prisma client
yarn workspace @mobilizer/backend prisma generate

# Open Prisma Studio
yarn workspace @mobilizer/backend prisma studio
```

## Environment Variables

See `.env.example` for all required environment variables. Key variables include:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - URL of the frontend app (for CORS)

## Docker Services

### PostgreSQL
- Port: 5432
- Database: mobilizerv2
- User: mobilizeruser
- Password: mobilizerpass

### Redis
- Port: 6379
- No password by default

## License

Proprietary - All rights reserved
