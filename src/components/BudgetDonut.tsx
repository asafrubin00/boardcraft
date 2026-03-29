'use client';

interface BudgetDonutProps {
  total: number;
  seatsFee: number;
  etCost: number;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `£${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return `£${value}`;
}

export default function BudgetDonut({ total, seatsFee, etCost }: BudgetDonutProps) {
  const remaining = total - seatsFee - etCost;
  const isOver = remaining < 0;

  const r = 50;
  const C = 2 * Math.PI * r;

  const seatsPct = Math.min(seatsFee / total, 1);
  const etPct = Math.min(etCost / total, 1 - seatsPct);

  const seatsDash = seatsPct * C;
  const etDash = etPct * C;

  return (
    <div className="flex flex-col items-center">
      <svg width="140" height="140" viewBox="0 0 120 120">
        {/* Background ring */}
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1A2A3A" strokeWidth="12" />

        {/* Committed (seats) segment */}
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={isOver ? '#EF4444' : '#C8960C'}
          strokeWidth="12"
          strokeDasharray={`${seatsDash} ${C - seatsDash}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />

        {/* ET Committee segment */}
        {etCost > 0 && (
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="12"
            strokeDasharray={`${etDash} ${C - etDash}`}
            strokeDashoffset={-seatsDash}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        )}

        {/* Centre text */}
        <text
          x="60"
          y="56"
          textAnchor="middle"
          fill={isOver ? '#EF4444' : '#E8E4DC'}
          fontSize="14"
          fontWeight="bold"
        >
          {formatCurrency(Math.abs(remaining))}
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#E8E4DC" fontSize="8" opacity="0.5">
          {isOver ? 'over budget' : 'remaining'}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-[11px] text-foreground/60">
        <span className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-sm ${isOver ? 'bg-error' : 'bg-gold'}`} />
          Directors {formatCurrency(seatsFee)}
        </span>
        {etCost > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-warning" />
            ET {formatCurrency(etCost)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-[#1A2A3A]" />
          Free {formatCurrency(Math.max(remaining, 0))}
        </span>
      </div>
    </div>
  );
}
