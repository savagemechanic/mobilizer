# Mobilizer v2 - Developer Quick Reference

## Project Structure Overview

```
mobilizerv2/
├── apps/
│   ├── backend/          # NestJS API (Port 3000)
│   └── web/              # React SPA (Port 5173)
├── packages/
│   ├── shared/           # @mobilizer/shared - Types, enums, utils
│   └── eslint-config/    # @mobilizer/eslint-config - Linting rules
├── scripts/              # Database and utility scripts
└── [config files]        # Root configuration
```

## Quick Start

```bash
# 1. Install dependencies
yarn install

# 2. Start Docker services (PostgreSQL + Redis)
docker-compose up -d

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Start development servers
yarn dev
```

## Common Commands

### Development
```bash
yarn dev                  # Start all apps in dev mode
yarn dev --filter=backend # Start only backend
yarn dev --filter=web     # Start only web
```

### Building
```bash
yarn build                # Build all apps
yarn build --filter=backend
yarn build --filter=web
```

### Code Quality
```bash
yarn lint                 # Lint all workspaces
yarn typecheck            # Type check all workspaces
yarn format               # Format code with Prettier
```

### Workspace Management
```bash
yarn workspace @mobilizer/backend [command]
yarn workspace @mobilizer/web [command]
yarn workspace @mobilizer/shared [command]
```

### Database (Backend)
```bash
cd apps/backend
yarn prisma migrate dev   # Create and run migrations
yarn prisma generate      # Generate Prisma client
yarn prisma studio        # Open Prisma Studio GUI
yarn prisma db seed       # Run seed scripts
```

### Docker Services
```bash
docker-compose up -d      # Start PostgreSQL + Redis
docker-compose down       # Stop services
docker-compose logs -f    # View logs
docker-compose ps         # Check service status
```

## Using Shared Package

### Import Shared Types
```typescript
// In backend or web
import { User, Post, Event } from '@mobilizer/shared';
import { Gender, PostType, UserRole } from '@mobilizer/shared';
import { VALIDATION, HTTP_STATUS } from '@mobilizer/shared';
import { slugify, formatDate } from '@mobilizer/shared';
```

### Common Enums
```typescript
import {
  Gender,              // male, female, other, prefer_not_to_say
  OrgLevel,            // national, state, lga, ward, unit
  PostType,            // text, image, video, poll, link, shared
  EventType,           // meeting, rally, conference, training, etc.
  MessageType,         // text, image, video, file, audio
  NotificationType,    // post_like, comment, mention, etc.
  UserRole,            // user, admin, super_admin
  ContentVisibility,   // public, org_only, members_only, private
} from '@mobilizer/shared';
```

### Common Constants
```typescript
import {
  VALIDATION,      // Field length constraints
  FILE_UPLOAD,     // File size/type limits
  PAGINATION,      // Default page sizes
  HTTP_STATUS,     // Status codes
  ERROR_CODES,     // Error code constants
  WS_EVENTS,       // WebSocket event names
} from '@mobilizer/shared';

// Usage examples
if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) { ... }
if (file.size > FILE_UPLOAD.MAX_IMAGE_SIZE) { ... }
response.status(HTTP_STATUS.NOT_FOUND)
```

### Common Utils
```typescript
import {
  slugify,
  truncate,
  isValidEmail,
  formatDate,
  normalizePagination,
  calculatePaginationMeta,
} from '@mobilizer/shared';

// Usage examples
const slug = slugify("My Organization Name");  // "my-organization-name"
const short = truncate(text, 100);             // "text..."
const relative = formatDate(date, 'relative'); // "2h ago"
```

## Environment Variables

### Backend (.env)
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Token signing key
- `AWS_ACCESS_KEY_ID` - S3 for file uploads
- `SENDGRID_API_KEY` - Email service

### Frontend (.env)
- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL
- `VITE_FIREBASE_CONFIG` - Firebase config (if needed)

## Adding New Features

### 1. Add Shared Types (if needed)
```bash
cd packages/shared/src
# Edit types.ts, enums.ts, or constants.ts
yarn build
```

### 2. Backend Changes
```bash
cd apps/backend
# Create new module
nest g module [name]
nest g controller [name]
nest g service [name]

# Update Prisma schema if needed
# Edit prisma/schema.prisma
yarn prisma migrate dev --name [migration-name]
```

### 3. Frontend Changes
```bash
cd apps/web
# Create components in src/components/
# Create pages in src/pages/
# Update routes in src/routes/
```

## Debugging

### Backend Debugging
```bash
cd apps/backend
yarn start:debug  # Start with debugger
```

### Database Issues
```bash
# Reset database
cd apps/backend
yarn prisma migrate reset

# View database
yarn prisma studio
```

### Check Services
```bash
# PostgreSQL
docker-compose exec postgres psql -U mobilizeruser -d mobilizerv2

# Redis
docker-compose exec redis redis-cli
```

## Testing

### Backend Tests
```bash
cd apps/backend
yarn test           # Unit tests
yarn test:e2e       # End-to-end tests
yarn test:cov       # Coverage report
```

### Frontend Tests
```bash
cd apps/web
yarn test           # Run tests
yarn test:coverage  # Coverage report
```

## Code Style Guidelines

### Naming Conventions
- **Files**: kebab-case (user-profile.service.ts)
- **Classes**: PascalCase (UserProfile)
- **Functions**: camelCase (getUserProfile)
- **Constants**: UPPER_SNAKE_CASE (MAX_FILE_SIZE)
- **Enums**: PascalCase (PostType)

### Import Order (automatic via ESLint)
1. Node built-ins
2. External packages
3. Internal packages (@mobilizer/*)
4. Parent imports (../)
5. Sibling imports (./)
6. Index imports (./)

### TypeScript Guidelines
- Use `type` for simple types, `interface` for objects
- Prefer `const` over `let`, never use `var`
- Use `async/await` over promises chains
- Always define return types for public functions
- Use TypeScript strict mode (already configured)

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

### Module Not Found
```bash
# Reinstall dependencies
yarn clean
yarn install
```

### Type Errors After Shared Changes
```bash
# Rebuild shared package
cd packages/shared
yarn build

# Go back to root and restart
cd ../..
yarn dev
```

### Database Connection Issues
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

## Useful Resources

- **NestJS Docs**: https://docs.nestjs.com
- **Prisma Docs**: https://www.prisma.io/docs
- **React Docs**: https://react.dev
- **Vite Docs**: https://vitejs.dev
- **Turborepo Docs**: https://turbo.build/repo/docs

## Project URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Backend Docs: http://localhost:3000/api/docs
- Prisma Studio: http://localhost:5555

## Support

For issues or questions:
1. Check this guide first
2. Review the README.md
3. Check existing documentation in apps/*/docs
4. Contact the team lead
