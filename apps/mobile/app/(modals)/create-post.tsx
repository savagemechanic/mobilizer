import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_POST, CreatePostInput } from '@/lib/graphql/mutations/feed';
import { GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/organizations';
import { useFeedStore } from '@/store/feed';
import { useAuthStore } from '@/store/auth';
import { Button, Avatar } from '@/components/ui';

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

export default function CreatePostModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addPost } = useFeedStore();

  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);

  const [createPostMutation, { loading }] = useMutation(CREATE_POST);
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS);
  const organizations = orgsData?.myOrganizations || [];

  const authorName =
    user?.displayName || `${user?.firstName} ${user?.lastName}`.trim() || 'You';

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
        {/* Author info */}
        <View style={styles.authorSection}>
          <Avatar uri={user?.avatar} name={authorName} size={44} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <TouchableOpacity
              style={styles.orgSelector}
              onPress={() => setShowOrgPicker(true)}
              disabled={loading}
            >
              {selectedOrg ? (
                <View style={styles.selectedOrgContainer}>
                  <Ionicons name="location" size={14} color="#007AFF" />
                  <Text style={styles.selectedOrgText} numberOfLines={1}>
                    {selectedOrg.name} - {LEVEL_LABELS[selectedOrg.level] || selectedOrg.level}
                  </Text>
                </View>
              ) : (
                <View style={styles.selectOrgPrompt}>
                  <Ionicons name="globe-outline" size={14} color="#666" />
                  <Text style={styles.selectOrgText}>Select where to post</Text>
                </View>
              )}
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
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
            <Text style={styles.modalTitle}>Select Organization</Text>
            <TouchableOpacity onPress={() => setShowOrgPicker(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={organizations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.orgItem,
                  selectedOrg?.id === item.id && styles.orgItemSelected,
                ]}
                onPress={() => {
                  setSelectedOrg(item);
                  setShowOrgPicker(false);
                }}
              >
                <View style={styles.orgItemContent}>
                  {item.logo ? (
                    <Image source={{ uri: item.logo }} style={styles.orgLogo} />
                  ) : (
                    <View style={[styles.orgLogo, styles.orgLogoPlaceholder]}>
                      <Text style={styles.orgLogoText}>{item.name?.charAt(0)}</Text>
                    </View>
                  )}
                  <View style={styles.orgItemInfo}>
                    <Text style={styles.orgItemName}>{item.name}</Text>
                    <Text style={styles.orgItemLevel}>
                      {LEVEL_LABELS[item.level] || item.level}
                    </Text>
                  </View>
                </View>
                {selectedOrg?.id === item.id && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyOrgs}>
                <Text style={styles.emptyOrgsText}>No organizations found</Text>
                <Text style={styles.emptyOrgsSubtext}>
                  Join an organization to post to it
                </Text>
              </View>
            }
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
    marginBottom: 6,
  },
  orgSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  selectedOrgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  selectedOrgText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  selectOrgPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  selectOrgText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
    minHeight: 120,
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
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orgItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  orgItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgLogo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  orgLogoPlaceholder: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgLogoText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
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
});
