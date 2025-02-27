"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../hook/useAuth"
import DashboardHeader from "../component/dashboard-header"
import DashboardMain from "../component/dashboard-main"
import DashboardFooter from "../component/dashboard-footer"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
        {/* <div className="text-2xl font-semibold text-green-600">Loading...</div> */}
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100">
      <DashboardHeader />
      <DashboardMain />
      <DashboardFooter />
    </div>
  )
}
