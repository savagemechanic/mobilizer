import { Injectable, BadRequestException } from '@nestjs/common';
import { FirebaseService, UploadType } from '../firebase/firebase.service';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class UploadService {
  constructor(private firebaseService: FirebaseService) {}

  /**
   * Generate a presigned URL for uploading a file to Firebase Storage
   */
  async getPresignedUploadUrl(
    userId: string,
    type: UploadType,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUrlResponse> {
    if (!this.firebaseService.isStorageConfigured()) {
      throw new BadRequestException(
        'File upload is not configured. Please set up Firebase Storage.'
      );
    }

    try {
      return await this.firebaseService.getSignedUploadUrl(
        userId,
        type,
        fileName,
        contentType,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<boolean> {
    return this.firebaseService.deleteFile(key);
  }

  /**
   * Check if upload service is configured
   */
  isConfigured(): boolean {
    return this.firebaseService.isStorageConfigured();
  }
}
