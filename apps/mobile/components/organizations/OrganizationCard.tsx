import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Organization } from '@/types';

interface OrganizationCardProps {
  organization: Organization;
  onPress?: (org: Organization) => void;
  showJoinButton?: boolean;
  onJoin?: (orgId: string) => void;
  onLeave?: (orgId: string) => void;
  isMember?: boolean;
}

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

export function OrganizationCard({
  organization,
  onPress,
  showJoinButton = true,
  onJoin,
  onLeave,
  isMember = false,
}: OrganizationCardProps) {
  const handlePress = () => {
    onPress?.(organization);
  };

  const handleJoinLeave = () => {
    if (isMember) {
      onLeave?.(organization.id);
    } else {
      onJoin?.(organization.id);
    }
  };

  const levelLabel = LEVEL_LABELS[organization.level] || organization.level;
  const levelColor = LEVEL_COLORS[organization.level] || '#999';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Logo and Info */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          {organization.logo ? (
            <Image
              source={{ uri: organization.logo }}
              style={styles.logo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: levelColor }]}>
              <Ionicons name="business-outline" size={32} color="#FFF" />
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {organization.name}
          </Text>

          {organization.description && (
            <Text style={styles.description} numberOfLines={2}>
              {organization.description}
            </Text>
          )}

          {/* Meta row */}
          <View style={styles.metaRow}>
            {/* Level badge */}
            <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
              <Text style={styles.levelText}>{levelLabel}</Text>
            </View>

            {/* Member count */}
            <View style={styles.memberCount}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.memberCountText}>
                {organization.memberCount.toLocaleString()}
              </Text>
            </View>

            {/* Verified badge */}
            {organization.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#007AFF" />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Action button */}
      {showJoinButton && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMember && styles.actionButtonJoined,
          ]}
          onPress={handleJoinLeave}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.actionButtonText,
              isMember && styles.actionButtonTextJoined,
            ]}
          >
            {isMember ? 'Leave' : 'Join'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  memberCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCountText: {
    fontSize: 13,
    color: '#666',
  },
  verifiedBadge: {
    marginLeft: 'auto',
  },
  actionButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    alignSelf: 'flex-start',
  },
  actionButtonJoined: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonTextJoined: {
    color: '#666',
  },
});
