'use client'

import { useState } from 'react'
import { useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { CREATE_MOVEMENT } from '@/lib/graphql/mutations/platform-admin'

export default function CreateMovementPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [createMovement, { loading }] = useMutation(CREATE_MOVEMENT, {
    onCompleted: (data) => {
      router.push(`/platform-admin/movements/${data.createMovement.id}`)
    },
    onError: (error) => {
      console.error('Error creating movement:', error)
      setErrors({ submit: error.message })
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Movement name is required'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await createMovement({
        variables: {
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            website: formData.website.trim() || undefined,
          }
        }
      })
    } catch (err) {
      // Error handled in onError callback
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/platform-admin/movements">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Movements
          </Button>
        </Link>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Create New Movement
        </h1>
      </div>

      {errors.submit && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{errors.submit}</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle>Movement Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Movement Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Climate Action Network"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
              <p className="text-sm text-gray-500">
                A unique, descriptive name for the movement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the purpose and goals of this movement..."
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-sm text-gray-500">
                Optional description of the movement's mission and objectives
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                name="website"
                type="url"
                placeholder="https://example.com"
                value={formData.website}
                onChange={handleChange}
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && (
                <p className="text-sm text-red-500">{errors.website}</p>
              )}
              <p className="text-sm text-gray-500">
                Optional website URL for the movement
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">Logo & Banner Upload</h4>
              <p className="text-sm text-indigo-700 mb-3">
                Logo and banner image uploads will be available after the movement is created.
                You can add these from the movement detail page.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Movement'
                )}
              </Button>
              <Link href="/platform-admin/movements">
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-indigo-100 bg-indigo-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-indigo-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
            <li>Movement will be created with a unique slug based on the name</li>
            <li>You'll be redirected to the movement detail page</li>
            <li>You can assign super admins to manage the movement</li>
            <li>Super admins can create support groups within the movement</li>
            <li>Users can join support groups and participate in activities</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
