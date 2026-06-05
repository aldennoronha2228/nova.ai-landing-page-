import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminEmailsPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="emails" adminEmail={adminEmail} />
}
