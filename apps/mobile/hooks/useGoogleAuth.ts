import { useState, useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMutation } from '@apollo/client';
import { GOOGLE_LOGIN } from '@/lib/graphql/mutations/auth';
import { useAuthStore } from '@/store/auth';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// These should be configured in app.json or environment variables
const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || '';
const GOOGLE_IOS_CLIENT_ID = Constants.expoConfig?.extra?.googleIosClientId || '';
const GOOGLE_ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.googleAndroidClientId || '';

interface GoogleAuthResult {
  promptAsync: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useGoogleAuth(): GoogleAuthResult {
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const [googleLoginMutation, { loading: mutationLoading }] = useMutation(GOOGLE_LOGIN);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    handleGoogleResponse();
  }, [response]);

  const handleGoogleResponse = async () => {
    if (response?.type === 'success') {
      const { authentication } = response;

      if (authentication?.accessToken) {
        try {
          // Fetch user info from Google
          const userInfoResponse = await fetch(
            'https://www.googleapis.com/userinfo/v2/me',
            {
              headers: { Authorization: `Bearer ${authentication.accessToken}` },
            }
          );

          const userInfo = await userInfoResponse.json();

          if (userInfo.error) {
            throw new Error(userInfo.error.message);
          }

          // Call backend with Google user info
          const { data } = await googleLoginMutation({
            variables: {
              input: {
                googleId: userInfo.id,
                email: userInfo.email,
                firstName: userInfo.given_name || userInfo.name?.split(' ')[0] || 'User',
                lastName: userInfo.family_name || userInfo.name?.split(' ').slice(1).join(' ') || '',
                avatar: userInfo.picture,
              },
            },
          });

          if (data?.googleLogin) {
            const { accessToken, refreshToken, user } = data.googleLogin;
            await login(accessToken, refreshToken, user);
          }
        } catch (err: any) {
          console.error('Google login error:', err);
          setError(err.message || 'Failed to sign in with Google');
        }
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Google sign-in was cancelled');
    }
  };

  const handlePromptAsync = async () => {
    setError(null);
    try {
      await promptAsync();
    } catch (err: any) {
      setError(err.message || 'Failed to start Google sign-in');
    }
  };

  return {
    promptAsync: handlePromptAsync,
    isLoading: !request || mutationLoading,
    error,
  };
}
