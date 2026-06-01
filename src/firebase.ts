import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyCpYjIBNnY8aigW1SGJ1vzwWu0-xubNjng',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'bmshavkathon.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'bmshavkathon',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'bmshavkathon.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '364939405585',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '1:364939405585:web:d20e54ca41e754898b84b0',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? 'G-JRP7E3FHQ7',
}

function initFirebase() {
  try {
    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    let analytics: ReturnType<typeof getAnalytics> | null = null
    try {
      if (typeof window !== 'undefined') {
        analytics = getAnalytics(app)
      }
    } catch {
      analytics = null
    }
    const db = getFirestore(app)
    return { app, analytics, db }
  } catch (err) {
    // If initialization fails, return nulls
    return { app: null, analytics: null, db: null }
  }
}

export const firebase = initFirebase()
