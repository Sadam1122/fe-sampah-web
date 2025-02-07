import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface LeaderboardEntry {
  id: string
  namaPemilik: string
  totalPoin: number
  jumlahPengumpulan: number
}

interface RankingListProps {
  users: LeaderboardEntry[]
}

export function RankingList({ users }: RankingListProps) {
  const sortedUsers = users.sort((a, b) => b.totalPoin - a.totalPoin)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Papan Peringkat</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Peringkat</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Poin</TableHead>
              <TableHead>Jumlah Pengumpulan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Avatar>
                      <AvatarImage
                        src={`https://api.dicebear.com/6.x/initials/svg?seed=${user.namaPemilik}`}
                        alt={user.namaPemilik}
                      />
                      <AvatarFallback>{user.namaPemilik.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.namaPemilik}</span>
                  </div>
                </TableCell>
                <TableCell>{user.totalPoin}</TableCell>
                <TableCell>{user.jumlahPengumpulan}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

