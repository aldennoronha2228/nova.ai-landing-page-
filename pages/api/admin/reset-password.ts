import type { NextApiRequest, NextApiResponse } from 'next'
import { getAdminDb } from '../../../src/server/firebaseAdmin'
import { FieldValue } from 'firebase-admin/firestore'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — validate token
  if (req.method === 'GET') {
    const token = String(req.query.token ?? '').trim()
    if (!token) return res.status(400).json({ valid: false, message: 'Token is required.' })

    try {
      const doc = await getAdminDb().collection('admin_password_resets').doc(token).get()
      if (!doc.exists) return res.status(400).json({ valid: false, message: 'Invalid or expired reset link.' })

      const data = doc.data()!
      if (data.used) return res.status(400).json({ valid: false, message: 'This reset link has already been used.' })
      if (Date.now() > data.expiresAt) return res.status(400).json({ valid: false, message: 'This reset link has expired. Please request a new one.' })

      return res.status(200).json({ valid: true, email: data.email })
    } catch (error) {
      return res.status(500).json({ valid: false, message: 'Unable to validate token.' })
    }
  }

  // POST — set new password
  if (req.method === 'POST') {
    const token = String(req.body?.token ?? '').trim()
    const password = String(req.body?.password ?? '').trim()

    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required.' })
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' })

    try {
      const doc = await getAdminDb().collection('admin_password_resets').doc(token).get()
      if (!doc.exists) return res.status(400).json({ message: 'Invalid or expired reset link.' })

      const data = doc.data()!
      if (data.used) return res.status(400).json({ message: 'This reset link has already been used.' })
      if (Date.now() > data.expiresAt) return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' })

      // Store new password in Firestore (overrides the env var at runtime)
      await getAdminDb().collection('settings').doc('admin_auth').set({
        passwordOverride: password,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: data.email,
      }, { merge: true })

      // Mark token as used
      await getAdminDb().collection('admin_password_resets').doc(token).update({
        used: true,
        usedAt: FieldValue.serverTimestamp(),
      })

      return res.status(200).json({ message: 'Password updated successfully. You can now log in.' })
    } catch (error) {
      console.error('[Reset Password Error]', error)
      return res.status(500).json({ message: 'Unable to reset password. Please try again.' })
    }
  }

  return res.status(405).json({ message: 'Method not allowed' })
}
