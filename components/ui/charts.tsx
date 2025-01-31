import React from 'react';
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
} from 'recharts';

// Card Components
const Card = ({ children }) => (
  <div className="border rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="font-bold text-xl flex items-center justify-between mb-4">
    {children}
  </div>
);

const CardTitle = ({ children }) => (
  <div className="text-lg font-semibold text-gray-800 flex items-center">
    <span className="mr-2 text-indigo-600">📊</span>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="mt-4">{children}</div>
);

// LineChart with custom configurations
export const LineChart = ({ data, index, categories, colors, valueFormatter, yAxisWidth = 40 }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={index} />
      <YAxis width={yAxisWidth} />
      <Tooltip formatter={(value) => (valueFormatter ? valueFormatter(value) : value)} />
      <Legend />
      {categories.map((category, idx) => (
        <Line key={idx} type="monotone" dataKey={category} stroke={colors[idx] || '#8884d8'} strokeWidth={2} />
      ))}
    </RechartsLineChart>
  </ResponsiveContainer>
);

// BarChart with stacked bars and custom colors
export const BarChart = ({ data, index, categories, colors, valueFormatter, yAxisWidth = 40 }) => (
  <ResponsiveContainer width="100%" height={300}>
    <RechartsBarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={index} />
      <YAxis width={yAxisWidth} />
      <Tooltip formatter={(value) => (valueFormatter ? valueFormatter(value) : value)} />
      <Legend />
      {categories.map((category, idx) => (
        <Bar key={idx} dataKey={category} stackId="a" fill={colors[idx] || '#8884d8'} />
      ))}
    </RechartsBarChart>
  </ResponsiveContainer>
);
// DonutChart with custom colors and labels
export const DonutChart = ({ data, colors, valueFormatter }) => (
  <ResponsiveContainer width="100%" height={400}>
    <RechartsPieChart>
      <Pie
        data={data}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={120}  // Increase outer radius for larger chart
        innerRadius={80}   // Increase inner radius for bigger donut hole
        label
        labelLine={false}  // Disable lines from labels to segments
        startAngle={90}    // Start angle at 90 degrees for better visual symmetry
        endAngle={450}     // End angle ensures the full circle is covered
      >
        {data.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={colors[index] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}  // Random color or custom colors
          />
        ))}
      </Pie>
      <Tooltip formatter={(value) => (valueFormatter ? valueFormatter(value) : value)} />
      <Legend
        layout="horizontal"
        align="center"
        verticalAlign="top"
        wrapperStyle={{
          paddingTop: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
        }}
      />
    </RechartsPieChart>
  </ResponsiveContainer>
);
// Example Usage in a Dashboard Component
export const Dashboard = () => {
  const chartDataLine = [
    { name: '2025-01-01', uv: 50, pv: 20 },
    { name: '2025-01-02', uv: 55, pv: 30 },
    { name: '2025-01-03', uv: 60, pv: 40 },
  ];

  const chartDataBar = [
    { name: 'A', uv: 30, pv: 20 },
    { name: 'B', uv: 40, pv: 30 },
    { name: 'C', uv: 50, pv: 40 },
  ];

  const chartDataDonut = [
    { name: 'Category 1', value: 25 },
    { name: 'Category 2', value: 50 },
    { name: 'Category 3', value: 25 },
  ];

  return (
    <div className="space-y-6">
      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Line Chart Example</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart
            data={chartDataLine}
            index="name"
            categories={['uv', 'pv']}
            colors={['#8884d8', '#82ca9d']}
            valueFormatter={(value) => `${value} units`}
            yAxisWidth={60}
          />
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Bar Chart Example</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            data={chartDataBar}
            index="name"
            categories={['uv', 'pv']}
            colors={['#8884d8', '#82ca9d']}
            valueFormatter={(value) => `${value} units`}
            yAxisWidth={60}
          />
        </CardContent>
      </Card>

      {/* Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Donut Chart Example</CardTitle>
        </CardHeader>
        <CardContent>
          <DonutChart
            data={chartDataDonut}
            colors={['#ff0000', '#00ff00', '#0000ff']}
            valueFormatter={(value) => `${value}%`}
          />
        </CardContent>
      </Card>
    </div>
  );
};
