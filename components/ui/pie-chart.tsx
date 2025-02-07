"use client"

import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface PieChartProps {
  data: { name: string; value: number }[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFA", "#FF6F61", "#2E93fA"]

export default function PieChart({ data }: PieChartProps) {
  const totalValue = data.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="bg-white p-4 shadow-lg rounded-2xl w-full">
      <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">Distribusi Sampah</h2>
      <ResponsiveContainer width="100%" height={350}>
        <RePieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            label={({ name, value }) => `${name} (${((value / totalValue) * 100).toFixed(1)}%)`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RePieChart>
      </ResponsiveContainer>
    </div>
  )
}
