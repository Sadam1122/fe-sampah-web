import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Incident {
  id: string
  type: string
  location: string
  status: string
  time: string
}

interface SimplifiedMapProps {
  incidents: Incident[]
}

export function SimplifiedMap({ incidents }: SimplifiedMapProps) {
  const pendingIncidents = incidents.filter((incident) => incident.status === "Pending")
  const resolvedIncidents = incidents.filter((incident) => incident.status !== "Pending")

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Insiden Pending</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pendingIncidents.map((incident) => (
              <div key={incident.id} className="flex justify-between items-center">
                <span>{incident.type}</span>
                <Badge variant="destructive">Pending</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Insiden Terselesaikan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {resolvedIncidents.map((incident) => (
              <div key={incident.id} className="flex justify-between items-center">
                <span>{incident.type}</span>
                <Badge variant="outline">Selesai</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

