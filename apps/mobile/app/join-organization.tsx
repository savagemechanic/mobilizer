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
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_ORGANIZATION_BY_CODE, GET_MY_ORGANIZATIONS, GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { JOIN_ORGANIZATION_BY_CODE } from '@/lib/graphql/mutations/organizations';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import type { Organization } from '@/types';
import { useQuery } from '@apollo/client';

// Debug: show current user info
const DEBUG_MODE = __DEV__;

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
  const isOnboarding = onboarding === 'true';
  const [code, setCode] = useState('');
  const [previewOrg, setPreviewOrg] = useState<Organization | null>(null);
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuthStore();

  console.log('🔐 JoinOrg: Auth state:', { isAuthenticated, authLoading, user: user?.email });

  // Query user's organizations to check membership
  const { data: myOrgsData, loading: myOrgsLoading } = useQuery(GET_MY_ORGANIZATIONS, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network', // Ensure we get latest data
  });

  // Check if preview org is already joined
  const isAlreadyMember = React.useMemo(() => {
    if (!previewOrg || !myOrgsData?.myOrganizations) return false;
    const result = myOrgsData.myOrganizations.some((org: any) => org.id === previewOrg.id);
    console.log('🔍 Membership check:', { previewOrgId: previewOrg.id, orgs: myOrgsData.myOrganizations.map((o: any) => o.id), isAlreadyMember: result });
    return result;
  }, [previewOrg, myOrgsData]);

  // Only authenticated users can access this page
  // Redirect to welcome screen if not logged in
  if (!authLoading && !isAuthenticated) {
    console.log('🔐 JoinOrg: Not authenticated, redirecting to welcome');
    return <Redirect href="/" />;
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

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
    refetchQueries: [{ query: GET_MY_ORGANIZATIONS }, { query: GET_ORGANIZATIONS_FOR_SELECTOR }],
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
              text: 'Go to Group',
              onPress: () => router.replace('/(tabs)'),
            },
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
    Keyboard.dismiss();
    if (code.length < 3) {
      Alert.alert('Invalid Code', 'Please enter a valid 3-character invite code.');
      return;
    }
    lookupOrg({ variables: { code } });
  }, [code, lookupOrg]);

  // Handle join
  const handleJoin = useCallback(() => {
    if (!code) return;
    joinByCode({ variables: { code } });
  }, [code, joinByCode]);

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
        {/* User info and logout option */}
        {user && (
          <View style={styles.userInfo}>
            <Text style={styles.userInfoText}>
              Logged in as {user.email || user.displayName || 'User'}
            </Text>
            <TouchableOpacity onPress={logout}>
              <Text style={styles.logoutLink}>Not you? Logout</Text>
            </TouchableOpacity>
          </View>
        )}

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
            placeholder="ABC"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={3}
            textAlign="center"
          />
          <Button
            title="Look Up"
            onPress={handleLookup}
            variant="secondary"
            loading={lookingUp}
            disabled={code.length < 3}
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

            {myOrgsLoading ? (
              <View style={styles.loadingMembershipContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingMembershipText}>Checking membership...</Text>
              </View>
            ) : isAlreadyMember ? (
              <View style={styles.alreadyMemberContainer}>
                <View style={styles.alreadyMemberBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.alreadyMemberText}>Already a Member</Text>
                </View>
                <Button
                  title="View Organization"
                  onPress={() => router.replace(`/organization/${previewOrg.slug || previewOrg.id}`)}
                  variant="secondary"
                  fullWidth
                  style={styles.joinButton}
                />
              </View>
            ) : (
              <Button
                title="Join Organization"
                onPress={handleJoin}
                variant="primary"
                loading={joining}
                fullWidth
                style={styles.joinButton}
              />
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  logoutLink: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
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
  alreadyMemberContainer: {
    gap: 12,
  },
  alreadyMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#E8F8ED',
    borderRadius: 8,
  },
  alreadyMemberText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#34C759',
  },
  loadingMembershipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingMembershipText: {
    fontSize: 14,
    color: '#666',
  },
});
