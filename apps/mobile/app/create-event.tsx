import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CREATE_EVENT } from '@/lib/graphql/mutations/events';
import { GET_EVENTS } from '@/lib/graphql/queries/events';

const EVENT_TYPES = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'RALLY', label: 'Rally' },
  { value: 'TOWN_HALL', label: 'Town Hall' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'OTHER', label: 'Other' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('MEETING');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [location, setLocation] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [virtualLink, setVirtualLink] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');

  // Date picker visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');

  // Type picker visibility
  const [showTypePicker, setShowTypePicker] = useState(false);

  const [createEvent, { loading }] = useMutation(CREATE_EVENT, {
    refetchQueries: [{ query: GET_EVENTS, variables: { limit: 20, offset: 0 } }],
    onCompleted: () => {
      Alert.alert('Success', 'Event created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create event');
    },
  });

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (isVirtual && !virtualLink.trim()) {
      Alert.alert('Error', 'Please enter a virtual meeting link');
      return false;
    }
    if (!isVirtual && !location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createEvent({
        variables: {
          input: {
            title: title.trim(),
            description: description.trim(),
            type: eventType,
            startTime: startDate.toISOString(),
            endTime: endDate?.toISOString(),
            location: isVirtual ? undefined : location.trim(),
            isVirtual,
            virtualLink: isVirtual ? virtualLink.trim() : undefined,
            maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
          },
        },
      });
    } catch (error) {
      // Error handled in onError
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
    }
    if (selectedDate) {
      setStartDate(selectedDate);
      if (Platform.OS === 'android' && startPickerMode === 'date') {
        setStartPickerMode('time');
        setShowStartPicker(true);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setEndDate(selectedDate);
      if (Platform.OS === 'android' && endPickerMode === 'date') {
        setEndPickerMode('time');
        setShowEndPicker(true);
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Event</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={styles.createButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#999"
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your event..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* Event Type */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Type</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTypePicker(!showTypePicker)}
          >
            <Text style={styles.selectButtonText}>
              {EVENT_TYPES.find((t) => t.value === eventType)?.label || 'Select type'}
            </Text>
            <Ionicons
              name={showTypePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
          {showTypePicker && (
            <View style={styles.optionsList}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.optionItem,
                    eventType === type.value && styles.optionItemActive,
                  ]}
                  onPress={() => {
                    setEventType(type.value);
                    setShowTypePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      eventType === type.value && styles.optionTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                  {eventType === type.value && (
                    <Ionicons name="checkmark" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Start Date/Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Start Date & Time *</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setStartPickerMode('date');
              setShowStartPicker(true);
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {formatDate(startDate)} at {formatTime(startDate)}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode={Platform.OS === 'ios' ? 'datetime' : startPickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
              minimumDate={new Date()}
            />
          )}
          {Platform.OS === 'ios' && showStartPicker && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowStartPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* End Date/Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>End Date & Time (Optional)</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => {
              setEndPickerMode('date');
              setShowEndPicker(true);
              if (!endDate) {
                const defaultEnd = new Date(startDate);
                defaultEnd.setHours(defaultEnd.getHours() + 1);
                setEndDate(defaultEnd);
              }
            }}
          >
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>
              {endDate
                ? `${formatDate(endDate)} at ${formatTime(endDate)}`
                : 'Set end time'}
            </Text>
            {endDate && (
              <TouchableOpacity
                onPress={() => setEndDate(null)}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          {showEndPicker && endDate && (
            <DateTimePicker
              value={endDate}
              mode={Platform.OS === 'ios' ? 'datetime' : endPickerMode}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
          {Platform.OS === 'ios' && showEndPicker && (
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowEndPicker(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Virtual Toggle */}
        <View style={styles.switchGroup}>
          <View style={styles.switchLabel}>
            <Ionicons name="videocam-outline" size={22} color="#007AFF" />
            <Text style={styles.switchText}>Virtual Event</Text>
          </View>
          <Switch
            value={isVirtual}
            onValueChange={setIsVirtual}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor="#FFF"
          />
        </View>

        {/* Location or Virtual Link */}
        {isVirtual ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Virtual Meeting Link *</Text>
            <TextInput
              style={styles.input}
              value={virtualLink}
              onChangeText={setVirtualLink}
              placeholder="https://zoom.us/j/..."
              placeholderTextColor="#999"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Event location"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {/* Max Attendees */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Max Attendees (Optional)</Text>
          <TextInput
            style={styles.input}
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder="Unlimited"
            placeholderTextColor="#999"
            keyboardType="number-pad"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={22} color="#FFF" />
              <Text style={styles.submitButtonText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  createButton: {
    padding: 4,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#000',
  },
  optionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  optionItemActive: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#000',
  },
  optionTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  doneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 10,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
});
