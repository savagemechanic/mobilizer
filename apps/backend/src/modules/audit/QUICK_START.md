# Audit Module - Quick Start Guide

Get started with the Audit module in 5 minutes.

## Step 1: Install Dependencies

```bash
cd /Users/astra/Engineering/Uzo/mobilizer/mobilizerv2/apps/backend
npm install graphql-type-json csv-writer
npm install --save-dev @types/csv-writer
```

## Step 2: Generate Prisma Client

```bash
npm run prisma:generate
```

## Step 3: Start Using the Module

The AuditModule is already registered as a global module in `app.module.ts`. You can start using it immediately!

### Method 1: Using the @Audit Decorator (Easiest)

```typescript
import { UseInterceptors } from '@nestjs/common';
import { Mutation, Args } from '@nestjs/graphql';
import { AuditAction } from '@prisma/client';
import { Audit, AuditInterceptor } from '../audit';

@Mutation(() => Organization)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Organization')
async createOrganization(@Args('input') input: CreateOrganizationInput) {
  return this.organizationsService.create(input);
}
```

### Method 2: Manual Logging

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { AuditAction } from '@prisma/client';

@Injectable()
export class YourService {
  constructor(private auditService: AuditService) {}

  async yourMethod(userId: string, request: any) {
    // Your business logic here

    // Log the action
    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'YourEntity',
      entityId: 'entity-id',
      metadata: { key: 'value' },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });
  }
}
```

## Step 4: Query Audit Logs

Use GraphQL to query audit logs:

```graphql
query GetAuditLogs {
  auditLogs(
    pagination: { page: 1, limit: 20 }
  ) {
    data {
      id
      user {
        email
        firstName
      }
      action
      entityType
      createdAt
    }
    total
  }
}
```

## Next Steps

- Read the [README.md](./README.md) for comprehensive documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for real-world usage examples
- See [INSTALLATION.md](./INSTALLATION.md) for troubleshooting

## Available Features

- Automatic audit logging with decorators
- Manual logging with AuditService
- GraphQL queries and filters
- Export to CSV/JSON
- Helper methods for common patterns
- Global module (no need to import)

## Common Use Cases

1. **Authentication Events**: Login, logout, password changes
2. **CRUD Operations**: Create, update, delete entities
3. **Permission Changes**: Admin assignments, role changes
4. **Movement Management**: Movement creation, Super Admin assignments
5. **Content Moderation**: Post/comment deletions

## Available Audit Actions

- `CREATE`, `UPDATE`, `DELETE`
- `LOGIN`, `LOGOUT`, `PASSWORD_CHANGE`, `EMAIL_VERIFY`
- `PERMISSION_GRANT`, `PERMISSION_REVOKE`
- `MOVEMENT_CREATE`, `MOVEMENT_UPDATE`, `MOVEMENT_DELETE`
- `SUPER_ADMIN_ASSIGN`, `SUPER_ADMIN_REVOKE`
- `PLATFORM_ADMIN_GRANT`, `PLATFORM_ADMIN_REVOKE`

## Permissions

Only **Platform Admins** and **Super Admins** can query audit logs.

## Support

For questions or issues, refer to the documentation files in this directory:
- `README.md` - Full documentation
- `EXAMPLES.md` - Usage examples
- `INSTALLATION.md` - Installation and troubleshooting
