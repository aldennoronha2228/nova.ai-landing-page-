import type { NextApiRequest, NextApiResponse } from 'next'
import { readAdminSessionFromCookie } from '../../../src/server/adminAuth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await readAdminSessionFromCookie(req.headers.cookie)
  if (!session) return res.status(401).json({ message: 'Unauthorized' })
  return res.status(200).json({ email: session.email })
}
