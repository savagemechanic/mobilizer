import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useLazyQuery, useMutation } from '@apollo/client';
import { useAuthStore } from '@/store/auth';
import { Avatar, SearchInput } from '@/components/ui';
import { SEARCH_USERS } from '@/lib/graphql/queries/chat';
import { CREATE_CONVERSATION } from '@/lib/graphql/mutations/chat';
import { debounce } from '@/lib/shared/utils';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
}

export default function NewConversationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [searchUsers, { data, loading: searching }] = useLazyQuery(SEARCH_USERS, {
    fetchPolicy: 'network-only',
  });

  const [createConversation, { loading: creating }] = useMutation(CREATE_CONVERSATION, {
    onCompleted: (data) => {
      if (data?.createConversation?.id) {
        router.replace(`/conversation/${data.createConversation.id}`);
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create conversation');
    },
  });

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.trim().length >= 2) {
        searchUsers({ variables: { query: query.trim(), limit: 20 } });
      }
    }, 300),
    [searchUsers]
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleSelectUser = (user: User) => {
    if (user.id === currentUser?.id) {
      Alert.alert('Error', 'You cannot start a conversation with yourself');
      return;
    }
    setSelectedUser(user);
  };

  const handleStartConversation = () => {
    if (!selectedUser) return;

    createConversation({
      variables: {
        participantIds: [selectedUser.id],
      },
    });
  };

  const getUserDisplayName = (user: User) => {
    return user.displayName || `${user.firstName} ${user.lastName}`.trim() || user.email;
  };

  const users: User[] = data?.searchUsers || [];
  const filteredUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Message</Text>
        <TouchableOpacity
          style={[styles.startButton, !selectedUser && styles.startButtonDisabled]}
          onPress={handleStartConversation}
          disabled={!selectedUser || creating}
        >
          {creating ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={[styles.startButtonText, !selectedUser && styles.startButtonTextDisabled]}>
              Start
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selected User */}
      {selectedUser && (
        <View style={styles.selectedUserContainer}>
          <Text style={styles.toLabel}>To:</Text>
          <View style={styles.selectedUserChip}>
            <Avatar uri={selectedUser.avatar} name={getUserDisplayName(selectedUser)} size={24} />
            <Text style={styles.selectedUserName}>{getUserDisplayName(selectedUser)}</Text>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.removeButton}>
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search by name or email..."
          autoFocus
        />
      </View>

      {/* Search Results */}
      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : searchQuery.length >= 2 && filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={48} color="#CCC" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try searching with a different email or name</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const displayName = getUserDisplayName(item);
            const isSelected = selectedUser?.id === item.id;

            return (
              <TouchableOpacity
                style={[styles.userItem, isSelected && styles.userItemSelected]}
                onPress={() => handleSelectUser(item)}
                activeOpacity={0.7}
              >
                <Avatar uri={item.avatar} name={displayName} size={48} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            searchQuery.length < 2 ? (
              <View style={styles.hintContainer}>
                <Ionicons name="search" size={48} color="#CCC" />
                <Text style={styles.hintText}>Search for a user</Text>
                <Text style={styles.hintSubtext}>
                  Enter at least 2 characters to search by name or email
                </Text>
              </View>
            ) : null
          }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  startButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  startButtonTextDisabled: {
    color: '#999',
  },
  selectedUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  toLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  selectedUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
  },
  selectedUserName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
    marginRight: 4,
  },
  removeButton: {
    marginLeft: 2,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  hintText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  hintSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userItemSelected: {
    backgroundColor: '#F0F7FF',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
