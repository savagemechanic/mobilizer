import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User } from '@/types';
import { client } from '@/lib/apollo-client';
import { REFRESH_TOKEN } from '@/lib/graphql/mutations/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (token: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  refreshAccessToken: () => Promise<boolean>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (token: string, refreshToken: string, user: User) => {
        try {
          // Store tokens in SecureStore
          await SecureStore.setItemAsync('accessToken', token);
          await SecureStore.setItemAsync('refreshToken', refreshToken);

          // Update state
          set({
            token,
            refreshToken,
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error during login:', error);
          throw error;
        }
      },

      logout: async () => {
        try {
          // Clear tokens from SecureStore
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');

          // Clear Apollo cache
          await client.clearStore();

          // Reset state
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error during logout:', error);
        }
      },

      updateUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      refreshAccessToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;

          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          const { data } = await client.mutate({
            mutation: REFRESH_TOKEN,
            variables: { refreshToken: currentRefreshToken },
          });

          if (data?.refreshToken) {
            const { accessToken, refreshToken: newRefreshToken, user } = data.refreshToken;

            // Update tokens
            await SecureStore.setItemAsync('accessToken', accessToken);
            await SecureStore.setItemAsync('refreshToken', newRefreshToken);

            set({
              token: accessToken,
              refreshToken: newRefreshToken,
              user,
              isAuthenticated: true,
            });

            return true;
          }

          return false;
        } catch (error) {
          console.error('Error refreshing token:', error);
          // If refresh fails, logout user
          await get().logout();
          return false;
        }
      },

      restoreSession: async () => {
        try {
          console.log('🔄 Restoring session...');
          set({ isLoading: true });

          // Try to get tokens from SecureStore with individual try-catch
          let token: string | null = null;
          let refreshToken: string | null = null;

          try {
            token = await SecureStore.getItemAsync('accessToken');
          } catch (e) {
            console.warn('⚠️ Failed to get accessToken:', e);
          }

          try {
            refreshToken = await SecureStore.getItemAsync('refreshToken');
          } catch (e) {
            console.warn('⚠️ Failed to get refreshToken:', e);
          }

          console.log('🔑 Tokens found:', { hasToken: !!token, hasRefreshToken: !!refreshToken });

          if (token && refreshToken) {
            // Set tokens in state and mark as authenticated
            // We'll validate the token when making actual API calls
            set({
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });

            console.log('✅ Session restored (tokens loaded, will validate on first API call)');
          } else {
            // No tokens found
            console.log('ℹ️ No tokens found, user not logged in');
            set({
              token: null,
              refreshToken: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('❌ Error restoring session:', error);
          // Ensure we always set isLoading to false
          set({
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist user data, not tokens (tokens are in SecureStore)
        user: state.user,
      }),
    }
  )
);
