import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminCampaignsPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="campaigns" adminEmail={adminEmail} />
}
