import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationCounts {
  messages: number;
  events: number;
  notifications: number;
}

interface NotificationsState {
  counts: NotificationCounts;
  totalUnread: number;

  // Actions
  setCounts: (counts: Partial<NotificationCounts>) => void;
  incrementCount: (type: keyof NotificationCounts, amount?: number) => void;
  decrementCount: (type: keyof NotificationCounts, amount?: number) => void;
  clearCount: (type: keyof NotificationCounts) => void;
  clearAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      counts: {
        messages: 0,
        events: 0,
        notifications: 0,
      },
      totalUnread: 0,

      setCounts: (newCounts) => {
        set((state) => {
          const counts = { ...state.counts, ...newCounts };
          const totalUnread = counts.messages + counts.events + counts.notifications;
          return { counts, totalUnread };
        });
      },

      incrementCount: (type, amount = 1) => {
        set((state) => {
          const counts = {
            ...state.counts,
            [type]: state.counts[type] + amount,
          };
          const totalUnread = counts.messages + counts.events + counts.notifications;
          return { counts, totalUnread };
        });
      },

      decrementCount: (type, amount = 1) => {
        set((state) => {
          const newValue = Math.max(0, state.counts[type] - amount);
          const counts = {
            ...state.counts,
            [type]: newValue,
          };
          const totalUnread = counts.messages + counts.events + counts.notifications;
          return { counts, totalUnread };
        });
      },

      clearCount: (type) => {
        set((state) => {
          const counts = {
            ...state.counts,
            [type]: 0,
          };
          const totalUnread = counts.messages + counts.events + counts.notifications;
          return { counts, totalUnread };
        });
      },

      clearAll: () => {
        set({
          counts: {
            messages: 0,
            events: 0,
            notifications: 0,
          },
          totalUnread: 0,
        });
      },
    }),
    {
      name: 'notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
