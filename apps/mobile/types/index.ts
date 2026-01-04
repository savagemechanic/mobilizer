// Re-export shared types from local copy (to avoid monorepo complexity in EAS builds)
export * from '../lib/shared';

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  displayName?: string;
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  username?: string;
  profession?: string;
  gender?: string;
  dateOfBirth?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  isPlatformAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
  location?: UserLocation;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  // Contextual leader info (populated when user is in org context)
  isLeader?: boolean;
  leaderLevel?: string;
}

export interface UserLocation {
  country?: Location;
  state?: Location;
  lga?: Location;
  ward?: Location;
  pollingUnit?: Location;
}

export interface Location {
  id: string;
  name: string;
}

// Auth types
export interface AuthPayload {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  username: string;
  profession?: string;
  stateId?: string;
  lgaId?: string;
  wardId?: string;
  pollingUnitId?: string;
}

// Location level type for post creation and feed filtering
export type LocationLevel = 'GLOBAL' | 'COUNTRY' | 'STATE' | 'LGA' | 'WARD' | 'POLLING_UNIT';

// Organization selector types
export interface OrganizationWithJoinDate extends Organization {
  joinedAt?: string;
}

export interface OrganizationsForSelector {
  organizations: OrganizationWithJoinDate[];
  publicOrg?: Organization;
  publicOrgEnabled: boolean;
  showAllOrgsOption: boolean;
}

// Platform settings
export interface PlatformSettings {
  id: string;
  publicOrgEnabled: boolean;
  publicOrgId?: string;
}

// Professions list for dropdown
export const PROFESSIONS = [
  'Student',
  'Teacher/Educator',
  'Healthcare Professional',
  'Engineer',
  'Business Owner',
  'Civil Servant',
  'Legal Professional',
  'Finance/Banking',
  'IT/Technology',
  'Agriculture/Farming',
  'Artisan/Tradesperson',
  'Retail/Commerce',
  'Transport/Logistics',
  'Media/Journalism',
  'Security Services',
  'Religious Leader',
  'Community Leader',
  'Unemployed',
  'Retired',
  'Other',
] as const;

// Navigation types
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  '(modals)': undefined;
  'post/[id]': { id: string };
  'event/[id]': { id: string };
  'user/[id]': { id: string };
  'organization/[slug]': { slug: string };
};

export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  'verify-email': { email: string };
  'forgot-password': undefined;
  'reset-password': { token: string };
};

export type TabParamList = {
  index: undefined;
  discover: undefined;
  events: undefined;
  messages: undefined;
  profile: undefined;
};

// Post types
export interface Post {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  updatedAt?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  author: User;
  mediaUrls?: string[];
  poll?: Poll;
  organization?: Organization;
  isLiked?: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultipleVotes: boolean;
  endsAt?: string;
  totalVotes: number;
  hasVoted?: boolean;
  userVotedOptionId?: string;
}

export interface PollOption {
  id: string;
  text: string;
  voteCount: number;
  percentage?: number;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  author: User;
  post: Post;
  parent?: Comment;
  replies?: Comment[];
  likeCount: number;
  isLiked?: boolean;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  level: string;
  memberCount: number;
  inviteCode?: string;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
  movement?: Movement;
  parentOrganization?: Organization;
  location?: OrganizationLocation;
}

export interface OrganizationLocation {
  country?: Location;
  state?: Location;
  lga?: Location;
  ward?: Location;
  pollingUnit?: Location;
}

export interface Movement {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  createdAt: string;
}

export interface OrgMembership {
  id: string;
  user: User;
  organization: Organization;
  isAdmin: boolean;
  isLeader: boolean;
  leaderLevel?: string;
  joinedAt: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  description?: string;
  type: string;
  startTime: string;
  endTime?: string;
  location?: string;
  virtualLink?: string;
  banner?: string;
  organizationId?: string;
  organization?: Organization;
  createdBy: User;
  attendeeCount: number;
  createdAt: string;
  updatedAt?: string;
  myRSVP?: EventRSVP;
}

export interface EventRSVP {
  id: string;
  user: User;
  event: Event;
  status: string; // GOING, MAYBE, NOT_GOING
  createdAt: string;
}

// Chat/Message types
export interface Conversation {
  id: string;
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  content: string;
  type: string;
  sender: User;
  conversation: Conversation;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
  mediaUrl?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, any>;
  createdAt: string;
  user: User;
}
