import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ORGANIZATION_BY_SLUG, GET_MY_ORGANIZATIONS, GET_ORG_MEMBERS } from '@/lib/graphql/queries/organizations';
import { JOIN_ORGANIZATION, LEAVE_ORGANIZATION, REGENERATE_INVITE_CODE } from '@/lib/graphql/mutations/organizations';
import { useOrganizationsStore } from '@/store/organizations';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui';

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

const LEVEL_COLORS: Record<string, string> = {
  NATIONAL: '#FF6B6B',
  STATE: '#4ECDC4',
  LGA: '#45B7D1',
  WARD: '#FFA07A',
  POLLING_UNIT: '#98D8C8',
};

export default function OrganizationDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { setCurrentOrganization, optimisticJoin, optimisticLeave } = useOrganizationsStore();
  const { user } = useAuthStore();

  // Fetch organization by slug
  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION_BY_SLUG, {
    variables: { slug },
    skip: !slug,
    onCompleted: (data) => {
      if (data?.organizationBySlug) {
        setCurrentOrganization(data.organizationBySlug);
      }
    },
  });

  // Fetch user's organizations to check membership
  const { data: myOrgsData, refetch: refetchMyOrgs } = useQuery(GET_MY_ORGANIZATIONS);

  // Mutations
  const [joinOrgMutation, { loading: joining }] = useMutation(JOIN_ORGANIZATION);
  const [leaveOrgMutation, { loading: leaving }] = useMutation(LEAVE_ORGANIZATION);
  const [regenerateCodeMutation, { loading: regenerating }] = useMutation(REGENERATE_INVITE_CODE);

  const organization = data?.organizationBySlug;

  // Check admin status from org members
  const { data: membersData } = useQuery(GET_ORG_MEMBERS, {
    variables: { orgId: organization?.id, limit: 1, isAdmin: true },
    skip: !organization?.id || !user?.id,
  });

  // Check if user is a member and admin
  useEffect(() => {
    if (organization && myOrgsData?.myOrganizations) {
      const isMem = myOrgsData.myOrganizations.some((org: any) => org.id === organization.id);
      setIsMember(isMem);
    }
  }, [organization, myOrgsData]);

  // Check admin status
  useEffect(() => {
    if (membersData?.getOrgMembers && user?.id) {
      const adminMember = membersData.getOrgMembers.find(
        (m: any) => m.userId === user.id && m.isAdmin
      );
      setIsAdmin(!!adminMember);
    }
  }, [membersData, user?.id]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetch(), refetchMyOrgs()]);
    setIsRefreshing(false);
  }, [refetch, refetchMyOrgs]);

  // Handle join/leave
  const handleJoinLeave = useCallback(async () => {
    if (!organization) return;

    if (isMember) {
      // Leave
      optimisticLeave(organization.id);
      setIsMember(false);

      try {
        await leaveOrgMutation({ variables: { orgId: organization.id } });
        await refetchMyOrgs();
      } catch (error) {
        console.error('Error leaving organization:', error);
        setIsMember(true);
      }
    } else {
      // Join
      optimisticJoin(organization.id);
      setIsMember(true);

      try {
        await joinOrgMutation({ variables: { orgId: organization.id } });
        await refetchMyOrgs();
      } catch (error) {
        console.error('Error joining organization:', error);
        setIsMember(false);
      }
    }
  }, [organization, isMember, joinOrgMutation, leaveOrgMutation, optimisticJoin, optimisticLeave, refetchMyOrgs]);

  // Handle view members
  const handleViewMembers = useCallback(() => {
    if (organization) {
      router.push(`/organization/${organization.slug}/members`);
    }
  }, [organization, router]);

  // Handle copy invite code
  const handleCopyCode = useCallback(async () => {
    if (organization?.inviteCode) {
      await Clipboard.setStringAsync(organization.inviteCode);
      Alert.alert('Copied!', 'Invite code copied to clipboard.');
    }
  }, [organization?.inviteCode]);

  // Handle regenerate invite code
  const handleRegenerateCode = useCallback(() => {
    Alert.alert(
      'Regenerate Code',
      'This will invalidate the current invite code. Anyone with the old code will no longer be able to join. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: async () => {
            try {
              await regenerateCodeMutation({
                variables: { orgId: organization?.id },
              });
              await refetch();
              Alert.alert('Success', 'Invite code has been regenerated.');
            } catch (error) {
              Alert.alert('Error', 'Failed to regenerate invite code.');
            }
          },
        },
      ]
    );
  }, [organization?.id, regenerateCodeMutation, refetch]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error || !organization) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
        <Text style={styles.errorText}>Failed to load organization</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={styles.errorButton}
        />
      </View>
    );
  }

  const levelLabel = LEVEL_LABELS[organization.level] || organization.level;
  const levelColor = LEVEL_COLORS[organization.level] || '#999';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#007AFF" />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Banner */}
      {organization.banner && (
        <Image source={{ uri: organization.banner }} style={styles.banner} resizeMode="cover" />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {organization.logo ? (
            <Image source={{ uri: organization.logo }} style={styles.logo} resizeMode="cover" />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: levelColor }]}>
              <Ionicons name="business-outline" size={48} color="#FFF" />
            </View>
          )}
        </View>

        {/* Name and meta */}
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{organization.name}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
              <Text style={styles.levelText}>{levelLabel}</Text>
            </View>

            {organization.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{organization.memberCount.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            title={isMember ? 'Leave' : 'Join Organization'}
            onPress={handleJoinLeave}
            variant={isMember ? 'outline' : 'primary'}
            loading={joining || leaving}
            fullWidth
            style={styles.actionButton}
          />

          {isMember && (
            <Button
              title="View Members"
              onPress={handleViewMembers}
              variant="secondary"
              fullWidth
              style={styles.actionButton}
            />
          )}
        </View>

        {/* Invite Code Section (Admin Only) */}
        {isAdmin && organization.inviteCode && (
          <View style={styles.inviteCodeSection}>
            <Text style={styles.sectionTitle}>Invite Code</Text>
            <Text style={styles.inviteCodeDescription}>
              Share this code with people you want to invite to join this organization.
            </Text>
            <View style={styles.inviteCodeContainer}>
              <Text style={styles.inviteCode}>{organization.inviteCode}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Ionicons name="copy-outline" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.regenerateButton}
              onPress={handleRegenerateCode}
              disabled={regenerating}
              activeOpacity={0.7}
            >
              {regenerating ? (
                <ActivityIndicator size="small" color="#FF3B30" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color="#FF3B30" />
                  <Text style={styles.regenerateText}>Regenerate Code</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        {organization.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{organization.description}</Text>
          </View>
        )}

        {/* Additional info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>

          <View style={styles.infoRow}>
            <Ionicons name="layers-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Level:</Text>
            <Text style={styles.infoValue}>{levelLabel}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(organization.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name={organization.isActive ? 'checkmark-circle-outline' : 'close-circle-outline'}
              size={20}
              color={organization.isActive ? '#34C759' : '#FF3B30'}
            />
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, { color: organization.isActive ? '#34C759' : '#FF3B30' }]}>
              {organization.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    minWidth: 120,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  banner: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  logoContainer: {
    marginTop: -40,
    marginBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  stats: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statItem: {
    marginRight: 32,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    // Empty - spacing handled by gap
  },
  inviteCodeSection: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#B3D9FF',
  },
  inviteCodeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inviteCode: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    padding: 8,
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  regenerateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
  },
});
