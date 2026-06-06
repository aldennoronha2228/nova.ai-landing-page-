import type { NextApiRequest, NextApiResponse } from 'next'
import { v2 as cloudinary } from 'cloudinary'

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

const ensureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.'
    )
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
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

    ensureCloudinary()

    // Build a Cloudinary folder path: alpha-projects/{applicationId}
    const safeAppId = applicationId
      ? String(applicationId).replace(/[^a-zA-Z0-9_-]/g, '')
      : `app_${Date.now()}`
    const safeName = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_')

    const folder = `alpha-projects/${safeAppId}`
    const publicId = `${folder}/${Date.now()}_${safeName}`

    // Reconstruct data URI for Cloudinary upload
    const dataUri = `data:${type};base64,${base64Data}`

    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: isVideo ? 'video' : 'image',
      overwrite: false,
      folder: undefined, // folder is embedded in public_id
    })

    return res.status(200).json({
      url: uploadResult.secure_url,
      path: uploadResult.public_id,
      type: isVideo ? 'video' : 'image',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('File upload API error:', error)

    const msg = error instanceof Error ? error.message : 'Upload failed.'

    // Friendlier message for common Cloudinary errors
    if (msg.includes('Invalid') || msg.includes('not configured')) {
      return res.status(500).json({
        message:
          'Cloudinary is not configured correctly. Please check your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.',
      })
    }

    return res.status(500).json({ message: msg })
  }
}
