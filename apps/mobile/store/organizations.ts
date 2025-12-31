import { create } from 'zustand';
import { Organization, OrgMembership } from '@/types';

interface OrganizationFilters {
  level?: string | null;
  search?: string | null;
  stateId?: string | null;
  lgaId?: string | null;
  wardId?: string | null;
}

interface OrganizationsState {
  // State
  organizations: Organization[];
  myOrganizations: Organization[];
  currentOrganization: Organization | null;
  filters: OrganizationFilters;
  offset: number;
  limit: number;
  hasMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Members
  members: OrgMembership[];
  membersOffset: number;
  membersLimit: number;
  membersHasMore: boolean;
  membersLoading: boolean;

  // Actions
  setOrganizations: (orgs: Organization[]) => void;
  addOrganizations: (orgs: Organization[], replace?: boolean) => void;
  setMyOrganizations: (orgs: Organization[]) => void;
  setCurrentOrganization: (org: Organization | null) => void;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => void;
  removeOrganization: (orgId: string) => void;

  setFilters: (filters: Partial<OrganizationFilters>) => void;
  clearFilters: () => void;

  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  incrementOffset: () => void;
  resetPagination: () => void;

  // Member actions
  setMembers: (members: OrgMembership[]) => void;
  addMembers: (members: OrgMembership[], replace?: boolean) => void;
  updateMember: (membershipId: string, updates: Partial<OrgMembership>) => void;
  removeMember: (membershipId: string) => void;
  setMembersLoading: (loading: boolean) => void;
  setMembersHasMore: (hasMore: boolean) => void;
  incrementMembersOffset: () => void;
  resetMembersPagination: () => void;

  // Membership actions
  optimisticJoin: (orgId: string) => void;
  optimisticLeave: (orgId: string) => void;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  // Initial state
  organizations: [],
  myOrganizations: [],
  currentOrganization: null,
  filters: {},
  offset: 0,
  limit: 20,
  hasMore: true,
  isLoading: false,
  isRefreshing: false,
  error: null,

  members: [],
  membersOffset: 0,
  membersLimit: 20,
  membersHasMore: true,
  membersLoading: false,

  // Set organizations (replace all)
  setOrganizations: (organizations: Organization[]) => {
    set({ organizations });
  },

  // Add organizations (append or replace)
  addOrganizations: (organizations: Organization[], replace = false) => {
    set((state) => ({
      organizations: replace ? organizations : [...state.organizations, ...organizations],
      hasMore: organizations.length === state.limit,
    }));
  },

  // Set my organizations
  setMyOrganizations: (myOrganizations: Organization[]) => {
    set({ myOrganizations });
  },

  // Set current organization
  setCurrentOrganization: (currentOrganization: Organization | null) => {
    set({ currentOrganization });
  },

  // Update organization by ID
  updateOrganization: (orgId: string, updates: Partial<Organization>) => {
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId ? { ...org, ...updates } : org
      ),
      myOrganizations: state.myOrganizations.map((org) =>
        org.id === orgId ? { ...org, ...updates } : org
      ),
      currentOrganization:
        state.currentOrganization?.id === orgId
          ? { ...state.currentOrganization, ...updates }
          : state.currentOrganization,
    }));
  },

  // Remove organization by ID
  removeOrganization: (orgId: string) => {
    set((state) => ({
      organizations: state.organizations.filter((org) => org.id !== orgId),
      myOrganizations: state.myOrganizations.filter((org) => org.id !== orgId),
    }));
  },

  // Set filters
  setFilters: (filters: Partial<OrganizationFilters>) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
  },

  // Clear filters
  clearFilters: () => {
    set({ filters: {} });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set refreshing state
  setRefreshing: (refreshing: boolean) => {
    set({ isRefreshing: refreshing });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Set hasMore flag
  setHasMore: (hasMore: boolean) => {
    set({ hasMore });
  },

  // Increment offset for pagination
  incrementOffset: () => {
    set((state) => ({
      offset: state.offset + state.limit,
    }));
  },

  // Reset pagination
  resetPagination: () => {
    set({
      organizations: [],
      offset: 0,
      hasMore: true,
      isLoading: false,
      isRefreshing: false,
      error: null,
    });
  },

  // Set members
  setMembers: (members: OrgMembership[]) => {
    set({ members });
  },

  // Add members (append or replace)
  addMembers: (members: OrgMembership[], replace = false) => {
    set((state) => ({
      members: replace ? members : [...state.members, ...members],
      membersHasMore: members.length === state.membersLimit,
    }));
  },

  // Update member
  updateMember: (membershipId: string, updates: Partial<OrgMembership>) => {
    set((state) => ({
      members: state.members.map((member) =>
        member.id === membershipId ? { ...member, ...updates } : member
      ),
    }));
  },

  // Remove member
  removeMember: (membershipId: string) => {
    set((state) => ({
      members: state.members.filter((member) => member.id !== membershipId),
    }));
  },

  // Set members loading
  setMembersLoading: (loading: boolean) => {
    set({ membersLoading: loading });
  },

  // Set members hasMore
  setMembersHasMore: (hasMore: boolean) => {
    set({ membersHasMore: hasMore });
  },

  // Increment members offset
  incrementMembersOffset: () => {
    set((state) => ({
      membersOffset: state.membersOffset + state.membersLimit,
    }));
  },

  // Reset members pagination
  resetMembersPagination: () => {
    set({
      members: [],
      membersOffset: 0,
      membersHasMore: true,
      membersLoading: false,
    });
  },

  // Optimistic join
  optimisticJoin: (orgId: string) => {
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? { ...org, memberCount: org.memberCount + 1 }
          : org
      ),
      currentOrganization:
        state.currentOrganization?.id === orgId
          ? {
              ...state.currentOrganization,
              memberCount: state.currentOrganization.memberCount + 1,
            }
          : state.currentOrganization,
    }));
  },

  // Optimistic leave
  optimisticLeave: (orgId: string) => {
    set((state) => ({
      organizations: state.organizations.map((org) =>
        org.id === orgId
          ? { ...org, memberCount: Math.max(0, org.memberCount - 1) }
          : org
      ),
      currentOrganization:
        state.currentOrganization?.id === orgId
          ? {
              ...state.currentOrganization,
              memberCount: Math.max(0, state.currentOrganization.memberCount - 1),
            }
          : state.currentOrganization,
      myOrganizations: state.myOrganizations.filter((org) => org.id !== orgId),
    }));
  },
}));
