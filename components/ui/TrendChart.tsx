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

  if (chartType === 'area') {
    return (
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} onClick={onClick}>
        <defs>
          {series.map(s => (
            <linearGradient key={`grad-${s.key}`} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
        <YAxis hide={!valueFormatter} tickFormatter={valueFormatter} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={45} dx={-10} />
        <RechartsTooltip formatter={formatter} cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '10px' }} />}
        {series.map(s => (
          <Area 
            key={s.key}
            type="monotone" 
            dataKey={s.key} 
            name={s.name || s.key}
            stroke={s.color} 
            strokeWidth={2} 
            fillOpacity={1} 
            fill={`url(#color-${s.key})`} 
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} onClick={onClick}>
      <CartesianGrid vertical={false} stroke="#e2e8f0" />
      <XAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
      <YAxis hide={!valueFormatter} tickFormatter={valueFormatter} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={45} dx={-10} />
      <RechartsTooltip formatter={formatter} cursor={{ fill: '#f1f5f9' }} />
      {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '10px' }} />}
      {series.map(s => (
        <Bar 
          key={s.key}
          dataKey={s.key} 
          name={s.name || s.key}
          fill={s.color} 
          radius={[4, 4, 0, 0]} 
          maxBarSize={60} 
        />
      ))}
    </BarChart>
  );
}
