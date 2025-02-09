import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Incident {
  id: string;
  type: string;
  location: string;
  status: string;
  time: string;
}

interface SimplifiedMapProps {
  incidents: Incident[];
}

export function SimplifiedMap({ incidents }: SimplifiedMapProps) {
  const inProgressIncidents = incidents.filter(
    (incident) => incident.status === "IN_PROGRESS"
  );
  const resolvedIncidents = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 🔵 Insiden In Progress */}
      <Card className="shadow-lg border border-blue-400">
        <CardHeader>
          <CardTitle className="text-blue-600">🛠️ Insiden In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {inProgressIncidents.length > 0 ? (
            <div className="space-y-3">
              {inProgressIncidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  className="flex justify-between items-center p-3 bg-blue-100 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="font-medium text-blue-700">{incident.type}</span>
                  <Badge variant="outline" className="bg-blue-500 text-white">
                    In Progress
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Tidak ada insiden yang sedang berlangsung.</p>
          )}
        </CardContent>
      </Card>

      {/* ✅ Insiden Selesai */}
      <Card className="shadow-lg border border-green-400">
        <CardHeader>
          <CardTitle className="text-green-600">✅ Insiden Selesai</CardTitle>
        </CardHeader>
        <CardContent>
          {resolvedIncidents.length > 0 ? (
            <div className="space-y-3">
              {resolvedIncidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  className="flex justify-between items-center p-3 bg-green-100 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <span className="font-medium text-green-700">{incident.type}</span>
                  <Badge variant="outline" className="bg-green-500 text-white">
                    Selesai
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">HANYA SUPERADMIN YANG BISA LIAT.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
