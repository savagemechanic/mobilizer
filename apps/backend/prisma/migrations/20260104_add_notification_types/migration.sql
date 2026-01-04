-- Add new notification types to enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'EVENT_RSVP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_EVENT';
