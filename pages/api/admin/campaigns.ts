import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { createActivity, listApplicants, listCampaigns } from '../../../src/server/adminData'
import { getAdminDb } from '../../../src/server/firebaseAdmin'
import { logEmail, renderTemplate, sendAdminEmail } from '../../../src/server/adminEmail'

// Extend Vercel function timeout to 60s for bulk sends
export const config = { maxDuration: 60 }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ campaigns: await listCampaigns() })
    }

    if (req.method === 'POST') {
      const name = String(req.body?.name ?? '').trim()
      const subject = String(req.body?.subject ?? '').trim()
      const previewText = String(req.body?.previewText ?? '').trim()
      const content = String(req.body?.content ?? '').trim()
      const type = String(req.body?.type ?? 'Custom Campaign')
      const segment = String(req.body?.segment ?? 'approved')
      const mode = String(req.body?.mode ?? 'draft')
      const testEmail = String(req.body?.testEmail ?? '').trim()

      if (!name || !subject || !content) return res.status(400).json({ message: 'Campaign name, subject, and content are required.' })

      const campaignRef = await getAdminDb().collection('email_campaigns').add({
        name,
        subject,
        previewText,
        content,
        type,
        segment,
        status: mode === 'send' || mode === 'test' ? 'sent' : 'draft',
        created_at: FieldValue.serverTimestamp(),
      })

      let sent = 0
      let failures = 0

      if (mode === 'test' && testEmail) {
        let logId: string | undefined
        try {
          logId = await logEmail({ campaignId: campaignRef.id, email: testEmail, status: 'sending' })
          await sendAdminEmail({ to: testEmail, subject, previewText, content, logId })
          sent += 1
          if (logId) {
            await getAdminDb().collection('email_logs').doc(logId).update({ status: 'sent' })
          }
        } catch (err) {
          console.error('[Campaign Test Error]', err)
          failures += 1
          if (logId) {
            await getAdminDb().collection('email_logs').doc(logId).update({ status: 'failed' })
          } else {
            await logEmail({ campaignId: campaignRef.id, email: testEmail, status: 'failed' })
          }
        }
      }

      if (mode === 'send') {
        const applicants = await listApplicants()
        const recipients = applicants.filter((applicant) => {
          if (segment === 'pending') return applicant.status === 'pending'
          if (segment === 'all') return true
          return applicant.status === 'approved' || applicant.status === 'active'
        })

        console.log(`[Campaign] Sending to ${recipients.length} recipients in segment "${segment}"`)

        // Resend rate limit: 2 req/sec on free plan, 10 req/sec on paid
        // Batch size 2 with 600ms delay keeps us safely under free tier
        const BATCH_SIZE = 2
        const BATCH_DELAY_MS = 600

        for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
          const batch = recipients.slice(i, i + BATCH_SIZE)

          await Promise.all(batch.map(async (applicant) => {
            let logId: string | undefined
            try {
              logId = await logEmail({ campaignId: campaignRef.id, email: applicant.email, status: 'sending' })
              await sendAdminEmail({
                to: applicant.email,
                subject: renderTemplate(subject, applicant),
                previewText,
                content: renderTemplate(content, applicant),
                logId,
              })
              sent += 1
              if (logId) await getAdminDb().collection('email_logs').doc(logId).update({ status: 'sent' })
              console.log(`[Campaign] ✓ Sent to ${applicant.email} (${sent}/${recipients.length})`)
            } catch (err) {
              console.error('[Campaign Send Error]', { email: applicant.email, error: err })
              failures += 1
              if (logId) {
                await getAdminDb().collection('email_logs').doc(logId).update({
                  status: 'failed',
                  error_message: err instanceof Error ? err.message : 'Send failed',
                })
              } else {
                await logEmail({ campaignId: campaignRef.id, email: applicant.email, status: 'failed' })
              }
            }
          }))

          // Wait between batches to respect rate limit (skip after last batch)
          if (i + BATCH_SIZE < recipients.length) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
          }
        }

        console.log(`[Campaign] Done. Sent: ${sent}, Failed: ${failures}`)
      }

      await createActivity(`Campaign ${mode === 'draft' ? 'drafted' : 'sent'}: ${name}`, 'campaign', session.email)
      return res.status(200).json({ id: campaignRef.id, sent, failures })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Campaign action failed.' })
  }
}
