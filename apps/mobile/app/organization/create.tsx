import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui';
import LocationPicker, { LocationValue } from '@/components/LocationPicker';
import { CREATE_ORGANIZATION } from '@/lib/graphql/mutations/organizations';
import { GET_MOVEMENTS } from '@/lib/graphql/queries/movements';
import { GET_PRESIGNED_UPLOAD_URL } from '@/lib/graphql/mutations/upload';

const ORG_LEVELS = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'STATE', label: 'State' },
  { value: 'LGA', label: 'LGA' },
  { value: 'WARD', label: 'Ward' },
  { value: 'POLLING_UNIT', label: 'Polling Unit' },
];

export default function CreateOrganizationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('STATE');
  const [movementId, setMovementId] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationValue>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is admin
  const isAdmin = user?.isPlatformAdmin;

  // Fetch movements for selection
  const { data: movementsData, loading: movementsLoading } = useQuery(GET_MOVEMENTS, {
    skip: !isAdmin,
  });

  const movements = movementsData?.movements || [];

  const [createOrganization] = useMutation(CREATE_ORGANIZATION, {
    onCompleted: (data) => {
      Alert.alert('Success', 'Organization created successfully!', [
        {
          text: 'View Organization',
          onPress: () => router.replace(`/organization/${data.createOrganization.slug}`),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create organization');
      setIsSubmitting(false);
    },
  });

  const [getPresignedUrl] = useMutation(GET_PRESIGNED_UPLOAD_URL);

  // Upload logo to S3
  const uploadLogo = async (uri: string): Promise<string | null> => {
    try {
      const fileName = uri.split('/').pop() || 'logo.jpg';
      const match = /\.(\w+)$/.exec(fileName);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      const { data } = await getPresignedUrl({
        variables: {
          type: 'organization',
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
        throw new Error('Failed to upload logo');
      }

      return fileUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      return null;
    }
  };

  const handlePickLogo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Photo library access is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Organization name is required');
      return;
    }

    if (!movementId) {
      Alert.alert('Validation Error', 'Please select a movement');
      return;
    }

    setIsSubmitting(true);

    try {
      let logoUrl = null;
      if (logoUri) {
        logoUrl = await uploadLogo(logoUri);
      }

      const input: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        level,
        movementId,
        logo: logoUrl || undefined,
      };

      // Add location based on level
      if (location.stateId) input.stateId = location.stateId;
      if (location.lgaId) input.lgaId = location.lgaId;
      if (location.wardId) input.wardId = location.wardId;
      if (location.pollingUnitId) input.pollingUnitId = location.pollingUnitId;

      await createOrganization({ variables: { input } });
    } catch (error) {
      console.error('Submit error:', error);
      setIsSubmitting(false);
    }
  };

  // Only admins can access this screen
  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="lock-closed-outline" size={64} color="#CCC" />
        <Text style={styles.accessDeniedTitle}>Access Denied</Text>
        <Text style={styles.accessDeniedText}>
          Only platform administrators can create organizations.
        </Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          variant="primary"
          style={{ marginTop: 24 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Organization</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo Picker */}
        <View style={styles.logoSection}>
          <TouchableOpacity style={styles.logoPicker} onPress={handlePickLogo}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color="#666" />
                <Text style={styles.logoPickerText}>Add Logo</Text>
              </>
            )}
          </TouchableOpacity>
          {logoUri && (
            <TouchableOpacity onPress={() => setLogoUri(null)}>
              <Text style={styles.removeLogo}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter organization name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Movement Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Movement *</Text>
            {movementsLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <View style={styles.optionsGrid}>
                {movements.map((movement: any) => (
                  <TouchableOpacity
                    key={movement.id}
                    style={[
                      styles.optionButton,
                      movementId === movement.id && styles.optionButtonActive,
                    ]}
                    onPress={() => setMovementId(movement.id)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        movementId === movement.id && styles.optionTextActive,
                      ]}
                    >
                      {movement.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Level Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Level *</Text>
            <View style={styles.optionsGrid}>
              {ORG_LEVELS.map((lvl) => (
                <TouchableOpacity
                  key={lvl.value}
                  style={[
                    styles.optionButton,
                    level === lvl.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setLevel(lvl.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      level === lvl.value && styles.optionTextActive,
                    ]}
                  >
                    {lvl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Picker */}
          {level !== 'NATIONAL' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <LocationPicker
                value={location}
                onChange={setLocation}
                showState={level !== 'NATIONAL'}
                showLga={['LGA', 'WARD', 'POLLING_UNIT'].includes(level)}
                showWard={['WARD', 'POLLING_UNIT'].includes(level)}
                showPollingUnit={level === 'POLLING_UNIT'}
              />
            </View>
          )}
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Create Organization"
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  logoPicker: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
  },
  logoPickerText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  removeLogo: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
  },
  form: {
    paddingHorizontal: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  optionButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E5F0FF',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
  },
  optionTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submitSection: {
    padding: 16,
    paddingBottom: 32,
  },
});
