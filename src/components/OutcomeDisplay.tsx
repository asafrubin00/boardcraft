'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResolutionOutput, OutcomeTier, Director, GameEvent, DirectorDynamic } from '@/types/game';
import { playOutcomeSound, playWildcard, playPaperSlide, playStamp } from '@/engine/soundEngine';
import { generateDebrief } from '@/engine/narrativeExplanation';
import { OPTION_MINUTES } from '@/data/optionMinutes';
import DirectorPortrait from './DirectorPortrait';
import './boardbuild/boardbuild.css';
import './scenario/scenario.css';

interface OutcomeDisplayProps {
  outcome: ResolutionOutput | null;
  eventName: string;
  onDismiss: () => void;
  directorNames?: Record<string, string>;
  deployedDirectors?: Director[];
  event?: GameEvent | null;
  directorDynamics?: DirectorDynamic[];
  /** The option the board chose, for its own minute line. */
  strategyId?: string | null;
}

const TIER_CONFIG: Record<
  OutcomeTier,
  { label: string; color: string; glow: string }
> = {
  CRITICAL_SUCCESS: {
    label: 'CRITICAL SUCCESS',
    color: '#1b7a3f',
    glow: 'shadow-[0_0_40px_rgba(34,197,94,0.3)]',
  },
  SUCCESS: {
    label: 'SUCCESS',
    color: '#2c7a4a',
    glow: 'shadow-[0_0_40px_rgba(59,165,92,0.3)]',
  },
  PARTIAL_SUCCESS: {
    label: 'PARTIAL SUCCESS',
    color: '#9a5b00',
    glow: 'shadow-[0_0_40px_rgba(224,176,68,0.3)]',
  },
  FAILURE: {
    label: 'FAILURE',
    color: '#a32222',
    glow: 'shadow-[0_0_40px_rgba(217,64,64,0.3)]',
  },
  CRITICAL_FAILURE: {
    label: 'CRITICAL FAILURE',
    color: '#7a1010',
    glow: 'shadow-[0_0_40px_rgba(153,27,27,0.3)]',
  },
};

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(value * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  const sign = display >= 0 ? '+' : '';
  return <>{sign}{display.toFixed(2)}%</>;
}

