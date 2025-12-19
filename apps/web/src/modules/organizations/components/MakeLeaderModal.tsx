'use client'

import * as React from 'react'
import { useMutation } from '@apollo/client'
import { MapPin, User, Shield } from 'lucide-react'
import { Button } from '@/atoms'
import { Avatar, AvatarFallback, AvatarImage } from '@/atoms'
import { Badge } from '@/atoms'
import { Label } from '@/atoms'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select'
import { MAKE_LEADER } from '@/lib/graphql/mutations/organizations'
import { toast } from '@/hooks/use-toast'

// Leader level enum - mirrors backend
export enum LeaderLevel {
  STATE = 'STATE',
  LGA = 'LGA',
  WARD = 'WARD',
  POLLING_UNIT = 'POLLING_UNIT',
}

const LEADER_LEVEL_LABELS: Record<LeaderLevel, string> = {
  [LeaderLevel.STATE]: 'State',
  [LeaderLevel.LGA]: 'LGA',
  [LeaderLevel.WARD]: 'Ward',
  [LeaderLevel.POLLING_UNIT]: 'Polling Unit',
}

export interface UserLocation {
  state?: { id: string; name: string } | null
  lga?: { id: string; name: string } | null
  ward?: { id: string; name: string } | null
  pollingUnit?: { id: string; name: string } | null
}

export interface MemberUser {
  id: string
  firstName: string
  lastName: string
  displayName?: string | null
  email: string
  avatar?: string | null
  state?: { id: string; name: string } | null
  lga?: { id: string; name: string } | null
  ward?: { id: string; name: string } | null
  pollingUnit?: { id: string; name: string } | null
}

export interface MakeLeaderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  membershipId: string
  user: MemberUser
  onSuccess?: () => void
}

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

const getAvailableLevels = (user: MemberUser): LeaderLevel[] => {
  const levels: LeaderLevel[] = []

  if (user.state?.id) levels.push(LeaderLevel.STATE)
  if (user.lga?.id) levels.push(LeaderLevel.LGA)
  if (user.ward?.id) levels.push(LeaderLevel.WARD)
  if (user.pollingUnit?.id) levels.push(LeaderLevel.POLLING_UNIT)

  return levels
}

const getLocationForLevel = (user: MemberUser, level: LeaderLevel) => {
  switch (level) {
    case LeaderLevel.STATE:
      return { stateId: user.state?.id }
    case LeaderLevel.LGA:
      return { stateId: user.state?.id, lgaId: user.lga?.id }
    case LeaderLevel.WARD:
      return { stateId: user.state?.id, lgaId: user.lga?.id, wardId: user.ward?.id }
    case LeaderLevel.POLLING_UNIT:
      return {
        stateId: user.state?.id,
        lgaId: user.lga?.id,
        wardId: user.ward?.id,
        pollingUnitId: user.pollingUnit?.id,
      }
    default:
      return {}
  }
}

const getLocationDisplay = (user: MemberUser, level: LeaderLevel): string => {
  switch (level) {
    case LeaderLevel.STATE:
      return user.state?.name || 'Unknown State'
    case LeaderLevel.LGA:
      return `${user.lga?.name || 'Unknown LGA'}, ${user.state?.name || ''}`
    case LeaderLevel.WARD:
      return `${user.ward?.name || 'Unknown Ward'}, ${user.lga?.name || ''}`
    case LeaderLevel.POLLING_UNIT:
      return `${user.pollingUnit?.name || 'Unknown PU'}, ${user.ward?.name || ''}`
    default:
      return 'Unknown'
  }
}

export function MakeLeaderModal({
  open,
  onOpenChange,
  membershipId,
  user,
  onSuccess,
}: MakeLeaderModalProps) {
  const [selectedLevel, setSelectedLevel] = React.useState<LeaderLevel | ''>('')
  const availableLevels = getAvailableLevels(user)
  const hasLocation = availableLevels.length > 0

  const [makeLeader, { loading }] = useMutation(MAKE_LEADER, {
    onCompleted: () => {
      toast({
        title: 'Success',
        description: `${user.firstName} is now a Leader`,
      })
      onOpenChange(false)
      setSelectedLevel('')
      onSuccess?.()
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to assign leader role',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = () => {
    if (!selectedLevel) return

    const locationIds = getLocationForLevel(user, selectedLevel)

    makeLeader({
      variables: {
        input: {
          membershipId,
          level: selectedLevel,
          ...locationIds,
        },
      },
    })
  }

  const displayName = user.displayName || `${user.firstName} ${user.lastName}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Make Leader
          </DialogTitle>
          <DialogDescription>
            Assign leader role to this member. Leaders can manage members and posts within their geographic scope.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              {user.avatar && <AvatarImage src={user.avatar} alt={displayName} />}
              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          {/* User Location Display */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Profile Location
            </Label>
            {hasLocation ? (
              <div className="text-sm space-y-1 pl-6">
                {user.state && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">State</Badge>
                    <span>{user.state.name}</span>
                  </div>
                )}
                {user.lga && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">LGA</Badge>
                    <span>{user.lga.name}</span>
                  </div>
                )}
                {user.ward && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">Ward</Badge>
                    <span>{user.ward.name}</span>
                  </div>
                )}
                {user.pollingUnit && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">PU</Badge>
                    <span>{user.pollingUnit.name}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-destructive pl-6">
                This user has no location set in their profile. They must update their profile before becoming a leader.
              </p>
            )}
          </div>

          {/* Leader Level Selection */}
          {hasLocation && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Leadership Level
              </Label>
              <Select
                value={selectedLevel}
                onValueChange={(value) => setSelectedLevel(value as LeaderLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leadership level" />
                </SelectTrigger>
                <SelectContent>
                  {availableLevels.map((level) => (
                    <SelectItem key={level} value={level}>
                      {LEADER_LEVEL_LABELS[level]} - {getLocationDisplay(user, level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The user will be able to manage members and posts at this geographic level.
              </p>
            </div>
          )}

          {/* Preview */}
          {selectedLevel && (
            <div className="p-3 rounded-lg border border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Assignment Summary
              </p>
              <p className="text-sm mt-1">
                {displayName} will become a <strong>{LEADER_LEVEL_LABELS[selectedLevel]} Leader</strong> for{' '}
                <strong>{getLocationDisplay(user, selectedLevel)}</strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedLevel || loading || !hasLocation}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Assigning...' : 'Make Leader'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
