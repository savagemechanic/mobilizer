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
import { EXPORT_AUDIT_LOGS } from '@/lib/graphql/mutations/audit'
import { Download, ChevronDown, ChevronUp, Search, Filter, X } from 'lucide-react'

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

export default function AdminAuditPage() {
  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(20)

  // Filter state
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [showFilters, setShowFilters] = useState(false)

  // Expandable rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Build filter object
  const filter: any = {}
  if (actionFilter) filter.action = actionFilter
  if (entityTypeFilter) filter.entityType = entityTypeFilter
  if (searchQuery) filter.search = searchQuery
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
    setActionFilter('')
    setEntityTypeFilter('')
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  const hasActiveFilters =
    actionFilter || entityTypeFilter || searchQuery || startDate || endDate

  const auditLogs = auditData?.auditLogs?.data || []
  const totalPages = auditData?.auditLogs?.totalPages || 1
  const total = auditData?.auditLogs?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Track all system activities and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={exportLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Logs ({total})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Search User
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Action Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Action Type
                  </label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
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
                    <SelectTrigger>
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

                {/* Start Date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <>
                        <TableRow
                          key={log.id}
                          className="cursor-pointer"
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
                            <Badge
                              className={
                                ACTION_COLORS[log.action] ||
                                'bg-gray-500/10 text-gray-700'
                              }
                            >
                              {log.action.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.entityType}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {log.entityId ? (
                              <span className="truncate block max-w-[150px]">
                                {log.entityId}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div>
                                <div className="font-medium">
                                  {log.user.firstName} {log.user.lastName}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {log.user.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">System</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ipAddress || (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-sm">
                                {new Date(log.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(log.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expandable Row for Metadata */}
                        {expandedRows.has(log.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-muted/30">
                              <div className="p-4 space-y-3">
                                <h4 className="font-semibold text-sm">Details</h4>

                                {log.userAgent && (
                                  <div>
                                    <span className="text-sm font-medium">
                                      User Agent:
                                    </span>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {log.userAgent}
                                    </p>
                                  </div>
                                )}

                                {log.metadata && (
                                  <div>
                                    <span className="text-sm font-medium">
                                      Metadata:
                                    </span>
                                    <pre className="mt-2 text-xs bg-background p-3 rounded border overflow-x-auto">
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
                    ))}
                  </TableBody>
                </Table>
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
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
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
