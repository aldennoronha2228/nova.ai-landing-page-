import type { NextApiRequest, NextApiResponse } from 'next'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL

const getStringField = (body: unknown, field: string): string => {
  if (!body) return ''

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>
      const value = parsed[field]
      return typeof value === 'string' ? value.trim() : ''
    } catch {
      return ''
    }
  }

  if (typeof body === 'object' && body !== null && field in body) {
    const value = (body as Record<string, unknown>)[field]
    return typeof value === 'string' ? value.trim() : ''
  }

  return ''
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

const isValidPhone = (value: string): boolean =>
  /^[+()\d\s.-]{7,}$/.test(value)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const name = getStringField(req.body, 'name')
  const phone = getStringField(req.body, 'phone')
  const email = getEmailFromBody(req.body)

  if (!name || !phone || !email) {
    return res.status(400).json({ message: 'Please provide your name, phone number, and email address.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' })
  }

  if (!isValidPhone(phone)) {
    return res.status(400).json({ message: 'Please provide a valid phone number.' })
  }

  const emailConfigured = Boolean(resendApiKey && senderEmail)
  let emailSent = false
  const firstName = name.split(/\s+/)[0] || 'there'

  try {
    if (resendApiKey && senderEmail) {
      try {
        const textBody = `Hi ${firstName},

Thank you for joining the Nova AI Beta.

We're building Nova AI to make hardware development dramatically faster — from circuit design and component selection to embedded software generation and simulation, all powered by AI.

As one of our early beta users, you'll get:

- Early access to new features
- Priority invitations to private testing
- Direct influence on our product roadmap
- Exclusive updates from the Nova AI team

We're still in the early stages, and your feedback will help shape the future of the platform.

We'll be in touch soon with updates, sneak peeks, and your beta access details.

Thank you for being part of this journey.

Best regards,

Team Nova AI

Design. Simulate. Build.
The AI Workspace for Hardware Engineers.`
        const htmlBody = `
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
              <p>Hi ${firstName},</p>
              <p>Thank you for joining the Nova AI Beta.</p>
              <p>
                We're building Nova AI to make hardware development dramatically faster - from circuit design and component selection to embedded software generation and simulation, all powered by AI.
              </p>
              <p>As one of our early beta users, you'll get:</p>
              <ul>
                <li>Early access to new features</li>
                <li>Priority invitations to private testing</li>
                <li>Direct influence on our product roadmap</li>
                <li>Exclusive updates from the Nova AI team</li>
              </ul>
              <p>
                We're still in the early stages, and your feedback will help shape the future of the platform.
              </p>
              <p>
                We'll be in touch soon with updates, sneak peeks, and your beta access details.
              </p>
              <p>Thank you for being part of this journey.</p>
              <p>Best regards,</p>
              <p>Team Nova AI</p>
              <p>Design. Simulate. Build.<br/>The AI Workspace for Hardware Engineers.</p>
            </div>
          `

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [email],
            subject: `Welcome to Nova AI Beta, ${firstName}`,
            text: textBody,
            html: htmlBody,
          }),
        })

        if (!resendResponse.ok) {
          const resendError = await resendResponse.text()
          throw new Error(`Resend API error: ${resendError}`)
        }

        emailSent = true
      } catch (err) {
        // non-fatal: log server-side and continue
        // eslint-disable-next-line no-console
        console.warn('Failed to send confirmation email:', err)
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Email service is not configured. Skipping confirmation email.')
    }

    const message = "You're in. Thanks for signing up."

    return res.status(200).json({
      message,
      name,
      phone,
      email,
      saved: true,
      emailed: emailSent,
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send confirmation email.'
    return res.status(500).json({ message })
  }
}
