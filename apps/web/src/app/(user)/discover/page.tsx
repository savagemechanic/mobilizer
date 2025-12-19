'use client'

import { Card, CardContent } from '@/ui/card'

export default function DiscoverPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Discover</h1>

      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Discover new organizations and people</p>
        </CardContent>
      </Card>
    </div>
  )
}
