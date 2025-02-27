import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoin: number
  jumlahPengumpulan: number
  username?: string
}

interface RankingListProps {
  users: LeaderboardEntry[]
}

export function RankingList({ users }: RankingListProps) {
  // Hindari mutasi langsung pada props
  const sortedUsers = [...users].sort((a, b) => b.totalPoin - a.totalPoin)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold">🏆 Papan Peringkat</CardTitle>
      </CardHeader>
      <CardContent>
        <Table className="w-full border-collapse">
          <TableHeader>
            <TableRow className="bg-gray-200 dark:bg-gray-700">
              <TableHead className="text-center w-16">🏅 Peringkat</TableHead>
              <TableHead>👤 Pengguna</TableHead>
              <TableHead className="text-center">⭐ Poin</TableHead>
              <TableHead className="text-center">📦 Pengumpulan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, index) => {
              const displayName = user.username || `User-${user.userId}`
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={index < 3 ? "bg-yellow-100 dark:bg-yellow-900" : ""}
                >
                  <TableCell className="text-center font-semibold">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={`https://api.dicebear.com/6.x/initials/svg?seed=${displayName}`}
                          alt={displayName}
                        />
                        <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold text-green-600 dark:text-green-400">
                    {user.totalPoin}
                  </TableCell>
                  <TableCell className="text-center">{user.jumlahPengumpulan}</TableCell>
                </motion.tr>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
