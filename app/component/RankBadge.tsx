import { Badge } from "@/components/ui/badge"

interface RankBadgeProps {
  level: number
}

export function RankBadge({ level }: RankBadgeProps) {
  let color = "bg-gray-500"
  let title = "Pemula"

  if (level >= 10) {
    color = "bg-yellow-500"
    title = "Emas"
  } else if (level >= 5) {
    color = "bg-gray-400"
    title = "Perak"
  } else if (level >= 2) {
    color = "bg-yellow-700"
    title = "Perunggu"
  }

  return (
    <Badge className={`${color} text-white`}>
      {title}
    </Badge>
  )
}
