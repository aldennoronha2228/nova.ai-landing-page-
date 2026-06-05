import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminAnalyticsPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="analytics" adminEmail={adminEmail} />
}
