import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from './firebaseAdmin'

export type ApplicantStatus = 'pending' | 'approved' | 'rejected' | 'active'

export type AdminApplicant = {
  id: string
  name: string
  email: string
  dateApplied: string
  status: ApplicantStatus
  source: string
  notes: string
  useCase: string
  country?: string
  student?: string
  experienceLevel?: string
  projectsCompleted?: string
  bestProject?: string
  projectLinks?: string
  projectImages?: string[]
  projectMedia?: Array<{ url: string; type: 'image' | 'video' }>
  willingFeedback?: string
}

export type AdminEmailLog = {
  id: string
  campaignId: string
  email: string
  status: string
  opened: boolean
  clicked: boolean
  sentAt: string
}

const toIsoDate = (value: unknown) => {
  try {
    if (value instanceof Timestamp) return value.toDate().toISOString()
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'string') {
      const d = new Date(value)
      return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
    }
  } catch {
    // Fallback
  }
  return new Date().toISOString()
}

const normalizeStatus = (value: unknown): ApplicantStatus => {
  if (value === 'approved' || value === 'rejected' || value === 'active') return value
  return 'pending'
}

export const listApplicants = async (): Promise<AdminApplicant[]> => {
  const snapshot = await getAdminDb().collection('alpha_users').orderBy('signupDate', 'desc').limit(1000).get()

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: String(data.fullName || data.name || 'Unnamed applicant'),
      email: String(data.email || doc.id),
      dateApplied: toIsoDate(data.signupDate || data.created_at || data.createdAt),
      status: normalizeStatus(data.status),
      source: String(data.source || 'website'),
      notes: String(data.notes || ''),
      useCase: String(data.useCase || data.identity || ''),
      country: data.country ? String(data.country) : undefined,
      student: data.student ? String(data.student) : undefined,
      experienceLevel: data.experienceLevel ? String(data.experienceLevel) : undefined,
      projectsCompleted: data.projectsCompleted ? String(data.projectsCompleted) : undefined,
      bestProject: data.bestProject ? String(data.bestProject) : undefined,
      projectLinks: data.projectLinks ? String(data.projectLinks) : undefined,
      projectImages: Array.isArray(data.projectImages) ? data.projectImages.map(String) : undefined,
      projectMedia: Array.isArray(data.projectMedia)
        ? data.projectMedia.filter((m: unknown) => m && typeof (m as Record<string,unknown>).url === 'string').map((m: Record<string,unknown>) => ({
            url: String(m.url),
            type: m.type === 'video' ? 'video' as const : 'image' as const,
          }))
        : undefined,
      willingFeedback: data.willingFeedback !== undefined ? String(data.willingFeedback) : undefined,
    }
  })
}

export const updateApplicant = async ({
  id,
  status,
  notes,
}: {
  id: string
  status?: ApplicantStatus
  notes?: string
}) => {
  const payload: Record<string, unknown> = { updated_at: FieldValue.serverTimestamp() }
  if (status) payload.status = status
  if (typeof notes === 'string') payload.notes = notes
  await getAdminDb().collection('alpha_users').doc(id).set(payload, { merge: true })
}

export const deleteApplicant = async (id: string) => {
  await getAdminDb().collection('alpha_users').doc(id).delete()
}

export const createActivity = async (message: string, type: string, actor: string) => {
  await getAdminDb().collection('admin_activity').add({
    message,
    type,
    actor,
    created_at: FieldValue.serverTimestamp(),
  })
}

export const listActivity = async () => {
  const snapshot = await getAdminDb().collection('admin_activity').orderBy('created_at', 'desc').limit(20).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      message: String(data.message || 'Admin activity'),
      type: String(data.type || 'activity'),
      actor: String(data.actor || 'admin'),
      createdAt: toIsoDate(data.created_at),
    }
  })
}

