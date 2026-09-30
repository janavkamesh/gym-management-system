'use client';

import dynamic from 'next/dynamic';
import type { DonutChartProps } from './DonutChartImpl';

const DonutChartDynamic = dynamic(() => import('./DonutChartImpl').then(mod => mod.DonutChart), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
      <div className="w-full h-full bg-slate-200 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] rounded" />
    </div>
  )
});

export function DonutChart(props: DonutChartProps) {
  return <DonutChartDynamic {...props} />;
}

export type { DonutChartData } from './DonutChartImpl';
