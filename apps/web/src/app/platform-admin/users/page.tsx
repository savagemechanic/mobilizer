'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Users, Search, Shield, UserX, UserCheck, Crown, AlertCircle, Ban, CheckCircle, UserPlus, X, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Avatar } from '@/ui/avatar'
import { GET_ALL_USERS } from '@/lib/graphql/queries/platform-admin'
import {
  GRANT_PLATFORM_ADMIN,
  REVOKE_PLATFORM_ADMIN,
  SUSPEND_USER,
  UNSUSPEND_USER,
  CREATE_PLATFORM_ADMIN_USER
} from '@/lib/graphql/mutations/platform-admin'

export default function AllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'platformAdmin'>('all')
  const [page, setPage] = useState(0)
  const pageSize = 20

  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phoneNumber: '',
    isPlatformAdmin: true
  })
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({})

  // Build filter object with only defined values
  const buildFilter = () => {
    const filter: Record<string, any> = {}
    if (searchQuery) filter.search = searchQuery
    if (statusFilter === 'active') filter.isActive = true
    if (statusFilter === 'suspended') filter.isSuspended = true
    if (statusFilter === 'platformAdmin') filter.isPlatformAdmin = true
    return Object.keys(filter).length > 0 ? filter : undefined
  }

  const { data, loading, error, refetch } = useQuery(GET_ALL_USERS, {
    variables: {
      filter: buildFilter(),
      pagination: {
        limit: pageSize,
        offset: page * pageSize
      }
    },
    fetchPolicy: 'network-only'
  })

  const [grantPlatformAdmin] = useMutation(GRANT_PLATFORM_ADMIN, {
    onCompleted: () => refetch(),
    onError: (error) => alert(`Failed to grant platform admin: ${error.message}`)
  })

  const [revokePlatformAdmin] = useMutation(REVOKE_PLATFORM_ADMIN, {
    onCompleted: () => refetch(),
    onError: (error) => alert(`Failed to revoke platform admin: ${error.message}`)
  })

  const [suspendUser] = useMutation(SUSPEND_USER, {
    onCompleted: () => refetch(),
    onError: (error) => alert(`Failed to suspend user: ${error.message}`)
  })

  const [unsuspendUser] = useMutation(UNSUSPEND_USER, {
    onCompleted: () => refetch(),
    onError: (error) => alert(`Failed to unsuspend user: ${error.message}`)
  })

  const [createPlatformAdminUser, { loading: createLoading }] = useMutation(CREATE_PLATFORM_ADMIN_USER, {
    onCompleted: () => {
      setShowCreateForm(false)
      setCreateFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        middleName: '',
        phoneNumber: '',
        isPlatformAdmin: true
      })
      setCreateFormErrors({})
      refetch()
    },
    onError: (error) => {
      alert(`Failed to create user: ${error.message}`)
    }
  })

  const handleGrantPlatformAdmin = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to grant platform admin access to ${userName}? This gives them full system access.`)) {
      try {
        await grantPlatformAdmin({ variables: { userId } })
      } catch (err) {
        console.error('Error granting platform admin:', err)
      }
    }
  }

  const handleRevokePlatformAdmin = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to revoke platform admin access from ${userName}?`)) {
      try {
        await revokePlatformAdmin({ variables: { userId } })
      } catch (err) {
        console.error('Error revoking platform admin:', err)
      }
    }
  }

  const handleSuspendUser = async (userId: string, userName: string) => {
    const reason = prompt(`Enter reason for suspending ${userName}:`)
    if (reason) {
      try {
        await suspendUser({ variables: { userId, reason } })
      } catch (err) {
        console.error('Error suspending user:', err)
      }
    }
  }

  const handleUnsuspendUser = async (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to unsuspend ${userName}?`)) {
      try {
        await unsuspendUser({ variables: { userId } })
      } catch (err) {
        console.error('Error unsuspending user:', err)
      }
    }
  }

  const validateCreateForm = () => {
    const errors: Record<string, string> = {}

    if (!createFormData.email) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.email)) {
      errors.email = 'Invalid email format'
    }

    if (!createFormData.password) {
      errors.password = 'Password is required'
    } else if (createFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    if (!createFormData.firstName) {
      errors.firstName = 'First name is required'
    }

    if (!createFormData.lastName) {
      errors.lastName = 'Last name is required'
    }

    setCreateFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateCreateForm()) {
      return
    }

    try {
      await createPlatformAdminUser({
        variables: {
          input: {
            email: createFormData.email,
            password: createFormData.password,
            firstName: createFormData.firstName,
            lastName: createFormData.lastName,
            middleName: createFormData.middleName || undefined,
            phoneNumber: createFormData.phoneNumber || undefined,
            isPlatformAdmin: createFormData.isPlatformAdmin
          }
        }
      })
    } catch (err) {
      console.error('Error creating user:', err)
    }
  }

  const users = data?.allUsers?.items || []
  const totalCount = data?.allUsers?.totalCount || 0
  const hasMore = data?.allUsers?.hasMore || false

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading && page === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          All Users
        </h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          All Users
        </h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading users: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          All Users
        </h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create Platform Admin
        </Button>
      </div>

      {/* Create Platform Admin Form */}
      {showCreateForm && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-indigo-600" />
              Create New Platform Admin User
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCreateForm(false)
                setCreateFormErrors({})
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    placeholder="First name"
                    value={createFormData.firstName}
                    onChange={(e) => setCreateFormData({ ...createFormData, firstName: e.target.value })}
                    className={createFormErrors.firstName ? 'border-red-500' : 'border-indigo-300'}
                  />
                  {createFormErrors.firstName && (
                    <p className="text-xs text-red-500">{createFormErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    placeholder="Last name"
                    value={createFormData.lastName}
                    onChange={(e) => setCreateFormData({ ...createFormData, lastName: e.target.value })}
                    className={createFormErrors.lastName ? 'border-red-500' : 'border-indigo-300'}
                  />
                  {createFormErrors.lastName && (
                    <p className="text-xs text-red-500">{createFormErrors.lastName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Middle Name</label>
                  <Input
                    placeholder="Middle name (optional)"
                    value={createFormData.middleName}
                    onChange={(e) => setCreateFormData({ ...createFormData, middleName: e.target.value })}
                    className="border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Phone number (optional)"
                    value={createFormData.phoneNumber}
                    onChange={(e) => setCreateFormData({ ...createFormData, phoneNumber: e.target.value })}
                    className="border-indigo-300"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className={createFormErrors.email ? 'border-red-500' : 'border-indigo-300'}
                  />
                  {createFormErrors.email && (
                    <p className="text-xs text-red-500">{createFormErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Password *</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      className={createFormErrors.password ? 'border-red-500 pr-10' : 'border-indigo-300 pr-10'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {createFormErrors.password && (
                    <p className="text-xs text-red-500">{createFormErrors.password}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createFormData.isPlatformAdmin}
                    onChange={(e) => setCreateFormData({ ...createFormData, isPlatformAdmin: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 border-indigo-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Crown className="h-4 w-4 text-purple-600" />
                    Grant Platform Admin privileges
                  </span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {createLoading ? 'Creating...' : 'Create User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateFormErrors({})
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Platform Admins</p>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => u.isPlatformAdmin).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => u.isActive && !u.isSuspended).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <Ban className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Suspended</p>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => u.isSuspended).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-indigo-100">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(0)
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('all')
                  setPage(0)
                }}
                className={statusFilter === 'all' ? 'bg-indigo-600' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('active')
                  setPage(0)
                }}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'suspended' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('suspended')
                  setPage(0)
                }}
                className={statusFilter === 'suspended' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Suspended
              </Button>
              <Button
                variant={statusFilter === 'platformAdmin' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('platformAdmin')
                  setPage(0)
                }}
                className={statusFilter === 'platformAdmin' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                Platform Admins
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 pb-3 border-b font-semibold text-sm text-gray-600">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Rows */}
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0 hover:bg-indigo-50 transition-colors rounded"
                >
                  <div className="col-span-4 flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.firstName} />
                      ) : (
                        <div className="bg-indigo-600 text-white flex items-center justify-center h-full">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <div className="col-span-2">
                    {user.isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                        <Ban className="h-3 w-3" />
                        Suspended
                      </span>
                    ) : user.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        <AlertCircle className="h-3 w-3" />
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="col-span-2">
                    {user.isPlatformAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        <Crown className="h-3 w-3" />
                        Platform Admin
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>

                  <div className="col-span-2 flex justify-end gap-2">
                    {user.isPlatformAdmin ? (
                      <Button
                        onClick={() => handleRevokePlatformAdmin(user.id, `${user.firstName} ${user.lastName}`)}
                        variant="outline"
                        size="sm"
                        className="border-orange-600 text-orange-600 hover:bg-orange-50"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleGrantPlatformAdmin(user.id, `${user.firstName} ${user.lastName}`)}
                        variant="outline"
                        size="sm"
                        className="border-purple-600 text-purple-600 hover:bg-purple-50"
                      >
                        <Crown className="h-4 w-4" />
                      </Button>
                    )}

                    {user.isSuspended ? (
                      <Button
                        onClick={() => handleUnsuspendUser(user.id, `${user.firstName} ${user.lastName}`)}
                        variant="outline"
                        size="sm"
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSuspendUser(user.id, `${user.firstName} ${user.lastName}`)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="border-indigo-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} users
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0 || loading}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(0, Math.min(page - 2, totalPages - 5)) + i
                    if (pageNum >= totalPages) return null
                    return (
                      <Button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        className={page === pageNum ? 'bg-indigo-600' : ''}
                      >
                        {pageNum + 1}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={!hasMore || loading}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
