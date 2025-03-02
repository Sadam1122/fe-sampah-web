"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Sparkles, Recycle, MapPin, Trophy, Lightbulb } from "lucide-react"

// Type definitions for the props
interface WawasanAIProps {
  garbageData: Array<{
    berat: number
    userId: string
    jenisSampah: string
    waktu: string
    rt: string
  }>
  users: Array<{
    userId: string
    totalPoin: number
    user: {
      username: string
      role: string
    }
  }>
}

interface Insight {
  text: string
  values: Record<string, any>
  color: string
}

// Fuzzy Logic for dynamic analysis
const fuzzyIncreasePrediction = (lastMonthWaste: number, currentMonthWaste: number): string => {
  const ratio = currentMonthWaste / lastMonthWaste

  if (ratio >= 1.2) return "Peningkatan Signifikan"
  if (ratio >= 1.05 && ratio < 1.2) return "Peningkatan Moderat"
  if (ratio <= 0.8) return "Penurunan Signifikan"
  if (ratio <= 0.95 && ratio > 0.8) return "Penurunan Moderat"
  return "Stabil"
}

const fuzzySeasonalWastePrediction = (monthlyData: number[]): string => {
  const currentMonthWaste = monthlyData[monthlyData.length - 1]
  const avgPastWaste = monthlyData.slice(0, -1).reduce((sum, waste) => sum + waste, 0) / (monthlyData.length - 1)

  const change = ((currentMonthWaste - avgPastWaste) / avgPastWaste) * 100

  if (change > 20) return "Peningkatan Musiman Signifikan"
  if (change > 10) return "Peningkatan Musiman Moderat"
  return "Pola Musiman Stabil"
}

const fuzzyPlasticRecycling = (plasticRate: number): string => {
  if (plasticRate <= 5) return "Rendah"
  if (plasticRate <= 25) return "Sedang"
  return "Tinggi"
}

const fuzzyFuelSavings = (rtVolumes: Record<string, number>): string => {
  const totalVolume = Object.values(rtVolumes).reduce((sum, vol) => sum + vol, 0)
  const highVolumeRT = Object.entries(rtVolumes).sort((a, b) => b[1] - a[1])[0]

  if (!highVolumeRT) return "Data Tidak Mencukupi"

  const volumeRatio = highVolumeRT[1] / totalVolume

  if (volumeRatio >= 0 && volumeRatio <= 0.3) return "Merata"
  if (volumeRatio > 0.3 && volumeRatio <= 0.5) return "Kurang Merata"
  return "Tidak Rata"
}

