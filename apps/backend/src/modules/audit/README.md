# Audit Module

The Audit module provides comprehensive audit logging functionality for tracking user actions and system events across the Mobilizerv2 application.

## Features

- **Automatic Audit Logging**: Use decorators and interceptors to automatically log actions
- **Manual Logging**: Programmatically log events with the AuditService
- **GraphQL Queries**: Query and filter audit logs via GraphQL
- **Export Functionality**: Export audit logs to CSV or JSON format
- **Granular Filtering**: Filter by user, action, entity type, date range, and more
- **Global Module**: Available throughout the application without explicit imports

## Installation

The AuditModule is already registered as a global module in `app.module.ts`, so it's available everywhere in the application.

## Usage

### 1. Using the @Audit Decorator (Recommended)

The easiest way to log actions is using the `@Audit` decorator with the `AuditInterceptor`:

```typescript
import { UseInterceptors } from '@nestjs/common';
import { Mutation, Args } from '@nestjs/graphql';
import { AuditAction } from '@prisma/client';
import { Audit, AuditInterceptor } from '../audit';

@Mutation(() => Organization)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Organization')
async createOrganization(
  @CurrentUser() user: any,
  @Args('input') input: CreateOrganizationInput,
) {
  const org = await this.organizationsService.create(input, user.id);
  return org; // The interceptor will automatically log this with org.id
}
```

### 2. Manual Logging with AuditService

For more control, inject and use the AuditService directly:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private auditService: AuditService) {}

  async login(email: string, password: string, request: any) {
    const user = await this.validateUser(email, password);

    // Log the login action
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return this.generateTokens(user);
  }
}
```

### 3. Using Helper Methods

The AuditService provides helper methods for common logging patterns:

```typescript
// Log user action
await this.auditService.logUserAction(
  userId,
  AuditAction.PASSWORD_CHANGE,
  'User',
  userId,
  { changedFields: ['password'] },
  request,
);

// Log movement action
await this.auditService.logMovementAction(
  userId,
  AuditAction.MOVEMENT_CREATE,
  movementId,
  'Movement',
  movementId,
  { name: movement.name },
  request,
);

