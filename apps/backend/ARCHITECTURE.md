# Mobilizer v2 Backend Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  (React Web App, Mobile Apps, Third-party Integrations)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ GraphQL over HTTP
                           │ Authorization: Bearer JWT
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NestJS Application                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    GraphQL Layer                        │   │
│  │  - Apollo Server (Code-First)                          │   │
│  │  - Schema Auto-generation                              │   │
│  │  - Playground (Dev)                                    │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │              Guards & Middleware                        │   │
│  │  - GqlAuthGuard (JWT Validation)                       │   │
│  │  - RolesGuard (RBAC)                                   │   │
│  │  - ScopesGuard (Permissions)                           │   │
│  │  - ValidationPipe (Input Validation)                   │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │                  Resolvers Layer                        │   │
│  │  ┌──────────┬──────────┬──────────┬──────────────┐     │   │
│  │  │   Auth   │  Users   │   Org    │    Posts     │     │   │
│  │  ├──────────┼──────────┼──────────┼──────────────┤     │   │
│  │  │  Events  │   Chat   │  Notifs  │   ...more    │     │   │
│  │  └──────────┴──────────┴──────────┴──────────────┘     │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │                 Service Layer                           │   │
│  │  - Business Logic                                       │   │
│  │  - Data Validation                                      │   │
│  │  - Authorization Checks                                 │   │
│  │  - Notification Creation                                │   │
│  └────────────────┬────────────────────────────────────────┘   │
│                   │                                             │
│  ┌────────────────▼────────────────────────────────────────┐   │
│  │              Prisma Service                             │   │
│  │  - ORM Layer                                            │   │
│  │  - Query Builder                                        │   │
│  │  - Type Safety                                          │   │
│  └────────────────┬────────────────────────────────────────┘   │
└───────────────────┼─────────────────────────────────────────────┘
                    │
       ┌────────────┴────────────┐
       │                         │
       ▼                         ▼
┌─────────────┐          ┌─────────────┐
│ PostgreSQL  │          │    Redis    │
│  Database   │          │   Cache     │
│             │          │             │
│ - Users     │          │ - Sessions  │
│ - Orgs      │          │ - Temp Data │
│ - Posts     │          │ - Queues    │
│ - Messages  │          │             │
└─────────────┘          └─────────────┘
```

## Module Architecture

### Auth Module
```
auth/
├── Resolver: GraphQL endpoints
│   ├── register
│   ├── login
│   ├── refreshToken
│   ├── verifyEmail
│   ├── forgotPassword
│   ├── resetPassword
│   └── me
├── Service: Business logic
│   ├── Password hashing (bcrypt)
│   ├── JWT token generation
│   ├── Token validation
│   └── User authentication
├── Strategy: Passport JWT
│   └── Token verification
└── DTOs
    ├── LoginInput
    ├── RegisterInput
    └── AuthPayload
```

### Users Module
```
users/
├── Resolver: User operations
│   ├── user(id)
│   ├── searchUsers
│   ├── updateProfile
│   ├── followUser
│   ├── unfollowUser
│   ├── followers
│   └── following
├── Service: User management
│   ├── Profile updates
│   ├── User search
│   └── Follow relationships
└── DTOs
    └── UpdateProfileInput
```

### Organizations Module
```
organizations/
├── Resolver: Org operations
│   ├── organizations (list with filters)
│   ├── organization(id)
│   ├── organizationBySlug
│   ├── myOrganizations
│   ├── createOrganization
│   ├── joinOrganization
│   └── leaveOrganization
├── Service: Org management
│   ├── Hierarchical structure
│   ├── Membership management
│   └── Organization filtering
└── DTOs
    ├── CreateOrgInput
    └── OrgFilterInput
```

### Posts Module
```
posts/
├── Resolver: Social feed
│   ├── feed (personalized)
│   ├── post(id)
│   ├── createPost
│   ├── deletePost
│   ├── likePost
│   ├── createComment
│   └── castVote
├── Service: Post logic
│   ├── Feed generation
│   ├── Like/unlike
│   ├── Comments
│   └── Poll voting
└── DTOs
    └── CreatePostInput
```

### Events Module
```
events/
├── Resolver: Event operations
│   ├── events (list)
│   ├── event(id)
│   ├── myEvents
│   ├── createEvent
│   └── rsvpEvent
├── Service: Event management
│   ├── Event creation
│   ├── RSVP tracking
│   └── Attendee management
└── DTOs
    └── CreateEventInput
