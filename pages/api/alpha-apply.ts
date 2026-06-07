import type { NextApiRequest, NextApiResponse } from 'next'
import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '../../src/server/firebaseAdmin'
import { sendTrackedEmail } from '../../src/server/adminEmail'
import { listAdminEmails } from '../../src/server/adminData'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL
const emailServiceConfigured = Boolean(resendApiKey && senderEmail)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

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
    let emailError: string | null = null
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
        emailError = err instanceof Error ? err.message : 'Failed to send alpha signup welcome email.'
      }
    }

    if (emailServiceConfigured) {
      try {
        const adminEntries = await listAdminEmails()
        const firestoreRecipients = adminEntries
          .filter((entry) => entry.notificationsEnabled)
          .map((entry) => entry.email)

        // Always include the hardcoded admin email as a fallback
        const hardcodedAdmin = process.env.ADMIN_NOTIFICATION_EMAIL || 'novaboardai@gmail.com'
        const allRecipients = Array.from(new Set([hardcodedAdmin, ...firestoreRecipients]))

        if (allRecipients.length > 0) {
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

          const notificationHtml = `
<div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827;max-width:600px">
  <div style="background:#0f0f14;padding:24px 28px;border-radius:10px 10px 0 0">
    <h2 style="margin:0;color:#ffffff;font-size:1.2rem;font-weight:700">🚀 New Alpha Application</h2>
    <p style="margin:6px 0 0;color:rgba(255,255,255,0.5);font-size:0.85rem">NovaBoard AI / WireUp</p>
  </div>
  <div style="background:#ffffff;padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px">
    <table style="width:100%;border-collapse:collapse;font-size:0.9rem">
      <tr><td style="padding:8px 0;color:#6b7280;width:40%">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(fullName.trim())}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 6px;color:#6b7280">Email</td><td style="padding:8px 6px"><a href="mailto:${escapeHtml(normalizedEmail)}" style="color:#6366f1">${escapeHtml(normalizedEmail)}</a></td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Country</td><td style="padding:8px 0">${escapeHtml(country.trim())}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 6px;color:#6b7280">Student</td><td style="padding:8px 6px">${escapeHtml(student)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Experience</td><td style="padding:8px 0">${escapeHtml(experienceLevel)}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 6px;color:#6b7280">Projects Done</td><td style="padding:8px 6px">${escapeHtml(projectsCompleted)}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280">Feedback</td><td style="padding:8px 0">${toDisplayBoolean(willingFeedback === 'yes' || willingFeedback === true)}</td></tr>
      <tr style="background:#f9fafb"><td style="padding:8px 6px;color:#6b7280">Media</td><td style="padding:8px 6px">${escapeHtml(mediaSummary)}</td></tr>
      ${projectLinks ? `<tr><td style="padding:8px 0;color:#6b7280">Links</td><td style="padding:8px 0"><a href="${escapeHtml(projectLinks.trim())}" style="color:#6366f1">${escapeHtml(projectLinks.trim())}</a></td></tr>` : ''}
    </table>
    <div style="margin-top:20px">
      <p style="font-size:0.8rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Best Project</p>
      <p style="background:#f9fafb;padding:12px;border-radius:6px;font-size:0.9rem;margin:4px 0 0">${escapeHtml(bestProject.trim())}</p>
    </div>
    <div style="margin-top:16px">
      <p style="font-size:0.8rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Planned Use Case</p>
      <p style="background:#f9fafb;padding:12px;border-radius:6px;font-size:0.9rem;margin:4px 0 0">${escapeHtml(useCase.trim())}</p>
    </div>
  </div>
</div>`

          const results = await Promise.allSettled(
            allRecipients.map((recipient) =>
              sendTrackedEmail({
                to: recipient,
                subject: `New Alpha Applicant: ${fullName.trim()}`,
                previewText: `${fullName.trim()} just submitted an alpha application.`,
                content: notificationBody,
                html: notificationHtml,
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
      emailError,
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
