'use client'

import * as React from 'react'
import Link from 'next/link'
import { Building2, Users, MapPin, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/atoms'
import { Badge } from '@/atoms'
import { Avatar, AvatarFallback, AvatarImage } from '@/atoms'
import { StatusBadge } from '@/molecules'
import { OrgLevel } from '@mobilizer/shared'

export interface Organization {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  level: OrgLevel | string
  memberCount?: number
  isActive: boolean
  isVerified?: boolean
  movementId?: string
  country?: { id: string; name: string } | null
  state?: { id: string; name: string } | null
  lga?: { id: string; name: string } | null
  ward?: { id: string; name: string } | null
  pollingUnit?: { id: string; name: string } | null
  createdAt: string
}

export interface OrgCardProps {
  organization: Organization
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  href?: string
}

const formatLevel = (level: string) => {
  return level.replace('_', ' ').toUpperCase()
}

const formatLocation = (org: Organization): string => {
  const parts: string[] = []
  if (org.pollingUnit) parts.push(org.pollingUnit.name)
  if (org.ward) parts.push(org.ward.name)
  if (org.lga) parts.push(org.lga.name)
  if (org.state) parts.push(org.state.name)
  if (org.country) parts.push(org.country.name)
  return parts.length > 0 ? parts.join(', ') : 'No location'
}

const getOrgInitials = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function OrgCard({
  organization,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  href,
}: OrgCardProps) {
  const handleView = (e: React.MouseEvent) => {
    if (onView) {
      e.preventDefault()
      onView(organization.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    onEdit?.(organization.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    onDelete?.(organization.id)
  }

  const cardContent = (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Avatar className="h-16 w-16 rounded-lg">
            {organization.logo && <AvatarImage src={organization.logo} alt={organization.name} />}
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {organization.name}
              </h3>
              <p className="text-sm text-muted-foreground">@{organization.slug}</p>
            </div>
            <div className="flex flex-shrink-0 gap-1">
              <StatusBadge active={organization.isActive} />
              {organization.isVerified && (
                <Badge variant="default" className="text-xs">
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {organization.description && (
            <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
              {organization.description}
            </p>
          )}

          {/* Meta Information */}
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  {organization.memberCount || 0}
                </span>
                <span>members</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {formatLevel(organization.level)}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{formatLocation(organization)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="mt-4 flex gap-2 border-t border-border pt-4">
          {onView && (
            <Button variant="outline" size="sm" onClick={handleView} className="flex-1">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Button>
          )}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
