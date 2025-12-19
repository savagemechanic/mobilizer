'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/atoms'
import { Input } from '@/atoms'
import { Label } from '@/atoms'
import { OrgLevel } from '@mobilizer/shared'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'

// Form validation schema
const orgFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  movementId: z.string().min(1, 'Movement is required'),
  level: z.nativeEnum(OrgLevel, {
    errorMap: () => ({ message: 'Please select an organization level' }),
  }),
  logo: z.string().optional(),
  banner: z.string().optional(),
  countryId: z.string().optional(),
  stateId: z.string().optional(),
  lgaId: z.string().optional(),
  wardId: z.string().optional(),
  pollingUnitId: z.string().optional(),
})

export type OrgFormData = z.infer<typeof orgFormSchema>

export interface Movement {
  id: string
  name: string
}

export interface LocationOption {
  id: string
  name: string
}

export interface OrgFormProps {
  // Initial data for edit mode
  initialData?: Partial<OrgFormData>
  // Available options
  movements?: Movement[]
  countries?: LocationOption[]
  states?: LocationOption[]
  lgas?: LocationOption[]
  wards?: LocationOption[]
  pollingUnits?: LocationOption[]
  // Loading states
  movementsLoading?: boolean
  countriesLoading?: boolean
  statesLoading?: boolean
  lgasLoading?: boolean
  wardsLoading?: boolean
  pollingUnitsLoading?: boolean
  // Callbacks
  onSubmit: (data: OrgFormData) => void | Promise<void>
  onCancel?: () => void
  // Location handlers - called when location selects change
  onCountryChange?: (countryId: string) => void
  onStateChange?: (stateId: string) => void
  onLgaChange?: (lgaId: string) => void
  onWardChange?: (wardId: string) => void
  // State
  isSubmitting?: boolean
  submitLabel?: string
  cancelLabel?: string
  error?: string | null
}

