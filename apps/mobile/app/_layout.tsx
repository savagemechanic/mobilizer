import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { ApolloProvider } from '@apollo/client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { client } from '@/lib/apollo-client';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import SplashScreen from '@/components/SplashScreen';

export default function RootLayout() {
  const { isAuthenticated, isLoading, restoreSession } = useAuthStore();
  const { theme } = useUIStore();

  // Restore session on app launch
  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    console.log('🔐 Auth state changed:', { isAuthenticated, isLoading });
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    console.log('⏳ Loading session...');
    return <SplashScreen />;
  }

  console.log('🎯 Rendering layout for:', isAuthenticated ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

  return (
    <ApolloProvider client={client}>
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
        </Stack>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
