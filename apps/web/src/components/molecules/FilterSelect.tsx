'use client'

import * as React from 'react'
import { Label } from '@/atoms'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterSelectProps {
  label?: string
  options: FilterOption[]
  value: string
  onChange?: (value: string) => void
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onValueChange,
  placeholder = 'Select an option',
  className,
}) => {
  const handleChange = onValueChange || onChange || (() => {})

  return (
    <div className={className}>
      {label && <Label className="mb-2">{label}</Label>}
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

FilterSelect.displayName = 'FilterSelect'

export { FilterSelect }
