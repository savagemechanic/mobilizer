'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Shield, UserPlus, UserMinus, Search, Filter, Layers, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Avatar } from '@/ui/avatar'
import { GET_MOVEMENTS, SEARCH_USERS } from '@/lib/graphql/queries/platform-admin'
import { ASSIGN_SUPER_ADMIN, REVOKE_SUPER_ADMIN, CREATE_SUPER_ADMIN_USER } from '@/lib/graphql/mutations/platform-admin'

export default function SuperAdminsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovement, setSelectedMovement] = useState<string>('all')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedMovementForAssign, setSelectedMovementForAssign] = useState('')
  const [assignMode, setAssignMode] = useState<'search' | 'create'>('search')
  const [showPassword, setShowPassword] = useState(false)
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const { data: movementsData, loading: movementsLoading, refetch } = useQuery(GET_MOVEMENTS, {
    variables: {
      filter: {},
      pagination: { limit: 100, offset: 0 }
    }
  })

  const { data: searchData, loading: searchLoading } = useQuery(SEARCH_USERS, {
    variables: { query: userSearchQuery, limit: 5 },
    skip: !userSearchQuery || userSearchQuery.length < 2
  })

  const [assignSuperAdmin] = useMutation(ASSIGN_SUPER_ADMIN, {
    onCompleted: () => {
      setShowAssignForm(false)
      setUserSearchQuery('')
      setSelectedMovementForAssign('')
      refetch()
    },
    onError: (error) => {
      alert(`Failed to assign super admin: ${error.message}`)
    }
  })

  const [revokeSuperAdmin] = useMutation(REVOKE_SUPER_ADMIN, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      alert(`Failed to revoke super admin: ${error.message}`)
    }
  })

  const [createSuperAdminUser, { loading: createLoading }] = useMutation(CREATE_SUPER_ADMIN_USER, {
    onCompleted: () => {
      setShowAssignForm(false)
      setNewAdminForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
      })
      setSelectedMovementForAssign('')
      setAssignMode('search')
      refetch()
    },
    onError: (error) => {
      setFormErrors({ submit: error.message })
    }
  })

  const handleAssignSuperAdmin = async (userId: string) => {
    if (!selectedMovementForAssign) {
      alert('Please select a movement first')
      return
    }

    try {
      await assignSuperAdmin({
        variables: {
          movementId: selectedMovementForAssign,
          userId
        }
      })
    } catch (err) {
      console.error('Error assigning super admin:', err)
    }
  }

  const validateNewAdminForm = () => {
    const errors: Record<string, string> = {}

    if (!newAdminForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAdminForm.email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!newAdminForm.password) {
      errors.password = 'Password is required'
    } else if (newAdminForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!newAdminForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!newAdminForm.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (!selectedMovementForAssign) {
      errors.movement = 'Please select a movement'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSuperAdmin = async () => {
    if (!validateNewAdminForm()) {
      return
    }

    try {
      await createSuperAdminUser({
        variables: {
          input: {
            email: newAdminForm.email.trim(),
            password: newAdminForm.password,
            firstName: newAdminForm.firstName.trim(),
            lastName: newAdminForm.lastName.trim(),
            movementId: selectedMovementForAssign,
            phoneNumber: newAdminForm.phoneNumber.trim() || undefined,
          }
        }
      })
    } catch (err) {
      console.error('Error creating super admin:', err)
    }
  }

  const handleRevokeSuperAdmin = async (movementId: string, userId: string, userName: string, movementName: string) => {
    if (confirm(`Are you sure you want to revoke super admin access for ${userName} from ${movementName}?`)) {
      try {
        await revokeSuperAdmin({
          variables: {
            movementId,
            userId
          }
        })
      } catch (err) {
        console.error('Error revoking super admin:', err)
      }
    }
  }

  const movements = movementsData?.movements || []

  // Get all super admins across all movements
  const allSuperAdmins = movements.flatMap((movement: any) =>
    (movement.superAdmins || []).map((admin: any) => ({
      ...admin,
      movementId: movement.id,
      movementName: movement.name,
      movementSlug: movement.slug
    }))
  )

  // Filter super admins
  const filteredSuperAdmins = allSuperAdmins.filter((admin: any) => {
    const matchesSearch =
      admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.movementName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesMovement = selectedMovement === 'all' || admin.movementId === selectedMovement

    return matchesSearch && matchesMovement
  })

  // Group by user (in case same user is super admin for multiple movements)
  const groupedByUser = filteredSuperAdmins.reduce((acc: any, admin: any) => {
    const key = admin.id
    if (!acc[key]) {
      acc[key] = {
        user: admin,
        movements: []
      }
    }
    acc[key].movements.push({
      id: admin.movementId,
      name: admin.movementName,
      slug: admin.movementSlug
    })
    return acc
  }, {})

  if (movementsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Super Admins
        </h1>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Super Admins Management
        </h1>
        <Button
          onClick={() => setShowAssignForm(!showAssignForm)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Super Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Assignments</p>
                <p className="text-2xl font-bold">{allSuperAdmins.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Layers className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Movements</p>
                <p className="text-2xl font-bold">{movements.length}</p>
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
                <p className="text-sm text-gray-600">Unique Admins</p>
                <p className="text-2xl font-bold">{Object.keys(groupedByUser).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Form */}
      {showAssignForm && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Assign New Super Admin
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2 p-1 bg-indigo-100 rounded-lg">
              <button
                onClick={() => setAssignMode('search')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  assignMode === 'search'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Search Existing User
              </button>
              <button
                onClick={() => setAssignMode('create')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  assignMode === 'create'
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                Create New Account
              </button>
            </div>

            {formErrors.submit && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {formErrors.submit}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Movement *</Label>
              <select
                value={selectedMovementForAssign}
                onChange={(e) => {
                  setSelectedMovementForAssign(e.target.value)
                  setFormErrors((prev) => ({ ...prev, movement: '' }))
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.movement ? 'border-red-500' : 'border-indigo-300'
                }`}
              >
                <option value="">Choose a movement...</option>
                {movements.map((movement: any) => (
                  <option key={movement.id} value={movement.id}>
                    {movement.name}
                  </option>
                ))}
              </select>
              {formErrors.movement && (
                <p className="text-sm text-red-500">{formErrors.movement}</p>
              )}
            </div>

            {assignMode === 'search' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Search User</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 border-indigo-300"
                      disabled={!selectedMovementForAssign}
                    />
                  </div>
                </div>

                {searchLoading && (
                  <p className="text-sm text-indigo-600">Searching...</p>
                )}

                {searchData?.searchUsers && searchData.searchUsers.length > 0 && (
                  <div className="space-y-2">
                    {searchData.searchUsers.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between bg-white p-3 rounded border border-indigo-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {user.avatar ? (
                              <img src={user.avatar} alt={user.firstName} />
                            ) : (
                              <div className="bg-indigo-600 text-white flex items-center justify-center h-full text-sm">
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
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {userSearchQuery.length >= 2 && !searchLoading && (!searchData?.searchUsers || searchData.searchUsers.length === 0) && (
                  <p className="text-sm text-gray-500">No users found</p>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newAdminForm.firstName}
                      onChange={(e) => {
                        setNewAdminForm((prev) => ({ ...prev, firstName: e.target.value }))
                        setFormErrors((prev) => ({ ...prev, firstName: '' }))
                      }}
                      className={formErrors.firstName ? 'border-red-500' : 'border-indigo-300'}
                    />
                    {formErrors.firstName && (
                      <p className="text-sm text-red-500">{formErrors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newAdminForm.lastName}
                      onChange={(e) => {
                        setNewAdminForm((prev) => ({ ...prev, lastName: e.target.value }))
                        setFormErrors((prev) => ({ ...prev, lastName: '' }))
                      }}
                      className={formErrors.lastName ? 'border-red-500' : 'border-indigo-300'}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-500">{formErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newAdminForm.email}
                    onChange={(e) => {
                      setNewAdminForm((prev) => ({ ...prev, email: e.target.value }))
                      setFormErrors((prev) => ({ ...prev, email: '' }))
                    }}
                    className={formErrors.email ? 'border-red-500' : 'border-indigo-300'}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newAdminForm.password}
                      onChange={(e) => {
                        setNewAdminForm((prev) => ({ ...prev, password: e.target.value }))
                        setFormErrors((prev) => ({ ...prev, password: '' }))
                      }}
                      className={`pr-10 ${formErrors.password ? 'border-red-500' : 'border-indigo-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-sm text-red-500">{formErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="+1 234 567 8900"
                    value={newAdminForm.phoneNumber}
                    onChange={(e) => setNewAdminForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="border-indigo-300"
                  />
                </div>

                <Button
                  onClick={handleCreateSuperAdmin}
                  disabled={createLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create & Assign Super Admin'
                  )}
                </Button>
              </>
            )}

            <Button
              onClick={() => {
                setShowAssignForm(false)
                setUserSearchQuery('')
                setSelectedMovementForAssign('')
                setAssignMode('search')
                setNewAdminForm({
                  email: '',
                  password: '',
                  firstName: '',
                  lastName: '',
                  phoneNumber: '',
                })
                setFormErrors({})
              }}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-indigo-100">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or movement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedMovement}
                onChange={(e) => setSelectedMovement(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Movements</option>
                {movements.map((movement: any) => (
                  <option key={movement.id} value={movement.id}>
                    {movement.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Super Admins List */}
      {Object.keys(groupedByUser).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No super admins found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedMovement !== 'all'
                ? 'Try adjusting your filters'
                : 'Assign super admins to help manage movements'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedByUser).map((item: any) => {
            const admin = item.user
            const userMovements = item.movements

            return (
              <Card key={admin.id} className="hover:shadow-lg transition-shadow border-indigo-100">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="h-12 w-12">
                        {admin.avatar ? (
                          <img src={admin.avatar} alt={admin.firstName} />
                        ) : (
                          <div className="bg-indigo-600 text-white flex items-center justify-center h-full">
                            {admin.firstName?.[0]}{admin.lastName?.[0]}
                          </div>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{admin.firstName} {admin.lastName}</h3>
                        <p className="text-gray-600">{admin.email}</p>

                        <div className="mt-3">
                          <p className="text-sm font-semibold text-gray-700 mb-2">
                            Super Admin for {userMovements.length} movement{userMovements.length !== 1 ? 's' : ''}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {userMovements.map((movement: any) => (
                              <div
                                key={movement.id}
                                className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg px-3 py-2"
                              >
                                <Layers className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-medium">{movement.name}</span>
                                <button
                                  onClick={() => handleRevokeSuperAdmin(
                                    movement.id,
                                    admin.id,
                                    `${admin.firstName} ${admin.lastName}`,
                                    movement.name
                                  )}
                                  className="ml-2 text-red-600 hover:text-red-700"
                                >
                                  <UserMinus className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary */}
      <Card className="border-indigo-100">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600">
            Showing {Object.keys(groupedByUser).length} super admin{Object.keys(groupedByUser).length !== 1 ? 's' : ''} with {filteredSuperAdmins.length} total assignment{filteredSuperAdmins.length !== 1 ? 's' : ''}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
