import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../src/server/firebaseAdmin'

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

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const {
      fullName,
      email,
      country,
      student,
      experienceLevel,
      projectsCompleted,
      bestProject,
      useCase,
      projectLinks,
      projectImages,
      willingFeedback,
    } = req.body

    // Basic required validation
    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !country?.trim() ||
      !student ||
      !experienceLevel ||
      !projectsCompleted ||
      !bestProject?.trim() ||
      !useCase?.trim() ||
      willingFeedback === undefined
    ) {
      return res.status(400).json({ message: 'Please provide all required fields.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' })
    }

    const db = getAdminDb()
    const usersCollection = db.collection('alpha_users')

    // Check duplicate
    const [existingDoc, existingQuery] = await Promise.all([
      usersCollection.doc(normalizedEmail).get(),
      usersCollection.where('email', '==', normalizedEmail).limit(1).get(),
    ])

    if (existingDoc.exists || !existingQuery.empty) {
      return res.status(409).json({
        message: duplicateSignupMessage,
        saved: true,
        duplicate: true,
      })
    }

    // Save applicant details
    await usersCollection.doc(normalizedEmail).set({
      email: normalizedEmail,
      fullName: fullName.trim(),
      student, // 'yes' | 'no'
      country: country.trim(),
      experienceLevel,
      projectsCompleted,
      bestProject: bestProject.trim(),
      useCase: useCase.trim(),
      projectLinks: projectLinks ? projectLinks.trim() : '',
      projectImages: Array.isArray(projectImages) ? projectImages : [],
      willingFeedback: willingFeedback === 'yes' || willingFeedback === true,
      signupDate: FieldValue.serverTimestamp(),
      source: 'waitlist_apply',
      status: 'pending',
      phase: 'alpha',
    })

    let emailSent = false
    const firstName = fullName.trim().split(/\s+/)[0] || 'there'

    if (emailServiceConfigured) {
      try {
        let subject = 'Welcome to NovaBoard AI Alpha'
        let textBody = defaultTextBody
        let htmlBody = defaultHtmlBody

        // Load custom settings
        try {
          const doc = await db.collection('settings').doc('signup_email').get()
          if (doc.exists) {
            const data = doc.data()
            if (data?.subject) subject = String(data.subject)
            if (data?.bodyText) textBody = String(data.bodyText)
            if (data?.bodyHtml) htmlBody = String(data.bodyHtml)
          }
        } catch (dbErr) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load dynamic template for detailed alpha apply:', dbErr)
        }

        // Compile placeholders
        textBody = textBody.replace(/{{name}}/g, firstName)
        htmlBody = htmlBody.replace(/{{name}}/g, firstName)

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [normalizedEmail],
            subject: subject,
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
        // eslint-disable-next-line no-console
        console.warn('Failed to send alpha signup welcome email:', err)
      }
    }

    return res.status(200).json({
      message: 'Application Received',
      saved: true,
      emailed: emailSent,
      duplicate: false,
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Alpha application endpoint error:', error)
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'We could not process your request. Please try again.',
    })
  }
}
