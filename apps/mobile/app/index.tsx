import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import SplashScreen from '@/components/SplashScreen';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  console.log('📍 Index route - Auth state:', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('📍 Index: Showing splash (loading)');
    return <SplashScreen />;
  }

  // Redirect based on auth status
  if (isAuthenticated) {
    console.log('📍 Index: Redirecting to (tabs) - User is authenticated');
    return <Redirect href="/(tabs)" />;
  }

  console.log('📍 Index: Redirecting to login - User not authenticated');
  return <Redirect href="/(auth)/login" />;
}
