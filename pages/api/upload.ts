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

const normalizeEnvValue = (value: string | undefined) => {
  if (!value) return ''

  const trimmed = value.trim()
  const withoutQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1).trim()
      : trimmed

  return withoutQuotes
}

const getCloudinaryConfig = () => {
  const cloudName = normalizeEnvValue(process.env.CLOUDINARY_CLOUD_NAME)
  const apiKey = normalizeEnvValue(process.env.CLOUDINARY_API_KEY)
  const apiSecret = normalizeEnvValue(process.env.CLOUDINARY_API_SECRET)

  return { cloudName, apiKey, apiSecret }
}

const getErrorDetails = (err: unknown) => {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
    }
  }

  if (typeof err === 'object' && err !== null) {
    const anyErr = err as Record<string, unknown>
    const nestedError =
      typeof anyErr.error === 'object' && anyErr.error !== null
        ? (anyErr.error as Record<string, unknown>)
        : null

    return {
      message:
        typeof anyErr.message === 'string'
          ? anyErr.message
          : nestedError && typeof nestedError.message === 'string'
            ? nestedError.message
            : typeof anyErr.error === 'string'
              ? anyErr.error
              : 'Cloudinary request failed',
      name: typeof anyErr.name === 'string' ? anyErr.name : 'CloudinaryError',
      http_code:
        typeof anyErr.http_code === 'number'
          ? anyErr.http_code
          : nestedError && typeof nestedError.http_code === 'number'
            ? nestedError.http_code
            : undefined,
    }
  }

  return {
    message: String(err),
    name: 'UnknownError',
  }
}

const ensureCloudinary = () => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

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
  if (req.method === 'GET') {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig()

    try {
      ensureCloudinary()
      await cloudinary.api.ping()

      return res.status(200).json({
        configured: true,
        credentialsValid: true,
        cloudName,
        apiKeyLength: apiKey.length,
        apiSecretLength: apiSecret.length,
      })
    } catch (err) {
      const errorDetails = getErrorDetails(err)

      return res.status(200).json({
        configured: Boolean(cloudName && apiKey && apiSecret),
        credentialsValid: false,
        cloudName,
        apiKeyLength: apiKey.length,
        apiSecretLength: apiSecret.length,
        error: errorDetails.message,
        errorName: errorDetails.name,
        httpCode: errorDetails.http_code,
      })
    }
  }

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

    // Strip the data URI header more robustly
    // The prefix looks like "data:image/png;base64,"
    const parts = base64.split(';base64,')
    const base64Data = parts.length > 1 ? parts[1] : parts[0]
    const buffer = Buffer.from(base64Data, 'base64')

    // Validate file size
    const maxBytes = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES
    if (buffer.byteLength > maxBytes) {
      const limitMB = maxBytes / (1024 * 1024)
      return res.status(400).json({
        message: `File is too large. ${isVideo ? 'Videos' : 'Images'} must be under ${limitMB}MB.`,
      })
    }

    try {
      ensureCloudinary()
    } catch (err) {
      console.error('Cloudinary configuration error:', err)
      return res.status(500).json({
        message: err instanceof Error ? err.message : 'Cloudinary configuration error',
      })
    }

    // Build a Cloudinary folder path: alpha-projects/{applicationId}
    const safeAppId = applicationId
      ? String(applicationId).replace(/[^a-zA-Z0-9_-]/g, '')
      : `app_${Date.now()}`
    const folder = `alpha-projects/${safeAppId}`
    const safeNameNoExt = name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '_')
    const publicId = `${Date.now()}_${safeNameNoExt}`

    // Use the original base64 string if it has the prefix, or reconstruct it
    const uploadString = base64.startsWith('data:') ? base64 : `data:${type};base64,${base64Data}`

    console.log(`[Upload] Starting Cloudinary upload: name=${name}, type=${type}, folder=${folder}`)

    const uploadResult = await cloudinary.uploader.upload(uploadString, {
      folder: folder,
      public_id: publicId,
      resource_type: isVideo ? 'video' : 'image',
    })

    // Log the successful upload for debugging
    console.log(`[Upload] Success: ${uploadResult.secure_url}`)

    return res.status(200).json({
      url: uploadResult.secure_url,
      path: uploadResult.public_id,
      type: uploadResult.resource_type === 'video' ? 'video' : 'image',
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Upload] API Error:', error)

    let msg = 'Upload failed.'
    
    if (error instanceof Error) {
      msg = error.message
    }

    // Handle Cloudinary specific error structure
    // Cloudinary errors often look like { message: '...', http_code: 400 }
    if (typeof error === 'object' && error !== null) {
      const anyErr = error as any
      if (anyErr.message) msg = anyErr.message
      if (anyErr.error && anyErr.error.message) msg = anyErr.error.message
    }

    console.error(`[Upload] Returning error to client: ${msg}`)

    // Friendlier message for common Cloudinary configuration errors
    if (msg.includes('cloud_name') || msg.includes('api_key') || msg.includes('api_secret') || msg.includes('not configured')) {
      return res.status(500).json({
        message: 'Cloudinary is not configured correctly. Please check your .env file and RESTART your dev server.',
      })
    }

    return res.status(500).json({ message: msg })
  }
}
