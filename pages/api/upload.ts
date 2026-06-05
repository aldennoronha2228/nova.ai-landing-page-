import type { NextApiRequest, NextApiResponse } from 'next'
import { getStorage } from 'firebase-admin/storage'
import { getAdminApp } from '../../src/server/firebaseAdmin'

// 110MB limit to support video uploads as base64
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '110mb',
    },
  },
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_VIDEO_TYPES = new Set(['video/mp4', 'video/quicktime']) // quicktime = .mov
const IMAGE_MAX_BYTES = 10 * 1024 * 1024  // 10MB
const VIDEO_MAX_BYTES = 100 * 1024 * 1024 // 100MB

const resolveStorageBucket = () => {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!bucketName) {
    throw new Error(
      'Firebase Storage is not configured. Set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your .env file.'
    )
  }

  // This ensures the Admin app is initialized with the storageBucket option
  const adminApp = getAdminApp()

  // Use the bucket from env — works for both *.appspot.com and *.firebasestorage.app
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

    const isImage = ALLOWED_IMAGE_TYPES.has(type)
    const isVideo = ALLOWED_VIDEO_TYPES.has(type)

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

    // Build storage path: alpha-projects/{applicationId}/{timestamp}_{filename}
    const safeAppId = applicationId
      ? String(applicationId).replace(/[^a-zA-Z0-9_-]/g, '')
      : `app_${Date.now()}`
    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `alpha-projects/${safeAppId}/${Date.now()}_${safeName}`
    const file = bucket.file(storagePath)

    await file.save(buffer, {
      metadata: { contentType: type },
    })

    // Make the file publicly readable
    await file.makePublic()

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

    const msg = error instanceof Error ? error.message : 'Upload failed.'

    // Friendlier message for common Firebase Storage errors
    if (msg.includes('does not exist') || msg.includes('Not Found') || msg.includes('404')) {
      return res.status(500).json({
        message:
          'Firebase Storage bucket not found. Please enable Firebase Storage in your Firebase Console (Firestore → Storage → Get Started), then restart the dev server.',
      })
    }

    return res.status(500).json({ message: msg })
  }
}
