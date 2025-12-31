/**
 * Shared enums used across the Mobilizer platform
 */

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum OrgLevel {
  NATIONAL = 'national',
  STATE = 'state',
  LGA = 'lga',
  WARD = 'ward',
  UNIT = 'unit',
}

export enum MembershipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  REJECTED = 'rejected',
}

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  POLL = 'poll',
  LINK = 'link',
  SHARED = 'shared',
}

export enum EventType {
  MEETING = 'meeting',
  RALLY = 'rally',
  CONFERENCE = 'conference',
  TRAINING = 'training',
  WEBINAR = 'webinar',
  SOCIAL = 'social',
  OTHER = 'other',
}

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum AttendanceStatus {
  GOING = 'going',
  MAYBE = 'maybe',
  NOT_GOING = 'not_going',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  AUDIO = 'audio',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
}

export enum NotificationType {
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  POST_SHARE = 'post_share',
  EVENT_INVITATION = 'event_invitation',
  EVENT_REMINDER = 'event_reminder',
  MESSAGE = 'message',
  MENTION = 'mention',
  FOLLOW = 'follow',
  ORG_INVITATION = 'org_invitation',
  ORG_APPROVED = 'org_approved',
  ORG_REJECTED = 'org_rejected',
  SYSTEM = 'system',
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum OrgRole {
  MEMBER = 'member',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export enum LeaderLevel {
  STATE = 'STATE',
  LGA = 'LGA',
  WARD = 'WARD',
  POLLING_UNIT = 'POLLING_UNIT',
}

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  HAHA = 'haha',
  WOW = 'wow',
  SAD = 'sad',
  ANGRY = 'angry',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  MISINFORMATION = 'misinformation',
  INAPPROPRIATE = 'inappropriate',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ContentVisibility {
  PUBLIC = 'public',
  ORG_ONLY = 'org_only',
  MEMBERS_ONLY = 'members_only',
  PRIVATE = 'private',
}
