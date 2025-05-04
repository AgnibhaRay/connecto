import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Read and parse the service account file
const serviceAccount: ServiceAccount = JSON.parse(
  readFileSync(join(__dirname, '../firebase-admin.json'), 'utf8')
);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminUser(email: string): Promise<void> {
  try {
    // Find user by email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log('No user found with that email');
      process.exit(1);
    }

    // Get the first matching document
    const userDoc = snapshot.docs[0];
    
    // Update the user document
    await userDoc.ref.update({
      isAdmin: true,
      updatedAt: new Date()
    });

    console.log(`Successfully set ${email} as admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('Please provide a valid email address');
  process.exit(1);
}

setAdminUser(email).catch((error) => {
  console.error('Unhandled error:', error instanceof Error ? error.message : error);
  process.exit(1);
});