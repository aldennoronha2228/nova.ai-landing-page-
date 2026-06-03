import type { NextApiRequest, NextApiResponse } from 'next'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getApps as getClientApps, initializeApp as initializeClientApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, getFirestore as getClientFirestore, limit, query, runTransaction, serverTimestamp, where } from 'firebase/firestore'

const resendApiKey = process.env.RESEND_API_KEY
const senderEmail = process.env.RESEND_FROM_EMAIL
const duplicateSignupMessage = "You're already registered for Nova AI Alpha."

type ServiceAccount = {
  project_id?: string
  client_email?: string
  private_key?: string
}

type PublicFirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

type WritableDb =
  | { mode: 'admin'; db: ReturnType<typeof getFirestore> }
  | { mode: 'client'; db: ReturnType<typeof getClientFirestore> }

declare global {
  // eslint-disable-next-line no-var
  var novaSignupEmails: Set<string> | undefined
}

const normalizeEmail = (email: string): string => email.trim().toLowerCase()

const getSignupDocId = (email: string): string => normalizeEmail(email)

const getPublicFirebaseConfig = (): PublicFirebaseConfig | null => {
  const config: PublicFirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  }

  const hasRequiredConfig = [
    config.apiKey,
    config.authDomain,
    config.projectId,
    config.storageBucket,
    config.messagingSenderId,
    config.appId,
  ].every(Boolean)
  return hasRequiredConfig ? config : null
}

const getWritableDb = (): WritableDb | null => {
  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount) as ServiceAccount
      if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
        return null
      }

      const app =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
          }),
        })

      return { mode: 'admin', db: getFirestore(app) }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Firebase Admin is not configured correctly:', error)
    }
  }

  const publicConfig = getPublicFirebaseConfig()
  if (!publicConfig) return null

  try {
    const clientApp =
      getClientApps()[0] ??
      initializeClientApp({
        apiKey: publicConfig.apiKey,
        authDomain: publicConfig.authDomain,
        projectId: publicConfig.projectId,
        storageBucket: publicConfig.storageBucket,
        messagingSenderId: publicConfig.messagingSenderId,
        appId: publicConfig.appId,
        measurementId: publicConfig.measurementId,
      })

    return { mode: 'client', db: getClientFirestore(clientApp) }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Firebase client fallback is not configured correctly:', error)
    return null
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

const getBooleanField = (body: unknown, field: string): boolean => {
  if (!body) return false

  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>
      const value = parsed[field]
      return value === true || value === 'true'
    } catch {
      return false
    }
  }

  if (typeof body === 'object' && body !== null && field in body) {
    const value = (body as Record<string, unknown>)[field]
    return value === true || value === 'true'
  }

  return false
}

