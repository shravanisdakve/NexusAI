// Firebase Connection Test
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
    console.log("🔍 Testing Firebase Connection...");

    if (!db) {
        console.error("❌ Firebase DB is not initialized!");
        console.log("Check your firebase.ts file and ensure:");
        console.log("1. All Firebase config values are set correctly");
        console.log("2. Firebase is properly initialized");
        return false;
    }

    console.log("✅ Firebase DB instance exists");

    try {
        // Try to fetch courses collection
        const coursesCollection = collection(db, 'courses');
        const snapshot = await getDocs(coursesCollection);
        console.log(`✅ Successfully connected to Firestore!`);
        console.log(`📚 Found ${snapshot.docs.length} existing courses`);
        return true;
    } catch (error) {
        console.error("❌ Error connecting to Firestore:", error);
        if (error instanceof Error) {
            if (error.message.includes("Missing or insufficient permissions")) {
                console.error("⚠️ PERMISSION DENIED: Check your Firestore security rules");
                console.log("Go to Firebase Console → Firestore Database → Rules");
                console.log("For development, you can use:");
                console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null; // Requires authentication
      // OR for testing only:
      // allow read, write: if true; // WARNING: DO NOT USE IN PRODUCTION
    }
  }
}
                `);
            } else if (error.message.includes("The query requires an index")) {
                console.error("⚠️ INDEX REQUIRED: Create the required index in Firebase Console");
            }
        }
        return false;
    }
};
