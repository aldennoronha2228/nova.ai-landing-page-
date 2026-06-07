import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../src/server/firebaseAdmin'
import { sendTrackedEmail } from '../../src/server/adminEmail'
import { getSignupTemplate } from '../../src/server/adminData'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL
const emailServiceConfigured = Boolean(resendApiKey && senderEmail)
const duplicateSignupMessage = "You're already on the NovaBoard AI Alpha waitlist."

const defaultTextBody = `Hi {{name}},

Thank you for joining the NovaBoard AI Alpha Program.

NovaBoard AI is currently in active development, and we're working closely with a small group of early testers to shape the future of AI-powered hardware development.

Your application has been received successfully.

As we expand access, selected users will receive invitations to participate in the Alpha program and provide feedback on project generation, firmware creation, circuit design, and workflow experience.

What happens next?

• We review Alpha waitlist applications.
• Selected users receive Alpha invitations.
• Testers gain early access to upcoming features.
• Feedback directly influences AI-assisted hardware development.

We're excited to have you with us at this early stage.

— Team NovaBoard AI`

const defaultHtmlBody = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
  <p>Hi {{name}},</p>
  <p>Thank you for joining the NovaBoard AI Alpha Program.</p>
  <p>
    NovaBoard AI is currently in active development, and we're working closely with a small group of early testers to shape the future of AI-powered hardware development.
  </p>
  <p>Your application has been received successfully.</p>
  <p>
    As we expand access, selected users will receive invitations to participate in the Alpha program and provide feedback on project generation, firmware creation, circuit design, and workflow experience.
  </p>
  <p>What happens next?</p>
  <ul>
    <li>We review Alpha waitlist applications.</li>
    <li>Selected users receive Alpha invitations.</li>
    <li>Testers gain early access to upcoming features.</li>
    <li>Feedback directly influences AI-assisted hardware development.</li>
  </ul>
  <p>We're excited to have you with us at this early stage.</p>
  <p>— Team NovaBoard AI</p>
</div>`

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { fullName, name, email, student, identity, useCase } = req.body
    const finalName = fullName || name
    const normalizedEmail = normalizeEmail(email || '')

    if (!finalName || !student || !normalizedEmail || !useCase) {
      return res.status(400).json({ message: 'Please provide all required fields.' })
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    const db = getAdminDb()
    const users = db.collection('alpha_users')

    // Check duplicate
    const [existingDoc, existingQuery] = await Promise.all([
      users.doc(normalizedEmail).get(),
      users.where('email', '==', normalizedEmail).limit(1).get(),
    ])

    if (existingDoc.exists || !existingQuery.empty) {
      return res.status(409).json({
        message: duplicateSignupMessage,
        saved: true,
        duplicate: true,
      })
    }

    // Save
    await users.doc(normalizedEmail).set({
      email: normalizedEmail,
      fullName: finalName,
      student,
      identity: student === 'no' ? identity : 'Student',
      useCase,
      signupDate: FieldValue.serverTimestamp(),
      source: 'website',
      status: 'pending',
      phase: 'alpha',
    })

    let emailSent = false
    let emailError: string | null = null
    const firstName = finalName.split(/\s+/)[0] || 'there'

    if (emailServiceConfigured) {
      try {
        let subject = 'Welcome to NovaBoard AI Alpha'
        let textBody = defaultTextBody
        let htmlBody = defaultHtmlBody

        try {
          const savedTemplate = await getSignupTemplate()
          if (savedTemplate) {
            if (savedTemplate.subject?.trim()) subject = savedTemplate.subject.trim()
            if (savedTemplate.bodyText?.trim()) textBody = savedTemplate.bodyText.trim()
            if (savedTemplate.bodyHtml?.trim()) htmlBody = savedTemplate.bodyHtml.trim()
            console.log('[Signup] Using custom email template from admin panel. Subject:', subject)
          } else {
            console.log('[Signup] No custom template found in Firestore — using default template.')
          }
        } catch (dbErr) {
          // eslint-disable-next-line no-console
          console.warn('[Signup] Failed to load custom template, falling back to default:', dbErr)
        }

        // Compile placeholders
        textBody = textBody.replace(/{{name}}/g, firstName)
        htmlBody = htmlBody.replace(/{{name}}/g, firstName)

        await sendTrackedEmail({
          to: normalizedEmail,
          subject,
          content: textBody,
          html: htmlBody,
          campaignId: 'waitlist_signup',
        })

        emailSent = true
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to send confirmation email:', err)
        emailError = err instanceof Error ? err.message : 'Failed to send confirmation email.'
      }
    }

    return res.status(200).json({
      message: 'You are on the NovaBoard AI Alpha waitlist. We have received your application and will contact selected users with Alpha invitations soon.',
      saved: true,
      emailed: emailSent,
      emailError,
      duplicate: false,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Signup handler error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'We could not process your request.',
    })
  }
}
