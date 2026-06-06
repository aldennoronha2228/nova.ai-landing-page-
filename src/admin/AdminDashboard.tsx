import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'

export type AdminPageKey = 'dashboard' | 'applicants' | 'campaigns' | 'emails' | 'analytics' | 'settings'

type ApplicantStatus = 'pending' | 'approved' | 'rejected' | 'active'

type Applicant = {
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
  applicationId?: string
  willingFeedback?: string
}

type Campaign = {
  id: string
  name: string
  subject: string
  previewText: string
  content: string
  type: string
  status: string
  createdAt: string
}

type Activity = {
  id: string
  message: string
  type: string
  actor: string
  createdAt: string
}

type Overview = {
  kpis: {
    total: number
    pending: number
    approved: number
    rejected: number
    emailsSent: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
  trends: {
    total: number
    pending: number
    approved: number
    rejected: number
    emailsSent: number
    openRate: number
  }
  series: {
    applicants: Array<{ date: string; value: number }>
    pending: Array<{ date: string; value: number }>
    approved: Array<{ date: string; value: number }>
  }
  campaignStats: Array<{
    campaignId: string
    recipients: number
    opens: number
    clicks: number
    openRate: number
    clickRate: number
  }>
  applicants: Applicant[]
  campaigns: Campaign[]
  activity: Activity[]
}

const navItems: Array<{ key: AdminPageKey; label: string; href: string; icon: IconName }> = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: 'home' },
  { key: 'applicants', label: 'Applicants', href: '/admin/applicants', icon: 'users' },
  { key: 'campaigns', label: 'Email Campaigns', href: '/admin/campaigns', icon: 'mail' },
  { key: 'analytics', label: 'Analytics', href: '/admin/analytics', icon: 'chart' },
  { key: 'settings', label: 'Settings', href: '/admin/settings', icon: 'settings' },
]

const statusLabels: Record<ApplicantStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
}

const emptyOverview: Overview = {
  kpis: { total: 0, pending: 0, approved: 0, rejected: 0, emailsSent: 0, openRate: 0, clickRate: 0, bounceRate: 0 },
  trends: { total: 0, pending: 0, approved: 0, rejected: 0, emailsSent: 0, openRate: 0 },
  series: { applicants: [], pending: [], approved: [] },
  campaignStats: [],
  applicants: [],
  campaigns: [],
  activity: [],
}

let overviewCache: Overview | null = null

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const text = await response.text()
  const data = text ? JSON.parse(text) : {}
  if (!response.ok) throw new Error(data.message || 'Request failed')
  return data as T
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value))

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value)

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'NA'

