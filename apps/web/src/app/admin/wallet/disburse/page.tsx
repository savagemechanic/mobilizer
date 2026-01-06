'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card'
import { Button } from '@/ui/button'
import { Input } from '@/ui/input'
import { Label } from '@/ui/label'
import { Badge } from '@/ui/badge'
import { Checkbox } from '@/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import {
  GET_ORG_WALLET,
  GET_ELIGIBLE_MEMBERS
} from '@/lib/graphql/queries/wallet'
import { DISBURSE_FUNDS, BULK_DISBURSE_FUNDS } from '@/lib/graphql/mutations/wallet'
import { GET_MY_ORGANIZATIONS } from '@/lib/graphql/queries/admin'
import {
  GET_COUNTRIES,
  GET_STATES,
  GET_LGAS,
  GET_WARDS,
  GET_POLLING_UNITS
} from '@/lib/graphql/queries/locations'

interface Member {
  id: string
  firstName: string
  lastName: string
  displayName?: string
  avatar?: string
  phoneNumber?: string
  membershipId?: string
  isVerified: boolean
  isLeader: boolean
  isChairman: boolean
  stateName?: string
  lgaName?: string
  wardName?: string
}

export default function DisburseFundsPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isBulkMode, setIsBulkMode] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // Location filters
  const [countryId, setCountryId] = useState<string | null>(null)
  const [stateId, setStateId] = useState<string | null>(null)
  const [lgaId, setLgaId] = useState<string | null>(null)
  const [wardId, setWardId] = useState<string | null>(null)
  const [pollingUnitId, setPollingUnitId] = useState<string | null>(null)

  // Additional filters
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [leadersOnly, setLeadersOnly] = useState(false)
  const [chairmenOnly, setChairmenOnly] = useState(false)

  // Fetch user's organizations
  const { data: orgsData } = useQuery(GET_MY_ORGANIZATIONS)
  const organizations = orgsData?.myOrganizations || []

  // Auto-select first org if none selected
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id)
    }
  }, [organizations, selectedOrgId])

  // Fetch wallet data
  const { data: walletData, loading: walletLoading } = useQuery(GET_ORG_WALLET, {
    variables: { orgId: selectedOrgId },
    skip: !selectedOrgId,
  })

  // Fetch countries
  const { data: countriesData } = useQuery(GET_COUNTRIES)
  const countries = countriesData?.countries || []

  // Fetch states
  const { data: statesData } = useQuery(GET_STATES, {
    variables: { countryId },
    skip: !countryId,
  })
  const states = statesData?.states || []

  // Fetch LGAs
  const { data: lgasData } = useQuery(GET_LGAS, {
    variables: { stateId },
    skip: !stateId,
  })
  const lgas = lgasData?.lgas || []

  // Fetch wards
  const { data: wardsData } = useQuery(GET_WARDS, {
    variables: { lgaId },
    skip: !lgaId,
  })
  const wards = wardsData?.wards || []

  // Fetch polling units
  const { data: pollingUnitsData } = useQuery(GET_POLLING_UNITS, {
    variables: { wardId },
    skip: !wardId,
  })
  const pollingUnits = pollingUnitsData?.pollingUnits || []

  // Check if selected org is private/closed
  const selectedOrg = organizations.find((org: any) => org.id === selectedOrgId)
  const isPrivateOrg = selectedOrg?.isPrivate || selectedOrg?.requiresConfirmation

  // Build filter for eligible members
  const buildMemberFilter = () => {
    const filter: any = {}

    if (countryId) filter.countryId = countryId
    if (stateId) filter.stateId = stateId
    if (lgaId) filter.lgaId = lgaId
    if (wardId) filter.wardId = wardId
    if (pollingUnitId) filter.pollingUnitId = pollingUnitId
    // For closed/private groups, always filter by verified members
    if (verifiedOnly || isPrivateOrg) filter.isVerified = true
    if (leadersOnly) filter.isLeader = true
    if (chairmenOnly) filter.isChairman = true
    if (searchQuery) filter.search = searchQuery

    return filter
  }

  // Fetch eligible members
  const { data: membersData, loading: membersLoading } = useQuery(
    GET_ELIGIBLE_MEMBERS,
    {
      variables: {
        orgId: selectedOrgId,
        filter: buildMemberFilter(),
      },
      skip: !selectedOrgId,
      fetchPolicy: 'cache-and-network',
    }
  )

  const members: Member[] = membersData?.eligibleDisbursementMembers || []
  const wallet = walletData?.orgWallet

  // Single disbursement mutation
  const [disburseFunds, { loading: disbursing }] = useMutation(DISBURSE_FUNDS, {
    onCompleted: (data) => {
      if (data.disburseFunds.success) {
        toast({
          title: 'Success',
          description: data.disburseFunds.message,
        })
        router.push('/admin/wallet')
      } else {
        toast({
          title: 'Error',
          description: data.disburseFunds.message,
          variant: 'destructive',
        })
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    },
  })

  // Bulk disbursement mutation
  const [bulkDisburseFunds, { loading: bulkDisbursing }] = useMutation(
    BULK_DISBURSE_FUNDS,
    {
      onCompleted: (data) => {
        const result = data.bulkDisburseFunds
        toast({
          title: 'Bulk Disbursement Complete',
          description: `${result.successful} successful, ${result.failed} failed. Total: ${formatCurrency(result.totalAmountDisbursed)}`,
        })
        router.push('/admin/wallet')
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        })
      },
    }
  )

  const handleSingleDisbursement = () => {
    const memberId = Array.from(selectedMembers)[0]

    disburseFunds({
      variables: {
        input: {
          orgId: selectedOrgId,
          recipientUserId: memberId,
          amount: parseFloat(amount),
          description: description || 'Fund disbursement',
        },
      },
    })
  }

  const handleBulkDisbursement = () => {
    bulkDisburseFunds({
      variables: {
        input: {
          orgId: selectedOrgId,
          recipientUserIds: Array.from(selectedMembers),
          amountPerRecipient: parseFloat(amount),
          description: description || 'Bulk fund disbursement',
        },
      },
    })
  }

  const handleDisbursement = () => {
    // Validate before showing confirmation
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      })
      return
    }

    if (selectedMembers.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one member',
        variant: 'destructive',
      })
      return
    }

    if (isBulkMode) {
      const totalAmount = parseFloat(amount) * selectedMembers.size
      if (totalAmount > (wallet?.balance || 0)) {
        toast({
          title: 'Insufficient Balance',
          description: `Total amount (${formatCurrency(totalAmount)}) exceeds wallet balance`,
          variant: 'destructive',
        })
        return
      }
    }

    // Show confirmation dialog
    setShowConfirmDialog(true)
  }

  const confirmDisbursement = () => {
    setShowConfirmDialog(false)

    if (isBulkMode) {
      handleBulkDisbursement()
    } else {
      handleSingleDisbursement()
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    const newSelection = new Set(selectedMembers)
    if (newSelection.has(memberId)) {
      newSelection.delete(memberId)
    } else {
      newSelection.add(memberId)
    }
    setSelectedMembers(newSelection)
  }

  const toggleSelectAll = () => {
    if (selectedMembers.size === members.length) {
      setSelectedMembers(new Set())
    } else {
      setSelectedMembers(new Set(members.map((m) => m.id)))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount)
  }

  const handleCountryChange = (value: string) => {
    setCountryId(value === 'all' ? null : value)
    setStateId(null)
    setLgaId(null)
    setWardId(null)
    setPollingUnitId(null)
  }

  const handleStateChange = (value: string) => {
    setStateId(value === 'all' ? null : value)
    setLgaId(null)
    setWardId(null)
    setPollingUnitId(null)
  }

  const handleLgaChange = (value: string) => {
    setLgaId(value === 'all' ? null : value)
    setWardId(null)
    setPollingUnitId(null)
  }

  const handleWardChange = (value: string) => {
    setWardId(value === 'all' ? null : value)
    setPollingUnitId(null)
  }

  const handlePollingUnitChange = (value: string) => {
    setPollingUnitId(value === 'all' ? null : value)
  }

  const totalDisbursementAmount =
    parseFloat(amount || '0') * selectedMembers.size

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/wallet')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wallet
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Disburse Funds</h1>
          <p className="text-muted-foreground mt-2">
            Send funds to organization members
          </p>
        </div>
      </div>

      {/* Organization Selector */}
      {organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Organization</CardTitle>
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

      {!selectedOrgId ? (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Please select an organization to disburse funds
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Wallet Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {walletLoading ? '...' : formatCurrency(wallet?.balance || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Available for disbursement
                  </p>
                </div>
                {totalDisbursementAmount > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total to disburse
                    </p>
                    <p
                      className={`text-xl font-semibold ${
                        totalDisbursementAmount > (wallet?.balance || 0)
                          ? 'text-red-500'
                          : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(totalDisbursementAmount)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Disbursement Form */}
          <Card>
            <CardHeader>
              <CardTitle>Disbursement Details</CardTitle>
              <CardDescription>
                Configure amount and disbursement mode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkMode"
                  checked={isBulkMode}
                  onCheckedChange={(checked) => setIsBulkMode(checked as boolean)}
                />
                <Label
                  htmlFor="bulkMode"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bulk Disbursement Mode (send same amount to multiple members)
                </Label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">
                    Amount Per Member (NGN) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="Disbursement description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              {selectedMembers.size > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {selectedMembers.size} member(s) selected
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(parseFloat(amount || '0'))} per member
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(totalDisbursementAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Member Filters</CardTitle>
                  <CardDescription>
                    Filter members by location and verification status
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCountryId(null)
                    setStateId(null)
                    setLgaId(null)
                    setWardId(null)
                    setPollingUnitId(null)
                    setVerifiedOnly(true)
                    setLeadersOnly(false)
                    setChairmenOnly(false)
                    setSearchQuery('')
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div className="space-y-2">
                <Label>Member Status</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verifiedOnly"
                      checked={verifiedOnly || isPrivateOrg}
                      onCheckedChange={(checked) =>
                        setVerifiedOnly(checked as boolean)
                      }
                      disabled={isPrivateOrg}
                    />
                    <Label htmlFor="verifiedOnly" className="text-sm">
                      Verified Members Only
                      {isPrivateOrg && ' (Required for closed groups)'}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="leadersOnly"
                      checked={leadersOnly}
                      onCheckedChange={(checked) =>
                        setLeadersOnly(checked as boolean)
                      }
                    />
                    <Label htmlFor="leadersOnly" className="text-sm">
                      Leaders Only
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="chairmenOnly"
                      checked={chairmenOnly}
                      onCheckedChange={(checked) =>
                        setChairmenOnly(checked as boolean)
                      }
                    />
                    <Label htmlFor="chairmenOnly" className="text-sm">
                      Chairmen Only
                    </Label>
                  </div>
                </div>
              </div>

              {/* Location Filters */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={countryId || 'all'}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="All Countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Countries</SelectItem>
                      {countries.map((country: any) => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Select
                    value={stateId || 'all'}
                    onValueChange={handleStateChange}
                    disabled={!countryId}
                  >
                    <SelectTrigger id="state">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {states.map((state: any) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lga">LGA</Label>
                  <Select
                    value={lgaId || 'all'}
                    onValueChange={handleLgaChange}
                    disabled={!stateId}
                  >
                    <SelectTrigger id="lga">
                      <SelectValue placeholder="All LGAs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All LGAs</SelectItem>
                      {lgas.map((lga: any) => (
                        <SelectItem key={lga.id} value={lga.id}>
                          {lga.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Select
                    value={wardId || 'all'}
                    onValueChange={handleWardChange}
                    disabled={!lgaId}
                  >
                    <SelectTrigger id="ward">
                      <SelectValue placeholder="All Wards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Wards</SelectItem>
                      {wards.map((ward: any) => (
                        <SelectItem key={ward.id} value={ward.id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pollingUnit">Polling Unit</Label>
                  <Select
                    value={pollingUnitId || 'all'}
                    onValueChange={handlePollingUnitChange}
                    disabled={!wardId}
                  >
                    <SelectTrigger id="pollingUnit">
                      <SelectValue placeholder="All Polling Units" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Polling Units</SelectItem>
                      {pollingUnits.map((pu: any) => (
                        <SelectItem key={pu.id} value={pu.id}>
                          {pu.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligible Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Eligible Members</CardTitle>
                  <CardDescription>
                    {members.length} member(s) found
                  </CardDescription>
                </div>
                {members.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    {selectedMembers.size === members.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No eligible members found with the current filters
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your location or verification filters
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedMembers.has(member.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => toggleMemberSelection(member.id)}
                    >
                      <Checkbox
                        checked={selectedMembers.has(member.id)}
                        onCheckedChange={() => toggleMemberSelection(member.id)}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.firstName?.[0]}
                          {member.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          {member.isVerified && (
                            <Badge variant="success" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                          {member.isLeader && (
                            <Badge variant="default" className="text-xs">
                              Leader
                            </Badge>
                          )}
                          {member.isChairman && (
                            <Badge variant="default" className="text-xs">
                              Chairman
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          {member.phoneNumber && <span>{member.phoneNumber}</span>}
                          {member.stateName && <span>{member.stateName}</span>}
                          {member.lgaName && <span>{member.lgaName}</span>}
                          {member.wardName && <span>{member.wardName}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {selectedMembers.size > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Ready to disburse {formatCurrency(totalDisbursementAmount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      to {selectedMembers.size} member(s)
                    </p>
                  </div>
                  <Button
                    onClick={handleDisbursement}
                    disabled={
                      disbursing ||
                      bulkDisbursing ||
                      !amount ||
                      parseFloat(amount) <= 0 ||
                      totalDisbursementAmount > (wallet?.balance || 0)
                    }
                    className="gap-2"
                  >
                    {disbursing || bulkDisbursing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Disburse Funds
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmation Dialog */}
          <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Disbursement</DialogTitle>
                <DialogDescription>
                  Please review the disbursement details before proceeding
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Number of Recipients</p>
                    <p className="text-lg font-semibold">{selectedMembers.size}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount Per Member</p>
                    <p className="text-lg font-semibold">{formatCurrency(parseFloat(amount || '0'))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-lg font-semibold text-primary">{formatCurrency(totalDisbursementAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining Balance</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency((wallet?.balance || 0) - totalDisbursementAmount)}
                    </p>
                  </div>
                </div>
                {description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{description}</p>
                  </div>
                )}
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Warning:</strong> This action cannot be undone. Funds will be disbursed to {selectedMembers.size} member(s).
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={disbursing || bulkDisbursing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDisbursement}
                  disabled={disbursing || bulkDisbursing}
                >
                  {disbursing || bulkDisbursing ? 'Processing...' : 'Confirm Disbursement'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
