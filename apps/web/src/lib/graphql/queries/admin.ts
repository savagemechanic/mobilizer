import { gql } from '@apollo/client'

// ============================================
// DASHBOARD STATS
// ============================================

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($movementId: String!, $orgFilter: OrgFilterInput) {
    dashboardStats(movementId: $movementId, orgFilter: $orgFilter) {
      totalMembers
      totalSupportGroups
      totalPosts
      totalEvents
      activeMembers
      newMembersThisMonth
      levelDistribution {
        level
        count
      }
      countriesCovered
      statesCovered
      lgasCovered
      wardsCovered
      pollingUnitsCovered
      totalStates
      totalLgas
      totalWards
      totalPollingUnits
    }
  }
`

export const GET_MEMBER_ANALYTICS = gql`
  query GetMemberAnalytics($movementId: String!, $orgFilter: OrgFilterInput) {
    memberAnalytics(movementId: $movementId, orgFilter: $orgFilter) {
      genderBreakdown {
        male
        female
        other
        notSpecified
      }
      ageBreakdown {
        range
        count
      }
      locationBreakdown {
        name
        count
      }
      professionBreakdown {
        profession
        count
      }
      geopoliticalZoneBreakdown {
        name
        code
        count
      }
    }
  }
`

export const GET_MEMBERSHIP_TREND = gql`
  query GetMembershipTrend($movementId: String!, $dateRange: DateRangeInput!) {
    membershipTrend(movementId: $movementId, dateRange: $dateRange) {
      date
      count
    }
  }
`

export const GET_POST_ANALYTICS = gql`
  query GetPostAnalytics($movementId: String!, $orgFilter: OrgFilterInput) {
    postAnalytics(movementId: $movementId, orgFilter: $orgFilter) {
      totalPosts
      totalLikes
      totalComments
      totalShares
      totalPolls
      postsByType {
        type
        count
      }
      averageLikesPerPost
      averageCommentsPerPost
    }
  }
`

export const GET_EVENT_ANALYTICS = gql`
  query GetEventAnalytics($movementId: String!, $orgFilter: OrgFilterInput) {
    eventAnalytics(movementId: $movementId, orgFilter: $orgFilter) {
      totalEvents
      upcomingEvents
      pastEvents
      totalRSVPs
      eventsByType {
        type
        count
      }
      averageRSVPsPerEvent
    }
  }
`

export const GET_WORD_CLOUD = gql`
  query GetWordCloud($movementId: String!, $orgFilter: OrgFilterInput) {
    wordCloud(movementId: $movementId, orgFilter: $orgFilter) {
      word
      count
    }
  }
`

export const GET_AI_SUMMARY = gql`
  query GetAISummary($movementId: String!) {
    aiSummary(movementId: $movementId)
  }
`

// ============================================
// SUPPORT GROUPS (Organizations)
// ============================================

export const GET_SUPPORT_GROUPS = gql`
  query GetSupportGroups($filter: OrganizationFilterInput, $limit: Float, $offset: Float) {
    organizations(filter: $filter, limit: $limit, offset: $offset) {
      id
      name
      slug
      description
      logo
      level
      memberCount
      isActive
      isPrivate
      requiresConfirmation
      enabledLocationLevels
      movementId
      countryId
      stateId
      lgaId
      wardId
      pollingUnitId
      createdAt
    }
  }
`

export const GET_ORGANIZATION = gql`
  query GetOrganization($id: String!) {
    organization(id: $id) {
      id
      name
      slug
      description
      logo
      banner
      level
      memberCount
      isActive
      isVerified
      isPrivate
      requiresConfirmation
      enabledLocationLevels
      inviteCode
      movementId
      parentId
      countryId
      stateId
      lgaId
      wardId
      pollingUnitId
      country {
        id
        name
      }
      state {
        id
        name
      }
      lga {
        id
        name
      }
      ward {
        id
        name
      }
      pollingUnit {
        id
        name
      }
      movement {
        id
        name
        slug
      }
      createdAt
      updatedAt
    }
  }
`

export const GET_MY_ORGANIZATIONS = gql`
  query GetMyOrganizations {
    myOrganizations {
      id
      name
      slug
      level
      memberCount
      isActive
      movementId
    }
  }
`

// ============================================
// POSTS MANAGEMENT
// ============================================

export const GET_ALL_POSTS = gql`
  query GetAllPosts($limit: Float, $offset: Float, $filter: FeedFilterInput) {
    feed(limit: $limit, offset: $offset, filter: $filter) {
      id
      content
      type
      authorId
      orgId
      isPublished
      likeCount
      commentCount
      shareCount
      viewCount
      mediaUrls
      createdAt
      updatedAt
      author {
        id
        firstName
        lastName
        displayName
        avatar
      }
      organization {
        id
        name
        logo
      }
      poll {
        id
        postId
        question
        endsAt
        allowMultiple
        createdAt
        options {
          id
          pollId
          text
          voteCount
        }
      }
    }
  }
`

// ============================================
// PERMISSIONS / MEMBERS MANAGEMENT
// ============================================

export const GET_ORG_MEMBERS = gql`
  query GetOrgMembers(
    $orgId: String!
    $search: String
    $isAdmin: Boolean
    $limit: Float
    $offset: Float
  ) {
    getOrgMembers(
      orgId: $orgId
      search: $search
      isAdmin: $isAdmin
      limit: $limit
      offset: $offset
    ) {
      id
      userId
      orgId
      isAdmin
      isActive
      isVerified
      verifiedAt
      isBlocked
      blockedAt
      blockedReason
      isLeader
      isChairman
      leaderLevel
      leaderStateId
      leaderLgaId
      leaderWardId
      leaderPollingUnitId
      joinedAt
      approvedAt
      user {
        id
        firstName
        lastName
        displayName
        email
        avatar
        phoneNumber
        profession
        gender
        state {
          name
        }
        lga {
          name
        }
        ward {
          name
        }
      }
      organization {
        id
        name
        level
        slug
        logo
      }
    }
  }
`