const getRelativeTime = (value: string) => {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} day ago`
}

type IconName = 'home' | 'users' | 'mail' | 'chart' | 'settings' | 'clock' | 'check' | 'x' | 'send' | 'calendar' | 'download' | 'menu' | 'video'

function AdminIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V21h13V9.5" /><path d="M9.5 21v-6h5v6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    chart: <><path d="M4 19V5" /><path d="M4 19h17" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-7" /><path d="M20 16v-3" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.82V22a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1.82-.33H2a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1.82V2a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.13.7.34 1 .6.49.4 1.14.5 1.73.27H22a2 2 0 0 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    x: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6" /><path d="m15 9-6 6" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    calendar: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4" /><path d="M16 2v4" /><path d="M3 10h18" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
    video: <><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" ry="2" /></>,
  }

  return (
    <svg
      className="admin-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

const getDailyBuckets = (applicants: Applicant[]) => {
  const buckets = new Map<string, number>()
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date()
    date.setDate(date.getDate() - index)
    buckets.set(date.toISOString().slice(0, 10), 0)
  }
  applicants.forEach((applicant) => {
    const key = applicant.dateApplied.slice(0, 10)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })
  return [...buckets.entries()].map(([label, value]) => ({ label: label.slice(5), value }))
}

function StatCard({
  label,
  value,
  trend,
  icon,
  tone = 'purple',
  data = [],
}: {
  label: string
  value: string | number
  trend: string
  icon: IconName
  tone?: 'purple' | 'orange' | 'green' | 'red' | 'blue'
  data?: number[]
}) {
  const max = Math.max(1, ...data)
  const points = data.map((item, index) => `${index * (72 / Math.max(1, data.length - 1))},${24 - (item / max) * 20 + 2}`).join(' ')
  return (
    <article className={`admin-stat-card ${tone}`}>
      <div className="admin-stat-top">
        <div className="admin-stat-icon"><AdminIcon name={icon} /></div>
        <span>{label}</span>
      </div>
      <strong>{typeof value === 'number' ? formatNumber(value) : value}</strong>
      <div className="admin-stat-bottom">
        <small>{trend}</small>
        <svg className="admin-sparkline" viewBox="0 0 72 28" aria-hidden="true">
          <polyline points={points || '0,22 72,18'} />
        </svg>
      </div>
    </article>
  )
}

function ChartLine({ data }: { data: Array<{ label: string; value: number }> }) {
  const values = data.map((item) => item.value)
  const maxVal = Math.max(1, ...values)
  
  // Calculate sensible integer ticks
  const tickCount = maxVal < 5 ? maxVal + 1 : 5
  const ticks = []
  for (let i = 0; i < tickCount; i++) {
    ticks.push(Math.round((maxVal / (tickCount - 1)) * i))
  }
  const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b)

  const chartWidth = 760
  const chartHeight = 220
  const left = 44
  const top = 10
  const plotWidth = chartWidth - left - 20
  const plotHeight = chartHeight - top - 34
  
  const points = data.map((item, index) => {
    const x = left + index * (plotWidth / Math.max(1, data.length - 1))
    const y = top + plotHeight - (item.value / maxVal) * plotHeight
    return { x, y, ...item }
  })
  
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
  const area = `${path} L ${points.at(-1)?.x ?? left} ${top + plotHeight} L ${left} ${top + plotHeight} Z`

  return (
    <div className="admin-line-chart">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Applications over time">
        {uniqueTicks.map((tickValue) => {
          const y = top + plotHeight - (tickValue / maxVal) * plotHeight
          return (
            <g key={tickValue}>
              <line x1={left} x2={chartWidth - 12} y1={y} y2={y} />
              <text x="0" y={y + 4}>{tickValue}</text>
            </g>
          )
        })}
        <path className="admin-line-area" d={area} />
        <path className="admin-line-path" d={path} />
        {points.map((point) => <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="3.5" />)}
        {points.map((point, index) => (
          <text 
            className="admin-line-label" 
            key={point.label} 
            x={point.x} 
            y={chartHeight - 6} 
            textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
            style={{ fontSize: '10px' }}
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function AdminShell({
  activePage,
  adminEmail,
  children,
  sidebarOpen,
  onToggleSidebar,
  onCloseSidebar,
}: {
  activePage: AdminPageKey
  adminEmail: string
  children: ReactNode
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onCloseSidebar: () => void
}) {
  const router = useRouter()

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    void router.push('/admin/login')
  }

  return (
    <div className={`admin-console ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <aside className={`admin-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <Link href="/admin" className="admin-brand">
          <img src="/nova-logo-n.png" alt="NovaBoard AI logo" className="admin-brand-logo" />
          <span className="admin-brand-copy">
            <strong>NOVA<br />BOARD AI</strong>
            <small>ADMIN PANEL</small>
          </span>
        </Link>
        <button type="button" className="admin-sidebar-close" onClick={onCloseSidebar} aria-label="Close navigation">
          <AdminIcon name="x" />
        </button>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link key={item.key} className={activePage === item.key ? 'active' : ''} href={item.href}>
              <AdminIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="admin-profile">
          <span className="admin-profile-avatar">{getInitials(adminEmail.split('@')[0].replace(/[._-]/g, ' '))}</span>
          <div>
            <span>{adminEmail.split('@')[0].replace(/[._-]/g, ' ') || 'Admin'}</span>
            <small>{adminEmail}</small>
          </div>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </aside>
      <div className={`admin-sidebar-backdrop ${sidebarOpen ? 'visible' : ''}`} onClick={onCloseSidebar} />
      <main className="admin-main">
        <div className="admin-mobile-bar">
          <button type="button" className="admin-mobile-menu-button" onClick={onToggleSidebar} aria-label="Open navigation">
            <AdminIcon name="menu" />
          </button>
          <img src="/nova-logo-n.png" alt="NovaBoard AI logo" className="admin-mobile-logo" />
          <span className="admin-mobile-title">{activePage === 'dashboard' ? 'Dashboard' : activePage.charAt(0).toUpperCase() + activePage.slice(1)}</span>
        </div>
        {children}
      </main>
    </div>
  )
}

function PageHeader({ title, eyebrow, actions }: { title: string; eyebrow: string; actions?: React.ReactNode }) {
  return (
    <header className="admin-page-header">
      <div>
        <h1>{title}</h1>
        <span>{eyebrow}</span>
      </div>
      {actions}
    </header>
  )
}

const dateRangeLabels: Record<string, string> = {
  all: 'All Time',
  '7d': 'Last 7 Days',
  '14d': 'Last 14 Days',
  '30d': 'Last 30 Days',
}

const getAdminName = (email: string) => {
  const normalized = (email || '').trim().toLowerCase()
  if (normalized === 'mksubbu007@gmail.com') return 'Subhramanya'
  if (normalized === 'sha786rukhm@gmail.com') return 'Sharuk'
  return 'Alden'
}

function DashboardHome({
  overview,
  adminEmail,
  dateRange,
  dateMenuOpen,
  onToggleDateMenu,
  onSelectDateRange,
  onExport,
}: {
  overview: Overview
  adminEmail: string
  dateRange: 'all' | '7d' | '14d' | '30d'
  dateMenuOpen: boolean
  onToggleDateMenu: () => void
  onSelectDateRange: (range: 'all' | '7d' | '14d' | '30d') => void
  onExport: () => void
}) {
  const chartData = overview.series.applicants.map(item => ({ label: item.date.slice(5), value: item.value }))
  const spark = chartData.map((item) => item.value + 1)
  const emailOpenRate = overview.kpis.openRate || 0
  const clickRate = overview.kpis.clickRate || 0
  const bounceRate = overview.kpis.bounceRate || 0
  const latestCampaigns = overview.campaigns.slice(0, 3)

  const formatTrend = (val: number) => `${val >= 0 ? '+' : ''}${val}% vs last 14d`

  return (
    <>
      <PageHeader
        title="Dashboard"
        eyebrow={`Welcome back, ${getAdminName(adminEmail)}!`}
        actions={
          <div className="admin-toolbar">
            <div className="admin-date-picker-container">
              <button type="button" className="admin-date-picker-button" onClick={onToggleDateMenu}>
                <AdminIcon name="calendar" />
                {dateRangeLabels[dateRange]}
              </button>
              {dateMenuOpen && (
                <div className="admin-date-dropdown">
                  <button type="button" onClick={() => onSelectDateRange('all')}>All Time</button>
                  <button type="button" onClick={() => onSelectDateRange('7d')}>Last 7 Days</button>
                  <button type="button" onClick={() => onSelectDateRange('14d')}>Last 14 Days</button>
                  <button type="button" onClick={() => onSelectDateRange('30d')}>Last 30 Days</button>
                </div>
              )}
            </div>
            <button type="button" onClick={onExport}><AdminIcon name="download" />Export</button>
          </div>
        }
      />
      <section className="admin-stat-grid">
        <StatCard label="Total Applicants" value={overview.kpis.total} trend={formatTrend(overview.trends.total)} icon="users" tone="purple" data={spark} />
        <StatCard label="Pending Review" value={overview.kpis.pending} trend={formatTrend(overview.trends.pending)} icon="clock" tone="orange" data={overview.series.pending.map(i => i.value)} />
        <StatCard label="Approved Users" value={overview.kpis.approved} trend={formatTrend(overview.trends.approved)} icon="check" tone="green" data={overview.series.approved.map(i => i.value)} />
        <StatCard label="Rejected Users" value={overview.kpis.rejected} trend={formatTrend(overview.trends.rejected)} icon="x" tone="red" data={spark.map((item) => Math.max(1, item - 1))} />
        <StatCard label="Emails Sent" value={overview.kpis.emailsSent} trend={formatTrend(overview.trends.emailsSent)} icon="send" tone="purple" data={spark.map((item, index) => item + (index % 3))} />
        <StatCard label="Email Open Rate" value={`${overview.kpis.openRate}%`} trend={formatTrend(overview.trends.openRate)} icon="mail" tone="purple" data={spark} />
      </section>
      <section className="admin-two-column">
        <article className="admin-panel admin-chart-panel">
          <div className="admin-panel-head">
            <h2>Applications Over Time</h2>
            <button type="button">Real-time</button>
          </div>
          <ChartLine data={chartData.map((item) => ({ ...item, label: formatShortDate(`2026-${item.label}`) }))} />
        </article>
        <article className="admin-panel admin-activity-panel">
          <div className="admin-panel-head">
            <h2>Real-time Activity</h2>
            <button type="button" onClick={() => window.location.href='/admin/applicants'}>View all</button>
          </div>
          <div className="admin-feed">
            {(overview.activity.length ? overview.activity : [{ id: 'empty', message: 'No activity yet', type: 'activity', actor: 'system', createdAt: new Date().toISOString() }]).map((item) => (
              <div key={item.id} className={item.type}>
                <span><AdminIcon name={item.type === 'login' ? 'users' : item.type === 'campaign' ? 'send' : item.type === 'applicant' ? 'check' : 'mail'} /></span>
                <p>{item.message}<small>{item.actor}</small></p>
                <time>{getRelativeTime(item.createdAt)}</time>
              </div>
            ))}
          </div>
        </article>
      </section>
      <section className="admin-two-column admin-lower-grid">
        <article className="admin-panel admin-applicants-panel">
          <div className="admin-panel-head">
            <h2>Latest Applicants</h2>
            <Link href="/admin/applicants">View all</Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table admin-compact-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Media</th>
                  <th>Source</th>
                  <th>Date Applied</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(latestApplicants.length ? latestApplicants : [
                  { id: 'empty-1', name: 'No applicants yet', email: 'Waiting for signups', source: 'Website', dateApplied: new Date().toISOString(), status: 'pending' as ApplicantStatus, notes: '', useCase: '' },
                ]).map((applicant) => (
                  <tr key={applicant.id}>
                    <td data-label="Name">
                      <span className="admin-table-val name-val">
                        <span className="admin-avatar">{getInitials(applicant.name)}</span>
                        <span className="admin-table-text">{applicant.name}</span>
                      </span>
                    </td>
                    <td data-label="Email"><span className="admin-table-val">{applicant.email}</span></td>
                    <td data-label="Media">
                      <span className="admin-table-val">
                        {(() => {
                          const media =
                            applicant.projectMedia && applicant.projectMedia.length > 0
                              ? applicant.projectMedia
                              : (applicant.projectImages ?? []).map((url) => ({ url, type: 'image' as const }))

                          if (media.length === 0) return <span className="admin-no-media">—</span>

                          const first = media[0]
                          return (
                            <div className="admin-table-media-preview">
                              {first.type === 'video' ? (
                                <a
                                  href={first.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="admin-table-video-placeholder"
                                  onClick={(e) => e.stopPropagation()}
                                  title="View video"
                                >
                                  <AdminIcon name="video" />
                                </a>
                              ) : (
                                <a
                                  href={first.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  title="View image"
                                >
                                  <img src={first.url} alt="Media" className="admin-table-media-thumb" />
                                </a>
                              )}
                              {media.length > 1 && <span className="admin-table-media-count">+{media.length - 1}</span>}
                            </div>
                          )
                        })()}
                      </span>
                    </td>
                    <td data-label="Source"><span className="admin-table-val">{applicant.source}</span></td>
                    <td data-label="Date Applied"><span className="admin-table-val">{formatDate(applicant.dateApplied)}</span></td>
                    <td data-label="Status">
                      <span className="admin-table-val">
                        <span className={`admin-status ${applicant.status}`}>{statusLabels[applicant.status]}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
        <article className="admin-panel admin-email-panel">
          <div className="admin-panel-head">
            <h2>Email Performance</h2>
            <button type="button">Last 14 days</button>
          </div>
          <div className="admin-email-metrics">
            <div><span>Open Rate</span><strong>{emailOpenRate}%</strong><small>+7.3%</small><i style={{ '--metric': `${Math.min(100, emailOpenRate)}%` } as CSSProperties} /></div>
            <div><span>Click Rate</span><strong>{clickRate}%</strong><small>+4.1%</small><i style={{ '--metric': `${Math.min(100, clickRate * 3)}%` } as CSSProperties} /></div>
            <div><span>Bounce Rate</span><strong>{bounceRate}%</strong><small>-0.8%</small><i style={{ '--metric': `${Math.min(100, bounceRate * 12)}%` } as CSSProperties} /></div>
          </div>
          <div className="admin-panel-head admin-campaign-head">
            <h2>Recent Campaigns</h2>
            <Link href="/admin/campaigns">View all</Link>
          </div>
          <div className="admin-campaign-table">
            {(latestCampaigns.length && latestCampaigns[0].id !== 'empty-campaign' ? latestCampaigns : []).map((campaign) => {
              const stats = overview.campaignStats.find(s => s.campaignId === campaign.id) || { recipients: 0, opens: 0, clicks: 0, openRate: 0, clickRate: 0 }
              return (
                <div key={campaign.id} className="admin-campaign-row">
                  <div className="admin-campaign-info">
                    <span className="admin-campaign-name">{campaign.name}</span>
                    <b className="admin-campaign-status">{campaign.status}</b>
                  </div>
                  <div className="admin-campaign-stats">
                    <div className="admin-campaign-stat">
                      <strong>{stats.recipients}</strong>
                      <small>Recipients</small>
                    </div>
                    <div className="admin-campaign-stat">
                      <strong>{stats.openRate.toFixed(1)}%</strong>
                      <small>Opens</small>
                    </div>
                    <div className="admin-campaign-stat">
                      <strong>{stats.clickRate.toFixed(1)}%</strong>
                      <small>Clicks</small>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </article>
      </section>
    </>
  )
}

function ApplicantsPage({ applicants, refresh }: { applicants: Applicant[]; refresh: () => void }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [drawer, setDrawer] = useState<Applicant | null>(null)
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'email' | 'delete' | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const pageSize = 8

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase()
    return applicants
      .filter((applicant) => status === 'all' || applicant.status === status)
      .filter((applicant) => `${applicant.name} ${applicant.email} ${applicant.source}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name)
        if (sort === 'status') return a.status.localeCompare(b.status)
        return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
      })
  }, [applicants, query, sort, status])

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const toggle = (id: string) =>
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))

  const runBulk = async () => {
    if (!confirmAction) return
    
    if (confirmAction === 'delete') {
      await Promise.all(
        selected.map((id) =>
          requestJson(`/api/admin/applicants?id=${id}`, {
            method: 'DELETE',
          })
        )
      )
    } else {
      await requestJson('/api/admin/bulk', {
        method: 'POST',
        body: JSON.stringify({ action: confirmAction, ids: selected }),
      })
    }
    
    setConfirmAction(null)
    setSelected([])
    refresh()
  }

  const handleDelete = async (id: string) => {
    await requestJson(`/api/admin/applicants?id=${id}`, {
      method: 'DELETE',
    })
    setDeletingId(null)
    setDrawer(null)
    refresh()
  }

  const saveApplicant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!drawer) return
    const form = new FormData(event.currentTarget)
    await requestJson('/api/admin/applicants', {
      method: 'PATCH',
      body: JSON.stringify({
        id: drawer.id,
        status: form.get('status'),
        notes: form.get('notes'),
      }),
    })
    setDrawer(null)
    refresh()
  }

  return (
    <>
      <PageHeader
        title="Applicants"
        eyebrow="Alpha waitlist"
        actions={
          <div className="admin-actions">
            <button disabled={!selected.length} onClick={() => setConfirmAction('approve')}>Approve Selected</button>
            <button disabled={!selected.length} onClick={() => setConfirmAction('reject')}>Reject Selected</button>
            <button disabled={!selected.length} onClick={() => setConfirmAction('email')}>Send Email</button>
            <button disabled={!selected.length} className="admin-danger" onClick={() => setConfirmAction('delete')}>Delete Selected</button>
          </div>
        }
      />
      <section className="admin-panel">
        <div className="admin-table-tools">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search applicants" />
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {Object.keys(statusLabels).map((key) => <option key={key} value={key}>{statusLabels[key as ApplicantStatus]}</option>)}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="newest">Newest first</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={paged.length > 0 && paged.every((item) => selected.includes(item.id))} onChange={() => setSelected(paged.every((item) => selected.includes(item.id)) ? [] : paged.map((item) => item.id))} /></th>
                <th>Name</th>
                <th>Email</th>
                <th>Media</th>
                <th>Date Applied</th>
                <th>Status</th>
                <th>Source</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
               {paged.map((applicant) => (
                <tr key={applicant.id} onClick={() => setDrawer(applicant)}>
                  <td data-label="Select" onClick={(event) => event.stopPropagation()}>
                    <span className="admin-table-val">
                      <input type="checkbox" checked={selected.includes(applicant.id)} onChange={() => toggle(applicant.id)} />
                    </span>
                  </td>
                  <td data-label="Name">
                    <span className="admin-table-val name-val">
                      <span className="admin-table-text">{applicant.name}</span>
                    </span>
                  </td>
                  <td data-label="Email"><span className="admin-table-val">{applicant.email}</span></td>
                  <td data-label="Media">
                    <span className="admin-table-val">
                      {(() => {
                        const media =
                          applicant.projectMedia && applicant.projectMedia.length > 0
                            ? applicant.projectMedia
                            : (applicant.projectImages ?? []).map((url) => ({ url, type: 'image' as const }))

                        if (media.length === 0) return <span className="admin-no-media">—</span>

                        const first = media[0]
                        return (
                          <div className="admin-table-media-preview">
                            {first.type === 'video' ? (
                              <a
                                href={first.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-table-video-placeholder"
                                onClick={(e) => e.stopPropagation()}
                                title="View video"
                              >
                                <AdminIcon name="video" />
                              </a>
                            ) : (
                              <a
                                href={first.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="View image"
                              >
                                <img src={first.url} alt="Media" className="admin-table-media-thumb" />
                              </a>
                            )}
                            {media.length > 1 && <span className="admin-table-media-count">+{media.length - 1}</span>}
                          </div>
                        )
                      })()}
                    </span>
                  </td>
                  <td data-label="Date Applied"><span className="admin-table-val">{formatDate(applicant.dateApplied)}</span></td>
                  <td data-label="Status">
                    <span className="admin-table-val">
                      <span className={`admin-status ${applicant.status}`}>{statusLabels[applicant.status]}</span>
                    </span>
                  </td>
                  <td data-label="Source"><span className="admin-table-val">{applicant.source}</span></td>
                  <td data-label="Notes"><span className="admin-table-val">{applicant.notes || 'Open details'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{filtered.length} applicants</span>
          <div>
            <button disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
            <span>{page} / {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
          </div>
        </div>
      </section>
      {drawer ? (
        <div className="admin-drawer-backdrop" onClick={() => setDrawer(null)}>
          <aside className="admin-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="admin-drawer-header-actions">
              <button className="admin-danger-text" type="button" onClick={() => setDeletingId(drawer.id)}>Delete</button>
              <button className="admin-close" type="button" onClick={() => setDrawer(null)}>Close</button>
            </div>
            <h2>{drawer.name}</h2>
            <p>{drawer.email}</p>
            {(() => {
              const mediaCount = (drawer.projectMedia?.length ?? 0) || (drawer.projectImages?.length ?? 0)
              if (mediaCount === 0) return null
              return (
                <div className="admin-drawer-quick-actions">
                  <button
                    type="button"
                    className="admin-quick-media-btn"
                    onClick={() => document.getElementById('admin-drawer-media')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    <AdminIcon name="video" />
                    View {mediaCount} Media Item{mediaCount === 1 ? '' : 's'}
                  </button>
                </div>
              )
            })()}
            <dl>
              <div><dt>Application Date</dt><dd>{formatDate(drawer.dateApplied)}</dd></div>
              <div><dt>Source</dt><dd>{drawer.source}</dd></div>
              {drawer.country && <div><dt>Country</dt><dd>{drawer.country}</dd></div>}
              {drawer.student && <div><dt>Is Student?</dt><dd>{drawer.student}</dd></div>}
              {drawer.experienceLevel && <div><dt>Experience Level</dt><dd>{drawer.experienceLevel}</dd></div>}
              {drawer.projectsCompleted && <div><dt>Projects Completed</dt><dd>{drawer.projectsCompleted}</dd></div>}
              {drawer.bestProject && <div><dt>Best Project</dt><dd>{drawer.bestProject}</dd></div>}
              <div><dt>Use Case</dt><dd>{drawer.useCase || 'Not provided'}</dd></div>
              {drawer.projectLinks && (
                <div>
                  <dt>Project Links</dt>
                  <dd>
                    <a href={drawer.projectLinks.startsWith('http') ? drawer.projectLinks : `https://${drawer.projectLinks}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-purple)', textDecoration: 'underline' }}>
                      {drawer.projectLinks}
                    </a>
                  </dd>
                </div>
              )}
              {/* Project Media: images + videos */}
              {(() => {
                // Build unified media list: prefer projectMedia, fall back to legacy projectImages
                const mediaItems: Array<{ url: string; type: 'image' | 'video' }> =
                  drawer.projectMedia && drawer.projectMedia.length > 0
                    ? drawer.projectMedia
                    : (drawer.projectImages ?? []).map(url => ({ url, type: 'image' as const }))

                if (mediaItems.length === 0) return null

                return (
                  <div id="admin-drawer-media">
                    <dt style={{ marginBottom: '10px' }}>Project Media</dt>
                    <dd>
                      <div className="admin-media-grid">
                        {mediaItems.map((item, i) =>
                          item.type === 'video' ? (
                            <div key={i} className="admin-media-item">
                              <video
                                src={item.url}
                                controls
                                muted
                                preload="metadata"
                                className="admin-video-preview"
                              />
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-media-open-link"
                              >
                                View full video ↗
                              </a>
                            </div>
                          ) : (
                            <div key={i} className="admin-media-item">
                              <a href={item.url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={item.url}
                                  alt={`Media ${i + 1}`}
                                  className="admin-media-thumb"
                                />
                              </a>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="admin-media-open-link"
                              >
                                View full image ↗
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    </dd>
                  </div>
                )
              })()}
              {drawer.willingFeedback !== undefined && <div><dt>Willing to feedback?</dt><dd>{drawer.willingFeedback ? 'Yes' : 'No'}</dd></div>}
            </dl>
            <form onSubmit={saveApplicant}>
              <label>Status<select name="status" defaultValue={drawer.status}>{Object.keys(statusLabels).map((key) => <option key={key} value={key}>{statusLabels[key as ApplicantStatus]}</option>)}</select></label>
              <label>Admin notes<textarea name="notes" defaultValue={drawer.notes} rows={8} /></label>
              <button type="submit">Save Applicant</button>
            </form>
          </aside>
        </div>
      ) : null}
      {confirmAction ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2>Confirm {confirmAction} action</h2>
            <p>This will {confirmAction} {selected.length} selected applicant{selected.length === 1 ? '' : 's'} and trigger the related email workflow when applicable.</p>
            <div>
              <button onClick={() => setConfirmAction(null)}>Cancel</button>
              <button className={confirmAction === 'delete' ? 'admin-danger' : ''} onClick={runBulk}>Confirm</button>
            </div>
          </div>
        </div>
      ) : null}
      {deletingId ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <h2>Delete Applicant?</h2>
            <p>This will permanently remove this applicant from the database. This action cannot be undone.</p>
            <div>
              <button onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="admin-danger" onClick={() => void handleDelete(deletingId)}>Delete Permanently</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

function CampaignsPage({ campaigns, refresh }: { campaigns: Campaign[]; refresh: () => void }) {
  const [preview, setPreview] = useState(false)
  const [status, setStatus] = useState('')
  const [content, setContent] = useState('Hi {{name}},\n\nHere is an update from NovaBoard AI.')
  const [subject, setSubject] = useState('NovaBoard AI Alpha update')
  const composerRef = useRef<HTMLFormElement | null>(null)

  const submitForm = async (formElement: HTMLFormElement, mode: 'draft' | 'send' | 'test') => {
    const form = new FormData(formElement)
    try {
      const result = await requestJson<{ sent: number; failures: number }>('/api/admin/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          subject,
          previewText: form.get('previewText'),
          content,
          type: form.get('type'),
          segment: form.get('segment'),
          testEmail: form.get('testEmail'),
          mode,
        }),
      })
      setStatus(mode === 'draft' ? 'Draft saved.' : `Sent ${result.sent}. Failures ${result.failures}.`)
      refresh()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Campaign action failed.')
    }
  }

  const grouped = {
    Drafts: campaigns.filter((campaign) => campaign.status === 'draft'),
    Scheduled: campaigns.filter((campaign) => campaign.status === 'scheduled'),
    Sent: campaigns.filter((campaign) => campaign.status === 'sent'),
  }

  const openComposer = () => {
    setPreview(false)
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    composerRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
  }

  return (
    <>
      <PageHeader title="Email campaigns" eyebrow="Resend command center" actions={<button type="button" className="admin-primary" onClick={openComposer}>Create Campaign</button>} />
      <section className="admin-two-column">
        <form
          ref={composerRef}
          className="admin-panel admin-composer"
          onSubmit={(event) => {
            event.preventDefault()
            void submitForm(event.currentTarget, 'draft')
          }}
        >
          <div className="admin-panel-head">
            <h2>Composer</h2>
            <button type="button" onClick={() => setPreview((value) => !value)}>{preview ? 'Editor' : 'Preview Mode'}</button>
          </div>
          <label>Campaign Name<input name="name" defaultValue="Alpha Update" required /></label>
          <label>Campaign Type<select name="type"><option>Alpha Acceptance</option><option>Alpha Rejection</option><option>Product Updates</option><option>Launch Announcements</option><option>Custom Campaign</option></select></label>
          <label>Subject<input value={subject} onChange={(event) => setSubject(event.target.value)} required /></label>
          <label>Preview Text<input name="previewText" placeholder="Short inbox preview" /></label>
          <label>Segment<select name="segment"><option value="approved">Approved Users</option><option value="pending">Pending Users</option><option value="all">Custom Segment</option></select></label>
          <label>Test Email<input name="testEmail" placeholder="founder@example.com" /></label>
          {preview ? (
            <div className="admin-email-preview"><h3>{subject}</h3>{content.split('\n').map((line, index) => <p key={`${line}-${index}`}>{line.replace(/{{name}}/g, 'Alden').replace(/{{email}}/g, 'alden@example.com')}</p>)}</div>
          ) : (
            <label>Rich Text Editor<textarea value={content} onChange={(event) => setContent(event.target.value)} rows={10} /></label>
          )}
          <div className="admin-variable-row"><span>{'{{name}}'}</span><span>{'{{email}}'}</span></div>
          <div className="admin-actions">
            <button type="submit">Save Draft</button>
            <button type="button" onClick={(event) => event.currentTarget.form && void submitForm(event.currentTarget.form, 'test')}>Send Test Email</button>
            <button type="button" onClick={(event) => event.currentTarget.form && void submitForm(event.currentTarget.form, 'send')}>Send Campaign</button>
          </div>
          {status ? <p className="admin-form-status">{status}</p> : null}
        </form>
        <div className="admin-campaign-lanes">
          {Object.entries(grouped).map(([label, items]) => (
            <article className="admin-panel" key={label}>
              <div className="admin-panel-head"><h2>{label}</h2><span>{items.length}</span></div>
              <div className="admin-campaign-list">
                {(items.length ? items : [{ id: label, name: 'No campaigns yet', subject: 'Create one from the composer', type: 'Custom', status: label.toLowerCase(), createdAt: new Date().toISOString(), previewText: '', content: '' }]).map((campaign) => (
                  <div key={campaign.id}><strong>{campaign.name}</strong><span>{campaign.subject}</span><small>{campaign.type} - {formatDate(campaign.createdAt)}</small></div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

function AnalyticsPage({ overview }: { overview: Overview }) {
  const total = Math.max(1, overview.kpis.total)
  const approval = Math.round((overview.kpis.approved / total) * 100)
  const rejection = Math.round((overview.kpis.rejected / total) * 100)
  return (
    <>
      <PageHeader title="Analytics" eyebrow="Growth and email performance" />
      <section className="admin-stat-grid">
        <StatCard label="Approval Rate" value={`${approval}%`} trend="Approved / total" icon="check" tone="green" />
        <StatCard label="Rejection Rate" value={`${rejection}%`} trend="Rejected / total" icon="x" tone="red" />
        <StatCard label="Daily Signups" value={getDailyBuckets(overview.applicants).at(-1)?.value ?? 0} trend="Today" icon="clock" tone="blue" />
        <StatCard label="Weekly Signups" value={overview.applicants.filter((item) => Date.now() - new Date(item.dateApplied).getTime() < 7 * 86400000).length} trend="Last 7 days" icon="chart" tone="purple" />
        <StatCard label="Monthly Signups" value={overview.applicants.filter((item) => Date.now() - new Date(item.dateApplied).getTime() < 30 * 86400000).length} trend="Last 30 days" icon="calendar" tone="orange" />
        <StatCard label="Email Performance" value={`${overview.kpis.openRate}%`} trend="Open rate" icon="mail" tone="purple" />
      </section>
      <section className="admin-two-column">
        <article className="admin-panel"><div className="admin-panel-head"><h2>Applications Over Time</h2><span>Line proxy</span></div><ChartLine data={getDailyBuckets(overview.applicants)} /></article>
        <article className="admin-panel"><div className="admin-panel-head"><h2>Email Performance</h2><span>Campaigns</span></div><ChartLine data={overview.campaigns.slice(0, 8).map((campaign) => ({ label: campaign.name.slice(0, 6), value: campaign.status === 'sent' ? 1 : 0 }))} /></article>
      </section>
    </>
  )
}

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

function SettingsPage({ adminEmail }: { adminEmail: string }) {
  const [adminEmails, setAdminEmails] = useState<Array<{ email: string; notificationsEnabled: boolean }>>([])
  const [newEmail, setNewEmail] = useState('')
  const [status, setStatus] = useState('')
  const [loadingEmails, setLoadingEmails] = useState(true)

  // Template settings
  const [templateSubject, setTemplateSubject] = useState('')
  const [templateBodyText, setTemplateBodyText] = useState('')
  const [templateBodyHtml, setTemplateBodyHtml] = useState('')
  const [loadingTemplate, setLoadingTemplate] = useState(true)
  const [templateStatus, setTemplateStatus] = useState('')

  const loadEmails = async () => {
    try {
      setLoadingEmails(true)
      const data = await requestJson<{ entries?: Array<{ email: string; notificationsEnabled: boolean }>; emails?: string[] }>('/api/admin/admin-emails')
      setAdminEmails(
        Array.isArray(data.entries)
          ? data.entries.map((entry) => ({
              email: entry.email,
              notificationsEnabled: entry.notificationsEnabled !== false,
            }))
          : (data.emails ?? []).map((email) => ({ email, notificationsEnabled: true })),
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to load admin emails.')
    } finally {
      setLoadingEmails(false)
    }
  }

  const loadTemplate = async () => {
    try {
      setLoadingTemplate(true)
      const data = await requestJson<{ subject: string; bodyText: string; bodyHtml: string }>('/api/admin/email-template')
      setTemplateSubject(data.subject || 'Welcome to NovaBoard AI Alpha')
      setTemplateBodyText(data.bodyText || defaultTextBody)
      setTemplateBodyHtml(data.bodyHtml || defaultHtmlBody)
    } catch (err) {
      setTemplateStatus('Unable to load email template.')
    } finally {
      setLoadingTemplate(false)
    }
  }

  useEffect(() => {
    void loadEmails()
    void loadTemplate()
  }, [])

  const addEmail = async () => {
    const email = newEmail.trim().toLowerCase()
    if (!email) {
      setStatus('Enter a valid email address.')
      return
    }
    try {
      setStatus('')
      await requestJson('/api/admin/admin-emails', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setNewEmail('')
      setStatus(`Added ${email}`)
      void loadEmails()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to add admin email.')
    }
  }

  const removeEmail = async (email: string) => {
    try {
      setStatus('')
      await requestJson(`/api/admin/admin-emails?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })
      setStatus(`Removed ${email}`)
      void loadEmails()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to remove admin email.')
    }
  }

  const toggleNotifications = async (email: string, enabled: boolean) => {
    try {
      setStatus('')
      await requestJson('/api/admin/admin-emails', {
        method: 'PUT',
        body: JSON.stringify({ email, notificationsEnabled: enabled }),
      })
      setStatus(`${enabled ? 'Enabled' : 'Disabled'} notifications for ${email}`)
      setAdminEmails((prev) =>
        prev.map((entry) => (entry.email === email ? { ...entry, notificationsEnabled: enabled } : entry)),
      )
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to update notifications.')
    }
  }

  const saveTemplate = async () => {
    try {
      setTemplateStatus('Saving template…')
      await requestJson('/api/admin/email-template', {
        method: 'POST',
        body: JSON.stringify({
          subject: templateSubject,
          bodyText: templateBodyText,
          bodyHtml: templateBodyHtml,
        }),
      })
      setTemplateStatus('Template saved successfully.')
    } catch (err) {
      setTemplateStatus(err instanceof Error ? err.message : 'Unable to save email template.')
    }
  }

  return (
    <>
      <PageHeader title="Settings" eyebrow="Workspace controls" />
      <section className="admin-settings-grid">
        <article className="admin-panel">
          <h2>General</h2>
          <label>Brand Name<input value="NovaBoard AI" readOnly /></label>
          <label>Environment<input value="Production-ready internal admin" readOnly /></label>
        </article>
        <article className="admin-panel">
          <h2>Email Settings</h2>
          <label>Resend Configuration<input value="Uses RESEND_API_KEY and RESEND_FROM_EMAIL" readOnly /></label>
          <label>Delivery Status<input value="Tracked in email_logs" readOnly /></label>
        </article>
        <article className="admin-panel">
          <h2>Admin Management</h2>
          <label>Current Admin<input value={adminEmail} readOnly /></label>
          <label>Add Admin Email<input value={newEmail} onChange={(event) => setNewEmail(event.target.value)} placeholder="admin@example.com" /></label>
          <button type="button" className="admin-primary" onClick={addEmail}>Add Admin</button>
          <div className="admin-admin-list">
            {loadingEmails ? (
              <p>Loading admin emails…</p>
            ) : adminEmails.length ? (
              adminEmails.map((entry) => (
                <div key={entry.email} className="admin-admin-item">
                  <span>{entry.email}</span>
                  <div className="admin-admin-actions">
                    <button
                      type="button"
                      className={entry.notificationsEnabled ? 'admin-secondary' : 'admin-primary'}
                      onClick={() => void toggleNotifications(entry.email, !entry.notificationsEnabled)}
                    >
                      {entry.notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
                    </button>
                    {entry.email !== adminEmail ? (
                      <button type="button" onClick={() => void removeEmail(entry.email)}>Remove</button>
                    ) : (
                      <small>Current</small>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p>No admin emails configured yet.</p>
            )}
          </div>
        </article>
        <article className="admin-panel">
          <h2>Security Settings</h2>
          <p>Approved email allowlist, password authentication, signed HTTP-only session cookies, protected routes, and explicit logout are enabled.</p>
        </article>
        <article className="admin-panel template-editor-panel">
          <h2>Alpha Waitlist Signup Email Template</h2>
          <p>Customize the automated welcome email sent when a user signs up. Use <code>{"{{name}}"}</code> to insert the applicant's name dynamically.</p>
          {loadingTemplate ? (
            <p>Loading email template settings…</p>
          ) : (
            <div className="admin-template-form">
              <label>Email Subject
                <input value={templateSubject} onChange={(e) => setTemplateSubject(e.target.value)} placeholder="Welcome to NovaBoard AI Alpha" />
              </label>
              <label>Plain Text Version
                <textarea value={templateBodyText} onChange={(e) => setTemplateBodyText(e.target.value)} rows={8} />
              </label>
              <label>HTML Version
                <textarea value={templateBodyHtml} onChange={(e) => setTemplateBodyHtml(e.target.value)} rows={12} className="code-font" />
              </label>
              <button type="button" className="admin-primary" onClick={saveTemplate}>Save Email Template</button>
              {templateStatus ? <p className="admin-form-status">{templateStatus}</p> : null}
            </div>
          )}
        </article>
      </section>
      {status ? <p className="admin-form-status">{status}</p> : null}
    </>
  )
}

export function AdminDashboard({ activePage, adminEmail }: { activePage: AdminPageKey; adminEmail: string }) {
  const [overview, setOverview] = useState<Overview>(overviewCache ?? emptyOverview)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!overviewCache)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateRange, setDateRange] = useState<'all' | '7d' | '14d' | '30d'>('all')
  const [dateMenuOpen, setDateMenuOpen] = useState(false)

  const refresh = async () => {
    try {
      setError('')
      const data = await requestJson<Overview>('/api/admin/overview')
      overviewCache = data
      setOverview(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load admin data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30000)
    return () => window.clearInterval(interval)
  }, [])

  const filteredOverview = useMemo(() => {
    if (dateRange === 'all') return overview

    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30
    const baseDate = new Date('2026-06-05T23:59:59Z')
    const limitTime = baseDate.getTime() - days * 24 * 60 * 60 * 1000

    const filteredApplicants = overview.applicants.filter(
      (app) => new Date(app.dateApplied).getTime() >= limitTime
    )
    const filteredCampaigns = overview.campaigns.filter(
      (camp) => new Date(camp.createdAt).getTime() >= limitTime
    )
    const filteredActivity = overview.activity.filter(
      (act) => new Date(act.createdAt).getTime() >= limitTime
    )

    const total = filteredApplicants.length
    const pending = filteredApplicants.filter((a) => a.status === 'pending').length
    const approved = filteredApplicants.filter((a) => a.status === 'approved').length
    const rejected = filteredApplicants.filter((a) => a.status === 'rejected').length

    return {
      kpis: {
        total,
        pending,
        approved,
        rejected,
        emailsSent: filteredCampaigns.length * 45,
        openRate: overview.kpis.openRate,
      },
      applicants: filteredApplicants,
      campaigns: filteredCampaigns,
      activity: filteredActivity,
    }
  }, [overview, dateRange])

  const handleExport = () => {
    if (!filteredOverview.applicants || filteredOverview.applicants.length === 0) return
    const headers = ['ID', 'Name', 'Email', 'Date Applied', 'Status', 'Source', 'Notes', 'Use Case']
    const rows = filteredOverview.applicants.map((app) => [
      `"${app.id}"`,
      `"${app.name.replace(/"/g, '""')}"`,
      `"${app.email.replace(/"/g, '""')}"`,
      `"${app.dateApplied}"`,
      `"${app.status}"`,
      `"${app.source.replace(/"/g, '""')}"`,
      `"${(app.notes || '').replace(/"/g, '""')}"`,
      `"${(app.useCase || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `novaboard_applicants_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const content = (() => {
    if (loading) return <div className="admin-loading">Loading NovaBoard operations...</div>
    if (activePage === 'applicants') return <ApplicantsPage applicants={filteredOverview.applicants} refresh={refresh} />
    if (activePage === 'campaigns' || activePage === 'emails') return <CampaignsPage campaigns={overview.campaigns} refresh={refresh} />
    if (activePage === 'analytics') return <AnalyticsPage overview={filteredOverview} />
    if (activePage === 'settings') return <SettingsPage adminEmail={adminEmail} />
    return (
      <DashboardHome
        overview={filteredOverview}
        adminEmail={adminEmail}
        dateRange={dateRange}
        dateMenuOpen={dateMenuOpen}
        onToggleDateMenu={() => setDateMenuOpen((prev) => !prev)}
        onSelectDateRange={(range) => {
          setDateRange(range)
          setDateMenuOpen(false)
        }}
        onExport={handleExport}
      />
    )
  })()

  return (
    <AdminShell activePage={activePage} adminEmail={adminEmail} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen((value) => !value)} onCloseSidebar={() => setSidebarOpen(false)}>
      {error ? <div className="admin-error">{error}</div> : null}
      {content}
    </AdminShell>
  )
}
