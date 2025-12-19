# Audit Module - Usage Examples

This file contains practical examples of how to use the Audit module in various scenarios.

## Table of Contents

1. [Authentication Events](#authentication-events)
2. [User Management](#user-management)
3. [Movement Management](#movement-management)
4. [Organization Management](#organization-management)
5. [Post Management](#post-management)
6. [Event Management](#event-management)
7. [Permission Changes](#permission-changes)
8. [Querying Audit Logs](#querying-audit-logs)

---

## Authentication Events

### Login Event

```typescript
// In AuthService
import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private auditService: AuditService) {}

  async login(email: string, password: string, request: any) {
    const user = await this.validateUser(email, password);

    // Log successful login
    await this.auditService.logUserAction(
      user.id,
      AuditAction.LOGIN,
      'User',
      user.id,
      {
        email: user.email,
        loginMethod: 'email',
        success: true,
      },
      request,
    );

    return this.generateTokens(user);
  }

  async logout(userId: string, request: any) {
    // Log logout
    await this.auditService.logUserAction(
      userId,
      AuditAction.LOGOUT,
      'User',
      userId,
      {
        logoutTime: new Date(),
      },
      request,
    );

    await this.revokeTokens(userId);
  }
}
```

### Password Change

```typescript
async changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
  request: any,
) {
  await this.validatePassword(userId, oldPassword);
  await this.updatePassword(userId, newPassword);

  // Log password change
  await this.auditService.logUserAction(
    userId,
    AuditAction.PASSWORD_CHANGE,
    'User',
    userId,
    {
      changedAt: new Date(),
      method: 'self-service',
    },
    request,
  );
}
```

### Email Verification

```typescript
async verifyEmail(userId: string, token: string, request: any) {
  await this.validateVerificationToken(userId, token);
  await this.markEmailAsVerified(userId);

  // Log email verification
  await this.auditService.logUserAction(
    userId,
    AuditAction.EMAIL_VERIFY,
    'User',
    userId,
    {
      verifiedAt: new Date(),
      verificationMethod: 'email-token',
    },
    request,
  );
}
```

---

## User Management

### Create User (with Decorator)

```typescript
import { UseInterceptors } from '@nestjs/common';
import { Mutation, Args } from '@nestjs/graphql';
import { Audit, AuditInterceptor } from '../audit';
import { AuditAction } from '@prisma/client';

@Mutation(() => User)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'User')
async createUser(@Args('input') input: CreateUserInput) {
  const user = await this.usersService.create(input);
  return user; // Interceptor will log this automatically
}
```

### Update User Profile

```typescript
@Mutation(() => User)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.UPDATE, 'User')
async updateUserProfile(
  @CurrentUser() user: any,
  @Args('input') input: UpdateProfileInput,
) {
  return this.usersService.updateProfile(user.id, input);
}
```

### Delete User (Manual Logging)

```typescript
async deleteUser(userId: string, deletedBy: string, request: any) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  // Log before deletion (so we have user data)
  await this.auditService.logUserAction(
    deletedBy,
    AuditAction.DELETE,
    'User',
    userId,
    {
      deletedUser: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      reason: 'Admin deletion',
    },
    request,
  );

  await this.prisma.user.delete({ where: { id: userId } });
}
```

---

## Movement Management

### Create Movement

```typescript
@Mutation(() => Movement)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.MOVEMENT_CREATE, 'Movement')
async createMovement(
  @CurrentUser() user: any,
  @Args('input') input: CreateMovementInput,
) {
  // User must be Platform Admin
  if (!user.isPlatformAdmin) {
    throw new ForbiddenException('Only Platform Admins can create movements');
  }

  return this.movementsService.create(input, user.id);
}
```

### Update Movement

```typescript
@Mutation(() => Movement)
@UseGuards(GqlAuthGuard)
async updateMovement(
  @CurrentUser() user: any,
  @Args('id') id: string,
  @Args('input') input: UpdateMovementInput,
  @Args('context') context: any,
) {
  const movement = await this.movementsService.update(id, input);

  // Manual logging with movement context
  await this.auditService.logMovementAction(
    user.id,
    AuditAction.MOVEMENT_UPDATE,
    id,
    'Movement',
    id,
    {
      changes: input,
      previousName: movement.name,
    },
    context.req,
  );

  return movement;
}
```

### Assign Super Admin to Movement

```typescript
async assignSuperAdmin(
  movementId: string,
  userId: string,
  assignedBy: string,
  request: any,
) {
  const assignment = await this.prisma.movementAdmin.create({
    data: {
      movementId,
      userId,
      assignedBy,
    },
    include: {
      user: true,
      movement: true,
    },
  });

  // Log Super Admin assignment
  await this.auditService.logMovementAction(
    assignedBy,
    AuditAction.SUPER_ADMIN_ASSIGN,
    movementId,
    'MovementAdmin',
    assignment.id,
    {
      targetUserId: userId,
      targetUserEmail: assignment.user.email,
      movementName: assignment.movement.name,
    },
    request,
  );

  return assignment;
}
```

### Revoke Super Admin

```typescript
async revokeSuperAdmin(
  movementId: string,
  userId: string,
  revokedBy: string,
  request: any,
) {
  const assignment = await this.prisma.movementAdmin.findFirst({
    where: { movementId, userId },
    include: { user: true, movement: true },
  });

  // Log before deletion
  await this.auditService.logMovementAction(
    revokedBy,
    AuditAction.SUPER_ADMIN_REVOKE,
    movementId,
    'MovementAdmin',
    assignment.id,
    {
      targetUserId: userId,
      targetUserEmail: assignment.user.email,
      movementName: assignment.movement.name,
      revokedReason: 'Admin action',
    },
    request,
  );

  await this.prisma.movementAdmin.delete({
    where: { id: assignment.id },
  });
}
```

---

## Organization Management

### Create Organization

```typescript
@Mutation(() => Organization)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Organization')
async createOrganization(
  @CurrentUser() user: any,
  @Args('input') input: CreateOrganizationInput,
) {
  const org = await this.organizationsService.create(input, user.id);
  return org; // Will be logged automatically
}
```

### Update Organization

```typescript
@Mutation(() => Organization)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.UPDATE, 'Organization')
async updateOrganization(
  @CurrentUser() user: any,
  @Args('id') id: string,
  @Args('input') input: UpdateOrganizationInput,
) {
  return this.organizationsService.update(id, input);
}
```

### Delete Organization

```typescript
async deleteOrganization(
  orgId: string,
  deletedBy: string,
  request: any,
) {
  const org = await this.prisma.organization.findUnique({
    where: { id: orgId },
    include: { movement: true },
  });

  // Log with organization context
  await this.auditService.logOrgAction(
    deletedBy,
    AuditAction.DELETE,
    orgId,
    'Organization',
    orgId,
    {
      orgName: org.name,
      level: org.level,
      movementId: org.movementId,
      movementName: org.movement.name,
      memberCount: org.memberCount,
    },
    request,
  );

  await this.prisma.organization.delete({ where: { id: orgId } });
}
```

---

## Post Management

### Create Post

```typescript
@Mutation(() => Post)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Post')
async createPost(
  @CurrentUser() user: any,
  @Args('input') input: CreatePostInput,
) {
  return this.postsService.create(user.id, input);
}
```

### Delete Post (Content Moderation)

```typescript
async deletePost(
  postId: string,
  deletedBy: string,
  reason: string,
  request: any,
) {
  const post = await this.prisma.post.findUnique({
    where: { id: postId },
    include: {
      author: true,
      organization: true,
    },
  });

  // Log with detailed context for moderation tracking
  await this.auditService.log({
    userId: deletedBy,
    action: AuditAction.DELETE,
    entityType: 'Post',
    entityId: postId,
    metadata: {
      authorId: post.authorId,
      authorEmail: post.author.email,
      orgId: post.orgId,
      orgName: post.organization?.name,
      type: post.type,
      moderationReason: reason,
      contentPreview: post.content.substring(0, 100),
    },
    ipAddress: this.extractIp(request),
    userAgent: request.headers['user-agent'],
  });

  await this.prisma.post.delete({ where: { id: postId } });
}
```

---

## Event Management

### Create Event

```typescript
@Mutation(() => Event)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.CREATE, 'Event')
async createEvent(
  @CurrentUser() user: any,
  @Args('input') input: CreateEventInput,
) {
  return this.eventsService.create(user.id, input);
}
```

### Update Event

```typescript
@Mutation(() => Event)
@UseGuards(GqlAuthGuard)
@UseInterceptors(AuditInterceptor)
@Audit(AuditAction.UPDATE, 'Event')
async updateEvent(
  @CurrentUser() user: any,
  @Args('id') id: string,
  @Args('input') input: UpdateEventInput,
) {
  return this.eventsService.update(id, input);
}
```

---

## Permission Changes

### Grant Platform Admin

```typescript
async grantPlatformAdmin(
  targetUserId: string,
  grantedBy: string,
  request: any,
) {
  const user = await this.prisma.user.update({
    where: { id: targetUserId },
    data: { isPlatformAdmin: true },
  });

  // Log platform admin grant
  await this.auditService.logUserAction(
    grantedBy,
    AuditAction.PLATFORM_ADMIN_GRANT,
    'User',
    targetUserId,
    {
      targetUserEmail: user.email,
      targetUserName: `${user.firstName} ${user.lastName}`,
      grantedAt: new Date(),
    },
    request,
  );

  return user;
}
```

### Revoke Platform Admin

```typescript
async revokePlatformAdmin(
  targetUserId: string,
  revokedBy: string,
  reason: string,
  request: any,
) {
  const user = await this.prisma.user.update({
    where: { id: targetUserId },
    data: { isPlatformAdmin: false },
  });

  // Log platform admin revocation
  await this.auditService.logUserAction(
    revokedBy,
    AuditAction.PLATFORM_ADMIN_REVOKE,
    'User',
    targetUserId,
    {
      targetUserEmail: user.email,
      targetUserName: `${user.firstName} ${user.lastName}`,
      reason,
      revokedAt: new Date(),
    },
    request,
  );

  return user;
}
```

---

## Querying Audit Logs

### Get All Audit Logs for a User

```graphql
query GetUserAuditLogs($userId: String!) {
  auditLogs(
    filter: { userId: $userId }
    pagination: { page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" }
  ) {
    data {
      id
      action
      entityType
      entityId
      metadata
      ipAddress
      createdAt
    }
    total
    totalPages
  }
}
```

### Get All Movement-Related Audit Logs

```graphql
query GetMovementAuditLogs($movementId: String!) {
  auditLogs(
    filter: { movementId: $movementId }
    pagination: { page: 1, limit: 100 }
  ) {
    data {
      id
      user {
        email
        firstName
        lastName
      }
      action
      entityType
      entityId
      metadata
      createdAt
    }
    total
  }
}
```

### Get Admin Action Audit Logs

```graphql
query GetAdminActions {
  auditLogs(
    filter: {
      action: SUPER_ADMIN_ASSIGN
      startDate: "2025-01-01T00:00:00Z"
    }
    pagination: { page: 1, limit: 50 }
  ) {
    data {
      id
      user {
        email
        firstName
        lastName
      }
      action
      entityType
      entityId
      metadata
      createdAt
    }
    total
  }
}
```

### Search Audit Logs

```graphql
query SearchAuditLogs($searchTerm: String!) {
  auditLogs(
    filter: { search: $searchTerm }
    pagination: { page: 1, limit: 20 }
  ) {
    data {
      id
      user {
        email
      }
      action
      entityType
      entityId
      metadata
      createdAt
    }
    total
  }
}
```

### Export Audit Logs to CSV

```graphql
mutation ExportAuditLogs {
  exportAuditLogs(
    filter: {
      startDate: "2025-01-01T00:00:00Z"
      endDate: "2025-12-31T23:59:59Z"
    }
    format: "csv"
  ) {
    url
    format
    expiresAt
  }
}
```

### Get Audit Log Statistics

```graphql
query GetAuditStats {
  # Get all action types
  auditActionTypes

  # Get all entity types
  auditEntityTypes
}
```

---

## Complex Example: Complete User Lifecycle Audit

```typescript
@Injectable()
export class UserLifecycleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async completeUserLifecycle(request: any) {
    // 1. User Registration
    const user = await this.prisma.user.create({
      data: {
        email: 'user@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    await this.auditService.logUserAction(
      user.id,
      AuditAction.CREATE,
      'User',
      user.id,
      { email: user.email, registrationMethod: 'email' },
      request,
    );

    // 2. Email Verification
    await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true },
    });

    await this.auditService.logUserAction(
      user.id,
      AuditAction.EMAIL_VERIFY,
      'User',
      user.id,
      { verifiedAt: new Date() },
      request,
    );

    // 3. Login
    await this.auditService.logUserAction(
      user.id,
      AuditAction.LOGIN,
      'User',
      user.id,
      { loginMethod: 'email', success: true },
      request,
    );

    // 4. Profile Update
    await this.prisma.user.update({
      where: { id: user.id },
      data: { bio: 'Updated bio' },
    });

    await this.auditService.logUserAction(
      user.id,
      AuditAction.UPDATE,
      'User',
      user.id,
      { updatedFields: ['bio'] },
      request,
    );

    // 5. Password Change
    await this.auditService.logUserAction(
      user.id,
      AuditAction.PASSWORD_CHANGE,
      'User',
      user.id,
      { changedAt: new Date() },
      request,
    );

    // 6. Logout
    await this.auditService.logUserAction(
      user.id,
      AuditAction.LOGOUT,
      'User',
      user.id,
      { logoutTime: new Date() },
      request,
    );

    return user;
  }
}
```

---

## Best Practices from Examples

1. **Always log before deletion**: Capture entity data before it's removed
2. **Include context**: Add relevant metadata like movement/org IDs for filtering
3. **Use decorators for CRUD**: Simpler and more consistent
4. **Manual logging for complex scenarios**: Authentication, permissions, deletions
5. **Meaningful metadata**: Include enough context to understand what happened
6. **Don't log sensitive data**: Avoid passwords, tokens, etc.
7. **Use helper methods**: `logUserAction`, `logMovementAction`, `logOrgAction` for consistency
