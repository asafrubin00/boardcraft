'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BoardSeat, Director, BoardRole } from '@/types/game';
import { ROLE_LABELS, getRoleLabel } from '@/engine/boardConstants';
import type { Jurisdiction } from '@/types/game';
import DirectorPortrait from './DirectorPortrait';

// ── Table position definitions ──

export interface TablePosition {
  defaultRole: BoardRole;
  label: string;
  leftPct: number;
  topPct: number;
  isChair: boolean;
  /** If true, label renders above the portrait; if false (default), below */
  labelAbove?: boolean;
}

// Rounded-rectangle layout: Chair top, 3 per long side, RemChair bottom
export const TABLE_POSITIONS: TablePosition[] = [
  { defaultRole: 'chair', label: 'Chair', leftPct: 50, topPct: 20.6, isChair: true },
  { defaultRole: 'sid', label: 'SID', leftPct: 80.6, topPct: 28.75, isChair: false },
  { defaultRole: 'auditChair', label: 'Audit Chair', leftPct: 80.6, topPct: 50, isChair: false },
  { defaultRole: 'ned', label: 'NED', leftPct: 80.6, topPct: 71.25, isChair: false },
  { defaultRole: 'remChair', label: 'Rem Chair', leftPct: 50, topPct: 79.4, isChair: false },
  { defaultRole: 'ned', label: 'NED', leftPct: 19.4, topPct: 71.25, isChair: false },
  { defaultRole: 'nomChair', label: 'Nom Chair', leftPct: 19.4, topPct: 50, isChair: false },
  { defaultRole: 'ned', label: 'NED', leftPct: 19.4, topPct: 28.75, isChair: false },
];

// ── Grid position layout for large boards (used by deriveTablePositions slot ordering) ──
// Coordinates unused in the new card layout but kept for deriveTablePositions compatibility.
function computeGridPositions(N: number): TablePosition[] {
  const top: TablePosition[] = [
    { defaultRole: 'chair',      label: 'Chair',      leftPct: 50.0,  topPct:  5.3, isChair: true,  labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 30.0,  topPct:  5.3, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 70.0,  topPct:  5.3, isChair: false, labelAbove: false },
  ];
  const right: TablePosition[] = [
    { defaultRole: 'auditChair', label: 'Audit Chair', leftPct: 85.0, topPct: 38.3, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',   leftPct: 85.0, topPct: 65.0, isChair: false, labelAbove: false },
  ];
  const bottom3: TablePosition[] = [
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 29.75, topPct: 91.3, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 50.0,  topPct: 91.3, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 70.25, topPct: 91.3, isChair: false, labelAbove: true },
  ];
  const bottom4: TablePosition[] = [
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 23.0, topPct: 91.3, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 41.0, topPct: 91.3, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 59.0, topPct: 91.3, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 77.0, topPct: 91.3, isChair: false, labelAbove: true },
  ];
  const leftCol: TablePosition[] = [
    { defaultRole: 'ned', label: 'SB Member', leftPct: 15.0, topPct: 51.7, isChair: false, labelAbove: false },
    { defaultRole: 'ned', label: 'SB Member', leftPct: 15.0, topPct: 32.3, isChair: false, labelAbove: false },
    { defaultRole: 'ned', label: 'SB Member', leftPct: 15.0, topPct: 71.0, isChair: false, labelAbove: false },
  ];

  const bottomRow = N <= 9 ? bottom3 : bottom4;
  const all = [...top, ...right, ...bottomRow, ...leftCol];
  return all.slice(0, N);
}

// ── Derivation: map seats → table positions ──

