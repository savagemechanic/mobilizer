'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Shield, UserPlus, UserMinus, Search, Filter, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Avatar } from '@/ui/avatar'
import { GET_MOVEMENTS, SEARCH_USERS } from '@/lib/graphql/queries/platform-admin'
import { ASSIGN_SUPER_ADMIN, REVOKE_SUPER_ADMIN } from '@/lib/graphql/mutations/platform-admin'

export default function SuperAdminsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMovement, setSelectedMovement] = useState<string>('all')
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedMovementForAssign, setSelectedMovementForAssign] = useState('')

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
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Movement</label>
              <select
                value={selectedMovementForAssign}
                onChange={(e) => setSelectedMovementForAssign(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Choose a movement...</option>
                {movements.map((movement: any) => (
                  <option key={movement.id} value={movement.id}>
                    {movement.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Search User</label>
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

            <Button
              onClick={() => {
                setShowAssignForm(false)
                setUserSearchQuery('')
                setSelectedMovementForAssign('')
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
