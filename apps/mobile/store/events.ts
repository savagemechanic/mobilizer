import { create } from 'zustand';

export interface Event {
  id: string;
  title: string;
  description: string;
  type: string;
  startTime: string;
  endTime?: string;
  location?: string;
  isVirtual: boolean;
  virtualLink?: string;
  banner?: string;
  isPublished: boolean;
  orgId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt?: string;
}

interface EventsState {
  // State
  events: Event[];
  myEvents: Event[];
  currentEvent: Event | null;
  offset: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Actions
  setEvents: (events: Event[]) => void;
  addEvents: (events: Event[], replace?: boolean) => void;
  setMyEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => void;
  updateEvent: (eventId: string, updates: Partial<Event>) => void;
  removeEvent: (eventId: string) => void;

  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  incrementOffset: () => void;
  resetPagination: () => void;

  // RSVP actions
  optimisticRSVP: (eventId: string) => void;
  optimisticCancelRSVP: (eventId: string) => void;
}

export const useEventsStore = create<EventsState>((set, get) => ({
  // Initial state
  events: [],
  myEvents: [],
  currentEvent: null,
  offset: 0,
  limit: 20,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,
  error: null,

  // Set events (replace all)
  setEvents: (events: Event[]) => {
    set({ events });
  },

  // Add events (append or replace)
  addEvents: (events: Event[], replace = false) => {
    set((state) => ({
      events: replace ? events : [...state.events, ...events],
      // hasMore is true only if we received a full page of results
      // If we get fewer items than the limit, there are no more to load
      hasMore: events.length >= state.limit,
    }));
  },

  // Set my events
  setMyEvents: (myEvents: Event[]) => {
    set({ myEvents });
  },

  // Set current event
  setCurrentEvent: (currentEvent: Event | null) => {
    set({ currentEvent });
  },

  // Update event by ID
  updateEvent: (eventId: string, updates: Partial<Event>) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === eventId ? { ...event, ...updates } : event
      ),
      myEvents: state.myEvents.map((event) =>
        event.id === eventId ? { ...event, ...updates } : event
      ),
      currentEvent:
        state.currentEvent?.id === eventId
          ? { ...state.currentEvent, ...updates }
          : state.currentEvent,
    }));
  },

  // Remove event by ID
  removeEvent: (eventId: string) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
      myEvents: state.myEvents.filter((event) => event.id !== eventId),
    }));
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set refreshing state
  setRefreshing: (refreshing: boolean) => {
    set({ isRefreshing: refreshing });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Set hasMore flag
  setHasMore: (hasMore: boolean) => {
    set({ hasMore });
  },

  // Increment offset for pagination
  incrementOffset: () => {
    set((state) => ({
      offset: state.offset + state.limit,
    }));
  },

  // Reset pagination
  resetPagination: () => {
    set({
      events: [],
      offset: 0,
      hasMore: true,
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  },

  // Optimistic RSVP
  optimisticRSVP: (eventId: string) => {
    const event = get().events.find((e) => e.id === eventId);
    if (event && !get().myEvents.find((e) => e.id === eventId)) {
      set((state) => ({
        myEvents: [...state.myEvents, event],
      }));
    }
  },

  // Optimistic cancel RSVP
  optimisticCancelRSVP: (eventId: string) => {
    set((state) => ({
      myEvents: state.myEvents.filter((event) => event.id !== eventId),
    }));
  },
}));
