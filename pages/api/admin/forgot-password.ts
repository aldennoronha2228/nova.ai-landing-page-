import type { NextApiRequest, NextApiResponse } from 'next'
import { randomBytes } from 'crypto'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../../src/server/firebaseAdmin'
import { isApprovedAdminEmail } from '../../../src/server/adminAuth'
import { sendAdminEmail } from '../../../src/server/adminEmail'

const TOKEN_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const email = String(req.body?.email ?? '').trim().toLowerCase()
  if (!email) return res.status(400).json({ message: 'Email is required.' })

  // Always return success to avoid email enumeration
  const genericResponse = { message: 'If that email is registered, a reset link has been sent.' }

  try {
    const approved = await isApprovedAdminEmail(email)
    if (!approved) return res.status(200).json(genericResponse)

    const token = randomBytes(32).toString('hex')
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS

    // Store token in Firestore
    await getAdminDb().collection('admin_password_resets').doc(token).set({
      email,
      expiresAt,
      used: false,
      created_at: FieldValue.serverTimestamp(),
    })

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://novaboard.dev').replace(/\/$/, '')
    const resetUrl = `${siteUrl}/admin/reset-password?token=${token}`

    await sendAdminEmail({
      to: email,
      subject: 'NovaBoard Admin — Password Reset',
      content: `You requested a password reset for your NovaBoard Admin account.\n\nReset link (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email. Your password will not change.`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px">
        <tr><td style="background:#0f0f14;padding:24px 28px;border-radius:10px 10px 0 0;text-align:center">
          <p style="margin:0;font-size:1.1rem;font-weight:800;color:#fff">NovaBoard Admin</p>
          <p style="margin:4px 0 0;font-size:0.72rem;color:rgba(255,255,255,0.4);letter-spacing:0.06em;text-transform:uppercase">Password Reset</p>
        </td></tr>
        <tr><td style="background:#fff;padding:32px 28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
          <p style="margin:0 0 16px;font-size:0.95rem;color:#374151;line-height:1.6">You requested a password reset for your admin account.</p>
          <p style="margin:0 0 24px;font-size:0.95rem;color:#374151;line-height:1.6">Click the button below. This link expires in <strong>15 minutes</strong>.</p>
          <table cellpadding="0" cellspacing="0" style="margin-bottom:24px">
            <tr><td style="background:#0f0f14;border-radius:8px;padding:12px 28px">
              <a href="${resetUrl}" style="color:#fff;font-size:0.9rem;font-weight:600;text-decoration:none">Reset Password →</a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:0.8rem;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    })

    return res.status(200).json(genericResponse)
  } catch (error) {
    console.error('[Forgot Password Error]', error)
    // Still return generic success to avoid leaking info
    return res.status(200).json(genericResponse)
  }
}
