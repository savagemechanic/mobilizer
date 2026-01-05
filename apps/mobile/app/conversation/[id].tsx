import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { useAuthStore } from '@/store/auth';
import { useChatStore } from '@/store/chat';
import { Avatar, LeaderBadge } from '@/components/ui';
import { GET_MESSAGES, GET_CONVERSATION } from '@/lib/graphql/queries/chat';
import { SEND_MESSAGE, MARK_CONVERSATION_AS_READ } from '@/lib/graphql/mutations/chat';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
  };
  createdAt: string;
  isRead: boolean;
  readAt?: string;
  // Optimistic UI fields
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface Participant {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
    isLeader?: boolean;
    leaderLevel?: string;
  };
}

interface ConversationData {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: Participant[];
}

export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const { setActiveConversation, markConversationAsRead: markReadInStore } = useChatStore();
  const flatListRef = useRef<FlatList>(null);

  const [messageText, setMessageText] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Fetch conversation details for header
  const { data: convData } = useQuery(GET_CONVERSATION, {
    variables: { conversationId: id },
    skip: !id,
  });

  const conversation: ConversationData | undefined = convData?.conversation;

  // Fetch messages
  const { data, loading, refetch, fetchMore } = useQuery(GET_MESSAGES, {
    variables: { conversationId: id, limit: 50, offset: 0 },
    skip: !id,
    onCompleted: () => {
      markAsRead();
      if (id) {
        setActiveConversation(id);
        markReadInStore(id);
      }
    },
  });

  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    // Update cache directly instead of refetching for faster UX
    update: (cache, { data }) => {
      if (data?.sendMessage) {
        // Read the current messages from cache
        const existingData = cache.readQuery({
          query: GET_MESSAGES,
          variables: { conversationId: id, limit: 50, offset: 0 },
        }) as { messages: Message[] } | null;

        if (existingData) {
          // Add the new message to the beginning of the list
          cache.writeQuery({
            query: GET_MESSAGES,
            variables: { conversationId: id, limit: 50, offset: 0 },
            data: {
              messages: [data.sendMessage, ...existingData.messages],
            },
          });
        }
      }
    },
    onCompleted: () => {
      // Remove optimistic message (cache update handles adding real one)
      setOptimisticMessages([]);
      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    onError: (error) => {
      // Mark optimistic message as failed
      setOptimisticMessages((prev) =>
        prev.map((msg) => ({ ...msg, status: 'failed' as const }))
      );
      console.error('Error sending message:', error);
      Alert.alert('Failed to send message', error.message);
    },
  });

  const [markConversationAsReadMutation] = useMutation(MARK_CONVERSATION_AS_READ);

  const serverMessages: Message[] = data?.messages || [];

  // Combine optimistic messages with server messages
  const messages = useMemo(() => {
    return [...optimisticMessages, ...serverMessages];
  }, [optimisticMessages, serverMessages]);

  const markAsRead = async () => {
    if (!id) return;
    try {
      await markConversationAsReadMutation({ variables: { conversationId: id } });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSend = async () => {
    if (!messageText.trim() || !id || sending) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      content: messageText.trim(),
      senderId: currentUser?.id || '',
      sender: currentUser ? {
        id: currentUser.id,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar,
      } : undefined,
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending',
    };

    // Add optimistic message
    setOptimisticMessages([tempMessage]);
    const textToSend = messageText.trim();
    setMessageText('');

    try {
      await sendMessage({
        variables: {
          input: {
            conversationId: id,
            content: textToSend,
          },
        },
      });
    } catch (error) {
      // Error handled in onError callback
    }
  };

  // Get conversation title for header
  const getConversationTitle = (): string => {
    if (!conversation) return 'Conversation';

    if (conversation.name) return conversation.name;

    // For 1-1 chats, show the other participant's name
    if (!conversation.isGroup && conversation.participants) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== currentUser?.id
      );
      if (otherParticipant?.user) {
        return otherParticipant.user.displayName ||
          `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`.trim() ||
          'User';
      }
    }

    // For group chats without a name, list participant names
    if (conversation.isGroup && conversation.participants) {
      const names = conversation.participants
        .filter((p) => p.userId !== currentUser?.id)
        .slice(0, 3)
        .map((p) => p.user?.firstName || 'User');

      if (names.length > 3) {
        return `${names.slice(0, 3).join(', ')} +${conversation.participants.length - 4}`;
      }
      return names.join(', ') || 'Group';
    }

    return 'Conversation';
  };

  // Get participant count subtitle
  const getSubtitle = (): string | null => {
    if (!conversation?.isGroup) return null;
    const count = conversation.participants?.length || 0;
    return `${count} participant${count !== 1 ? 's' : ''}`;
  };

  // Get avatar for 1-1 conversation
  const getOtherParticipantAvatar = (): string | undefined => {
    if (conversation?.isGroup) return undefined;
    const otherParticipant = conversation?.participants?.find(
      (p) => p.userId !== currentUser?.id
    );
    return otherParticipant?.user?.avatar;
  };

  // Get leader info for 1-1 conversation
  const getOtherParticipantLeaderInfo = (): { isLeader: boolean; leaderLevel?: string } | null => {
    if (conversation?.isGroup) return null;
    const otherParticipant = conversation?.participants?.find(
      (p) => p.userId !== currentUser?.id
    );
    if (otherParticipant?.user?.isLeader) {
      return {
        isLeader: true,
        leaderLevel: otherParticipant.user.leaderLevel,
      };
    }
    return null;
  };

  // Format message time
  const formatMessageTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  // Message status indicator component
  const MessageStatus = ({ message, isOwn }: { message: Message; isOwn: boolean }) => {
    if (!isOwn) return null;

    const status = message.status || (message.isRead ? 'read' : 'delivered');

    switch (status) {
      case 'sending':
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size={10} color="rgba(255,255,255,0.7)" />
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="alert-circle" size={14} color="#FF3B30" />
          </View>
        );
      case 'sent':
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.7)" />
          </View>
        );
      case 'delivered':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.doubleCheck}>
              <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" />
              <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.7)" style={styles.secondCheck} />
            </View>
          </View>
        );
      case 'read':
        return (
          <View style={styles.statusContainer}>
            <View style={styles.doubleCheck}>
              <Ionicons name="checkmark" size={12} color="#34C759" />
              <Ionicons name="checkmark" size={12} color="#34C759" style={styles.secondCheck} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isOwnMessage = item.senderId === currentUser?.id;
      const senderName = item.sender?.displayName ||
        `${item.sender?.firstName} ${item.sender?.lastName}`.trim() ||
        'Unknown';

      return (
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
            item.status === 'failed' && styles.failedMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <Avatar
              uri={item.sender?.avatar}
              name={senderName}
              size={32}
            />
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
              item.status === 'sending' && styles.sendingBubble,
              item.status === 'failed' && styles.failedBubble,
            ]}
          >
            {!isOwnMessage && conversation?.isGroup && (
              <Text style={styles.senderName}>{senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime,
                ]}
              >
                {formatMessageTime(item.createdAt)}
              </Text>
              <MessageStatus message={item} isOwn={isOwnMessage} />
            </View>
            {item.status === 'failed' && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setOptimisticMessages([]);
                  setMessageText(item.content);
                }}
              >
                <Text style={styles.retryText}>Tap to retry</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [currentUser, conversation?.isGroup]
  );

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No messages yet</Text>
        <Text style={styles.emptySubtext}>Start the conversation!</Text>
      </View>
    );
  }, [loading]);

  const title = getConversationTitle();
  const subtitle = getSubtitle();
  const otherAvatar = getOtherParticipantAvatar();
  const leaderInfo = getOtherParticipantLeaderInfo();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerContent} activeOpacity={0.7}>
          {otherAvatar || conversation?.isGroup ? (
            <Avatar
              uri={otherAvatar}
              name={title}
              size={36}
            />
          ) : null}
          <View style={styles.headerInfo}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              {leaderInfo && (
                <LeaderBadge level={leaderInfo.leaderLevel} size="small" />
              )}
            </View>
            {subtitle && (
              <Text style={styles.headerSubtitle}>{subtitle}</Text>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="ellipsis-vertical" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        inverted
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (serverMessages.length >= 50) {
            fetchMore({
              variables: {
                conversationId: id,
                limit: 50,
                offset: serverMessages.length,
              },
            });
          }
        }}
        onEndReachedThreshold={0.5}
      />

      {/* Input Bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom || 8 }]}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color="#007AFF" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!messageText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  headerRight: {
    padding: 8,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
    // Counter the inverted FlatList to display empty state right-side up
    transform: [{ scaleY: -1 }],
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
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  failedMessageContainer: {
    opacity: 0.8,
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sendingBubble: {
    opacity: 0.7,
  },
  failedBubble: {
    backgroundColor: '#FF3B30',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 21,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#999',
  },
  statusContainer: {
    marginLeft: 4,
    height: 14,
    justifyContent: 'center',
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondCheck: {
    marginLeft: -8,
  },
  retryButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textDecorationLine: 'underline',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  attachButton: {
    padding: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
});
