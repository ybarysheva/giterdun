import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "your-app-id",
};

// Initialize Firebase
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

let db: Firestore;

const initializeDb = async () => {
    if (db) return db;

    const firestore = getFirestore();
    try {
        await enableIndexedDbPersistence(firestore);
    } catch (err: any) {
        if (err.code == 'failed-precondition') {
            console.warn('Firebase persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
            console.warn('Firebase persistence failed: browser does not support it.');
        }
    }
    db = firestore;
    return db;
};

export const getDb = async () => {
    if (typeof window === 'undefined') {
        // On the server, return a non-persistent instance
        return getFirestore();
    }
    // On the client, initialize with persistence
    return await initializeDb();
}
