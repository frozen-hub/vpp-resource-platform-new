import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';

interface ResourceChartProps {
  data: ChartDataPoint[];
}

export const ResourceChart: React.FC<ResourceChartProps> = ({ data }) => {
  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-2 shadow-sm flex flex-col">
      <h3 className="text-gray-700 font-bold mb-2 ml-1 text-sm">已登记的资源统计</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: '#6b7280' }} 
              axisLine={{ stroke: '#9ca3af' }}
              tickLine={false}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#6b7280' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: '#f3f4f6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '12px', padding: '8px' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '5px', fontSize: '10px' }}
              iconType="rect"
              iconSize={10}
            />
            <Bar dataKey="pv" name="光伏(kW)" stackId="a" fill="#6366f1" barSize={20} />
            <Bar dataKey="storage" name="储能(MWh)" stackId="a" fill="#84cc16" barSize={20} />
            <Bar dataKey="ev" name="充电桩(kW)" stackId="a" fill="#eab308" barSize={20} />
            <Bar dataKey="load" name="空调(kW)" stackId="a" fill="#f43f5e" barSize={20} />
            <Bar dataKey="other" name="其他(MW)" stackId="a" fill="#38bdf8" barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};