const rememberSignup = async ({
  fullName,
  email,
  student,
  identity,
}: {
  fullName: string
  email: string
  student: string
  identity: string
}): Promise<{ duplicate: boolean; saved: boolean; docId?: string }> => {
  const normalizedEmail = normalizeEmail(email)
  const writableDb = getWritableDb()

  if (!writableDb) {
    // Require admin credentials for production writes. Returning an explicit error
    // lets callers surface a clear message to the operator.
    throw new Error('Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT or the public Firebase env vars.')
  }

  const docId = getSignupDocId(normalizedEmail)

  if (writableDb.mode === 'admin') {
    const users = writableDb.db.collection('alpha_users')
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
      identity: student === 'no' ? identity : '',
      signupDate: FieldValue.serverTimestamp(),
      source: 'website',
      status: 'pending',
      phase: 'alpha',
    })

    return { duplicate: false, saved: true, docId }
  }

  const users = collection(writableDb.db, 'alpha_users')
  const userRef = doc(writableDb.db, 'alpha_users', docId)

  const [existingDoc, existingQuery] = await Promise.all([
    getDoc(userRef),
    getDocs(query(users, where('email', '==', normalizedEmail), limit(1))),
  ])

  if (existingDoc.exists() || !existingQuery.empty) {
    return { duplicate: true, saved: true, docId: existingDoc.exists() ? userRef.id : existingQuery.docs[0].id }
  }

  await runTransaction(writableDb.db, async (transaction) => {
    const snapshot = await transaction.get(userRef)
    if (snapshot.exists()) {
      throw new Error('duplicate-signup')
    }

    transaction.set(userRef, {
      email: normalizedEmail,
      fullName,
      student,
      identity: student === 'no' ? identity : '',
      signupDate: serverTimestamp(),
      source: 'website',
      status: 'pending',
      phase: 'alpha',
    })
  })

  return { duplicate: false, saved: true, docId }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const fullName = getStringField(req.body, 'fullName') || getStringField(req.body, 'name')
  const email = getEmailFromBody(req.body)
  const student = getStringField(req.body, 'student')
  const identity = getStringField(req.body, 'identity')
  const clientStored = getBooleanField(req.body, 'clientStored')

  if (!fullName || !student || !email || (student === 'no' && !identity)) {
    return res.status(400).json({ message: 'Please provide your full name, student status, and a valid email address.' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address.' })
  }

  const emailConfigured = Boolean(resendApiKey && senderEmail)
  let emailSent = false
  const firstName = fullName.split(/\s+/)[0] || 'there'

  try {
    const signup = clientStored
      ? { duplicate: false, saved: true, docId: normalizeEmail(email) }
      : await rememberSignup({ fullName, email, student, identity })

    if (!clientStored && signup.duplicate) {
      return res.status(409).json({
        message: duplicateSignupMessage,
        saved: signup.saved,
        duplicate: true,
        docId: signup.docId,
      })
    }

    if (resendApiKey && senderEmail) {
      try {
        const textBody = `Hi ${firstName},

Thank you for joining the Nova AI Alpha.

We're building Nova AI to make hardware development dramatically faster — from circuit design and component selection to embedded software generation and simulation, all powered by AI.

As one of our early alpha users, you'll get:

- Early access to upcoming features
- Priority invitations to private alpha testing
- Direct influence on our product roadmap
- Exclusive updates from the Nova AI team

We're still in the early stages, and your feedback will help shape the future of the platform.

We'll be in touch soon with updates, sneak peeks, and your alpha access details.

Thank you for being part of this journey.

Best regards,

Team Nova AI

Design. Simulate. Build.
The AI Workspace for Hardware Engineers.`
        const htmlBody = `
            <div style="font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.6;color:#111827">
              <p>Hi ${firstName},</p>
              <p>Thank you for joining the Nova AI Alpha.</p>
              <p>
                We're building Nova AI to make hardware development dramatically faster - from circuit design and component selection to embedded software generation and simulation, all powered by AI.
              </p>
              <p>As one of our early alpha users, you'll get:</p>
              <ul>
                <li>Early access to upcoming features</li>
                <li>Priority invitations to private alpha testing</li>
                <li>Direct influence on our product roadmap</li>
                <li>Exclusive updates from the Nova AI team</li>
              </ul>
              <p>
                We're still in the early stages, and your feedback will help shape the future of the platform.
              </p>
              <p>
                We'll be in touch soon with updates, sneak peeks, and your alpha access details.
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
            subject: `Welcome to Nova AI Alpha, ${firstName}`,
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

    const message = 'Welcome to Nova AI Alpha. Your request has been received and added to the Alpha waitlist.'

    // eslint-disable-next-line no-console
    console.log('Alpha signup stored successfully', {
      docId: signup.docId,
      email: normalizeEmail(email),
      collection: 'alpha_users',
    })

    return res.status(200).json({
      message,
      fullName,
      email,
      student,
      identity: student === 'no' ? identity : '',
      saved: signup.saved,
      emailed: emailSent,
      duplicate: false,
      docId: signup.docId,
    })
  } catch (error) {
    // Provide a concise, user-facing message but log details server-side.
    const errMsg = error instanceof Error ? error.message : 'We could not process your request.'
    // eslint-disable-next-line no-console
    console.error('Signup handler error:', error)
    return res.status(500).json({ message: "We couldn't process your request. Please try again." })
  }
}
