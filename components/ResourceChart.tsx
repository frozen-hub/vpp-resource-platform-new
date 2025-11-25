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
    <div className="w-full h-full bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 shadow-lg flex flex-col ring-1 ring-cyan-500/20">
      <h3 className="text-cyan-400 font-bold mb-2 ml-1 text-sm tracking-wide">已登记资源统计趋势</h3>
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
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              axisLine={{ stroke: '#475569' }}
              tickLine={false}
              interval={0}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: '#94a3b8' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }}
              contentStyle={{ 
                borderRadius: '8px', 
                border: '1px solid #475569', 
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                color: '#e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)', 
                fontSize: '12px', 
                padding: '8px' 
              }}
              itemStyle={{ color: '#e2e8f0' }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '5px', fontSize: '10px', color: '#cbd5e1' }}
              iconType="rect"
              iconSize={10}
            />
            <Bar dataKey="pv" name="光伏(kW)" stackId="a" fill="#6366f1" barSize={20} radius={[0, 0, 0, 0]} />
            <Bar dataKey="storage" name="储能(MWh)" stackId="a" fill="#22c55e" barSize={20} />
            <Bar dataKey="ev" name="充电桩(kW)" stackId="a" fill="#eab308" barSize={20} />
            <Bar dataKey="load" name="空调(kW)" stackId="a" fill="#f43f5e" barSize={20} />
            <Bar dataKey="other" name="其他(MW)" stackId="a" fill="#06b6d4" barSize={20} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};