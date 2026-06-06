import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminDb } from '../../../src/server/firebaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query

    if (typeof id === 'string' && id) {
      try {
        await getAdminDb().collection('email_logs').doc(id).update({
          opened: true,
          opened_at: new Date().toISOString(),
        })
      } catch (err) {
        // Ignore errors, we still want to return the pixel
        console.error('Failed to track email open:', err)
      }
    }
  } catch (globalErr) {
    console.error('Global tracking error (open):', globalErr)
  }

  // Return a 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  )

  res.setHeader('Content-Type', 'image/gif')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  return res.status(200).send(pixel)
}
