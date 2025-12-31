import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@apollo/client';
import { format, formatDistanceToNow, isPast, isFuture, isToday } from 'date-fns';
import { GET_EVENT } from '@/lib/graphql/queries/events';
import { RSVP_EVENT } from '@/lib/graphql/mutations/events';
import { useEventsStore } from '@/store/events';

type RSVPStatus = 'GOING' | 'MAYBE' | 'NOT_GOING';

const EVENT_TYPE_LABELS: Record<string, string> = {
  MEETING: 'Meeting',
  RALLY: 'Rally',
  TOWN_HALL: 'Town Hall',
  WEBINAR: 'Webinar',
  WORKSHOP: 'Workshop',
  OTHER: 'Event',
};

const EVENT_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  MEETING: 'people-outline',
  RALLY: 'megaphone-outline',
  TOWN_HALL: 'chatbubbles-outline',
  WEBINAR: 'videocam-outline',
  WORKSHOP: 'construct-outline',
  OTHER: 'calendar-outline',
};

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { optimisticRSVP, optimisticCancelRSVP } = useEventsStore();

  const [userRSVP, setUserRSVP] = useState<RSVPStatus | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_EVENT, {
    variables: { id },
    skip: !id,
  });

  const [rsvpMutation, { loading: rsvpLoading }] = useMutation(RSVP_EVENT, {
    onCompleted: (data) => {
      if (data?.rsvpEvent) {
        setUserRSVP(data.rsvpEvent.status as RSVPStatus);
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update RSVP');
    },
  });

  const event = data?.event;

  const handleRSVP = async (status: RSVPStatus) => {
    if (!id) return;

    // Optimistic update
    if (status === 'GOING') {
      optimisticRSVP(id);
    } else if (status === 'NOT_GOING' && userRSVP === 'GOING') {
      optimisticCancelRSVP(id);
    }

    setUserRSVP(status);

    try {
      await rsvpMutation({
        variables: { eventId: id, status },
      });
    } catch (error) {
      // Revert on error
      setUserRSVP(null);
      console.error('RSVP error:', error);
    }
  };

  const handleOpenVirtualLink = () => {
    if (event?.virtualLink) {
      Linking.openURL(event.virtualLink).catch(() => {
        Alert.alert('Error', 'Could not open the virtual event link');
      });
    }
  };

  const handleOpenMaps = () => {
    if (event?.location) {
      const encodedLocation = encodeURIComponent(event.location);
      Linking.openURL(`https://maps.google.com/?q=${encodedLocation}`).catch(() => {
        Alert.alert('Error', 'Could not open maps');
      });
    }
  };

  const getEventStatus = () => {
    if (!event) return null;

    const startDate = new Date(event.startTime);
    const endDate = event.endTime ? new Date(event.endTime) : null;

    if (endDate && isPast(endDate)) {
      return { label: 'Ended', color: '#999' };
    }
    if (isPast(startDate) && (!endDate || isFuture(endDate))) {
      return { label: 'In Progress', color: '#34C759' };
    }
    if (isToday(startDate)) {
      return { label: 'Today', color: '#FF9500' };
    }
    return null;
  };

  const eventStatus = getEventStatus();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Event</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>Event not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const eventTypeLabel = EVENT_TYPE_LABELS[event.type] || 'Event';
  const eventTypeIcon = EVENT_TYPE_ICONS[event.type] || 'calendar-outline';
  const startDate = new Date(event.startTime);
  const endDate = event.endTime ? new Date(event.endTime) : null;
  const isPastEvent = endDate ? isPast(endDate) : isPast(startDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {event.banner ? (
          <Image source={{ uri: event.banner }} style={styles.coverImage} />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Ionicons name={eventTypeIcon} size={48} color="#CCC" />
          </View>
        )}

        {/* Event Info */}
        <View style={styles.infoSection}>
          {/* Status Badge */}
          {eventStatus && (
            <View style={[styles.statusBadge, { backgroundColor: eventStatus.color }]}>
              <Text style={styles.statusText}>{eventStatus.label}</Text>
            </View>
          )}

          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Ionicons name={eventTypeIcon} size={14} color="#007AFF" />
            <Text style={styles.typeText}>{eventTypeLabel}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date & Time</Text>
              <Text style={styles.detailValue}>
                {format(startDate, 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.detailValue}>
                {format(startDate, 'h:mm a')}
                {endDate && ` - ${format(endDate, 'h:mm a')}`}
              </Text>
              {!isPastEvent && (
                <Text style={styles.detailSubtext}>
                  {formatDistanceToNow(startDate, { addSuffix: true })}
                </Text>
              )}
            </View>
          </View>

          {/* Location */}
          {(event.location || event.isVirtual) && (
            <TouchableOpacity
              style={styles.detailRow}
              onPress={event.isVirtual ? handleOpenVirtualLink : handleOpenMaps}
              disabled={!event.location && !event.virtualLink}
            >
              <Ionicons
                name={event.isVirtual ? 'videocam-outline' : 'location-outline'}
                size={20}
                color="#666"
              />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>
                  {event.isVirtual ? 'Virtual Event' : 'Location'}
                </Text>
                <Text style={[styles.detailValue, { color: '#007AFF' }]}>
                  {event.isVirtual
                    ? event.virtualLink
                      ? 'Join Virtual Event'
                      : 'Virtual Event'
                    : event.location}
                </Text>
              </View>
              {(event.location || event.virtualLink) && (
                <Ionicons name="open-outline" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          )}

          {/* Description */}
          {event.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>About this event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}
        </View>

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* RSVP Buttons - Fixed at bottom */}
      {!isPastEvent && (
        <View style={[styles.rsvpSection, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpButtonGoing,
              userRSVP === 'GOING' && styles.rsvpButtonActive,
            ]}
            onPress={() => handleRSVP('GOING')}
            disabled={rsvpLoading}
          >
            {rsvpLoading && userRSVP === 'GOING' ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Ionicons
                  name={userRSVP === 'GOING' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={20}
                  color="#FFF"
                />
                <Text style={styles.rsvpButtonText}>
                  {userRSVP === 'GOING' ? 'Going' : "I'm Going"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpButtonMaybe,
              userRSVP === 'MAYBE' && styles.rsvpButtonMaybeActive,
            ]}
            onPress={() => handleRSVP('MAYBE')}
            disabled={rsvpLoading}
          >
            <Ionicons
              name={userRSVP === 'MAYBE' ? 'help-circle' : 'help-circle-outline'}
              size={20}
              color={userRSVP === 'MAYBE' ? '#FFF' : '#FF9500'}
            />
            <Text
              style={[
                styles.rsvpButtonTextSecondary,
                userRSVP === 'MAYBE' && { color: '#FFF' },
              ]}
            >
              Maybe
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rsvpButton,
              styles.rsvpButtonNotGoing,
              userRSVP === 'NOT_GOING' && styles.rsvpButtonNotGoingActive,
            ]}
            onPress={() => handleRSVP('NOT_GOING')}
            disabled={rsvpLoading}
          >
            <Ionicons
              name={userRSVP === 'NOT_GOING' ? 'close-circle' : 'close-circle-outline'}
              size={20}
              color={userRSVP === 'NOT_GOING' ? '#FFF' : '#FF3B30'}
            />
            <Text
              style={[
                styles.rsvpButtonTextSecondary,
                { color: '#FF3B30' },
                userRSVP === 'NOT_GOING' && { color: '#FFF' },
              ]}
            >
              Can't Go
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  errorButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  coverImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#E0E0E0',
  },
  coverPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  typeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },
  detailSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  descriptionSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  rsvpSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 10,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  rsvpButtonGoing: {
    backgroundColor: '#34C759',
  },
  rsvpButtonActive: {
    backgroundColor: '#2DA44E',
  },
  rsvpButtonMaybe: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  rsvpButtonMaybeActive: {
    backgroundColor: '#FF9500',
  },
  rsvpButtonNotGoing: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  rsvpButtonNotGoingActive: {
    backgroundColor: '#FF3B30',
  },
  rsvpButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rsvpButtonTextSecondary: {
    fontSize: 14,
    fontWeight: '600',
  },
});
