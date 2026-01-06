const admin = require('firebase-admin');
const { PrismaClient } = require('@prisma/client');
const https = require('https');
const fs = require('fs');

const prisma = new PrismaClient();

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

console.log('Storage bucket:', storageBucket);

if (!storageBucket) {
  console.error('FIREBASE_STORAGE_BUCKET not set');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: storageBucket,
});

async function checkBucket() {
  try {
    const bucket = admin.storage().bucket();
    const [exists] = await bucket.exists();
    console.log('Bucket exists:', exists);
    
    if (!exists) {
      console.log('Storage bucket does not exist. Please enable Firebase Storage in your Firebase Console.');
      console.log('Go to: https://console.firebase.google.com/project/' + serviceAccount.project_id + '/storage');
    }
    return exists;
  } catch (err) {
    console.error('Error checking bucket:', err.message);
    return false;
  }
}

checkBucket().then(() => process.exit(0));