export function deriveTablePositions(
  seats: BoardSeat[],
  hasEnergyTransition = false,
  hasCsrd = false,
  hasStrategy = false,
): (string | null)[] {
  const seatCount = seats.length;
  const optSlots = (hasEnergyTransition ? 1 : 0) + (hasCsrd ? 1 : 0) + (hasStrategy ? 1 : 0);

  if (seatCount >= 9) {
    const totalSlots = seatCount + optSlots;
    const positions: (string | null)[] = Array(totalSlots).fill(null);
    const placed = new Set<string>();

    const gridRoleToSlot: Partial<Record<BoardRole, number>> = {
      chair: 0,
      auditChair: 3,
      sid: 1,
      remChair: 2,
      nomChair: 9,
    };
    for (const seat of seats) {
      const slotIdx = gridRoleToSlot[seat.role];
      if (slotIdx !== undefined && slotIdx < seatCount && positions[slotIdx] === null && !placed.has(seat.directorId)) {
        positions[slotIdx] = seat.directorId;
        placed.add(seat.directorId);
      }
    }

    let nextFill = 0;
    for (const seat of seats) {
      if (!placed.has(seat.directorId)) {
        while (nextFill < seatCount && positions[nextFill] !== null) nextFill++;
        if (nextFill < seatCount) {
          positions[nextFill] = seat.directorId;
          placed.add(seat.directorId);
          nextFill++;
        }
      }
    }

    let optSlotIdx = seatCount;
    const roleToOptSlot: Record<string, number> = {};
    if (hasEnergyTransition) roleToOptSlot['energyTransitionChair'] = optSlotIdx++;
    if (hasCsrd) roleToOptSlot['csrdChair'] = optSlotIdx++;
    if (hasStrategy) roleToOptSlot['strategyChair'] = optSlotIdx++;

    for (const seat of seats) {
      const idx = roleToOptSlot[seat.role];
      if (idx !== undefined && !placed.has(seat.directorId)) {
        positions[idx] = seat.directorId;
        placed.add(seat.directorId);
      }
    }

    return positions;
  }

  // ── Standard 8-seat layout ──
  const totalSlots = 8 + optSlots;
  const positions: (string | null)[] = Array(totalSlots).fill(null);
  const placed = new Set<string>();

  const roleToPosition: Record<string, number> = {
    chair: 0, sid: 1, auditChair: 2, remChair: 4, nomChair: 6,
  };
  let nextOptSlot = 8;
  if (hasEnergyTransition) roleToPosition['energyTransitionChair'] = nextOptSlot++;
  if (hasCsrd) roleToPosition['csrdChair'] = nextOptSlot++;
  if (hasStrategy) roleToPosition['strategyChair'] = nextOptSlot++;

  for (const seat of seats) {
    const posIdx = roleToPosition[seat.role];
    if (posIdx !== undefined && !placed.has(seat.directorId)) {
      positions[posIdx] = seat.directorId;
      placed.add(seat.directorId);
    }
  }

  const nedSlots = [3, 5, 7];
  let slotIdx = 0;
  for (const seat of seats) {
    if (!placed.has(seat.directorId) && slotIdx < nedSlots.length) {
      positions[nedSlots[slotIdx]] = seat.directorId;
      placed.add(seat.directorId);
      slotIdx++;
    }
  }

  return positions;
}

export function getOverflowDirectorIds(
  seats: BoardSeat[],
  positions: (string | null)[]
): string[] {
  const posSet = new Set(positions.filter(Boolean));
  return seats.filter((s) => !posSet.has(s.directorId)).map((s) => s.directorId);
}

// ── Short role label ──

function shortRoleLabel(
  role: BoardRole,
  jurisdiction: Jurisdiction = 'UK',
  directorId?: string | null,
  workerRepSet?: Set<string>,
): string {
  if (directorId && workerRepSet && workerRepSet.has(directorId)) {
    return 'Worker Rep';
  }
  if (jurisdiction === 'EU') {
    if (role === 'chair') return 'SB Chair';
    if (role === 'ned' || role === 'sid') return 'SB Member';
  }
  const full = getRoleLabel(role, jurisdiction);
  return full
    .replace(' Committee Chair', ' Chair')
    .replace('Consumer Affairs & Regulatory', 'CA&R')
    .replace(/^Board /, '')
    .replace('Non-Executive Director', 'NED')
    .replace('Senior Independent Director', 'SID')
    .replace('Lead Independent Director', 'LID');
}

// ── Component ──

interface BoardroomTableProps {
  seats: BoardSeat[];
  directors: Director[];
  activeSeatIndex: number | null;
  onSeatClick: (index: number) => void;
  hasEnergyTransition?: boolean;
  hasCsrd?: boolean;
  hasStrategy?: boolean;
  onDropOnSeat?: (directorId: string, seatIndex: number) => void;
  companyShortName?: string;
  companyShortNameSuffix?: string;
  jurisdiction?: Jurisdiction;
  combinedChairCeo?: boolean;
  workerRepIds?: string[];
  lockedDirectorIds?: string[];
  conflictDirectorIds?: string[];
}

