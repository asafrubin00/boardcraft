'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GovernanceHealthBreakdown, ResolvedEvent } from '@/types/game';

interface SvDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  svIndex: number;
  svHistory: { turn: string; sv: number }[];
  governanceHealth: number;
  governanceBreakdown: GovernanceHealthBreakdown;
  boardTension: number;
  proxyAdviserRating: string;
  directorEnergySummary: { name: string; energy: number }[];
  resolvedEvents: ResolvedEvent[];
}

const OUTCOME_TIERS = [
  { key: 'CRITICAL_SUCCESS', label: 'Critical Success', color: 'bg-success', textColor: 'text-white' },
  { key: 'SUCCESS', label: 'Success', color: 'bg-green-400', textColor: 'text-navy-dark' },
  { key: 'PARTIAL_SUCCESS', label: 'Partial', color: 'bg-warning', textColor: 'text-navy-dark' },
  { key: 'FAILURE', label: 'Failure', color: 'bg-error', textColor: 'text-white' },
  { key: 'CRITICAL_FAILURE', label: 'Critical Failure', color: 'bg-red-800', textColor: 'text-white' },
] as const;

const BREAKDOWN_LABELS: Record<keyof Omit<GovernanceHealthBreakdown, 'total'>, string> = {
  boardIndependence: 'Board Independence',
  committeeCompleteness: 'Committee Completeness',
  chairCeoSeparation: 'Chair-CEO Separation',
  esgGovernance: 'ESG Governance',
  skillMatrixCoverage: 'Skill Matrix Coverage',
};

