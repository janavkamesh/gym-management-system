import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import type { ValueType } from 'recharts/types/component/DefaultTooltipContent';

export interface TrendSeriesConfig {
  key: string;
  name?: string;
  color: string;
}

export interface TrendChartProps {
  data: any[];
  chartType?: 'bar' | 'area';
  series: TrendSeriesConfig[];
  valueFormatter?: (value: number) => string;
  onClick?: (e: any) => void;
}

export function TrendChart({ data, chartType = 'bar', series, valueFormatter, onClick }: TrendChartProps) {
  const formatter = (value: ValueType | undefined) => 
    value !== undefined ? (valueFormatter ? valueFormatter(Number(value)) : value) : '';

  const getSafeId = (key: string) => key.replace(/\s+/g, '-');

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-slate-600">{entry.name}:</span>
              <span className="text-sm font-medium text-slate-900">
                {valueFormatter ? valueFormatter(Number(entry.value)) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartType === 'area') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onClick={onClick}>
          <defs>
            {series.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`color-${getSafeId(s.key)}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
          <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis hide={!valueFormatter} tickFormatter={valueFormatter} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={45} dx={-10} />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }} />}
          {series.map(s => (
            <Area 
              key={s.key}
              type="monotone" 
              dataKey={s.key} 
              name={s.name || s.key}
              stroke={s.color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#color-${getSafeId(s.key)})`} 
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} onClick={onClick}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
        <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
        <YAxis hide={!valueFormatter} tickFormatter={valueFormatter} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={45} dx={-10} />
        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '20px' }} />}
        {series.map(s => (
          <Bar 
            key={s.key}
            dataKey={s.key} 
            name={s.name || s.key}
            fill={s.color} 
            radius={[6, 6, 0, 0]} 
            maxBarSize={60} 
            minPointSize={2}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
