'use client';

import { motion } from 'framer-motion';

interface BudgetTrackerProps {
  totalBudget: number;
  committed: number;
  energyTransitionCost: number;
  hasEnergyTransition: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `£${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `£${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}k`;
  }
  return `£${value}`;
}

export default function BudgetTracker({
  totalBudget,
  committed,
  energyTransitionCost,
  hasEnergyTransition,
}: BudgetTrackerProps) {
  const etCost = hasEnergyTransition ? energyTransitionCost : 0;
  const remaining = totalBudget - committed - etCost;
  const isLow = remaining < totalBudget * 0.1;
  const committedPct = Math.min((committed / totalBudget) * 100, 100);
  const etPct = Math.min((etCost / totalBudget) * 100, 100 - committedPct);

  return (
    <div className="w-full rounded-lg bg-card-bg border border-card-border p-4">
      {/* Summary text */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm">
        <span className="text-foreground font-medium">
          {formatCurrency(totalBudget)} total
        </span>
        <span className="text-gold-light">|</span>
        <span className="text-gold">
          {formatCurrency(committed)} committed
        </span>
        <span className="text-gold-light">|</span>
        <span className={isLow ? 'text-error font-semibold' : 'text-foreground'}>
          {formatCurrency(Math.max(remaining, 0))} remaining
        </span>
        {hasEnergyTransition && (
          <>
            <span className="text-gold-light">|</span>
            <span className="text-warning text-xs">
              {formatCurrency(etCost)} ET Committee
            </span>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-3 w-full rounded-full bg-navy-dark overflow-hidden">
        {/* Committed segment */}
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-l-full ${
            isLow ? 'bg-error' : 'bg-gold'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${committedPct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Energy transition segment */}
        {hasEnergyTransition && etPct > 0 && (
          <motion.div
            className="absolute top-0 h-full bg-warning/60"
            style={{ left: `${committedPct}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${etPct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-foreground/70">
        <span className="flex items-center gap-1">
          <span className={`inline-block w-2.5 h-2.5 rounded-sm ${isLow ? 'bg-error' : 'bg-gold'}`} />
          Committed
        </span>
        {hasEnergyTransition && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-warning/60" />
            ET Committee
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-navy-dark" />
          Available
        </span>
      </div>
    </div>
  );
}
