'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileView, useProfile } from '@/modules/profile'
import { LoadingSpinner } from '@/atoms'

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, isLoading, error, isOwnProfile } = useProfile({ userId: id })

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
        <p className="text-red-600">{error || 'Failed to load profile'}</p>
      </div>
    )
  }

  return (
    <ProfileView
      user={user}
      isOwnProfile={isOwnProfile}
      onEdit={() => router.push('/profile/edit')}
      onFollow={() => console.log('Follow user:', user.id)}
      onMessage={() => console.log('Message user:', user.id)}
    />
  )
}
