import type { NextApiRequest, NextApiResponse } from 'next'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL
const emailServiceConfigured = Boolean(resendApiKey && senderEmail)
const duplicateSignupMessage = "You're already on the NovaBoard AI Alpha waitlist."
const storageDisabledMessage =
  'NovaBoard AI signup storage is not enabled yet. Please enable Cloud Firestore for this Firebase project, then try again.'
const serviceAccountParseMessage =
  'Server configuration error: FIREBASE_SERVICE_ACCOUNT could not be parsed. Paste the full Firebase service account JSON into Vercel, then redeploy.'
const serviceAccountMissingFieldsMessage =
  'Server configuration error: FIREBASE_SERVICE_ACCOUNT is missing project_id, client_email, or private_key.'
const serviceAccountPrivateKeyMessage =
  'Server configuration error: FIREBASE_SERVICE_ACCOUNT private_key is invalid. Generate a new Firebase Admin SDK private key, paste the full JSON into Vercel, then redeploy.'
const serviceAccountPermissionMessage =
  'Server configuration error: Firebase Admin credentials do not have permission to write to Firestore.'
const isDev = process.env.NODE_ENV !== 'production'

const logDebug = (...args: unknown[]) => {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[signup debug]', ...args)
  }
}

type ServiceAccount = {
  project_id?: string
  client_email?: string
  private_key?: string
}

type PublicFirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

declare global {
  // eslint-disable-next-line no-var
  var novaboardSignupEmails: Set<string> | undefined
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const getSignupDocId = (email: string): string => normalizeEmail(email)

const resolveServiceAccount = (rawServiceAccount: string): ServiceAccount | null => {
  const trimmed = rawServiceAccount.trim()
  if (!trimmed) return null

  try {
    return JSON.parse(trimmed) as ServiceAccount
  } catch {
    try {
      const filePath = resolve(process.cwd(), trimmed)
      if (!existsSync(filePath)) return null
      const fileContents = readFileSync(filePath, 'utf8').trim()
      return JSON.parse(fileContents) as ServiceAccount
    } catch {
      return null
    }
  }
}

const getWritableDb = () => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  logDebug('NODE_ENV:', process.env.NODE_ENV)
  logDebug('FIREBASE_SERVICE_ACCOUNT set:', Boolean(rawServiceAccount))
  logDebug('Public Firebase client config:', {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    apiKeySet: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  })

  if (!rawServiceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in environment. Admin Firestore cannot initialize.')
  }

  const serviceAccount = resolveServiceAccount(rawServiceAccount)
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT value could not be parsed. It must be JSON or a valid path to a JSON file.')
  }

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is missing required fields: project_id, client_email, or private_key.')
  }

  logDebug('Resolved Firebase service account:', {
    projectId: serviceAccount.project_id,
    clientEmail: Boolean(serviceAccount.client_email),
    hasPrivateKey: Boolean(serviceAccount.private_key),
  })

  try {
    const existingApp = getApps()[0]
    if (existingApp) {
      logDebug('Reusing existing firebase-admin app', existingApp.name)
    }

    const app =
      existingApp ??
      initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
        }),
      })

    const db = getFirestore(app)
    logDebug('Firestore initialized successfully for project:', serviceAccount.project_id)
    return db
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Firestore initialization error.'
    logDebug('Firestore initialization failed:', message)
    throw error
  }
}

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

