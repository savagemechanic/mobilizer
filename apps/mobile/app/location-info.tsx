import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Avatar } from '@/components/ui';
import { GET_LOCATION_LEADERS, GET_LOCATION_STATS, GET_LOCATION_ANALYTICS } from '@/lib/graphql/queries/locations';

const LEVEL_LABELS: Record<string, string> = {
  POLLING_UNIT: 'Polling Unit',
  WARD: 'Ward',
  LGA: 'Local Government Area',
  STATE: 'State',
  COUNTRY: 'Country',
};

// Colors for leader role badges
const ROLE_COLORS: Record<string, string> = {
  CHAIRMAN: '#FF6B6B',
  LEADER: '#4ECDC4',
  WARD_LEADER: '#45B7D1',
  LGA_LEADER: '#FFA07A',
  STATE_LEADER: '#98D8C8',
  POLLING_UNIT_LEADER: '#DDA0DD',
};

const getRoleBadgeColor = (role?: string, leaderLevel?: string): string => {
  if (role?.toUpperCase().includes('CHAIRMAN')) return ROLE_COLORS.CHAIRMAN;
  if (leaderLevel) {
    const levelKey = `${leaderLevel.toUpperCase()}_LEADER`;
    return ROLE_COLORS[levelKey] || ROLE_COLORS.LEADER;
  }
  return ROLE_COLORS.LEADER;
};

const formatRoleLabel = (role?: string, leaderLevel?: string): string => {
  if (role) return role;
  if (leaderLevel) {
    const levelLabels: Record<string, string> = {
      POLLING_UNIT: 'PU Leader',
      WARD: 'Ward Leader',
      LGA: 'LGA Leader',
      STATE: 'State Leader',
      COUNTRY: 'National Leader',
    };
    return levelLabels[leaderLevel] || 'Leader';
  }
  return 'Leader';
};

interface Leader {
  id: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  role?: string;
  leaderLevel?: string;
}

export default function LocationInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id: string;
    level: string;
    name: string;
    orgName?: string;
    orgLogo?: string;
    stateName?: string;
    lgaName?: string;
    wardName?: string;
  }>();

  const { id, level, name, orgName, orgLogo, stateName, lgaName, wardName } = params;

  // Build location hierarchy string (e.g., "in ABIA > Aba South LGA")
  const getLocationHierarchy = () => {
    const parts: string[] = [];

    // For each level, show the parent levels
    if (level === 'POLLING_UNIT') {
      if (wardName) parts.push(wardName);
      if (lgaName) parts.push(`${lgaName} LGA`);
      if (stateName) parts.push(stateName);
    } else if (level === 'WARD') {
      if (lgaName) parts.push(`${lgaName} LGA`);
      if (stateName) parts.push(stateName);
    } else if (level === 'LGA') {
      if (stateName) parts.push(stateName);
    }
    // STATE and COUNTRY don't need hierarchy

    return parts.length > 0 ? `in ${parts.join(' > ')}` : null;
  };

  const locationHierarchy = getLocationHierarchy();

  // Query for location leaders
  const { data, loading, error } = useQuery(GET_LOCATION_LEADERS, {
    variables: {
      locationId: id,
      locationType: level,
    },
    skip: !id || !level,
  });

  // Query for location stats
  const { data: statsData, loading: statsLoading } = useQuery(GET_LOCATION_STATS, {
    variables: {
      locationId: id,
      locationType: level,
    },
    skip: !id || !level,
  });

  // Query for AI analytics
  const { data: analyticsData, loading: analyticsLoading } = useQuery(GET_LOCATION_ANALYTICS, {
    variables: {
      locationId: id,
      locationType: level,
    },
    skip: !id || !level,
  });

  const leaders: Leader[] = data?.locationLeaders || [];
  const stats = statsData?.locationStats || { memberCount: 0, postCount: 0, eventCount: 0 };
  const analytics = analyticsData?.locationAnalytics?.analytics || null;

  const getLeaderName = (leader: Leader) => {
    return leader.displayName || `${leader.firstName} ${leader.lastName}`.trim();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Info</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Header */}
        <View style={styles.locationHeader}>
          {orgName && (
            <Text style={styles.orgName}>{orgName}</Text>
          )}
          <View style={styles.locationIconContainer}>
            {orgLogo ? (
              <Image
                source={{ uri: orgLogo }}
                style={styles.orgLogoImage}
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="location" size={40} color="#007AFF" />
            )}
          </View>
          <Text style={styles.locationName}>{name?.toUpperCase()}</Text>
          <Text style={styles.locationType}>{LEVEL_LABELS[level || ''] || level}</Text>
          {locationHierarchy && (
            <Text style={styles.locationHierarchy}>{locationHierarchy}</Text>
          )}
        </View>

        {/* Summary of Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.aiHeaderRow}>
            <Ionicons name="sparkles" size={18} color="#007AFF" />
            <Text style={styles.sectionTitle}>Summary of Recent Activity</Text>
          </View>

          {analyticsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Generating insights...</Text>
            </View>
          ) : analytics ? (
            <View style={styles.analyticsContainer}>
              <Text style={styles.analyticsText}>{analytics}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No analytics available</Text>
            </View>
          )}
        </View>

        {/* Leaders Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>Leaders</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading leaders...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>Failed to load leaders</Text>
            </View>
          ) : leaders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No leaders assigned yet</Text>
              <Text style={styles.emptySubtext}>
                Leaders for this location will appear here once assigned
              </Text>
            </View>
          ) : (
            <View style={styles.leadersList}>
              {leaders.map((leader) => {
                const roleLabel = formatRoleLabel(leader.role, leader.leaderLevel);
                const badgeColor = getRoleBadgeColor(leader.role, leader.leaderLevel);

                return (
                  <TouchableOpacity
                    key={leader.id}
                    style={styles.leaderCard}
                    onPress={() => router.push(`/user/${leader.id}`)}
                    activeOpacity={0.7}
                  >
                    <Avatar
                      uri={leader.avatar}
                      name={getLeaderName(leader)}
                      size={50}
                    />
                    <View style={styles.leaderInfo}>
                      <Text style={styles.leaderName}>{getLeaderName(leader)}</Text>
                      <View style={[styles.roleBadge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.roleBadgeText}>{roleLabel}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#CCC" />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.sectionTitlePadded]}>Statistics</Text>
          {statsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading stats...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.memberCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Members</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.postCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.eventCount.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Events</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  locationHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  orgLogoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  locationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  locationType: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  locationHierarchy: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 8,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitlePadded: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  analyticsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F8FF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  analyticsText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  leadersList: {
    paddingHorizontal: 16,
  },
  leaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  leaderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  leaderRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
