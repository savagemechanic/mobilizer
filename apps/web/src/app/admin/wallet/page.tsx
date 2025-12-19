'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card'

export default function AdminWalletPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Wallet Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Wallet and transactions interface
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
