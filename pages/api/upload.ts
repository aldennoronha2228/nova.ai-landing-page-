import type { NextApiRequest, NextApiResponse } from 'next'
import { getApps } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { getAdminDb } from '../../src/server/firebaseAdmin'

// 110MB limit to support video uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '110mb',
    },
  },
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'] // quicktime = .mov
const IMAGE_MAX_BYTES = 10 * 1024 * 1024  // 10MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100MB

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
    const { name, type, base64, applicationId } = req.body

    if (!name || !type || !base64) {
      return res.status(400).json({ message: 'Missing file details: name, type, and base64 are required.' })
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(type)
    const isVideo = ALLOWED_VIDEO_TYPES.includes(type)

    if (!isImage && !isVideo) {
      return res.status(400).json({
        message: `Unsupported file type: ${type}. Allowed types: JPG, JPEG, PNG, WEBP, MP4, MOV.`,
      })
    }

    // Strip the data URI header (supports both image and video)
    const base64Data = base64.replace(/^data:[a-zA-Z0-9/+]+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Validate file size
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
    if (buffer.byteLength > maxBytes) {
      const limitMB = maxBytes / (1024 * 1024)
      return res.status(400).json({
        message: `File is too large. ${isVideo ? 'Videos' : 'Images'} must be under ${limitMB}MB.`,
      })
    }

    const bucket = resolveStorageBucket()

    // Build storage path
    const safeAppId = applicationId
      ? String(applicationId).replace(/[^a-zA-Z0-9_-]/g, '')
      : `app_${Date.now()}`
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `alpha-projects/${safeAppId}/${Date.now()}_${safeName}`
    const file = bucket.file(storagePath)

    await file.save(buffer, {
      metadata: { contentType: type },
    })

    // Construct public Firebase Storage read URL
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`

    return res.status(200).json({
      url: publicUrl,
      path: file.name,
      type: isVideo ? 'video' : 'image',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('File upload API error:', error)
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Upload failed.' })
  }
}
