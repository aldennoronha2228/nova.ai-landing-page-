import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin'
import type { AdminApplicant } from './adminData'

const senderEmail = process.env.RESEND_FROM_EMAIL
const resendApiKey = process.env.RESEND_API_KEY

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const renderTemplate = (template: string, applicant: Pick<AdminApplicant, 'name' | 'email'>) =>
  template.replace(/{{name}}/g, applicant.name || 'there').replace(/{{email}}/g, applicant.email)

export const sendAdminEmail = async ({
  to,
  subject,
  content,
  previewText,
}: {
  to: string
  subject: string
  content: string
  previewText?: string
}) => {
  if (!senderEmail || !resendApiKey) {
    throw new Error('Resend is not configured.')
  }

  const html = `
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(previewText || '')}</div>
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.65;color:#111827">
      ${content
        .split('\n')
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('')}
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: senderEmail,
      to: [to],
      subject,
      text: content,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(await response.text())
  }

  return response.json() as Promise<{ id?: string }>
}

export const logEmail = async ({
  campaignId,
  email,
  status,
}: {
  campaignId: string
  email: string
  status: string
}) => {
  await getAdminDb().collection('email_logs').add({
    campaign_id: campaignId,
    email,
    status,
    opened: false,
    clicked: false,
    sent_at: FieldValue.serverTimestamp(),
  })
}
