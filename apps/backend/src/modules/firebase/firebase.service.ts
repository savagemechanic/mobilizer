import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

interface FCMMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface MulticastMessage {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export type UploadType = 'avatar' | 'post' | 'organization' | 'event';

interface UploadResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;
  private bucket: admin.storage.Storage | null = null;
  private storageBucket: string;

  constructor(private configService: ConfigService) {
    this.storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') || '';
  }

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT');

    if (!serviceAccountJson) {
      this.logger.warn('Firebase service account not configured. FCM notifications and storage will be disabled.');
      return;
    }

    try {
      const serviceAccount = JSON.parse(serviceAccountJson);

      if (!admin.apps.length) {
        this.app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: this.storageBucket,
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.app = admin.app();
      }

      if (this.storageBucket) {
        this.bucket = admin.storage();
        this.logger.log(`Firebase Storage initialized with bucket: ${this.storageBucket}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error.message);
    }
  }

  /**
   * Check if Firebase is configured and ready
   */
  isConfigured(): boolean {
    return this.app !== null;
  }

  /**
   * Check if Firebase Storage is configured
   */
  isStorageConfigured(): boolean {
    return this.bucket !== null && !!this.storageBucket;
  }

  /**
   * Generate a signed upload URL for Firebase Storage
   */
  async getSignedUploadUrl(
    userId: string,
    type: UploadType,
    fileName: string,
    contentType: string,
  ): Promise<UploadResult> {
    if (!this.bucket || !this.storageBucket) {
      throw new Error('Firebase Storage is not configured');
    }

    // Validate content type
    const allowedTypes = this.getAllowedContentTypes(type);
    if (!allowedTypes.includes(contentType)) {
      throw new Error(
        `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`
      );
    }

    // Generate unique file path
    const extension = this.getFileExtension(fileName);
    const key = `${type}s/${userId}/${uuidv4()}${extension}`;

    const bucket = this.bucket.bucket();
    const file = bucket.file(key);

    // Generate signed URL for upload (expires in 15 minutes)
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    // Generate public URL for the file
    const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${this.storageBucket}/o/${encodeURIComponent(key)}?alt=media`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.bucket) {
      this.logger.warn('Firebase Storage not configured, cannot delete file');
      return false;
    }

    try {
      const bucket = this.bucket.bucket();
      await bucket.file(key).delete();
      this.logger.debug(`File deleted: ${key}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      return false;
    }
  }

  private getAllowedContentTypes(type: UploadType): string[] {
    switch (type) {
      case 'avatar':
      case 'organization':
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      case 'post':
        return [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'video/mp4',
          'video/quicktime',
          'video/webm',
        ];
      case 'event':
        return ['image/jpeg', 'image/png', 'image/webp'];
      default:
        return ['image/jpeg', 'image/png'];
    }
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    if (lastDot === -1) return '';
    return fileName.substring(lastDot).toLowerCase();
  }

  /**
   * Send a notification to a single device
   */
  async sendToDevice(message: FCMMessage): Promise<boolean> {
    if (!this.app) {
      this.logger.warn('Firebase not configured, skipping notification');
      return false;
    }

    try {
      const fcmMessage: admin.messaging.Message = {
        token: message.token,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { imageUrl: message.imageUrl }),
        },
        data: message.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(fcmMessage);
      this.logger.debug(`FCM message sent successfully: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send FCM message: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a notification to multiple devices
   */
  async sendToDevices(message: MulticastMessage): Promise<{ success: number; failure: number }> {
    if (!this.app) {
      this.logger.warn('Firebase not configured, skipping notifications');
      return { success: 0, failure: message.tokens.length };
    }

    if (message.tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    try {
      const fcmMessage: admin.messaging.MulticastMessage = {
        tokens: message.tokens,
        notification: {
          title: message.title,
          body: message.body,
          ...(message.imageUrl && { imageUrl: message.imageUrl }),
        },
        data: message.data,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(fcmMessage);

      this.logger.debug(
        `FCM multicast: ${response.successCount} success, ${response.failureCount} failure`
      );

      return {
        success: response.successCount,
        failure: response.failureCount,
      };
    } catch (error) {
      this.logger.error(`Failed to send FCM multicast: ${error.message}`);
      return { success: 0, failure: message.tokens.length };
    }
  }

  /**
   * Subscribe a device to a topic
   */
  async subscribeToTopic(token: string, topic: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      this.logger.debug(`Device subscribed to topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to subscribe to topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Unsubscribe a device from a topic
   */
  async unsubscribeFromTopic(token: string, topic: string): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      this.logger.debug(`Device unsubscribed from topic: ${topic}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from topic: ${error.message}`);
      return false;
    }
  }

  /**
   * Send a notification to a topic
   */
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>): Promise<boolean> {
    if (!this.app) {
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data,
        android: {
          priority: 'high',
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.debug(`Topic message sent: ${response}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send topic message: ${error.message}`);
      return false;
    }
  }
}
