'use client'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { ProfileForm, useProfile } from '@/modules/profile'
import { LoadingSpinner } from '@/atoms'
import { useToast } from '@/hooks/use-toast'

export default function EditProfilePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()

  const { updateProfile, isUpdating, error } = useProfile({
    onUpdateSuccess: () => {
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
      router.push(`/profile/${user?.id}`)
    },
    onUpdateError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      })
    },
  })

  if (!user) {
    return (
      <div className="flex justify-center py-8">
        <p>Please log in to edit your profile</p>
      </div>
    )
  }

  return (
    <ProfileForm
      initialData={{
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        middleName: user.middleName || '',
        displayName: user.displayName || '',
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      }}
      onSubmit={updateProfile}
      onCancel={() => router.back()}
      isLoading={isUpdating}
      error={error || undefined}
    />
  )
}
