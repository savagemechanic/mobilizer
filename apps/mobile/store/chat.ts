import { create } from 'zustand';
import { Conversation, Message } from '@/types';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;

  // Active conversation
  activeConversationId: string | null;
  messages: Record<string, Message[]>; // keyed by conversationId
  messagesLoading: Record<string, boolean>;
  messagesHasMore: Record<string, boolean>;

  // Unread counts
  unreadCounts: Record<string, number>; // keyed by conversationId
  totalUnreadCount: number;

  // Typing indicators (for future WebSocket support)
  typingUsers: Record<string, string[]>; // conversationId -> userIds

  // Actions - Conversations
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  setConversationsLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;

  // Actions - Messages
  setMessages: (conversationId: string, messages: Message[], replace?: boolean) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  setMessagesLoading: (conversationId: string, loading: boolean) => void;
  setMessagesHasMore: (conversationId: string, hasMore: boolean) => void;

  // Actions - Active conversation
  setActiveConversation: (conversationId: string | null) => void;

  // Actions - Unread counts
  setUnreadCount: (conversationId: string, count: number) => void;
  incrementUnreadCount: (conversationId: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  calculateTotalUnread: () => void;

  // Actions - Typing indicators
  setUserTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  // Actions - Optimistic updates
  optimisticSendMessage: (conversationId: string, tempMessage: Message) => void;
  confirmMessageSent: (conversationId: string, tempId: string, confirmedMessage: Message) => void;
  revertMessageSend: (conversationId: string, tempId: string) => void;

  // Actions - Reset
  reset: () => void;
}

const initialState = {
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  activeConversationId: null,
  messages: {},
  messagesLoading: {},
  messagesHasMore: {},
  unreadCounts: {},
  totalUnreadCount: 0,
  typingUsers: {},
};

export const useChatStore = create<ChatState>()((set, get) => ({
  ...initialState,

  // Conversations actions
  setConversations: (conversations) => {
    const unreadCounts: Record<string, number> = {};
    let totalUnread = 0;

    conversations.forEach((conv) => {
      const unread = conv.unreadCount || 0;
      unreadCounts[conv.id] = unread;
      totalUnread += unread;
    });

    set({
      conversations,
      unreadCounts,
      totalUnreadCount: totalUnread,
    });
  },

  addConversation: (conversation) => {
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    }));
  },

  updateConversation: (conversationId, updates) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    }));
  },

  setConversationsLoading: (loading) => {
    set({ conversationsLoading: loading });
  },

  setConversationsError: (error) => {
    set({ conversationsError: error });
  },

  // Messages actions
  setMessages: (conversationId, messages, replace = false) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: replace
          ? messages
          : [...(state.messages[conversationId] || []), ...messages],
      },
    }));
  },

  addMessage: (conversationId, message) => {
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      // Avoid duplicates
      if (existingMessages.some((m) => m.id === message.id)) {
        return state;
      }

      // Add to beginning (newest first for inverted list)
      return {
        messages: {
          ...state.messages,
          [conversationId]: [message, ...existingMessages],
        },
      };
    });

    // Update conversation's last message
    const { conversations } = get();
    const conv = conversations.find((c) => c.id === conversationId);
    if (conv) {
      get().updateConversation(conversationId, {
        lastMessage: message,
        updatedAt: message.createdAt,
      });

      // Move conversation to top of list
      set((state) => ({
        conversations: [
          state.conversations.find((c) => c.id === conversationId)!,
          ...state.conversations.filter((c) => c.id !== conversationId),
        ],
      }));
    }
  },

  updateMessage: (conversationId, messageId, updates) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      },
    }));
  },

  setMessagesLoading: (conversationId, loading) => {
    set((state) => ({
      messagesLoading: {
        ...state.messagesLoading,
        [conversationId]: loading,
      },
    }));
  },

  setMessagesHasMore: (conversationId, hasMore) => {
    set((state) => ({
      messagesHasMore: {
        ...state.messagesHasMore,
        [conversationId]: hasMore,
      },
    }));
  },

  // Active conversation
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });

    // Mark as read when opening
    if (conversationId) {
      get().markConversationAsRead(conversationId);
    }
  },

  // Unread counts
  setUnreadCount: (conversationId, count) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: count,
      },
    }));
    get().calculateTotalUnread();
  },

  incrementUnreadCount: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
      },
    }));
    get().calculateTotalUnread();
  },

  markConversationAsRead: (conversationId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [conversationId]: 0,
      },
    }));
    get().calculateTotalUnread();
  },

  calculateTotalUnread: () => {
    set((state) => ({
      totalUnreadCount: Object.values(state.unreadCounts).reduce((sum, count) => sum + count, 0),
    }));
  },

  // Typing indicators
  setUserTyping: (conversationId, userId, isTyping) => {
    set((state) => {
      const currentTyping = state.typingUsers[conversationId] || [];

      if (isTyping && !currentTyping.includes(userId)) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: [...currentTyping, userId],
          },
        };
      } else if (!isTyping) {
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: currentTyping.filter((id) => id !== userId),
          },
        };
      }

      return state;
    });
  },

  // Optimistic updates
  optimisticSendMessage: (conversationId, tempMessage) => {
    get().addMessage(conversationId, tempMessage);
  },

  confirmMessageSent: (conversationId, tempId, confirmedMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).map((msg) =>
          msg.id === tempId ? confirmedMessage : msg
        ),
      },
    }));
  },

  revertMessageSend: (conversationId, tempId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (state.messages[conversationId] || []).filter(
          (msg) => msg.id !== tempId
        ),
      },
    }));
  },

  // Reset
  reset: () => {
    set(initialState);
  },
}));
