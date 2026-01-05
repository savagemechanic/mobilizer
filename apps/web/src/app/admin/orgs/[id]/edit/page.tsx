'use client'

import { useState, useEffect, use } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { ImageUpload } from '@/ui/image-upload'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_ORGANIZATION } from '@/lib/graphql/queries/admin'
import { UPDATE_ORGANIZATION } from '@/lib/graphql/mutations/organizations'

export default function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo: '',
    banner: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, loading, error } = useQuery(GET_ORGANIZATION, {
    variables: { id },
  })

  const [updateOrganization, { loading: updateLoading }] = useMutation(UPDATE_ORGANIZATION, {
    onCompleted: () => {
      router.push(`/admin/orgs/${id}`)
    },
    onError: (err) => {
      setErrors({ submit: err.message })
    },
  })

  useEffect(() => {
    if (data?.organization) {
      setFormData({
        name: data.organization.name || '',
        description: data.organization.description || '',
        logo: data.organization.logo || '',
        banner: data.organization.banner || '',
      })
    }
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await updateOrganization({
        variables: {
          id,
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            logo: formData.logo || undefined,
            banner: formData.banner || undefined,
          },
        },
      })
    } catch (err) {
      console.error('Error updating organization:', err)
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
        <h1 className="text-3xl font-bold">Edit Organization</h1>
      </div>

      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{errors.submit}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Lagos State Support Group"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="A brief description of the organization..."
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <p className="text-sm text-muted-foreground">
                Optional description (40 characters max)
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <ImageUpload
                value={formData.logo}
                onChange={(url) => setFormData((prev) => ({ ...prev, logo: url }))}
                type="organization"
                label="Organization Logo"
                aspectRatio="square"
              />

              <ImageUpload
                value={formData.banner}
                onChange={(url) => setFormData((prev) => ({ ...prev, banner: url }))}
                type="organization"
                label="Organization Banner"
                aspectRatio="banner"
              />
            </div>

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
                    Save Changes
                  </>
                )}
              </Button>
              <Link href={`/admin/orgs/${id}`}>
                <Button type="button" variant="outline" disabled={updateLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Organization Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Level</p>
              <p className="font-medium">{organization.level}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Members</p>
              <p className="font-medium">{organization.memberCount || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Slug</p>
              <p className="font-mono text-xs">{organization.slug}</p>
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
