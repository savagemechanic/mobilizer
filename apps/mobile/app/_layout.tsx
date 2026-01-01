import { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { client } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import CustomSplashScreen from '@/components/SplashScreen';
import { usePushNotifications } from '@/hooks/usePushNotifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen may already be hidden
});

// Error Boundary Component
function ErrorFallback({ error }: { error: Error }) {
  return (
    <View style={errorStyles.container}>
      <Text style={errorStyles.title}>Something went wrong</Text>
      <Text style={errorStyles.message}>{error.message}</Text>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

// Push notification handler component (must be inside ApolloProvider)
function PushNotificationHandler({ children }: { children: React.ReactNode }) {
  usePushNotifications();
  return <>{children}</>;
}

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const { theme } = useUIStore();
  const [appIsReady, setAppIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Restore session on app launch with timeout protection
  useEffect(() => {
    async function prepare() {
      try {
        console.log('🚀 App starting...');

        // Add timeout protection (5 seconds max)
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error('Session restore timeout')), 5000);
        });

        const restorePromise = restoreSession();

        // Race between restore and timeout
        await Promise.race([restorePromise, timeoutPromise]).catch((err) => {
          console.warn('⚠️ Session restore issue:', err.message);
          // Don't throw - just continue without session
        });

        console.log('✅ App preparation complete');
      } catch (e) {
        console.error('❌ Error during app preparation:', e);
        setError(e instanceof Error ? e : new Error('Unknown error'));
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Hide splash screen when app is ready
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately
      await SplashScreen.hideAsync().catch(() => {
        // Ignore errors
      });
    }
  }, [appIsReady]);

  useEffect(() => {
    console.log('🔐 Auth state changed:', { isAuthenticated, isLoading, appIsReady });
  }, [isAuthenticated, isLoading, appIsReady]);

  // Show error screen if something went wrong
  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Show custom splash while app is preparing
  if (!appIsReady || isLoading) {
    console.log('⏳ Loading...', { appIsReady, isLoading });
    return <CustomSplashScreen />;
  }

  console.log('🎯 Rendering layout for:', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <ApolloProvider client={client}>
        <PushNotificationHandler>
          <SafeAreaProvider>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
            <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme === 'dark' ? '#000' : '#fff' },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(modals)/create-post"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="organization/[slug]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="event/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="user/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="conversation/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="post/[id]"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="create-event"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="edit-profile"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen
              name="join-organization"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="new-conversation"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen
              name="notifications"
              options={{
                headerShown: false,
                presentation: 'card',
              }}
            />
          </Stack>
          </SafeAreaProvider>
        </PushNotificationHandler>
      </ApolloProvider>
    </GestureHandlerRootView>
  );
}
