'use client'

import { useState, useEffect, use } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit2, Save, X, UserPlus, UserMinus, Building2, Users, Shield, Loader2, Search } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Avatar } from '@/ui/avatar'
import { GET_MOVEMENT, SEARCH_USERS } from '@/lib/graphql/queries/platform-admin'
import { UPDATE_MOVEMENT, ASSIGN_SUPER_ADMIN, REVOKE_SUPER_ADMIN } from '@/lib/graphql/mutations/platform-admin'

export default function MovementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
  })

  const { data, loading, error, refetch } = useQuery(GET_MOVEMENT, {
    variables: { id }
  })

  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_USERS, {
    variables: { query: userSearchQuery, limit: 5 },
    skip: !userSearchQuery || userSearchQuery.length < 2
  })

  const [updateMovement, { loading: updateLoading }] = useMutation(UPDATE_MOVEMENT, {
    onCompleted: () => {
      setIsEditing(false)
      refetch()
    }
  })

  const [assignSuperAdmin] = useMutation(ASSIGN_SUPER_ADMIN, {
    onCompleted: () => {
      setShowAddAdmin(false)
      setUserSearchQuery('')
      refetch()
    }
  })

  const [revokeSuperAdmin] = useMutation(REVOKE_SUPER_ADMIN, {
    onCompleted: () => {
      refetch()
    }
  })

  useEffect(() => {
    if (data?.movement) {
      setFormData({
        name: data.movement.name || '',
        description: data.movement.description || '',
        website: data.movement.website || '',
      })
    }
  }, [data])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      await updateMovement({
        variables: {
          id,
          input: {
            name: formData.name.trim(),
            description: formData.description.trim() || undefined,
            website: formData.website.trim() || undefined,
          }
        }
      })
    } catch (err) {
      console.error('Error updating movement:', err)
      alert('Failed to update movement')
    }
  }

  const handleAssignSuperAdmin = async (userId: string) => {
    try {
      await assignSuperAdmin({
        variables: {
          movementId: id,
          userId
        }
      })
    } catch (err) {
      console.error('Error assigning super admin:', err)
      alert('Failed to assign super admin')
    }
  }

  const handleRevokeSuperAdmin = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to revoke super admin access for ${userName}?`)) {
      try {
        await revokeSuperAdmin({
          variables: {
            movementId: id,
            userId
          }
        })
      } catch (err) {
        console.error('Error revoking super admin:', err)
        alert('Failed to revoke super admin')
      }
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/platform-admin/movements">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !data?.movement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/platform-admin/movements">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              {error ? `Error loading movement: ${error.message}` : 'Movement not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const movement = data.movement

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/platform-admin/movements">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Movements
            </Button>
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {movement.name}
          </h1>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" className="border-indigo-600 text-indigo-600">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Movement
          </Button>
        )}
      </div>

      {/* Movement Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Building2 className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Support Groups</p>
                <p className="text-2xl font-bold">{movement.supportGroupsCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold">{movement.membersCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Super Admins</p>
                <p className="text-2xl font-bold">{movement.superAdmins?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement Details */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Movement Details</span>
            {isEditing && (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={updateLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  {updateLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Movement Name</Label>
            {isEditing ? (
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            ) : (
              <p className="text-lg font-semibold">{movement.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Slug</Label>
            <p className="text-gray-600 bg-gray-50 px-3 py-2 rounded border">/{movement.slug}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {isEditing ? (
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            ) : (
              <p className="text-gray-600">{movement.description || 'No description provided'}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            {isEditing ? (
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
              />
            ) : movement.website ? (
              <a href={movement.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                {movement.website}
              </a>
            ) : (
              <p className="text-gray-400">No website provided</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Status</Label>
              <p className={`inline-block px-3 py-1 rounded-full text-sm ${
                movement.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {movement.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-gray-600">Created</Label>
              <p className="text-gray-700">{new Date(movement.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admins */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Super Admins
            </div>
            <Button
              onClick={() => setShowAddAdmin(!showAddAdmin)}
              variant="outline"
              size="sm"
              className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Super Admin
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddAdmin && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
              <Label>Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchLoading && (
                <p className="text-sm text-gray-500">Searching...</p>
              )}
              {searchData?.searchUsers && searchData.searchUsers.length > 0 && (
                <div className="space-y-2">
                  {searchData.searchUsers.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.firstName} />
                          ) : (
                            <div className="bg-indigo-600 text-white flex items-center justify-center h-full">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAssignSuperAdmin(user.id)}
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {userSearchQuery.length >= 2 && !searchLoading && (!searchData?.searchUsers || searchData.searchUsers.length === 0) && (
                <p className="text-sm text-gray-500">No users found</p>
              )}
            </div>
          )}

          {movement.superAdmins && movement.superAdmins.length > 0 ? (
            <div className="space-y-3">
              {movement.superAdmins.map((admin: any) => (
                <div key={admin.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {admin.avatar ? (
                        <img src={admin.avatar} alt={admin.firstName} />
                      ) : (
                        <div className="bg-indigo-600 text-white flex items-center justify-center h-full">
                          {admin.firstName?.[0]}{admin.lastName?.[0]}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{admin.firstName} {admin.lastName}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRevokeSuperAdmin(admin.id, `${admin.firstName} ${admin.lastName}`)}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No super admins assigned yet</p>
              <p className="text-sm">Add super admins to help manage this movement</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Upload Placeholder */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle>Logo & Banner Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-lg p-8 text-center">
            <p className="text-indigo-700">Image upload functionality will be implemented here</p>
            <p className="text-sm text-indigo-600 mt-2">Logo and banner image management coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
