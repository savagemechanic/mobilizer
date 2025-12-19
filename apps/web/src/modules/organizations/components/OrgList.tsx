'use client'

import * as React from 'react'
import { OrgCard, Organization } from './OrgCard'
import { Pagination } from '@/organisms'
import { Spinner } from '@/atoms'
import { AlertCircle } from 'lucide-react'

export interface OrgListProps {
  organizations: Organization[]
  loading?: boolean
  error?: string | null
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showActions?: boolean
  // Pagination props
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  // Grid layout
  columns?: 1 | 2 | 3 | 4
  // Empty state
  emptyMessage?: string
}

export function OrgList({
  organizations,
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  currentPage = 1,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  columns = 3,
  emptyMessage = 'No organizations found',
}: OrgListProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 h-8 w-8" />
          <p className="text-sm text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-foreground">Error Loading Organizations</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (organizations.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">No Organizations</h3>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  // Grid column classes
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }[columns]

  return (
    <div className="space-y-6">
      {/* Organizations Grid */}
      <div className={`grid gap-6 ${gridColsClass}`}>
        {organizations.map((org) => (
          <OrgCard
            key={org.id}
            organization={org}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Pagination */}
      {onPageChange && totalPages && (
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
