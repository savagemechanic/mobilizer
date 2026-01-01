import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  level: string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrg: Organization | null;
  onSelect: (org: Organization | null) => void;
}

export function OrganizationSelector({
  organizations,
  selectedOrg,
  onSelect,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = (org: Organization | null) => {
    onSelect(org);
    setModalVisible(false);
  };

  const handleJoinByCode = () => {
    setModalVisible(false);
    router.push('/join-organization');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {selectedOrg ? (
          <>
            <Avatar uri={selectedOrg.logo} name={selectedOrg.name} size={24} />
            <Text style={styles.selectedText} numberOfLines={1}>
              {selectedOrg.name}
            </Text>
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

          <FlatList
            data={[null, ...organizations]}
            keyExtractor={(item) => item?.id || 'all'}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.orgItem,
                  (item?.id === selectedOrg?.id || (!item && !selectedOrg)) &&
                    styles.orgItemSelected,
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                {item ? (
                  <>
                    <Avatar uri={item.logo} name={item.name} size={44} />
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>{item.name}</Text>
                      <Text style={styles.orgLevel}>{item.level}</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.allIcon}>
                      <Ionicons name="globe-outline" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.orgInfo}>
                      <Text style={styles.orgName}>All Organizations</Text>
                      <Text style={styles.orgLevel}>See posts from all your groups</Text>
                    </View>
                  </>
                )}
                {(item?.id === selectedOrg?.id || (!item && !selectedOrg)) && (
                  <Ionicons name="checkmark" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No organizations joined yet</Text>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.joinByCodeButton}
                onPress={handleJoinByCode}
                activeOpacity={0.7}
              >
                <View style={styles.joinByCodeIcon}>
                  <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
                </View>
                <View style={styles.orgInfo}>
                  <Text style={styles.joinByCodeTitle}>Join by Code</Text>
                  <Text style={styles.orgLevel}>Enter an invite code to join</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            }
          />
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
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  orgLevel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  allIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  joinByCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  joinByCodeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinByCodeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
});