const ETC_POSITION: TablePosition = {
  defaultRole: 'energyTransitionChair',
  label: 'ETC Chair',
  leftPct: 32.4,
  topPct: 79.4,
  isChair: false,
};
const CSRD_POSITION: TablePosition = {
  defaultRole: 'csrdChair',
  label: 'CSRD Chair',
  leftPct: 67.6,
  topPct: 79.4,
  isChair: false,
};
const STRATEGY_POSITION: TablePosition = {
  defaultRole: 'strategyChair',
  label: 'Strategy Chair',
  leftPct: 50,
  topPct: 94,
  isChair: false,
};
const GRID_CSRD_POSITION: TablePosition = {
  defaultRole: 'csrdChair',
  label: 'CSRD Chair',
  leftPct: 38.0,
  topPct: 97.0,
  isChair: false,
  labelAbove: true,
};
const GRID_STRATEGY_POSITION: TablePosition = {
  defaultRole: 'strategyChair',
  label: 'Strategy Chair',
  leftPct: 62.0,
  topPct: 97.0,
  isChair: false,
  labelAbove: true,
};

const COMMITTEE_ROLES = new Set<BoardRole>(['energyTransitionChair', 'csrdChair', 'strategyChair']);

export default function BoardroomTable({
  seats,
  directors,
  activeSeatIndex,
  onSeatClick,
  hasEnergyTransition = false,
  hasCsrd = false,
  hasStrategy = false,
  onDropOnSeat,
  companyShortName = 'HARWICK',
  companyShortNameSuffix = 'ENERGY PLC',
  jurisdiction = 'UK',
  combinedChairCeo = false,
  workerRepIds = [],
  lockedDirectorIds = [],
  conflictDirectorIds = [],
}: BoardroomTableProps) {
  const workerRepSet = new Set(workerRepIds);
  const lockedSet = new Set(lockedDirectorIds);
  const conflictSet = new Set(conflictDirectorIds);

  const seatCount = seats.length;
  const useTwoColumnLayout = seatCount >= 9 && workerRepIds.length >= 5;

  const getDirector = (id: string) => directors.find((d) => d.id === id);
  const getSeat = (directorId: string) => seats.find((s) => s.directorId === directorId);

  const positions = deriveTablePositions(seats, hasEnergyTransition, hasCsrd, hasStrategy);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // TWO-COLUMN CARD LAYOUT (Rheinfeld-style, 9+ seats with worker reps)
  // ─────────────────────────────────────────────────────────────────────────
  if (useTwoColumnLayout) {
    // Build effectivePositions list: base seats + optional committee chair slots
    const basePositions = computeGridPositions(seatCount);
    const effectivePositions: TablePosition[] = [
      ...basePositions,
      ...(hasEnergyTransition ? [ETC_POSITION] : []),
      ...(hasCsrd ? [GRID_CSRD_POSITION] : []),
      ...(hasStrategy ? [GRID_STRATEGY_POSITION] : []),
    ];

    // Partition indices into: workerRep | shareholder | committee
    const workerRepIndices: number[] = [];
    const shareholderIndices: number[] = [];
    const committeeIndices: number[] = [];

    effectivePositions.forEach((pos, idx) => {
      if (COMMITTEE_ROLES.has(pos.defaultRole)) {
        committeeIndices.push(idx);
      } else {
        const dirId = positions[idx];
        const isWR = dirId
          ? workerRepSet.has(dirId)
          : pos.label === 'Worker Rep';
        if (isWR) {
          workerRepIndices.push(idx);
        } else {
          shareholderIndices.push(idx);
        }
      }
    });

    // Render a seat card for a given slot index
    const renderCard = (idx: number, colType: 'workerRep' | 'shareholder' | 'committee') => {
      const pos = effectivePositions[idx];
      const dirId = positions[idx] ?? null;
      const director = dirId ? getDirector(dirId) : null;
      const isActive = activeSeatIndex === idx;
      const isWR = colType === 'workerRep';
      const isLockedSeat = dirId ? lockedSet.has(dirId) : false;
      const hasConflict = dirId ? conflictSet.has(dirId) : false;
      const isNonInteractive = isWR || isLockedSeat;

      const seat = dirId ? getSeat(dirId) : null;
      const roleForLabel: BoardRole = (seat?.role) ?? pos.defaultRole;
      const actualLabel = isWR
        ? 'Worker Rep'
        : shortRoleLabel(roleForLabel, jurisdiction, dirId, workerRepSet);

      const ringColor = isWR ? '#5B9BD5' : '#C8960C';
      const borderColor = isActive
        ? '#C8960C'
        : isWR
          ? 'rgba(91,155,213,0.30)'
          : dragOverIdx === idx
            ? '#C8960C'
            : 'rgba(200,150,12,0.15)';
      const bgColor = dirId
        ? (isWR ? 'rgba(91,155,213,0.07)' : 'rgba(200,150,12,0.04)')
        : 'transparent';

      // Portrait truncated first name + surname
      const displayName = director
        ? (director.name.length > 18 ? director.name.split(' ').slice(0, 2).join(' ') : director.name)
        : null;

      return (
        <div
          key={`card-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            height: 56,
            padding: '0 8px',
            background: bgColor,
            border: `1px ${dirId ? 'solid' : 'dashed'} ${borderColor}`,
            borderRadius: 7,
            cursor: isNonInteractive ? 'default' : 'pointer',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s, background 0.15s',
            flexShrink: 0,
          }}
          onClick={() => { if (!isNonInteractive) onSeatClick(idx); }}
          onDragOver={isNonInteractive ? undefined : (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            setDragOverIdx(idx);
          }}
          onDragLeave={() => setDragOverIdx(null)}
          onDrop={isNonInteractive ? undefined : (e) => {
            e.preventDefault();
            setDragOverIdx(null);
            const id = e.dataTransfer.getData('text/plain');
            if (id && onDropOnSeat) onDropOnSeat(id, idx);
          }}
        >
          {/* Portrait circle */}
          <div
            draggable={!!director && !isNonInteractive}
            onDragStart={director && !isNonInteractive ? (e) => {
              e.dataTransfer.setData('text/plain', director.id);
              e.dataTransfer.effectAllowed = 'move';
              (e.currentTarget as HTMLElement).style.opacity = '0.5';
            } : undefined}
            onDragEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: `2px ${dirId ? 'solid' : 'dashed'} ${dirId ? ringColor : 'rgba(232,224,208,0.18)'}`,
              overflow: 'hidden',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(13,27,42,0.60)',
            }}
          >
            {director ? (
              <DirectorPortrait directorId={director.id} size={36} className="rounded-full" />
            ) : (
              <span style={{ color: 'rgba(232,224,208,0.22)', fontSize: 15, lineHeight: 1 }}>+</span>
            )}
          </div>

          {/* Name + role text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: dirId ? '#E8E0D0' : 'rgba(232,224,208,0.35)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.25,
            }}>
              {displayName ?? '—'}
            </div>
            <div style={{
              fontSize: 10,
              color: isWR ? 'rgba(91,155,213,0.75)' : 'rgba(200,150,12,0.60)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
              marginTop: 1,
            }}>
              {actualLabel}
            </div>
          </div>

          {/* Conflict badge */}
          {hasConflict && (
            <div style={{
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: '#ef4444',
              color: 'white',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
              title="Conflict of interest"
            >
              !
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        {/* ── Main row: worker rep col | mini table | shareholder col ── */}
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', minHeight: 0, gap: 0 }}>

          {/* Left column — worker representatives */}
          <div style={{
            width: 196,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            padding: '0 6px 0 2px',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(91,155,213,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 3,
              paddingLeft: 2,
            }}>
              Arbeitnehmervertreter
            </div>
            {workerRepIndices.map(idx => renderCard(idx, 'workerRep'))}
          </div>

          {/* Centre — mini SVG table */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
          }}>
            <svg
              viewBox="0 0 180 140"
              style={{ width: '100%', maxWidth: 170, height: 'auto' }}
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="wg2" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                  <line x1="0" y1="4" x2="8" y2="4" stroke="#2A5580" strokeWidth="0.3" opacity="0.2" />
                </pattern>
                <radialGradient id="tg2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1A3A5C" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x="14" y="10" width="152" height="120" rx="22" fill="#0D1B2A" stroke="#C8960C" strokeWidth="2" />
              <rect x="14" y="10" width="152" height="120" rx="22" fill="url(#wg2)" />
              <rect x="14" y="10" width="152" height="120" rx="22" fill="url(#tg2)" />
              <rect x="19" y="15" width="142" height="110" rx="19" fill="none" stroke="#C8960C" strokeWidth="0.5" opacity="0.25" />
              <text x="90" y="62" textAnchor="middle" fill="#C8960C" fontSize="10" fontFamily="Georgia, serif" fontWeight="bold" opacity="0.5">
                {companyShortName}
              </text>
              <text x="90" y="76" textAnchor="middle" fill="#C8960C" fontSize="7" fontFamily="Georgia, serif" opacity="0.35">
                {companyShortNameSuffix}
              </text>
            </svg>
          </div>

          {/* Right column — shareholder representatives */}
          <div style={{
            width: 196,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            padding: '0 2px 0 6px',
            justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'rgba(200,150,12,0.50)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 3,
              paddingLeft: 2,
            }}>
              Anteilseignervertreter
            </div>
            {shareholderIndices.map(idx => renderCard(idx, 'shareholder'))}
          </div>
        </div>

        {/* ── Bottom row — optional committee chairs ── */}
        <AnimatePresence>
          {committeeIndices.length > 0 && (
            <motion.div
              key="committee-row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 12,
                paddingBottom: 8,
                paddingTop: 4,
                overflow: 'hidden',
              }}
            >
              {committeeIndices.map(idx => renderCard(idx, 'committee'))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STANDARD CIRCULAR LAYOUT (≤8 seats — Harwick, Vantage, unchanged)
  // ─────────────────────────────────────────────────────────────────────────

  const tableRect = { x: 120, y: 55, w: 160, h: 190, rx: 35 };

  const effectivePositions: TablePosition[] = [
    ...TABLE_POSITIONS,
    ...(hasEnergyTransition ? [ETC_POSITION] : []),
    ...(hasCsrd ? [CSRD_POSITION] : []),
    ...(hasStrategy ? [STRATEGY_POSITION] : []),
  ];

  const seatPxNormal = (_idx: number, isChairPos: boolean) => isChairPos ? 68 : 58;

  return (
    <div className="relative w-full h-full" style={{ maxHeight: '100%', aspectRatio: '4/3' }}>
      {/* SVG Table Background */}
      <svg
        viewBox="0 0 400 300"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="woodGrain" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="4" x2="8" y2="4" stroke="#2A5580" strokeWidth="0.3" opacity="0.2" />
          </pattern>
          <radialGradient id="tableGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A3A5C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="#0D1B2A" stroke="#C8960C" strokeWidth="2" />
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="url(#woodGrain)" />
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="url(#tableGrad)" />
        <rect
          x={tableRect.x + 5}
          y={tableRect.y + 5}
          width={tableRect.w - 10}
          height={tableRect.h - 10}
          rx={tableRect.rx - 5}
          fill="none"
          stroke="#C8960C"
          strokeWidth="0.5"
          opacity="0.25"
        />

        <text x="200" y="146" textAnchor="middle" fill="#C8960C" fontSize="10" fontFamily="Georgia, serif" fontWeight="bold" opacity="0.45">
          {companyShortName}
        </text>
        <text x="200" y="160" textAnchor="middle" fill="#C8960C" fontSize="7" fontFamily="Georgia, serif" opacity="0.3">
          {companyShortNameSuffix}
        </text>
      </svg>

      {/* Seat circles */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const isActive = activeSeatIndex === index;
        const seatPx = seatPxNormal(index, pos.isChair);
        const isLockedChairCeo = combinedChairCeo && pos.isChair;
        const isWorkerRep = directorId ? workerRepSet.has(directorId) : false;
        const isLockedSeat = directorId ? lockedSet.has(directorId) : false;
        const hasConflict = directorId ? conflictSet.has(directorId) : false;
        const isNonInteractive = isLockedChairCeo || isWorkerRep || isLockedSeat;

        return (
          <div
            key={`seat-${index}`}
            className={`absolute group ${isNonInteractive ? 'cursor-default' : 'cursor-pointer'}`}
            style={{
              left: `${pos.leftPct}%`,
              top: `${pos.topPct}%`,
              transform: 'translate(-50%, -50%)',
              width: seatPx,
              height: seatPx,
            }}
            onClick={() => { if (!isNonInteractive) onSeatClick(index); }}
            onDragOver={(e) => {
              if (isNonInteractive) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOverIdx(index);
            }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              if (isNonInteractive) return;
              e.preventDefault();
              setDragOverIdx(null);
              const dirId = e.dataTransfer.getData('text/plain');
              if (dirId && onDropOnSeat) onDropOnSeat(dirId, index);
            }}
          >
            <div
              draggable={!!director && !isNonInteractive}
              onDragStart={(e) => {
                if (!director || isNonInteractive) { e.preventDefault(); return; }
                e.dataTransfer.setData('text/plain', director.id);
                e.dataTransfer.effectAllowed = 'move';
                (e.currentTarget as HTMLElement).style.opacity = '0.5';
              }}
              onDragEnd={(e) => {
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }}
              className={`rounded-full flex items-center justify-center transition-all duration-200 w-full h-full ${
                isLockedChairCeo
                  ? 'border-2 border-error/60 bg-error/5 opacity-70'
                  : isWorkerRep
                    ? 'border-2 opacity-80'
                    : dragOverIdx === index
                      ? 'border-2 border-dashed border-gold ring-2 ring-gold/40 bg-gold/10'
                      : director
                        ? `border-2 border-gold ${
                            isActive
                              ? 'ring-2 ring-gold/60 ring-offset-2 ring-offset-navy'
                              : isLockedSeat
                                ? ''
                                : 'group-hover:ring-1 group-hover:ring-gold/30 group-hover:ring-offset-1 group-hover:ring-offset-navy'
                          }`
                        : `border-2 border-dashed ${
                            isActive
                              ? 'border-gold animate-pulse bg-gold/5'
                              : 'border-foreground/20 bg-navy-dark/40 group-hover:border-foreground/40'
                          }`
              }`}
              style={isWorkerRep ? { borderColor: '#5B9BD5' } : undefined}
            >
              {isLockedChairCeo ? (
                <span className="text-error/50 text-lg select-none font-bold">🔒</span>
              ) : director ? (
                <DirectorPortrait
                  directorId={director.id}
                  size={seatPx - 4}
                  className="rounded-full"
                />
              ) : (
                <span className="text-foreground/20 text-lg select-none">+</span>
              )}
            </div>
            {hasConflict && (
              <div
                className="absolute top-0 right-0 w-4 h-4 rounded-full bg-error flex items-center justify-center"
                style={{ fontSize: '9px', color: 'white', fontWeight: 'bold', zIndex: 10 }}
                title="Conflict of interest"
              >
                !
              </div>
            )}
          </div>
        );
      })}

      {/* Labels */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const seat = directorId ? getSeat(directorId) : null;
        const seatPx = seatPxNormal(index, pos.isChair);
        const isLockedChairCeo = combinedChairCeo && pos.isChair;

        const actualLabel = isLockedChairCeo
          ? 'Chair/CEO'
          : seat && seat.role !== pos.defaultRole
            ? shortRoleLabel(seat.role, jurisdiction, directorId, workerRepSet)
            : shortRoleLabel(pos.defaultRole, jurisdiction, directorId, workerRepSet);

        const isLabelAbove = index === 0;
        const labelOffset = isLabelAbove
          ? -(seatPx / 2 + 28)
          : (seatPx / 2 + 4);

        return (
          <div
            key={`label-${index}`}
            className="absolute pointer-events-none"
            style={{
              left: `${pos.leftPct}%`,
              top: `${pos.topPct}%`,
              transform: `translate(-50%, ${labelOffset}px)`,
              maxWidth: 80,
              textAlign: 'center',
            }}
          >
            {director ? (
              <>
                <div
                  className="font-semibold text-foreground leading-tight"
                  style={{ fontSize: '11px', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  title={director.name}
                >
                  {director.name}
                </div>
                <div
                  className="text-foreground/50 leading-tight"
                  style={{ fontSize: '11px', maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                  title={actualLabel}
                >
                  {actualLabel}
                </div>
              </>
            ) : (
              <div
                className="text-foreground/50 leading-tight"
                style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 80 }}
              >
                {shortRoleLabel(pos.defaultRole, jurisdiction)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
