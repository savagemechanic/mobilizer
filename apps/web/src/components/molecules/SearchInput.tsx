'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Input, InputProps } from '@/atoms'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ placeholder = 'Search...', value, onChange, className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn('pl-9', className)}
          {...props}
        />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export { SearchInput }
