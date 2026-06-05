import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { createActivity, listApplicants, updateApplicant, type ApplicantStatus } from '../../../src/server/adminData'
import { getAdminDb } from '../../../src/server/firebaseAdmin'
import { logEmail, renderTemplate, sendAdminEmail } from '../../../src/server/adminEmail'

const defaultAcceptance = `Hi {{name}},

Your NovaBoard AI Alpha application has been approved.

We are opening access in carefully managed batches and will follow up with onboarding details soon.

Team NovaBoard AI`

const defaultRejection = `Hi {{name}},

Thank you for applying to the NovaBoard AI Alpha.

We are keeping this first testing group small, so we cannot approve every application immediately. We will keep your application on file for future access waves.

Team NovaBoard AI`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const ids = Array.isArray(req.body?.ids) ? (req.body.ids as unknown[]).map(String).filter(Boolean) : []
  const action = String(req.body?.action ?? '')
  if (!ids.length) return res.status(400).json({ message: 'Select at least one applicant.' })

  try {
    const applicants = (await listApplicants()).filter((applicant) => ids.includes(applicant.id))
    const status: ApplicantStatus | null = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : null
    let emailsSent = 0
    let failures = 0

    if (status) {
      await Promise.all(applicants.map((applicant) => updateApplicant({ id: applicant.id, status })))
    }

    if (action === 'approve' || action === 'reject' || action === 'email') {
      const campaignRef = await getAdminDb().collection('email_campaigns').add({
        name: action === 'approve' ? 'Bulk Alpha Acceptance' : action === 'reject' ? 'Bulk Alpha Rejection' : 'Bulk Admin Email',
        subject: action === 'reject' ? 'NovaBoard AI Alpha application update' : 'NovaBoard AI Alpha update',
        content: action === 'reject' ? defaultRejection : defaultAcceptance,
        type: action === 'approve' ? 'Alpha Acceptance' : action === 'reject' ? 'Alpha Rejection' : 'Custom Campaign',
        status: 'sent',
        created_at: FieldValue.serverTimestamp(),
      })

      for (const applicant of applicants) {
        try {
          await sendAdminEmail({
            to: applicant.email,
            subject: action === 'reject' ? 'NovaBoard AI Alpha application update' : 'NovaBoard AI Alpha update',
            content: renderTemplate(action === 'reject' ? defaultRejection : defaultAcceptance, applicant),
          })
          emailsSent += 1
          await logEmail({ campaignId: campaignRef.id, email: applicant.email, status: 'sent' })
        } catch {
          failures += 1
          await logEmail({ campaignId: campaignRef.id, email: applicant.email, status: 'failed' })
        }
      }
    }

    await createActivity(`Bulk action completed: ${action}`, 'bulk', session.email)
    return res.status(200).json({ updated: applicants.length, emailsSent, failures })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Bulk action failed.' })
  }
}