const rememberSignup = async ({
  fullName,
  email,
  student,
  identity,
  useCase,
}: {
  fullName: string
  email: string
  student: string
  identity: string
  useCase: string
}): Promise<{ duplicate: boolean; saved: boolean; docId?: string }> => {
  const normalizedEmail = normalizeEmail(email)
  const writableDb = getWritableDb()

  const docId = getSignupDocId(normalizedEmail)

  const users = writableDb.collection('alpha_users')
  const userRef = users.doc(docId)

  const [existingDoc, existingQuery] = await Promise.all([
    userRef.get(),
    users.where('email', '==', normalizedEmail).limit(1).get(),
  ])

  if (existingDoc.exists || !existingQuery.empty) {
    return { duplicate: true, saved: true, docId: existingDoc.exists ? userRef.id : existingQuery.docs[0].id }
  }

  await userRef.create({
    email: normalizedEmail,
    fullName,
    student,
    identity,
    useCase,
    signupDate: FieldValue.serverTimestamp(),
    source: 'website',
    status: 'pending',
    phase: 'alpha',
  })

  return { duplicate: false, saved: true, docId }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  logDebug('Incoming signup request', { method: req.method, url: req.url })

  const fullName = getStringField(req.body, 'fullName') || getStringField(req.body, 'name')
  const email = getEmailFromBody(req.body)
  const student = getStringField(req.body, 'student')
  const identity = getStringField(req.body, 'identity')
  const useCase = getStringField(req.body, 'useCase')

  const writableDb = getWritableDb()

  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return res.status(503).json({
      message:
        'Server configuration error: FIREBASE_SERVICE_ACCOUNT is not configured. Please add the service account JSON to your deployment environment.',
    })
  }

  if (!fullName || !student || !email || !useCase || (student === 'no' && !identity)) {
    return res.status(400).json({ message: 'Please provide your full name, student status, identity, and intended use case.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' })
  }

  let emailError = ''
  let emailSent = false
  const firstName = fullName.split(/\s+/)[0] || 'there'

  try {
    const signup = await rememberSignup({
      fullName,
      email,
      student,
      identity: student === 'no' ? identity : 'Student',
      useCase,
    })

    if (signup.duplicate) {
      return res.status(409).json({
        message: duplicateSignupMessage,
        saved: signup.saved,
        duplicate: true,
        docId: signup.docId,
      })
    }

    if (emailServiceConfigured) {
      try {
        let subject = 'Welcome to NovaBoard AI Alpha'
        let textBody = `Hi ${firstName},

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
        let htmlBody = `
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
              <p>Hi ${firstName},</p>
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
            </div>
          `

        try {
          const doc = await writableDb.collection('settings').doc('signup_email').get()
          if (doc.exists) {
            const data = doc.data()
            if (data?.subject) subject = String(data.subject)
            if (data?.bodyText) textBody = String(data.bodyText).replace(/{{name}}/g, firstName)
            if (data?.bodyHtml) htmlBody = String(data.bodyHtml).replace(/{{name}}/g, firstName)
          }
        } catch (dbErr) {
          // eslint-disable-next-line no-console
          console.warn('Failed to load dynamic email template settings:', dbErr)
        }

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [email],
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
        // non-fatal: log server-side and continue
        // eslint-disable-next-line no-console
        console.warn('Failed to send confirmation email:', err)
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('Email service is not configured. Skipping confirmation email.')
    }

    const message = 'You are on the NovaBoard AI Alpha waitlist. We have received your application and will contact selected users with Alpha invitations soon.'

    // eslint-disable-next-line no-console
    console.log('Alpha signup stored successfully', {
      docId: signup.docId,
      email: normalizeEmail(email),
      collection: 'alpha_users',
      emailed: emailSent,
    })

    return res.status(200).json({
      message,
      fullName,
      email,
      student,
      identity: student === 'no' ? identity : '',
      saved: signup.saved,
      emailed: emailSent,
      emailError: emailError || (!emailServiceConfigured ? 'Email service is not configured.' : undefined),
      duplicate: false,
      docId: signup.docId,
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'We could not process your request.'
    const errStack = error instanceof Error ? error.stack : undefined
    const errCode = (error as any)?.code ?? ''
    const errDetails = (error as any)?.details ?? ''
    const failingLine = errStack?.split('\n')[1]?.trim()

    // eslint-disable-next-line no-console
    console.error('Signup handler error:', errMsg)
    // eslint-disable-next-line no-console
    console.error('Error code:', errCode)
    if (errDetails) {
      // eslint-disable-next-line no-console
      console.error('Error details:', errDetails)
    }
    if (errStack) {
      // eslint-disable-next-line no-console
      console.error(errStack)
    }
    if (failingLine) {
      // eslint-disable-next-line no-console
      console.error('Failure line:', failingLine)
    }

    const combinedErrorText = `${errMsg} ${errCode} ${errDetails}`
    const publicMessage = (() => {
      if (/FIREBASE_SERVICE_ACCOUNT value could not be parsed/i.test(combinedErrorText)) {
        return serviceAccountParseMessage
      }

      if (/FIREBASE_SERVICE_ACCOUNT is missing required fields/i.test(combinedErrorText)) {
        return serviceAccountMissingFieldsMessage
      }

      if (/private key|PEM|DECODER routines|invalid_grant/i.test(combinedErrorText)) {
        return serviceAccountPrivateKeyMessage
      }

      if (/permission|PERMISSION_DENIED|insufficient/i.test(combinedErrorText)) {
        return serviceAccountPermissionMessage
      }

      if (/Firestore|database \(default\) does not exist|storage is not enabled|NOT_FOUND/i.test(combinedErrorText)) {
        return storageDisabledMessage
      }

      return isDev ? errMsg : 'We could not process your request. Please try again.'
    })()

    const responsePayload: Record<string, unknown> = {
      message: publicMessage,
    }

    if (isDev) {
      responsePayload.error = errMsg
      responsePayload.code = errCode
      responsePayload.details = errDetails
      responsePayload.stack = errStack
      responsePayload.line = failingLine
    }

    const statusCode = /Firestore|database \(default\) does not exist|storage is not enabled|NOT_FOUND|FIREBASE_SERVICE_ACCOUNT|private key|PEM|DECODER routines|invalid_grant|permission|PERMISSION_DENIED|insufficient/i.test(combinedErrorText)
      ? 503
      : 500

    return res.status(statusCode).json(responsePayload)
  }
}
