'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ListPageTemplateProps {
  title: string
  description?: string
  filters?: React.ReactNode
  children: React.ReactNode
  pagination?: React.ReactNode
  className?: string
}

const ListPageTemplate: React.FC<ListPageTemplateProps> = ({
  title,
  description,
  filters,
  children,
  pagination,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2">{description}</p>
        )}
      </div>

      {filters && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {filters}
        </div>
      )}

      <div className="space-y-4">
        {children}
      </div>

      {pagination && (
        <div className="flex justify-center">
          {pagination}
        </div>
      )}
    </div>
  )
}

ListPageTemplate.displayName = 'ListPageTemplate'

export { ListPageTemplate }
