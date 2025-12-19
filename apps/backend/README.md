# Mobilizer v2 Backend

NestJS-based GraphQL backend for the Mobilizer v2 platform.

## Tech Stack

- **Framework**: NestJS 10.x
- **API**: GraphQL (Apollo Server + Code-First)
- **Database**: PostgreSQL 14 with Prisma 5.x ORM
- **Authentication**: JWT with Passport.js
- **Caching**: Redis (ioredis)
- **Language**: TypeScript

## Project Structure

```
src/
├── common/              # Shared utilities, guards, decorators, filters
├── config/              # Configuration files
├── prisma/              # Prisma service
├── modules/             # Feature modules
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── organizations/  # Organization management
│   ├── posts/          # Posts & social feed
│   ├── events/         # Event management
│   ├── chat/           # Messaging system
│   └── notifications/  # Notification system
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 14+
- Redis 6+
- Yarn 1.22+

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database and Redis credentials
```

3. Generate Prisma client:
```bash
yarn prisma:generate
```

4. Run database migrations:
```bash
yarn prisma:migrate
```

5. (Optional) Seed the database:
```bash
yarn prisma:seed
```

### Running the Application

#### Development mode
```bash
yarn start:dev
```

#### Production mode
```bash
yarn build
yarn start:prod
```

The server will start at `http://localhost:4000`

GraphQL Playground: `http://localhost:4000/graphql`

## Database Management

### Create a new migration
```bash
yarn prisma:migrate
```

### View database in Prisma Studio
```bash
yarn prisma:studio
```

### Reset database (development only)
```bash
npx prisma migrate reset
```

## GraphQL API

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Queries

- `me` - Get current user profile
- `user(id: String!)` - Get user by ID
- `organizations(filter: OrgFilterInput, limit: Int, offset: Int)` - List organizations
- `feed(limit: Int, offset: Int)` - Get user's feed
- `events(limit: Int, offset: Int, orgId: String)` - List events
- `conversations` - Get user's conversations
- `notifications(limit: Int, offset: Int)` - Get notifications

### Key Mutations

- `register(input: RegisterInput!)` - Register new user
- `login(input: LoginInput!)` - Login user
- `createPost(input: CreatePostInput!)` - Create a post
- `createOrganization(input: CreateOrgInput!)` - Create organization
- `createEvent(input: CreateEventInput!)` - Create event
- `sendMessage(input: SendMessageInput!)` - Send message

## Authentication Flow

1. Register: `register` mutation returns `{ accessToken, refreshToken, user }`
2. Login: `login` mutation returns `{ accessToken, refreshToken, user }`
3. Access protected endpoints with `Authorization: Bearer <accessToken>`
4. Refresh token: Use `refreshToken` mutation when access token expires

## Environment Variables

Required environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - JWT refresh token secret
- `PORT` - Server port (default: 4000)
- `CORS_ORIGIN` - Allowed CORS origin

## Testing

```bash
# Unit tests
yarn test

# E2E tests
yarn test:e2e

# Test coverage
yarn test:cov
```

## Code Style

```bash
# Lint
yarn lint

# Format
yarn format
```

## Project Features

### Implemented Modules

- ✅ Authentication (JWT, register, login, password reset)
- ✅ User Management (profiles, search, follow/unfollow)
- ✅ Organizations (hierarchical structure, memberships)
- ✅ Posts & Feed (text, images, polls, likes, comments)
- ✅ Events (RSVP, attendee tracking)
- ✅ Chat (direct & group messaging, read receipts)
- ✅ Notifications (real-time alerts)

### Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- GraphQL guards for route protection
- Role-based access control (RBAC)
- Input validation with class-validator

## Deployment

### Build for production
```bash
yarn build
```

### Start production server
```bash
yarn start:prod
```

### Docker (Coming soon)
```bash
docker-compose up -d
```

## License

Proprietary - Mobilizer Team
