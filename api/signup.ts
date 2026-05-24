import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL

const resend = resendApiKey ? new Resend(resendApiKey) : null

type VercelRequest = {
  method?: string
  body?: unknown
}

type VercelResponse = {
  status: (code: number) => VercelResponse
  json: (body: unknown) => void
}

const getEmailFromBody = (body: unknown): string => {
  if (!body) return ''

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as { email?: unknown }
      return typeof parsed.email === 'string' ? parsed.email.trim() : ''
    } catch {
      return ''
    }
  }

  if (typeof body === 'object' && body !== null && 'email' in body) {
    const raw = (body as { email?: unknown }).email
    return typeof raw === 'string' ? raw.trim() : ''
  }

  return ''
}

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  if (!resend || !senderEmail) {
    return res.status(500).json({
      message:
        'Email service is not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL.',
    })
  }

  const email = getEmailFromBody(req.body)
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' })
  }

  try {
    await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: 'Welcome to Nova AI Beta',
      html: `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
          <h2 style="margin-bottom:8px;">Thanks for signing up for Nova AI</h2>
          <p style="margin-top:0;">
            We have received your request for early access. You are now on our beta waitlist.
          </p>
          <p>
            We will reach out soon with onboarding details, product updates, and your invite as we expand access.
          </p>
          <p style="margin-top:24px;">Team Nova AI</p>
        </div>
      `,
    })

    return res.status(200).json({
      message:
        "You're in. Thanks for signing up. We've sent a thank-you email from Nova AI.",
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send confirmation email.'
    return res.status(500).json({ message })
  }
}
