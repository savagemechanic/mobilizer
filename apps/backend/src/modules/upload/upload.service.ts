import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type UploadType = 'avatar' | 'post' | 'organization' | 'event';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class UploadService {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private region: string;
  private cdnUrl: string;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'mobilizer-uploads';
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.cdnUrl = this.configService.get<string>('CDN_URL') || '';

    if (accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }
  }

  /**
   * Generate a presigned URL for uploading a file to S3
   */
  async getPresignedUploadUrl(
    userId: string,
    type: UploadType,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUrlResponse> {
    if (!this.s3Client) {
      throw new BadRequestException('File upload is not configured. Please set AWS credentials.');
    }

    // Validate content type
    const allowedTypes = this.getAllowedContentTypes(type);
    if (!allowedTypes.includes(contentType)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types for ${type}: ${allowedTypes.join(', ')}`
      );
    }

    // Generate unique key
    const extension = this.getFileExtension(fileName);
    const key = `${type}s/${userId}/${uuidv4()}${extension}`;

    // Create presigned URL
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Generate the public URL for the file
    const fileUrl = this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Generate a presigned URL for downloading/viewing a file
   */
  async getPresignedDownloadUrl(key: string): Promise<string> {
    if (!this.s3Client) {
      throw new BadRequestException('File storage is not configured.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });
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
   * Check if upload service is configured
   */
  isConfigured(): boolean {
    return this.s3Client !== null;
  }
}
