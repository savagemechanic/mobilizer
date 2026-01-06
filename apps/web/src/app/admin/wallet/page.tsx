'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Send,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowDown
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/ui/tabs'
import { Label } from '@/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/hooks/use-toast'
import {
  GET_ORG_WALLET,
  GET_WALLET_STATS,
  GET_WALLET_TRANSACTIONS,
  GET_USER_MOVEMENTS,
  GET_MOVEMENT_WALLET
} from '@/lib/graphql/queries/wallet'
import {
  FUND_ORG_WALLET,
  FUND_MOVEMENT_WALLET,
  FUND_ORG_FROM_MOVEMENT
} from '@/lib/graphql/mutations/wallet'
import { GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/admin'

const ITEMS_PER_PAGE = 20

interface Transaction {
  id: string
  type: 'CREDIT' | 'DEBIT'
  amount: number
  balanceBefore: number
  balanceAfter: number
  status: string
  reference: string
  description?: string
  recipientUserId?: string
  recipient?: {
    id: string
    firstName: string
    lastName: string
    displayName?: string
    avatar?: string
  }
  createdAt: string
}

export default function AdminWalletPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { isPlatformAdmin, isSuperAdmin } = usePermissions()
  const { toast } = useToast()

  // State
  const [viewMode, setViewMode] = useState<'movement' | 'organization'>('organization')
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Fund wallet modal state
  const [showFundModal, setShowFundModal] = useState(false)
  const [fundAmount, setFundAmount] = useState('')
  const [fundDescription, setFundDescription] = useState('')

  // Fund org from movement modal state
  const [showFundOrgModal, setShowFundOrgModal] = useState(false)
  const [fundOrgAmount, setFundOrgAmount] = useState('')
  const [fundOrgDescription, setFundOrgDescription] = useState('')
  const [targetOrgId, setTargetOrgId] = useState<string | null>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch user's movements (for Super Admins)
  const { data: movementsData } = useQuery(GET_USER_MOVEMENTS, {
    skip: !isSuperAdmin,
  })
  const movements = movementsData?.userMovements || []

  // Fetch user's organizations
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS)
  const organizations = orgsData?.myOrganizations || []

  // Auto-select first movement if Super Admin
  useEffect(() => {
    if (isSuperAdmin && movements.length > 0 && !selectedMovementId) {
      setSelectedMovementId(movements[0].id)
      setViewMode('movement')
    }
  }, [movements, selectedMovementId, isSuperAdmin])

  // Auto-select first org if none selected
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId && viewMode === 'organization') {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations, selectedOrgId, viewMode])

  // Fetch movement wallet (for Super Admins viewing movement wallet)
  const { data: movementWalletData, loading: movementWalletLoading, refetch: refetchMovementWallet } = useQuery(
    GET_MOVEMENT_WALLET,
    {
      variables: { movementId: selectedMovementId },
      skip: !selectedMovementId || viewMode !== 'movement',
    }
  )

  // Fetch org wallet data
  const { data: walletData, loading: walletLoading, refetch: refetchWallet } = useQuery(
    GET_ORG_WALLET,
    {
      variables: { orgId: selectedOrgId },
      skip: !selectedOrgId || viewMode !== 'organization',
    }
  )

  // Fetch wallet stats
  const { data: statsData, loading: statsLoading } = useQuery(GET_WALLET_STATS, {
    variables: { orgId: selectedOrgId },
    skip: !selectedOrgId || viewMode !== 'organization',
  })

  // Build transaction filter
  const buildTransactionFilter = () => {
    const filter: any = {
      orgId: selectedOrgId,
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    }

    if (debouncedSearch) {
      filter.search = debouncedSearch
    }

    if (typeFilter !== 'all') {
      filter.type = typeFilter
    }

    if (statusFilter !== 'all') {
      filter.status = statusFilter
    }

    return filter
  }

  // Fetch transactions
  const { data: transactionsData, loading: transactionsLoading } = useQuery(
    GET_WALLET_TRANSACTIONS,
    {
      variables: { filter: buildTransactionFilter() },
      skip: !selectedOrgId || viewMode !== 'organization',
      fetchPolicy: 'cache-and-network',
    }
  )

  // Fund movement wallet mutation (Platform Admin only)
  const [fundMovementWallet, { loading: fundingMovementWallet }] = useMutation(FUND_MOVEMENT_WALLET, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Movement wallet funded successfully',
      })
      setShowFundModal(false)
      setFundAmount('')
      setFundDescription('')
      refetchMovementWallet()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Fund org wallet mutation (Platform Admin only - for direct funding)
  const [fundOrgWallet, { loading: fundingWallet }] = useMutation(FUND_ORG_WALLET, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Organization wallet funded successfully',
      })
      setShowFundModal(false)
      setFundAmount('')
      setFundDescription('')
      refetchWallet()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Fund org from movement mutation (Super Admin only)
  const [fundOrgFromMovement, { loading: fundingOrgFromMovement }] = useMutation(FUND_ORG_FROM_MOVEMENT, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Support group wallet funded from movement wallet',
      })
      setShowFundOrgModal(false)
      setFundOrgAmount('')
      setFundOrgDescription('')
      setTargetOrgId(null)
      refetchMovementWallet()
      refetchWallet()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  const movementWallet = movementWalletData?.movementWallet
  const wallet = walletData?.orgWallet
  const stats = statsData?.walletStats
  const transactions = transactionsData?.walletTransactions?.transactions || []
  const totalCount = transactionsData?.walletTransactions?.total || 0
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const handleFundWallet = () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (viewMode === 'movement' && selectedMovementId) {
      // Platform Admin funding movement wallet
      fundMovementWallet({
        variables: {
          input: {
            movementId: selectedMovementId,
            amount: parseFloat(fundAmount),
            description: fundDescription || 'Movement wallet funding',
          },
        },
      })
    } else if (viewMode === 'organization' && selectedOrgId) {
      // Platform Admin funding org wallet directly
      fundOrgWallet({
        variables: {
          input: {
            orgId: selectedOrgId,
            amount: parseFloat(fundAmount),
            description: fundDescription || 'Wallet funding',
          },
        },
      })
    }
  }

  const handleFundOrgFromMovement = () => {
    if (!fundOrgAmount || parseFloat(fundOrgAmount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (!targetOrgId) {
      toast({
        title: 'Error',
        description: 'Please select an organization',
        variant: 'destructive',
      })
      return
    }

    fundOrgFromMovement({
      variables: {
        input: {
          movementId: selectedMovementId,
          orgId: targetOrgId,
          amount: parseFloat(fundOrgAmount),
          description: fundOrgDescription || 'Support group wallet funding from movement',
        },
      },
    })
  }

  const handleDisburseFunds = () => {
    router.push('/admin/wallet/disburse')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wallet Management</h1>
          <p className="text-muted-foreground mt-2">
            {isPlatformAdmin && 'Fund Movement and Organization wallets'}
            {isSuperAdmin && !isPlatformAdmin && 'Manage movement wallet and fund support groups'}
            {!isPlatformAdmin && !isSuperAdmin && 'Manage organization wallet and disburse to members'}
          </p>
        </div>
        {viewMode === 'organization' && (
          <Button onClick={handleDisburseFunds} className="gap-2">
            <Send className="h-4 w-4" />
            Disburse Funds
          </Button>
        )}
      </div>

      {/* View Mode Tabs (for Super Admins) */}
      {isSuperAdmin && movements.length > 0 && (
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'movement' | 'organization')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="movement">Movement Wallet</TabsTrigger>
            <TabsTrigger value="organization">Support Group Wallet</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Movement Selector (for Super Admins in movement mode) */}
      {isSuperAdmin && movements.length > 0 && viewMode === 'movement' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedMovementId || ''} onValueChange={setSelectedMovementId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select movement" />
              </SelectTrigger>
              <SelectContent>
                {movements.map((movement: any) => (
                  <SelectItem key={movement.id} value={movement.id}>
                    {movement.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Organization Selector */}
      {viewMode === 'organization' && organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Support Group</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedOrgId || ''} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Movement Wallet View */}
      {viewMode === 'movement' && selectedMovementId && (
        <>
          {/* Movement Wallet Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Movement Wallet Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {movementWalletLoading ? '...' : formatCurrency(movementWallet?.balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for funding support groups
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fund Movement Wallet (Platform Admin Only) */}
          {isPlatformAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Fund Movement Wallet</CardTitle>
                <CardDescription>
                  Add funds to the movement wallet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fund Movement Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fund Movement Wallet</DialogTitle>
                      <DialogDescription>
                        Add funds to {movementWallet?.movement?.name} wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (NGN)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          placeholder="Wallet funding description"
                          value={fundDescription}
                          onChange={(e) => setFundDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowFundModal(false)}
                        disabled={fundingMovementWallet}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleFundWallet} disabled={fundingMovementWallet}>
                        {fundingMovementWallet ? 'Processing...' : 'Fund Wallet'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Fund Support Group from Movement Wallet (Super Admin) */}
          {isSuperAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Fund Support Group Wallet</CardTitle>
                <CardDescription>
                  Transfer funds from movement wallet to a support group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showFundOrgModal} onOpenChange={setShowFundOrgModal}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <ArrowDown className="h-4 w-4" />
                      Fund Support Group
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fund Support Group from Movement</DialogTitle>
                      <DialogDescription>
                        Transfer funds to a support group wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetOrg">Support Group</Label>
                        <Select value={targetOrgId || ''} onValueChange={setTargetOrgId}>
                          <SelectTrigger id="targetOrg">
                            <SelectValue placeholder="Select support group" />
                          </SelectTrigger>
                          <SelectContent>
                            {organizations.map((org: any) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgAmount">Amount (NGN)</Label>
                        <Input
                          id="orgAmount"
                          type="number"
                          placeholder="0.00"
                          value={fundOrgAmount}
                          onChange={(e) => setFundOrgAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgDescription">Description (Optional)</Label>
                        <Input
                          id="orgDescription"
                          placeholder="Funding description"
                          value={fundOrgDescription}
                          onChange={(e) => setFundOrgDescription(e.target.value)}
                        />
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Movement wallet balance: {formatCurrency(movementWallet?.balance || 0)}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowFundOrgModal(false)}
                        disabled={fundingOrgFromMovement}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleFundOrgFromMovement} disabled={fundingOrgFromMovement}>
                        {fundingOrgFromMovement ? 'Processing...' : 'Fund Support Group'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Organization Wallet View */}
      {viewMode === 'organization' && !selectedOrgId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select an organization to view wallet
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'organization' && selectedOrgId && (
        <>
          {/* Wallet Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {walletLoading ? '...' : formatCurrency(wallet?.balance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available for disbursement
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Funded
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : formatCurrency(stats?.totalFunded || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All-time funding
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Disbursed
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : formatCurrency(stats?.totalDisbursed || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total sent to members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transactions
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? '...' : stats?.transactionCount || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.disbursementCount || 0} disbursements
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fund Wallet Action (Platform Admin Only for direct org funding) */}
          {isPlatformAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Fund Wallet</CardTitle>
                <CardDescription>
                  Add funds to the organization wallet directly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fund Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Fund Organization Wallet</DialogTitle>
                      <DialogDescription>
                        Add funds to {wallet?.organization?.name} wallet
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (NGN)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="0.00"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          placeholder="Wallet funding description"
                          value={fundDescription}
                          onChange={(e) => setFundDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowFundModal(false)}
                        disabled={fundingWallet}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleFundWallet} disabled={fundingWallet}>
                        {fundingWallet ? 'Processing...' : 'Fund Wallet'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all wallet transactions and disbursements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="CREDIT">Credit</SelectItem>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transactions Table */}
              {transactionsLoading && !transactionsData ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No transactions found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Date</th>
                          <th className="text-left p-3 font-semibold">Type</th>
                          <th className="text-left p-3 font-semibold">Amount</th>
                          <th className="text-left p-3 font-semibold">Recipient</th>
                          <th className="text-left p-3 font-semibold">Reference</th>
                          <th className="text-left p-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction: Transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-3 text-sm text-muted-foreground">
                              {formatDate(transaction.createdAt)}
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  transaction.type === 'CREDIT' ? 'default' : 'secondary'
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <span
                                className={
                                  transaction.type === 'CREDIT'
                                    ? 'text-green-600 font-medium'
                                    : 'text-red-600 font-medium'
                                }
                              >
                                {transaction.type === 'CREDIT' ? '+' : '-'}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="p-3">
                              {transaction.recipient ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={transaction.recipient.avatar} />
                                    <AvatarFallback>
                                      {transaction.recipient.firstName?.[0]}
                                      {transaction.recipient.lastName?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">
                                    {transaction.recipient.firstName}{' '}
                                    {transaction.recipient.lastName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">-</span>
                              )}
                            </td>
                            <td className="p-3">
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {transaction.reference}
                              </code>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  transaction.status === 'COMPLETED'
                                    ? 'success'
                                    : transaction.status === 'PENDING'
                                    ? 'default'
                                    : 'destructive'
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{' '}
                        {totalCount} transactions
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1 || transactionsLoading}
                          className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
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
                                  variant={
                                    currentPage === pageNum ? 'default' : 'outline'
                                  }
                                  size="sm"
                                  onClick={() => setCurrentPage(pageNum)}
                                  disabled={transactionsLoading}
                                  className="w-9"
                                >
                                  {pageNum}
                                </Button>
                              )
                            }
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={
                            currentPage === totalPages || transactionsLoading
                          }
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
        </>
      )}
    </div>
  )
}
