'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/atoms/Button'
import { Input } from '@/atoms/Input'
import { Label } from '@/atoms/Label'
import { FormField } from '@/molecules/FormField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Checkbox } from '@/ui/checkbox'
import { Textarea } from '@/ui/textarea'
import type { EventFormProps, EventFormData, EventType } from '../types'

export function EventForm({
  event,
  onSubmit,
  onCancel,
  isLoading = false,
}: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: event?.title || '',
    description: event?.description || '',
    type: event?.type || ('MEETING' as EventType),
    startTime: event?.startTime
      ? new Date(event.startTime).toISOString().slice(0, 16)
      : '',
    endTime: event?.endTime
      ? new Date(event.endTime).toISOString().slice(0, 16)
      : '',
    location: event?.location || '',
    isVirtual: event?.isVirtual || false,
    virtualLink: event?.virtualLink || '',
    coverImage: event?.coverImage || '',
    isPublished: event?.isPublished ?? true,
    orgId: event?.orgId,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required'
    }

    if (formData.endTime && new Date(formData.endTime) <= new Date(formData.startTime)) {
      newErrors.endTime = 'End time must be after start time'
    }

    if (!formData.isVirtual && !formData.location?.trim()) {
      newErrors.location = 'Location is required for in-person events'
    }

    if (formData.isVirtual && !formData.virtualLink?.trim()) {
      newErrors.virtualLink = 'Virtual link is required for virtual events'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const handleInputChange = (
    field: keyof EventFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{event ? 'Edit Event' : 'Create Event'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            label="Event Title"
            error={errors.title}
            required
          >
            <Input
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter event title"
            />
          </FormField>

          <FormField
            label="Description"
            error={errors.description}
            required
          >
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the event..."
              rows={4}
            />
          </FormField>

          <FormField label="Event Type" required>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="RALLY">Rally</SelectItem>
                <SelectItem value="TOWN_HALL">Town Hall</SelectItem>
                <SelectItem value="WEBINAR">Webinar</SelectItem>
                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid gap-6 sm:grid-cols-2">
            <FormField
              label="Start Date & Time"
              error={errors.startTime}
              required
            >
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </FormField>

            <FormField label="End Date & Time" error={errors.endTime}>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isVirtual"
              checked={formData.isVirtual}
              onCheckedChange={(checked) =>
                handleInputChange('isVirtual', checked as boolean)
              }
            />
            <Label
              htmlFor="isVirtual"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              This is a virtual event
            </Label>
          </div>

          {formData.isVirtual ? (
            <FormField
              label="Virtual Link"
              error={errors.virtualLink}
              required
            >
              <Input
                type="url"
                value={formData.virtualLink}
                onChange={(e) => handleInputChange('virtualLink', e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            </FormField>
          ) : (
            <FormField label="Location" error={errors.location} required>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter event location"
              />
            </FormField>
          )}

          <FormField label="Cover Image URL">
            <Input
              type="url"
              value={formData.coverImage}
              onChange={(e) => handleInputChange('coverImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </FormField>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublished"
              checked={formData.isPublished}
              onCheckedChange={(checked) =>
                handleInputChange('isPublished', checked as boolean)
              }
            />
            <Label
              htmlFor="isPublished"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Publish event immediately
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
