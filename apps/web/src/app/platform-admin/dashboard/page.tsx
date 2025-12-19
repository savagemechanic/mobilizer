'use client'

import { useQuery } from '@apollo/client'
import { Layers, Users, MessageSquare, Calendar, TrendingUp, UserPlus, Plus, Shield } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { GET_PLATFORM_STATS } from '@/lib/graphql/queries/platform-admin'
import { usePlatformAdminStore } from '@/store/platform-admin-store'
import { useEffect } from 'react'

export default function PlatformAdminDashboardPage() {
  const { data, loading, error } = useQuery(GET_PLATFORM_STATS)
  const setPlatformStats = usePlatformAdminStore((state) => state.setPlatformStats)

  useEffect(() => {
    if (data?.platformStats) {
      setPlatformStats(data.platformStats)
    }
  }, [data, setPlatformStats])

  const stats = data?.platformStats

  const mainStats = [
    {
      title: 'Total Movements',
      value: stats?.totalMovements || 0,
      icon: Layers,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Support Groups',
      value: stats?.totalSupportGroups || 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Posts',
      value: stats?.totalPosts || 0,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Active Today',
      value: stats?.activeUsersToday || 0,
      icon: TrendingUp,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      title: 'New This Week',
      value: stats?.newUsersThisWeek || 0,
      icon: UserPlus,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Platform Dashboard
        </h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Platform Dashboard
        </h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading platform statistics: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Platform Dashboard
        </h1>
        <div className="flex gap-2">
          <Link href="/platform-admin/movements/create">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Movement
            </Button>
          </Link>
          <Link href="/platform-admin/super-admins">
            <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
              <Shield className="h-4 w-4 mr-2" />
              Manage Admins
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow border-indigo-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Movement Summaries */}
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            Movement Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.movementSummaries && stats.movementSummaries.length > 0 ? (
            <div className="space-y-4">
              {stats.movementSummaries.map((movement: any) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <h3 className="font-semibold text-lg">{movement.name}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-gray-600">
                      <span>{movement.supportGroupsCount} Support Groups</span>
                      <span>{movement.membersCount} Members</span>
                    </div>
                  </div>
                  <Link href={`/platform-admin/movements/${movement.id}`}>
                    <Button variant="outline" size="sm" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Layers className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No movements created yet</p>
              <Link href="/platform-admin/movements/create">
                <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                  Create Your First Movement
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle>Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users Today</span>
                <span className="font-semibold text-indigo-600">{stats?.activeUsersToday || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New Users This Week</span>
                <span className="font-semibold text-purple-600">{stats?.newUsersThisWeek || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Engagement</span>
                <span className="font-semibold text-green-600">
                  {((stats?.totalPosts || 0) + (stats?.totalEvents || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/platform-admin/movements" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Layers className="h-4 w-4 mr-2" />
                  Manage Movements
                </Button>
              </Link>
              <Link href="/platform-admin/super-admins" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Super Admins
                </Button>
              </Link>
              <Link href="/platform-admin/users" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View All Users
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
