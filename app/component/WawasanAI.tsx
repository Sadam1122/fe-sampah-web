import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FaRobot } from "react-icons/fa";

// Type definitions for the props
interface WawasanAIProps {
  garbageData: Array<{
    berat: number;
    namaPemilik: string;
    jenisSampah: string;
    waktu: string;
    rt: string;
  }>;
  users: Array<{
    namaPemilik: string;
    totalPoin: number;
  }>;
}

// Fuzzy Logic for dynamic analysis
const fuzzyIncreasePrediction = (lastMonthWaste: number, currentMonthWaste: number): string => {
  const ratio = currentMonthWaste / lastMonthWaste;

  if (ratio >= 1.2) return "Peningkatan Signifikan"; // Peningkatan lebih dari 20% (rasio 1.20 atau lebih)
  if (ratio >= 1.05 && ratio < 1.2) return "Peningkatan Moderat"; // Peningkatan antara 5% hingga 20% (rasio 1.05 sampai 1.19)
  if (ratio <= 0.8) return "Penurunan Signifikan"; // Penurunan lebih dari 20% (rasio 0.80 atau kurang)
  if (ratio <= 0.95 && ratio > 0.8) return "Penurunan Moderat"; // Penurunan antara 5% hingga 20% (rasio 0.81 sampai 0.95)
  return "Stabil"; // Rasio antara 0.95 hingga 1.05, perubahan kurang dari 5%
};

const fuzzySeasonalWastePrediction = (monthlyData: number[]): string => {
  const currentMonthWaste = monthlyData[monthlyData.length - 1];
  const avgPastWaste = monthlyData.slice(0, -1).reduce((sum, waste) => sum + waste, 0) / (monthlyData.length - 1);

  const change = ((currentMonthWaste - avgPastWaste) / avgPastWaste) * 100;

  if (change > 20) return "Peningkatan Musiman Signifikan";
  if (change > 10) return "Peningkatan Musiman Moderat";
  return "Pola Musiman Stabil";
};

const fuzzyPlasticRecycling = (plasticRate: number): string => {
  if (plasticRate <= 5) return "Rendah";
  if (plasticRate <= 25) return "Sedang";
  return "Tinggi";
};

const fuzzyFuelSavings = (rtVolumes: Record<string, number>): string => {
  const totalVolume = Object.values(rtVolumes).reduce((sum, vol) => sum + vol, 0);
  const highVolumeRT = Object.entries(rtVolumes).sort((a, b) => b[1] - a[1])[0];

  const volumeRatio = highVolumeRT[1] / totalVolume;

  if (volumeRatio >= 0 && volumeRatio <= 0.3) return "Merata"; // Jika rasio berada antara 0 dan 0.3
  if (volumeRatio > 0.3 && volumeRatio <= 0.5) return "Kurang Merata"; // Rentang lebih dari 0.3 hingga 0.5
  return "Tidak Rata";
};

