import { Redirect, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import SplashScreen from '@/components/SplashScreen';
import WelcomePage from '@/components/WelcomePage';

export default function Index() {
  const router = useRouter();
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

  // Show welcome page with login/register CTA buttons
  console.log('📍 Index: Showing welcome page');
  return (
    <WelcomePage
      onLogin={() => router.push('/(auth)/login')}
      onRegister={() => router.push('/(auth)/register')}
    />
  );
}