// Log organization action
await this.auditService.logOrgAction(
  userId,
  AuditAction.CREATE,
  orgId,
  'Post',
  postId,
  { type: 'TEXT' },
  request,
);
```

## GraphQL Queries

### Query Audit Logs

```graphql
query GetAuditLogs($filter: AuditFilterInput, $pagination: PaginationInput) {
  auditLogs(filter: $filter, pagination: $pagination) {
    data {
      id
      userId
      user {
        id
        email
        firstName
        lastName
      }
      action
      entityType
      entityId
      metadata
      ipAddress
      userAgent
      createdAt
    }
    total
    page
    limit
    totalPages
  }
}
```

**Filter Variables:**
```json
{
  "filter": {
    "userId": "uuid",
    "action": "CREATE",
    "entityType": "Organization",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z",
    "search": "organization",
    "movementId": "uuid"
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "sortBy": "createdAt",
    "sortOrder": "desc"
  }
}
```

### Get Single Audit Log

```graphql
query GetAuditLog($id: String!) {
  auditLog(id: $id) {
    id
    userId
    user {
      email
      firstName
      lastName
    }
    action
    entityType
    entityId
    metadata
    ipAddress
    createdAt
  }
}
```

### Get Available Action Types

```graphql
query GetAuditActionTypes {
  auditActionTypes
}
```

### Get Entity Types

```graphql
query GetAuditEntityTypes {
  auditEntityTypes
}
```

### Export Audit Logs

```graphql
mutation ExportAuditLogs($filter: AuditFilterInput, $format: String) {
  exportAuditLogs(filter: $filter, format: $format) {
    url
    format
    expiresAt
  }
}
```

**Variables:**
```json
{
  "filter": {
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-12-31T23:59:59Z"
  },
  "format": "csv"
}
```

## Available Audit Actions

The following actions can be logged (from the `AuditAction` enum):

- `CREATE` - Entity creation
- `UPDATE` - Entity update
- `DELETE` - Entity deletion
- `LOGIN` - User login
- `LOGOUT` - User logout
- `PASSWORD_CHANGE` - Password change
- `EMAIL_VERIFY` - Email verification
- `PERMISSION_GRANT` - Permission granted
- `PERMISSION_REVOKE` - Permission revoked
- `MOVEMENT_CREATE` - Movement created
- `MOVEMENT_UPDATE` - Movement updated
- `MOVEMENT_DELETE` - Movement deleted
- `SUPER_ADMIN_ASSIGN` - Super Admin assigned
- `SUPER_ADMIN_REVOKE` - Super Admin revoked
- `PLATFORM_ADMIN_GRANT` - Platform Admin granted
- `PLATFORM_ADMIN_REVOKE` - Platform Admin revoked

## Permissions

Only users with the following roles can access audit logs:

- **Platform Admins** (`isPlatformAdmin = true`)
- **Super Admins** (users in the `MovementAdmin` table)

## Database Schema

The `AuditLog` model in Prisma:

```prisma
model AuditLog {
  id          String      @id @default(uuid())
  userId      String?
  action      AuditAction
  entityType  String
  entityId    String?
  metadata    Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  user        User?       @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## Best Practices

1. **Use Decorators for CRUD Operations**: For standard create/update/delete operations, use the `@Audit` decorator with `AuditInterceptor`.

2. **Manual Logging for Auth Events**: For authentication-related events (login, logout, password changes), use manual logging to capture detailed information.

3. **Include Metadata**: Always include relevant metadata to provide context for the action. Avoid logging sensitive information like passwords.

4. **Don't Log PII**: Be careful not to log personally identifiable information in metadata unless absolutely necessary.

5. **Use Helper Methods**: Use the helper methods (`logUserAction`, `logMovementAction`, `logOrgAction`) to ensure consistent logging patterns.

6. **Handle Errors**: The audit service catches and logs errors internally to prevent audit logging from breaking the main application flow.

## Examples

### Example 1: Auditing Organization Creation

```typescript
@Mutation(() => Organization)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Organization')
async createOrganization(
  @CurrentUser() user: any,
  @Args('input') input: CreateOrganizationInput,
) {
  return this.organizationsService.create(input, user.id);
}
```

### Example 2: Auditing Super Admin Assignment

```typescript
async assignSuperAdmin(
  movementId: string,
  userId: string,
  assignedBy: string,
  request: any,
) {
  const assignment = await this.prisma.movementAdmin.create({
    data: { movementId, userId, assignedBy },
  });

  await this.auditService.logMovementAction(
    assignedBy,
    AuditAction.SUPER_ADMIN_ASSIGN,
    movementId,
    'MovementAdmin',
    assignment.id,
    {
      targetUserId: userId,
      movementId,
    },
    request,
  );

  return assignment;
}
```

### Example 3: Auditing User Deletion

```typescript
async deleteUser(userId: string, deletedBy: string, request: any) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  await this.auditService.log({
    userId: deletedBy,
    action: AuditAction.DELETE,
    entityType: 'User',
    entityId: userId,
    metadata: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    ipAddress: this.extractIp(request),
    userAgent: request.headers['user-agent'],
  });

  await this.prisma.user.delete({ where: { id: userId } });
}
```

## Testing

Example test for audit logging:

```typescript
describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuditService, PrismaService],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create an audit log', async () => {
    const spy = jest.spyOn(prisma.auditLog, 'create');

    await service.log({
      userId: 'user-123',
      action: AuditAction.CREATE,
      entityType: 'Organization',
      entityId: 'org-123',
      metadata: { name: 'Test Org' },
    });

    expect(spy).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        action: AuditAction.CREATE,
        entityType: 'Organization',
        entityId: 'org-123',
      }),
    });
  });
});
```

## Future Enhancements

- [ ] Real-time audit log streaming via WebSockets
- [ ] Automated alerts for suspicious activities
- [ ] Audit log retention policies
- [ ] Integration with external SIEM systems
- [ ] Enhanced metadata extraction from GraphQL operations
- [ ] Audit log archiving to cold storage
