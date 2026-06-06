import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminDb } from '../../../src/server/firebaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let targetUrl = '/'
  try {
    const { id, url } = req.query
    if (typeof url === 'string') targetUrl = decodeURIComponent(url)

    if (typeof id === 'string' && id) {
      try {
        await getAdminDb().collection('email_logs').doc(id).update({
          clicked: true,
          clicked_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Failed to track email click:', err)
      }
    }
  } catch (globalErr) {
    console.error('Global tracking error (click):', globalErr)
  }

  // Redirect to the target URL
  res.writeHead(302, { Location: targetUrl })
  return res.end()
}
