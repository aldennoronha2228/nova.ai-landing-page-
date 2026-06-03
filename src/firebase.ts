import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
}

function initFirebase() {
  try {
    const isConfigured = Object.values(firebaseConfig).every(Boolean)
    if (!isConfigured) {
      return { app: null, analytics: null, db: null }
    }

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
