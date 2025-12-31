import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast, isFuture } from 'date-fns';
import { Event } from '@/store/events';

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  showRSVPButton?: boolean;
  onRSVP?: (eventId: string) => void;
  onCancelRSVP?: (eventId: string) => void;
  isAttending?: boolean;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  RALLY: 'Rally',
  TOWN_HALL: 'Town Hall',
  MEETING: 'Meeting',
  WEBINAR: 'Webinar',
  WORKSHOP: 'Workshop',
  OTHER: 'Event',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  RALLY: '#FF6B6B',
  TOWN_HALL: '#4ECDC4',
  MEETING: '#45B7D1',
  WEBINAR: '#FFA07A',
  WORKSHOP: '#98D8C8',
  OTHER: '#999',
};

export function EventCard({
  event,
  onPress,
  showRSVPButton = true,
  onRSVP,
  onCancelRSVP,
  isAttending = false,
}: EventCardProps) {
  const handlePress = () => {
    onPress?.(event);
  };

  const handleRSVP = () => {
    if (isAttending) {
      onCancelRSVP?.(event.id);
    } else {
      onRSVP?.(event.id);
    }
  };

  const typeLabel = EVENT_TYPE_LABELS[event.type] || event.type;
  const typeColor = EVENT_TYPE_COLORS[event.type] || '#999';

  const startDate = new Date(event.startTime);
  const isEventPast = isPast(startDate);
  const isEventUpcoming = isFuture(startDate);

  const formattedDate = format(startDate, 'MMM dd, yyyy');
  const formattedTime = format(startDate, 'h:mm a');

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Cover image */}
      {event.banner && (
        <Image
          source={{ uri: event.banner }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.typeText}>{typeLabel}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Description */}
        {event.description && (
          <Text style={styles.description} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* Meta info */}
        <View style={styles.metaContainer}>
          {/* Date */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>

          {/* Time */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{formattedTime}</Text>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <Ionicons
              name={event.isVirtual ? 'videocam-outline' : 'location-outline'}
              size={16}
              color="#666"
            />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.isVirtual ? 'Virtual Event' : event.location || 'TBD'}
            </Text>
          </View>
        </View>

        {/* Status badge */}
        {isEventPast && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Past Event</Text>
          </View>
        )}

        {/* RSVP button */}
        {showRSVPButton && !isEventPast && (
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              isAttending && styles.rsvpButtonAttending,
            ]}
            onPress={handleRSVP}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isAttending ? 'checkmark-circle' : 'checkmark-circle-outline'}
              size={18}
              color={isAttending ? '#34C759' : '#007AFF'}
            />
            <Text
              style={[
                styles.rsvpButtonText,
                isAttending && styles.rsvpButtonTextAttending,
              ]}
            >
              {isAttending ? 'Attending' : 'RSVP'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  coverImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  rsvpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  rsvpButtonAttending: {
    backgroundColor: '#F0FFF4',
    borderColor: '#34C759',
  },
  rsvpButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  rsvpButtonTextAttending: {
    color: '#34C759',
  },
});
