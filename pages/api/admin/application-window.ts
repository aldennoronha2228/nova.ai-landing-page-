import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { getApplicationWindow, saveApplicationWindow } from '../../../src/server/adminData'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return

  try {
    if (req.method === 'GET') {
      const window = await getApplicationWindow()
      return res.status(200).json(window)
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { isOpen, deadline, closedMessage } = req.body
      await saveApplicationWindow({
        isOpen: Boolean(isOpen),
        deadline: deadline ? String(deadline) : null,
        closedMessage: closedMessage ? String(closedMessage) : '',
      })
      return res.status(200).json({ message: 'Application window updated.' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Action failed.' })
  }
}
