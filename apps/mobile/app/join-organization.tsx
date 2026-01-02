import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_ORGANIZATION_BY_CODE, GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/organizations';
import { JOIN_ORGANIZATION_BY_CODE } from '@/lib/graphql/mutations/organizations';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import type { Organization } from '@/types';

const LEVEL_LABELS: Record<string, string> = {
  NATIONAL: 'National',
  STATE: 'State',
  LGA: 'LGA',
  WARD: 'Ward',
  POLLING_UNIT: 'Polling Unit',
};

const LEVEL_COLORS: Record<string, string> = {
  NATIONAL: '#FF6B6B',
  STATE: '#4ECDC4',
  LGA: '#45B7D1',
  WARD: '#FFA07A',
  POLLING_UNIT: '#98D8C8',
};

export default function JoinOrganizationScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [previewOrg, setPreviewOrg] = useState<Organization | null>(null);
  const { isAuthenticated } = useAuthStore();

  // Only force onboarding mode if user is authenticated and has no organizations
  // The onboarding=true param is set by useRequireOrganization hook
  const isOnboarding = onboarding === 'true' && isAuthenticated;

  // Query to lookup organization by code
  const [lookupOrg, { loading: lookingUp }] = useLazyQuery(GET_ORGANIZATION_BY_CODE, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.organizationByCode) {
        setPreviewOrg(data.organizationByCode);
      }
    },
    onError: (error) => {
      Alert.alert('Invalid Code', 'No organization found with this invite code.');
      setPreviewOrg(null);
    },
  });

  // Mutation to join by code
  const [joinByCode, { loading: joining }] = useMutation(JOIN_ORGANIZATION_BY_CODE, {
    refetchQueries: [{ query: GET_MY_ORGANIZATIONS }],
    onCompleted: (data) => {
      const org = data?.joinOrganizationByCode?.organization;

      if (isOnboarding) {
        // In onboarding mode, go directly to main app
        Alert.alert(
          'Welcome!',
          `You've joined ${org?.name || 'the organization'}. Let's get started!`,
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        // Normal mode - offer choice
        Alert.alert(
          'Joined Successfully',
          `You are now a member of ${org?.name || 'the organization'}!`,
          [
            {
              text: 'View Organization',
              onPress: () => router.replace(`/organization/${org?.slug}`),
            },
            {
              text: 'Go Back',
              onPress: () => router.back(),
              style: 'cancel',
            },
          ]
        );
      }
    },
    onError: (error) => {
      console.error('Join error:', error.message);
      let message = 'Failed to join organization. Please try again.';
      if (error.message.includes('Already a member')) {
        message = 'You are already a member of this organization.';
      } else if (error.message.includes('Unauthorized') || error.message.includes('UNAUTHENTICATED')) {
        message = 'Please log in to join an organization.';
      } else if (error.message.includes('Invalid invite code')) {
        message = 'Invalid invite code. Please check and try again.';
      }
      Alert.alert('Error', message);
    },
  });

  // Handle code input change
  const handleCodeChange = useCallback((text: string) => {
    // Convert to uppercase and remove non-alphanumeric characters
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(formatted);
    // Clear preview when code changes
    if (previewOrg) {
      setPreviewOrg(null);
    }
  }, [previewOrg]);

  // Handle lookup
  const handleLookup = useCallback(() => {
    if (code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter a valid invite code (at least 6 characters).');
      return;
    }
    lookupOrg({ variables: { code } });
  }, [code, lookupOrg]);

  // Handle join
  const handleJoin = useCallback(() => {
    if (!code) return;

    // Check if user is authenticated before attempting to join
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to log in to join an organization.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log In',
            onPress: () => router.push('/(auth)/login')
          },
        ]
      );
      return;
    }

    joinByCode({ variables: { code } });
  }, [code, joinByCode, isAuthenticated, router]);

  const levelLabel = previewOrg ? (LEVEL_LABELS[previewOrg.level] || previewOrg.level) : '';
  const levelColor = previewOrg ? (LEVEL_COLORS[previewOrg.level] || '#999') : '#999';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        {isOnboarding ? (
          <View style={styles.headerSpacer} />
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {isOnboarding ? 'Join a Support Group' : 'Join by Code'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="qr-code-outline" size={48} color="#007AFF" />
          <Text style={styles.instructionsTitle}>Enter Invite Code</Text>
          <Text style={styles.instructionsText}>
            Enter the invite code shared by an organization admin to join their group.
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            placeholder="ABCD1234"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={10}
            textAlign="center"
          />
          <Button
            title="Look Up"
            onPress={handleLookup}
            variant="secondary"
            loading={lookingUp}
            disabled={code.length < 6}
            style={styles.lookupButton}
          />
        </View>

        {/* Organization Preview */}
        {previewOrg && (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              {previewOrg.logo ? (
                <Image source={{ uri: previewOrg.logo }} style={styles.previewLogo} />
              ) : (
                <View style={[styles.previewLogoPlaceholder, { backgroundColor: levelColor }]}>
                  <Ionicons name="business-outline" size={24} color="#FFF" />
                </View>
              )}
              <View style={styles.previewInfo}>
                <Text style={styles.previewName}>{previewOrg.name}</Text>
                <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
                  <Text style={styles.levelText}>{levelLabel}</Text>
                </View>
              </View>
            </View>

            {previewOrg.description && (
              <Text style={styles.previewDescription} numberOfLines={3}>
                {previewOrg.description}
              </Text>
            )}

            <View style={styles.previewStats}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.previewStatText}>
                {previewOrg.memberCount.toLocaleString()} members
              </Text>
            </View>

            <Button
              title="Join Organization"
              onPress={handleJoin}
              variant="primary"
              loading={joining}
              fullWidth
              style={styles.joinButton}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: 24,
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 32,
  },
  instructionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  codeInput: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 4,
    color: '#000',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  lookupButton: {
    // Empty - default styling
  },
  previewCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
  },
  previewLogoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  previewDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  previewStatText: {
    fontSize: 14,
    color: '#666',
  },
  joinButton: {
    // Empty - default styling
  },
});
