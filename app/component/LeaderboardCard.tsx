"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { FaTrophy, FaMedal, FaAward } from "react-icons/fa"
import { Button } from "@/components/ui/button"

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoin: number
  jumlahPengumpulan: number
  username?: string
}

const LeaderboardCard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardEntry[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const usersPerPage = 10

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        // Fetch leaderboard data
        const leaderboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`)
        const leaderboardData: LeaderboardEntry[] = await leaderboardRes.json()

        // Fetch users data
        const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
          headers: {
            "x-user-role": "SUPERADMIN", // Pastikan role yang sesuai
          },
        });
        const usersData = await usersRes.json();
        

        // Gabungkan data berdasarkan userId
        const enrichedLeaderboard = leaderboardData.map(entry => {
          const user = usersData.find((u: { id: string }) => u.id === entry.userId)
          return {
            ...entry,
            username: user ? user.username : "Tidak Diketahui"
          }
        })

        setUsers(enrichedLeaderboard)
      } catch (error) {
        console.error("Gagal mengambil data leaderboard:", error)
      }
    }

    fetchLeaderboardData()
  }, [])

  const totalPages = Math.ceil(users.length / usersPerPage)
  const paginatedUsers = users.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

  const nextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  const prevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Papan Peringkat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {paginatedUsers.map((user, index) => {
            const rank = (currentPage - 1) * usersPerPage + index + 1
            return (
              <LeaderboardRow
                key={user.id}
                rank={rank}
                name={user.username || "Tidak Diketahui"}
                points={user.totalPoin}
                collections={user.jumlahPengumpulan}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-6">
          <Button onClick={prevPage} disabled={currentPage === 1}>
            Sebelumnya
          </Button>
          <span className="text-sm font-medium">
            Halaman {currentPage} dari {totalPages}
          </span>
          <Button onClick={nextPage} disabled={currentPage === totalPages}>
            Selanjutnya
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface LeaderboardRowProps {
  rank: number
  name: string
  points: number
  collections: number
}

const LeaderboardRow: React.FC<LeaderboardRowProps> = ({ rank, name, points, collections }) => {
  const isTopThree = rank <= 3
  const icon = isTopThree ? (
    rank === 1 ? (
      <FaTrophy className="text-yellow-400" />
    ) : rank === 2 ? (
      <FaMedal className="text-gray-400" />
    ) : (
      <FaAward className="text-yellow-600" />
    )
  ) : null

  return (
    <motion.div
      className={`flex items-center justify-between p-4 rounded-lg ${
        isTopThree ? "bg-gradient-to-r from-green-400 to-blue-500" : "bg-gray-100"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex items-center space-x-4">
        <span className={`text-2xl font-bold ${isTopThree ? "text-white" : "text-gray-700"}`}>{rank}</span>
        {icon && <span className="text-2xl">{icon}</span>}
        <span className={`text-lg font-semibold ${isTopThree ? "text-white" : "text-gray-700"}`}>{name}</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className={`text-lg font-semibold ${isTopThree ? "text-white" : "text-gray-700"}`}>{points} poin</span>
        <span className={`text-sm ${isTopThree ? "text-white" : "text-gray-500"}`}>{collections} pengumpulan</span>
      </div>
    </motion.div>
  )
}

export default LeaderboardCard
