import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui';
import LocationPicker, { LocationValue } from '@/components/LocationPicker';
import { UPDATE_PROFILE } from '@/lib/graphql/mutations/users';
import { GET_PRESIGNED_UPLOAD_URL, CHECK_UPLOAD_CONFIGURED } from '@/lib/graphql/mutations/upload';
import { PROFESSIONS } from '@/types';
import { uploadImage, isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [middleName, setMiddleName] = useState(user?.middleName || '');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [showProfessionPicker, setShowProfessionPicker] = useState(false);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Location state - initialized from user data
  const initialLocation = useMemo<LocationValue>(() => ({
    stateId: user?.location?.state?.id,
    lgaId: user?.location?.lga?.id,
    wardId: user?.location?.ward?.id,
    pollingUnitId: user?.location?.pollingUnit?.id,
  }), [user]);

  const [location, setLocation] = useState<LocationValue>(initialLocation);

  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE, {
    onCompleted: (data) => {
      if (data?.updateProfile) {
        updateUser(data.updateProfile);
        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update profile');
    },
  });

  // Check if upload is configured (S3)
  const { data: uploadConfigData } = useQuery(CHECK_UPLOAD_CONFIGURED);
  const isS3Configured = uploadConfigData?.uploadConfigured ?? false;

  // Check if Firebase is configured
  const firebaseConfigured = isFirebaseConfigured();
  const isUploadConfigured = isS3Configured || firebaseConfigured;

  const [getPresignedUrl] = useMutation(GET_PRESIGNED_UPLOAD_URL);

  // Upload image - tries Firebase first, then S3
  const uploadImageToStorage = async (uri: string): Promise<string | null> => {
    // Try Firebase first if configured
    if (firebaseConfigured && user?.id) {
      try {
        initializeFirebase();
        const fileName = uri.split('/').pop() || 'avatar.jpg';
        const url = await uploadImage(uri, 'avatar', user.id, fileName);
        return url;
      } catch (error) {
        console.error('Firebase upload error, falling back to S3:', error);
        // Fall through to S3
      }
    }

    // Try S3 if configured
    if (isS3Configured) {
      try {
        const fileName = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';

        const { data } = await getPresignedUrl({
          variables: {
            type: 'avatar',
            fileName,
            contentType: fileType,
          },
        });

        if (!data?.getPresignedUploadUrl) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, fileUrl } = data.getPresignedUploadUrl;

        const response = await fetch(uri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': fileType,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        return fileUrl;
      } catch (error) {
        console.error('S3 upload error:', error);
        return null;
      }
    }

    console.error('No upload service configured');
    return null;
  };

  const handleLocationChange = (newLocation: LocationValue) => {
    setLocation(newLocation);
  };

  // Handle change photo
  const handleChangePhoto = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            launchCamera();
          } else if (buttonIndex === 1) {
            launchLibrary();
          }
        }
      );
    } else {
      // Android: Show Alert as ActionSheet alternative
      Alert.alert('Change Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: launchCamera },
        { text: 'Choose from Library', onPress: launchLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const launchCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Camera access is required to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const launchLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Photo library access is required to choose a photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setNewAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const input: any = {};

    if (firstName !== user?.firstName) input.firstName = firstName;
    if (lastName !== user?.lastName) input.lastName = lastName;
    if (middleName !== user?.middleName) input.middleName = middleName;
    if (displayName !== user?.displayName) input.displayName = displayName;
    if (bio !== user?.bio) input.bio = bio;
    if (phoneNumber !== user?.phoneNumber) input.phoneNumber = phoneNumber;
    if (profession !== user?.profession) input.profession = profession;

    // Add location fields if changed
    if (location.stateId) input.stateId = location.stateId;
    if (location.lgaId) input.lgaId = location.lgaId;
    if (location.wardId) input.wardId = location.wardId;
    if (location.pollingUnitId) input.pollingUnitId = location.pollingUnitId;

    // Handle new avatar if selected
    if (newAvatarUri) {
      if (isUploadConfigured) {
        setUploadingPhoto(true);
        try {
          const avatarUrl = await uploadImageToStorage(newAvatarUri);
          if (avatarUrl) {
            input.avatar = avatarUrl;
          } else {
            Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
            setUploadingPhoto(false);
            return;
          }
        } catch (error) {
          Alert.alert('Upload Error', 'Failed to upload photo.');
          setUploadingPhoto(false);
          return;
        }
        setUploadingPhoto(false);
      } else {
        Alert.alert(
          'Upload Not Available',
          'Photo upload is not configured. Your other profile changes will be saved.',
          [{ text: 'OK' }]
        );
      }
    }

    if (Object.keys(input).length === 0) {
      Alert.alert('No Changes', 'No changes were made to your profile');
      return;
    }

    updateProfile({ variables: { input } });
  };

  const userName = user?.displayName || `${user?.firstName} ${user?.lastName}`.trim() || 'User';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar uri={newAvatarUri || user?.avatar} name={userName} size={100} />
          <TouchableOpacity
            style={styles.changePhotoButton}
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.changePhotoText}>Change Photo</Text>
            )}
          </TouchableOpacity>
          {newAvatarUri && (
            <TouchableOpacity
              style={styles.removePhotoButton}
              onPress={() => setNewAvatarUri(null)}
            >
              <Text style={styles.removePhotoText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Middle Name</Text>
            <TextInput
              style={styles.input}
              value={middleName}
              onChangeText={setMiddleName}
              placeholder="Enter middle name (optional)"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Enter display name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Profession</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProfessionPicker(true)}
              disabled={loading}
            >
              <Text style={[styles.pickerButtonText, !profession && styles.placeholderText]}>
                {profession || 'Select your profession'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={user?.email}
              editable={false}
            />
            <Text style={styles.helpText}>Email cannot be changed</Text>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Location</Text>
          <LocationPicker
            value={initialLocation}
            onChange={handleLocationChange}
            disabled={loading}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Profession Picker Modal */}
      <Modal
        visible={showProfessionPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowProfessionPicker(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Profession</Text>
            <TouchableOpacity onPress={() => setShowProfessionPicker(false)}>
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PROFESSIONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.professionItem,
                  profession === item && styles.professionItemSelected,
                ]}
                onPress={() => {
                  setProfession(item);
                  setShowProfessionPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.professionItemText,
                    profession === item && styles.professionItemTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {profession === item && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  saveButton: {
    padding: 4,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  changePhotoButton: {
    marginTop: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  removePhotoButton: {
    marginTop: 8,
  },
  removePhotoText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
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
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#000',
  },
  placeholderText: {
    color: '#999',
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
  professionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  professionItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  professionItemText: {
    fontSize: 16,
    color: '#333',
  },
  professionItemTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
