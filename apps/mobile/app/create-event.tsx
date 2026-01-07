import React, { useState, useMemo } from 'react';
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
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CREATE_EVENT } from '@/lib/graphql/mutations/events';
import { GET_EVENTS } from '@/lib/graphql/queries/events';
import { GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui';
import { Organization, OrganizationsForSelector } from '@/types';

const EVENT_TYPES = [
  { value: 'MEETING', label: 'Meeting' },
  { value: 'RALLY', label: 'Rally' },
  { value: 'TOWN_HALL', label: 'Town Hall' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'WEBINAR', label: 'Webinar' },
  { value: 'OTHER', label: 'Other' },
];

const LEVEL_LABELS: Record<string, string> = {
  COUNTRY: 'Country',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

interface LocationOption {
  level: 'COUNTRY' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';
  label: string;
  name: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

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

  // Organization and location selection
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Date picker visibility
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');

  // Type picker visibility
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Fetch user's organizations
  const { data: selectorData, loading: orgsLoading } = useQuery<{
    myOrganizationsForSelector: OrganizationsForSelector;
  }>(GET_ORGANIZATIONS_FOR_SELECTOR, {
    fetchPolicy: 'cache-and-network',
  });

  // Sort organizations by joinedAt (newest first)
  const organizations = useMemo(() => {
    const orgs = selectorData?.myOrganizationsForSelector?.organizations || [];
    return [...orgs].sort((a, b) => {
      if (!a.joinedAt && !b.joinedAt) return 0;
      if (!a.joinedAt) return 1;
      if (!b.joinedAt) return -1;
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });
  }, [selectorData?.myOrganizationsForSelector?.organizations]);

  // Build location options from user's registered location
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    const loc = user?.location;

    if (loc?.country) {
      options.push({
        level: 'COUNTRY',
        label: `Country - ${loc.country.name}`,
        name: loc.country.name,
      });
    } else if (loc?.state) {
      options.push({
        level: 'COUNTRY',
        label: 'Country - Nigeria',
        name: 'Nigeria',
      });
    }

    if (loc?.state) {
      options.push({
        level: 'STATE',
        label: `State - ${loc.state.name}`,
        name: loc.state.name,
      });
    }
    if (loc?.lga) {
      options.push({
        level: 'LGA',
        label: `LGA - ${loc.lga.name}`,
        name: loc.lga.name,
      });
    }
    if (loc?.ward) {
      options.push({
        level: 'WARD',
        label: `Ward - ${loc.ward.name}`,
        name: loc.ward.name,
      });
    }
    if (loc?.pollingUnit) {
      options.push({
        level: 'POLLING_UNIT',
        label: `Polling Unit - ${loc.pollingUnit.name}`,
        name: loc.pollingUnit.name,
      });
    }

    return options;
  }, [user?.location]);

  const hasLocation = locationOptions.length > 0;

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
    if (!selectedOrg) {
      Alert.alert('Error', 'Please select an organization');
      return false;
    }
    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location level');
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
            orgId: selectedOrg?.id,
            locationLevel: selectedLocation?.level,
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

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    setShowOrgPicker(false);
  };

  const handleSelectLocation = (loc: LocationOption) => {
    setSelectedLocation(loc);
    setShowLocationPicker(false);
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
        {/* Organization Selector */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Organization *</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowOrgPicker(true)}
          >
            {selectedOrg ? (
              <View style={styles.selectorContent}>
                <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={32} />
                <Text style={styles.selectorText} numberOfLines={1}>
                  {selectedOrg.name}
                </Text>
              </View>
            ) : (
              <View style={styles.selectorContent}>
                <Ionicons name="business-outline" size={20} color="#007AFF" />
                <Text style={[styles.selectorText, { color: '#007AFF' }]}>
                  Select organization
                </Text>
              </View>
            )}
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Location Level Selector */}
        {hasLocation && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location Scope *</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowLocationPicker(true)}
            >
              <View style={styles.selectorContent}>
                <Ionicons name="location" size={20} color="#007AFF" />
                <Text style={[styles.selectorText, !selectedLocation && { color: '#007AFF' }]}>
                  {selectedLocation?.name || 'Select location level'}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        )}

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
            <Text style={styles.label}>Venue *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Event venue address"
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

      {/* Organization Picker Modal */}
      <Modal
        visible={showOrgPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrgPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Organization</Text>
            <TouchableOpacity onPress={() => setShowOrgPicker(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} keyboardShouldPersistTaps="handled">
            {orgsLoading && organizations.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading organizations...</Text>
              </View>
            )}

            {organizations.length > 0 ? (
              <View style={styles.orgSection}>
                {organizations.map((org) => (
                  <TouchableOpacity
                    key={org.id}
                    style={[
                      styles.orgItem,
                      selectedOrg?.id === org.id && styles.orgItemSelected,
                    ]}
                    onPress={() => handleSelectOrg(org)}
                    activeOpacity={0.6}
                  >
                    <View style={styles.orgItemContent}>
                      <Avatar uri={org.logo} name={org.name} size={44} />
                      <View style={styles.orgItemInfo}>
                        <Text style={styles.orgItemName}>{org.name}</Text>
                        <Text style={styles.orgItemDescription} numberOfLines={2}>
                          {org.description || `${LEVEL_LABELS[org.level] || org.level} organization`}
                        </Text>
                      </View>
                    </View>
                    {selectedOrg?.id === org.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No organizations found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Join an organization to create events
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Location Level Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Location Scope</Text>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.locationHint}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.locationHintText}>
              Choose the geographic scope for your event visibility
            </Text>
          </View>
          <FlatList
            data={locationOptions}
            keyExtractor={(item) => item.level}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.locationItem,
                  selectedLocation?.level === item.level && styles.locationItemSelected,
                ]}
                onPress={() => handleSelectLocation(item)}
              >
                <View style={styles.locationItemContent}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="location" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.locationItemInfo}>
                    <Text style={styles.locationItemLabel}>{item.name}</Text>
                    <Text style={styles.locationItemLevel}>
                      {LEVEL_LABELS[item.level]}
                    </Text>
                  </View>
                </View>
                {selectedLocation?.level === item.level && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  selectorButton: {
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
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  selectorText: {
    fontSize: 16,
    color: '#000',
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalScrollView: {
    flex: 1,
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
  orgSection: {
    paddingTop: 12,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orgItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  orgItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  orgItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  locationHintText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  locationItemLevel: {
    fontSize: 13,
    color: '#666',
  },
});
