import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from 'next'
import { createHmac, timingSafeEqual } from 'crypto'
import { listAdminEmails } from './adminData'

export type AdminSession = {
  email: string
  issuedAt: number
}

const cookieName = 'novaboard_admin_session'
const maxAgeSeconds = 60 * 60 * 12

const normalizeEmail = (email: string) => email.trim().toLowerCase()

const getEnvAdminEmails = () =>
  new Set(
    (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map(normalizeEmail)
      .filter(Boolean),
  )

const getApprovedAdminEmails = async () => {
  const emailSet = getEnvAdminEmails()
  try {
    const dbEmails = await listAdminEmails()
    dbEmails.forEach((entry) => emailSet.add(entry.email))
  } catch {
    // Firestore may be temporarily unavailable; fall back to env list only.
  }
  return Array.from(emailSet)
}

const getSessionSecret = () =>
  process.env.ADMIN_SESSION_SECRET || process.env.FIREBASE_SERVICE_ACCOUNT || 'novaboard-local-admin-session'

const sign = (payload: string) =>
  createHmac('sha256', getSessionSecret()).update(payload).digest('base64url')

const parseCookies = (cookieHeader?: string) =>
  Object.fromEntries(
    (cookieHeader ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=')
        if (separator === -1) return [part, '']
        return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))]
      }),
  )

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const isApprovedAdminEmail = async (email: string) => {
  const approved = await getApprovedAdminEmails()
  return approved.includes(normalizeEmail(email))
}

export const verifyAdminPassword = (password: string) => {
  const configured = process.env.ADMIN_PASSWORD
  return Boolean(configured && password && safeEqual(password, configured))
}

export const createAdminSessionCookie = (email: string) => {
  const session: AdminSession = { email: normalizeEmail(email), issuedAt: Date.now() }
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  const signature = sign(payload)
  return `${cookieName}=${encodeURIComponent(`${payload}.${signature}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
}

export const clearAdminSessionCookie = () =>
  `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`

export const readAdminSessionFromCookie = async (cookieHeader?: string): Promise<AdminSession | null> => {
  const token = parseCookies(cookieHeader)[cookieName]
  if (!token) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature || !safeEqual(sign(payload), signature)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession
    if (!session.email || !session.issuedAt) return null
    if (Date.now() - session.issuedAt > maxAgeSeconds * 1000) return null
    if (!(await isApprovedAdminEmail(session.email))) return null
    return session
  } catch {
    return null
  }
}

export const requireAdminApi = async (req: NextApiRequest, res: NextApiResponse): Promise<AdminSession | null> => {
  const session = await readAdminSessionFromCookie(req.headers.cookie)
  if (!session) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  return session
}

export const requireAdminPage = async (context: GetServerSidePropsContext) => {
  const session = await readAdminSessionFromCookie(context.req.headers.cookie)
  if (!session) {
    return {
      redirect: {
        destination: `/admin/login?next=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    }
  }

  return { props: { adminEmail: session.email } }
}
