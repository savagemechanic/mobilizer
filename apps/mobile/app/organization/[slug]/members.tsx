import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_ORG_MEMBERS } from '@/lib/graphql/queries/organizations';
import { GET_ORGANIZATION_BY_SLUG } from '@/lib/graphql/queries/organizations';
import { Avatar } from '@/components/ui';
import { OrgMembership } from '@/types';

export default function OrganizationMembersScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  // Get organization first
  const { data: orgData, loading: orgLoading } = useQuery(GET_ORGANIZATION_BY_SLUG, {
    variables: { slug },
    skip: !slug,
  });

  const organization = orgData?.organizationBySlug;

  // Get members
  const { data, loading, error, refetch, fetchMore } = useQuery(GET_ORG_MEMBERS, {
    variables: {
      orgId: organization?.id,
      limit: 50,
      offset: 0,
    },
    skip: !organization?.id,
  });

  const members = data?.getOrgMembers || [];

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Render member item
  const renderMember = useCallback(
    ({ item }: { item: OrgMembership }) => {
      const memberName =
        item.user?.displayName ||
        `${item.user?.firstName} ${item.user?.lastName}`.trim() ||
        'Unknown';

      return (
        <View style={styles.memberItem}>
          <Avatar uri={item.user?.avatar} name={memberName} size={48} />

          <View style={styles.memberInfo}>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.memberEmail}>{item.user?.email}</Text>

            {/* Badges */}
            <View style={styles.badgesRow}>
              {item.isAdmin && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Admin</Text>
                </View>
              )}
              {item.isLeader && (
                <View style={[styles.badge, styles.leaderBadge]}>
                  <Text style={styles.badgeText}>Leader</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    []
  );

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading || orgLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="people-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>No members yet</Text>
      </View>
    );
  }, [loading, orgLoading]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load members</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Member count */}
      {organization && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {organization.memberCount.toLocaleString()} {organization.memberCount === 1 ? 'Member' : 'Members'}
          </Text>
        </View>
      )}

      {/* Members list */}
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  countContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  countText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    flexGrow: 1,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  leaderBadge: {
    backgroundColor: '#34C759',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
});
