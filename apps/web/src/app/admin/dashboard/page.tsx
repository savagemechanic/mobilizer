'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Users, FileText, Calendar, TrendingUp, UserCheck, UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { DashboardFilters } from '@/modules/admin'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import {
  GET_DASHBOARD_STATS,
  GET_MEMBER_ANALYTICS,
  GET_POST_ANALYTICS,
  GET_EVENT_ANALYTICS,
} from '@/lib/graphql/queries/admin'

export default function AdminDashboardPage() {
  // Filter state
  const [movementId, setMovementId] = useState<string | null>(null)
  const [supportGroupId, setSupportGroupId] = useState<string | null>(null)
  const [countryId, setCountryId] = useState<string | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [lgaId, setLgaId] = useState<string | null>(null)
  const [wardId, setWardId] = useState<string | null>(null)
  const [pollingUnitId, setPollingUnitId] = useState<string | null>(null)

  // Build org filter object
  const orgFilter = {
    ...(supportGroupId && { supportGroupId }),
    ...(countryId && { countryId }),
    ...(stateId && { stateId }),
    ...(lgaId && { lgaId }),
    ...(wardId && { wardId }),
    ...(pollingUnitId && { pollingUnitId }),
  }

  const hasOrgFilter = Object.keys(orgFilter).length > 0

  // Fetch dashboard stats
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, {
    variables: {
      movementId: movementId || '',
      orgFilter: hasOrgFilter ? orgFilter : null,
    },
    skip: !movementId,
  })

  // Fetch member analytics
  const { data: memberData, loading: memberLoading } = useQuery(GET_MEMBER_ANALYTICS, {
    variables: {
      movementId: movementId || '',
      orgFilter: hasOrgFilter ? orgFilter : null,
    },
    skip: !movementId,
  })

  // Fetch post analytics
  const { data: postData, loading: postLoading } = useQuery(GET_POST_ANALYTICS, {
    variables: {
      movementId: movementId || '',
      orgFilter: hasOrgFilter ? orgFilter : null,
    },
    skip: !movementId,
  })

  // Fetch event analytics
  const { data: eventData, loading: eventLoading } = useQuery(GET_EVENT_ANALYTICS, {
    variables: {
      movementId: movementId || '',
      orgFilter: hasOrgFilter ? orgFilter : null,
    },
    skip: !movementId,
  })

  const stats = statsData?.dashboardStats
  const memberAnalytics = memberData?.memberAnalytics
  const postAnalytics = postData?.postAnalytics
  const eventAnalytics = eventData?.eventAnalytics

  const isLoading = statsLoading || memberLoading || postLoading || eventLoading

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers?.toLocaleString() || '0',
      icon: Users,
      description: 'Registered members',
    },
    {
      title: 'Support Groups',
      value: stats?.totalSupportGroups?.toLocaleString() || '0',
      icon: TrendingUp,
      description: 'Active support groups',
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts?.toLocaleString() || '0',
      icon: FileText,
      description: 'Published posts',
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents?.toLocaleString() || '0',
      icon: Calendar,
      description: 'Created events',
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers?.toLocaleString() || '0',
      icon: UserCheck,
      description: 'Last 30 days',
    },
    {
      title: 'New This Month',
      value: stats?.newMembersThisMonth?.toLocaleString() || '0',
      icon: UserPlus,
      description: 'Members joined',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <DashboardFilters
            movementId={movementId}
            supportGroupId={supportGroupId}
            countryId={countryId}
            stateId={stateId}
            lgaId={lgaId}
            wardId={wardId}
            pollingUnitId={pollingUnitId}
            onMovementChange={setMovementId}
            onSupportGroupChange={setSupportGroupId}
            onCountryChange={setCountryId}
            onStateChange={setStateId}
            onLgaChange={setLgaId}
            onWardChange={setWardId}
            onPollingUnitChange={setPollingUnitId}
          />
        </CardContent>
      </Card>

      {!movementId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select a movement to view dashboard statistics
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Summary Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Analytics Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gender Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {memberAnalytics?.genderBreakdown ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Male</span>
                      <span className="font-medium">{memberAnalytics.genderBreakdown.male}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Female</span>
                      <span className="font-medium">{memberAnalytics.genderBreakdown.female}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Other</span>
                      <span className="font-medium">{memberAnalytics.genderBreakdown.other}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Not Specified</span>
                      <span className="font-medium">{memberAnalytics.genderBreakdown.notSpecified}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Age Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {memberAnalytics?.ageBreakdown?.length > 0 ? (
                  <div className="space-y-4">
                    {memberAnalytics.ageBreakdown.map((age: { range: string; count: number }) => (
                      <div key={age.range} className="flex items-center justify-between">
                        <span className="text-sm">{age.range}</span>
                        <span className="font-medium">{age.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Post Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Post Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {postAnalytics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Posts</span>
                      <span className="font-medium">{postAnalytics.totalPosts}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Likes</span>
                      <span className="font-medium">{postAnalytics.totalLikes}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Comments</span>
                      <span className="font-medium">{postAnalytics.totalComments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg. Likes/Post</span>
                      <span className="font-medium">{postAnalytics.averageLikesPerPost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Polls</span>
                      <span className="font-medium">{postAnalytics.totalPolls}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Event Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Event Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {eventAnalytics ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Events</span>
                      <span className="font-medium">{eventAnalytics.totalEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Upcoming Events</span>
                      <span className="font-medium">{eventAnalytics.upcomingEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Past Events</span>
                      <span className="font-medium">{eventAnalytics.pastEvents}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total RSVPs</span>
                      <span className="font-medium">{eventAnalytics.totalRSVPs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg. RSVPs/Event</span>
                      <span className="font-medium">{eventAnalytics.averageRSVPsPerEvent}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Top Locations</CardTitle>
            </CardHeader>
            <CardContent>
              {memberAnalytics?.locationBreakdown?.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {memberAnalytics.locationBreakdown.map((location: { name: string; count: number }) => (
                    <div key={location.name} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">{location.name}</span>
                      <span className="text-muted-foreground">{location.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No location data available</p>
              )}
            </CardContent>
          </Card>

          {/* Level Distribution */}
          {stats?.levelDistribution?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Organization Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  {stats.levelDistribution.map((level: { level: string; count: number }) => (
                    <div key={level.level} className="flex items-center justify-between rounded-lg border p-3">
                      <span className="text-sm font-medium">{level.level.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{level.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
