import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { addAdminEmail, listAdminEmails, removeAdminEmail, setAdminEmailNotifications } from '../../../src/server/adminData'

const normalizeEmail = (value: unknown) => String(value ?? '').trim().toLowerCase()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return

  try {
    if (req.method === 'GET') {
      const emails = await listAdminEmails()
      return res.status(200).json({
        emails: emails.map((entry) => entry.email),
        entries: emails,
      })
    }

    if (req.method === 'POST') {
      const email = normalizeEmail(req.body?.email)
      if (!email) return res.status(400).json({ message: 'Email is required.' })
      await addAdminEmail(email)
      return res.status(200).json({ email })
    }

    if (req.method === 'DELETE') {
      const email = normalizeEmail(req.query.email)
      if (!email) return res.status(400).json({ message: 'Email is required.' })
      await removeAdminEmail(email)
      return res.status(200).json({ email })
    }

    if (req.method === 'PUT') {
      const email = normalizeEmail(req.body?.email)
      if (!email) return res.status(400).json({ message: 'Email is required.' })

      const enabled = Boolean(req.body?.notificationsEnabled)
      await setAdminEmailNotifications(email, enabled)
      return res.status(200).json({ email, notificationsEnabled: enabled })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Admin email action failed.' })
  }
}
