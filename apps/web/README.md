# Mobilizer Web App

Next.js 15 web application for the Mobilizer social platform.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **GraphQL Client**: Apollo Client with WebSocket support
- **State Management**: Zustand (auth & UI state)
- **Form Handling**: React Hook Form + Zod validation
- **Date Utilities**: date-fns

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (auth)/              # Authentication pages (signin, signup, verify, etc.)
│   ├── (user)/              # User pages (feeds, events, messages, profile)
│   ├── admin/               # Admin pages (dashboard, members, posts, etc.)
│   ├── layout.tsx           # Root layout with Apollo Provider
│   ├── page.tsx             # Home page (redirects to feeds or signin)
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Header, Sidebar, AdminSidebar
│   ├── feed/                # Feed-related components
│   ├── chat/                # Chat/messaging components
│   └── shared/              # Shared utility components
├── lib/
│   ├── apollo-client.ts     # Apollo Client configuration
│   ├── apollo-provider.tsx  # Apollo Provider wrapper
│   ├── utils.ts             # Utility functions (cn)
│   └── graphql/
│       ├── queries/         # GraphQL queries
│       └── mutations/       # GraphQL mutations
├── store/
│   ├── auth-store.ts        # Authentication Zustand store
│   └── ui-store.ts          # UI state Zustand store
└── types/
    └── index.ts             # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- GraphQL backend running (see backend project)

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your GraphQL backend URLs:
```env
NEXT_PUBLIC_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
NEXT_PUBLIC_GRAPHQL_WS_URL=ws://localhost:4000/graphql
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

Run the development server:
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:
```bash
yarn build
```

### Production

Start production server:
```bash
yarn start
```

## Features

### Authentication
- Sign in / Sign up
- Email verification
- Password reset flow
- JWT token-based authentication
- Persistent sessions via localStorage

### User Features
- **Feeds**: Create and view posts, like/comment
- **Events**: Browse and view events, register for events
- **Messages**: Real-time chat with WebSocket subscriptions
- **Profile**: View and edit user profiles
- **Discover**: Explore new content and users
- **Notifications**: Activity notifications

### Admin Features
- **Dashboard**: Analytics and statistics
- **Members**: User management
- **Posts**: Content moderation
- **Events**: Event management
- **Wallet**: Transaction management
- **Organizations**: Organization CRUD
- **Audit**: Activity logs
- **Permissions**: Role and permission management

## GraphQL Integration

The app uses Apollo Client for GraphQL operations:

- **Queries**: Data fetching with caching
- **Mutations**: Create, update, delete operations
- **Subscriptions**: Real-time updates (messages)
- **Auth**: JWT token injection via auth link
- **WebSocket**: GraphQL subscriptions support

## State Management

### Zustand Stores

**Auth Store** (`auth-store.ts`):
- User data
- JWT token
- Login/logout actions
- Persistent storage

**UI Store** (`ui-store.ts`):
- Sidebar state
- Theme preference
- UI toggles

## Styling

Uses Tailwind CSS with shadcn/ui components:
- Consistent design system
- Dark mode support
- Responsive layouts
- Accessible components

## Key Pages

### Public Routes
- `/signin` - Sign in page
- `/signup` - Registration page
- `/verify` - Email verification
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token

### User Routes (Protected)
- `/feeds` - Social feed
- `/events` - Browse events
- `/events/[id]` - Event details
- `/messages` - Chat conversations
- `/messages/[id]` - Specific conversation
- `/notifications` - Activity notifications
- `/profile/[id]` - View user profile
- `/profile/edit` - Edit own profile
- `/discover` - Explore content

### Admin Routes (Protected)
- `/admin/dashboard` - Admin dashboard
- `/admin/members` - User management
- `/admin/members/[id]` - User details
- `/admin/posts` - Post management
- `/admin/events` - Event management
- `/admin/wallet` - Wallet/transactions
- `/admin/orgs` - Organizations list
- `/admin/orgs/create` - Create organization
- `/admin/orgs/[id]` - Organization details
- `/admin/audit` - Audit logs
- `/admin/permissions` - Permissions management

## Development Notes

- All routes are type-safe with TypeScript
- Protected routes automatically redirect unauthenticated users
- Forms use Zod validation schemas
- Apollo Client handles caching and optimistic updates
- WebSocket connection for real-time features
- Responsive design for mobile and desktop

## Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Private - All rights reserved
