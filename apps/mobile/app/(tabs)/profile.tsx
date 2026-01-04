import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { useAuthStore } from '@/store/auth';
import { useUIStore } from '@/store/ui';
import { Avatar, LeaderBadge } from '@/components/ui';
import { GET_USER_MEMBERSHIPS } from '@/lib/graphql/queries/organizations';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch user's memberships to check leader status
  const { data: membershipsData } = useQuery(GET_USER_MEMBERSHIPS, {
    variables: { userId: user?.id },
    skip: !user?.id,
  });

  // Find if user is a leader in any organization
  const leaderMembership = membershipsData?.userMemberships?.find(
    (m: any) => m.isLeader
  );

  const userName = user?.displayName || `${user?.firstName} ${user?.lastName}`.trim() || 'User';

  // Build cascading location string
  const getLocationString = () => {
    if (!user?.location) return null;
    const parts: string[] = [];
    if (user.location.state?.name) parts.push(user.location.state.name);
    if (user.location.lga?.name) parts.push(user.location.lga.name);
    if (user.location.ward?.name) parts.push(user.location.ward.name);
    if (user.location.pollingUnit?.name) parts.push(user.location.pollingUnit.name);
    return parts.length > 0 ? parts.join(' > ') : null;
  };

  const locationString = getLocationString();

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    await logout();
    // Navigate to login after logout
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <Avatar uri={user?.avatar} name={userName} size={80} />
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{userName}</Text>
          {leaderMembership && (
            <LeaderBadge level={leaderMembership.leaderLevel} size="large" />
          )}
        </View>
        {user?.username && (
          <Text style={styles.username}>@{user.username}</Text>
        )}
        <Text style={styles.userEmail}>{user?.email}</Text>
        {locationString && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText}>{locationString}</Text>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {/* Account Settings */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="person-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Theme Toggle */}
        <TouchableOpacity style={styles.menuItem} onPress={handleThemeToggle}>
          <Ionicons
            name={theme === 'dark' ? 'moon' : 'sunny-outline'}
            size={24}
            color="#007AFF"
          />
          <Text style={styles.menuText}>
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <View style={styles.switch}>
            <View style={[styles.switchThumb, theme === 'dark' && styles.switchThumbActive]} />
          </View>
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* Privacy */}
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>

        {/* About */}
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.menuText}>About</Text>
          <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <Text style={styles.versionText}>Version 1.0.0</Text>
    </ScrollView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  username: {
    fontSize: 15,
    color: '#007AFF',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 15,
    color: '#666',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flexShrink: 1,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    marginLeft: 16,
  },
  switch: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  switchThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    marginLeft: 20,
    backgroundColor: '#34C759',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
