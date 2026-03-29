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

// ── Derivation: map seats → table positions ──

export function deriveTablePositions(seats: BoardSeat[], hasEnergyTransition = false): (string | null)[] {
  const totalSlots = hasEnergyTransition ? 9 : 8;
  const positions: (string | null)[] = Array(totalSlots).fill(null);
  const placed = new Set<string>();

  // Named positions first (match by role)
  const roleToPosition: Record<string, number> = {
    chair: 0, sid: 1, auditChair: 2, remChair: 4, nomChair: 6,
  };
  // ETC chair maps to position 8 (only when ET is active)
  if (hasEnergyTransition) {
    roleToPosition['energyTransitionChair'] = 8;
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

function shortRoleLabel(role: BoardRole, jurisdiction: Jurisdiction = 'UK'): string {
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
  onDropOnSeat?: (directorId: string, seatIndex: number) => void;
  /** Company short name for table watermark (e.g. "HARWICK") */
  companyShortName?: string;
  /** Second line for table watermark (e.g. "ENERGY PLC") */
  companyShortNameSuffix?: string;
  /** Jurisdiction for role labels (UK: SID, US: LID) */
  jurisdiction?: Jurisdiction;
  /** Whether the Chair seat is locked as Combined Chair/CEO (Vantage) */
  combinedChairCeo?: boolean;
}

// ETC Chair position (appears at bottom-left when ET committee is active)
// ETC/CA&R Chair position also scaled 0.85× inward from centre (50,50)
const ETC_POSITION: TablePosition = {
  defaultRole: 'energyTransitionChair',
  label: 'ETC Chair',
  leftPct: 32.4,
  topPct: 79.4,
  isChair: false,
};

export default function BoardroomTable({
  seats,
  directors,
  activeSeatIndex,
  onSeatClick,
  hasEnergyTransition = false,
  onDropOnSeat,
  companyShortName = 'HARWICK',
  companyShortNameSuffix = 'ENERGY PLC',
  jurisdiction = 'UK',
  combinedChairCeo = false,
}: BoardroomTableProps) {
  // Build effective positions: base 8 + optional ETC seat
  const effectivePositions = hasEnergyTransition
    ? [...TABLE_POSITIONS, ETC_POSITION]
    : TABLE_POSITIONS;

  const positions = deriveTablePositions(seats, hasEnergyTransition);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const getDirector = (id: string) => directors.find((d) => d.id === id);
  const getSeat = (directorId: string) => seats.find((s) => s.directorId === directorId);

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
          {/* Radial gradient — lighter centre */}
          <radialGradient id="tableGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A3A5C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer table surface — rounded rectangle */}
        <rect x="120" y="55" width="160" height="190" rx="35" fill="#0D1B2A" stroke="#C8960C" strokeWidth="2" />
        {/* Wood-grain overlay */}
        <rect x="120" y="55" width="160" height="190" rx="35" fill="url(#woodGrain)" />
        {/* Gradient overlay */}
        <rect x="120" y="55" width="160" height="190" rx="35" fill="url(#tableGrad)" />
        {/* Inner edge highlight */}
        <rect
          x="125"
          y="60"
          width="150"
          height="180"
          rx="30"
          fill="none"
          stroke="#C8960C"
          strokeWidth="0.5"
          opacity="0.25"
        />

        {/* Company name in centre */}
        <text
          x="200"
          y="146"
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
          x="200"
          y="160"
          textAnchor="middle"
          fill="#C8960C"
          fontSize="7"
          fontFamily="Georgia, serif"
          opacity="0.3"
        >
          {companyShortNameSuffix}
        </text>
      </svg>

      {/* Seat circles — positioned over SVG */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const isActive = activeSeatIndex === index;
        const seatPx = pos.isChair ? 68 : 58;
        const isLockedChairCeo = combinedChairCeo && pos.isChair;

        return (
          <div
            key={`seat-${index}`}
            className={`absolute group ${isLockedChairCeo ? 'cursor-default' : 'cursor-pointer'}`}
            style={{
              left: `${pos.leftPct}%`,
              top: `${pos.topPct}%`,
              transform: 'translate(-50%, -50%)',
              width: seatPx,
              height: seatPx,
            }}
            onClick={() => { if (!isLockedChairCeo) onSeatClick(index); }}
            onDragOver={(e) => {
              if (isLockedChairCeo) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDragOverIdx(index);
            }}
            onDragLeave={() => setDragOverIdx(null)}
            onDrop={(e) => {
              if (isLockedChairCeo) return;
              e.preventDefault();
              setDragOverIdx(null);
              const dirId = e.dataTransfer.getData('text/plain');
              if (dirId && onDropOnSeat) onDropOnSeat(dirId, index);
            }}
          >
            <div
              draggable={!!director && !isLockedChairCeo}
              onDragStart={(e) => {
                if (!director || isLockedChairCeo) { e.preventDefault(); return; }
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
                  : dragOverIdx === index
                    ? 'border-2 border-dashed border-gold ring-2 ring-gold/40 bg-gold/10'
                    : director
                      ? `border-2 border-gold ${
                          isActive
                            ? 'ring-2 ring-gold/60 ring-offset-2 ring-offset-navy'
                            : 'group-hover:ring-1 group-hover:ring-gold/30 group-hover:ring-offset-1 group-hover:ring-offset-navy'
                        }`
                      : `border-2 border-dashed ${
                          isActive
                            ? 'border-gold animate-pulse bg-gold/5'
                            : 'border-foreground/20 bg-navy-dark/40 group-hover:border-foreground/40'
                        }`
              }`}
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
          </div>
        );
      })}

      {/* Labels — absolutely-positioned HTML elements outside the seat circles */}
      {effectivePositions.map((pos, index) => {
        const directorId = positions[index];
        const director = directorId ? getDirector(directorId) : null;
        const seat = directorId ? getSeat(directorId) : null;
        const seatPx = pos.isChair ? 68 : 58;
        const isLockedChairCeo = combinedChairCeo && pos.isChair;

        const actualLabel = isLockedChairCeo
          ? 'Chair/CEO'
          : seat && seat.role !== pos.defaultRole
            ? shortRoleLabel(seat.role, jurisdiction)
            : shortRoleLabel(pos.defaultRole, jurisdiction);

        // For the Chair (top seat, index 0), labels go ABOVE the portrait to avoid overlapping the table
        const isTopSeat = index === 0;
        const labelOffset = isTopSeat
          ? -(seatPx / 2 + 30) // above: portrait radius + label height gap
          : (seatPx / 2 + 4);  // below: portrait radius + small gap

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
