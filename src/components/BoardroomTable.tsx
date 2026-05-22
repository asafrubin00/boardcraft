'use client';

import { useState } from 'react';
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


// ── Square perimeter layout for large boards (9–12 seats) ──
//
// SVG viewBox is 400×400. Square table rect: x=100, y=100, w=200, h=200.
// 3 seats per side — 12 slots total, use N of them (N=9→10 base + 0–2 committees).
//   Slot  0–2 : top row    (topPct=9,  leftPct=28/50/72)
//   Slot  3–5 : right col  (leftPct=90, topPct=27/50/73)
//   Slot  6–8 : bottom row (topPct=91, leftPct=28/50/72) — labelAbove for bottom
//   Slot 9–11 : left col   (leftPct=10, topPct=27/50/73)
//
// Gap between portrait edge and table edge: ≥30px on all sides.
// Gap between adjacent portrait edges: ≥10px on rows/cols.

export function computeGridPositions(N: number): TablePosition[] {
  const top: TablePosition[] = [
    { defaultRole: 'chair',      label: 'Chair',      leftPct: 28, topPct:  9, isChair: true,  labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 50, topPct:  9, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 72, topPct:  9, isChair: false, labelAbove: false },
  ];
  const right: TablePosition[] = [
    { defaultRole: 'auditChair', label: 'Audit Chair', leftPct: 90, topPct: 27, isChair: false, labelAbove: false },
    { defaultRole: 'remChair',   label: 'Rem Chair',   leftPct: 90, topPct: 50, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',   leftPct: 90, topPct: 73, isChair: false, labelAbove: false },
  ];
  const bottom: TablePosition[] = [
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 28, topPct: 91, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 50, topPct: 91, isChair: false, labelAbove: true },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 72, topPct: 91, isChair: false, labelAbove: true },
  ];
  const left: TablePosition[] = [
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 10, topPct: 27, isChair: false, labelAbove: false },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 10, topPct: 50, isChair: false, labelAbove: false },
    { defaultRole: 'ned', label: 'Worker Rep', leftPct: 10, topPct: 73, isChair: false, labelAbove: false },
  ];

  const all = [...top, ...right, ...bottom, ...left];
  return all.slice(0, N);
  // Slot assignment by N:
  //  N= 9: 3 top + 3 right + 3 bottom + 0 left = 9
  //  N=10: 3 top + 3 right + 3 bottom + 1 left = 10
  //  N=11: 3 top + 3 right + 3 bottom + 2 left = 11
  //  N=12: 3 top + 3 right + 3 bottom + 3 left = 12
}

// Standard company grid: same visual as computeGridPositions but slot 1 = SID and
// slot 6 = NomChair, so drag-and-drop assigns the correct role on those seats.
export function computeStandardGridPositions(N: number): TablePosition[] {
  return computeGridPositions(N).map((pos, i) => {
    if (i === 1) return { ...pos, defaultRole: 'sid' as BoardRole, label: 'SID' };
    if (i === 6) return { ...pos, defaultRole: 'nomChair' as BoardRole, label: 'Nom Chair' };
    return pos;
  });
}

// ── Derivation: map seats → table positions ──

