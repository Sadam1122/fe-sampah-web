import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface User {
  id: string
  nama_pemilik: string
  email: string
  total_poin: number
  avatar: string
}

interface RankingListProps {
  users: User[]
}

export function RankingList({ users }: RankingListProps) {
  const sortedUsers = users.sort((a, b) => b.total_poin - a.total_poin)

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
              <TableHead>Level</TableHead>
              <TableHead>Poin</TableHead>
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
                      <AvatarImage src={user.avatar || `https://api.dicebear.com/6.x/initials/svg?seed=${user.nama_pemilik}`} alt={user.nama_pemilik} />
                      <AvatarFallback>{user.nama_pemilik.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{user.nama_pemilik}</span>
                  </div>
                </TableCell>
                <TableCell>{Math.floor(user.total_poin / 1000) + 1}</TableCell>
                <TableCell>{user.total_poin}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

