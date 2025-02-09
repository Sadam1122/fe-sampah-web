import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FaRecycle, FaTrash, FaLeaf, FaTrophy } from "react-icons/fa"
import { Progress } from "@/components/ui/progress"

const AchievementsCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Pencapaian</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Achievement
            title="Pemula Daur Ulang"
            description="Daur ulang item pertama Anda"
            icon={<FaRecycle />}
            progress={100}
          />
          <Achievement title="Pejuang Sampah" description="Kumpulkan 100kg sampah" icon={<FaTrash />} progress={75} />
          <Achievement
            title="Pelindung Lingkungan"
            description="Pertahankan tingkat daur ulang 90% selama sebulan"
            icon={<FaLeaf />}
            progress={50}
          />
          <Achievement
            title="Penggiat Komunitas"
            description="Ajak 5 teman untuk bergabung"
            icon={<FaTrophy />}
            progress={20}
          />
        </div>
      </CardContent>
    </Card>
  )
}

interface AchievementProps {
  title: string
  description: string
  icon: React.ReactNode
  progress: number
}

const Achievement: React.FC<AchievementProps> = ({ title, description, icon, progress }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-2xl text-green-600">{icon}</div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <Progress value={progress} className="w-full h-2" />
      <span className="text-xs text-gray-500 mt-1">{progress}% selesai</span>
    </div>
  )
}

export default AchievementsCard

