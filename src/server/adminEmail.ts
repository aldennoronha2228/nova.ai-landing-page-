import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin'
import type { AdminApplicant } from './adminData'

const senderEmail = process.env.RESEND_FROM_EMAIL?.trim()
const resendApiKey = process.env.RESEND_API_KEY?.trim()

const usesResendTestSender = Boolean(senderEmail && /@resend\.dev/i.test(senderEmail))

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
  html: customHtml,
  previewText,
  logId,
}: {
  to: string
  subject: string
  content: string
  html?: string
  previewText?: string
  logId?: string
}) => {
  if (!senderEmail || !resendApiKey) {
    throw new Error('Resend is not configured.')
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  let html = customHtml || `
    <div style="display:none;max-height:0;overflow:hidden">${escapeHtml(previewText || '')}</div>
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.65;color:#111827">
      ${content
        .split('\n')
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('')}
    </div>
  `

  // Add tracking pixel and rewrite links if logId is provided
  if (logId) {
    const trackingPixel = `<img src="${baseUrl}/api/t/o?id=${logId}" width="1" height="1" style="display:none" alt="" />`
    
    // If it's custom HTML, we might need to be more careful, but for now we just append/inject
    if (html.includes('</body>')) {
      html = html.replace('</body>', `${trackingPixel}</body>`)
    } else {
      html += trackingPixel
    }

    // Simple link rewriting for tracking
    // Matches <a href="..."> and replaces with <a href="baseUrl/api/t/c?id=logId&url=url">
    html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi, (match, url) => {
      if (url.startsWith('http')) {
        const trackedUrl = `${baseUrl}/api/t/c?id=${logId}&url=${encodeURIComponent(url)}`
        return match.replace(url, trackedUrl)
      }
      return match
    })
  }

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
    const errorText = await response.text()
    const deliveryHint = usesResendTestSender
      ? ' Resend is currently using the test sender. Verify your domain in Resend and update RESEND_FROM_EMAIL to use that domain before sending to real applicants.'
      : ''
    console.error('[Resend Error]', {
      status: response.status,
      error: errorText,
      to,
      from: senderEmail,
    })
    throw new Error(`Email failed: ${errorText}${deliveryHint}`)
  }

  const data = (await response.json()) as { id?: string }
  console.log(`[Resend Success] Email sent to ${to}, ID: ${data.id}`)
  return data
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
  try {
    const docRef = await getAdminDb().collection('email_logs').add({
      campaign_id: campaignId,
      email,
      status,
      opened: false,
      clicked: false,
      sent_at: FieldValue.serverTimestamp(),
    })
    console.log(`[Email Log] Created entry ${docRef.id} for ${email}`)
    return docRef.id
  } catch (err) {
    console.error('[Email Log Error] Failed to create log entry:', err)
    throw err
  }
}

export const sendTrackedEmail = async ({
  to,
  subject,
  content,
  html,
  previewText,
  campaignId = 'system',
}: {
  to: string
  subject: string
  content: string
  html?: string
  previewText?: string
  campaignId?: string
}) => {
  let logId: string | undefined

  try {
    logId = await logEmail({ campaignId, email: to, status: 'sending' })
  } catch (err) {
    console.warn('[Email Log Warning] Sending email without tracking log:', err)
  }

  try {
    const result = await sendAdminEmail({ to, subject, content, html, previewText, logId })
    if (logId) {
      await getAdminDb().collection('email_logs').doc(logId).update({ status: 'sent' })
    }
    return result
  } catch (err) {
    if (logId) {
      await getAdminDb().collection('email_logs').doc(logId).update({
        status: 'failed',
        error_message: err instanceof Error ? err.message : 'Email delivery failed.',
      })
    }
    throw err
  }
}
