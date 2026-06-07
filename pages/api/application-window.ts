import type { NextApiRequest, NextApiResponse } from 'next'
import { getApplicationWindow } from '../../src/server/adminData'

// Public endpoint — no auth required, alpha page uses this to check if applications are open
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const window = await getApplicationWindow()
    return res.status(200).json(window)
  } catch (error) {
    // Fail open — if we can't read the setting, allow applications
    return res.status(200).json({ isOpen: true, startTime: null, deadline: null, closedMessage: '' })
  }
}
