import type { NextApiRequest, NextApiResponse } from 'next'
import { getApps } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { getAdminDb } from '../../src/server/firebaseAdmin'

// Set body size limit to 4MB to support base64 image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
}

const resolveStorageBucket = () => {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!bucketName) {
    throw new Error('Firebase storage bucket is not configured.')
  }

  // Ensure Firebase Admin is initialized
  getAdminDb()

  const adminApp = getApps()[0]
  if (!adminApp) {
    throw new Error('Firebase Admin App failed to initialize.')
  }

  return getStorage(adminApp).bucket(bucketName)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { name, type, base64 } = req.body
    if (!name || !type || !base64) {
      return res.status(400).json({ message: 'Missing file details: name, type, and base64 are required.' })
    }

    // Extract raw base64 data
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const bucket = resolveStorageBucket()
    const uniqueName = `alpha_applications/${Date.now()}_${name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const file = bucket.file(uniqueName)

    await file.save(buffer, {
      metadata: {
        contentType: type,
      },
    })

    // Construct public Firebase Storage read URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`

    return res.status(200).json({ url: publicUrl, path: file.name })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('File upload API error:', error)
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Upload failed.' })
  }
}