```

### Chat Module
```
chat/
├── Resolver: Messaging
│   ├── conversations
│   ├── messages
│   ├── createConversation
│   ├── sendMessage
│   ├── markAsRead
│   └── markConversationAsRead
├── Service: Chat logic
│   ├── Conversation management
│   ├── Message sending
│   └── Read receipts
└── DTOs
    └── SendMessageInput
```

### Notifications Module
```
notifications/
├── Resolver: Notifications
│   ├── notifications
│   ├── unreadNotificationCount
│   ├── markNotificationRead
│   ├── markAllNotificationsRead
│   └── deleteNotification
└── Service: Notification logic
    ├── Notification creation
    ├── Mark as read
    └── Count unread
```

## Data Flow Examples

### User Registration Flow
```
1. Client sends GraphQL mutation:
   register(input: { email, password, firstName, lastName })

2. Resolver receives request
   └─> Validates input (ValidationPipe)

3. Auth Service processes
   ├─> Checks if user exists
   ├─> Hashes password (bcrypt)
   ├─> Creates user in database (Prisma)
   ├─> Generates JWT tokens
   └─> Stores refresh token

4. Returns AuthPayload
   └─> { accessToken, refreshToken, user }
```

### Protected Query Flow (e.g., Get Feed)
```
1. Client sends GraphQL query with JWT:
   Headers: { Authorization: "Bearer <token>" }
   Query: feed(limit: 20)

2. GqlAuthGuard intercepts
   ├─> Extracts JWT from header
   ├─> Verifies JWT signature
   └─> Validates user exists

3. JwtStrategy validates
   ├─> Decodes JWT payload
   ├─> Loads user from database
   └─> Attaches user to request context

4. Resolver executes
   └─> Has access to @CurrentUser()

5. Posts Service generates feed
   ├─> Gets user's organizations
   ├─> Gets user's following list
   ├─> Queries posts from both
   └─> Orders by recency

6. Returns posts array
```

### Post Creation with Notification Flow
```
1. User creates post
   └─> createPost(input: { content, orgId })

2. Posts Service
   ├─> Creates post in database
   └─> Returns post

3. If post in organization
   └─> Members may be notified (future enhancement)

4. Returns created post to client
```

### Like Post with Notification Flow
```
1. User likes post
   └─> likePost(postId)

2. Posts Service
   ├─> Checks if already liked
   ├─> Creates/removes like
   ├─> Updates like count
   └─> If post author ≠ liker:
       └─> Creates notification
           └─> Notifications Service
               └─> Stores in database

3. Returns boolean (liked/unliked)

4. Notification appears in author's feed
   └─> notifications query
```

## Database Schema Highlights

### Relationships
```
User
  ├── 1:Many → Posts
  ├── 1:Many → Comments
  ├── 1:Many → Likes
  ├── 1:Many → OrgMemberships
  ├── 1:Many → EventRSVPs
  ├── 1:Many → Conversations (via Participants)
  ├── 1:Many → Messages
  ├── 1:Many → Notifications
  ├── 1:1 → Wallet
  └── Many:Many → Users (via Follow)

Organization
  ├── 1:Many → OrgMemberships
  ├── 1:Many → Posts
  ├── 1:Many → Events
  └── 1:Many → Children (hierarchical)

Post
  ├── 1:Many → Comments
  ├── 1:Many → Likes
  └── 1:1 → Poll (optional)

Conversation
  ├── 1:Many → Participants
  └── 1:Many → Messages
```

### Indexes
- User: email, phoneNumber, isActive
- Post: authorId, orgId, createdAt, isPublished
- Organization: slug, level, parentId, isActive
- Message: conversationId, senderId, createdAt
- Notification: userId, isRead, createdAt
- All foreign keys automatically indexed

## Security Architecture

### Authentication Flow
```
1. User registers/logs in
   └─> Receives accessToken (15min) + refreshToken (7d)

2. Client stores tokens
   └─> accessToken in memory
   └─> refreshToken in httpOnly cookie (recommended)

3. API requests include accessToken
   └─> Authorization: Bearer <accessToken>

4. GqlAuthGuard validates token
   └─> Checks signature
   └─> Checks expiration
   └─> Loads user

5. When accessToken expires
   └─> Client calls refreshToken mutation
   └─> Receives new token pair
```

### Authorization Layers
```
1. Authentication (GqlAuthGuard)
   └─> Verifies user is logged in

2. Roles (RolesGuard + @Roles decorator)
   └─> @Roles('ADMIN', 'MODERATOR')
   └─> Checks user has required role

3. Scopes (ScopesGuard + @Scopes decorator)
   └─> @Scopes('posts:write', 'users:read')
   └─> Checks user has required permissions

