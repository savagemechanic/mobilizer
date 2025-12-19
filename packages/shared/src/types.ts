/**
 * Shared TypeScript types and interfaces
 */

import {
  Gender,
  OrgLevel,
  MembershipStatus,
  PostType,
  EventType,
  EventStatus,
  AttendanceStatus,
  MessageType,
  MessageStatus,
  ConversationType,
  NotificationType,
  UserRole,
  OrgRole,
  ReactionType,
  ReportReason,
  ReportStatus,
  ContentVisibility,
} from './enums';

// ============================================================================
// Base Types
// ============================================================================

export interface TimestampFields {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteFields {
  deletedAt?: Date | null;
}

// ============================================================================
// User Types
// ============================================================================

export interface User extends TimestampFields {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | null;
  gender?: Gender | null;
  dateOfBirth?: Date | null;
  profilePicture?: string | null;
  coverPhoto?: string | null;
  bio?: string | null;
  location?: string | null;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: Date | null;
}

export interface UserProfile extends User {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  organizationsCount: number;
}

// ============================================================================
// Organization Types
// ============================================================================

export interface Organization extends TimestampFields, SoftDeleteFields {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  coverImage?: string | null;
  level: OrgLevel;
  parentOrgId?: string | null;
  isActive: boolean;
  membersCount: number;
  postsCount: number;
  eventsCount: number;
}

export interface OrganizationMembership extends TimestampFields {
  id: string;
  userId: string;
  orgId: string;
  role: OrgRole;
  status: MembershipStatus;
  joinedAt?: Date | null;
}

// ============================================================================
// Post Types
// ============================================================================

export interface Post extends TimestampFields, SoftDeleteFields {
  id: string;
  userId: string;
  orgId?: string | null;
  content: string;
  type: PostType;
  mediaUrls?: string[];
  visibility: ContentVisibility;
  isPinned: boolean;
  commentsCount: number;
  reactionsCount: number;
  sharesCount: number;
}

export interface PostReaction extends TimestampFields {
  id: string;
  postId: string;
  userId: string;
  type: ReactionType;
}

export interface PostComment extends TimestampFields, SoftDeleteFields {
  id: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  repliesCount: number;
  reactionsCount: number;
}

// ============================================================================
// Poll Types
// ============================================================================

export interface Poll extends TimestampFields {
  id: string;
  postId: string;
  question: string;
  endsAt?: Date | null;
  allowMultipleChoices: boolean;
  totalVotes: number;
}

export interface PollOption extends TimestampFields {
  id: string;
  pollId: string;
  text: string;
  votesCount: number;
  order: number;
}

export interface PollVote extends TimestampFields {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
}

// ============================================================================
// Event Types
// ============================================================================

export interface Event extends TimestampFields, SoftDeleteFields {
  id: string;
  orgId: string;
  createdBy: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: Date;
  endDate?: Date | null;
  location?: string | null;
  virtualLink?: string | null;
  coverImage?: string | null;
  maxAttendees?: number | null;
  attendeesCount: number;
}

export interface EventAttendance extends TimestampFields {
  id: string;
  eventId: string;
  userId: string;
  status: AttendanceStatus;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Conversation extends TimestampFields {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatarUrl?: string | null;
  lastMessageAt?: Date | null;
}

export interface ConversationParticipant extends TimestampFields {
  id: string;
  conversationId: string;
  userId: string;
  lastReadAt?: Date | null;
  isAdmin: boolean;
}

export interface Message extends TimestampFields, SoftDeleteFields {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  type: MessageType;
  mediaUrl?: string | null;
  status: MessageStatus;
  replyToId?: string | null;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification extends TimestampFields {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date | null;
}

// ============================================================================
// Report Types
// ============================================================================

export interface Report extends TimestampFields {
  id: string;
  reporterId: string;
  contentType: 'post' | 'comment' | 'user' | 'event' | 'message';
  contentId: string;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  resolution?: string | null;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// ============================================================================
// Query/Filter Types
// ============================================================================

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeFilter {
  startDate?: Date | string;
  endDate?: Date | string;
}

export interface SearchParams extends PaginationParams, SortParams {
  query?: string;
}