export const listCampaigns = async () => {
  const snapshot = await getAdminDb().collection('email_campaigns').orderBy('created_at', 'desc').limit(200).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      name: String(data.name || 'Untitled campaign'),
      subject: String(data.subject || ''),
      previewText: String(data.previewText || ''),
      content: String(data.content || ''),
      type: String(data.type || 'Custom Campaign'),
      status: String(data.status || 'draft'),
      createdAt: toIsoDate(data.created_at),
    }
  })
}

export const listEmailLogs = async (): Promise<AdminEmailLog[]> => {
  const snapshot = await getAdminDb().collection('email_logs').orderBy('sent_at', 'desc').limit(2000).get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      campaignId: String(data.campaign_id || ''),
      email: String(data.email || ''),
      status: String(data.status || ''),
      opened: Boolean(data.opened),
      clicked: Boolean(data.clicked),
      sentAt: toIsoDate(data.sent_at || data.created_at),
    }
  })
}

export type AdminEmailEntry = {
  id: string
  email: string
  createdAt: string
  notificationsEnabled: boolean
}

const normalizeAdminEmail = (value: unknown) =>
  String(value ?? '').trim().toLowerCase()

export const listAdminEmails = async (): Promise<AdminEmailEntry[]> => {
  const snapshot = await getAdminDb().collection('admin_emails').orderBy('created_at', 'desc').get()
  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      email: normalizeAdminEmail(data.email),
      createdAt: toIsoDate(data.created_at),
      notificationsEnabled: data.notificationsEnabled !== false,
    }
  })
}

export const addAdminEmail = async (email: string) => {
  const normalized = normalizeAdminEmail(email)
  if (!normalized) throw new Error('Admin email is required.')
  await getAdminDb().collection('admin_emails').doc(normalized).set({
    email: normalized,
    notificationsEnabled: true,
    created_at: FieldValue.serverTimestamp(),
  })
}

export const setAdminEmailNotifications = async (email: string, enabled: boolean) => {
  const normalized = normalizeAdminEmail(email)
  if (!normalized) throw new Error('Admin email is required.')
  await getAdminDb().collection('admin_emails').doc(normalized).set({
    email: normalized,
    notificationsEnabled: enabled,
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export const removeAdminEmail = async (email: string) => {
  const normalized = normalizeAdminEmail(email)
  if (!normalized) throw new Error('Admin email is required.')
  await getAdminDb().collection('admin_emails').doc(normalized).delete()
}

export type EmailTemplate = {
  subject: string
  bodyText: string
  bodyHtml: string
}

export const getSignupTemplate = async (): Promise<EmailTemplate | null> => {
  const doc = await getAdminDb().collection('settings').doc('signup_email').get()
  if (!doc.exists) return null
  const data = doc.data()
  return {
    subject: String(data?.subject || ''),
    bodyText: String(data?.bodyText || ''),
    bodyHtml: String(data?.bodyHtml || ''),
  }
}

export const saveSignupTemplate = async (template: EmailTemplate) => {
  await getAdminDb().collection('settings').doc('signup_email').set({
    subject: template.subject,
    bodyText: template.bodyText,
    bodyHtml: template.bodyHtml,
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true })
}

export type ApplicationWindow = {
  isOpen: boolean
  deadline: string | null   // ISO date string or null
  closedMessage: string
}

export const getApplicationWindow = async (): Promise<ApplicationWindow> => {
  const doc = await getAdminDb().collection('settings').doc('application_window').get()
  if (!doc.exists) {
    // Default: open with no deadline
    return { isOpen: true, deadline: null, closedMessage: '' }
  }
  const data = doc.data()!
  return {
    isOpen: data.isOpen !== false,
    deadline: data.deadline ? String(data.deadline) : null,
    closedMessage: data.closedMessage ? String(data.closedMessage) : '',
  }
}

export const saveApplicationWindow = async (window: ApplicationWindow) => {
  await getAdminDb().collection('settings').doc('application_window').set({
    isOpen: window.isOpen,
    deadline: window.deadline ?? null,
    closedMessage: window.closedMessage ?? '',
    updated_at: FieldValue.serverTimestamp(),
  }, { merge: true })
}
