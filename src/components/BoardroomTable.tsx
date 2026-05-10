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

// Rounded-rectangle layout: Chair top, 3 per long side, RemChair bottom
// Seat positions scaled 0.85× inward from centre (50,50) to prevent edge clipping
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

function computeGridPositions(N: number): TablePosition[] {
  const top: TablePosition[] = [
    { defaultRole: 'chair',      label: 'Chair',      leftPct: 28, topPct:  9, isChair: true,  labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 50, topPct:  9, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',  leftPct: 72, topPct:  9, isChair: false, labelAbove: false },
  ];
  const right: TablePosition[] = [
    { defaultRole: 'auditChair', label: 'Audit Chair', leftPct: 90, topPct: 27, isChair: false, labelAbove: false },
    { defaultRole: 'ned',        label: 'SB Member',   leftPct: 90, topPct: 50, isChair: false, labelAbove: false },
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

// ── Derivation: map seats → table positions ──

export function deriveTablePositions(
  seats: BoardSeat[],
  hasEnergyTransition = false,
  hasCsrd = false,
  hasStrategy = false,
  forceGridLayout = false,
): (string | null)[] {
  // Committee chairs occupy opt slots only — they must NOT count toward the
  // base grid size, otherwise assigning a committee chair inflates `baseSeatCount`
  // which causes computeGridPositions to expand the perimeter grid and creates
  // extra empty "SB Member" slots next to the committee-chair positions.
  const committeeChairRoles = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair']);
  const baseSeatCount = seats.filter(s => !committeeChairRoles.has(s.role)).length;
  const optSlots = (hasEnergyTransition ? 1 : 0) + (hasCsrd ? 1 : 0) + (hasStrategy ? 1 : 0);

  // For 9+ base seats OR when the caller explicitly forces grid mode (e.g. Rheinfeld
  // starts with 8 inherited seats but should always use the square perimeter layout).
  if (baseSeatCount >= 9 || forceGridLayout) {
    const totalSlots = baseSeatCount + optSlots;
    const positions: (string | null)[] = Array(totalSlots).fill(null);
    const placed = new Set<string>();

    // Pin named roles to their designated grid slots (matches computeGridPositions slot order)
    // Slot 0: chair (top-left), Slot 1: SB Member (top-centre), Slot 2: SB Member (top-right),
    // Slot 3: auditChair (right-top), Slot 9: nomChair (left-centre, N≥10)
    const gridRoleToSlot: Partial<Record<BoardRole, number>> = {
      chair: 0,
      auditChair: 3,
      sid: 1,
      remChair: 2,
      nomChair: 9,
    };
    for (const seat of seats) {
      const slotIdx = gridRoleToSlot[seat.role];
      if (slotIdx !== undefined && slotIdx < baseSeatCount && positions[slotIdx] === null && !placed.has(seat.directorId)) {
        positions[slotIdx] = seat.directorId;
        placed.add(seat.directorId);
      }
    }

    // Fill remaining base slots with NEDs / worker reps in seats-array order.
    // Skip committee-chair roles — they are handled by the opt-slot phase below.
    let nextFill = 0;
    for (const seat of seats) {
      if (!placed.has(seat.directorId) && !committeeChairRoles.has(seat.role)) {
        while (nextFill < baseSeatCount && positions[nextFill] !== null) nextFill++;
        if (nextFill < baseSeatCount) {
          positions[nextFill] = seat.directorId;
          placed.add(seat.directorId);
          nextFill++;
        }
      }
    }

    // Optional committee chair slots appended after the base grid slots
    let optSlotIdx = baseSeatCount;
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

  // Named positions first (match by role)
  const roleToPosition: Record<string, number> = {
    chair: 0, sid: 1, auditChair: 2, remChair: 4, nomChair: 6,
  };
  // Optional committee chairs get sequential slots after the 8 base
  let nextOptSlot = 8;
  if (hasEnergyTransition) {
    roleToPosition['energyTransitionChair'] = nextOptSlot++;
  }
  if (hasCsrd) {
    roleToPosition['csrdChair'] = nextOptSlot++;
  }
  if (hasStrategy) {
    roleToPosition['strategyChair'] = nextOptSlot++;
  }

  for (const seat of seats) {
    const posIdx = roleToPosition[seat.role];
    if (posIdx !== undefined && !placed.has(seat.directorId)) {
      positions[posIdx] = seat.directorId;
      placed.add(seat.directorId);
    }
  }

  // Fill NED slots with remaining directors
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

// ── Short role label for display under seat ──

function shortRoleLabel(
  role: BoardRole,
  jurisdiction: Jurisdiction = 'UK',
  directorId?: string | null,
  workerRepSet?: Set<string>,
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
}

// ETC Chair position (8-seat circular layout — appears at bottom-left when ET committee is active)
const ETC_POSITION: TablePosition = {
  defaultRole: 'energyTransitionChair',
  label: 'ETC Chair',
  leftPct: 32.4,
  topPct: 79.4,
  isChair: false,
};

// CSRD / Strategy positions for 8-seat circular layout
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

// CSRD / Strategy positions for GRID layout — left column slots 10 & 11 (topPct=50/73)
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
}: BoardroomTableProps) {
  const workerRepSet = new Set(workerRepIds);
  const lockedSet = new Set(lockedDirectorIds);
  const conflictSet = new Set(conflictDirectorIds);

  // ── Dynamic layout: 9+ base seats OR Rheinfeld (always has 5 worker-rep slots) ──
  // Use baseSeatCount (excluding committee chairs) so assigning a committee chair
  // director doesn't inflate the seat count and grow the perimeter grid unexpectedly.
  const committeeChairRoleSet = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair']);
  const baseSeatCount = seats.filter(s => !committeeChairRoleSet.has(s.role)).length;
  const useDynamicLayout = baseSeatCount >= 9 || workerRepIds.length >= 5;
  const seatPxNormal = (_idx: number, isChairPos: boolean) =>
    isChairPos ? 68 : 58;
  // Grid layout: smaller portraits so seats fit cleanly around the perimeter
  const seatPxGrid = (_idx: number, isChairPos: boolean) =>
    isChairPos ? 64 : 52;

  // Determine effective table SVG rect dimensions
  // Large layout: square table in a 400×400 viewBox
  // Standard layout: portrait table in a 400×300 viewBox
  const tableRect = useDynamicLayout
    ? { x: 100, y: 100, w: 200, h: 200, rx: 30 }
    : { x: 120, y: 55, w: 160, h: 190, rx: 35 };

  // Build effective positions: base (static or grid) + optional committee chair seats
  const basePositions: TablePosition[] = useDynamicLayout
    ? computeGridPositions(baseSeatCount)
    : TABLE_POSITIONS;

  const effectivePositions: TablePosition[] = [
    ...basePositions,
    ...(hasEnergyTransition ? [ETC_POSITION] : []),
    ...(hasCsrd ? [useDynamicLayout ? GRID_CSRD_POSITION : CSRD_POSITION] : []),
    ...(hasStrategy ? [useDynamicLayout ? GRID_STRATEGY_POSITION : STRATEGY_POSITION] : []),
  ];

  const positions = deriveTablePositions(seats, hasEnergyTransition, hasCsrd, hasStrategy, useDynamicLayout);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const getDirector = (id: string) => directors.find((d) => d.id === id);
  const getSeat = (directorId: string) => seats.find((s) => s.directorId === directorId);

  // Large layout uses a square canvas; standard uses 4:3
  const svgViewBox = useDynamicLayout ? '0 0 400 400' : '0 0 400 300';
  const containerAspectRatio = useDynamicLayout ? '1/1' : '4/3';
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
        const seatPx = useDynamicLayout ? seatPxGrid(index, pos.isChair) : seatPxNormal(index, pos.isChair);
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
        const seatPx = useDynamicLayout ? seatPxGrid(index, pos.isChair) : seatPxNormal(index, pos.isChair);
        const isLockedChairCeo = combinedChairCeo && pos.isChair;

        const actualLabel = isLockedChairCeo
          ? 'Chair/CEO'
          : seat && seat.role !== pos.defaultRole
            ? shortRoleLabel(seat.role, jurisdiction, directorId, workerRepSet)
            : shortRoleLabel(pos.defaultRole, jurisdiction, directorId, workerRepSet);

        // Grid layout: each position specifies labelAbove.
        // Circular layout: only the Chair (index 0) has its label above.
        const isLabelAbove = useDynamicLayout
          ? (pos.labelAbove ?? false)
          : index === 0;
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
                {shortRoleLabel(pos.defaultRole, jurisdiction)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
