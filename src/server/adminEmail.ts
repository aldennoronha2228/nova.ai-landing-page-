import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin'
import type { AdminApplicant } from './adminData'

// Read at call time — not module load — so env var changes take effect without redeploy
const getSenderEmail = () => process.env.RESEND_FROM_EMAIL?.trim()
const getResendApiKey = () => process.env.RESEND_API_KEY?.trim()

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
  const senderEmail = getSenderEmail()
  const resendApiKey = getResendApiKey()

  if (!resendApiKey) throw new Error('RESEND_API_KEY is not set. Add it in Vercel → Settings → Environment Variables.')
  if (!senderEmail) throw new Error('RESEND_FROM_EMAIL is not set. Add it in Vercel → Settings → Environment Variables.')

  const usesTestSender = /@resend\.dev/i.test(senderEmail)
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

  // Build HTML body
  let html = customHtml || `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Segoe UI,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
        <tr><td style="background:#0f0f14;padding:20px 28px;border-radius:10px 10px 0 0">
          <p style="margin:0;font-size:1.1rem;font-weight:800;color:#fff">WireUp</p>
          <p style="margin:4px 0 0;font-size:0.72rem;color:rgba(255,255,255,0.4);letter-spacing:0.06em;text-transform:uppercase">by NovaBoard AI</p>
        </td></tr>
        <tr><td style="background:#fff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
          ${content.split('\n').map(line => `<p style="margin:0 0 12px;font-size:0.92rem;color:#374151;line-height:1.65">${escapeHtml(line)}</p>`).join('')}
        </td></tr>
        <tr><td style="padding:16px 0;text-align:center">
          <p style="margin:0;font-size:0.72rem;color:#9ca3af">© 2026 NovaBoard AI</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  // Inject tracking pixel
  if (logId) {
    const trackingPixel = `<img src="${baseUrl}/api/t/o?id=${logId}" width="1" height="1" style="display:none" alt="" />`
    html = html.includes('</body>') ? html.replace('</body>', `${trackingPixel}</body>`) : html + trackingPixel
    html = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"/gi, (match, url) => {
      if (url.startsWith('http')) {
        return match.replace(url, `${baseUrl}/api/t/c?id=${logId}&url=${encodeURIComponent(url)}`)
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
    const errorBody = await response.text()
    let hint = ''
    if (usesTestSender) {
      hint = ' Your sender is using the Resend test domain (@resend.dev) which can only deliver to your own verified email. Verify novaboard.dev at resend.com/domains and update RESEND_FROM_EMAIL to hello@novaboard.dev.'
    } else if (response.status === 403) {
      hint = ' Domain not verified in Resend. Go to resend.com/domains and verify novaboard.dev.'
    } else if (response.status === 422) {
      hint = ' Invalid email address or missing required fields.'
    } else if (response.status === 429) {
      hint = ' Rate limit hit. Wait a moment and try again.'
    }
    console.error('[Resend Error]', { status: response.status, error: errorBody, to, from: senderEmail })
    throw new Error(`Email to ${to} failed (${response.status}): ${errorBody}${hint}`)
  }

  const data = (await response.json()) as { id?: string }
  console.log(`[Resend OK] → ${to} | ID: ${data.id}`)
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
