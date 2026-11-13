'use client';

import type { ReactNode } from 'react';
import type { CompetencyDomain, Director } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_SHORT } from '@/engine/boardConstants';
import DirectorPortrait from '../DirectorPortrait';
import './boardbuild.css';

const INDEPENDENCE_STAMP: Record<Director['independence'], { label: string; cls: string }> = {
  independent: { label: 'Independent', cls: 'bc-stamp-green' },
  questionable: { label: 'Independence questionable', cls: 'bc-stamp-amber' },
  'non-independent': { label: 'Non-independent', cls: 'bc-stamp-grey' },
};

const TIER_LABEL: Record<Director['availabilityTier'], string> = {
  A: 'Tier A',
  B: 'Tier B',
  C: 'Search firm',
};

interface CvSheetProps {
  director: Director;
  /** e.g. "Harwick Energy PLC" */
  companyName: string;
  /** "Director" | "Trustee" */
  noun: string;
  feeLabel: string | null;
  /** Shown when the director is already seated (role + fee incl. premium). */
  seatedLine?: string | null;
  /** Domain the pool is currently filtered on — highlighted on the sheet. */
  highlightDomain?: CompetencyDomain | null;
  /** "7 of 18" style position in the stack; omitted for seated directors. */
  position?: { index: number; total: number } | null;
  onPrev?: () => void;
  onNext?: () => void;
  onPhotoDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onPhotoDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  children?: ReactNode;
}

/**
 * A director's CV as a sheet of paper on the desk. Purely presentational —
 * every figure on it comes straight from the Director record.
 */
