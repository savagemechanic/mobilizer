'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/atoms'
import { Button } from '@/atoms'
import { UserAvatar } from '@/molecules'
import { Card, CardContent, CardHeader } from '@/ui/card'
import { Badge } from '@/atoms'
import { formatDate } from '@mobilizer/shared'

export interface ProfileViewProps {
  user: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    middleName?: string | null
    displayName?: string | null
    avatar?: string | null
    bio?: string | null
    phoneNumber?: string | null
    address?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    isEmailVerified?: boolean
    isPlatformAdmin?: boolean
    createdAt?: string
  }
  isOwnProfile?: boolean
  onEdit?: () => void
  onFollow?: () => void
  onMessage?: () => void
}

export function ProfileView({
  user,
  isOwnProfile = false,
  onEdit,
  onFollow,
  onMessage,
}: ProfileViewProps) {
  const fullName = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(' ')
  const displayName = user.displayName || fullName || 'Anonymous User'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <UserAvatar
              src={user.avatar || undefined}
              alt={displayName}
              size="xl"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{fullName || displayName}</h1>
            {user.displayName && (
              <p className="text-muted-foreground">@{user.displayName}</p>
            )}
            <div className="flex items-center justify-center gap-2">
              {user.isEmailVerified && (
                <Badge variant="default">Verified</Badge>
              )}
              {user.isPlatformAdmin && (
                <Badge variant="secondary">Platform Admin</Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {user.bio}
              </p>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="grid gap-2 text-sm">
              {user.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span>{user.email}</span>
                </div>
              )}
              {user.phoneNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span>{user.phoneNumber}</span>
                </div>
              )}
              {user.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="text-right">{user.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Information */}
          {(user.dateOfBirth || user.gender) && (
            <div className="space-y-3">
              <h3 className="font-semibold">Personal Information</h3>
              <div className="grid gap-2 text-sm">
                {user.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span>{formatDate(user.dateOfBirth)}</span>
                  </div>
                )}
                {user.gender && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="capitalize">{user.gender.toLowerCase()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Member Since */}
          {user.createdAt && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Member since {formatDate(user.createdAt)}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            {isOwnProfile ? (
              <Button onClick={onEdit} className="flex-1">
                Edit Profile
              </Button>
            ) : (
              <>
                <Button onClick={onFollow} className="flex-1">
                  Follow
                </Button>
                <Button onClick={onMessage} variant="outline" className="flex-1">
                  Message
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