4. Resource ownership
   └─> Service-level checks
   └─> "Can this user modify this post?"
```

### Input Validation
```
1. class-validator on DTOs
   ├─> @IsEmail()
   ├─> @IsNotEmpty()
   ├─> @MinLength(6)
   └─> Auto-validated by ValidationPipe

2. Prisma schema constraints
   ├─> @unique
   ├─> @default
   └─> Required fields

3. Business logic validation
   └─> Service-level checks
```

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Eager loading with Prisma includes
- Pagination on all list queries
- Efficient joins for related data

### Caching Strategy (Future)
```
Redis Cache:
├── User sessions
├── Frequently accessed data
│   ├── User profiles
│   ├── Organization details
│   └── Popular posts
└── Real-time features
    ├── Unread counts
    └── Online status
```

### Query Optimization
- Use select to limit returned fields
- Avoid N+1 queries with includes
- Implement cursor-based pagination for large datasets
- Add database query logging in development

## Scalability Path

### Horizontal Scaling
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ NestJS 1 │  │ NestJS 2 │  │ NestJS 3 │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     └─────────────┼─────────────┘
                   │
            ┌──────▼──────┐
            │Load Balancer│
            └──────┬──────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼────┐  ┌────▼────┐  ┌────▼────┐
│PostgreSQL│  │  Redis  │  │ Storage │
│(Primary) │  │ Cluster │  │   S3    │
└─────────┘  └─────────┘  └─────────┘
```

### Microservices Evolution (Future)
- Chat Service (WebSocket)
- Notification Service (Push)
- Media Processing Service
- Analytics Service
- Email Service

## Development Workflow

```
1. Create Feature Branch
   └─> git checkout -b feature/new-module

2. Add/Modify Prisma Schema
   └─> prisma/schema.prisma

3. Generate Migration
   └─> yarn prisma:migrate

4. Create/Update Module
   ├─> DTOs (input/output types)
   ├─> Service (business logic)
   ├─> Resolver (GraphQL endpoints)
   └─> Module (wire together)

5. Test in Playground
   └─> http://localhost:4000/graphql

6. Write Tests
   ├─> Unit tests (*.spec.ts)
   └─> E2E tests

7. Commit & Push
   └─> git commit -m "Add feature"
```

## Error Handling

```
┌─────────────────┐
│  Service Error  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ NestJS Exception    │
│ - BadRequest        │
│ - Unauthorized      │
│ - Forbidden         │
│ - NotFound          │
│ - Conflict          │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│GqlHttpExceptionFilter│
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  GraphQL Error      │
│  {                  │
│    message: "..."   │
│    code: "..."      │
│    statusCode: xxx  │
│  }                  │
└─────────────────────┘
```

## Monitoring & Logging

### Current
- Console logging in development
- Prisma query logging
- NestJS built-in logger

### Future Enhancements
- Structured logging (Winston)
- APM (Application Performance Monitoring)
- Error tracking (Sentry)
- Database query analytics
- GraphQL operation tracking

## Testing Strategy

### Unit Tests
- Service business logic
- Helper functions
- Guards and decorators

### Integration Tests
- Resolver to service integration
- Database operations
- Authentication flow

### E2E Tests
- Complete user flows
- API contract testing
- GraphQL schema validation

## Deployment Architecture

### Development
```
Local Machine
├── NestJS (yarn start:dev)
├── PostgreSQL (local)
└── Redis (local)
```

### Staging
```
Cloud VM/Container
├── NestJS (Docker)
├── PostgreSQL (Managed DB)
└── Redis (Managed Cache)
```

### Production
```
Kubernetes Cluster
├── NestJS Pods (3+ replicas)
├── PostgreSQL (AWS RDS/Cloud SQL)
├── Redis (ElastiCache/MemoryStore)
└── Load Balancer
```

## API Documentation

- GraphQL Schema auto-generated
- GraphQL Playground for exploration
- Introspection enabled
- All types strongly typed
- Auto-completion in clients

## Future Enhancements

1. **Real-time Features**
   - WebSocket subscriptions
   - Live chat updates
   - Real-time notifications

2. **Advanced Features**
   - File upload handling
   - Image processing
   - Video transcoding
   - Email notifications
   - SMS notifications
   - Push notifications

3. **Analytics**
   - User activity tracking
   - Engagement metrics
   - Performance monitoring

4. **Admin Features**
   - User management dashboard
   - Content moderation
   - System health monitoring
   - Audit log viewer

This architecture provides a solid foundation for the Mobilizer v2 platform with room for growth and optimization.
