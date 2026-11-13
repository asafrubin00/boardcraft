'use client';

import './boardbuild.css';

export interface ReadinessMeter {
  label: string;
  value: string;
  /** 0–1 fill */
  pct: number;
  hint?: string;
  tone?: 'gold' | 'ok' | 'bad';
}

interface ReadinessPanelProps {
  /** 0–100 */
  readiness: number;
  blocking: number;
  advisory: number;
  meters: ReadinessMeter[];
}

/**
 * Headline "how close is this board to lockable" read-out. The percentage is
 * derived only from the live compliance check (blocking issues weighted twice
 * advisory ones, relative to the worst state seen this session) — it adds no
 * rules of its own.
 */
export default function ReadinessPanel({ readiness, blocking, advisory, meters }: ReadinessPanelProps) {
  const ready = blocking === 0;
  const clean = blocking === 0 && advisory === 0;
  return (
    <div className="rounded-xl border border-gold/25 bc-panel px-4 py-3.5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.22em] text-foreground/45 font-semibold">Board readiness</p>
          <p className={`text-[11px] mt-1 font-medium ${ready ? 'text-success' : 'text-foreground/70'}`}>
            {clean
              ? 'Fully compliant — ready to lock'
              : ready
                ? `Lockable · ${advisory} advisory ${advisory === 1 ? 'issue' : 'issues'} outstanding`
                : <><span className="text-error font-semibold">{blocking} blocking</span>{advisory > 0 ? <> · <span className="text-warning">{advisory} advisory</span></> : null}</>}
          </p>
        </div>
        <p className={`font-narrative text-4xl font-bold tabular-nums leading-none ${ready ? 'text-success' : 'text-gold'}`}>
          {readiness}<span className="text-lg align-top ml-0.5">%</span>
        </p>
      </div>
      <div className="relative mt-3 h-2.5 rounded-full bg-black/45 overflow-hidden border border-white/5">
        <div className={`bc-meter-fill h-full rounded-full ${ready ? 'bc-meter-fill-ok' : ''}`} style={{ width: `${Math.max(readiness, 3)}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        {meters.map((m) => (
          <div key={m.label} title={m.hint}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] uppercase tracking-[0.16em] text-foreground/45 truncate">{m.label}</span>
              <span className={`text-[12px] font-semibold tabular-nums ${m.tone === 'bad' ? 'text-error' : m.tone === 'ok' ? 'text-success' : 'text-foreground/85'}`}>{m.value}</span>
            </div>
            <div className="mt-1 h-1 rounded-full bg-black/45 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(Math.max(m.pct, 0), 1) * 100}%`,
                  background: m.tone === 'bad' ? '#D94040' : m.tone === 'ok' ? '#3BA55C' : '#C8960C',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
