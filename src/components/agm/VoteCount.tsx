'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { AgmResolutionVote } from '@/engine/agm';
import { playCardDeal, playResolutionPass, playResolutionFail, playStamp } from '@/engine/soundEngine';

/** Milliseconds between one shareholder block declaring and the next. */
export const BLOCK_MS = 520;

/** How long a full count takes for a resolution with `n` blocks. */
export const countDuration = (n: number) => 500 + n * BLOCK_MS + 900;

/**
 * The poll, counted live. Each shareholder block declares in turn and the
 * tally creeps towards (or away from) the 50% line; the stamp lands only
 * once the last block is in.
 */
export default function VoteCount({ vote }: { vote: AgmResolutionVote }) {
  const [declared, setDeclared] = useState(0);
  const total = vote.blocks.length;
  const done = declared >= total;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= total; i++) {
      timers.push(setTimeout(() => { setDeclared(i); playCardDeal(); }, 400 + i * BLOCK_MS));
    }
    timers.push(setTimeout(() => {
      playStamp();
      if (vote.pass) playResolutionPass(); else playResolutionFail();
    }, 400 + total * BLOCK_MS + 380));
    return () => timers.forEach(clearTimeout);
  }, [total, vote.pass]);

  const counted = vote.blocks.slice(0, declared);
  const forShare = counted.reduce((s, b) => s + (b.weight * b.forPct) / 100, 0);
  const againstShare = counted.reduce((s, b) => s + (b.weight * (100 - b.forPct)) / 100, 0);
  const weightTotal = vote.blocks.reduce((s, b) => s + b.weight, 0) || 100;
  const forW = (forShare / weightTotal) * 100;
  const againstW = (againstShare / weightTotal) * 100;

  return (
    <div className="mt-3">
      {/* Tally */}
      <div className="relative h-5 rounded-sm overflow-hidden" style={{ background: 'rgba(27,36,48,0.10)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.18)' }}>
        <motion.div className="absolute inset-y-0 left-0" style={{ background: 'var(--success)' }} animate={{ width: `${forW}%` }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
        <motion.div className="absolute inset-y-0 right-0" style={{ background: 'var(--error)' }} animate={{ width: `${againstW}%` }} transition={{ type: 'spring', stiffness: 140, damping: 22 }} />
        <div className="absolute inset-y-0" style={{ left: '50%', width: 2, marginLeft: -1, background: 'var(--ink)' }} />
      </div>
      <div className="flex justify-between text-[11px] mt-1 tabular-nums" style={{ color: 'var(--ink-soft)' }}>
        <span style={{ color: 'var(--success)' }} className="font-bold">For {done ? vote.forPct.toFixed(1) : forW.toFixed(1)}%</span>
        <span className="uppercase tracking-[0.14em] text-[9px]">{done ? 'Poll closed' : `Counting · ${declared} of ${total} declared`}</span>
        <span style={{ color: 'var(--error)' }} className="font-bold">Against {done ? (100 - vote.forPct).toFixed(1) : againstW.toFixed(1)}%</span>
      </div>

      {/* Blocks */}
      <ul className="mt-2.5 grid gap-1">
        {vote.blocks.map((b, i) => {
          const shown = i < declared;
          return (
            <li key={b.name} className="grid items-center gap-2 text-[12px]" style={{ gridTemplateColumns: 'minmax(0,1fr) 44px 84px 40px', opacity: shown ? 1 : 0.32, transition: 'opacity .3s' }}>
              <span className="truncate">{b.name}</span>
              <span className="text-right tabular-nums" style={{ color: 'var(--ink-soft)' }}>{b.weight}%</span>
              <span className="h-1.5 rounded-full overflow-hidden" style={{ background: shown ? 'var(--error)' : 'rgba(27,36,48,0.12)' }}>
                <span className="block h-full" style={{ width: shown ? `${b.forPct}%` : 0, background: 'var(--success)', transition: 'width .5s ease-out' }} />
              </span>
              <span className="text-right tabular-nums font-bold" style={{ color: shown ? (b.forPct > 50 ? 'var(--success)' : 'var(--error)') : 'var(--ink-soft)' }}>{shown ? `${b.forPct}%` : '—'}</span>
            </li>
          );
        })}
      </ul>

      {done && vote.minorityForPct !== undefined && (
        <p className="text-[12px] mt-2.5 pt-2" style={{ borderTop: '1px dashed var(--rule)' }}>
          <span className="font-bold">Second count, minority shareholders only:</span>{' '}
          <span className="tabular-nums font-bold" style={{ color: vote.minorityPass ? 'var(--success)' : 'var(--error)' }}>{vote.minorityForPct.toFixed(1)}% for</span>
          {' '}— {vote.minorityPass ? 'carried' : 'defeated'}. Both counts must carry.
        </p>
      )}
    </div>
  );
}
