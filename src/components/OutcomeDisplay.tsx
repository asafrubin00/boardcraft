'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ResolutionOutput, OutcomeTier, ResolutionBreakdown } from '@/types/game';
import { playOutcomeSound, playWildcard } from '@/engine/soundEngine';
import { DOMAIN_LABELS } from '@/engine/boardConstants';

interface OutcomeDisplayProps {
  outcome: ResolutionOutput | null;
  eventName: string;
  onDismiss: () => void;
  directorNames?: Record<string, string>;
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

function generateWhyLines(bd: ResolutionBreakdown): string[] {
  const lines: string[] = [];

  if (bd.isDoNothing) {
    lines.push('No directors were deployed and no strategy was engaged — the board stood aside.');
    return lines;
  }

  // Team score line
  if (bd.directorContributions.length > 0) {
    const names = bd.directorContributions.map((c) => c.directorName.split(' ').pop()).join(' and ');
    const teamAvg = Math.round(
      bd.directorContributions.reduce((s, c) => s + c.weightedScore, 0) / bd.directorContributions.length
    );
    const energyNote = bd.directorContributions.some((c) => c.energyModifier < 1.0)
      ? `, though energy depletion reduced effectiveness`
      : '';
    const dynamicsNote =
      bd.dynamicsModifier !== 0
        ? ` — board dynamics ${bd.dynamicsModifier > 0 ? 'added' : 'subtracted'} ${Math.abs(bd.dynamicsModifier)} points`
        : '';
    lines.push(
      `${names} produced a team score of ${teamAvg}${energyNote}${dynamicsNote}, ${
        bd.matchScore < 40 ? 'a weak match for this event' : bd.matchScore >= 70 ? 'a strong match for this event' : 'a moderate match for this event'
      }.`
    );
  }

  // Strategy line
  const multiplierStr = bd.strategyMultiplier.toFixed(2).replace(/\.?0+$/, '');
  if (bd.fallbackTriggered) {
    lines.push(
      `The chosen strategy's competency gate was not met — the board fell back to an alternative approach (×${multiplierStr} multiplier).`
    );
  } else {
    const gateNote = bd.competencyGatePassed ? '' : '';
    lines.push(
      `Strategy applied at ×${multiplierStr} multiplier${bd.committeeBonus > 0 ? `, with a +${bd.committeeBonus} committee bonus` : ''}${gateNote}.`
    );
  }

  // Randomness line
  const tierVariance = `${Math.round((1 - bd.randomRange[0]) * 100)}%`;
  const factorDir = bd.randomFactor > 1.0 ? 'boosted' : bd.randomFactor < 1.0 ? 'reduced' : 'left unchanged';
  lines.push(
    `Difficulty variance of ±${tierVariance} ${factorDir} the raw score by a factor of ${bd.randomFactor.toFixed(2)}, arriving at a final score of ${Math.round(bd.rawScore * bd.randomFactor)}.`
  );

  // Best available gap (primary domain only, to keep it tight)
  const primaryGap = bd.bestAvailableGaps.find((g) => g.domain === bd.primaryDomain);
  if (primaryGap) {
    const domainLabel = DOMAIN_LABELS[primaryGap.domain] ?? primaryGap.domain;
    const deployed = primaryGap.deployedBestName
      ? `${primaryGap.deployedBestName} (${primaryGap.deployedBestRating})`
      : `none deployed (0)`;
    lines.push(
      `On ${domainLabel}, the best available director rates ${primaryGap.rosterBestRating} vs the deployed team's ${primaryGap.deployedBestRating} — a gap of ${primaryGap.gap} points. RNG variance means outcomes are never guaranteed, but this deficit was a factor.`
    );
    void deployed; // included above inline
  }

  return lines.slice(0, 4);
}

function WhyExpander({ breakdown }: { breakdown: ResolutionBreakdown }) {
  const [open, setOpen] = useState(false);
  const lines = generateWhyLines(breakdown);

  return (
    <div className="border-t border-card-border pt-3 mt-1">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
      >
        Why this outcome {open ? '↑' : '→'}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 space-y-1.5"
        >
          {lines.map((line, i) => (
            <p key={i} className="text-xs text-foreground/60 leading-relaxed">
              {line}
            </p>
          ))}
        </motion.div>
      )}
    </div>
  );
}

export default function OutcomeDisplay({
  outcome,
  eventName,
  onDismiss,
  directorNames = {},
}: OutcomeDisplayProps) {
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
    const timer = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [outcome, handleDismiss]);

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

            {/* Why this outcome expander */}
            {outcome.breakdown && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.3 }}
              >
                <WhyExpander breakdown={outcome.breakdown} />
              </motion.div>
            )}

            {/* Dismiss hint */}
            <p className="text-[11px] text-foreground/40 text-center mt-3">
              Click to dismiss
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
