import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

type ServiceAccount = {
  project_id?: string
  client_email?: string
  private_key?: string
}

const resolveServiceAccount = (rawServiceAccount: string): ServiceAccount | null => {
  const trimmed = rawServiceAccount.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed) as ServiceAccount
  } catch {
    try {
      const filePath = resolve(process.cwd(), trimmed)
      if (!existsSync(filePath)) return null
      return JSON.parse(readFileSync(filePath, 'utf8').trim()) as ServiceAccount
    } catch {
      return null
    }
  }
}

export const getAdminDb = () => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!rawServiceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not configured.')
  }

  const serviceAccount = resolveServiceAccount(rawServiceAccount)
  if (!serviceAccount?.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email, or private_key.')
  }

  const existingApp = getApps()[0]
  const app =
    existingApp ??
    initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
      }),
    })

  return getFirestore(app)
}
