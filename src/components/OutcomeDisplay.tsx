'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResolutionOutput, OutcomeTier, Director, GameEvent, DirectorDynamic } from '@/types/game';
import { playOutcomeSound, playWildcard } from '@/engine/soundEngine';
import { generateDebrief } from '@/engine/narrativeExplanation';

interface OutcomeDisplayProps {
  outcome: ResolutionOutput | null;
  eventName: string;
  onDismiss: () => void;
  directorNames?: Record<string, string>;
  deployedDirectors?: Director[];
  event?: GameEvent | null;
  directorDynamics?: DirectorDynamic[];
}

const TIER_CONFIG: Record<
  OutcomeTier,
  { label: string; color: string; glow: string }
> = {
  CRITICAL_SUCCESS: {
    label: 'CRITICAL SUCCESS',
    color: '#22C55E',
    glow: 'shadow-[0_0_40px_rgba(34,197,94,0.3)]',
  },
  SUCCESS: {
    label: 'SUCCESS',
    color: '#3BA55C',
    glow: 'shadow-[0_0_40px_rgba(59,165,92,0.3)]',
  },
  PARTIAL_SUCCESS: {
    label: 'PARTIAL SUCCESS',
    color: '#E0B044',
    glow: 'shadow-[0_0_40px_rgba(224,176,68,0.3)]',
  },
  FAILURE: {
    label: 'FAILURE',
    color: '#D94040',
    glow: 'shadow-[0_0_40px_rgba(217,64,64,0.3)]',
  },
  CRITICAL_FAILURE: {
    label: 'CRITICAL FAILURE',
    color: '#991B1B',
    glow: 'shadow-[0_0_40px_rgba(153,27,27,0.3)]',
  },
};

const AUTO_DISMISS_MS = 8000;

function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      // Ease out quad
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

function DebriefModal({
  outcome,
  eventName,
  deployedDirectors,
  event,
  directorDynamics,
  onClose,
}: {
  outcome: ResolutionOutput;
  eventName: string;
  deployedDirectors: Director[];
  event: GameEvent | null;
  directorDynamics: DirectorDynamic[];
  onClose: () => void;
}) {
  const narrative = event && outcome.breakdown
    ? generateDebrief(outcome, deployedDirectors, event, directorDynamics)
    : 'No analysis available for this event.';

  const config = TIER_CONFIG[outcome.outcomeTier];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-[#070f1a]/97"
    >
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-card-border">
        <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">The Debrief</p>
        <h2 className="text-2xl font-bold" style={{ color: config.color }}>{config.label}</h2>
        <p className="text-sm text-gold-dim mt-1">{eventName}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="font-narrative italic text-foreground/80 text-base leading-relaxed">
          {narrative}
        </p>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-card-border">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-gold/10 border border-gold/40 hover:bg-gold/20 transition-colors text-gold font-semibold text-base cursor-pointer"
        >
          Continue →
        </button>
      </div>
    </motion.div>
  );
}

export default function OutcomeDisplay({
  outcome,
  eventName,
  onDismiss,
  directorNames = {},
  deployedDirectors,
  event,
  directorDynamics,
}: OutcomeDisplayProps) {
  const [debriefOpen, setDebriefOpen] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Play sound on outcome + wildcard
  useEffect(() => {
    if (outcome) {
      playOutcomeSound(outcome.outcomeTier);
      if (outcome.wildcard) {
        setTimeout(() => playWildcard(), 200);
      }
    }
  }, [outcome]);

  useEffect(() => {
    if (!outcome) return;
    if (debriefOpen) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }
    dismissTimerRef.current = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [outcome, debriefOpen, handleDismiss]);

  const config = outcome ? TIER_CONFIG[outcome.outcomeTier] : null;
  const isCritFail = outcome?.outcomeTier === 'CRITICAL_FAILURE';
  const isCritSuccess = outcome?.outcomeTier === 'CRITICAL_SUCCESS';
  const svColor =
    outcome && outcome.svDelta >= 0 ? 'text-success' : 'text-error';

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

          <motion.div
            initial={{ y: '100vh', opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100vh', opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            onClick={handleDismiss}
            className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg cursor-pointer rounded-xl bg-card-bg p-6 ${config.glow}`}
            style={{
              border: isCritSuccess
                ? '2px solid rgba(200, 150, 12, 0.6)'
                : '1px solid var(--card-border)',
              // Gold shimmer for critical success
              ...(isCritSuccess ? {
                boxShadow: '0 0 40px rgba(200,150,12,0.25), inset 0 0 30px rgba(200,150,12,0.08)',
              } : {}),
            }}
          >
            {/* Tier label - animates in first */}
            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.3, type: 'spring' }}
              className="text-3xl font-bold text-center mb-3"
              style={{ color: config.color }}
            >
              {config.label}
            </motion.h2>

            {/* SV delta - counts up/down */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className={`text-center text-2xl font-bold mb-2 ${svColor}`}
            >
              <AnimatedNumber value={outcome.svDelta} />
            </motion.p>

            {/* Event name */}
            <p className="text-center text-sm text-gold-dim mb-3">{eventName}</p>

            {/* Narrative - fades in last */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.4 }}
              className="font-narrative italic text-foreground/70 text-sm text-center leading-relaxed mb-4"
            >
              {outcome.narrativeText}
            </motion.p>

            {/* Wildcard indicator */}
            {outcome.wildcard && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.3 }}
                className="text-center text-xs text-foreground/40 mb-3"
              >
                &#9889; Unexpected outcome
              </motion.p>
            )}

            {/* Energy updates */}
            {outcome.energyUpdates.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.3 }}
                className="border-t border-card-border pt-3 space-y-1"
              >
                {outcome.energyUpdates.map((update) => (
                  <p
                    key={update.directorId}
                    className="text-xs text-foreground/50 text-center"
                  >
                    {directorNames[update.directorId] ?? update.directorId}: {update.previousEnergy}% →{' '}
                    {update.newEnergy}%
                  </p>
                ))}
              </motion.div>
            )}

            {/* Debrief button */}
            {outcome.breakdown && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.3 }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setDebriefOpen(true); }}
                  className="w-full mt-3 px-4 py-3 rounded-lg border border-gold/50 bg-gold/5 hover:bg-gold/10 transition-colors text-left cursor-pointer"
                >
                  <p className="text-gold font-semibold text-sm">The Debrief</p>
                  <p className="text-foreground/50 text-xs mt-0.5">What worked, what didn&apos;t, and why.</p>
                </button>
              </motion.div>
            )}

            {/* Dismiss hint */}
            <p className="text-[11px] text-foreground/40 text-center mt-3">
              Click to dismiss
            </p>
          </motion.div>

          <AnimatePresence>
            {debriefOpen && outcome && (
              <DebriefModal
                outcome={outcome}
                eventName={eventName}
                deployedDirectors={deployedDirectors ?? []}
                event={event ?? null}
                directorDynamics={directorDynamics ?? []}
                onClose={() => { setDebriefOpen(false); onDismiss(); }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
