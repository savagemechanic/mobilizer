import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { GET_CONVERSATIONS } from '@/lib/graphql/queries/chat';
import { Avatar, SearchInput } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  name?: string;
  isGroup: boolean;
  participants?: Array<{
    userId: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      displayName?: string;
      avatar?: string;
    };
  }>;
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
  }>;
}

export default function MessagesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const { unreadCounts, totalUnreadCount } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { data, loading, refetch } = useQuery(GET_CONVERSATIONS, {
    onCompleted: (data) => {
      // Update chat store with conversations
      if (data?.conversations) {
        useChatStore.getState().setConversations(data.conversations.map((c: any) => ({
          ...c,
          unreadCount: unreadCounts[c.id] || 0,
        })));
      }
    },
  });

  const conversations: Conversation[] = data?.conversations || [];

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;

    // For direct messages, show the other participant's name
    const otherParticipant = conversation.participants?.find(
      (p) => p.userId !== currentUser?.id
    );

    if (otherParticipant?.user) {
      return (
        otherParticipant.user.displayName ||
        `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`.trim()
      );
    }

    return 'Conversation';
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants?.find(
        (p) => p.userId !== currentUser?.id
      );
      return otherParticipant?.user?.avatar;
    }
    return undefined;
  };

  const getLastMessage = (conversation: Conversation) => {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return 'No messages yet';

    const preview =
      lastMessage.content.length > 50
        ? `${lastMessage.content.substring(0, 50)}...`
        : lastMessage.content;

    return preview;
  };

  const getLastMessageTime = (conversation: Conversation) => {
    const lastMessage = conversation.messages?.[0];
    if (!lastMessage) return '';

    return formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true });
  };

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((conversation) => {
      const name = getConversationName(conversation).toLowerCase();
      const lastMessage = conversation.messages?.[0]?.content.toLowerCase() || '';
      return name.includes(query) || lastMessage.includes(query);
    });
  }, [conversations, searchQuery, currentUser]);

  const handleNewConversation = () => {
    router.push('/new-conversation');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Messages</Text>
            {totalUnreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsSearching(!isSearching)}
            >
              <Ionicons
                name={isSearching ? 'close' : 'search'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleNewConversation}
            >
              <Ionicons name="create-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        {isSearching && (
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            style={styles.searchInput}
            autoFocus
          />
        )}
      </View>

      {/* Conversations list */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchQuery ? 'search-outline' : 'chatbubbles-outline'}
            size={64}
            color="#CCC"
          />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start a conversation with someone'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const conversationName = getConversationName(item);
            const avatar = getConversationAvatar(item);
            const lastMessage = getLastMessage(item);
            const lastMessageTime = getLastMessageTime(item);
            const unread = unreadCounts[item.id] || 0;

            return (
              <TouchableOpacity
                style={styles.conversationItem}
                onPress={() => router.push(`/conversation/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <Avatar uri={avatar} name={conversationName} size={56} />
                  {item.isGroup && (
                    <View style={styles.groupIndicator}>
                      <Ionicons name="people" size={12} color="#FFF" />
                    </View>
                  )}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationHeader}>
                    <Text
                      style={[
                        styles.conversationName,
                        unread > 0 && styles.conversationNameUnread,
                      ]}
                      numberOfLines={1}
                    >
                      {conversationName}
                    </Text>
                    {lastMessageTime && (
                      <Text
                        style={[
                          styles.conversationTime,
                          unread > 0 && styles.conversationTimeUnread,
                        ]}
                      >
                        {lastMessageTime}
                      </Text>
                    )}
                  </View>
                  <View style={styles.conversationFooter}>
                    <Text
                      style={[
                        styles.conversationPreview,
                        unread > 0 && styles.conversationPreviewUnread,
                      ]}
                      numberOfLines={2}
                    >
                      {lastMessage}
                    </Text>
                    {unread > 0 && (
                      <View style={styles.unreadIndicator}>
                        <Text style={styles.unreadIndicatorText}>
                          {unread > 99 ? '99+' : unread}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          onRefresh={refetch}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchInput: {
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatarContainer: {
    position: 'relative',
  },
  groupIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    marginRight: 8,
  },
  conversationNameUnread: {
    fontWeight: '700',
  },
  conversationTime: {
    fontSize: 13,
    color: '#999',
  },
  conversationTimeUnread: {
    color: '#007AFF',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationPreview: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 20,
  },
  conversationPreviewUnread: {
    color: '#333',
    fontWeight: '500',
  },
  unreadIndicator: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  unreadIndicatorText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
