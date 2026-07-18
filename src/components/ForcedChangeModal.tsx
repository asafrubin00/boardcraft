'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ForcedDirectorChange, Director, BoardRole, BoardSeat } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_SHORT } from '@/engine/boardConstants';
import DirectorPortrait from './DirectorPortrait';
import { computeFeeWithPremium } from '@/engine/compliance';
import SiteFooter from './SiteFooter';

interface ForcedChangeModalProps {
  forcedChange: ForcedDirectorChange;
  directors: Director[];
  boardSeats: BoardSeat[];
  companyDirectorIds: string[];
  budget: number;
  committed: number;
  jurisdiction?: string;
  /** Called only when player has selected a replacement AND confirmed - atomic dismiss+replace */
  onDismissAndReplace: (dismissedDirectorId: string, newDirectorId: string, role: BoardRole) => void;
  onRetain?: () => void;
}

// ── Harvey Ball SVG helper ──
function HarveyBall({ value, size = 18 }: { value: number; size?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  // 0→empty, 20→quarter, 40→half, 60→three-quarter, 80→full
  const fillFraction = pct >= 80 ? 1 : pct >= 60 ? 0.75 : pct >= 40 ? 0.5 : pct >= 20 ? 0.25 : 0;
  const r = size / 2 - 1.5;
  const cx = size / 2;
  const cy = size / 2;

  // Build SVG arc path for the pie slice
  let arcPath = '';
  if (fillFraction > 0 && fillFraction < 1) {
    const angle = fillFraction * 2 * Math.PI;
    // Start from top (−90°)
    const startX = cx + r * Math.cos(-Math.PI / 2);
    const startY = cy + r * Math.sin(-Math.PI / 2);
    const endX = cx + r * Math.cos(-Math.PI / 2 + angle);
    const endY = cy + r * Math.sin(-Math.PI / 2 + angle);
    const largeArc = fillFraction > 0.5 ? 1 : 0;
    arcPath = `M ${cx} ${cy} L ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Background filled circle */}
      <circle cx={cx} cy={cy} r={r} fill={fillFraction === 1 ? '#C8960C' : 'rgba(13,27,42,0.8)'} />
      {/* Pie slice fill */}
      {fillFraction > 0 && fillFraction < 1 && (
        <path d={arcPath} fill="#C8960C" />
      )}
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C8960C" strokeWidth="1.2" />
    </svg>
  );
}

// ── Domain score bar ──
function ScoreBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: highlight ? '#C8960C' : '#9BB4CC', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ fontSize: 10, color: highlight ? '#C8960C' : '#E8E4DC', fontWeight: 600, marginLeft: 4 }}>{value}</span>
      </div>
      <div style={{ height: 3, background: '#0D1B2A', borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, value)}%`,
            background: highlight ? '#C8960C' : '#2A5580',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

const ROLE_OPTIONS: { role: BoardRole; label: string }[] = [
  { role: 'ned', label: 'NED' },
  { role: 'sid', label: 'SID / LID' },
  { role: 'auditChair', label: 'Audit Chair' },
  { role: 'remChair', label: 'Rem/Comp Chair' },
  { role: 'nomChair', label: 'Nom Chair' },
];

export default function ForcedChangeModal({
  forcedChange,
  directors,
  boardSeats,
  companyDirectorIds,
  budget,
  committed,
  jurisdiction = 'UK',
  onDismissAndReplace,
  onRetain,
}: ForcedChangeModalProps) {
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<BoardRole>('ned');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoverCandidateId, setHoverCandidateId] = useState<string | null>(null);

  const boardDirIds = useMemo(() => new Set(boardSeats.map((s) => s.directorId)), [boardSeats]);

  const departingDirector = useMemo(
    () => directors.find((d) => d.id === forcedChange.directorId),
    [directors, forcedChange.directorId]
  );

  // Available directors for replacement (in company pool, not on board)
  const availableDirectors = useMemo(() => {
    const companySet = new Set(companyDirectorIds);
    return directors.filter(
      (d) => companySet.has(d.id) && !boardDirIds.has(d.id) && d.id !== forcedChange.directorId
    );
  }, [directors, boardDirIds, companyDirectorIds, forcedChange.directorId]);

  const remaining = budget - committed;
  const selectedDir = selectedDirId ? directors.find((d) => d.id === selectedDirId) : null;
  const replacementFee = (budget === 0 || !selectedDir) ? 0 : computeFeeWithPremium(selectedDir.annualFee, selectedRole);
  const canAfford = budget === 0 || replacementFee <= remaining;

  // Board average domain scores (from current board members)
  const boardAvg = useMemo(() => {
    const boardMembers = boardSeats
      .map((s) => directors.find((d) => d.id === s.directorId))
      .filter(Boolean) as typeof directors;
    if (boardMembers.length === 0) return {} as Record<string, number>;
    const sums: Record<string, number> = {};
    for (const domain of ALL_DOMAINS) {
      sums[domain] = boardMembers.reduce((acc, d) => acc + (d.domainRatings[domain] ?? 0), 0) / boardMembers.length;
    }
    return sums;
  }, [boardSeats, directors]);

  // If hovering a candidate, show their scores overlaid on board avg
  const hoverDir = hoverCandidateId ? directors.find((d) => d.id === hoverCandidateId) : null;
  const displayedScores: Record<string, number> = hoverDir ? (hoverDir.domainRatings as Record<string, number>) : boardAvg;

  const currencySymbol = jurisdiction === 'US' ? '$' : jurisdiction === 'EU' ? '€' : '£';

  const handleConfirm = () => {
    if (!selectedDirId || !canAfford) return;
    onDismissAndReplace(forcedChange.directorId, selectedDirId, selectedRole);
  };

  const typeLabel =
    forcedChange.type === 'health_crisis'
      ? 'Director Health Crisis'
      : forcedChange.type === 'misconduct'
      ? 'Director Misconduct'
      : forcedChange.type === 'event_resolution'
      ? 'Board Seat Vacated'
      : 'Regulatory Disqualification';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col"
        style={{
          background: '#0D2237',
          border: '2px solid rgba(220,60,60,0.45)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 940,
          maxHeight: '88dvh',
          overflow: 'hidden',
          margin: '0 12px',
        }}
      >
        {/* Header bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid rgba(220,60,60,0.25)',
          background: 'rgba(220,60,60,0.06)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#E05050', fontFamily: 'Georgia, serif', margin: 0 }}>
            {typeLabel}
          </h2>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'rgba(232,228,220,0.55)', fontStyle: 'italic' }}>
            {forcedChange.turnsRemaining} turn{forcedChange.turnsRemaining !== 1 ? 's' : ''} to resolve
          </span>
        </div>

        {/* Narrative */}
        <div style={{
          padding: '10px 20px 0',
          fontSize: 13, color: 'rgba(232,228,220,0.75)', fontStyle: 'italic', lineHeight: 1.55,
          flexShrink: 0,
        }}>
          {forcedChange.narrative}
        </div>

        {/* Body — single column (mobile) / three columns (desktop) */}
        <div
          className="flex flex-col md:flex-row flex-1 min-h-0 overflow-y-auto md:overflow-hidden"
          style={{ padding: '12px 16px 16px', gap: 12 }}
        >
          {/* ── Left: Departing Director (order-1 on both breakpoints) ── */}
          <div
            className="order-1 shrink-0 md:shrink md:w-[28%] md:flex-none md:overflow-y-auto"
            style={{
              background: 'rgba(220,60,60,0.06)',
              border: '1px solid rgba(220,60,60,0.2)',
              borderRadius: 10, padding: '14px 12px',
            }}
          >
            <div style={{ fontSize: 10, color: '#B08A30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>
              Departing Director
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(220,60,60,0.5)', marginBottom: 8 }}>
                <DirectorPortrait directorId={forcedChange.directorId} size={64} />
              </div>
              <div style={{ fontWeight: 700, color: '#E8E4DC', fontSize: 13, textAlign: 'center', marginBottom: 4 }}>
                {forcedChange.directorName}
              </div>
              {departingDirector && (
                <>
                  <div style={{
                    fontSize: 10, background: 'rgba(220,60,60,0.15)',
                    border: '1px solid rgba(220,60,60,0.3)',
                    borderRadius: 4, padding: '2px 8px', color: '#E05050', marginBottom: 10,
                  }}>
                    {departingDirector.independence === 'independent' ? 'Independent' : departingDirector.independence === 'questionable' ? 'Questionable' : 'Non-Indep.'}
                  </div>
                  <div style={{ width: '100%', marginBottom: 10 }}>
                    {ALL_DOMAINS.map((domain) => (
                      <ScoreBar
                        key={domain}
                        label={DOMAIN_SHORT[domain] ?? domain}
                        value={departingDirector.domainRatings[domain] ?? 0}
                      />
                    ))}
                  </div>
                  <div style={{ width: '100%', marginBottom: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 10, color: '#9BB4CC' }}>Energy</span>
                      <span style={{ fontSize: 10, color: '#E8E4DC', fontWeight: 600 }}>
                        {Math.round(departingDirector.currentEnergy)}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: '#0D1B2A', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.round(departingDirector.currentEnergy))}%`,
                        background: departingDirector.currentEnergy > 60 ? '#4CAF82' : departingDirector.currentEnergy > 30 ? '#C8960C' : '#E05050',
                        borderRadius: 2,
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: '#9BB4CC', marginTop: 4 }}>
                    Annual fee: <span style={{ color: '#C8960C', fontWeight: 600 }}>
                      {budget === 0 ? `${currencySymbol}0` : `${currencySymbol}${Math.round(departingDirector.annualFee / 1000)}k`}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Centre: Board State — shown last on mobile (below replacement pool) ── */}
          <div
            className="order-3 shrink-0 md:shrink md:order-2 md:w-[32%] md:flex-none md:overflow-y-auto"
            style={{
              background: 'rgba(26,58,92,0.25)',
              border: '1px solid rgba(200,150,12,0.2)',
              borderRadius: 10, padding: '14px 12px',
            }}
          >
            <div style={{ fontSize: 10, color: '#B08A30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>
              {hoverDir ? `Candidate: ${hoverDir.name}` : 'Your Board'}
            </div>
            {/* Harvey ball rows */}
            <div style={{ marginBottom: 12 }}>
              {ALL_DOMAINS.map((domain) => {
                const score = Math.round((displayedScores as Record<string, number>)[domain] ?? 0);
                return (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: '#9BB4CC', width: 68, flexShrink: 0 }}>
                      {DOMAIN_SHORT[domain] ?? domain}
                    </span>
                    <HarveyBall value={score} size={16} />
                    <div style={{ flex: 1, height: 3, background: '#0D1B2A', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, score)}%`,
                        background: hoverDir ? '#4CAF82' : '#2A5580',
                        borderRadius: 2,
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#E8E4DC', width: 22, textAlign: 'right', fontWeight: 600 }}>{score}</span>
                  </div>
                );
              })}
            </div>

            {/* Board member list */}
            <div style={{ borderTop: '1px solid rgba(200,150,12,0.15)', paddingTop: 8 }}>
              <div style={{ fontSize: 10, color: '#9BB4CC', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Current Board
              </div>
              {boardSeats.map((seat) => {
                const dir = directors.find((d) => d.id === seat.directorId);
                if (!dir) return null;
                const isDeparting = seat.directorId === forcedChange.directorId;
                return (
                  <div key={seat.directorId} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 4, opacity: isDeparting ? 0.4 : 1,
                  }}>
                    <div style={{
                      borderRadius: '50%', overflow: 'hidden',
                      border: `1px solid ${isDeparting ? 'rgba(220,60,60,0.5)' : 'rgba(200,150,12,0.3)'}`,
                      flexShrink: 0,
                    }}>
                      <DirectorPortrait directorId={dir.id} size={22} />
                    </div>
                    <span style={{
                      fontSize: 10, color: isDeparting ? '#E05050' : '#E8E4DC',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {dir.name}
                    </span>
                    {isDeparting && (
                      <span style={{ fontSize: 9, color: '#E05050', marginLeft: 'auto', flexShrink: 0 }}>Departing</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right: Replacement Pool — shown second on mobile ── */}
          <div
            className="order-2 shrink-0 md:shrink md:order-3 flex flex-col md:flex-1 md:min-w-0"
            style={{
              background: 'rgba(13,27,42,0.6)',
              border: '1px solid rgba(200,150,12,0.2)',
              borderRadius: 10, overflow: 'hidden',
            }}
          >
            <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(200,150,12,0.15)', flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: '#B08A30', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>
                Replacement Pool
              </div>
              {/* Role selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#9BB4CC' }}>Appoint as:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BoardRole)}
                  style={{
                    fontSize: 11, background: '#0D1B2A', color: '#E8E4DC',
                    border: '1px solid rgba(200,150,12,0.4)', borderRadius: 4,
                    padding: '3px 6px', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate cards */}
            <div className="overflow-y-auto max-h-[280px] md:max-h-none md:flex-1" style={{ padding: '8px 10px' }}>
              {availableDirectors.length === 0 ? (
                <p style={{ fontSize: 12, color: 'rgba(232,228,220,0.4)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                  No available directors in the pool.
                </p>
              ) : (
                availableDirectors.map((d) => {
                  const fee = computeFeeWithPremium(d.annualFee, selectedRole);
                  const affordable = fee <= remaining;
                  const isSelected = selectedDirId === d.id;
                  const isExpanded = expandedId === d.id;
                  const topDoms = ALL_DOMAINS
                    .map((dom) => ({ dom, val: d.domainRatings[dom] ?? 0 }))
                    .sort((a, b) => b.val - a.val)
                    .slice(0, 2);

                  return (
                    <div
                      key={d.id}
                      onClick={() => affordable && setSelectedDirId(d.id)}
                      onMouseEnter={() => setHoverCandidateId(d.id)}
                      onMouseLeave={() => setHoverCandidateId(null)}
                      style={{
                        background: isSelected
                          ? 'rgba(200,150,12,0.12)'
                          : affordable
                          ? 'rgba(26,58,92,0.3)'
                          : 'rgba(26,58,92,0.1)',
                        border: isSelected
                          ? '1.5px solid #C8960C'
                          : '1px solid rgba(200,150,12,0.15)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        marginBottom: 6,
                        cursor: affordable ? 'pointer' : 'not-allowed',
                        opacity: affordable ? 1 : 0.42,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          borderRadius: '50%', overflow: 'hidden',
                          border: `1.5px solid ${isSelected ? '#C8960C' : 'rgba(200,150,12,0.3)'}`,
                          flexShrink: 0,
                        }}>
                          <DirectorPortrait directorId={d.id} size={36} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#E8E4DC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.name}
                          </div>
                          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                            {topDoms.map(({ dom, val }) => (
                              <span key={dom} style={{ fontSize: 10, color: '#C8960C' }}>
                                {DOMAIN_SHORT[dom] ?? dom} <strong>{val}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 11, color: affordable ? '#C8960C' : '#E05050', fontWeight: 600 }}>
                            {currencySymbol}{Math.round(fee / 1000)}k
                          </div>
                          <div style={{
                            fontSize: 9, marginTop: 2,
                            background: d.independence === 'independent' ? 'rgba(76,175,130,0.15)' : 'rgba(200,150,12,0.1)',
                            border: `1px solid ${d.independence === 'independent' ? 'rgba(76,175,130,0.3)' : 'rgba(200,150,12,0.25)'}`,
                            color: d.independence === 'independent' ? '#4CAF82' : '#C8960C',
                            borderRadius: 3, padding: '1px 5px',
                          }}>
                            {d.independence === 'independent' ? 'Indep.' : d.independence === 'questionable' ? 'Quest.' : 'Non-Ind.'}
                          </div>
                        </div>
                      </div>

                      {/* View Full Profile toggle */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : d.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 10, color: 'rgba(200,150,12,0.7)',
                          padding: '4px 0 0', display: 'block',
                        }}
                      >
                        {isExpanded ? '▲ Hide Profile' : '▼ View Full Profile'}
                      </button>

                      {/* Expanded profile */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ paddingTop: 8 }}>
                              {ALL_DOMAINS.map((domain) => (
                                <ScoreBar
                                  key={domain}
                                  label={DOMAIN_SHORT[domain] ?? domain}
                                  value={d.domainRatings[domain] ?? 0}
                                  highlight={isSelected}
                                />
                              ))}
                              <div style={{ fontSize: 10, color: '#9BB4CC', marginTop: 6, lineHeight: 1.5 }}>
                                {d.background}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom action buttons */}
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(200,150,12,0.15)',
              display: 'flex', flexDirection: 'column', gap: 8,
              flexShrink: 0,
            }}>
              <button
                disabled={!selectedDirId || !canAfford}
                onClick={handleConfirm}
                style={{
                  width: '100%', padding: '10px 0',
                  borderRadius: 8, fontWeight: 700, fontSize: 13,
                  cursor: selectedDirId && canAfford ? 'pointer' : 'not-allowed',
                  border: 'none',
                  background: selectedDirId && canAfford ? '#C8960C' : 'rgba(26,58,92,0.4)',
                  color: selectedDirId && canAfford ? '#0D1B2A' : 'rgba(232,228,220,0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedDirId
                  ? `Confirm Replacement: ${selectedDir?.name}`
                  : 'Select a Director to Continue'}
              </button>

              {/* Retain option (misconduct / event_resolution with canRetain) */}
              {forcedChange.canRetain && onRetain && (
                <button
                  onClick={onRetain}
                  style={{
                    width: '100%', padding: '8px 0',
                    borderRadius: 8, fontWeight: 600, fontSize: 12,
                    cursor: 'pointer',
                    background: 'transparent',
                    border: '1px solid rgba(220,60,60,0.4)',
                    color: '#E05050',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {forcedChange.type === 'event_resolution'
                    ? 'She accepts — retain her on the board'
                    : 'Keep Vacancy (GH −8, proxy flags)'}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Desktop only: on phones every pixel of this modal is needed for the
            replacement flow, and the footer already shows on the screens below */}
        <div className="hidden md:block" style={{ textAlign: 'center', paddingBottom: 10, paddingTop: 4 }}>
          <SiteFooter />
        </div>
      </motion.div>
    </div>
  );
}
