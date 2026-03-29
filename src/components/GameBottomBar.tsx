'use client';

import React from 'react';
import type { Quarter } from '@/types/game';

interface GameBottomBarProps {
  currentQuarter: Quarter;
  currentTurn: number;
  maxTurns: number;
  governanceHealth: number;
}

const QUARTER_ORDER: Quarter[] = ['Q1', 'Q2', 'AGM', 'Q3', 'Q4'];

export default function GameBottomBar({
  currentQuarter,
  currentTurn,
  maxTurns,
  governanceHealth,
}: GameBottomBarProps) {
  // Governance health dot color
  const healthColor =
    governanceHealth >= 70
      ? 'bg-success'
      : governanceHealth >= 50
        ? 'bg-warning'
        : 'bg-error';

  const healthTextColor =
    governanceHealth >= 70
      ? 'text-success'
      : governanceHealth >= 50
        ? 'text-warning'
        : 'text-error';

  // Calculate turns until AGM
  const currentIdx = QUARTER_ORDER.indexOf(currentQuarter);
  const agmIdx = QUARTER_ORDER.indexOf('AGM');
  const isAfterAgm = currentIdx > agmIdx;
  const isAtAgm = currentIdx === agmIdx;

  // Rough estimate: each quarter is ~(maxTurns / 5) turns apart
  const turnsPerQuarter = Math.ceil(maxTurns / QUARTER_ORDER.length);
  const turnsUntilAgm = isAfterAgm || isAtAgm ? 0 : (agmIdx - currentIdx) * turnsPerQuarter;

  return (
    <div className="fixed left-0 right-0 z-20 bg-navy border-t border-card-border" style={{ bottom: 40 }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Quarter Badge */}
        <div className="flex items-center gap-4">
          <div className="border-2 border-gold rounded-lg px-4 py-1.5 text-center min-w-[64px]">
            <span className="text-gold font-narrative font-bold text-xl">{currentQuarter}</span>
          </div>

          {/* Turn Counter */}
          <span className="text-foreground text-sm">
            Turn{' '}
            <span className="text-gold font-bold">{currentTurn}</span>
            {' '}of{' '}
            <span className="text-foreground/70">{maxTurns}</span>
          </span>
        </div>

        {/* Governance Health */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${healthColor}`} />
            <span className="text-foreground/70 text-xs">Gov. Health</span>
            <span className={`font-bold text-sm ${healthTextColor}`}>{governanceHealth}</span>
          </div>

          {/* AGM Countdown */}
          <div className="text-xs text-foreground/60 border-l border-card-border pl-4">
            Next AGM:{' '}
            {isAfterAgm ? (
              <span className="text-success font-bold">Completed</span>
            ) : isAtAgm ? (
              <span className="text-gold font-bold">Now</span>
            ) : (
              <span className="text-gold font-bold">~{turnsUntilAgm} turns</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
