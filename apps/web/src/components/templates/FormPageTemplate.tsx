'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/atoms'
import { cn } from '@/lib/utils'

export interface FormPageTemplateProps {
  title: string
  backHref?: string
  children: React.ReactNode
  className?: string
}

const FormPageTemplate: React.FC<FormPageTemplateProps> = ({
  title,
  backHref,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-4">
        {backHref && (
          <Link href={backHref}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>

      <div className="max-w-2xl">
        {children}
      </div>
    </div>
  )
}

FormPageTemplate.displayName = 'FormPageTemplate'

export { FormPageTemplate }