export function deriveTablePositions(
  seats: BoardSeat[],
  hasEnergyTransition = false,
  hasCsrd = false,
  hasStrategy = false,
  forceGridLayout = false,
): (string | null)[] {
  // Committee chairs live in opt-slots only — exclude from baseSeatCount so they
  // don't inflate the perimeter grid and create spurious empty seats.
  const committeeChairRoles = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair']);
  const baseSeatCount = seats.filter(s => !committeeChairRoles.has(s.role)).length;
  const optSlots = (hasEnergyTransition ? 1 : 0) + (hasCsrd ? 1 : 0) + (hasStrategy ? 1 : 0);

  // All companies use square-perimeter grid layout.
  // Rheinfeld (forceGridLayout): min 10 slots so AuditChair (3) + RemChair (4) stay visible.
  // Standard companies: min 9 slots (fills top+right+bottom rows).
  const effectiveGridSize = forceGridLayout
    ? Math.max(baseSeatCount, 10)
    : Math.max(baseSeatCount, 9);
  const totalSlots = effectiveGridSize + optSlots;
  const positions: (string | null)[] = Array(totalSlots).fill(null);
  const placed = new Set<string>();

  // Named role → grid slot.
  // Rheinfeld: Chair=top-left(0), AuditChair=right-top(3), RemChair=right-mid(4).
  // Standard:  Chair(0), SID(1), AuditChair(3), RemChair(4), NomChair(6).
  const gridRoleToSlot: Partial<Record<BoardRole, number>> = forceGridLayout
    ? { chair: 0, auditChair: 3, remChair: 4 }
    : { chair: 0, sid: 1, auditChair: 3, remChair: 4, nomChair: 6 };

  for (const seat of seats) {
    const slotIdx = gridRoleToSlot[seat.role];
    if (slotIdx !== undefined && slotIdx < effectiveGridSize && positions[slotIdx] === null && !placed.has(seat.directorId)) {
      positions[slotIdx] = seat.directorId;
      placed.add(seat.directorId);
    }
  }

  // Skip named slots during fill so they stay vacant until the correct role is assigned.
  const namedSlots = new Set(
    Object.values(gridRoleToSlot).filter((v): v is number => v < effectiveGridSize)
  );

  let nextFill = 0;
  for (const seat of seats) {
    if (!placed.has(seat.directorId) && !committeeChairRoles.has(seat.role)) {
      while (nextFill < effectiveGridSize && (positions[nextFill] !== null || namedSlots.has(nextFill))) nextFill++;
      if (nextFill < effectiveGridSize) {
        positions[nextFill] = seat.directorId;
        placed.add(seat.directorId);
        nextFill++;
      }
    }
  }

  // Optional committee chair slots appended after the base grid.
  let optSlotIdx = effectiveGridSize;
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

export function getOverflowDirectorIds(
  seats: BoardSeat[],
  positions: (string | null)[]
): string[] {
  const posSet = new Set(positions.filter(Boolean));
  return seats.filter((s) => !posSet.has(s.directorId)).map((s) => s.directorId);
}

// ── Short role label for display under seat ──

function shortRoleLabel(
  role: BoardRole,
  jurisdiction: Jurisdiction = 'UK',
  directorId?: string | null,
  workerRepSet?: Set<string>,
  companyId?: string,
): string {
  // Worker representative override (EU two-tier boards, Rheinfeld)
  if (directorId && workerRepSet && workerRepSet.has(directorId)) {
    return 'Worker Rep';
  }

  // EU-specific Supervisory Board terminology
  if (jurisdiction === 'EU') {
    if (role === 'chair') return 'SB Chair';
    if (role === 'ned' || role === 'sid') return 'SB Member';
  }

  const full = getRoleLabel(role, jurisdiction, companyId);
  return full
    .replace(' Committee Chair', ' Chair')
    .replace('Consumer Affairs & Regulatory', 'CA&R')
    .replace(/^Board /, '')
    .replace('Non-Executive Director', 'NED')
    .replace('Senior Independent Director', 'SID')
    .replace('Lead Independent Director', 'LID')
    .replace('Chair of Trustees', 'Chair');
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
  /** Company short name for table watermark (e.g. "HARWICK") */
  companyShortName?: string;
  /** Second line for table watermark (e.g. "ENERGY PLC") */
  companyShortNameSuffix?: string;
  /** Jurisdiction for role labels (UK: SID, US: LID) */
  jurisdiction?: Jurisdiction;
  /** Whether the Chair seat is locked as Combined Chair/CEO (Vantage) */
  combinedChairCeo?: boolean;
  /** Director IDs that are worker representatives - steel blue ring, non-interactive */
  workerRepIds?: string[];
  /** Director IDs of locked seats (e.g. fixed chair) - gold ring, portrait shown, non-interactive */
  lockedDirectorIds?: string[];
  /** Director IDs with a conflict-of-interest indicator (red badge overlay) */
  conflictDirectorIds?: string[];
  /** Company ID — used for company-specific role label overrides (e.g. Meridian charity labels) */
  companyId?: string;
}

// Optional committee chair positions — all in the left column (leftPct=10).
// Mirrors the Rheinfeld layout; for N=9 companies the left column is otherwise empty.
const GRID_ETC_POSITION: TablePosition = {
  defaultRole: 'energyTransitionChair',
  label: 'ETC Chair',
  leftPct: 10,
  topPct: 27,
  isChair: false,
  labelAbove: false,
};
const GRID_CSRD_POSITION: TablePosition = {
  defaultRole: 'csrdChair',
  label: 'CSRD Chair',
  leftPct: 10,
  topPct: 50,
  isChair: false,
  labelAbove: false,
};
const GRID_STRATEGY_POSITION: TablePosition = {
  defaultRole: 'strategyChair',
  label: 'Strategy Chair',
  leftPct: 10,
  topPct: 73,
  isChair: false,
  labelAbove: false,
};

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
  companyId,
}: BoardroomTableProps) {
  const workerRepSet = new Set(workerRepIds);
  const lockedSet = new Set(lockedDirectorIds);
  const conflictSet = new Set(conflictDirectorIds);

  // All companies use square-perimeter grid layout.
  // isRheinfeld: uses computeGridPositions (Worker Rep labels, min 10 slots).
  // Standard:    uses computeStandardGridPositions (SID/NomChair slots, min 9 slots).
  const committeeChairRoleSet = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair']);
  const baseSeatCount = seats.filter(s => !committeeChairRoleSet.has(s.role)).length;
  const isRheinfeld = workerRepIds.length >= 5;
  const effectiveGridSize = isRheinfeld
    ? Math.max(baseSeatCount, 10)
    : Math.max(baseSeatCount, 9);

  const basePositions: TablePosition[] = isRheinfeld
    ? computeGridPositions(effectiveGridSize)
    : computeStandardGridPositions(effectiveGridSize);

  const effectivePositions: TablePosition[] = [
    ...basePositions,
    ...(hasEnergyTransition ? [GRID_ETC_POSITION] : []),
    ...(hasCsrd ? [GRID_CSRD_POSITION] : []),
    ...(hasStrategy ? [GRID_STRATEGY_POSITION] : []),
  ];

  const positions = deriveTablePositions(seats, hasEnergyTransition, hasCsrd, hasStrategy, isRheinfeld);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const getDirector = (id: string) => directors.find((d) => d.id === id);
  const getSeat = (directorId: string) => seats.find((s) => s.directorId === directorId);

  // All layouts: square 1:1 canvas, 400×400 viewBox, 200×200 centred table
  const tableRect = { x: 100, y: 100, w: 200, h: 200, rx: 30 };
  const svgViewBox = '0 0 400 400';
  const containerAspectRatio = '1/1';
  // Text centred on the table
  const textCx = tableRect.x + tableRect.w / 2;
  const textCy1 = tableRect.y + tableRect.h / 2 - 7;
  const textCy2 = tableRect.y + tableRect.h / 2 + 9;

  return (
    <div className="relative w-full" style={{ aspectRatio: containerAspectRatio }}>
      {/* SVG Table Background */}
      <svg
        viewBox={svgViewBox}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Wood-grain texture */}
          <pattern
            id="woodGrain"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(30)"
          >
            <line x1="0" y1="4" x2="8" y2="4" stroke="#2A5580" strokeWidth="0.3" opacity="0.2" />
          </pattern>
          {/* Radial gradient - lighter centre */}
          <radialGradient id="tableGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A3A5C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer table surface - rounded rectangle */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="#0D1B2A" stroke="#C8960C" strokeWidth="2" />
        {/* Wood-grain overlay */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="url(#woodGrain)" />
        {/* Gradient overlay */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="url(#tableGrad)" />
        {/* Inner edge highlight */}
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

        {/* Company name in centre */}
        <text
          x={textCx}
          y={textCy1}
          textAnchor="middle"
          fill="#C8960C"
          fontSize="10"
          fontFamily="Georgia, serif"
          fontWeight="bold"
          opacity="0.45"
        >
          {companyShortName}
        </text>
        <text
          x={textCx}
          y={textCy2}
          textAnchor="middle"
          fill="#C8960C"
          fontSize="7"
          fontFamily="Georgia, serif"
          opacity="0.3"
        >
          {companyShortNameSuffix}
        </text>
      </svg>

      {/* Seat circles - positioned over SVG */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const isActive = activeSeatIndex === index;
        const seatPx = 52;
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
            {/* Conflict-of-interest indicator badge */}
            {hasConflict && (
              <div
                className="absolute top-0 right-0 w-4 h-4 rounded-full bg-error flex items-center justify-center"
                style={{ fontSize: '9px', color: 'white', fontWeight: 'bold', zIndex: 10 }}
                title="Conflict of interest - Heinrich's side-deal revealed"
              >
                !
              </div>
            )}
          </div>
        );
      })}

      {/* Labels - absolutely-positioned HTML elements outside the seat circles */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const seat = directorId ? getSeat(directorId) : null;
        const seatPx = 52;
        const isLockedChairCeo = combinedChairCeo && pos.isChair;

        const actualLabel = isLockedChairCeo
          ? 'Chair/CEO'
          : seat && seat.role !== pos.defaultRole
            ? shortRoleLabel(seat.role, jurisdiction, directorId, workerRepSet, companyId)
            : shortRoleLabel(pos.defaultRole, jurisdiction, directorId, workerRepSet, companyId);

        // All layouts use pos.labelAbove to determine placement (above or below portrait).
        const isLabelAbove = pos.labelAbove ?? false;
        const labelOffset = isLabelAbove
          ? -(seatPx / 2 + 28) // above portrait
          : (seatPx / 2 + 4);  // below portrait

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
                {shortRoleLabel(pos.defaultRole, jurisdiction, null, undefined, companyId)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
