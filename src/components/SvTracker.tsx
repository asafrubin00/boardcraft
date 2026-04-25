'use client';

import React, { useState, useRef, useCallback } from 'react';

interface SvTrackerProps {
  svIndex: number;
  svHistory: { turn: string; sv: number }[];
  onOpenDashboard: () => void;
}

export default function SvTracker({ svIndex, svHistory, onOpenDashboard }: SvTrackerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    hoverTimer.current = setTimeout(() => setShowTooltip(true), 500);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setShowTooltip(false);
  }, []);
  // Take the last 8 data points for the sparkline
  const sparkData = svHistory.slice(-8);

  // Determine SV number color
  const svColor =
    svIndex >= 100
      ? 'text-success'
      : svIndex >= 80
        ? 'text-gold'
        : 'text-error';

  // Sparkline dimensions
  const width = 200;
  const height = 40;
  const padding = 4;

  // Calculate scale from data range
  const values = sparkData.map((d) => d.sv);
  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values) : 100;
  const range = maxVal - minVal || 1;

  const points = sparkData.map((d, i) => {
    const x = padding + (i / Math.max(sparkData.length - 1, 1)) * (width - padding * 2);
    const y = height - padding - ((d.sv - minVal) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex items-center gap-4 rounded-lg bg-card-bg border border-card-border px-4 py-2">
      {/* SV Label & Value */}
      <div
        className="relative flex items-center gap-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="text-sm text-foreground/70 font-narrative cursor-help">SV Index</span>
        <span className={`text-2xl font-bold ${svColor}`}>{svIndex}</span>
        {showTooltip && (
          <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-navy border border-gold/40 rounded-lg p-3 shadow-lg pointer-events-none">
            <p className="text-xs text-foreground/90 font-narrative leading-relaxed">
              <span className="text-gold font-bold">Shareholder Value Index</span> - tracks the percentage change in your company&apos;s value since game start. Starting value: 100. Your goal: finish as high as possible.
            </p>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparkData.length >= 2 && (
        <svg width={width} height={height} className="shrink-0">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#C8960C"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            filter="url(#glow)"
          />
          {/* Dots */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#C8960C" />
          ))}
        </svg>
      )}

      {/* Dashboard Button */}
      <button
        onClick={onOpenDashboard}
        className="text-sm text-gold hover:text-gold-light transition-colors cursor-pointer whitespace-nowrap"
      >
        📊 Dashboard
      </button>
    </div>
  );
}
