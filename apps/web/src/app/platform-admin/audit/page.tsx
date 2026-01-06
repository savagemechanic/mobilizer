'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Badge } from '@/ui/badge'
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
import {
  GET_AUDIT_LOGS,
  GET_AUDIT_ACTION_TYPES,
  GET_AUDIT_ENTITY_TYPES,
} from '@/lib/graphql/queries/audit'
import { GET_MOVEMENTS } from '@/lib/graphql/queries/platform-admin'
import { EXPORT_AUDIT_LOGS } from '@/lib/graphql/mutations/audit'
import { Download, ChevronDown, ChevronUp, Search, Filter, X, Building2, Users } from 'lucide-react'

interface AuditLog {
  id: string
  userId?: string
  user?: {
    id: string
    firstName: string
    lastName: string
    displayName: string
    email: string
    avatar?: string
  }
  action: string
  entityType: string
  entityId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface AuditLogPaginated {
  data: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface Movement {
  id: string
  name: string
  slug: string
  logo?: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-700 dark:text-green-400',
  UPDATE: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-400',
  LOGIN: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  LOGOUT: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  EMAIL_VERIFY: 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  PASSWORD_CHANGE: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  PERMISSION_GRANT: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  PERMISSION_REVOKE: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
  PLATFORM_ADMIN_GRANT: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
  PLATFORM_ADMIN_REVOKE: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  SUPER_ADMIN_ASSIGN: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  SUPER_ADMIN_REVOKE: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400',
  MOVEMENT_CREATE: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  MOVEMENT_UPDATE: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  MOVEMENT_DELETE: 'bg-red-600/10 text-red-800 dark:text-red-400',
}

export default function PlatformAdminAuditPage() {
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Filter state
  const [movementFilter, setMovementFilter] = useState<string>('')
  const [organizationFilter, setOrganizationFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [userSearchQuery, setUserSearchQuery] = useState<string>('')
  const [ipAddressFilter, setIpAddressFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Build filter object
  const filter: any = {}
  if (movementFilter) filter.movementId = movementFilter
  if (organizationFilter) filter.organizationId = organizationFilter
  if (actionFilter) filter.action = actionFilter
  if (entityTypeFilter) filter.entityType = entityTypeFilter
  if (userSearchQuery) filter.search = userSearchQuery
  if (ipAddressFilter) filter.ipAddress = ipAddressFilter
  if (startDate) filter.startDate = new Date(startDate).toISOString()
  if (endDate) filter.endDate = new Date(endDate).toISOString()

  // GraphQL queries
  const { data: auditData, loading: auditLoading, error: auditError } = useQuery<{
    auditLogs: AuditLogPaginated
  }>(GET_AUDIT_LOGS, {
    variables: {
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      pagination: { page, limit, sortBy: 'createdAt', sortOrder: 'desc' },
    },
    fetchPolicy: 'network-only',
  })

  const { data: actionTypesData } = useQuery<{ auditActionTypes: string[] }>(
    GET_AUDIT_ACTION_TYPES
  )

  const { data: entityTypesData } = useQuery<{ auditEntityTypes: string[] }>(
    GET_AUDIT_ENTITY_TYPES
  )

  const { data: movementsData } = useQuery<{ movements: Movement[] }>(GET_MOVEMENTS, {
    variables: { limit: 100, offset: 0 },
  })

  const [exportAuditLogs, { loading: exportLoading }] = useMutation(EXPORT_AUDIT_LOGS)

  // Handlers
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const { data } = await exportAuditLogs({
        variables: {
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          format,
        },
      })

      if (data?.exportAuditLogs?.url) {
        // Open download link
        window.open(data.exportAuditLogs.url, '_blank')
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  const clearFilters = () => {
    setMovementFilter('')
    setOrganizationFilter('')
    setActionFilter('')
    setEntityTypeFilter('')
    setUserSearchQuery('')
    setIpAddressFilter('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasActiveFilters =
    movementFilter ||
    organizationFilter ||
    actionFilter ||
    entityTypeFilter ||
    userSearchQuery ||
    ipAddressFilter ||
    startDate ||
    endDate

  const auditLogs = auditData?.auditLogs?.data || []
  const totalPages = auditData?.auditLogs?.totalPages || 1
  const total = auditData?.auditLogs?.total || 0

  // Extract movement and organization from metadata
  const getMovementFromMetadata = (log: AuditLog): string | null => {
    if (!log.metadata) return null
    return log.metadata.movementName || log.metadata.movement?.name || null
  }

  const getOrganizationFromMetadata = (log: AuditLog): string | null => {
    if (!log.metadata) return null
    return log.metadata.organizationName || log.metadata.organization?.name || null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Platform Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Track all activities and changes across the entire platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
            className="border-indigo-200 hover:bg-indigo-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exportLoading}
            className="border-indigo-200 hover:bg-indigo-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card className="border-indigo-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Activity Logs
              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                {total}
              </Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-indigo-200 hover:bg-indigo-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border border-indigo-100 rounded-lg space-y-4 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Movement Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    Movement
                  </label>
                  <Select value={movementFilter} onValueChange={setMovementFilter}>
                    <SelectTrigger className="border-indigo-200">
                      <SelectValue placeholder="All movements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All movements</SelectItem>
                      {movementsData?.movements?.map((movement) => (
                        <SelectItem key={movement.id} value={movement.id}>
                          {movement.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Organization Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    Organization ID
                  </label>
                  <Input
                    placeholder="Enter organization ID..."
                    value={organizationFilter}
                    onChange={(e) => setOrganizationFilter(e.target.value)}
                    className="border-indigo-200"
                  />
                </div>

                {/* User Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Search className="h-4 w-4 text-indigo-600" />
                    User Search
                  </label>
                  <Input
                    placeholder="Search by user name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="border-indigo-200"
                  />
                </div>

                {/* Action Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Action Type
                  </label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="border-indigo-200">
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All actions</SelectItem>
                      {actionTypesData?.auditActionTypes?.map((action) => (
                        <SelectItem key={action} value={action}>
                          {action.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Entity Type
                  </label>
                  <Select
                    value={entityTypeFilter}
                    onValueChange={setEntityTypeFilter}
                  >
                    <SelectTrigger className="border-indigo-200">
                      <SelectValue placeholder="All entities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All entities</SelectItem>
                      {entityTypesData?.auditEntityTypes?.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* IP Address Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    IP Address
                  </label>
                  <Input
                    placeholder="Filter by IP..."
                    value={ipAddressFilter}
                    onChange={(e) => setIpAddressFilter(e.target.value)}
                    className="border-indigo-200"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-indigo-200"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-indigo-200"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="border-indigo-300 hover:bg-indigo-100"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {auditLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : auditError ? (
            <div className="text-center py-12">
              <p className="text-destructive font-medium">
                Error loading audit logs
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {auditError.message}
              </p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
              {hasActiveFilters && ' matching the selected filters'}
            </div>
          ) : (
            <>
              {/* Audit Logs Table */}
              <div className="border border-indigo-100 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-indigo-50 to-purple-50">
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity Type</TableHead>
                        <TableHead>Entity ID</TableHead>
                        <TableHead>Movement</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>IP Address</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map((log) => {
                        const movement = getMovementFromMetadata(log)
                        const organization = getOrganizationFromMetadata(log)

                        return (
                          <>
                            <TableRow
                              key={log.id}
                              className="cursor-pointer hover:bg-indigo-50/50 transition-colors"
                              onClick={() => toggleRowExpansion(log.id)}
                            >
                              <TableCell>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  {expandedRows.has(log.id) ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="text-sm font-medium">
                                    {new Date(log.createdAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(log.createdAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {log.user ? (
                                  <div>
                                    <div className="font-medium text-sm">
                                      {log.user.firstName} {log.user.lastName}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {log.user.email}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-sm">System</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    ACTION_COLORS[log.action] ||
                                    'bg-gray-500/10 text-gray-700'
                                  }
                                >
                                  {log.action.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {log.entityType}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {log.entityId ? (
                                  <span className="truncate block max-w-[120px]">
                                    {log.entityId}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {movement ? (
                                  <span className="text-sm font-medium text-indigo-700">
                                    {movement}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {organization ? (
                                  <span className="text-sm text-purple-700">
                                    {organization}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {log.ipAddress || (
                                  <span className="text-muted-foreground/50">—</span>
                                )}
                              </TableCell>
                            </TableRow>

                            {/* Expandable Row for Metadata */}
                            {expandedRows.has(log.id) && (
                              <TableRow>
                                <TableCell colSpan={9} className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30">
                                  <div className="p-4 space-y-3">
                                    <h4 className="font-semibold text-sm text-indigo-900">
                                      Additional Details
                                    </h4>

                                    {log.userAgent && (
                                      <div>
                                        <span className="text-sm font-medium text-gray-700">
                                          User Agent:
                                        </span>
                                        <p className="text-sm text-muted-foreground mt-1 font-mono">
                                          {log.userAgent}
                                        </p>
                                      </div>
                                    )}

                                    {log.metadata && (
                                      <div>
                                        <span className="text-sm font-medium text-gray-700">
                                          Metadata:
                                        </span>
                                        <pre className="mt-2 text-xs bg-white p-3 rounded border border-indigo-100 overflow-x-auto">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    )}

                                    {!log.metadata && !log.userAgent && (
                                      <p className="text-sm text-muted-foreground italic">
                                        No additional details available
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total logs)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="border-indigo-200 hover:bg-indigo-50"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="border-indigo-200 hover:bg-indigo-50"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
