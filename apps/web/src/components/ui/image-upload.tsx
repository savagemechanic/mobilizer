'use client'

import { useState, useRef, useCallback } from 'react'
import { useMutation, useQuery } from '@apollo/client'
import { Upload, X, Loader2, ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from './button'
import { GET_PRESIGNED_UPLOAD_URL, CHECK_UPLOAD_CONFIGURED } from '@/lib/graphql/mutations/upload'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  type: 'avatar' | 'post' | 'organization' | 'event'
  label?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'banner'
}

export function ImageUpload({
  value,
  onChange,
  type,
  label = 'Upload Image',
  className,
  aspectRatio = 'square',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: configData } = useQuery(CHECK_UPLOAD_CONFIGURED)
  const [getPresignedUrl] = useMutation(GET_PRESIGNED_UPLOAD_URL)

  const isConfigured = configData?.uploadConfigured ?? false

  const handleUpload = useCallback(async (file: File) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Get presigned URL
      const { data } = await getPresignedUrl({
        variables: {
          type,
          fileName: file.name,
          contentType: file.type,
        },
      })

      if (!data?.getPresignedUploadUrl) {
        throw new Error('Failed to get upload URL')
      }

      const { uploadUrl, fileUrl } = data.getPresignedUploadUrl

      // Upload to S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file')
      }

      // Update parent with the file URL
      onChange(fileUrl)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }, [type, getPresignedUrl, onChange])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    }
  }

  const handleRemove = () => {
    onChange('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const aspectRatioClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    banner: 'aspect-[3/1]',
  }[aspectRatio]

  if (!isConfigured) {
    return (
      <div className={cn('space-y-2', className)}>
        {label && <p className="text-sm font-medium">{label}</p>}
        <div className="flex items-center gap-2 p-3 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-md">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>Image upload is not configured. Please enter a URL manually or configure AWS S3.</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        <div className={cn('relative rounded-lg overflow-hidden border', aspectRatioClass)}>
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg transition-colors',
            aspectRatioClass,
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400',
            isUploading && 'pointer-events-none opacity-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Uploading...</p>
              </>
            ) : (
              <>
                {dragActive ? (
                  <Upload className="h-8 w-8 text-primary" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
                <p className="mt-2 text-sm text-gray-500 text-center">
                  {dragActive ? 'Drop to upload' : 'Click or drag image to upload'}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  JPEG, PNG, WebP, or GIF (max 5MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