function getProxyRatingColor(rating: string): string {
  const lower = rating.toLowerCase();
  if (lower.includes('strong') || lower.includes('recommend for')) return 'text-success';
  if (lower.includes('adequate') || lower.includes('monitor')) return 'text-warning';
  if (lower.includes('weak') || lower.includes('concern') || lower.includes('critical')) return 'text-error';
  return 'text-foreground';
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card-bg border border-card-border rounded-lg p-4 flex flex-col gap-3">
      <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

export default function SvDashboardModal({
  isOpen,
  onClose,
  svIndex,
  svHistory,
  governanceHealth,
  governanceBreakdown,
  boardTension,
  proxyAdviserRating,
  directorEnergySummary,
  resolvedEvents,
}: SvDashboardModalProps) {
  // Count outcome tiers
  const tierCounts: Record<string, number> = {};
  for (const tier of OUTCOME_TIERS) {
    tierCounts[tier.key] = resolvedEvents.filter((e) => e.outcomeTier === tier.key).length;
  }

  const successCount = resolvedEvents.filter(
    (e) => e.outcomeTier === 'SUCCESS' || e.outcomeTier === 'CRITICAL_SUCCESS'
  ).length;
  const resolutionScore = resolvedEvents.length > 0 ? Math.round((successCount / resolvedEvents.length) * 100) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-navy-dark/80 cursor-pointer" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-navy rounded-xl border border-card-border p-6 mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-narrative font-bold text-gold">
                SV Dashboard — Current: {svIndex}
              </h2>
              <button
                onClick={onClose}
                className="text-foreground/60 hover:text-foreground text-2xl leading-none transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 2x3 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Event Resolution Score */}
              <Panel title="Event Resolution Score">
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_TIERS.map((tier) => (
                    <span
                      key={tier.key}
                      className={`${tier.color} ${tier.textColor} text-xs font-bold px-2 py-1 rounded-full`}
                    >
                      {tier.label}: {tierCounts[tier.key]}
                    </span>
                  ))}
                </div>
                <div className="text-foreground text-sm mt-1">
                  Resolution Score:{' '}
                  <span className="font-bold text-gold">{resolutionScore}%</span>
                  <span className="text-foreground/50 ml-1">
                    ({successCount}/{resolvedEvents.length} events ≥ Success)
                  </span>
                </div>
              </Panel>

              {/* 2. Governance Health */}
              <Panel title="Governance Health">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gold">{governanceHealth}</span>
                  <span className="text-foreground/50 text-lg">/ 100</span>
                </div>
                <div className="w-full bg-navy-dark rounded-full h-3">
                  <div
                    className="bg-gold h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(governanceHealth, 100)}%` }}
                  />
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {(Object.keys(BREAKDOWN_LABELS) as Array<keyof Omit<GovernanceHealthBreakdown, 'total'>>).map(
                    (key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-foreground/70 w-40 shrink-0">
                          {BREAKDOWN_LABELS[key]}
                        </span>
                        <span className="text-xs text-gold font-bold w-8 text-right">
                          {governanceBreakdown[key]}
                        </span>
                        <span className="text-xs text-foreground/50">/20</span>
                        <div className="flex-1 bg-navy-dark rounded-full h-2">
                          <div
                            className="bg-gold-light h-2 rounded-full transition-all"
                            style={{ width: `${(governanceBreakdown[key] / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Panel>

              {/* 3. AGM Outlook */}
              <Panel title="AGM Outlook">
                <AgmOutlook
                  resolvedEvents={resolvedEvents}
                  svHistory={svHistory}
                  proxyAdviserRating={proxyAdviserRating}
                />
              </Panel>

              {/* 4. Proxy Adviser Rating */}
              <Panel title="Proxy Adviser Rating">
                <span className={`text-2xl font-bold font-narrative ${getProxyRatingColor(proxyAdviserRating)}`}>
                  {proxyAdviserRating}
                </span>
              </Panel>

              {/* 5. Director Stamina Summary */}
              <Panel title="Director Stamina Summary">
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {directorEnergySummary.map((d) => {
                    const color =
                      d.energy >= 60
                        ? 'bg-success'
                        : d.energy >= 20
                          ? 'bg-warning'
                          : 'bg-error';
                    return (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="text-xs text-foreground w-28 shrink-0 truncate">{d.name}</span>
                        <div className="flex-1 bg-navy-dark rounded-full h-2.5">
                          <div
                            className={`${color} h-2.5 rounded-full transition-all`}
                            style={{ width: `${Math.min(d.energy, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground/70 w-8 text-right">{d.energy}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>

              {/* 6. Board Tension Indicator */}
              <Panel title="Board Tension">
                {boardTension <= 60 ? (
                  <span className="text-success font-bold">Tension: Stable</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span
                      className={`font-bold ${boardTension >= 80 ? 'text-error' : 'text-warning'}`}
                    >
                      ⚠ Board Tension: {boardTension}%
                    </span>
                    <div className="w-full bg-navy-dark rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          boardTension >= 80 ? 'bg-error' : 'bg-warning'
                        }`}
                        style={{ width: `${Math.min(((boardTension - 60) / 40) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-foreground/60">
                      Internal friction is building. At 100, a Boardroom Breakdown will trigger.
                    </p>
                  </div>
                )}
              </Panel>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Helper component for AGM Outlook panel */
function AgmOutlook({
  resolvedEvents,
  svHistory,
  proxyAdviserRating,
}: {
  resolvedEvents: ResolvedEvent[];
  svHistory: { turn: string; sv: number }[];
  proxyAdviserRating: string;
}) {
  // Check if AGM quarter has been reached
  const agmResolved = resolvedEvents.some((e) => e.resolvedAtQuarter === 'AGM');

  // Estimate turns until AGM based on history length
  // In a typical game: Q1(turns 1-2), Q2(turns 3-4), AGM(turn 5)
  // We approximate: if current turn < 5, AGM is ~(5 - currentTurn) events away
  const currentTurn = svHistory.length;
  const agmTurn = 5; // approximate AGM turn

  return (
    <div className="flex flex-col gap-2">
      {agmResolved ? (
        <span className="text-success font-bold text-lg">AGM: Completed</span>
      ) : (
        <span className="text-foreground text-lg">
          Next AGM:{' '}
          <span className="text-gold font-bold">
            {Math.max(agmTurn - currentTurn, 1)} events away
          </span>
        </span>
      )}
      <div className="text-sm">
        Proxy Adviser:{' '}
        <span className={`font-bold ${getProxyRatingColor(proxyAdviserRating)}`}>
          {proxyAdviserRating}
        </span>
      </div>
    </div>
  );
}
