import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminIndexPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="dashboard" adminEmail={adminEmail} />
}
