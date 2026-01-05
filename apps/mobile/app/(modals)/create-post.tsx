import React, { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_POST, CreatePostInput } from '@/lib/graphql/mutations/feed';
import { GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { useFeedStore } from '@/store/feed';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui';
import { Organization, OrganizationsForSelector } from '@/types';
import { uploadImage, isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

interface LocationOption {
  level: 'GLOBAL' | 'COUNTRY' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';
  label: string;
  name: string;
}

export default function CreatePostModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ repostText?: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addPost, currentViewingOrg, currentLocationLevel } = useFeedStore();

  const [content, setContent] = useState(params.repostText || '');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  // Auto-select the org that's currently active in the feed
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(currentViewingOrg);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const hasInitializedLocation = useRef(false);

  const [createPostMutation, { loading }] = useMutation(CREATE_POST);

  // Use new organization selector query - always fetch fresh data
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

  const authorName =
    user?.displayName || `${user?.firstName} ${user?.lastName}`.trim() || 'You';

  // Build location options from user's registered location (including Country)
  const locationOptions = useMemo(() => {
    const options: LocationOption[] = [];
    const loc = user?.location;

    // Add Country level first (always available if user has any location)
    if (loc?.country) {
      options.push({
        level: 'COUNTRY',
        label: `Country - ${loc.country.name}`,
        name: loc.country.name,
      });
    } else if (loc?.state) {
      // Fallback: use Nigeria as default country if state exists
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

  // Set location based on currentLocationLevel from feed (if set) - only once on mount
  useEffect(() => {
    if (!hasInitializedLocation.current && locationOptions.length > 0 && currentLocationLevel) {
      const matchingOption = locationOptions.find(opt => opt.level === currentLocationLevel);
      if (matchingOption) {
        setSelectedLocation(matchingOption);
        hasInitializedLocation.current = true;
      }
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
    // Require content, images, or poll
    if (!content.trim() && selectedImages.length === 0 && !showPollForm) {
      return false;
    }

    // Require organization selection
    if (!selectedOrg) {
      return false;
    }

    // Require location selection
    if (!selectedLocation) {
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
    if (!selectedOrg) {
      alert('Please select an organization');
      return;
    }

    if (!selectedLocation) {
      alert('Please select a location');
      return;
    }

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

      // Upload images to Firebase if configured
      if (selectedImages.length > 0) {
        if (isFirebaseConfigured() && user?.id) {
          try {
            initializeFirebase();
            const uploadedUrls = await Promise.all(
              selectedImages.map((uri, index) => {
                const fileName = `post_${Date.now()}_${index}.jpg`;
                return uploadImage(uri, 'post', user.id, fileName);
              })
            );
            input.mediaUrls = uploadedUrls;
          } catch (error) {
            console.error('Failed to upload images:', error);
            alert('Failed to upload images. Please try again.');
            return;
          }
        } else {
          // Fallback: use local URIs (won't work in production)
          input.mediaUrls = selectedImages;
        }
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
  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
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
                {selectedOrg ? (
                  <>
                    <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={16} />
                    <Text style={styles.inlineSelectText} numberOfLines={1}>
                      {selectedOrg.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="business-outline" size={14} color="#007AFF" />
                    <Text style={[styles.inlineSelectText, { color: '#007AFF' }]}>Select org</Text>
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
                  <Text style={[styles.inlineSelectText, !selectedLocation && { color: '#007AFF' }]} numberOfLines={1}>
                    {selectedLocation?.name || 'Select location'}
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
            {organizations.length > 0 ? (
              <View style={styles.orgSection}>
                <Text style={styles.orgSectionTitle}>Select Organization</Text>
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
