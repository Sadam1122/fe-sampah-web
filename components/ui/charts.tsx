import type React from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartProps {
  data: any[];
  colors: string[];
  valueFormatter: (value: any) => string;
}

interface LineChartProps extends ChartProps {
  index: string;
  categories: string[];
  yAxisWidth?: number;
}

interface BarChartProps extends LineChartProps {}

interface PieChartProps extends ChartProps {
  category: string;
  index: string;
}

const ChartTooltip = ({ active, payload, label, valueFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 shadow-xl bg-white border border-gray-200 z-50 rounded-md">
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-xs text-gray-600">
            <span style={{ color: entry.color }}>{entry.name}: </span>
            {valueFormatter(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const LineChart: React.FC<LineChartProps> = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  yAxisWidth = 40,
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <RechartsLineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey={index} stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis
        width={yAxisWidth}
        stroke="#555"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={valueFormatter}
        domain={[0, "dataMax + 2"]} // Pastikan selalu lebih besar dari nilai tertinggi
      />

      <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
      {categories.map((category, idx) => (
        <Line
          key={`line-${idx}`}
          type="monotone"
          dataKey={category}
          stroke={colors[idx]}
          strokeWidth={3}
          dot={{ fill: colors[idx], strokeWidth: 2 }}
          activeDot={{ r: 8 }}
        />
      ))}
    </RechartsLineChart>
  </ResponsiveContainer>
);

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  colors,
  valueFormatter,
  yAxisWidth = 48,
}) => (
  <ResponsiveContainer width="100%" height={400}>
    <RechartsBarChart 
      data={data} 
      margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
      barGap={8} 
      barCategoryGap={16} 
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
      <XAxis dataKey={index} stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
      <YAxis
        width={yAxisWidth}
        stroke="#555"
        fontSize={12}
        tickLine={false}
        axisLine={false}
        tickFormatter={valueFormatter}
        domain={[0, "dataMax + 2"]} 
      />




      <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
      {categories.map((category, idx) => (
      <Bar
      key={`bar-${idx}`}
      dataKey={category}
      fill={colors[idx]}
      radius={[6, 6, 0, 0]}
      animationDuration={800} // Animasi smooth
    />
          ))}
    </RechartsBarChart>
  </ResponsiveContainer>
);

export const PieChart: React.FC<PieChartProps> = ({ data, category, index, colors, valueFormatter }) => (
  <ResponsiveContainer width="100%" height={400}>
    <RechartsPieChart>
      <Pie
        data={data}
        dataKey={category}
        nameKey={index}
        cx="50%"
        cy="50%"
        innerRadius={70}
        outerRadius={140}
        fill="#8884d8"
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        labelLine={true}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
      <Legend verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px' }} />
    </RechartsPieChart>
  </ResponsiveContainer>
);
