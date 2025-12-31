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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { useOrganizationsStore } from '@/store/organizations';
import { OrganizationCard } from '@/components/organizations';
import { GET_ORGANIZATIONS, GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/organizations';
import { JOIN_ORGANIZATION, LEAVE_ORGANIZATION } from '@/lib/graphql/mutations/organizations';
import { Organization } from '@/types';

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

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
    skip: activeTab !== 'all',
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

  // Auto search on query change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'all') {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    resetPagination();
    if (activeTab === 'all') {
      await refetch();
    } else {
      await refetchMyOrgs();
    }
  }, [activeTab, resetPagination, refetch, refetchMyOrgs, setRefreshing]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || activeTab !== 'all') return;

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
        showJoinButton={activeTab === 'all'}
        onJoin={handleJoin}
        onLeave={handleLeave}
        isMember={isMember(item.id)}
      />
    ),
    [handleOrgPress, handleJoin, handleLeave, isMember, activeTab]
  );

  // Render footer
  const renderFooter = useCallback(() => {
    if (!hasMore || activeTab !== 'all') return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [hasMore, activeTab]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading || myOrgsLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>
          {activeTab === 'all' ? 'No organizations found' : 'You haven\'t joined any organizations'}
        </Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'all'
            ? 'Try adjusting your search'
            : 'Browse organizations and join to see them here'}
        </Text>
      </View>
    );
  }, [loading, myOrgsLoading, activeTab]);

  const displayData = activeTab === 'all' ? organizations : myOrganizations;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Organizations</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Browse
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Organizations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {activeTab === 'all' && (
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

      {/* List */}
      <FlatList
        data={displayData}
        renderItem={renderOrg}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        onEndReached={handleLoadMore}
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
});
