import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { createActivity, listApplicants, updateApplicant, type ApplicantStatus } from '../../../src/server/adminData'

const statuses: ApplicantStatus[] = ['pending', 'approved', 'rejected', 'active']

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ applicants: await listApplicants() })
    }

    if (req.method === 'PATCH') {
      const id = String(req.body?.id ?? '')
      const status = req.body?.status as ApplicantStatus | undefined
      const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined

      if (!id) return res.status(400).json({ message: 'Applicant id is required.' })
      if (status && !statuses.includes(status)) return res.status(400).json({ message: 'Invalid status.' })

      await updateApplicant({ id, status, notes })
      await createActivity(`Applicant ${status ? `marked ${status}` : 'updated'}`, 'applicant', session.email)
      return res.status(200).json({ message: 'Applicant updated' })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Admin applicants error.' })
  }
}
