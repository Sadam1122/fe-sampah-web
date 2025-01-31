import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface User {
  id: string;
  nama_pemilik: string;
  email: string;
  total_poin: number;
  avatar: string;
  collection_count: number;
}

interface Props {
  users: User[];
}

const UserCollections: React.FC<Props> = ({ users }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jumlah Pengumpulan Pengguna</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Jumlah Pengumpulan</TableHead>
              <TableHead>Total Poin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nama_pemilik}</TableCell>
                <TableCell>{user.collection_count}</TableCell>
                <TableCell>{user.total_poin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserCollections;