export default function OutcomeDisplay({
  outcome,
  eventName,
  onDismiss,
  directorNames = {},
  deployedDirectors,
  event,
  directorDynamics,
  strategyId,
}: OutcomeDisplayProps) {
  // Play sound on outcome + wildcard
  useEffect(() => {
    if (!outcome) return;
    // The minute lands, the result is stamped, then the tone of the outcome
    playPaperSlide();
    const timers = [
      setTimeout(() => playStamp(), 380),
      setTimeout(() => playOutcomeSound(outcome.outcomeTier), 560),
    ];
    if (outcome.wildcard) timers.push(setTimeout(() => playWildcard(), 900));
    return () => timers.forEach(clearTimeout);
  }, [outcome]);

  const config = outcome ? TIER_CONFIG[outcome.outcomeTier] : null;
  const isCritFail = outcome?.outcomeTier === 'CRITICAL_FAILURE';

  const strategy = event && strategyId ? event.strategies.find((s) => s.id === strategyId) : undefined;
  const resolved = strategyId ? OPTION_MINUTES[strategyId] : undefined;
  const landed = outcome?.narrativeText;

  const debrief = outcome && event && outcome.breakdown
    ? generateDebrief(outcome, deployedDirectors ?? [], event, directorDynamics ?? [])
    : null;

  return (
    <AnimatePresence>
      {outcome && config && (
        <>
          {/* Screen flash for CRITICAL_FAILURE */}
          {isCritFail && (
            <motion.div
              className="fixed inset-0 z-40 pointer-events-none"
              initial={{ backgroundColor: 'rgba(180,0,0,0.08)' }}
              animate={{ backgroundColor: 'rgba(180,0,0,0)' }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Dim the room behind the minute */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/55"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          />

          <motion.div
            initial={{ y: '-60vh', opacity: 0, rotate: -5 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: '100vh', opacity: 0, rotate: 4 }}
            transition={{ type: 'spring', stiffness: 190, damping: 22 }}
            className="bc-paper fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-24px)] max-w-lg md:max-w-2xl rounded-[3px] overflow-hidden"
            style={{
              // dvh, not vh: on iOS Safari 90vh is taller than the visible area
              // (toolbars), which buried the Continue button off-screen.
              maxHeight: '85dvh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Scrollable body */}
            <div className="overflow-y-auto flex-1 px-7 pt-6 pb-4">
              <div className="flex items-baseline justify-between gap-3 pb-2.5" style={{ borderBottom: '2px solid var(--ink)' }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Minute of the board</p>
                <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--ink-soft)' }}>Outcome</p>
              </div>
              <p className="bc-serif text-[19px] font-bold leading-snug mt-3">{eventName}</p>

              {/* Tier — stamped onto the minute */}
              <div className="text-center mt-5 mb-1">
                <motion.h2
                  initial={{ opacity: 0, scale: 2.8, rotate: -16 }}
                  animate={{ opacity: 0.9, scale: 1, rotate: -5 }}
                  transition={{ delay: 0.35, type: 'spring', stiffness: 420, damping: 17 }}
                  className="sc-outcome-stamp text-2xl"
                  style={{ color: config.color }}
                >
                  {config.label}
                </motion.h2>
              </div>

              {/* SV delta */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="bc-serif text-center text-[34px] font-bold mt-3 tabular-nums"
                style={{ color: outcome.svDelta >= 0 ? '#1f6b3a' : '#a32222' }}
              >
                <AnimatedNumber value={outcome.svDelta} />
              </motion.p>

              {/* Wildcard indicator */}
              {outcome.wildcard && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.75, duration: 0.3 }}
                  className="text-center text-xs mt-1"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  &#9889; Unexpected outcome
                </motion.p>
              )}

              {/* What the board resolved (differs by option), then how it landed (by result) */}
              {(resolved || landed) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                  className="pt-4 mt-4 grid gap-3.5"
                  style={{ borderTop: '1px solid var(--rule)' }}
                >
                  {resolved && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--ink-soft)' }}>
                        Resolved{strategy ? <span className="normal-case tracking-normal font-semibold"> · {strategy.label}</span> : null}
                      </p>
                      <p className="bc-serif text-[15px] leading-[1.6]">{resolved}</p>
                    </div>
                  )}
                  {landed && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-1.5" style={{ color: 'var(--ink-soft)' }}>How it landed</p>
                      <p className="bc-serif text-[15px] leading-[1.6] italic">{landed}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Debrief narrative — inline, always shown */}
              {debrief && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.95, duration: 0.4 }}
                  className="pt-4 mt-4"
                  style={{ borderTop: '1px solid var(--rule)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2" style={{ color: 'var(--ink-soft)' }}>Who you sent</p>
                  <p className="bc-serif text-[14.5px] leading-[1.65]">
                    {debrief}
                  </p>
                </motion.div>
              )}

              {/* Stamina spent by the directors sent */}
              {outcome.energyUpdates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.3 }}
                  className="pt-4 mt-4 space-y-2"
                  style={{ borderTop: '1px solid var(--rule)' }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--ink-soft)' }}>Stamina</p>
                  {outcome.energyUpdates.map((update) => (
                    <div key={update.directorId} className="flex items-center gap-2.5 text-[12px]">
                      <span className="shrink-0 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 1.5px #c8960c' }}>
                        <DirectorPortrait directorId={update.directorId} size={26} />
                      </span>
                      <span className="w-[34%] truncate font-semibold">{directorNames[update.directorId] ?? update.directorId}</span>
                      <span className="relative flex-1 h-[7px] rounded-[1px]" style={{ background: 'rgba(27,36,48,0.12)' }}>
                        <span className="absolute inset-y-0 left-0 rounded-[1px]" style={{ width: `${update.previousEnergy}%`, background: 'rgba(27,36,48,0.22)' }} />
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-[1px]"
                          initial={{ width: `${update.previousEnergy}%` }}
                          animate={{ width: `${update.newEnergy}%` }}
                          transition={{ delay: 1.2, duration: 0.7, ease: 'easeOut' }}
                          style={{ background: update.newEnergy >= 60 ? '#1f7a45' : update.newEnergy >= 20 ? '#b4761a' : '#a32222' }}
                        />
                      </span>
                      <span className="w-[96px] shrink-0 whitespace-nowrap text-right tabular-nums" style={{ color: 'var(--ink-soft)' }}>
                        {update.previousEnergy}% → <b style={{ color: 'var(--ink)' }}>{update.newEnergy}%</b>
                      </span>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Sticky footer — Continue button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.3 }}
              className="flex-shrink-0 px-7 pb-6 pt-3"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <button
                onClick={onDismiss}
                className="sc-confirm w-full py-3 rounded-[3px] font-bold text-sm cursor-pointer"
              >
                Continue →
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
