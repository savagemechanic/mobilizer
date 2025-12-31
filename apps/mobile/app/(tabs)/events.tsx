import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { useEventsStore, Event } from '@/store/events';
import { EventCard } from '@/components/events/EventCard';
import { SearchInput } from '@/components/ui';
import { GET_EVENTS, GET_MY_EVENTS } from '@/lib/graphql/queries/events';
import { RSVP_EVENT } from '@/lib/graphql/mutations/events';

export default function EventsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'my'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const {
    events,
    myEvents,
    offset,
    limit,
    hasMore,
    isLoading,
    isRefreshing,
    addEvents,
    setMyEvents,
    setLoading,
    setRefreshing,
    resetPagination,
    optimisticRSVP,
    optimisticCancelRSVP,
  } = useEventsStore();

  // Query for all events
  const { loading, error, refetch, fetchMore } = useQuery(GET_EVENTS, {
    variables: { limit, offset: 0 },
    skip: activeTab !== 'upcoming',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (data?.events) {
        addEvents(data.events, true);
      }
      setLoading(false);
      setRefreshing(false);
    },
    onError: (error) => {
      console.error('Error fetching events:', error);
      setLoading(false);
      setRefreshing(false);
    },
  });

  // Query for my events
  const { loading: myEventsLoading, refetch: refetchMyEvents } = useQuery(GET_MY_EVENTS, {
    variables: { upcoming: true },
    skip: activeTab !== 'my',
    onCompleted: (data) => {
      if (data?.myEvents) {
        setMyEvents(data.myEvents);
      }
      setLoading(false);
      setRefreshing(false);
    },
    onError: (error) => {
      console.error('Error fetching my events:', error);
      setLoading(false);
      setRefreshing(false);
    },
  });

  // RSVP mutation
  const [rsvpMutation] = useMutation(RSVP_EVENT);

  // Initial load
  useEffect(() => {
    setLoading(true);
  }, [activeTab]);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    const dataToFilter = activeTab === 'upcoming' ? events : myEvents;

    if (!searchQuery.trim()) {
      return dataToFilter;
    }

    const query = searchQuery.toLowerCase().trim();
    return dataToFilter.filter((event) => {
      const titleMatch = event.title?.toLowerCase().includes(query);
      const descriptionMatch = event.description?.toLowerCase().includes(query);
      const locationMatch = event.location?.toLowerCase().includes(query);
      return titleMatch || descriptionMatch || locationMatch;
    });
  }, [events, myEvents, activeTab, searchQuery]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    resetPagination();
    if (activeTab === 'upcoming') {
      await refetch();
    } else {
      await refetchMyEvents();
    }
  }, [activeTab, resetPagination, refetch, refetchMyEvents, setRefreshing]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!hasMore || loading || activeTab !== 'upcoming' || searchQuery) return;

    try {
      const { data } = await fetchMore({
        variables: {
          limit,
          offset: events.length,
        },
      });

      if (data?.events) {
        addEvents(data.events, false);
      }
    } catch (error) {
      console.error('Error loading more events:', error);
    }
  }, [hasMore, loading, activeTab, searchQuery, limit, events.length, fetchMore, addEvents]);

  // Handle event press
  const handleEventPress = useCallback((event: Event) => {
    router.push(`/event/${event.id}`);
  }, [router]);

  // Handle RSVP
  const handleRSVP = useCallback(
    async (eventId: string) => {
      optimisticRSVP(eventId);

      try {
        await rsvpMutation({
          variables: { eventId, status: 'GOING' },
        });
        await refetchMyEvents();
      } catch (error) {
        console.error('Error RSVP to event:', error);
        optimisticCancelRSVP(eventId);
      }
    },
    [rsvpMutation, optimisticRSVP, optimisticCancelRSVP, refetchMyEvents]
  );

  // Handle cancel RSVP
  const handleCancelRSVP = useCallback(
    async (eventId: string) => {
      optimisticCancelRSVP(eventId);

      try {
        await rsvpMutation({
          variables: { eventId, status: 'NOT_GOING' },
        });
        await refetchMyEvents();
      } catch (error) {
        console.error('Error canceling RSVP:', error);
        optimisticRSVP(eventId);
      }
    },
    [rsvpMutation, optimisticRSVP, optimisticCancelRSVP, refetchMyEvents]
  );

  // Check if user is attending an event
  const isAttending = useCallback(
    (eventId: string) => {
      return myEvents.some((event) => event.id === eventId);
    },
    [myEvents]
  );

  // Render event item
  const renderEvent = useCallback(
    ({ item }: { item: Event }) => (
      <EventCard
        event={item}
        onPress={handleEventPress}
        showRSVPButton={activeTab === 'upcoming'}
        onRSVP={handleRSVP}
        onCancelRSVP={handleCancelRSVP}
        isAttending={isAttending(item.id)}
      />
    ),
    [handleEventPress, handleRSVP, handleCancelRSVP, isAttending, activeTab]
  );

  // Render footer
  const renderFooter = useCallback(() => {
    if (!hasMore || activeTab !== 'upcoming' || searchQuery) return null;

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  }, [hasMore, activeTab, searchQuery]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (loading || myEventsLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyText}>No events found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="calendar-outline" size={64} color="#CCC" />
        <Text style={styles.emptyText}>
          {activeTab === 'upcoming' ? 'No upcoming events' : 'No events in your calendar'}
        </Text>
        <Text style={styles.emptySubtext}>
          {activeTab === 'upcoming'
            ? 'Check back later for new events'
            : 'RSVP to events to add them to your calendar'}
        </Text>
      </View>
    );
  }, [loading, myEventsLoading, activeTab, searchQuery]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Events</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setIsSearching(!isSearching)}
            >
              <Ionicons
                name={isSearching ? 'close' : 'search'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push('/create-event')}
            >
              <Ionicons name="add-circle-outline" size={26} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        {isSearching && (
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events..."
            style={styles.searchInput}
            autoFocus
          />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => setActiveTab('my')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>
            My Events
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={filteredEvents}
        renderItem={renderEvent}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
    marginLeft: 12,
  },
  searchInput: {
    marginTop: 12,
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
  listContent: {
    flexGrow: 1,
    paddingVertical: 16,
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
