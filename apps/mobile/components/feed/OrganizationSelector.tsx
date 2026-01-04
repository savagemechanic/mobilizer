import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@apollo/client';
import { Avatar } from '@/components/ui';
import { GET_ORGANIZATIONS_FOR_SELECTOR } from '@/lib/graphql/queries/organizations';
import { OrganizationsForSelector, Organization } from '@/types';

// Special selection types
type SelectionType = 'org' | 'all' | 'public';

interface Selection {
  type: SelectionType;
  org?: Organization;
}

interface OrganizationSelectorProps {
  selectedOrg: Organization | null;
  selectedType: SelectionType;
  onSelect: (org: Organization | null, type: SelectionType) => void;
}

export function OrganizationSelector({
  selectedOrg,
  selectedType,
  onSelect,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading } = useQuery<{
    myOrganizationsForSelector: OrganizationsForSelector;
  }>(GET_ORGANIZATIONS_FOR_SELECTOR);

  const selectorData = data?.myOrganizationsForSelector;
  const organizations = selectorData?.organizations || [];
  const publicOrg = selectorData?.publicOrg;
  const publicOrgEnabled = selectorData?.publicOrgEnabled ?? false;
  const showAllOrgsOption = selectorData?.showAllOrgsOption ?? false;

  const handleSelectOrg = (org: Organization) => {
    onSelect(org, 'org');
    setModalVisible(false);
  };

  const handleSelectAll = () => {
    onSelect(null, 'all');
    setModalVisible(false);
  };

  const handleSelectPublic = () => {
    if (publicOrg) {
      onSelect(publicOrg, 'public');
    }
    setModalVisible(false);
  };

  const handleJoinByCode = () => {
    setModalVisible(false);
    router.push('/join-organization');
  };

  const getDisplayLabel = () => {
    if (selectedType === 'all') {
      return 'All Organizations';
    }
    if (selectedType === 'public' && publicOrg) {
      return 'Public';
    }
    if (selectedOrg) {
      return selectedOrg.name;
    }
    return 'Select Organization';
  };

  const truncateDescription = (desc?: string) => {
    if (!desc) return '';
    return desc.length > 40 ? `${desc.substring(0, 40)}...` : desc;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedType === 'org' && selectedOrg ? (
          <>
            <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={24} />
            <Text style={styles.selectedText} numberOfLines={1}>
              {selectedOrg.name}
            </Text>
          </>
        ) : selectedType === 'public' ? (
          <>
            <Ionicons name="people-outline" size={20} color="#34C759" />
            <Text style={styles.publicText}>Public</Text>
          </>
        ) : (
          <>
            <Ionicons name="globe-outline" size={20} color="#007AFF" />
            <Text style={styles.allText}>All Organizations</Text>
          </>
        )}
        <Ionicons name="chevron-down" size={18} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Organization</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* User's Organizations (sorted by joinedAt DESC) */}
              {organizations.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Your Organizations</Text>
                  {organizations.map((org) => (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        styles.orgItem,
                        selectedType === 'org' &&
                          selectedOrg?.id === org.id &&
                          styles.orgItemSelected,
                      ]}
                      onPress={() => handleSelectOrg(org)}
                      activeOpacity={0.7}
                    >
                      <Avatar uri={org.logo} name={org.name} size={44} />
                      <View style={styles.orgInfo}>
                        <Text style={styles.orgName}>{org.name}</Text>
                        <Text style={styles.orgDescription} numberOfLines={1}>
                          {truncateDescription(org.description) || org.level}
                        </Text>
                      </View>
                      {selectedType === 'org' && selectedOrg?.id === org.id && (
                        <Ionicons name="checkmark" size={24} color="#007AFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* All Organizations Option - Only show if user has 2+ orgs */}
              {showAllOrgsOption && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[
                      styles.orgItem,
                      selectedType === 'all' && styles.orgItemSelected,
                    ]}
                    onPress={handleSelectAll}
                    activeOpacity={0.7}
                  >
                    <View style={styles.iconContainer}>
                      <Ionicons name="globe-outline" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>All Organizations</Text>
                      <Text style={styles.orgDescription}>
                        See posts from all your groups
                      </Text>
                    </View>
                    {selectedType === 'all' && (
                      <Ionicons name="checkmark" size={24} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Public Organization - show if publicOrgEnabled and publicOrg exists */}
              {publicOrgEnabled && publicOrg && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[
                      styles.orgItem,
                      selectedType === 'public' && styles.orgItemSelected,
                    ]}
                    onPress={handleSelectPublic}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconContainer, styles.publicIconContainer]}>
                      <Ionicons name="people-outline" size={24} color="#34C759" />
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>Public</Text>
                      <Text style={styles.orgDescription}>
                        See conversations by the public in your locations
                      </Text>
                    </View>
                    {selectedType === 'public' && (
                      <Ionicons name="checkmark" size={24} color="#34C759" />
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* Join by Code */}
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.joinByCodeButton}
                onPress={handleJoinByCode}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.orgInfo}>
                  <Text style={styles.joinByCodeTitle}>Join by Code</Text>
                  <Text style={styles.orgDescription}>
                    Enter an invite code to join
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {/* Empty state */}
              {organizations.length === 0 && !publicOrgEnabled && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No organizations joined yet</Text>
                  <Text style={styles.emptySubtext}>
                    Join an organization using an invite code
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
    marginRight: 4,
    flex: 1,
  },
  allText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
    marginRight: 4,
  },
  publicText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34C759',
    marginLeft: 6,
    marginRight: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  orgItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  orgInfo: {
    flex: 1,
    marginLeft: 12,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  orgDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  publicIconContainer: {
    backgroundColor: '#E8F9ED',
  },
  divider: {
    height: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  joinByCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  joinByCodeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});
