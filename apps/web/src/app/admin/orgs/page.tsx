'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Search,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/ui/table'
import { Badge } from '@/ui/badge'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import { ListPageTemplate } from '@/templates'
import { ConfirmDialog } from '@/modals'

const ITEMS_PER_PAGE = 20

// Organization levels
const ORG_LEVELS = {
  NATIONAL: 'national',
  STATE: 'state',
  LGA: 'lga',
  WARD: 'ward',
  UNIT: 'unit',
} as const

export default function AdminOrgsPage() {
  const router = useRouter()

  // Filter state
  const [movementId, setMovementId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    orgId: string | null
    orgName: string | null
  }>({
    open: false,
    orgId: null,
    orgName: null,
  })

  // Fetch movements
  const { data: movementsData } = useQuery(GET_MOVEMENTS, {
    variables: { filter: { isActive: true } },
  })

  // Build filter object
  const filter: any = {}
  if (searchTerm) filter.search = searchTerm
  if (levelFilter) filter.level = levelFilter

  // Calculate pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE

  // Fetch organizations
  const { data, loading, error } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      movementId: movementId || '',
      filter,
      limit: ITEMS_PER_PAGE,
      offset,
    },
    skip: !movementId,
  })

  const movements = movementsData?.movements || []
  const organizations = data?.organizations || []

  // Format level for display
  const formatLevel = (level: string) => {
    return level.replace('_', ' ').toUpperCase()
  }

  // Format location display
  const formatLocation = (org: any) => {
    const parts = []
    if (org.pollingUnit) parts.push(org.pollingUnit.name)
    if (org.ward) parts.push(org.ward.name)
    if (org.lga) parts.push(org.lga.name)
    if (org.state) parts.push(org.state.name)
    if (org.country) parts.push(org.country.name)
    return parts.length > 0 ? parts.join(', ') : 'N/A'
  }

  // Handle page change
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (organizations.length === ITEMS_PER_PAGE) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleLevelChange = (value: string) => {
    setLevelFilter(value === 'all' ? null : value)
    setCurrentPage(1)
  }

  const handleMovementChange = (value: string) => {
    setMovementId(value === 'all' ? null : value)
    setCurrentPage(1)
  }

  const handleDeleteClick = (orgId: string, orgName: string) => {
    setConfirmDialog({
      open: true,
      orgId,
      orgName,
    })
  }

  const handleConfirmDelete = () => {
    if (confirmDialog.orgId) {
      // TODO: Implement delete mutation
      console.log('Delete org:', confirmDialog.orgId)
      setConfirmDialog({ open: false, orgId: null, orgName: null })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <Link href="/admin/orgs/create">
          <Button>
            <Building2 className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Movement Filter */}
            <div className="space-y-2">
              <Label htmlFor="movement">Movement</Label>
              <Select
                value={movementId || 'all'}
                onValueChange={handleMovementChange}
              >
                <SelectTrigger id="movement">
                  <SelectValue placeholder="Select Movement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Movements</SelectItem>
                  {movements.map((movement: any) => (
                    <SelectItem key={movement.id} value={movement.id}>
                      {movement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                  disabled={!movementId}
                />
              </div>
            </div>

            {/* Level Filter */}
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select
                value={levelFilter || 'all'}
                onValueChange={handleLevelChange}
                disabled={!movementId}
              >
                <SelectTrigger id="level">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value={ORG_LEVELS.NATIONAL}>National</SelectItem>
                  <SelectItem value={ORG_LEVELS.STATE}>State</SelectItem>
                  <SelectItem value={ORG_LEVELS.LGA}>LGA</SelectItem>
                  <SelectItem value={ORG_LEVELS.WARD}>Ward</SelectItem>
                  <SelectItem value={ORG_LEVELS.UNIT}>Unit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {!movementId ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a movement to view organizations
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Error loading organizations: {error.message}
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizations found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Privacy</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org: any) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{formatLevel(org.level)}</Badge>
                      </TableCell>
                      <TableCell>{org.memberCount || 0}</TableCell>
                      <TableCell>
                        <Badge variant={org.isPrivate ? 'secondary' : 'outline'}>
                          {org.isPrivate ? 'Private' : 'Public'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={org.isActive ? 'success' : 'destructive'}>
                          {org.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {formatLocation(org)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/orgs/${org.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/orgs/${org.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/orgs/${org.id}/settings`)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(org.id, org.name)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {offset + 1} to {offset + organizations.length} organizations
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={organizations.length < ITEMS_PER_PAGE}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, orgId: null, orgName: null })
        }
        title="Delete Organization"
        description={`Are you sure you want to delete ${confirmDialog.orgName}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
