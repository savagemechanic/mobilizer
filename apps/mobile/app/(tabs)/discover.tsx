import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import { useOrganizationsStore } from '@/store/organizations';
import { OrganizationCard } from '@/components/organizations';
import { GET_ORGANIZATIONS, GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/organizations';
import { JOIN_ORGANIZATION, LEAVE_ORGANIZATION } from '@/lib/graphql/mutations/organizations';
import { SEARCH_USERS } from '@/lib/graphql/queries/chat';
import { CREATE_CONVERSATION } from '@/lib/graphql/mutations/chat';
import { Organization, User } from '@/types';
import { Avatar, LeaderBadge } from '@/components/ui';

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'orgs' | 'my' | 'people'>('orgs');
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);

  const {
    organizations,
    myOrganizations,
    filters,
    offset,
    limit,
    hasMore,
    isLoading,
    isRefreshing,
    addOrganizations,
    setMyOrganizations,
    setLoading,
    setRefreshing,
    setFilters,
    resetPagination,
    optimisticJoin,
    optimisticLeave,
  } = useOrganizationsStore();

  // Query for all organizations
  const { loading, error, refetch, fetchMore } = useQuery(GET_ORGANIZATIONS, {
    variables: {
      filter: { search: searchQuery || null, ...filters },
      limit,
      offset: 0,
    },
    skip: activeTab !== 'orgs',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.organizations) {
        addOrganizations(data.organizations, true);
      }
      setLoading(false);
      setRefreshing(false);
    },
    onError: (error) => {
      console.error('Error fetching organizations:', error);
      setLoading(false);
      setRefreshing(false);
    },
  });

  // Lazy query for people search
  const [searchUsers, { loading: searchingUsers }] = useLazyQuery(SEARCH_USERS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.searchUsers) {
        setSearchedUsers(data.searchUsers);
      }
    },
    onError: (error) => {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'Failed to search users');
    },
  });

  // Mutation to create conversation
  const [createConversation, { loading: creatingConversation }] = useMutation(
    CREATE_CONVERSATION,
    {
      onCompleted: (data) => {
        if (data?.createConversation) {
          router.push(`/conversation/${data.createConversation.id}`);
        }
      },
      onError: (error) => {
        Alert.alert('Error', error.message || 'Failed to start conversation');
      },
    }
  );

  // Query for my organizations
  const { loading: myOrgsLoading, refetch: refetchMyOrgs } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: activeTab !== 'my',
    onCompleted: (data) => {
      if (data?.myOrganizations) {
        setMyOrganizations(data.myOrganizations);
      }
      setLoading(false);
      setRefreshing(false);
    },
    onError: (error) => {
      console.error('Error fetching my organizations:', error);
      setLoading(false);
      setRefreshing(false);
    },
  });

  // Mutations
  const [joinOrgMutation] = useMutation(JOIN_ORGANIZATION);
  const [leaveOrgMutation] = useMutation(LEAVE_ORGANIZATION);

  // Handle search
  const handleSearch = useCallback(() => {
    resetPagination();
    setFilters({ search: searchQuery });
    refetch();
  }, [searchQuery, resetPagination, setFilters, refetch]);

  // Handle people search
  const handlePeopleSearch = useCallback(() => {
    if (peopleSearchQuery.trim().length >= 2) {
      searchUsers({ variables: { query: peopleSearchQuery.trim(), limit: 20, offset: 0 } });
    }
  }, [peopleSearchQuery, searchUsers]);

  // Auto search on query change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'orgs') {
        handleSearch();
      } else if (activeTab === 'people' && peopleSearchQuery.trim().length >= 2) {
        handlePeopleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, peopleSearchQuery, activeTab]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    resetPagination();
    if (activeTab === 'orgs') {
      await refetch();
    } else if (activeTab === 'my') {
      await refetchMyOrgs();
    } else if (activeTab === 'people' && peopleSearchQuery.trim().length >= 2) {
      handlePeopleSearch();
    }
    setRefreshing(false);
  }, [activeTab, resetPagination, refetch, refetchMyOrgs, setRefreshing, peopleSearchQuery, handlePeopleSearch]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || activeTab !== 'orgs') return;

    try {
      const { data } = await fetchMore({
        variables: {
          filter: { search: searchQuery || null, ...filters },
          limit,
          offset: organizations.length,
        },
      });

      if (data?.organizations) {
        addOrganizations(data.organizations, false);
      }
    } catch (error) {
      console.error('Error loading more organizations:', error);
    }
  }, [hasMore, loading, activeTab, limit, organizations.length, fetchMore, addOrganizations, searchQuery, filters]);

  // Handle message user
  const handleMessageUser = useCallback(async (userId: string) => {
    try {
      await createConversation({
        variables: {
          participantIds: [userId],
        },
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  }, [createConversation]);

  // Handle organization press
  const handleOrgPress = useCallback((org: Organization) => {
    router.push(`/organization/${org.slug}`);
  }, [router]);

  // Handle join
  const handleJoin = useCallback(
    async (orgId: string) => {
      optimisticJoin(orgId);

      try {
        await joinOrgMutation({ variables: { orgId } });
        // Refetch my organizations
        refetchMyOrgs();
      } catch (error) {
        console.error('Error joining organization:', error);
        // TODO: Revert optimistic update
      }
    },
    [joinOrgMutation, optimisticJoin, refetchMyOrgs]
  );

  // Handle leave
  const handleLeave = useCallback(
    async (orgId: string) => {
      optimisticLeave(orgId);

      try {
        await leaveOrgMutation({ variables: { orgId } });
        // Refetch my organizations
        refetchMyOrgs();
      } catch (error) {
        console.error('Error leaving organization:', error);
        // TODO: Revert optimistic update
      }
    },
    [leaveOrgMutation, optimisticLeave, refetchMyOrgs]
  );

  // Check if user is a member of an organization
  const isMember = useCallback(
    (orgId: string) => {
      return myOrganizations.some((org) => org.id === orgId);
    },
    [myOrganizations]
  );

  // Render organization item
  const renderOrg = useCallback(
    ({ item }: { item: Organization }) => (
      <OrganizationCard
        organization={item}
        onPress={handleOrgPress}
        showJoinButton={activeTab === 'orgs'}
        onJoin={handleJoin}
        onLeave={handleLeave}
        isMember={isMember(item.id)}
      />
    ),
    [handleOrgPress, handleJoin, handleLeave, isMember, activeTab]
  );

  // Render user item
  const renderUser = useCallback(
    ({ item }: { item: any }) => {
      const userName = item.displayName || `${item.firstName} ${item.lastName}`.trim() || 'User';

      return (
        <View style={styles.userCard}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push(`/user/${item.id}`)}
            activeOpacity={0.7}
          >
            <Avatar uri={item.avatar} name={userName} size={56} />
            <View style={styles.userDetails}>
              <View style={styles.userNameRow}>
                <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
                {item.isLeader && (
                  <LeaderBadge level={item.leaderLevel} size="small" />
                )}
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>@{item.email?.split('@')[0]}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => handleMessageUser(item.id)}
            disabled={creatingConversation}
          >
            {creatingConversation ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="chatbubble-outline" size={22} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [router, handleMessageUser, creatingConversation]
  );

  // Render footer
  const renderFooter = useCallback(() => {
    if (!hasMore || activeTab !== 'orgs') return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [hasMore, activeTab]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading || myOrgsLoading || searchingUsers) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (activeTab === 'people') {
      if (peopleSearchQuery.length < 2) {
        return (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Search for People</Text>
            <Text style={styles.emptySubtext}>
              Enter at least 2 characters to search by name or email
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No users found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>
          {activeTab === 'orgs' ? 'No organizations found' : 'You haven\'t joined any organizations'}
        </Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'orgs'
            ? 'Try adjusting your search'
            : 'Browse organizations and join to see them here'}
        </Text>
      </View>
    );
  }, [loading, myOrgsLoading, searchingUsers, activeTab, peopleSearchQuery]);

  const displayData = activeTab === 'orgs' ? organizations : activeTab === 'my' ? myOrganizations : searchedUsers;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orgs' && styles.tabActive]}
          onPress={() => setActiveTab('orgs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'orgs' && styles.tabTextActive]}>
            Organizations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Orgs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'people' && styles.tabActive]}
          onPress={() => setActiveTab('people')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
            People
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar for Organizations */}
      {activeTab === 'orgs' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search organizations..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Search Bar for People */}
      {activeTab === 'people' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor="#999"
            value={peopleSearchQuery}
            onChangeText={setPeopleSearchQuery}
            returnKeyType="search"
            onSubmitEditing={handlePeopleSearch}
          />
          {peopleSearchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setPeopleSearchQuery(''); setSearchedUsers([]); }}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={displayData}
        renderItem={activeTab === 'people' ? renderUser : renderOrg}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={activeTab === 'orgs' ? handleLoadMore : undefined}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
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
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  listContent: {
    flexGrow: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
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
  // User card styles
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flexShrink: 1,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});
