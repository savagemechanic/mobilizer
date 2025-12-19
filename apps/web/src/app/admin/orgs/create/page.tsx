'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@apollo/client'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { CREATE_ORGANIZATION } from '@/lib/graphql/mutations/organizations'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import {
  GET_COUNTRIES,
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS,
} from '@/lib/graphql/queries/locations'
import { OrgLevel } from '@mobilizer/shared'

// Form validation schema
const createOrgSchema = z.object({
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

type CreateOrgFormData = z.infer<typeof createOrgSchema>

export default function CreateOrgPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateOrgFormData>({
    resolver: zodResolver(createOrgSchema),
    defaultValues: {
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

  // GraphQL queries
  const { data: movementsData, loading: movementsLoading } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  const { data: countriesData, loading: countriesLoading } = useQuery(GET_COUNTRIES)

  const { data: statesData, loading: statesLoading } = useQuery(GET_STATES, {
    variables: { countryId: selectedCountryId },
    skip: !selectedCountryId,
  })

  const { data: lgasData, loading: lgasLoading } = useQuery(GET_LGAS, {
    variables: { stateId: selectedStateId },
    skip: !selectedStateId,
  })

  const { data: wardsData, loading: wardsLoading } = useQuery(GET_WARDS, {
    variables: { lgaId: selectedLgaId },
    skip: !selectedLgaId,
  })

  const { data: pollingUnitsData, loading: pollingUnitsLoading } = useQuery(
    GET_POLLING_UNITS,
    {
      variables: { wardId: selectedWardId },
      skip: !selectedWardId,
    }
  )

  const movements = movementsData?.movements || []
  const countries = countriesData?.countries || []
  const states = statesData?.states || []
  const lgas = lgasData?.lgas || []
  const wards = wardsData?.wards || []
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  // Create organization mutation
  const [createOrganization, { loading: createLoading }] = useMutation(
    CREATE_ORGANIZATION,
    {
      onCompleted: () => {
        router.push('/admin/orgs')
      },
      onError: (err) => {
        setError(err.message || 'Failed to create organization')
      },
    }
  )

  // Determine which location fields are required based on level
  const shouldShowCountry = selectedLevel && selectedLevel !== OrgLevel.NATIONAL
  const shouldShowState = selectedLevel && [OrgLevel.STATE, OrgLevel.LGA, OrgLevel.WARD, OrgLevel.UNIT].includes(selectedLevel)
  const shouldShowLga = selectedLevel && [OrgLevel.LGA, OrgLevel.WARD, OrgLevel.UNIT].includes(selectedLevel)
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
  const handleCountryChange = (value: string) => {
    setValue('countryId', value)
    setValue('stateId', '')
    setValue('lgaId', '')
    setValue('wardId', '')
    setValue('pollingUnitId', '')
  }

  const handleStateChange = (value: string) => {
    setValue('stateId', value)
    setValue('lgaId', '')
    setValue('wardId', '')
    setValue('pollingUnitId', '')
  }

  const handleLgaChange = (value: string) => {
    setValue('lgaId', value)
    setValue('wardId', '')
    setValue('pollingUnitId', '')
  }

  const handleWardChange = (value: string) => {
    setValue('wardId', value)
    setValue('pollingUnitId', '')
  }

  // Form submission
  const onSubmit = async (data: CreateOrgFormData) => {
    setError(null)

    // Build input object based on level
    const input: any = {
      name: data.name,
      movementId: data.movementId,
      level: data.level.toUpperCase(), // Backend expects uppercase
      description: data.description || undefined,
      logo: data.logo || undefined,
      banner: data.banner || undefined,
    }

    // Add location fields based on level
    if (shouldShowCountry && data.countryId) {
      input.countryId = data.countryId
    }
    if (shouldShowState && data.stateId) {
      input.stateId = data.stateId
    }
    if (shouldShowLga && data.lgaId) {
      input.lgaId = data.lgaId
    }
    if (shouldShowWard && data.wardId) {
      input.wardId = data.wardId
    }
    if (shouldShowPollingUnit && data.pollingUnitId) {
      input.pollingUnitId = data.pollingUnitId
    }

    try {
      await createOrganization({
        variables: { input },
      })
    } catch (err) {
      // Error handled by onError callback
      console.error('Create organization error:', err)
    }
  }

  const isLoading = isSubmitting || createLoading

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Organization</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {/* Movement Selection */}
            <div className="space-y-2">
              <Label htmlFor="movementId">
                Movement <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('movementId')}
                onValueChange={(value) => setValue('movementId', value)}
                disabled={movementsLoading}
              >
                <SelectTrigger id="movementId">
                  <SelectValue placeholder="Select a movement" />
                </SelectTrigger>
                <SelectContent>
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.movementId && (
                <p className="text-sm text-red-600">{errors.movementId.message}</p>
              )}
            </div>

            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter organization name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter description"
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Organization Level */}
            <div className="space-y-2">
              <Label htmlFor="level">
                Organization Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={selectedLevel}
                onValueChange={handleLevelChange}
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
              {errors.level && (
                <p className="text-sm text-red-600">{errors.level.message}</p>
              )}
            </div>

            {/* Location Fields - Shown based on level */}
            {shouldShowCountry && (
              <div className="space-y-2">
                <Label htmlFor="countryId">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedCountryId}
                  onValueChange={handleCountryChange}
                  disabled={countriesLoading}
                >
                  <SelectTrigger id="countryId">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country: any) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.countryId && (
                  <p className="text-sm text-red-600">{errors.countryId.message}</p>
                )}
              </div>
            )}

            {shouldShowState && (
              <div className="space-y-2">
                <Label htmlFor="stateId">
                  State <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedStateId}
                  onValueChange={handleStateChange}
                  disabled={!selectedCountryId || statesLoading}
                >
                  <SelectTrigger id="stateId">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state: any) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stateId && (
                  <p className="text-sm text-red-600">{errors.stateId.message}</p>
                )}
              </div>
            )}

            {shouldShowLga && (
              <div className="space-y-2">
                <Label htmlFor="lgaId">
                  LGA <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedLgaId}
                  onValueChange={handleLgaChange}
                  disabled={!selectedStateId || lgasLoading}
                >
                  <SelectTrigger id="lgaId">
                    <SelectValue placeholder="Select an LGA" />
                  </SelectTrigger>
                  <SelectContent>
                    {lgas.map((lga: any) => (
                      <SelectItem key={lga.id} value={lga.id}>
                        {lga.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.lgaId && (
                  <p className="text-sm text-red-600">{errors.lgaId.message}</p>
                )}
              </div>
            )}

            {shouldShowWard && (
              <div className="space-y-2">
                <Label htmlFor="wardId">
                  Ward <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedWardId}
                  onValueChange={handleWardChange}
                  disabled={!selectedLgaId || wardsLoading}
                >
                  <SelectTrigger id="wardId">
                    <SelectValue placeholder="Select a ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward: any) => (
                      <SelectItem key={ward.id} value={ward.id}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.wardId && (
                  <p className="text-sm text-red-600">{errors.wardId.message}</p>
                )}
              </div>
            )}

            {shouldShowPollingUnit && (
              <div className="space-y-2">
                <Label htmlFor="pollingUnitId">
                  Polling Unit <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={watch('pollingUnitId')}
                  onValueChange={(value) => setValue('pollingUnitId', value)}
                  disabled={!selectedWardId || pollingUnitsLoading}
                >
                  <SelectTrigger id="pollingUnitId">
                    <SelectValue placeholder="Select a polling unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {pollingUnits.map((pu: any) => (
                      <SelectItem key={pu.id} value={pu.id}>
                        {pu.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pollingUnitId && (
                  <p className="text-sm text-red-600">{errors.pollingUnitId.message}</p>
                )}
              </div>
            )}

            {/* Optional: Logo URL */}
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL (Optional)</Label>
              <Input
                id="logo"
                placeholder="https://example.com/logo.png"
                {...register('logo')}
              />
            </div>

            {/* Optional: Banner URL */}
            <div className="space-y-2">
              <Label htmlFor="banner">Banner URL (Optional)</Label>
              <Input
                id="banner"
                placeholder="https://example.com/banner.png"
                {...register('banner')}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/orgs')}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
