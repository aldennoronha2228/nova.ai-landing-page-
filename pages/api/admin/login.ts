import type { NextApiRequest, NextApiResponse } from 'next'
import {
  createAdminSessionCookie,
  isApprovedAdminEmail,
  verifyAdminPassword,
} from '../../../src/server/adminAuth'
import { createActivity } from '../../../src/server/adminData'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const email = normalizeEmail(String(req.body?.email ?? ''))
  const password = String(req.body?.password ?? '')

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ message: 'Admin login is not configured.' })
  }

  if (!email || !password || !(await isApprovedAdminEmail(email)) || !verifyAdminPassword(password)) {
    return res.status(401).json({ message: 'Invalid admin credentials.' })
  }

  res.setHeader('Set-Cookie', createAdminSessionCookie(email))

  try {
    await createActivity('Admin logged in', 'login', email)
  } catch {
    // Login should still succeed if activity storage is temporarily unavailable.
  }

  return res.status(200).json({ email })
}
