const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Try different bucket names
const bucketNames = [
  'mobilizer-fc4ea.appspot.com',
  'mobilizer-fc4ea.firebasestorage.app', 
  'mobilizer-fc4ea',
  process.env.FIREBASE_STORAGE_BUCKET
];

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function checkBuckets() {
  for (const name of bucketNames) {
    if (!name) continue;
    try {
      console.log('Checking bucket:', name);
      const bucket = admin.storage().bucket(name);
      const [exists] = await bucket.exists();
      console.log('  Exists:', exists);
      if (exists) {
        console.log('  ✓ Found working bucket:', name);
        return name;
      }
    } catch (err) {
      console.log('  Error:', err.message);
    }
  }
  return null;
}

checkBuckets().then((found) => {
  if (found) {
    console.log('\nUse this bucket name:', found);
  } else {
    console.log('\nNo bucket found. Make sure Firebase Storage is enabled.');
  }
  process.exit(0);
});
