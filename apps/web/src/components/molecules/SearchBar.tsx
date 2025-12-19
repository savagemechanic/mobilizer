'use client'

import * as React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/ui/input'
import { cn } from '@/lib/utils'

export interface SearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  className,
  onSearch,
}) => {
  const [query, setQuery] = React.useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    onSearch?.(value)
  }

  return (
    <div className={cn('relative max-w-md', className)}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-8"
      />
    </div>
  )
}

SearchBar.displayName = 'SearchBar'
