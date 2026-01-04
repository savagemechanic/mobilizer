import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import Constants from 'expo-constants';

// Firebase configuration from environment
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.FIREBASE_AUTH_DOMAIN || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.FIREBASE_PROJECT_ID || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.FIREBASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.FIREBASE_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.FIREBASE_APP_ID || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let storage: FirebaseStorage;

export function initializeFirebase(): FirebaseApp {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  storage = getStorage(app);
  return app;
}

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    return initializeFirebase();
  }
  return app;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
}

/**
 * Upload a file to Firebase Storage
 * @param uri - Local file URI
 * @param path - Storage path (e.g., 'avatars/user123/image.jpg')
 * @param contentType - MIME type of the file
 * @returns Download URL of the uploaded file
 */
export async function uploadFileToFirebase(
  uri: string,
  path: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const storage = getFirebaseStorage();
  const storageRef = ref(storage, path);

  // Fetch the file as a blob
  const response = await fetch(uri);
  const blob = await response.blob();

  // Upload to Firebase Storage
  await uploadBytes(storageRef, blob, { contentType });

  // Get download URL
  const downloadUrl = await getDownloadURL(storageRef);
  return downloadUrl;
}

/**
 * Upload an image for a specific type (avatar, post, organization, event)
 */
export async function uploadImage(
  uri: string,
  type: 'avatar' | 'post' | 'organization' | 'event',
  userId: string,
  fileName?: string
): Promise<string> {
  const timestamp = Date.now();
  const extension = fileName?.split('.').pop() || 'jpg';
  const path = `${type}s/${userId}/${timestamp}.${extension}`;

  // Determine content type from extension
  const contentType = getContentType(extension);

  return uploadFileToFirebase(uri, path, contentType);
}

function getContentType(extension: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
  };
  return types[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Check if Firebase is configured
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket
  );
}
