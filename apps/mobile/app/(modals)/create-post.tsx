import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_POST, CreatePostInput } from '@/lib/graphql/mutations/feed';
import { GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { useFeedStore, FeedViewType } from '@/store/feed';
import { useAuthStore } from '@/store/auth';
import { Button, Avatar } from '@/components/ui';
import { LocationLevel, Organization, OrganizationsForSelector } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: 'National',
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

export default function CreatePostModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ repostText?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addPost, currentViewingOrg, currentViewType, currentLocationLevel } = useFeedStore();

  // Determine initial org selection based on view type
  // - If viewing a specific org: default to that org
  // - If viewing 'public': default to public org (handled later when data loads)
  // - If viewing 'all': show "Select" (null org, not defaulting to any)
  const getInitialOrg = (): Organization | null => {
    if (currentViewType === 'org' && currentViewingOrg) {
      return currentViewingOrg;
    }
    // For 'all' and 'public', we'll handle this after data loads
    return null;
  };

  const [content, setContent] = useState(params.repostText || '');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(getInitialOrg());
  const [orgSelectionMode, setOrgSelectionMode] = useState<'select' | 'org' | 'public'>(
    currentViewType === 'all' ? 'select' : currentViewType === 'public' ? 'public' : 'org'
  );
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [createPostMutation, { loading }] = useMutation(CREATE_POST);

  // Use new organization selector query - always fetch fresh data
  const { data: selectorData, loading: orgsLoading } = useQuery<{
    myOrganizationsForSelector: OrganizationsForSelector;
  }>(GET_ORGANIZATIONS_FOR_SELECTOR, {
    fetchPolicy: 'cache-and-network',
  });

  const orgsForSelector = selectorData?.myOrganizationsForSelector;
  const publicOrg = orgsForSelector?.publicOrg;
  const publicOrgEnabled = orgsForSelector?.publicOrgEnabled ?? true;
  const showAllOrgsOption = orgsForSelector?.showAllOrgsOption ?? false;

  // Sort organizations by joinedAt (newest first)
  const organizations = useMemo(() => {
    const orgs = orgsForSelector?.organizations || [];
    return [...orgs].sort((a, b) => {
      if (!a.joinedAt && !b.joinedAt) return 0;
      if (!a.joinedAt) return 1;
      if (!b.joinedAt) return -1;
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });
  }, [orgsForSelector?.organizations]);

  const authorName =
    user?.displayName || `${user?.firstName} ${user?.lastName}`.trim() || 'You';

  // Build location options from user's registered location
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    const loc = user?.location;

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

  // Set default org for 'public' view type when data loads
  useEffect(() => {
    if (currentViewType === 'public' && publicOrg && !selectedOrg) {
      setSelectedOrg(publicOrg);
      setOrgSelectionMode('public');
    }
  }, [publicOrg, currentViewType]);

  // Set default location based on currentLocationLevel or first available
  useEffect(() => {
    if (!selectedLocation && locationOptions.length > 0) {
      // If viewing a specific location level, use that
      if (currentLocationLevel) {
        const matchingOption = locationOptions.find(opt => opt.level === currentLocationLevel);
        if (matchingOption) {
          setSelectedLocation(matchingOption);
          return;
        }
      }
      // Otherwise default to the first (most general) location option
      setSelectedLocation(locationOptions[0]);
    }
  }, [currentLocationLevel, locationOptions]);

  // Check if user has location set
  const hasLocation = locationOptions.length > 0;

  // Handle image picker
  const handlePickImage = async () => {
    if (selectedImages.length >= 4) {
      alert('You can only add up to 4 images');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4 - selectedImages.length,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // Handle add poll option
  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // Handle remove poll option
  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  // Handle update poll option
  const handleUpdatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  // Toggle poll form
  const handleTogglePoll = () => {
    setShowPollForm(!showPollForm);
    if (!showPollForm) {
      setPollQuestion('');
      setPollOptions(['', '']);
    }
  };

  // Validate form
  const isValid = () => {
    if (!content.trim() && selectedImages.length === 0 && !showPollForm) {
      return false;
    }

    if (showPollForm) {
      if (!pollQuestion.trim()) return false;
      const validOptions = pollOptions.filter((opt) => opt.trim()).length;
      if (validOptions < 2) return false;
    }

    return true;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid()) {
      alert('Please add some content, images, or a poll');
      return;
    }

    try {
      // Prepare input
      const input: CreatePostInput = {
        content: content.trim(),
        type: 'TEXT',
      };

      // Add organization if selected
      if (selectedOrg?.id) {
        input.orgId = selectedOrg.id;
      }

      // Add location level if selected
      if (selectedLocation) {
        input.locationLevel = selectedLocation.level;
      }

      // Add media URLs (for now, just URIs - in production, upload to server first)
      if (selectedImages.length > 0) {
        input.mediaUrls = selectedImages; // TODO: Upload images and get URLs
        input.type = 'IMAGE';
      }

      // Add poll
      if (showPollForm && pollQuestion.trim()) {
        const validOptions = pollOptions.filter((opt) => opt.trim());
        if (validOptions.length >= 2) {
          input.poll = {
            question: pollQuestion.trim(),
            options: validOptions,
          };
          input.type = 'POLL';
        }
      }

      // Create post
      const { data } = await createPostMutation({
        variables: { input },
      });

      if (data?.createPost) {
        // Add post to feed store
        addPost(data.createPost);

        // Close modal
        router.back();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle org selection
  const handleSelectOrg = (org: Organization | null, mode: 'org' | 'public' | 'select') => {
    setSelectedOrg(org);
    setOrgSelectionMode(mode);
    setShowOrgPicker(false);
  };

  // Handle location selection
  const handleSelectLocation = (loc: LocationOption | null) => {
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
        <TouchableOpacity onPress={() => router.back()} disabled={loading}>
          <Ionicons name="close" size={28} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={!isValid() || loading}>
          <Text
            style={[
              styles.postButton,
              (!isValid() || loading) && styles.postButtonDisabled,
            ]}
          >
            {loading ? 'Posting...' : 'Post'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Author info with selectors underneath */}
        <View style={styles.authorSection}>
          <Avatar uri={user?.avatar} name={authorName} size={44} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            {user?.username && (
              <Text style={styles.authorUsername}>@{user.username}</Text>
            )}

            {/* Inline selectors */}
            <View style={styles.inlineSelectors}>
              {/* Organization selector */}
              <TouchableOpacity
                style={styles.inlineSelect}
                onPress={() => setShowOrgPicker(true)}
                disabled={loading}
              >
                {selectedOrg && orgSelectionMode === 'org' ? (
                  <>
                    <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={16} />
                    <Text style={styles.inlineSelectText} numberOfLines={1}>
                      {selectedOrg.name}
                    </Text>
                  </>
                ) : selectedOrg && orgSelectionMode === 'public' ? (
                  <>
                    <Ionicons name="globe-outline" size={14} color="#34C759" />
                    <Text style={[styles.inlineSelectText, { color: '#34C759' }]}>Public</Text>
                  </>
                ) : orgSelectionMode === 'select' ? (
                  <>
                    <Ionicons name="layers-outline" size={14} color="#007AFF" />
                    <Text style={[styles.inlineSelectText, { color: '#007AFF' }]}>All Orgs</Text>
                  </>
                ) : !selectedOrg ? (
                  <>
                    <Ionicons name="business-outline" size={14} color="#007AFF" />
                    <Text style={[styles.inlineSelectText, { color: '#007AFF' }]}>Select org</Text>
                  </>
                ) : (
                  <>
                    <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={16} />
                    <Text style={styles.inlineSelectText} numberOfLines={1}>
                      {selectedOrg.name}
                    </Text>
                  </>
                )}
                <Ionicons name="chevron-down" size={12} color="#666" />
              </TouchableOpacity>

              {/* Location selector */}
              {hasLocation && (
                <TouchableOpacity
                  style={styles.inlineSelect}
                  onPress={() => setShowLocationPicker(true)}
                  disabled={loading}
                >
                  <Ionicons name="location" size={14} color="#007AFF" />
                  <Text style={styles.inlineSelectText} numberOfLines={1}>
                    {selectedLocation?.name || 'Location'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Content input */}
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
          editable={!loading}
        />

        {/* Selected images */}
        {selectedImages.length > 0 && (
          <View style={styles.imagesContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                    disabled={loading}
                  >
                    <Ionicons name="close-circle" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Poll form */}
        {showPollForm && (
          <View style={styles.pollContainer}>
            <TextInput
              style={styles.pollQuestion}
              placeholder="Poll question"
              placeholderTextColor="#999"
              value={pollQuestion}
              onChangeText={setPollQuestion}
              maxLength={200}
              editable={!loading}
            />

            {pollOptions.map((option, index) => (
              <View key={index} style={styles.pollOptionRow}>
                <TextInput
                  style={styles.pollOptionInput}
                  placeholder={`Option ${index + 1}`}
                  placeholderTextColor="#999"
                  value={option}
                  onChangeText={(value) => handleUpdatePollOption(index, value)}
                  maxLength={100}
                  editable={!loading}
                />
                {pollOptions.length > 2 && (
                  <TouchableOpacity
                    onPress={() => handleRemovePollOption(index)}
                    disabled={loading}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {pollOptions.length < 4 && (
              <TouchableOpacity
                style={styles.addOptionButton}
                onPress={handleAddPollOption}
                disabled={loading}
              >
                <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.addOptionText}>Add option</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolButton}
            onPress={handlePickImage}
            disabled={loading || selectedImages.length >= 4}
          >
            <Ionicons name="image-outline" size={24} color="#007AFF" />
            <Text style={styles.toolText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolButton}
            onPress={handleTogglePoll}
            disabled={loading}
          >
            <Ionicons
              name={showPollForm ? 'bar-chart' : 'bar-chart-outline'}
              size={24}
              color={showPollForm ? '#007AFF' : '#666'}
            />
            <Text style={[styles.toolText, showPollForm && styles.toolTextActive]}>
              Poll
            </Text>
          </TouchableOpacity>
        </View>

        {/* Character count */}
        <Text style={styles.charCount}>
          {content.length} / 2000
        </Text>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {/* Organization Picker Modal */}
      <Modal
        visible={showOrgPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrgPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Post to</Text>
            <TouchableOpacity onPress={() => setShowOrgPicker(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.orgPickerScrollView} keyboardShouldPersistTaps="handled">
            {/* Loading state */}
            {orgsLoading && organizations.length === 0 && (
              <View style={styles.orgLoadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.orgLoadingText}>Loading organizations...</Text>
              </View>
            )}

            {/* User's organizations (sorted by joinedAt, newest first) */}
            {organizations.length > 0 && (
              <View style={styles.orgSection}>
                <Text style={styles.orgSectionTitle}>Your Organizations</Text>
                {organizations.map((org) => (
                  <TouchableOpacity
                    key={org.id}
                    style={[
                      styles.orgItem,
                      orgSelectionMode === 'org' && selectedOrg?.id === org.id && styles.orgItemSelected,
                    ]}
                    onPress={() => handleSelectOrg(org, 'org')}
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
                    {orgSelectionMode === 'org' && selectedOrg?.id === org.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* All Organizations option - only show if user has at least one non-public org */}
            {showAllOrgsOption && (
              <>
                <View style={styles.orgDivider} />
                <TouchableOpacity
                  style={[
                    styles.orgItem,
                    orgSelectionMode === 'select' && styles.orgItemSelected,
                  ]}
                  onPress={() => handleSelectOrg(null, 'select')}
                  activeOpacity={0.7}
                >
                  <View style={styles.orgItemContent}>
                    <View style={[styles.specialOrgIcon, { backgroundColor: '#E8F0FE' }]}>
                      <Ionicons name="layers-outline" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.orgItemInfo}>
                      <Text style={styles.orgItemName}>All Organizations</Text>
                      <Text style={styles.orgItemDescription}>
                        See conversations from all your groups, and the public
                      </Text>
                    </View>
                  </View>
                  {orgSelectionMode === 'select' && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* Public option */}
            {publicOrgEnabled && publicOrg && (
              <>
                <View style={styles.orgDivider} />
                <TouchableOpacity
                  style={[
                    styles.orgItem,
                    orgSelectionMode === 'public' && styles.orgItemSelected,
                  ]}
                  onPress={() => handleSelectOrg(publicOrg, 'public')}
                  activeOpacity={0.7}
                >
                  <View style={styles.orgItemContent}>
                    <View style={[styles.specialOrgIcon, { backgroundColor: '#E8F9ED' }]}>
                      <Ionicons name="globe-outline" size={24} color="#34C759" />
                    </View>
                    <View style={styles.orgItemInfo}>
                      <Text style={styles.orgItemName}>Public</Text>
                      <Text style={styles.orgItemDescription}>
                        See conversations by the public in your locations
                      </Text>
                    </View>
                  </View>
                  {orgSelectionMode === 'public' && (
                    <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.orgDivider} />

            {/* Join by code */}
            <TouchableOpacity
              style={styles.orgItem}
              onPress={() => {
                setShowOrgPicker(false);
                setTimeout(() => {
                  Alert.prompt(
                    'Join Organization',
                    'Enter the invite code to join an organization',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Join',
                        onPress: (code: string | undefined) => {
                          if (code?.trim()) {
                            // TODO: Call joinOrganizationByCode mutation
                            Alert.alert('Coming Soon', 'Join by code will be available soon');
                          }
                        },
                      },
                    ],
                    'plain-text'
                  );
                }, 300);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.orgItemContent}>
                <View style={[styles.specialOrgIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="key-outline" size={24} color="#FF9800" />
                </View>
                <View style={styles.orgItemInfo}>
                  <Text style={styles.orgItemName}>Join by code</Text>
                  <Text style={styles.orgItemDescription}>
                    Enter an invite code to join an organization
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {organizations.length === 0 && !publicOrgEnabled && (
              <View style={styles.emptyOrgs}>
                <Text style={styles.emptyOrgsText}>No organizations found</Text>
                <Text style={styles.emptyOrgsSubtext}>
                  Join an organization to post to it
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
              Choose the geographic scope for your post visibility
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
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  postButtonDisabled: {
    color: '#CCC',
  },
  content: {
    flex: 1,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  authorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  authorUsername: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  inlineSelectors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  inlineSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    gap: 4,
  },
  inlineSelectText: {
    fontSize: 13,
    color: '#333',
    maxWidth: 100,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagesContainer: {
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  pollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  pollQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollOptionInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginRight: 8,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  addOptionText: {
    fontSize: 15,
    color: '#007AFF',
    marginLeft: 6,
  },
  toolbar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginTop: 12,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  toolText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 6,
  },
  toolTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  charCount: {
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
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
  orgSection: {
    paddingTop: 12,
  },
  orgSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  orgDivider: {
    height: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
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
  publicOrgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F9ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specialOrgIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  orgItemLevel: {
    fontSize: 13,
    color: '#666',
  },
  orgItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  orgPickerScrollView: {
    flex: 1,
  },
  orgLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  orgLoadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyOrgs: {
    padding: 32,
    alignItems: 'center',
  },
  emptyOrgsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyOrgsSubtext: {
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
  locationIconDefault: {
    backgroundColor: '#F0F0F0',
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
