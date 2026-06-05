import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminSettingsPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="settings" adminEmail={adminEmail} />
}
