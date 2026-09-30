import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatCompactINR } from '@/lib/utils/formatters';

export interface DonutChartData {
  name: string;
  value: number;
  fill: string;
}

export interface DonutChartProps {
  data: DonutChartData[];
  totalLabel?: string;
  valueFormatter?: (value: number) => string;
}

export function DonutChart({ data, totalLabel = 'Total', valueFormatter }: DonutChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const formatter = valueFormatter || formatCompactINR;
  const isSingleSlice = data.length === 1;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent = total > 0 ? Math.round((data.value / total) * 100) : 0;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm pointer-events-none">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: data.fill }} />
            <span className="text-sm text-slate-600">{data.name}</span>
            <span className="text-sm text-slate-400">-</span>
            <span className="text-sm font-medium text-slate-900">{formatter(data.value)}</span>
            <span className="text-sm text-slate-400">-</span>
            <span className="text-sm text-slate-500">{percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col min-h-[250px]">
      <div className="relative h-48 w-full shrink-0">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold text-slate-900">{formatter(total)}</span>
          <span className="text-xs text-slate-500 mt-0.5">{totalLabel}</span>
        </div>
        
        <div className="absolute inset-0 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={isSingleSlice ? 0 : 4}
                minAngle={isSingleSlice ? 0 : 5}
                dataKey="value"
                isAnimationActive={false}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-5">
        {data.filter(item => item.name !== 'Monthly Membership').map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
            <span className="text-xs text-slate-500">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
