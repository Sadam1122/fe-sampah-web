import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PointsHistoryProps {
  history: {
    date: string
    action: string
    points: number
  }[]
}

export function PointsHistory({ history }: PointsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Poin</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Poin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.action}</TableCell>
                <TableCell>{item.points}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
