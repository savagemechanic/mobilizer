'use client'

import * as React from 'react'
import { Crown, Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/ui/sheet'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

export interface MobileMenuSheetProps {
  variant?: 'admin' | 'platform-admin' | 'user'
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export const MobileMenuSheet: React.FC<MobileMenuSheetProps> = ({
  variant = 'user',
  children,
  open,
  onOpenChange,
  className,
}) => {
  const isPlatformVariant = variant === 'platform-admin'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'md:hidden',
            isPlatformVariant && 'text-white hover:bg-indigo-800',
            className
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={cn(
          'w-72 p-0',
          isPlatformVariant
            ? 'bg-gradient-to-b from-indigo-900 to-purple-900 text-white border-indigo-700'
            : variant === 'admin'
            ? 'bg-slate-900 text-white border-slate-700'
            : 'bg-background border-border'
        )}
      >
        <SheetHeader
          className={cn(
            'p-4 border-b',
            isPlatformVariant
              ? 'border-slate-700/50'
              : variant === 'admin'
              ? 'border-slate-700/50'
              : 'border-border'
          )}
        >
          <SheetTitle
            className={cn(
              'flex items-center gap-2',
              variant === 'admin' || isPlatformVariant ? 'text-white' : 'text-foreground'
            )}
          >
            {isPlatformVariant ? (
              <>
                <Crown className="h-5 w-5 text-yellow-400" />
                Platform Admin
              </>
            ) : variant === 'admin' ? (
              'Admin Panel'
            ) : (
              'Menu'
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">{children}</div>
      </SheetContent>
    </Sheet>
  )
}

MobileMenuSheet.displayName = 'MobileMenuSheet'
