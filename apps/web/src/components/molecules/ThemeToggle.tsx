'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/ui/button'
import { cn } from '@/lib/utils'

export interface ThemeToggleProps {
  variant?: 'admin' | 'platform-admin' | 'user'
  className?: string
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'user', className }) => {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    // Check initial theme from document
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const isPlatformVariant = variant === 'platform-admin'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        isPlatformVariant && 'text-indigo-200 hover:text-white hover:bg-indigo-800',
        className
      )}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

ThemeToggle.displayName = 'ThemeToggle'
