# Quick Start Guide

## Prerequisites

Make sure you have the following installed:
- Node.js 18+ or 20+
- PostgreSQL 14+
- Redis 6+
- Yarn 1.22+

## Setup Steps

### 1. Install Dependencies
```bash
cd /Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/backend
yarn install
```

### 2. Configure Environment
The `.env` file has been created with default values. Update these:

```bash
# Edit database credentials
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/mobilizer_v2?schema=public"

# Update JWT secrets (use strong random strings in production)
JWT_SECRET=your-secret-key-change-in-production-please
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-please
```

### 3. Create Database
```bash
# Using PostgreSQL command line
createdb mobilizer_v2

# Or using psql
psql -U postgres
CREATE DATABASE mobilizer_v2;
\q
```

### 4. Generate Prisma Client
```bash
yarn prisma:generate
```

### 5. Run Migrations
```bash
yarn prisma:migrate
```

### 6. Seed Database (Optional)
```bash
yarn prisma:seed
```

This will create:
- Nigeria with Lagos State, Ikeja LGA, Ward 1
- Admin user: `admin@mobilizer.ng` / `password123`
- Test user: `user@mobilizer.ng` / `password123`
- Sample organization: "National Youth Movement"

### 7. Start Development Server
```bash
yarn start:dev
```

The server will be available at:
- API: http://localhost:4000
- GraphQL Playground: http://localhost:4000/graphql

## Test the API

### 1. Register a New User

Open GraphQL Playground and run:

```graphql
mutation {
  register(input: {
    email: "test@example.com"
    password: "password123"
    firstName: "John"
    lastName: "Doe"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      firstName
      lastName
    }
  }
}
```

### 2. Login

```graphql
mutation {
  login(input: {
    email: "test@example.com"
    password: "password123"
  }) {
    accessToken
    refreshToken
    user {
      id
      email
      displayName
    }
  }
}
```

### 3. Get Current User (Protected)

First, set the Authorization header in Playground:
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN_HERE"
}
```

Then query:
```graphql
query {
  me {
    id
    email
    firstName
    lastName
    displayName
    isEmailVerified
  }
}
```

### 4. Create a Post

```graphql
mutation {
  createPost(input: {
    content: "Hello from Mobilizer v2!"
    type: "TEXT"
  }) {
    id
    content
    createdAt
    author {
      displayName
    }
  }
}
```

### 5. Get Feed

```graphql
query {
  feed(limit: 10) {
    id
    content
    type
    createdAt
    author {
      displayName
      avatar
    }
    likeCount
    commentCount
  }
}
```

## Common Commands

```bash
# Start development server
yarn start:dev

# Build for production
yarn build

# Start production server
yarn start:prod

# Run tests
yarn test

# Lint code
yarn lint

# Format code
yarn format

# Open Prisma Studio (database GUI)
yarn prisma:studio

# Create new migration
yarn prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Port Already in Use
If port 4000 is already in use, change it in `.env`:
```
PORT=5000
```

### Database Connection Error
- Ensure PostgreSQL is running: `pg_ctl status`
- Check your DATABASE_URL in `.env`
- Verify database exists: `psql -l`

### Redis Connection Error
- Ensure Redis is running: `redis-cli ping`
- Should return "PONG"
- Start Redis: `redis-server`

### Prisma Client Not Found
Run:
```bash
yarn prisma:generate
```

## Next Steps

1. Explore the GraphQL Playground at http://localhost:4000/graphql
2. Check the API documentation in README.md
3. Review the Prisma schema in `prisma/schema.prisma`
4. Customize the modules in `src/modules/`

## Default Test Credentials

After running `yarn prisma:seed`:

**Admin User**
- Email: `admin@mobilizer.ng`
- Password: `password123`

**Regular User**
- Email: `user@mobilizer.ng`
- Password: `password123`

## Need Help?

- Check the README.md for detailed documentation
- Review the Prisma schema for data models
- Explore the GraphQL schema in Playground
