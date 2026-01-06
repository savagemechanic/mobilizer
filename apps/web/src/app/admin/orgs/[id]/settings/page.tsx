'use client'

import { use, useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save, Lock, Unlock, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { Button } from '@/ui/button'
import { Label } from '@/ui/label'
import { Switch } from '@/ui/switch'
import { Checkbox } from '@/ui/checkbox'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_ORGANIZATION } from '@/lib/graphql/queries/admin'
import { UPDATE_ORGANIZATION } from '@/lib/graphql/mutations/organizations'
import { useToast } from '@/hooks/use-toast'

// Location levels that can be enabled
const LOCATION_LEVELS = [
  { value: 'COUNTRY', label: 'Country' },
  { value: 'GEOPOLITICAL_ZONE', label: 'Geopolitical Zone' },
  { value: 'STATE', label: 'State' },
  { value: 'SENATORIAL_ZONE', label: 'Senatorial Zone' },
  { value: 'FEDERAL_CONSTITUENCY', label: 'Federal Constituency' },
  { value: 'LGA', label: 'LGA (Local Government Area)' },
  { value: 'WARD', label: 'Ward' },
  { value: 'POLLING_UNIT', label: 'Polling Unit' },
] as const

export default function OrgSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    isPrivate: false,
    requiresConfirmation: false,
    enabledLocationLevels: [
      'COUNTRY',
      'GEOPOLITICAL_ZONE',
      'STATE',
      'SENATORIAL_ZONE',
      'FEDERAL_CONSTITUENCY',
      'LGA',
      'WARD',
      'POLLING_UNIT',
    ],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, loading, error } = useQuery(GET_ORGANIZATION, {
    variables: { id },
  })

  const [updateOrganization, { loading: updateLoading }] = useMutation(UPDATE_ORGANIZATION, {
    onCompleted: () => {
      toast({
        title: 'Settings updated',
        description: 'Organization settings have been saved successfully.',
      })
      router.push(`/admin/orgs/${id}`)
    },
    onError: (err) => {
      setErrors({ submit: err.message })
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (data?.organization) {
      setFormData({
        isPrivate: data.organization.isPrivate || false,
        requiresConfirmation: data.organization.requiresConfirmation || false,
        enabledLocationLevels: data.organization.enabledLocationLevels || [
          'COUNTRY',
          'GEOPOLITICAL_ZONE',
          'STATE',
          'SENATORIAL_ZONE',
          'FEDERAL_CONSTITUENCY',
          'LGA',
          'WARD',
          'POLLING_UNIT',
        ],
      })
    }
  }, [data])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate at least one location level is enabled
    if (formData.enabledLocationLevels.length === 0) {
      setErrors({ enabledLocationLevels: 'At least one location level must be enabled' })
      return
    }

    try {
      await updateOrganization({
        variables: {
          id,
          input: {
            isPrivate: formData.isPrivate,
            requiresConfirmation: formData.requiresConfirmation,
            enabledLocationLevels: formData.enabledLocationLevels,
          },
        },
      })
    } catch (err) {
      console.error('Error updating organization settings:', err)
    }
  }

  const handleLocationLevelToggle = (level: string) => {
    setFormData((prev) => {
      const isEnabled = prev.enabledLocationLevels.includes(level)
      const newLevels = isEnabled
        ? prev.enabledLocationLevels.filter((l) => l !== level)
        : [...prev.enabledLocationLevels, level]

      return {
        ...prev,
        enabledLocationLevels: newLevels,
      }
    })

    // Clear error if at least one level is selected
    if (errors.enabledLocationLevels) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.enabledLocationLevels
        return newErrors
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/admin/orgs/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading organization: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data?.organization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orgs">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Organizations
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Organization not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const organization = data.organization

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/orgs/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Organization Settings</h1>
          <p className="text-muted-foreground mt-1">{organization.name}</p>
        </div>
      </div>

      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{errors.submit}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>
              Control who can join this organization and how
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Private Organization Toggle */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {formData.isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="isPrivate" className="text-base font-semibold cursor-pointer">
                    Private Organization
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, users will need an invite code to join this organization. Public
                  organizations can be discovered and joined by anyone.
                </p>
              </div>
              <Switch
                id="isPrivate"
                checked={formData.isPrivate}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isPrivate: checked }))
                }
              />
            </div>

            {/* Invite Code Display (if private) */}
            {formData.isPrivate && organization.inviteCode && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Invite Code</Label>
                    <div className="flex items-center gap-2">
                      <code className="text-2xl font-bold tracking-wider">
                        {organization.inviteCode}
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with members to allow them to join
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Requires Confirmation Toggle */}
            <div className="flex items-start justify-between space-x-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <Label
                    htmlFor="requiresConfirmation"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Require Admin Approval
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, new members must be approved by an admin before they can access the
                  organization. Otherwise, members are automatically approved upon joining.
                </p>
              </div>
              <Switch
                id="requiresConfirmation"
                checked={formData.requiresConfirmation}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, requiresConfirmation: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Location Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Enabled Location Levels</CardTitle>
            <CardDescription>
              Select which location levels are active for this organization. Members can create
              posts at these levels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {LOCATION_LEVELS.map((level) => (
              <div key={level.value} className="flex items-center space-x-3">
                <Checkbox
                  id={level.value}
                  checked={formData.enabledLocationLevels.includes(level.value)}
                  onCheckedChange={() => handleLocationLevelToggle(level.value)}
                />
                <Label
                  htmlFor={level.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {level.label}
                </Label>
              </div>
            ))}
            {errors.enabledLocationLevels && (
              <p className="text-sm text-red-500">{errors.enabledLocationLevels}</p>
            )}
            <p className="text-xs text-muted-foreground">
              At least one location level must be enabled
            </p>
          </CardContent>
        </Card>

        {/* Verification Requirements (Future Enhancement) */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Verification Requirements
              <span className="text-xs font-normal text-muted-foreground">(Coming Soon)</span>
            </CardTitle>
            <CardDescription>
              Set requirements for member verification (available in future updates)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Additional verification options like phone verification, ID verification, and custom
              fields will be available in upcoming releases.
            </p>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={updateLoading}>
            {updateLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Link href={`/admin/orgs/${id}`}>
            <Button type="button" variant="outline" disabled={updateLoading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      {/* Organization Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Organization Level</p>
              <p className="font-medium">{organization.level}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Members</p>
              <p className="font-medium">{organization.memberCount || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Movement</p>
              <p className="font-medium">{organization.movement?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{organization.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
