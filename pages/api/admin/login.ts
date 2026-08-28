import type { NextApiRequest, NextApiResponse } from 'next'
import {
  checkRateLimit,
  createAdminSessionCookie,
  isApprovedAdminEmail,
  recordFailedLogin,
  recordSuccessfulLogin,
  verifyAdminPassword,
} from '../../../src/server/adminAuth'
import { createActivity } from '../../../src/server/adminData'

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const email = normalizeEmail(String(req.body?.email ?? ''))
  const password = String(req.body?.password ?? '')
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ message: 'Admin login is not configured.' })
  }

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' })
  }

  try {
    const rateLimit = await checkRateLimit(email, ip)
    if (rateLimit.blocked) {
      const message = rateLimit.type === 'ip' 
        ? `Too many failed attempts from this IP. Please try again in ${rateLimit.remainingMinutes} minutes.`
        : `Too many failed attempts for this account. Please try again in ${rateLimit.remainingMinutes} minutes.`
      
      return res.status(429).json({ message })
    }

    const isApproved = await isApprovedAdminEmail(email)
    const isValidPassword = await verifyAdminPassword(password)

    if (!isApproved || !isValidPassword) {
      await recordFailedLogin(email, ip)
      return res.status(401).json({ message: 'Invalid admin credentials.' })
    }

    // Success
    await recordSuccessfulLogin(email, ip)
    res.setHeader('Set-Cookie', createAdminSessionCookie(email))

    try {
      await createActivity('Admin logged in', 'login', email)
    } catch {
      // Login should still succeed if activity storage is temporarily unavailable.
    }

    return res.status(200).json({ email })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ message: 'An internal error occurred during login.' })
  }
}
