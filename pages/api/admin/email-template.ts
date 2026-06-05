import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { getSignupTemplate, saveSignupTemplate } from '../../../src/server/adminData'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return

  try {
    if (req.method === 'GET') {
      const template = await getSignupTemplate()
      return res.status(200).json(template || { subject: '', bodyText: '', bodyHtml: '' })
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { subject, bodyText, bodyHtml } = req.body
      if (!subject || !bodyText || !bodyHtml) {
        return res.status(400).json({ message: 'Subject, Text Body, and HTML Body are required.' })
      }
      await saveSignupTemplate({ subject, bodyText, bodyHtml })
      return res.status(200).json({ message: 'Template saved successfully.' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Action failed.' })
  }
}
