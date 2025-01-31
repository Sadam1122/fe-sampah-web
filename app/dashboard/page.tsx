import { Metadata } from 'next'
import DashboardHeader from '../component/dashboard-header'
import DashboardMain from '../component/dashboard-main'
import DashboardFooter from '../component/dashboard-footer'

export const metadata: Metadata = {
  title: 'WasteMate Admin Dashboard',
  description: 'Admin dashboard for WasteMate garbage collection system',
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <DashboardHeader />
      <DashboardMain />
      <DashboardFooter />
    </div>
  )
}

