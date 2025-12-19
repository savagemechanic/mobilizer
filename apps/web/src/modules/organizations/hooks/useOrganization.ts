'use client'

import { useQuery, useMutation, ApolloError } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'
import {
  GET_ORGANIZATION,
  GET_SUPPORT_GROUPS,
  GET_MY_ORGANIZATIONS,
} from '@/lib/graphql/queries/admin'
import {
  CREATE_ORGANIZATION,
  JOIN_ORGANIZATION,
  LEAVE_ORGANIZATION,
} from '@/lib/graphql/mutations/organizations'

export interface UseOrganizationOptions {
  onSuccess?: () => void
  onError?: (error: ApolloError) => void
}

/**
 * Hook to fetch a single organization by ID
 */
export function useOrganization(id: string) {
  const { data, loading, error, refetch } = useQuery(GET_ORGANIZATION, {
    variables: { id },
    skip: !id,
  })

  return {
    organization: data?.organization,
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to fetch organizations with filters
 */
export function useOrganizations(
  filter?: any,
  limit: number = 20,
  offset: number = 0
) {
  const { data, loading, error, refetch } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      filter,
      limit,
      offset,
    },
  })

  return {
    organizations: data?.organizations || [],
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to fetch organizations the current user has joined
 */
export function useMyOrganizations() {
  const { data, loading, error, refetch } = useQuery(GET_MY_ORGANIZATIONS)

  return {
    organizations: data?.myOrganizations || [],
    loading,
    error,
    refetch,
  }
}

/**
 * Hook to create a new organization
 */
export function useCreateOrganization(options?: UseOrganizationOptions) {
  const router = useRouter()

  const [createOrganization, { loading, error, data }] = useMutation(
    CREATE_ORGANIZATION,
    {
      onCompleted: (data) => {
        toast({
          title: 'Success',
          description: `Organization "${data.createOrganization.name}" created successfully`,
        })
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create organization',
          variant: 'destructive',
        })
        options?.onError?.(error)
      },
      refetchQueries: [GET_SUPPORT_GROUPS, GET_MY_ORGANIZATIONS],
    }
  )

  return {
    createOrganization,
    loading,
    error,
    data: data?.createOrganization,
  }
}

/**
 * Hook to join an organization
 */
export function useJoinOrganization(options?: UseOrganizationOptions) {
  const [joinOrganization, { loading, error }] = useMutation(JOIN_ORGANIZATION, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Successfully joined organization',
      })
      options?.onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to join organization',
        variant: 'destructive',
      })
      options?.onError?.(error)
    },
    refetchQueries: [GET_MY_ORGANIZATIONS],
  })

  return {
    joinOrganization: (orgId: string) =>
      joinOrganization({ variables: { orgId } }),
    loading,
    error,
  }
}

/**
 * Hook to leave an organization
 */
export function useLeaveOrganization(options?: UseOrganizationOptions) {
  const [leaveOrganization, { loading, error }] = useMutation(
    LEAVE_ORGANIZATION,
    {
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Successfully left organization',
        })
        options?.onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to leave organization',
          variant: 'destructive',
        })
        options?.onError?.(error)
      },
      refetchQueries: [GET_MY_ORGANIZATIONS],
    }
  )

  return {
    leaveOrganization: (orgId: string) =>
      leaveOrganization({ variables: { orgId } }),
    loading,
    error,
  }
}

/**
 * Hook for common organization actions
 */
export function useOrganizationActions() {
  const router = useRouter()

  const handleView = (id: string) => {
    router.push(`/admin/orgs/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/admin/orgs/${id}?mode=edit`)
  }

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`
      )
    ) {
      // TODO: Implement delete mutation when backend is ready
      toast({
        title: 'Not Implemented',
        description: 'Delete functionality not yet implemented',
        variant: 'destructive',
      })
    }
  }

  const handleCreate = () => {
    router.push('/admin/orgs/create')
  }

  return {
    handleView,
    handleEdit,
    handleDelete,
    handleCreate,
  }
}
