'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GovernanceHealthBreakdown, ResolvedEvent, Company } from '@/types/game';
import './boardbuild/boardbuild.css';

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
  company?: Company;
}

const OUTCOME_TIERS = [
  { key: 'CRITICAL_SUCCESS', label: 'Critical success', chip: '#3BA55C' },
  { key: 'SUCCESS', label: 'Success', chip: '#6FCF8E' },
  { key: 'PARTIAL_SUCCESS', label: 'Partial', chip: '#E0B044' },
  { key: 'FAILURE', label: 'Failure', chip: '#E0655A' },
  { key: 'CRITICAL_FAILURE', label: 'Critical failure', chip: '#C0392B' },
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
    <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col gap-3">
      <h3 className="bc-overline text-gold/80">{title}</h3>
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
  company,
}: SvDashboardModalProps) {
  const isMeridian = company?.id === 'company_meridian';
  const metricLabel = isMeridian ? 'MIS' : 'SV';
  const metricFullName = isMeridian ? 'Mission Integrity Score' : 'Shareholder Value Index';
  const governanceLabels = company?.governanceLabels ?? {};
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer" onClick={onClose} />

          {/* Modal */}
          <motion.div
            className="bc-dialog relative z-10 w-full max-w-5xl max-h-[88dvh] overflow-y-auto rounded-2xl p-6 md:p-7 mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-6 mb-6 pb-5 border-b border-gold/20">
              <div>
                <p className="bc-overline text-foreground/45">{company?.name ?? 'Board'} · Dashboard</p>
                <h2 className="text-2xl font-narrative font-bold text-foreground mt-1.5">{metricFullName}</h2>
              </div>
              <div className="flex items-center gap-5">
                <Sparkline history={svHistory} />
                <div className="text-right">
                  <p className="bc-overline text-foreground/45">Current {metricLabel}</p>
                  <p className="font-narrative text-4xl font-bold text-gold tabular-nums leading-none mt-1">{svIndex}</p>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="self-start w-8 h-8 rounded-full border border-white/15 text-foreground/60 hover:text-gold hover:border-gold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 2x3 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Event Resolution Score */}
              <Panel title="Event Resolution Score">
                <div className="flex flex-wrap gap-2">
                  {OUTCOME_TIERS.map((tier) => (
                    <span
                      key={tier.key}
                      className="bc-chip"
                      data-zero={tierCounts[tier.key] === 0}
                      style={{ '--chip': tier.chip } as React.CSSProperties}
                    >
                      {tier.label} <b className="tabular-nums">{tierCounts[tier.key]}</b>
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
                <div className="flex items-baseline gap-2">
                  <span className="font-narrative text-4xl font-bold text-gold tabular-nums leading-none">{governanceHealth}</span>
                  <span className="text-foreground/45 text-sm">/ 100</span>
                </div>
                <div className="w-full bg-black/45 rounded-full h-2 overflow-hidden">
                  <div
                    className="bc-meter-fill h-2 rounded-full"
                    style={{ width: `${Math.min(governanceHealth, 100)}%` }}
                  />
                </div>
                <div className="flex flex-col gap-2 mt-1">
                  {(Object.keys(BREAKDOWN_LABELS) as Array<keyof Omit<GovernanceHealthBreakdown, 'total'>>).map(
                    (key) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-foreground/70 w-28 md:w-40 shrink-0">
                          {governanceLabels[key] ?? BREAKDOWN_LABELS[key]}
                        </span>
                        <span className="text-xs text-gold font-bold w-8 text-right">
                          {governanceBreakdown[key]}
                        </span>
                        <span className="text-xs text-foreground/50">/20</span>
                        <div className="flex-1 bg-black/45 rounded-full h-1.5">
                          <div
                            className="bg-gold-light h-1.5 rounded-full transition-all"
                            style={{ width: `${(governanceBreakdown[key] / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Panel>

              {/* 3. AGM / AMM Outlook */}
              <Panel title={isMeridian ? 'Annual Members Meeting Outlook' : 'AGM Outlook'}>
                <AgmOutlook
                  resolvedEvents={resolvedEvents}
                  svHistory={svHistory}
                  proxyAdviserRating={proxyAdviserRating}
                  isMeridian={isMeridian}
                />
              </Panel>

              {/* 4. Proxy Adviser / Charity Commission Rating */}
              <Panel title={isMeridian ? 'Governance Assessment' : 'Proxy Adviser Rating'}>
                {isMeridian ? (
                  <div className="flex flex-col gap-1">
                    <span className={`text-2xl font-bold font-narrative ${getProxyRatingColor(proxyAdviserRating)}`}>
                      {proxyAdviserRating}
                    </span>
                    <p className="text-xs text-foreground/50">Charity Governance Code assessor view</p>
                  </div>
                ) : (
                  <span className={`text-2xl font-bold font-narrative ${getProxyRatingColor(proxyAdviserRating)}`}>
                    {proxyAdviserRating}
                  </span>
                )}
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
                        <div className="flex-1 bg-black/45 rounded-full h-1.5">
                          <div
                            className={`${color} h-1.5 rounded-full transition-all`}
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

/** The metric's path so far, as a small line in the header. */
function Sparkline({ history }: { history: { turn: string; sv: number }[] }) {
  if (history.length < 2) return null;
  const w = 150;
  const h = 44;
  const vals = history.map((p) => p.sv);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = vals.map((v, i) => [4 + (i / (vals.length - 1)) * (w - 8), h - 5 - ((v - min) / span) * (h - 10)]);
  const last = pts[pts.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="hidden md:block" aria-hidden>
      <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#E0B044" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="#F0CE6E" />
    </svg>
  );
}

/** Helper component for AGM / AMM Outlook panel */
function AgmOutlook({
  resolvedEvents,
  svHistory,
  proxyAdviserRating,
  isMeridian = false,
}: {
  resolvedEvents: ResolvedEvent[];
  svHistory: { turn: string; sv: number }[];
  proxyAdviserRating: string;
  isMeridian?: boolean;
}) {
  const meetingLabel = isMeridian ? 'AMM' : 'AGM';
  // Check if AGM/AMM quarter has been reached
  const agmResolved = resolvedEvents.some((e) => e.resolvedAtQuarter === 'AGM');

  // Estimate turns until AGM based on history length
  // In a typical game: Q1(turns 1-2), Q2(turns 3-4), AGM(turn 5)
  // We approximate: if current turn < 5, AGM is ~(5 - currentTurn) events away
  const currentTurn = svHistory.length;
  const agmTurn = 5; // approximate AGM turn

  return (
    <div className="flex flex-col gap-2">
      {agmResolved ? (
        <span className="text-success font-bold text-lg">{meetingLabel}: Completed</span>
      ) : (
        <span className="text-foreground text-lg">
          Next {meetingLabel}:{' '}
          <span className="text-gold font-bold">
            {Math.max(agmTurn - currentTurn, 1)} events away
          </span>
        </span>
      )}
      <div className="text-sm">
        {isMeridian ? 'Governance Assessor' : 'Proxy Adviser'}:{' '}
        <span className={`font-bold ${getProxyRatingColor(proxyAdviserRating)}`}>
          {proxyAdviserRating}
        </span>
      </div>
    </div>
  );
}
