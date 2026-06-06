import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../src/server/firebaseAdmin'
import { sendAdminEmail, sendTrackedEmail } from '../../src/server/adminEmail'
import { listAdminEmails } from '../../src/server/adminData'

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

const toDisplayBoolean = (value: boolean) => (value ? 'Yes' : 'No')

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
      projectMedia,
      applicationId,
      willingFeedback,
    } = req.body

    // Resolve media — prefer projectMedia (new), fall back to legacy projectImages flat array
    const resolvedMedia: Array<{ url: string; type: 'image' | 'video' }> = Array.isArray(projectMedia)
      ? projectMedia
      : Array.isArray(projectImages)
        ? projectImages.map((url: string) => ({ url, type: 'image' as const }))
        : []

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
      applicationId: applicationId ? String(applicationId) : `app_${Date.now()}`,
      email: normalizedEmail,
      fullName: fullName.trim(),
      student, // 'yes' | 'no'
      country: country.trim(),
      experienceLevel,
      projectsCompleted,
      bestProject: bestProject.trim(),
      useCase: useCase.trim(),
      projectLinks: projectLinks ? projectLinks.trim() : '',
      projectMedia: resolvedMedia,
      // Legacy field for backward compatibility
      projectImages: resolvedMedia.filter(m => m.type === 'image').map(m => m.url),
      willingFeedback: willingFeedback === 'yes' || willingFeedback === true,
      signupDate: FieldValue.serverTimestamp(),
      source: 'waitlist_apply',
      status: 'pending',
      phase: 'alpha',
    })

    let emailSent = false
    let adminNotificationsSent = 0
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

        await sendTrackedEmail({
          to: normalizedEmail,
          subject,
          content: textBody,
          html: htmlBody,
          campaignId: 'alpha_welcome',
        })

        emailSent = true
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to send alpha signup welcome email:', err)
      }
    }

    if (emailServiceConfigured) {
      try {
        const adminEntries = await listAdminEmails()
        const recipients = adminEntries
          .filter((entry) => entry.notificationsEnabled)
          .map((entry) => entry.email)

        if (recipients.length > 0) {
          const mediaSummary = resolvedMedia.length
            ? `${resolvedMedia.filter((item) => item.type === 'image').length} image(s), ${resolvedMedia.filter((item) => item.type === 'video').length} video(s)`
            : 'No media uploaded'

          const notificationBody = [
            'A new alpha application was submitted.',
            '',
            `Name: ${fullName.trim()}`,
            `Email: ${normalizedEmail}`,
            `Country: ${country.trim()}`,
            `Student: ${student}`,
            `Experience Level: ${experienceLevel}`,
            `Projects Completed: ${projectsCompleted}`,
            `Willing to provide feedback: ${toDisplayBoolean(willingFeedback === 'yes' || willingFeedback === true)}`,
            `Project Links: ${projectLinks ? projectLinks.trim() : 'None provided'}`,
            `Media: ${mediaSummary}`,
            '',
            'Best Project:',
            bestProject.trim(),
            '',
            'Planned Use Case:',
            useCase.trim(),
          ].join('\n')

          const results = await Promise.allSettled(
            recipients.map((recipient) =>
              sendTrackedEmail({
                to: recipient,
                subject: `New Alpha Applicant: ${fullName.trim()}`,
                previewText: `${fullName.trim()} just submitted an alpha application.`,
                content: notificationBody,
                campaignId: 'admin_notification',
              }),
            ),
          )

          adminNotificationsSent = results.filter((result) => result.status === 'fulfilled').length
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to send admin application notifications:', err)
      }
    }

    return res.status(200).json({
      message: 'Application Received',
      saved: true,
      emailed: emailSent,
      adminNotificationsSent,
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
