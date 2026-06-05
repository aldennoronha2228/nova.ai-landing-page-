import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdminApi } from '../../../src/server/adminAuth'
import { listActivity, listApplicants, listCampaigns, listEmailLogs } from '../../../src/server/adminData'

const dayMs = 24 * 60 * 60 * 1000

const roundRate = (value: number) => Math.round(value * 10) / 10

const getDateKey = (value: string) => new Date(value).toISOString().slice(0, 10)

const countInRange = <T,>(items: T[], getDate: (item: T) => string, from: number, to: number) =>
  items.filter((item) => {
    const time = new Date(getDate(item)).getTime()
    return time >= from && time < to
  }).length

const getTrend = <T,>(items: T[], getDate: (item: T) => string, now = Date.now()) => {
  const currentStart = now - 14 * dayMs
  const previousStart = now - 28 * dayMs
  const current = countInRange(items, getDate, currentStart, now + 1)
  const previous = countInRange(items, getDate, previousStart, currentStart)
  if (previous === 0) return current === 0 ? 0 : 100
  return roundRate(((current - previous) / previous) * 100)
}

const getDailySeries = <T,>(items: T[], getDate: (item: T) => string, now = Date.now()) => {
  const buckets = new Map<string, number>()
  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date(now - index * dayMs)
    buckets.set(date.toISOString().slice(0, 10), 0)
  }
  items.forEach((item) => {
    const key = getDateKey(getDate(item))
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })
  return [...buckets.entries()].map(([date, value]) => ({ date, value }))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await requireAdminApi(req, res)
  if (!session) return
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })

  try {
    const [applicants, campaigns, activity, emailLogs] = await Promise.all([
      listApplicants(),
      listCampaigns(),
      listActivity(),
      listEmailLogs(),
    ])
    const total = applicants.length
    const pendingApplicants = applicants.filter((applicant) => applicant.status === 'pending')
    const approvedApplicants = applicants.filter((applicant) => applicant.status === 'approved' || applicant.status === 'active')
    const rejectedApplicants = applicants.filter((applicant) => applicant.status === 'rejected')
    const sentEmailLogs = emailLogs.filter((log) => log.status === 'sent')
    const failedEmailLogs = emailLogs.filter((log) => log.status === 'failed' || log.status === 'bounced')
    const openedEmailLogs = sentEmailLogs.filter((log) => log.opened)
    const clickedEmailLogs = sentEmailLogs.filter((log) => log.clicked)
    const emailsSent = sentEmailLogs.length
    const openRate = emailsSent ? roundRate((openedEmailLogs.length / emailsSent) * 100) : 0
    const clickRate = emailsSent ? roundRate((clickedEmailLogs.length / emailsSent) * 100) : 0
    const bounceRate = emailLogs.length ? roundRate((failedEmailLogs.length / emailLogs.length) * 100) : 0

    const campaignStats = campaigns.map((campaign) => {
      const logs = emailLogs.filter((log) => log.campaignId === campaign.id)
      const sent = logs.filter((log) => log.status === 'sent')
      const opened = sent.filter((log) => log.opened)
      const clicked = sent.filter((log) => log.clicked)
      return {
        campaignId: campaign.id,
        recipients: sent.length,
        opens: opened.length,
        clicks: clicked.length,
        openRate: sent.length ? roundRate((opened.length / sent.length) * 100) : 0,
        clickRate: sent.length ? roundRate((clicked.length / sent.length) * 100) : 0,
      }
    })

    return res.status(200).json({
      kpis: {
        total,
        pending: pendingApplicants.length,
        approved: approvedApplicants.length,
        rejected: rejectedApplicants.length,
        emailsSent,
        openRate,
        clickRate,
        bounceRate,
      },
      trends: {
        total: getTrend(applicants, (item) => item.dateApplied),
        pending: getTrend(pendingApplicants, (item) => item.dateApplied),
        approved: getTrend(approvedApplicants, (item) => item.dateApplied),
        rejected: getTrend(rejectedApplicants, (item) => item.dateApplied),
        emailsSent: getTrend(sentEmailLogs, (item) => item.sentAt),
        openRate: getTrend(openedEmailLogs, (item) => item.sentAt),
      },
      series: {
        applicants: getDailySeries(applicants, (item) => item.dateApplied),
        pending: getDailySeries(pendingApplicants, (item) => item.dateApplied),
        approved: getDailySeries(approvedApplicants, (item) => item.dateApplied),
        rejected: getDailySeries(rejectedApplicants, (item) => item.dateApplied),
        emailsSent: getDailySeries(sentEmailLogs, (item) => item.sentAt),
        opens: getDailySeries(openedEmailLogs, (item) => item.sentAt),
      },
      campaignStats,
      applicants,
      campaigns,
      activity,
    })
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Overview failed.' })
  }
}
