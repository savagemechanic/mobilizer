import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark' | 'system';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface UIState {
  theme: Theme;
  isLoading: boolean;
  toasts: Toast[];

  // Actions
  setTheme: (theme: Theme) => void;
  setLoading: (loading: boolean) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isLoading: false,
      toasts: [],

      setTheme: (theme: Theme) => {
        set({ theme });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      showToast: (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        const newToast: Toast = {
          ...toast,
          id,
          duration: toast.duration || 3000,
        };

        set((state) => ({
          toasts: [...state.toasts, newToast],
        }));

        // Auto-hide toast after duration
        if (newToast.duration) {
          setTimeout(() => {
            get().hideToast(id);
          }, newToast.duration);
        }
      },

      hideToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        }));
      },

      clearToasts: () => {
        set({ toasts: [] });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
);
