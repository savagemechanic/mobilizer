'use client'

import { useState } from 'react'
import { useQuery, useMutation, ApolloError } from '@apollo/client'
import { toast } from '@/hooks/use-toast'
import { GET_ORG_MEMBERS } from '@/lib/graphql/queries/admin'
import {
  UPDATE_MEMBER_ROLE,
  MAKE_LEADER,
  REMOVE_LEADER,
} from '@/lib/graphql/mutations/organizations'
import { OrgMembership } from '../components/MembersTable'

export interface UseMembersOptions {
  orgId: string
  search?: string
  isAdmin?: boolean
  limit?: number
  offset?: number
}

export interface UseMemberActionsOptions {
  onSuccess?: () => void
  onError?: (error: ApolloError) => void
}

/**
 * Hook to fetch organization members
 */
export function useMembers({
  orgId,
  search,
  isAdmin,
  limit = 10,
  offset = 0,
}: UseMembersOptions) {
  const { data, loading, error, refetch } = useQuery(GET_ORG_MEMBERS, {
    variables: {
      orgId,
      search,
      isAdmin,
      limit,
      offset,
    },
    skip: !orgId,
  })

  return {
    members: data?.getOrgMembers || [],
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to manage member role (admin/member)
 */
export function useUpdateMemberRole(options?: UseMemberActionsOptions) {
  const [updateMemberRole, { loading, error }] = useMutation(UPDATE_MEMBER_ROLE, {
    onCompleted: (data) => {
      const newRole = data.updateMemberRole.isAdmin ? 'Admin' : 'Member'
      toast({
        title: 'Success',
        description: `Member role updated to ${newRole}`,
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member role',
        variant: 'destructive',
      })
      options?.onError?.(error)
    },
    refetchQueries: [GET_ORG_MEMBERS],
  })

  return {
    updateMemberRole: (membershipId: string, isAdmin: boolean) =>
      updateMemberRole({ variables: { membershipId, isAdmin } }),
    loading,
    error,
  }
}

/**
 * Hook to make a member a leader
 */
export function useMakeLeader(options?: UseMemberActionsOptions) {
  const [makeLeader, { loading, error }] = useMutation(MAKE_LEADER, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Member has been made a leader',
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign leader role',
        variant: 'destructive',
      })
      options?.onError?.(error)
    },
    refetchQueries: [GET_ORG_MEMBERS],
  })

  return {
    makeLeader: (input: any) => makeLeader({ variables: { input } }),
    loading,
    error,
  }
}

/**
 * Hook to remove leader status from a member
 */
export function useRemoveLeader(options?: UseMemberActionsOptions) {
  const [removeLeader, { loading, error }] = useMutation(REMOVE_LEADER, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Leader role removed',
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove leader role',
        variant: 'destructive',
      })
      options?.onError?.(error)
    },
    refetchQueries: [GET_ORG_MEMBERS],
  })

  return {
    removeLeader: (membershipId: string) =>
      removeLeader({ variables: { membershipId } }),
    loading,
    error,
  }
}

/**
 * Hook for common member actions with confirmation
 */
export function useMemberActions(options?: UseMemberActionsOptions) {
  const [makeLeaderModalOpen, setMakeLeaderModalOpen] = useState(false)
  const [selectedMembership, setSelectedMembership] = useState<OrgMembership | null>(null)

  const { updateMemberRole, loading: updatingRole } = useUpdateMemberRole(options)
  const { removeLeader, loading: removingLeader } = useRemoveLeader(options)

  const handleMakeLeader = (membership: OrgMembership) => {
    setSelectedMembership(membership)
    setMakeLeaderModalOpen(true)
  }

  const handleRemoveLeader = (membership: OrgMembership) => {
    const userName =
      membership.user.displayName ||
      `${membership.user.firstName} ${membership.user.lastName}`

    if (
      confirm(
        `Are you sure you want to remove leader status from ${userName}?`
      )
    ) {
      removeLeader(membership.id)
    }
  }

  const handleMakeAdmin = (membership: OrgMembership) => {
    const userName =
      membership.user.displayName ||
      `${membership.user.firstName} ${membership.user.lastName}`

    if (
      confirm(
        `Are you sure you want to make ${userName} an admin of this organization?`
      )
    ) {
      updateMemberRole(membership.id, true)
    }
  }

  const handleRemoveAdmin = (membership: OrgMembership) => {
    const userName =
      membership.user.displayName ||
      `${membership.user.firstName} ${membership.user.lastName}`

    if (
      confirm(
        `Are you sure you want to remove admin privileges from ${userName}?`
      )
    ) {
      updateMemberRole(membership.id, false)
    }
  }

  const handleRemoveMember = (membership: OrgMembership) => {
    const userName =
      membership.user.displayName ||
      `${membership.user.firstName} ${membership.user.lastName}`

    if (
      confirm(
        `Are you sure you want to remove ${userName} from this organization?`
      )
    ) {
      // TODO: Implement remove member mutation when backend is ready
      toast({
        title: 'Not Implemented',
        description: 'Remove member functionality not yet implemented',
        variant: 'destructive',
      })
    }
  }

  const closeMakeLeaderModal = () => {
    setMakeLeaderModalOpen(false)
    setSelectedMembership(null)
  }

  return {
    handleMakeLeader,
    handleRemoveLeader,
    handleMakeAdmin,
    handleRemoveAdmin,
    handleRemoveMember,
    // Modal state
    makeLeaderModalOpen,
    selectedMembership,
    closeMakeLeaderModal,
    // Loading states
    loading: updatingRole || removingLeader,
  }
}

/**
 * Hook to manage pagination for members list
 */
export function useMembersPagination(totalItems?: number, itemsPerPage: number = 10) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = totalItems ? Math.ceil(totalItems / itemsPerPage) : undefined
  const offset = (currentPage - 1) * itemsPerPage

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const resetPagination = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    offset,
    itemsPerPage,
    handlePageChange,
    resetPagination,
  }
}
