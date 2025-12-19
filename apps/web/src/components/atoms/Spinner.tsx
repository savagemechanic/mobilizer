import { cn } from '@/lib/utils'

export interface SpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <div className={cn('flex justify-center items-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-b-primary border-transparent',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

// Alias for backward compatibility
export const LoadingSpinner = Spinner
