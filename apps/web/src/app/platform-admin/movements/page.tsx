'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Layers, Plus, Search, Edit, Trash2, Power, PowerOff, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import { DELETE_MOVEMENT, UPDATE_MOVEMENT } from '@/lib/graphql/mutations/platform-admin'

export default function MovementsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const { data, loading, error, refetch } = useQuery(GET_MOVEMENTS, {
    variables: {
      filter: {},
      limit: 100,
      offset: 0
    }
  })

  const [deleteMovement] = useMutation(DELETE_MOVEMENT, {
    onCompleted: () => {
      refetch()
    }
  })

  const [updateMovement] = useMutation(UPDATE_MOVEMENT, {
    onCompleted: () => {
      refetch()
    }
  })

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete movement "${name}"? This action cannot be undone.`)) {
      try {
        await deleteMovement({ variables: { id } })
      } catch (err) {
        console.error('Error deleting movement:', err)
        alert('Failed to delete movement')
      }
    }
  }

  const handleToggleStatus = async (id: string, isActive: boolean) => {
    try {
      await updateMovement({
        variables: {
          id,
          input: { isActive: !isActive }
        }
      })
    } catch (err) {
      console.error('Error toggling movement status:', err)
      alert('Failed to update movement status')
    }
  }

  // Backend returns array directly, not paginated wrapper
  const movements = data?.movements || []

  const filteredMovements = movements.filter((movement: any) => {
    const matchesSearch = movement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         movement.slug.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && movement.isActive) ||
                         (statusFilter === 'inactive' && !movement.isActive)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Movements
          </h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Movements
        </h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading movements: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Movements
        </h1>
        <Link href="/platform-admin/movements/create">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Movement
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="border-indigo-100">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search movements by name or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className={statusFilter === 'all' ? 'bg-indigo-600' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('active')}
                className={statusFilter === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('inactive')}
                className={statusFilter === 'inactive' ? 'bg-gray-600 hover:bg-gray-700' : ''}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      {filteredMovements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No movements found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first movement'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Link href="/platform-admin/movements/create">
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Movement
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredMovements.map((movement: any) => (
            <Card key={movement.id} className="hover:shadow-lg transition-shadow border-indigo-100">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{movement.name}</h3>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        /{movement.slug}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          movement.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {movement.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {movement.description && (
                      <p className="text-gray-600 mb-3">{movement.description}</p>
                    )}

                    <div className="flex gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        <span>{movement.supportGroupsCount} Support Groups</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{movement.membersCount} Members</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-indigo-600" />
                        <span>{movement.superAdmins?.length || 0} Super Admins</span>
                      </div>
                    </div>

                    {movement.superAdmins && movement.superAdmins.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {movement.superAdmins.slice(0, 3).map((admin: any) => (
                          <span
                            key={admin.id}
                            className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded"
                          >
                            {admin.firstName} {admin.lastName}
                          </span>
                        ))}
                        {movement.superAdmins.length > 3 && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                            +{movement.superAdmins.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/platform-admin/movements/${movement.id}`)}
                      className="border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(movement.id, movement.isActive)}
                      className={
                        movement.isActive
                          ? 'border-orange-600 text-orange-600 hover:bg-orange-50'
                          : 'border-green-600 text-green-600 hover:bg-green-50'
                      }
                    >
                      {movement.isActive ? (
                        <PowerOff className="h-4 w-4" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(movement.id, movement.name)}
                      className="border-red-600 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <Card className="border-indigo-100">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-600">
            Showing {filteredMovements.length} of {movements.length} movements
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
