'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Director, BoardRole, CompetencyDomain } from '@/types/game';
import {
  DOMAIN_LABELS,
  DOMAIN_SHORT,
  ROLE_LABELS,
  AVAILABLE_ROLES,
  ALL_DOMAINS,
} from '@/engine/boardConstants';
import DirectorPortrait from './DirectorPortrait';

interface DirectorCardProps {
  director: Director;
  isOnBoard: boolean;
  assignedRole?: BoardRole;
  onAdd?: () => void;
  onRemove?: () => void;
  onRoleChange?: (role: BoardRole) => void;
  compact?: boolean;
  showFullProfile?: boolean;
  onToggleProfile?: () => void;
  /** Filter available roles based on active committees */
  activeCommittees?: { safetyEnvironment?: boolean; energyTransition?: boolean };
}

function formatFee(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `£${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `£${Math.round(value / 1_000)}k`;
  }
  return `£${value}`;
}

function getTopDomains(
  ratings: Record<CompetencyDomain, number>,
  count: number
): { domain: CompetencyDomain; score: number }[] {
  return ALL_DOMAINS
    .map((d) => ({ domain: d, score: ratings[d] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

const independenceBadge: Record<
  Director['independence'],
  { label: string; color: string }
> = {
  independent: { label: 'Independent', color: 'bg-success/20 text-success border border-success/30' },
  questionable: { label: 'Questionable', color: 'bg-warning/20 text-warning border border-warning/30' },
  'non-independent': { label: 'Non-Indep.', color: 'bg-foreground/10 text-foreground/60 border border-foreground/20' },
};

const tierBadge: Record<
  Director['availabilityTier'],
  { label: string; color: string }
> = {
  A: { label: 'Tier A', color: 'bg-success/10 text-success border border-success/30' },
  B: { label: 'Tier B', color: 'bg-warning/10 text-warning border border-warning/30' },
  C: { label: 'Search Firm', color: 'bg-gold/10 text-gold border border-gold/30' },
};

function DomainBar({ domain, score }: { domain: CompetencyDomain; score: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-foreground/70 truncate">{DOMAIN_SHORT[domain]}</span>
      <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden">
        <div
          className="h-full bg-gold rounded-full"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-right text-foreground/60">{score}</span>
    </div>
  );
}

export default function DirectorCard({
  director,
  isOnBoard,
  assignedRole,
  onAdd,
  onRemove,
  onRoleChange,
  compact = false,
  showFullProfile = false,
  onToggleProfile,
  activeCommittees,
}: DirectorCardProps) {
  const indep = independenceBadge[director.independence];
  const tier = tierBadge[director.availabilityTier];
  const topDomains = getTopDomains(director.domainRatings, 2);

  return (
    <motion.div
      data-director-id={director.id}
      whileHover={{ scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-lg bg-card-bg border p-4 ${
        director.availabilityTier === 'C' && !isOnBoard
          ? 'border-gold/50'
          : 'border-card-border'
      }`}
    >
      {/* Top row: portrait + name + fee */}
      <div className="flex items-start gap-3 mb-3">
        {/* Portrait */}
        <div className="shrink-0 rounded-full overflow-hidden border border-card-border">
          <DirectorPortrait directorId={director.id} size={52} />
        </div>

        {/* Name + badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-foreground font-narrative leading-snug">
              {director.name}
            </h3>
            <span className="text-sm font-semibold text-gold whitespace-nowrap shrink-0">
              {formatFee(director.annualFee)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${indep.color}`}>
              {indep.label}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${tier.color}`}>
              {tier.label}
            </span>
            {director.inherited && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning/10 text-warning border border-warning/30">
                Inherited
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top 2 domain scores (always visible) */}
      <div className="space-y-1 mb-2">
        {topDomains.map(({ domain, score }) => (
          <DomainBar key={domain} domain={domain} score={score} />
        ))}
      </div>

      {/* View Full Profile expander */}
      {onToggleProfile && (
        <button
          onClick={onToggleProfile}
          className="text-[11px] text-gold-light hover:text-gold transition-colors mb-2 flex items-center gap-1 cursor-pointer"
        >
          <span className="inline-block transition-transform" style={{ transform: showFullProfile ? 'rotate(90deg)' : 'rotate(0deg)' }}>
            &#9654;
          </span>
          {showFullProfile ? 'Hide Profile' : 'View Full Profile'}
        </button>
      )}

      {/* Expanded full profile */}
      <AnimatePresence>
        {showFullProfile && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 border-t border-card-border space-y-3">
              {/* All 8 domain bars */}
              <div className="space-y-1">
                {ALL_DOMAINS.map((domain) => (
                  <DomainBar
                    key={domain}
                    domain={domain}
                    score={director.domainRatings[domain]}
                  />
                ))}
              </div>

              {/* Biography */}
              <p className="text-xs text-foreground/70 font-narrative leading-relaxed">
                {director.background}
              </p>

              {/* Jurisdiction scores */}
              {Object.keys(director.jurisdictionScores).length > 0 && (
                <div className="text-xs">
                  <span className="text-foreground/50">Jurisdiction: </span>
                  {Object.entries(director.jurisdictionScores).map(([jur, score]) => (
                    <span key={jur} className="text-foreground/70">
                      {jur} {score}
                    </span>
                  ))}
                </div>
              )}

              {/* Risk flag indicator */}
              {director.riskFlag && !director.riskFlag.activated && (
                <div className="flex items-center gap-1.5 text-xs text-warning/80">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-label="Risk flag">
                    <path d="M8 1L1 14h14L8 1zm0 4v4m0 2v1" />
                    <path d="M8 5v4" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                    <circle cx="8" cy="11.5" r="0.8" fill="#0D1B2A" />
                  </svg>
                  <span className="text-foreground/50">Potential risk flag</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role dropdown */}
      {onRoleChange && isOnBoard && (
        <div className="mb-2">
          <select
            value={assignedRole ?? 'ned'}
            onChange={(e) => onRoleChange(e.target.value as BoardRole)}
            className="w-full text-xs bg-navy-dark text-foreground border border-card-border rounded px-2 py-1 focus:outline-none focus:border-gold"
          >
            {AVAILABLE_ROLES
              .filter((role) => {
                if (role === 'energyTransitionChair' && activeCommittees && !activeCommittees.energyTransition) return false;
                if (role === 'safetyEnvChair' && activeCommittees && activeCommittees.safetyEnvironment === false) return false;
                return true;
              })
              .map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {onAdd && !isOnBoard && (
          <button
            onClick={onAdd}
            className="flex-1 text-xs font-medium py-1.5 px-3 rounded bg-gold/20 text-gold border border-gold/40 hover:bg-gold/30 transition-colors cursor-pointer"
          >
            + Add
          </button>
        )}
        {onRemove && isOnBoard && (
          <button
            onClick={onRemove}
            className="flex-1 text-xs font-medium py-1.5 px-3 rounded bg-error/20 text-error border border-error/40 hover:bg-error/30 transition-colors cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>
    </motion.div>
  );
}
