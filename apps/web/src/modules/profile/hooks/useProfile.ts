'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { GET_USER } from '@/lib/graphql/queries/users'
import { UPDATE_PROFILE } from '@/lib/graphql/mutations/users'
import { useAuthStore } from '@/store/auth-store'

export interface UpdateProfileInput {
  firstName?: string
  lastName?: string
  middleName?: string
  displayName?: string
  phoneNumber?: string
  bio?: string
  address?: string
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY'
  avatar?: string
  countryId?: string
  stateId?: string
  lgaId?: string
  wardId?: string
  pollingUnitId?: string
}

export interface UseProfileOptions {
  userId?: string
  onUpdateSuccess?: () => void
  onUpdateError?: (error: Error) => void
}

export function useProfile(options?: UseProfileOptions) {
  const { userId, onUpdateSuccess, onUpdateError } = options || {}
  const currentUser = useAuthStore((state) => state.user)
  const updateAuthUser = useAuthStore((state) => state.updateUser)
  const [error, setError] = useState<string | null>(null)

  // Use current user ID if not provided
  const targetUserId = userId || currentUser?.id

  // Fetch user profile
  const {
    data,
    loading: isLoading,
    error: queryError,
    refetch,
  } = useQuery(GET_USER, {
    variables: { id: targetUserId },
    skip: !targetUserId,
  })

  // Update profile mutation
  const [updateProfileMutation, { loading: isUpdating }] = useMutation(
    UPDATE_PROFILE,
    {
      onCompleted: (data) => {
        setError(null)
        // If updating current user, update auth store
        if (data.updateProfile.id === currentUser?.id) {
          updateAuthUser(data.updateProfile)
        }
        onUpdateSuccess?.()
      },
      onError: (error) => {
        const errorMessage = error.message || 'Failed to update profile'
        setError(errorMessage)
        onUpdateError?.(error)
      },
    }
  )

  const updateProfile = async (input: UpdateProfileInput) => {
    setError(null)
    try {
      await updateProfileMutation({
        variables: { input },
      })
    } catch (err) {
      // Error handled by onError callback
      console.error('Update profile error:', err)
    }
  }

  const user = data?.user
  const isOwnProfile = user?.id === currentUser?.id

  return {
    user,
    isLoading,
    isUpdating,
    error: error || queryError?.message,
    isOwnProfile,
    updateProfile,
    refetch,
  }
}
