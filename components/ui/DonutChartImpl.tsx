import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-48 relative">
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
            
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              <tspan x="50%" dy="-0.2em" className="text-xl font-bold fill-slate-900">
                {formatter(total)}
              </tspan>
              <tspan x="50%" dy="1.5em" className="text-xs fill-slate-500">
                {totalLabel}
              </tspan>
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-col mt-2 max-h-32 overflow-y-auto hide-scrollbar">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-sm text-slate-700">{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-900">{formatter(item.value)}</span>
              <span className="text-xs text-slate-500 w-8 text-right">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
