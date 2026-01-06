'use client'

import { useState } from 'react'
import { useQuery } from '@apollo/client'
import { Users, FileText, Calendar, TrendingUp, UserCheck, UserPlus, Sparkles, Globe, MapPin, Building2, Landmark, Vote } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card'
import { DashboardFilters } from '@/modules/admin'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import {
  GET_DASHBOARD_STATS,
  GET_MEMBER_ANALYTICS,
  GET_POST_ANALYTICS,
  GET_EVENT_ANALYTICS,
  GET_WORD_CLOUD,
  GET_AI_SUMMARY,
} from '@/lib/graphql/queries/admin'
import { useAuthStore } from '@/store/auth-store'
import { useUserRoles, getUserAdminScope } from '@/hooks/use-user-roles'

// Simple pie chart component using CSS
function SimplePieChart({ data, colors }: { data: { label: string; value: number }[]; colors: string[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return <p className="text-center text-muted-foreground text-sm">No data</p>

  let cumulativePercent = 0
  const segments = data.map((item, index) => {
    const percent = (item.value / total) * 100
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return {
      ...item,
      percent,
      startPercent,
      color: colors[index % colors.length],
    }
  })

  const gradientStops = segments
    .map((seg) => `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`)
    .join(', ')

  return (
    <div className="flex items-center gap-4">
      <div
        className="w-24 h-24 rounded-full flex-shrink-0"
        style={{
          background: `conic-gradient(${gradientStops})`,
        }}
      />
      <div className="space-y-1 text-sm">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span>{seg.label}: {seg.value} ({seg.percent.toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Word cloud component
function WordCloud({ words }: { words: { word: string; count: number }[] }) {
  if (!words?.length) return <p className="text-center text-muted-foreground">No words to display</p>

  const maxCount = Math.max(...words.map((w) => w.count))
  const minSize = 12
  const maxSize = 32

  return (
    <div className="flex flex-wrap gap-2 justify-center items-center min-h-[150px]">
      {words.slice(0, 30).map((item, idx) => {
        const size = minSize + ((item.count / maxCount) * (maxSize - minSize))
        const opacity = 0.5 + (item.count / maxCount) * 0.5
        return (
          <span
            key={idx}
            className="text-primary transition-all hover:scale-110 cursor-default"
            style={{
              fontSize: `${size}px`,
              opacity,
            }}
            title={`${item.word}: ${item.count} occurrences`}
          >
            {item.word}
          </span>
        )
      })}
    </div>
  )
}

export default function AdminDashboardPage() {
  // Get user and their admin scope
  const user = useAuthStore((state) => state.user)
  const { userRoles } = useUserRoles()
  const adminScope = getUserAdminScope(user, userRoles)

  // Filter state
  const [movementId, setMovementId] = useState<string | null>(null)
  const [supportGroupId, setSupportGroupId] = useState<string | null>(null)
  const [countryId, setCountryId] = useState<string | null>(null)
  const [geopoliticalZoneId, setGeopoliticalZoneId] = useState<string | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [senatorialZoneId, setSenatorialZoneId] = useState<string | null>(null)
  const [federalConstituencyId, setFederalConstituencyId] = useState<string | null>(null)
  const [lgaId, setLgaId] = useState<string | null>(null)
  const [wardId, setWardId] = useState<string | null>(null)
  const [pollingUnitId, setPollingUnitId] = useState<string | null>(null)
  const [gender, setGender] = useState<string | null>(null)
  const [profession, setProfession] = useState<string | null>(null)

  // Build org filter object
  const orgFilter = {
    ...(supportGroupId && { supportGroupId }),
    ...(countryId && { countryId }),
    ...(geopoliticalZoneId && { geopoliticalZoneId }),
    ...(stateId && { stateId }),
    ...(senatorialZoneId && { senatorialZoneId }),
    ...(federalConstituencyId && { federalConstituencyId }),
    ...(lgaId && { lgaId }),
    ...(wardId && { wardId }),
    ...(pollingUnitId && { pollingUnitId }),
    ...(gender && { gender }),
    ...(profession && { profession }),
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

  // Fetch word cloud
  const { data: wordCloudData, loading: wordCloudLoading } = useQuery(GET_WORD_CLOUD, {
    variables: {
      movementId: movementId || '',
      orgFilter: hasOrgFilter ? orgFilter : null,
    },
    skip: !movementId,
  })

  // Fetch AI summary
  const { data: aiSummaryData, loading: aiSummaryLoading } = useQuery(GET_AI_SUMMARY, {
    variables: {
      movementId: movementId || '',
    },
    skip: !movementId,
  })

  const stats = statsData?.dashboardStats
  const memberAnalytics = memberData?.memberAnalytics
  const postAnalytics = postData?.postAnalytics
  const eventAnalytics = eventData?.eventAnalytics
  const wordCloud = wordCloudData?.wordCloud
  const aiSummary = aiSummaryData?.aiSummary

  const isLoading = statsLoading || memberLoading || postLoading || eventLoading

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers?.toLocaleString() || '0',
      icon: Users,
      description: 'Registered members',
      color: 'text-blue-500',
    },
    {
      title: 'Support Groups',
      value: stats?.totalSupportGroups?.toLocaleString() || '0',
      icon: TrendingUp,
      description: 'Active support groups',
      color: 'text-green-500',
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts?.toLocaleString() || '0',
      icon: FileText,
      description: 'Published posts',
      color: 'text-purple-500',
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents?.toLocaleString() || '0',
      icon: Calendar,
      description: 'Created events',
      color: 'text-orange-500',
    },
    {
      title: 'Active Members',
      value: stats?.activeMembers?.toLocaleString() || '0',
      icon: UserCheck,
      description: 'Last 30 days',
      color: 'text-cyan-500',
    },
    {
      title: 'New This Month',
      value: stats?.newMembersThisMonth?.toLocaleString() || '0',
      icon: UserPlus,
      description: 'Members joined',
      color: 'text-pink-500',
    },
  ]

  // Chart colors
  const genderColors = ['#3b82f6', '#ec4899', '#8b5cf6', '#94a3b8']
  const geoZoneColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
  const professionColors = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

  // Prepare chart data
  const genderData = memberAnalytics?.genderBreakdown
    ? [
        { label: 'Male', value: memberAnalytics.genderBreakdown.male },
        { label: 'Female', value: memberAnalytics.genderBreakdown.female },
        { label: 'Other', value: memberAnalytics.genderBreakdown.other },
        { label: 'Not Specified', value: memberAnalytics.genderBreakdown.notSpecified },
      ].filter((d) => d.value > 0)
    : []

  const geoZoneData = memberAnalytics?.geopoliticalZoneBreakdown?.map((z: any) => ({
    label: z.name,
    value: z.count,
  })) || []

  const professionData = memberAnalytics?.professionBreakdown?.slice(0, 8).map((p: any) => ({
    label: p.profession,
    value: p.count,
  })) || []

  // Determine role badge text
  const getRoleBadge = () => {
    if (adminScope.isPlatformAdmin) {
      return { text: 'Platform Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }
    }
    if (adminScope.isSuperAdmin && adminScope.movementName) {
      return { text: `Super Admin - ${adminScope.movementName}`, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' }
    }
    if (adminScope.isSupportGroupAdmin && adminScope.supportGroupName) {
      return { text: `Group Admin - ${adminScope.supportGroupName}`, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
    }
    return null
  }

  const roleBadge = getRoleBadge()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          {roleBadge && (
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.color}`}>
                {roleBadge.text}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>
            {adminScope.isPlatformAdmin
              ? 'Filter dashboard data by movement, support group, and location'
              : adminScope.isSuperAdmin
              ? 'Filter dashboard data by support group and location'
              : 'Filter dashboard data by location and demographics'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DashboardFilters
            movementId={movementId}
            supportGroupId={supportGroupId}
            countryId={countryId}
            geopoliticalZoneId={geopoliticalZoneId}
            stateId={stateId}
            senatorialZoneId={senatorialZoneId}
            federalConstituencyId={federalConstituencyId}
            lgaId={lgaId}
            wardId={wardId}
            pollingUnitId={pollingUnitId}
            gender={gender}
            profession={profession}
            onMovementChange={setMovementId}
            onSupportGroupChange={setSupportGroupId}
            onCountryChange={setCountryId}
            onGeopoliticalZoneChange={setGeopoliticalZoneId}
            onStateChange={setStateId}
            onSenatorialZoneChange={setSenatorialZoneId}
            onFederalConstituencyChange={setFederalConstituencyId}
            onLgaChange={setLgaId}
            onWardChange={setWardId}
            onPollingUnitChange={setPollingUnitId}
            onGenderChange={setGender}
            onProfessionChange={setProfession}
            showZoneFilters={true}
          />
        </CardContent>
      </Card>

      {!movementId && adminScope.isPlatformAdmin ? (
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
          {/* AI Summary Card */}
          <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-500" />
                AI Summary
              </CardTitle>
              <CardDescription>AI-generated overview of your movement</CardDescription>
            </CardHeader>
            <CardContent>
              {aiSummaryLoading ? (
                <div className="animate-pulse h-20 bg-slate-200 dark:bg-slate-800 rounded" />
              ) : (
                <p className="text-sm leading-relaxed">{aiSummary || 'No summary available'}</p>
              )}
            </CardContent>
          </Card>

          {/* Summary Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryCards.map((card) => {
              const Icon = card.icon
              return (
                <Card key={card.title}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="text-xs text-muted-foreground">{card.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Coverage Stats Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Coverage</CardTitle>
              <CardDescription>Member presence across locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Globe className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.countriesCovered || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Countries</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <MapPin className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.statesCovered || 0} <span className="text-sm font-normal text-muted-foreground">of {stats?.totalStates || 37}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">States</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Building2 className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.lgasCovered || 0} <span className="text-sm font-normal text-muted-foreground">of {stats?.totalLgas || 774}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">LGAs</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Landmark className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.wardsCovered || 0} <span className="text-sm font-normal text-muted-foreground">of {stats?.totalWards?.toLocaleString() || '0'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Wards</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <Vote className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.pollingUnitsCovered || 0} <span className="text-sm font-normal text-muted-foreground">of {stats?.totalPollingUnits?.toLocaleString() || '0'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">Polling Units</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Gender Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={genderData} colors={genderColors} />
              </CardContent>
            </Card>

            {/* Geopolitical Zone Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Geopolitical Zones</CardTitle>
              </CardHeader>
              <CardContent>
                {geoZoneData.length > 0 ? (
                  <SimplePieChart data={geoZoneData} colors={geoZoneColors} />
                ) : (
                  <p className="text-center text-muted-foreground text-sm">No zone data available</p>
                )}
              </CardContent>
            </Card>

            {/* Profession Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Top Professions</CardTitle>
              </CardHeader>
              <CardContent>
                {professionData.length > 0 ? (
                  <SimplePieChart data={professionData} colors={professionColors} />
                ) : (
                  <p className="text-center text-muted-foreground text-sm">No profession data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Word Cloud & Analytics Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Word Cloud */}
            <Card>
              <CardHeader>
                <CardTitle>Trending Topics</CardTitle>
                <CardDescription>Most frequently used words in posts</CardDescription>
              </CardHeader>
              <CardContent>
                {wordCloudLoading ? (
                  <div className="animate-pulse h-32 bg-slate-200 dark:bg-slate-800 rounded" />
                ) : (
                  <WordCloud words={wordCloud || []} />
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
                  <div className="space-y-3">
                    {memberAnalytics.ageBreakdown.map((age: { range: string; count: number }) => {
                      const total = memberAnalytics.ageBreakdown.reduce((s: number, a: any) => s + a.count, 0)
                      const percent = total > 0 ? (age.count / total) * 100 : 0
                      return (
                        <div key={age.range}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>{age.range}</span>
                            <span className="font-medium">{age.count}</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No age data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Post & Event Analytics */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Post Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Post Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {postAnalytics ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{postAnalytics.totalPosts}</p>
                        <p className="text-xs text-muted-foreground">Total Posts</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{postAnalytics.totalPolls}</p>
                        <p className="text-xs text-muted-foreground">Polls</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{postAnalytics.totalLikes}</p>
                        <p className="text-xs text-muted-foreground">Total Likes</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{postAnalytics.totalComments}</p>
                        <p className="text-xs text-muted-foreground">Comments</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span>Avg. Likes/Post</span>
                      <span className="font-medium">{postAnalytics.averageLikesPerPost}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Avg. Comments/Post</span>
                      <span className="font-medium">{postAnalytics.averageCommentsPerPost}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No post data available</p>
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{eventAnalytics.totalEvents}</p>
                        <p className="text-xs text-muted-foreground">Total Events</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{eventAnalytics.upcomingEvents}</p>
                        <p className="text-xs text-muted-foreground">Upcoming</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{eventAnalytics.pastEvents}</p>
                        <p className="text-xs text-muted-foreground">Past Events</p>
                      </div>
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <p className="text-2xl font-bold">{eventAnalytics.totalRSVPs}</p>
                        <p className="text-xs text-muted-foreground">Total RSVPs</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <span>Avg. RSVPs/Event</span>
                      <span className="font-medium">{eventAnalytics.averageRSVPsPerEvent}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No event data available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Location Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Top Locations (by State)</CardTitle>
            </CardHeader>
            <CardContent>
              {memberAnalytics?.locationBreakdown?.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  {memberAnalytics.locationBreakdown.map((location: { name: string; count: number }, idx: number) => (
                    <div
                      key={location.name}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{idx + 1}</span>
                        <span className="text-sm font-medium">{location.name}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{location.count}</span>
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
                <CardTitle>Support Group Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  {stats.levelDistribution.map((level: { level: string; count: number }) => (
                    <div
                      key={level.level}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-sm font-medium capitalize">{level.level.replace('_', ' ').toLowerCase()}</span>
                      <span className="text-sm font-bold text-primary">{level.count}</span>
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
