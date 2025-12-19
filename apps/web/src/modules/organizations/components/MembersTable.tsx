'use client'

import * as React from 'react'
import { Shield, Crown, MoreVertical, UserCog, UserMinus } from 'lucide-react'
import { Badge } from '@/atoms'
import { Button } from '@/atoms'
import { UserAvatar } from '@/molecules'
import { RoleBadge } from '@/molecules'
import { StatusBadge } from '@/molecules'
import { DataTable } from '@/organisms'
import { Pagination } from '@/organisms'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'

export interface MemberUser {
  id: string
  firstName?: string
  lastName?: string
  displayName?: string | null
  email: string
  avatar?: string | null
  state?: { id: string; name: string } | null
  lga?: { id: string; name: string } | null
  ward?: { id: string; name: string } | null
  pollingUnit?: { id: string; name: string } | null
}

export interface OrgMembership {
  id: string
  userId: string
  orgId: string
  isAdmin: boolean
  isActive: boolean
  isLeader?: boolean
  leaderLevel?: string | null
  leaderState?: { id: string; name: string } | null
  leaderLga?: { id: string; name: string } | null
  leaderWard?: { id: string; name: string } | null
  leaderPollingUnit?: { id: string; name: string } | null
  joinedAt: string
  approvedAt?: string | null
  user: MemberUser
}

export interface MembersTableProps {
  members: OrgMembership[]
  loading?: boolean
  error?: string | null
  onMakeLeader?: (membership: OrgMembership) => void
  onRemoveLeader?: (membership: OrgMembership) => void
  onMakeAdmin?: (membership: OrgMembership) => void
  onRemoveAdmin?: (membership: OrgMembership) => void
  onRemoveMember?: (membership: OrgMembership) => void
  // Pagination
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  // Empty state
  emptyMessage?: string
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const getLeaderBadge = (membership: OrgMembership) => {
  if (!membership.isLeader || !membership.leaderLevel) return null

  let location = ''
  switch (membership.leaderLevel) {
    case 'STATE':
      location = membership.leaderState?.name || 'State'
      break
    case 'LGA':
      location = membership.leaderLga?.name || 'LGA'
      break
    case 'WARD':
      location = membership.leaderWard?.name || 'Ward'
      break
    case 'POLLING_UNIT':
      location = membership.leaderPollingUnit?.name || 'PU'
      break
  }

  return (
    <Badge variant="default" className="bg-purple-600 text-white">
      <Crown className="mr-1 h-3 w-3" />
      {membership.leaderLevel.replace('_', ' ')} Leader
      {location && ` - ${location}`}
    </Badge>
  )
}

export function MembersTable({
  members,
  loading = false,
  error = null,
  onMakeLeader,
  onRemoveLeader,
  onMakeAdmin,
  onRemoveAdmin,
  onRemoveMember,
  currentPage = 1,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  emptyMessage = 'No members found',
}: MembersTableProps) {
  const columns = [
    {
      key: 'user',
      header: 'Member',
      render: (membership: OrgMembership) => {
        const user = membership.user
        const displayName =
          user.displayName ||
          (user.firstName || user.lastName
            ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
            : 'Unknown User')

        return (
          <div className="flex items-center gap-3">
            <UserAvatar
              src={user.avatar || undefined}
              name={displayName}
              size="md"
            />
            <div className="min-w-0">
              <p className="truncate font-medium">{displayName}</p>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'role',
      header: 'Role',
      render: (membership: OrgMembership) => (
        <div className="flex flex-col gap-1">
          <RoleBadge
            role={membership.isAdmin ? 'admin' : 'member'}
          />
          {getLeaderBadge(membership)}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (membership: OrgMembership) => (
        <StatusBadge active={membership.isActive} />
      ),
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      render: (membership: OrgMembership) => (
        <span className="text-sm text-muted-foreground">{formatDate(membership.joinedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (membership: OrgMembership) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Leader Actions */}
            {onMakeLeader && !membership.isLeader && (
              <DropdownMenuItem onClick={() => onMakeLeader(membership)}>
                <Crown className="mr-2 h-4 w-4" />
                Make Leader
              </DropdownMenuItem>
            )}
            {onRemoveLeader && membership.isLeader && (
              <DropdownMenuItem
                onClick={() => onRemoveLeader(membership)}
                className="text-destructive"
              >
                <Crown className="mr-2 h-4 w-4" />
                Remove Leader
              </DropdownMenuItem>
            )}

            {/* Admin Actions */}
            {(onMakeAdmin || onRemoveAdmin) && <DropdownMenuSeparator />}
            {onMakeAdmin && !membership.isAdmin && (
              <DropdownMenuItem onClick={() => onMakeAdmin(membership)}>
                <UserCog className="mr-2 h-4 w-4" />
                Make Admin
              </DropdownMenuItem>
            )}
            {onRemoveAdmin && membership.isAdmin && (
              <DropdownMenuItem
                onClick={() => onRemoveAdmin(membership)}
                className="text-destructive"
              >
                <UserCog className="mr-2 h-4 w-4" />
                Remove Admin
              </DropdownMenuItem>
            )}

            {/* Remove Member */}
            {onRemoveMember && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onRemoveMember(membership)}
                  className="text-destructive"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove Member
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={members}
        isLoading={loading}
        emptyMessage={emptyMessage}
      />

      {/* Pagination */}
      {onPageChange && totalPages && members.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