export function OrgForm({
  initialData,
  movements = [],
  countries = [],
  states = [],
  lgas = [],
  wards = [],
  pollingUnits = [],
  movementsLoading = false,
  countriesLoading = false,
  statesLoading = false,
  lgasLoading = false,
  wardsLoading = false,
  pollingUnitsLoading = false,
  onSubmit,
  onCancel,
  onCountryChange,
  onStateChange,
  onLgaChange,
  onWardChange,
  isSubmitting = false,
  submitLabel = 'Create Organization',
  cancelLabel = 'Cancel',
  error,
}: OrgFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgFormData>({
    resolver: zodResolver(orgFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      movementId: '',
      level: undefined,
      logo: '',
      banner: '',
      countryId: '',
      stateId: '',
      lgaId: '',
      wardId: '',
      pollingUnitId: '',
    },
  })

  // Watch form fields for dependent dropdowns
  const selectedLevel = watch('level')
  const selectedCountryId = watch('countryId')
  const selectedStateId = watch('stateId')
  const selectedLgaId = watch('lgaId')
  const selectedWardId = watch('wardId')

  // Determine which location fields are required based on level
  const shouldShowCountry = selectedLevel && selectedLevel !== OrgLevel.NATIONAL
  const shouldShowState =
    selectedLevel &&
    [OrgLevel.STATE, OrgLevel.LGA, OrgLevel.WARD, OrgLevel.UNIT].includes(selectedLevel)
  const shouldShowLga =
    selectedLevel && [OrgLevel.LGA, OrgLevel.WARD, OrgLevel.UNIT].includes(selectedLevel)
  const shouldShowWard = selectedLevel && [OrgLevel.WARD, OrgLevel.UNIT].includes(selectedLevel)
  const shouldShowPollingUnit = selectedLevel === OrgLevel.UNIT

  // Handle level change - reset location fields
  const handleLevelChange = (value: string) => {
    setValue('level', value as OrgLevel)
    setValue('countryId', '')
    setValue('stateId', '')
    setValue('lgaId', '')
    setValue('wardId', '')
    setValue('pollingUnitId', '')
  }

  // Handle location field changes - reset dependent fields
  const handleCountryChangeInternal = (value: string) => {
    setValue('countryId', value)
    setValue('stateId', '')
    setValue('lgaId', '')
    setValue('wardId', '')
    setValue('pollingUnitId', '')
    onCountryChange?.(value)
  }

  const handleStateChangeInternal = (value: string) => {
    setValue('stateId', value)
    setValue('lgaId', '')
    setValue('wardId', '')
    setValue('pollingUnitId', '')
    onStateChange?.(value)
  }

  const handleLgaChangeInternal = (value: string) => {
    setValue('lgaId', value)
    setValue('wardId', '')
    setValue('pollingUnitId', '')
    onLgaChange?.(value)
  }

  const handleWardChangeInternal = (value: string) => {
    setValue('wardId', value)
    setValue('pollingUnitId', '')
    onWardChange?.(value)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Movement Selection */}
      <div className="space-y-2">
        <Label htmlFor="movementId">
          Movement <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch('movementId')}
          onValueChange={(value) => setValue('movementId', value)}
          disabled={movementsLoading || isSubmitting}
        >
          <SelectTrigger id="movementId">
            <SelectValue placeholder="Select a movement" />
          </SelectTrigger>
          <SelectContent>
            {movements.map((movement) => (
              <SelectItem key={movement.id} value={movement.id}>
                {movement.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.movementId && (
          <p className="text-sm text-destructive">{errors.movementId.message}</p>
        )}
      </div>

      {/* Organization Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Organization Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter organization name"
          disabled={isSubmitting}
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          className="min-h-[100px] w-full resize-none rounded-md border border-input bg-background p-3 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter description"
          disabled={isSubmitting}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Organization Level */}
      <div className="space-y-2">
        <Label htmlFor="level">
          Organization Level <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedLevel}
          onValueChange={handleLevelChange}
          disabled={isSubmitting}
        >
          <SelectTrigger id="level">
            <SelectValue placeholder="Select organization level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OrgLevel.NATIONAL}>National</SelectItem>
            <SelectItem value={OrgLevel.STATE}>State</SelectItem>
            <SelectItem value={OrgLevel.LGA}>LGA</SelectItem>
            <SelectItem value={OrgLevel.WARD}>Ward</SelectItem>
            <SelectItem value={OrgLevel.UNIT}>Polling Unit</SelectItem>
          </SelectContent>
        </Select>
        {errors.level && <p className="text-sm text-destructive">{errors.level.message}</p>}
      </div>

      {/* Location Fields - Shown based on level */}
      {shouldShowCountry && (
        <div className="space-y-2">
          <Label htmlFor="countryId">
            Country <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCountryId}
            onValueChange={handleCountryChangeInternal}
            disabled={countriesLoading || isSubmitting}
          >
            <SelectTrigger id="countryId">
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.countryId && (
            <p className="text-sm text-destructive">{errors.countryId.message}</p>
          )}
        </div>
      )}

      {shouldShowState && (
        <div className="space-y-2">
          <Label htmlFor="stateId">
            State <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedStateId}
            onValueChange={handleStateChangeInternal}
            disabled={!selectedCountryId || statesLoading || isSubmitting}
          >
            <SelectTrigger id="stateId">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.stateId && <p className="text-sm text-destructive">{errors.stateId.message}</p>}
        </div>
      )}

      {shouldShowLga && (
        <div className="space-y-2">
          <Label htmlFor="lgaId">
            LGA <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedLgaId}
            onValueChange={handleLgaChangeInternal}
            disabled={!selectedStateId || lgasLoading || isSubmitting}
          >
            <SelectTrigger id="lgaId">
              <SelectValue placeholder="Select an LGA" />
            </SelectTrigger>
            <SelectContent>
              {lgas.map((lga) => (
                <SelectItem key={lga.id} value={lga.id}>
                  {lga.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.lgaId && <p className="text-sm text-destructive">{errors.lgaId.message}</p>}
        </div>
      )}

      {shouldShowWard && (
        <div className="space-y-2">
          <Label htmlFor="wardId">
            Ward <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedWardId}
            onValueChange={handleWardChangeInternal}
            disabled={!selectedLgaId || wardsLoading || isSubmitting}
          >
            <SelectTrigger id="wardId">
              <SelectValue placeholder="Select a ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.id}>
                  {ward.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.wardId && <p className="text-sm text-destructive">{errors.wardId.message}</p>}
        </div>
      )}

      {shouldShowPollingUnit && (
        <div className="space-y-2">
          <Label htmlFor="pollingUnitId">
            Polling Unit <span className="text-destructive">*</span>
          </Label>
          <Select
            value={watch('pollingUnitId')}
            onValueChange={(value) => setValue('pollingUnitId', value)}
            disabled={!selectedWardId || pollingUnitsLoading || isSubmitting}
          >
            <SelectTrigger id="pollingUnitId">
              <SelectValue placeholder="Select a polling unit" />
            </SelectTrigger>
            <SelectContent>
              {pollingUnits.map((pu) => (
                <SelectItem key={pu.id} value={pu.id}>
                  {pu.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pollingUnitId && (
            <p className="text-sm text-destructive">{errors.pollingUnitId.message}</p>
          )}
        </div>
      )}

      {/* Optional: Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="logo">Logo URL (Optional)</Label>
        <Input
          id="logo"
          placeholder="https://example.com/logo.png"
          disabled={isSubmitting}
          {...register('logo')}
        />
        {errors.logo && (
          <p className="text-sm text-destructive">{errors.logo.message}</p>
        )}
      </div>

      {/* Optional: Banner URL */}
      <div className="space-y-2">
        <Label htmlFor="banner">Banner URL (Optional)</Label>
        <Input
          id="banner"
          placeholder="https://example.com/banner.png"
          disabled={isSubmitting}
          {...register('banner')}
        />
        {errors.banner && (
          <p className="text-sm text-destructive">{errors.banner.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
      </div>
    </form>
  )
}
