'use client'

import { Card, CardContent } from '@/ui/card'

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Notifications</h1>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>No notifications yet</p>
        </CardContent>
      </Card>
    </div>
  )
}