const WawasanAI: React.FC<WawasanAIProps> = ({ garbageData = [], users = [] }) => {
  const [monthlyData, setMonthlyData] = useState<number[]>([])
  const [insights, setInsights] = useState<Insight[]>([])

  useEffect(() => {
    const lastSixMonthsWaste = Array.from({ length: 6 }, (_, idx) => {
      const targetDate = new Date()
      targetDate.setMonth(targetDate.getMonth() - idx)

      const monthData = garbageData.filter((record) => {
        const recordDate = new Date(record.waktu)
        return recordDate.getMonth() === targetDate.getMonth() && recordDate.getFullYear() === targetDate.getFullYear()
      })

      return monthData.reduce((sum, record) => sum + Number(record.berat), 0)
    }).reverse()

    setMonthlyData(lastSixMonthsWaste)
  }, [garbageData])

  useEffect(() => {
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth()
    const currentYear = currentDate.getFullYear()

    const lastMonthWaste = garbageData
      .filter((record) => {
        const recordDate = new Date(record.waktu)
        return (
          recordDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) &&
          recordDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)
        )
      })
      .reduce((sum, record) => sum + Number(record.berat), 0)

    const currentMonthWaste = garbageData
      .filter((record) => {
        const recordDate = new Date(record.waktu)
        return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear
      })
      .reduce((sum, record) => sum + Number(record.berat), 0)

    const predictedIncrease = fuzzyIncreasePrediction(lastMonthWaste, currentMonthWaste)
    const seasonalPrediction = fuzzySeasonalWastePrediction(monthlyData)

    const rtVolumes = garbageData.reduce(
      (acc, record) => {
        const berat = Number.parseFloat(String(record.berat))
        if (!isNaN(berat)) {
          acc[record.rt] = (acc[record.rt] || 0) + berat
        }
        return acc
      },
      {} as Record<string, number>,
    )

    const fuelSavings = fuzzyFuelSavings(rtVolumes)

    const plasticWaste = garbageData.filter((record) => record.jenisSampah === "Plastik")

    const plasticRecyclingRate = (plasticWaste.length / garbageData.length) * 100
    const recyclingStatus = fuzzyPlasticRecycling(plasticRecyclingRate)

    const topCollector = users.reduce((max, user) => (max.totalPoin > user.totalPoin ? max : user), users[0])

    const newInsights: Insight[] = [
      {
        text: `Prediksi peningkatan sampah: ${predictedIncrease}`,
        values: {
          "Sampah Bulan Lalu (kg)": lastMonthWaste.toFixed(2),
          "Sampah Bulan Ini (kg)": currentMonthWaste.toFixed(2),
          Rasio: lastMonthWaste > 0 ? (currentMonthWaste / lastMonthWaste).toFixed(2) : "N/A",
        },
        color:
          predictedIncrease === "Peningkatan Signifikan"
            ? "border-l-4 border-red-500"
            : predictedIncrease === "Stabil"
              ? "border-l-4 border-yellow-500"
              : "border-l-4 border-green-500",
      },
      {
        text: `Analisis tren sampah musiman: ${seasonalPrediction}`,
        values: { "Data Bulanan (kg)": monthlyData.map((value) => value.toFixed(2)).join(", ") },
        color:
          seasonalPrediction === "Peningkatan Musiman Signifikan"
            ? "border-l-4 border-red-500"
            : seasonalPrediction === "Pola Musiman Stabil"
              ? "border-l-4 border-yellow-500"
              : "border-l-4 border-green-500",
      },
      {
        text: `Tingkat daur ulang sampah plastik berada pada kategori: ${recyclingStatus}`,
        values: { "Tingkat Daur Ulang (%)": plasticRecyclingRate.toFixed(2) },
        color:
          recyclingStatus === "Tinggi"
            ? "border-l-4 border-green-500"
            : recyclingStatus === "Sedang"
              ? "border-l-4 border-yellow-500"
              : "border-l-4 border-red-500",
      },
      {
        text: `Analisis pola menunjukkan jumlah sampah setiap lokasi: ${fuelSavings}`,
        values: {
          "Volume Sampah RT": Object.entries(rtVolumes)
            .map(([rt, volume]) => `${rt}: ${volume.toFixed(2)} kg`)
            .join(", "),
        },
        color:
          fuelSavings === "Merata"
            ? "border-l-4 border-green-500"
            : fuelSavings === "Kurang Merata"
              ? "border-l-4 border-yellow-500"
              : "border-l-4 border-red-500",
      },
      {
        text: `Rekomendasi: Tingkatkan pengumpulan di RT ${
          Object.entries(rtVolumes).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"
        }`,
        values: {},
        color: "border-l-4 border-blue-500",
      },
      {
        text: `${topCollector?.user?.username || "Unknown User"} adalah pengumpul terbaik dengan ${
          topCollector?.totalPoin || 0
        } poin`,
        values: {},
        color: "border-l-4 border-purple-500",
      },
    ]

    setInsights(newInsights)
  }, [garbageData, users, monthlyData])

  return (
    <Card className="border border-gray-200 rounded-2xl shadow-xl bg-gradient-to-br from-white to-gray-100 p-6">
      <CardContent>
        <ul className="space-y-6">
          {insights.map((insight, index) => (
            <li
              key={index}
              className={`p-4 rounded-xl bg-white shadow-md flex items-start space-x-4 transition-transform transform hover:scale-105 hover:shadow-lg ${insight.color}`}
            >
              <div className="p-3 bg-gray-100 rounded-lg">
                {index === 0 && <TrendingUp className="text-red-500" />}
                {index === 1 && <Sparkles className="text-yellow-500" />}
                {index === 2 && <Recycle className="text-green-500" />}
                {index === 3 && <MapPin className="text-blue-500" />}
                {index === 4 && <Lightbulb className="text-purple-500" />}
                {index === 5 && <Trophy className="text-purple-500" />}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">{insight.text}</p>
                {Object.keys(insight.values).length > 0 && (
                  <ul className="mt-2 text-sm text-gray-600">
                    {Object.entries(insight.values).map(([key, value], idx) => (
                      <li key={idx} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>
                          {value !== undefined
                            ? typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)
                            : "-"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default WawasanAI

