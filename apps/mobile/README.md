# Mobilizer v2 Mobile App

React Native mobile application built with Expo for the Mobilizer v2 platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and Yarn
- Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- OR Android Studio / Xcode for emulators

### Installation

```bash
# From the monorepo root
cd apps/mobile

# Install dependencies (if not already done)
yarn install

# Start the development server
yarn start
```

## 🔧 Configuration

### Backend URL

The app is configured to use the **Render production backend** by default:

**Current Configuration** (`.env`):
```env
EXPO_PUBLIC_GRAPHQL_HTTP_URL=https://mobilizer-backend-dyw1.onrender.com/graphql
EXPO_PUBLIC_API_URL=https://mobilizer-backend-dyw1.onrender.com
EXPO_PUBLIC_ENV=production
```

### Switching to Local Backend

To use a local backend during development:

1. Start your local backend (from `apps/backend`):
   ```bash
   yarn dev
   ```

2. Find your local IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # On Windows
   ipconfig
   ```

3. Update `.env` with your local IP:
   ```env
   EXPO_PUBLIC_GRAPHQL_HTTP_URL=http://YOUR_LOCAL_IP:4000/graphql
   EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4000
   EXPO_PUBLIC_ENV=development
   ```

   **Note:** Use your local network IP (e.g., `192.168.1.12`), not `localhost`, so physical devices can connect.

## 📱 Running the App

### Option 1: Expo Go (Recommended for Development)

1. Start the development server:
   ```bash
   yarn start
   ```

2. Scan the QR code:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app

### Option 2: iOS Simulator (macOS only)

```bash
yarn ios
```

### Option 3: Android Emulator

```bash
yarn android
```

### Option 4: Web (for testing only)

```bash
yarn web
```

## 📦 Available Scripts

```bash
yarn start          # Start Expo development server
yarn android        # Run on Android emulator/device
yarn ios            # Run on iOS simulator/device
yarn web            # Run in web browser
yarn lint           # Run ESLint
yarn typecheck      # Run TypeScript type checking
yarn clean          # Clean build artifacts
```

## 🏗️ Project Structure

```
apps/mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab screens (Feed, Discover, Events, Messages, Profile)
│   ├── (modals)/          # Modal screens
│   └── organization/      # Organization detail routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components (Button, Avatar)
│   ├── feed/             # Feed components (PostCard)
│   ├── events/           # Event components (EventCard)
│   └── organizations/    # Organization components
├── lib/                  # Libraries and utilities
│   └── graphql/          # GraphQL queries and mutations
├── store/                # Zustand state stores
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── assets/               # Images, fonts, etc.
```

## 🔐 Authentication

The app uses JWT token-based authentication:
- Access tokens stored securely in Expo SecureStore
- Auto-login on app launch
- Token refresh mechanism for expired tokens
- Session restoration from SecureStore

## 🎨 Features Implemented

### ✅ Phase 1: Authentication
- Login / Register
- Email verification
- Password reset
- Token management

### ✅ Phase 2: Social Feed
- Browse posts with infinite scroll
- Create posts (text, images, polls)
- Like, comment, share
- Poll voting
- Real-time updates (polling)

### ✅ Phase 3: Organizations
- Browse organizations
- Search and filter
- Join/Leave organizations
- View organization details
- Member lists
- Hierarchical location system

### ✅ Phase 4: Events
- Browse upcoming events
- RSVP to events
- My events calendar
- Event types and categories
- Virtual/in-person indicators

### ✅ Phase 5: Messaging
- Conversations list
- Message display
- Foundation for real-time chat

### ✅ Phase 6-9: Polish
- Profile management
- Settings and preferences
- Theme switching (Light/Dark)
- Optimistic UI updates
- Error handling
- Empty states

## 🌐 Backend Integration

The app connects to the NestJS GraphQL backend via Apollo Client:

### Production Backend (Render)
- **URL**: https://mobilizer-backend-dyw1.onrender.com
- **GraphQL Endpoint**: /graphql
- **Status**: Live

### Local Backend (Development)
- **URL**: http://YOUR_LOCAL_IP:4000
- **GraphQL Endpoint**: /graphql
- **Requirements**: Backend running locally

## 🐛 Troubleshooting

### Backend Connection Issues

If you see "Network request failed" or "Failed to fetch":

1. **Check backend status**:
   ```bash
   curl https://mobilizer-backend-dyw1.onrender.com/graphql \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"query":"{ __typename }"}'
   ```

2. **Render free tier**: The backend may sleep after inactivity. The first request will wake it up (may take 30-60 seconds).

3. **CORS issues**: Ensure the backend's `CORS_ORIGIN` includes Expo's domain.

### Metro Bundler Issues

```bash
# Clear Metro cache
yarn start --clear

# Reset everything
yarn clean
yarn install
yarn start --clear
```

### Package Version Warnings

The app may show warnings about package versions. These are typically safe to ignore for development. For production builds, ensure all packages match Expo's recommended versions.

## 📲 Building for Production

### Prerequisites
- Expo account (free): https://expo.dev/signup
- EAS CLI installed: `npm install -g eas-cli`

### Steps

1. **Login to Expo**:
   ```bash
   eas login
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

4. **Build for Android**:
   ```bash
   eas build --platform android
   ```

5. **Submit to App Stores**:
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## 📚 Tech Stack

- **Framework**: React Native + Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **GraphQL Client**: Apollo Client
- **Forms**: React Hook Form + Zod
- **Styling**: StyleSheet API
- **Icons**: @expo/vector-icons (Ionicons)
- **Authentication**: JWT with Expo SecureStore
- **Image Picking**: expo-image-picker
- **Date Formatting**: date-fns

## 🔄 Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app.

**Available Variables**:
- `EXPO_PUBLIC_GRAPHQL_HTTP_URL` - GraphQL endpoint
- `EXPO_PUBLIC_API_URL` - REST API base URL
- `EXPO_PUBLIC_ENV` - Environment (development/production)

## 📝 Notes

- **Render Backend**: The backend on Render's free tier may sleep after 15 minutes of inactivity. First requests may take 30-60 seconds to wake it up.
- **Network Access**: When using Expo Go on a physical device, ensure your phone and computer are on the same WiFi network.
- **Hot Reload**: Shake your device or press `Cmd/Ctrl + D` to open the developer menu.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev
3. Check the backend status on Render dashboard

## 📄 License

Part of the Mobilizer v2 monorepo project.
