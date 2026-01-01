import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useUIStore } from '@/store/ui';
import { useRequireOrganization } from '@/hooks/useRequireOrganization';
import { useNotificationsStore } from '@/store/notifications';
import { useChatStore } from '@/store/chat';

// Badge component for tab icons
function TabBadge({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{displayCount}</Text>
    </View>
  );
}

// Tab icon with badge
function TabIconWithBadge({
  name,
  color,
  size,
  badgeCount,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badgeCount: number;
}) {
  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
      <TabBadge count={badgeCount} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useUIStore();
  const isDark = theme === 'dark';
  const { isLoading, hasOrganizations } = useRequireOrganization();
  const { counts } = useNotificationsStore();
  const { totalUnreadCount } = useChatStore();

  // Show loading while checking organization membership
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // The hook will redirect if user has no organizations
  // We still render tabs to allow the redirect to happen smoothly

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#fff' : '#007AFF',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        tabBarStyle: {
          backgroundColor: isDark ? '#1C1C1E' : '#fff',
          borderTopColor: isDark ? '#38383A' : '#E5E5EA',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              name="calendar-outline"
              size={size}
              color={color}
              badgeCount={counts.events}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              name="chatbubble-outline"
              size={size}
              color={color}
              badgeCount={totalUnreadCount || counts.messages}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
