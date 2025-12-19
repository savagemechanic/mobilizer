'use client'

import * as React from 'react'
import { Input, InputProps } from '@/atoms'
import { Label } from '@/atoms'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends Omit<InputProps, 'children'> {
  label: string
  name?: string
  error?: string
  required?: boolean
  children?: React.ReactNode
}

const FormField = React.forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, name, error, required, className, children, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {children ? (
          <>
            {children}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </>
        ) : (
          <>
            <Input
              id={name}
              name={name}
              ref={ref}
              className={cn(error && 'border-destructive', className)}
              {...props}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </>
        )}
      </div>
    )
  }
)

FormField.displayName = 'FormField'

export { FormField }