export default function CvSheet({
  director: dir,
  companyName,
  noun,
  feeLabel,
  seatedLine,
  highlightDomain,
  position,
  onPrev,
  onNext,
  onPhotoDragStart,
  onPhotoDragEnd,
  children,
}: CvSheetProps) {
  const stamp = INDEPENDENCE_STAMP[dir.independence];
  const jurisdictions = Object.entries(dir.jurisdictionScores);
  const boardYears = dir.tenureYears ?? (dir.inherited ? dir.tenure : 0);

  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      {/* The rest of the stack, peeking out underneath */}
      {position && position.total - position.index > 2 && (
        <div className="bc-paper-under absolute inset-0 rounded-[3px]" style={{ transform: 'rotate(2.4deg) translate(7px, 6px)' }} />
      )}
      {position && position.total - position.index > 1 && (
        <div className="bc-paper-under absolute inset-0 rounded-[3px]" style={{ transform: 'rotate(-1.3deg) translate(-4px, 3px)' }} />
      )}

      <article className="bc-paper relative rounded-[3px] px-6 pt-5 pb-4">
        {/* Letterhead */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: 'var(--ink-soft)' }}>
              {seatedLine ? `${noun} file` : 'Candidate file'}{position ? ` · ${String(position.index + 1).padStart(2, '0')} of ${position.total}` : ''}
            </p>
            <p className="text-[9px] uppercase tracking-[0.14em] mt-0.5 truncate" style={{ color: 'var(--ink-soft)' }}>
              {companyName} · Confidential
            </p>
            <h2 className="bc-serif text-[26px] leading-[1.1] font-bold mt-3">{dir.name}</h2>
            <p className="bc-serif italic text-[12px] mt-1" style={{ color: 'var(--ink-soft)' }}>
              {seatedLine ?? `${noun} candidate`}
              {feeLabel ? <> · <span className="not-italic font-semibold" style={{ color: 'var(--ink)' }}>{feeLabel}</span></> : null}
            </p>
          </div>

          {/* Clipped photograph — this is the drag handle onto a seat */}
          <div className="relative shrink-0" style={{ transform: 'rotate(2deg)' }}>
            <div
              className="rounded-[2px] bg-white p-1 pb-1.5 cursor-grab active:cursor-grabbing"
              style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.3)' }}
              draggable={Boolean(onPhotoDragStart)}
              onDragStart={onPhotoDragStart}
              onDragEnd={onPhotoDragEnd}
              title={onPhotoDragStart ? 'Drag onto a seat at the table' : undefined}
            >
              <div className="overflow-hidden bg-[#0d1b2a]" style={{ width: 76, height: 76 }}>
                <DirectorPortrait directorId={dir.id} size={76} />
              </div>
            </div>
            <span className="bc-clip" style={{ top: -14, left: 10, transform: 'rotate(-8deg)' }} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={`bc-stamp ${stamp.cls}`}>{stamp.label}</span>
          <span className="bc-stamp bc-stamp-navy">{TIER_LABEL[dir.availabilityTier]}</span>
          {dir.inherited && <span className="bc-stamp bc-stamp-amber" style={{ transform: 'rotate(-1deg)' }}>Inherited</span>}
        </div>

        <hr className="my-3 border-0 h-px" style={{ background: 'var(--rule)' }} />

        {/* Competency profile */}
        <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: 'var(--ink-soft)' }}>Competency profile</h3>
        <div className="space-y-[5px]">
          {ALL_DOMAINS.map((domain) => {
            const score = dir.domainRatings[domain];
            const hot = highlightDomain === domain;
            return (
              <div key={domain} className="flex items-center gap-2 text-[11px]">
                <span className={`w-[74px] truncate ${hot ? 'font-bold' : ''}`}>{DOMAIN_SHORT[domain]}</span>
                <div className="flex-1 h-[7px] rounded-[1px]" style={{ background: 'rgba(27,36,48,0.10)' }}>
                  <div
                    className="h-full rounded-[1px]"
                    style={{ width: `${score}%`, background: score >= 75 ? '#1a3a5c' : score >= 60 ? '#3f6288' : '#93a3b5' }}
                  />
                </div>
                <span className={`w-6 text-right tabular-nums ${score >= 60 ? 'font-bold' : ''}`} style={{ color: score >= 60 ? 'var(--ink)' : 'var(--ink-soft)' }}>{score}</span>
              </div>
            );
          })}
        </div>

        <hr className="my-3 border-0 h-px" style={{ background: 'var(--rule)' }} />

        <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--ink-soft)' }}>Background</h3>
        <p className="bc-serif text-[12.5px] leading-[1.55]">{dir.background}</p>

        {dir.suitableRoles && (
          <>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] mt-3 mb-1" style={{ color: 'var(--ink-soft)' }}>Suitable roles</h3>
            <p className="bc-serif italic text-[12px] leading-[1.5]" style={{ color: 'var(--ink-soft)' }}>{dir.suitableRoles}</p>
          </>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[10.5px]" style={{ color: 'var(--ink-soft)' }}>
          {jurisdictions.length > 0 && (
            <span>
              Jurisdiction:{' '}
              {jurisdictions.map(([j, s]) => (
                <span key={j} className="font-semibold mr-1.5" style={{ color: 'var(--ink)' }}>{j} {s}</span>
              ))}
            </span>
          )}
          {boardYears > 0 && (
            <span>On this board: <span className="font-semibold" style={{ color: 'var(--ink)' }}>{boardYears} yrs</span></span>
          )}
        </div>

        {dir.riskFlag && !dir.riskFlag.activated && (
          <div className="mt-3">
            <span className="bc-stamp bc-stamp-red" style={{ transform: 'rotate(-2deg)' }}>Potential risk flag</span>
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}

        {/* Leaf through the stack */}
        {position && (
          <div className="flex items-center justify-between mt-4 pt-3 text-[11px]" style={{ borderTop: '1px solid var(--rule)' }}>
            <button onClick={onPrev} className="font-semibold hover:underline cursor-pointer" style={{ color: 'var(--ink)' }} aria-label="Previous CV">
              ‹ Previous
            </button>
            <span className="text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--ink-soft)' }}>← → to leaf through</span>
            <button onClick={onNext} className="font-semibold hover:underline cursor-pointer" style={{ color: 'var(--ink)' }} aria-label="Next CV">
              Next ›
            </button>
          </div>
        )}
      </article>
    </div>
  );
}
