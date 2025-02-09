import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart } from "@/components/ui/charts"

interface LeaderboardEntry {
  id: string
  namaPemilik: string
  totalPoin: number
  jumlahPengumpulan: number
}

interface UserStatisticsCardProps {
  leaderboard: LeaderboardEntry[]
}

const UserStatisticsCard: React.FC<UserStatisticsCardProps> = ({ leaderboard }) => {
  const topUsers = leaderboard.slice(0, 10)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Statistik Pengguna Teratas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <BarChart
            data={topUsers.map((user) => ({
              name: user.namaPemilik,
              "Total Poin": user.totalPoin,
            }))}
            index="name"
            categories={["Total Poin"]}
            colors={["#10B981"]}
            valueFormatter={(value) => `${value} poin`}
            yAxisWidth={48}
          />
        </div>
      </CardContent>
    </Card>
  )
}

export default UserStatisticsCard

