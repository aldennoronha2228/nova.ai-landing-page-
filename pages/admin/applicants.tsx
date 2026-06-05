import { AdminDashboard } from '../../src/admin/AdminDashboard'
import { requireAdminPage } from '../../src/server/adminAuth'

export const getServerSideProps = requireAdminPage

export default function AdminApplicantsPage({ adminEmail }: { adminEmail: string }) {
  return <AdminDashboard activePage="applicants" adminEmail={adminEmail} />
}
