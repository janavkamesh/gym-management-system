import React, { useState, useEffect } from 'react';

export function usePinnedPoint(resetDeps: unknown[]) {
  const [pinnedPoint, setPinnedPoint] = useState<Record<string, unknown> | null>(null);
  const [prevDeps, setPrevDeps] = useState<unknown[]>(resetDeps);

  // Clear pin when data/filters change
  let hasDepsChanged = false;
  if (resetDeps.length !== prevDeps.length) {
    hasDepsChanged = true;
  } else {
    for (let i = 0; i < resetDeps.length; i++) {
      if (resetDeps[i] !== prevDeps[i]) {
        hasDepsChanged = true;
        break;
      }
    }
  }

  if (hasDepsChanged) {
    setPinnedPoint(null);
    setPrevDeps(resetDeps);
  }

  const handleChartClick = (e: unknown) => {
    const event = e as Record<string, unknown> | null;
    if (event && Array.isArray(event.activePayload) && event.activePayload.length > 0) {
      setPinnedPoint((prev) => {
        // Rule 2: Toggle same point.
        const prevLabel = (prev?.activeLabel ?? prev?.name) as string | undefined;
        const eLabel = (event.activeLabel ?? event.name) as string | undefined;
        
        const prevPayloadArr = prev?.activePayload as Array<Record<string, unknown>> | undefined;
        const ePayloadArr = event.activePayload as Array<Record<string, unknown>> | undefined;
        
        const prevName = prevPayloadArr?.[0]?.name as string | undefined;
        const eName = ePayloadArr?.[0]?.name as string | undefined;
        
        if (prev && prevLabel === eLabel && prevName === eName) {
          return null; // unpin
        }
        return event; // pin
      });
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // Rule 4 & 5: Dismiss only if click is outside ALL charts
      if (!(e.target as Element).closest('.chart-card')) {
        setPinnedPoint(null);
      }
    };
    if (pinnedPoint) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [pinnedPoint]);

  return { pinnedPoint, handleChartClick, setPinnedPoint };
}

export interface PinnedTooltipProps {
  pinnedPoint: Record<string, unknown> | null;
  valueFormatter?: (val: number) => string;
}

export function PinnedTooltip({ pinnedPoint, valueFormatter }: PinnedTooltipProps) {
  if (!pinnedPoint) return null;

  const activeCoordinate = pinnedPoint.activeCoordinate as { x: number; y: number } | undefined;
  const activePayload = pinnedPoint.activePayload as Array<Record<string, unknown>> | undefined;
  const activeLabel = pinnedPoint.activeLabel as string | undefined;
  
  if (!activeCoordinate || !activePayload || activePayload.length === 0) return null;

  return (
    <div 
      className="absolute z-50 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-sm rounded p-2.5 text-sm pointer-events-none transition-all duration-120 ease-out"
      style={{
        left: activeCoordinate.x,
        top: activeCoordinate.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px',
        whiteSpace: 'nowrap'
      }}
    >
      {activeLabel && <div className="font-medium text-slate-700 mb-1.5">{activeLabel}</div>}
      {activePayload.map((item, i) => (
        <div key={i} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: (item.fill || item.color) as string }}></span>
          <span className="text-slate-500">{(item.name || item.dataKey) as string}:</span>
          <span className="font-medium text-slate-900">
            {valueFormatter ? valueFormatter(Number(item.value)) : (item.value as string)}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface PinnedChartWrapperProps {
  resetDeps: unknown[];
  valueFormatter?: (val: number) => string;
  children: React.ReactElement;
}

export function PinnedChartWrapper({ resetDeps, valueFormatter, children }: PinnedChartWrapperProps) {
  const { pinnedPoint, handleChartClick } = usePinnedPoint(resetDeps);
  
  // Clone the ResponsiveContainer to inject onClick into its child
  const responsiveContainer = React.Children.only(children);
  const chart = React.Children.only((responsiveContainer.props as { children: React.ReactElement }).children);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clonedChart = React.cloneElement(chart as React.ReactElement<any>, { onClick: handleChartClick });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clonedRC = React.cloneElement(responsiveContainer as React.ReactElement<any>, { children: clonedChart });

  return (
    <div className="w-full h-full absolute inset-0 chart-card">
      {clonedRC}
      <PinnedTooltip pinnedPoint={pinnedPoint} valueFormatter={valueFormatter} />
    </div>
  );
}
