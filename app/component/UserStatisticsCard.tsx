"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/ui/charts"
import { motion } from "framer-motion"

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoin: number
  jumlahPengumpulan: number
  username?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

const UserStatisticsCard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch leaderboard data
        const leaderboardRes = await fetch(`${API_URL}/api/leaderboard`)
        const leaderboardData: LeaderboardEntry[] = await leaderboardRes.json()

        // Fetch users data untuk mendapatkan username jika tidak ada
        const usersRes = await fetch(`${API_URL}/api/users`, {
          headers: {
            "x-user-role": "SUPERADMIN", // Pastikan role yang sesuai
          },
        })
        const usersData = await usersRes.json()

        // Gabungkan data berdasarkan userId
        const enrichedLeaderboard = leaderboardData.map(entry => {
          const user = usersData.find((u: { id: string }) => u.id === entry.userId)
          return {
            ...entry,
            username: user ? user.username : "Tidak Diketahui"
          }
        })

        setLeaderboard(enrichedLeaderboard)
      } catch (error) {
        console.error("Gagal mengambil data leaderboard:", error)
      }
    }

    fetchLeaderboardData()
  }, [])

  const topUsers = leaderboard.slice(0, 10)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Statistik Pengguna Teratas</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          className="h-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BarChart
            data={topUsers.map((user) => ({
              name: user.username,
              "Total Poin": user.totalPoin,
            }))}
            index="name"
            categories={["Total Poin"]}
            colors={["#10B981"]}
            valueFormatter={(value) => `${value} poin`}
            yAxisWidth={48}
          />
        </motion.div>
      </CardContent>
    </Card>
  )
}

export default UserStatisticsCard
