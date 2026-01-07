'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { Badge } from '@/ui/badge'
import { GET_ALL_POSTS, GET_SUPPORT_GROUPS } from '@/lib/graphql/queries/admin'
import {
  GET_COUNTRIES,
  GET_GEOPOLITICAL_ZONES,
  GET_STATES,
  GET_SENATORIAL_ZONES,
  GET_FEDERAL_CONSTITUENCIES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS
} from '@/lib/graphql/queries/locations'
import { DELETE_POST } from '@/lib/graphql/mutations/posts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/dropdown-menu'
import {
  MoreVertical,
  Trash2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Share2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Video,
  BarChart3,
  FileText,
  X
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { ConfirmDialog } from '@/components/modals/ConfirmDialog'
import { PostType } from '@mobilizer/shared'

interface Post {
  id: string
  content: string
  type: string
  author: {
    id: string
    firstName: string
    lastName: string
    displayName: string
    avatar: string
  }
  organization?: {
    id: string
    name: string
    logo: string
  }
  likeCount: number
  commentCount: number
  shareCount: number
  viewCount: number
  mediaUrls?: string[]
  createdAt: string
  updatedAt: string
  poll?: {
    id: string
    question: string
    options: Array<{
      id: string
      text: string
      voteCount: number
    }>
  }
}

interface Organization {
  id: string
  name: string
  logo: string
}

interface Location {
  id: string
  name: string
  code?: string
}

export default function AdminPostsPage() {
  const { user } = useAuthStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const postsPerPage = 20

  // Filter states
  const [selectedOrg, setSelectedOrg] = useState<string>('all')
  const [selectedPostType, setSelectedPostType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')

  // Location filter states
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedGeoZone, setSelectedGeoZone] = useState<string>('all')
  const [selectedState, setSelectedState] = useState<string>('all')
  const [selectedSenatorialZone, setSelectedSenatorialZone] = useState<string>('all')
  const [selectedFederalConstituency, setSelectedFederalConstituency] = useState<string>('all')
  const [selectedLga, setSelectedLga] = useState<string>('all')
  const [selectedWard, setSelectedWard] = useState<string>('all')
  const [selectedPollingUnit, setSelectedPollingUnit] = useState<string>('all')

  // Show advanced filters
  const [showFilters, setShowFilters] = useState(false)

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    postId: string | null
  }>({
    open: false,
    postId: null,
  })

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      setCurrentPage(1)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch countries
  const { data: countriesData } = useQuery(GET_COUNTRIES)
  const countries: Location[] = countriesData?.countries || []

  // Fetch geopolitical zones
  const { data: geoZonesData } = useQuery(GET_GEOPOLITICAL_ZONES, {
    variables: { countryId: selectedCountry !== 'all' ? selectedCountry : undefined },
    skip: selectedCountry === 'all',
  })
  const geoZones: Location[] = geoZonesData?.geopoliticalZones || []

  // Fetch states
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId: selectedCountry !== 'all' ? selectedCountry : undefined },
    skip: selectedCountry === 'all',
  })
  const states: Location[] = statesData?.states || []

  // Fetch senatorial zones
  const { data: senatorialZonesData } = useQuery(GET_SENATORIAL_ZONES, {
    variables: { stateId: selectedState !== 'all' ? selectedState : undefined },
    skip: selectedState === 'all',
  })
  const senatorialZones: Location[] = senatorialZonesData?.senatorialZones || []

  // Fetch federal constituencies
  const { data: federalConstituenciesData } = useQuery(GET_FEDERAL_CONSTITUENCIES, {
    variables: { stateId: selectedState !== 'all' ? selectedState : undefined },
    skip: selectedState === 'all',
  })
  const federalConstituencies: Location[] = federalConstituenciesData?.federalConstituencies || []

  // Fetch LGAs
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId: selectedState !== 'all' ? selectedState : undefined },
    skip: selectedState === 'all',
  })
  const lgas: Location[] = lgasData?.lgas || []

  // Fetch wards
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId: selectedLga !== 'all' ? selectedLga : undefined },
    skip: selectedLga === 'all',
  })
  const wards: Location[] = wardsData?.wards || []

  // Fetch polling units
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId: selectedWard !== 'all' ? selectedWard : undefined },
    skip: selectedWard === 'all',
  })
  const pollingUnits: Location[] = pollingUnitsData?.pollingUnits || []

  // Fetch support groups for filter
  const { data: orgsData } = useQuery(GET_SUPPORT_GROUPS, {
    variables: {
      filter: {
        movementId: user?.roles?.[0]?.movementId || '',
      },
      limit: 100,
      offset: 0,
    },
    skip: !user?.roles?.[0]?.movementId,
  })

  // Build filter object
  const buildFilter = () => {
    const filter: any = {}

    if (selectedOrg !== 'all') {
      filter.orgId = selectedOrg
    }

    if (selectedCountry !== 'all') {
      filter.countryId = selectedCountry
    }

    if (selectedState !== 'all') {
      filter.stateId = selectedState
    }

    if (selectedSenatorialZone !== 'all') {
      filter.senatorialZoneId = selectedSenatorialZone
    }

    if (selectedFederalConstituency !== 'all') {
      filter.federalConstituencyId = selectedFederalConstituency
    }

    if (selectedLga !== 'all') {
      filter.lgaId = selectedLga
    }

    if (selectedWard !== 'all') {
      filter.wardId = selectedWard
    }

    if (selectedPollingUnit !== 'all') {
      filter.pollingUnitId = selectedPollingUnit
    }

    return filter
  }

  // Fetch posts
  const { data, loading, error, refetch } = useQuery(GET_ALL_POSTS, {
    variables: {
      limit: postsPerPage,
      offset: (currentPage - 1) * postsPerPage,
      filter: buildFilter(),
    },
    fetchPolicy: 'network-only',
  })

  // Delete post mutation
  const [deletePost, { loading: deleting }] = useMutation(DELETE_POST, {
    onCompleted: () => {
      refetch()
    },
    onError: (error) => {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    },
  })

  const handleDeleteClick = (postId: string) => {
    setConfirmDialog({
      open: true,
      postId,
    })
  }

  const handleConfirmDelete = async () => {
    if (confirmDialog.postId) {
      try {
        await deletePost({ variables: { postId: confirmDialog.postId } })
        setConfirmDialog({ open: false, postId: null })
      } catch (error) {
        console.error('Delete error:', error)
      }
    }
  }

  const posts: Post[] = data?.feed || []
  const organizations: Organization[] = orgsData?.organizations || []

  // Client-side filtering for search and post type
  const filteredPosts = posts.filter((post) => {
    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      const contentMatch = post.content.toLowerCase().includes(searchLower)
      const authorMatch = `${post.author.firstName} ${post.author.lastName}`
        .toLowerCase()
        .includes(searchLower)
      if (!contentMatch && !authorMatch) return false
    }

    // Post type filter
    if (selectedPostType !== 'all' && post.type !== selectedPostType) {
      return false
    }

    // Date range filter
    const postDate = new Date(post.createdAt)
    if (dateFrom && postDate < new Date(dateFrom)) {
      return false
    }
    if (dateTo && postDate > new Date(dateTo + 'T23:59:59')) {
      return false
    }

    return true
  })

  const totalPosts = filteredPosts.length
  const totalPages = Math.ceil(totalPosts / postsPerPage)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  )

  // Removed truncateContent function - showing full content now

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case PostType.IMAGE:
        return <ImageIcon className="h-4 w-4" />
      case PostType.VIDEO:
        return <Video className="h-4 w-4" />
      case PostType.POLL:
        return <BarChart3 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getPostTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      [PostType.TEXT]: 'bg-blue-100 text-blue-800',
      [PostType.IMAGE]: 'bg-green-100 text-green-800',
      [PostType.VIDEO]: 'bg-purple-100 text-purple-800',
      [PostType.POLL]: 'bg-orange-100 text-orange-800',
    }

    return (
      <Badge className={`${colors[type] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
        {getPostTypeIcon(type)}
        <span className="capitalize">{type}</span>
      </Badge>
    )
  }

  const clearFilters = () => {
    setSelectedOrg('all')
    setSelectedPostType('all')
    setDateFrom('')
    setDateTo('')
    setSelectedCountry('all')
    setSelectedGeoZone('all')
    setSelectedState('all')
    setSelectedSenatorialZone('all')
    setSelectedFederalConstituency('all')
    setSelectedLga('all')
    setSelectedWard('all')
    setSelectedPollingUnit('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    selectedOrg !== 'all' ||
    selectedPostType !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    selectedCountry !== 'all' ||
    selectedState !== 'all' ||
    selectedSenatorialZone !== 'all' ||
    selectedFederalConstituency !== 'all' ||
    selectedLga !== 'all' ||
    selectedWard !== 'all' ||
    selectedPollingUnit !== 'all' ||
    searchTerm !== ''

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Posts Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all posts across your organization
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Posts: {totalPosts}
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show All Filters'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts or authors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Post Type Filter */}
              <Select value={selectedPostType} onValueChange={setSelectedPostType}>
                <SelectTrigger>
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={PostType.TEXT}>Text</SelectItem>
                  <SelectItem value={PostType.IMAGE}>Image</SelectItem>
                  <SelectItem value={PostType.VIDEO}>Video</SelectItem>
                  <SelectItem value={PostType.POLL}>Poll</SelectItem>
                </SelectContent>
              </Select>

              {/* Organization Filter */}
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue placeholder="Support Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Support Groups</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showFilters && (
              <div className="space-y-4 pt-4 border-t">
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From Date</label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">To Date</label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>

                {/* Location Filters */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Location Filters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Country */}
                    <Select
                      value={selectedCountry}
                      onValueChange={(value) => {
                        setSelectedCountry(value)
                        setSelectedGeoZone('all')
                        setSelectedState('all')
                        setSelectedLga('all')
                        setSelectedWard('all')
                        setSelectedPollingUnit('all')
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.id}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Geopolitical Zone */}
                    <Select
                      value={selectedGeoZone}
                      onValueChange={setSelectedGeoZone}
                      disabled={selectedCountry === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Geopolitical Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Zones</SelectItem>
                        {geoZones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* State */}
                    <Select
                      value={selectedState}
                      onValueChange={(value) => {
                        setSelectedState(value)
                        setSelectedSenatorialZone('all')
                        setSelectedFederalConstituency('all')
                        setSelectedLga('all')
                        setSelectedWard('all')
                        setSelectedPollingUnit('all')
                      }}
                      disabled={selectedCountry === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Senatorial Zone */}
                    <Select
                      value={selectedSenatorialZone}
                      onValueChange={setSelectedSenatorialZone}
                      disabled={selectedState === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Senatorial Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Senatorial Zones</SelectItem>
                        {senatorialZones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id}>
                            {zone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Federal Constituency */}
                    <Select
                      value={selectedFederalConstituency}
                      onValueChange={setSelectedFederalConstituency}
                      disabled={selectedState === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Federal Constituency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Constituencies</SelectItem>
                        {federalConstituencies.map((constituency) => (
                          <SelectItem key={constituency.id} value={constituency.id}>
                            {constituency.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* LGA */}
                    <Select
                      value={selectedLga}
                      onValueChange={(value) => {
                        setSelectedLga(value)
                        setSelectedWard('all')
                        setSelectedPollingUnit('all')
                      }}
                      disabled={selectedState === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All LGAs</SelectItem>
                        {lgas.map((lga) => (
                          <SelectItem key={lga.id} value={lga.id}>
                            {lga.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Ward */}
                    <Select
                      value={selectedWard}
                      onValueChange={(value) => {
                        setSelectedWard(value)
                        setSelectedPollingUnit('all')
                      }}
                      disabled={selectedLga === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Wards</SelectItem>
                        {wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Polling Unit */}
                    <Select
                      value={selectedPollingUnit}
                      onValueChange={setSelectedPollingUnit}
                      disabled={selectedWard === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Polling Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Polling Units</SelectItem>
                        {pollingUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              <p>Error loading posts: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-4">
                Retry
              </Button>
            </div>
          ) : paginatedPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found matching your filters</p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline" className="mt-4">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Author</th>
                      <th className="text-left p-3 font-medium">Content</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium hidden xl:table-cell">
                        Organization
                      </th>
                      <th className="text-left p-3 font-medium hidden lg:table-cell">
                        Engagement
                      </th>
                      <th className="text-left p-3 font-medium">Date</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post) => (
                      <tr key={post.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={post.author.avatar} />
                              <AvatarFallback>
                                {`${post.author.firstName?.[0]}${post.author.lastName?.[0]}`.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {post.author.firstName} {post.author.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                @{post.author.displayName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="max-w-md max-h-32 overflow-y-auto">
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {post.content}
                            </p>
                          </div>
                          {post.mediaUrls && post.mediaUrls.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              +{post.mediaUrls.length} media file(s)
                            </p>
                          )}
                        </td>
                        <td className="p-3">{getPostTypeBadge(post.type)}</td>
                        <td className="p-3 hidden xl:table-cell">
                          {post.organization ? (
                            <div className="flex items-center gap-2">
                              {post.organization.logo && (
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={post.organization.logo} />
                                  <AvatarFallback>
                                    {post.organization.name[0]?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <span className="text-sm truncate max-w-[150px]">
                                {post.organization.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Personal</span>
                          )}
                        </td>
                        <td className="p-3 hidden lg:table-cell">
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" />
                              <span>{post.likeCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{post.commentCount}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share2 className="h-3 w-3" />
                              <span>{post.shareCount}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(post.createdAt)}
                          </p>
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => window.open(`/posts/${post.id}`, '_blank')}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Post
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(post.id)}
                                  className="text-red-600"
                                  disabled={deleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * postsPerPage + 1} to{' '}
                    {Math.min(currentPage * postsPerPage, totalPosts)} of {totalPosts} posts
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (currentPage <= 3) {
                          pageNum = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = currentPage - 2 + i
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            disabled={loading}
                            className="w-9"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, postId: null })}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone and will remove all associated comments, likes, and shares."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