const WawasanAI: React.FC<WawasanAIProps> = ({ garbageData = [], users = [] }) => {
  const [monthlyData, setMonthlyData] = useState<number[]>([]);

  useEffect(() => {
    // Collecting monthly data for seasonal prediction
    const lastSixMonthsWaste = Array(6)
      .fill(0)
      .map((_, idx) => {
        const monthData = garbageData.filter(
          (record) =>
            new Date(record.waktu).getMonth() === new Date().getMonth() - idx
        );
        return monthData.reduce((sum, record) => sum + record.berat, 0);
      });
    setMonthlyData(lastSixMonthsWaste);
  }, [garbageData]);

  const getInsights = () => {
    const totalWaste = garbageData.reduce((sum, record) => sum + record.berat, 0);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // Bulan sekarang (0-11)
    const currentYear = currentDate.getFullYear(); // Tahun sekarang

    // Mencari sampah bulan ini
    const currentMonthWaste = garbageData
      .filter((record) => {
        const recordDate = new Date(record.waktu);
        return (
          recordDate.getMonth() === currentMonth &&
          recordDate.getFullYear() === currentYear
        );
      })
      .reduce((sum, record) => sum + record.berat, 0);

    // Mencari sampah bulan lalu
    const lastMonthWaste = garbageData
      .filter((record) => {
        const recordDate = new Date(record.waktu);
        return (
          recordDate.getMonth() === currentMonth - 1 || 
          (currentMonth === 0 && recordDate.getMonth() === 11) // Mengatasi bulan Desember
        ) &&
        recordDate.getFullYear() === currentYear;
      })
      .reduce((sum, record) => sum + record.berat, 0);

    // Prediksi peningkatan
    const predictedIncrease = fuzzyIncreasePrediction(lastMonthWaste, currentMonthWaste);

    const seasonalPrediction = fuzzySeasonalWastePrediction(monthlyData);

    const rtVolumes = garbageData.reduce((acc, record) => {
      acc[record.rt] = (acc[record.rt] || 0) + record.berat;
      return acc;
    }, {} as Record<string, number>);

    const fuelSavings = fuzzyFuelSavings(rtVolumes);

    const plasticWaste = garbageData.filter(
      (record) => record.jenisSampah === "Plastik"
    );
    const plasticRecyclingRate = (plasticWaste.length / garbageData.length) * 100;

    const recyclingStatus = fuzzyPlasticRecycling(plasticRecyclingRate);

    const topCollector = users.reduce(
      (max, user) => (max.totalPoin > user.totalPoin ? max : user)
    );

    return [
      {
        text: `Prediksi peningkatan sampah: ${predictedIncrease}.`,
        values: {
          "Sampah Bulan Lalu (kg)": lastMonthWaste,
          "Sampah Bulan Ini (kg)": currentMonthWaste,
          "Rasio": (currentMonthWaste / lastMonthWaste).toFixed(2),
        },
        color:
          predictedIncrease === "Peningkatan Signifikan"
            ? "text-red-500"
            : predictedIncrease === "Stabil"
            ? "text-yellow-500"
            : "text-green-500",
      },
      {
        text: `Analisis tren sampah musiman: ${seasonalPrediction}.`,
        values: { "Data Bulanan (kg)": monthlyData },
        color:
          seasonalPrediction === "Peningkatan Musiman Signifikan"
            ? "text-red-500"
            : seasonalPrediction === "Pola Musiman Stabil"
            ? "text-yellow-500"
            : "text-green-500",
      },
      {
        text: `Tingkat daur ulang sampah plastik berada pada kategori: ${recyclingStatus}.`,
        values: { "Tingkat Daur Ulang (%)": plasticRecyclingRate.toFixed(2) },
        color:
          recyclingStatus === "Tinggi"
            ? "text-green-500"
            : recyclingStatus === "Sedang"
            ? "text-yellow-500"
            : "text-red-500",
      },
      {
        text: `Analisis pola menunjukkan jumlah sampah setiap lokasi: ${fuelSavings}.`,
        values: { "Volume Sampah RT": rtVolumes },
        color:
          fuelSavings === "Merata"
            ? "text-green-500"
            : fuelSavings === "Kurang Merata"
            ? "text-yellow-500"
            : "text-red-500",
      },
      {
        text: `Rekomendasi: Tingkatkan pengumpulan di RT ${Object.entries(rtVolumes).sort(
          (a, b) => b[1] - a[1]
        )[0][0]}.`,
        values: {},
        color: "text-black",
      },
      {
        text: `${topCollector.namaPemilik} adalah pengumpul terbaik dengan ${topCollector.totalPoin} poin.`,
        values: {},
        color: "text-black",
      },
    ];
  };

  return (
    <Card className="border rounded-lg shadow-lg bg-white">
      <CardContent className="p-4">
        <ul className="space-y-4">
          {getInsights().map((insight, index) => (
            <li key={index} className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <FaRobot className="text-green-400" />
                <span className={`${insight.color} font-bold`}>{insight.text}</span>
              </div>
              {Object.keys(insight.values).length > 0 && (
                <ul className="ml-6 text-sm text-gray-600">
                  {Object.entries(insight.values).map(([key, value], idx) => (
                    <li key={idx}>
                      <span className="font-medium">{key}:</span>{" "}
                      {typeof value === "object" ? JSON.stringify(value) : value}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default WawasanAI;
