'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { BoardSeat, Director, BoardRole } from '@/types/game';
import { ROLE_LABELS, getRoleLabel, directorShortLabel } from '@/engine/boardConstants';
import type { Jurisdiction } from '@/types/game';
import DirectorPortrait from './DirectorPortrait';
import { computeSeatLayout } from './boardroom/useSeatLayout';
import './boardroom/boardroom.css';

// ── Seat role tooltips ──

interface RoleTooltipInfo {
  description: string;
  requirements: string[];
}

type RoleTooltipMap = Partial<Record<BoardRole, RoleTooltipInfo>>;

const BASE_ROLE_TOOLTIPS: RoleTooltipMap = {
  chair: {
    description: 'Leads the board, sets agenda, and ensures effective governance.',
    requirements: ['Must be independent', 'Strategy & Markets ≥ 60', 'Stakeholder & Comms ≥ 60'],
  },
  sid: {
    description: 'Acts as a sounding board for the Chair and conduit for shareholder concerns.',
    requirements: ['Must be independent', 'Stakeholder & Comms ≥ 60'],
  },
  auditChair: {
    description: 'Oversees financial reporting, internal controls, and external audit.',
    requirements: ['Must be independent', 'Financial Oversight ≥ 75'],
  },
  remChair: {
    description: 'Sets executive remuneration policy and monitors pay structure.',
    requirements: ['Must be independent', 'People & Culture ≥ 60'],
  },
  nomChair: {
    description: 'Leads board succession planning and director appointment process.',
    requirements: ['People & Culture ≥ 55', 'Strategy & Markets ≥ 50'],
  },
  ned: {
    description: 'Provides independent scrutiny and challenge to executive management.',
    requirements: ['Must be independent'],
  },
  energyTransitionChair: {
    description: 'Oversees the company\'s strategy on energy transition and decarbonisation.',
    requirements: ['ESG & Sustainability ≥ 70'],
  },
  csrdChair: {
    description: 'Oversees sustainability reporting and CSRD compliance framework.',
    requirements: ['ESG & Sustainability or Geopolitical Macro ≥ 65'],
  },
  strategyChair: {
    description: 'Chairs the dedicated strategy committee and long-term planning oversight.',
    requirements: ['Strategy & Markets ≥ 60'],
  },
  esgChair: {
    description: 'Leads the board\'s oversight of environmental, social, and governance matters.',
    requirements: ['ESG & Sustainability ≥ 65'],
  },
  riskChair: {
    description: 'Oversees the company\'s risk management framework and appetite.',
    requirements: ['Financial Oversight ≥ 60'],
  },
  techChair: {
    description: 'Provides oversight of technology, digital transformation, and cyber risk.',
    requirements: ['Technology & Digital ≥ 65'],
  },
  safetyEnvChair: {
    description: 'Oversees safety management systems and environmental compliance.',
    requirements: ['ESG & Sustainability ≥ 70'],
  },
  sustainabilityChair: {
    description: 'Chairs the Sustainability Committee overseeing ESG reporting, climate risk, and sustainability governance.',
    requirements: ['ESG & Sustainability ≥ 70'],
  },
};

// Per-jurisdiction overrides for roles whose requirements differ from the UK defaults
const EU_ROLE_TOOLTIPS: RoleTooltipMap = {
  // Supervisory Board Chair: no coded skill thresholds in GCGC for this role
  chair: {
    description: 'Chairs the Supervisory Board, sets agenda, and ensures effective oversight.',
    requirements: [],
  },
  // Rem Committee: independence not a hard requirement under GCGC (majority shareholder-side)
  remChair: {
    description: 'Sets executive remuneration policy and monitors pay structure.',
    requirements: ['People & Culture ≥ 60'],
  },
  // CSRD Chair: no coded skill threshold enforced for EU in-game
  csrdChair: {
    description: 'Oversees CSRD sustainability reporting and ESG disclosure framework.',
    requirements: ['ESG & Sustainability ≥ 65'],
  },
  // Strategy Chair: no coded skill threshold enforced for EU in-game
  strategyChair: {
    description: 'Chairs the Strategy Committee and oversees long-term planning.',
    requirements: ['Strategy & Markets ≥ 60'],
  },
};

// Per-company overrides (applied after jurisdiction overrides)
const COMPANY_ROLE_TOOLTIPS: Partial<Record<string, RoleTooltipMap>> = {
  company_vantage: {
    // US Chair: Stakeholder & Comms not checked; independence is a warning not a hard requirement
    chair: {
      description: 'Leads the board and provides oversight of the combined Chair/CEO dynamic.',
      requirements: ['Must be independent', 'Strategy & Markets ≥ 60'],
    },
    // US Rem Chair (Compensation Committee): independence required (NYSE §303A.05)
    remChair: {
      description: 'Chairs the Compensation Committee and sets executive pay policy.',
      requirements: ['Must be independent', 'People & Culture ≥ 60'],
    },
    // US Nom/Gov Chair: independence required (NYSE §303A.04); no Strategy & Markets check
    nomChair: {
      description: 'Chairs the Nominating/Governance Committee and leads director recruitment.',
      requirements: ['Must be independent', 'People & Culture ≥ 55'],
    },
    // CA&R Chair (mapped to energyTransitionChair): requires Regulatory & Legal, not ESG
    energyTransitionChair: {
      description: 'Chairs the Consumer Affairs & Regulatory Committee overseeing UPF and labelling risk.',
      requirements: ['Regulatory & Legal ≥ 65'],
    },
  },
  company_meridian: {
    // Charity Chair: Strategy & Markets threshold is 55 (not 60); no Stakeholder & Comms check
    chair: {
      description: 'Leads the board of trustees and ensures the charity fulfils its mission.',
      requirements: ['Must be independent', 'Strategy & Markets ≥ 55'],
    },
    // Finance & Risk Chair: threshold is 65 (not 75); independence is conflict-risk warning, not hard rule
    auditChair: {
      description: 'Chairs the Finance & Risk Committee and oversees financial stewardship.',
      requirements: ['Financial Oversight ≥ 65'],
    },
    // People & Culture Chair: no independence requirement in charity compliance
    remChair: {
      description: 'Chairs the People & Culture Committee covering safeguarding and CEO oversight.',
      requirements: ['People & Culture ≥ 60'],
    },
    // Programmes & Impact Chair: ESG Sustainability or Geopolitical Macro ≥ 65
    csrdChair: {
      description: 'Chairs the Programmes & Impact Committee and holds mission delivery to account.',
      requirements: ['ESG & Sustainability or Geopolitical Macro ≥ 65'],
    },
  },
};

export function getRoleTooltip(
  role: BoardRole,
  jurisdiction: Jurisdiction = 'UK',
  companyId?: string,
): RoleTooltipInfo | undefined {
  const base = BASE_ROLE_TOOLTIPS[role];
  const jurisdictionOverride = jurisdiction === 'EU' ? EU_ROLE_TOOLTIPS[role] : undefined;
  const companyOverride = companyId ? COMPANY_ROLE_TOOLTIPS[companyId]?.[role] : undefined;
  return companyOverride ?? jurisdictionOverride ?? base;
}

/** @deprecated use getRoleTooltip instead */
export const ROLE_TOOLTIPS = BASE_ROLE_TOOLTIPS;

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
  // Slot assignment by N:
  //  N= 9: 3 top + 3 right + 3 bottom + 0 left = 9
  //  N=10: 3 top + 3 right + 3 bottom + 1 left = 10
  //  N=11: 3 top + 3 right + 3 bottom + 2 left = 11
  //  N=12: 3 top + 3 right + 3 bottom + 3 left = 12

  // Beyond the fixed 12-slot perimeter (a large board — e.g. a full 13+ seat
  // pool), append generic NED slots so every director still gets a real seat.
  // leftPct/topPct are inert here — the ring-based renderer computes on-screen
  // position from N and index alone, not from these percentages.
  while (all.length < N) {
    all.push({ defaultRole: 'ned', label: 'NED', leftPct: 50, topPct: 50, isChair: false, labelAbove: false });
  }

  return all.slice(0, N);
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
  const committeeChairRoles = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair', 'sustainabilityChair']);
  const baseSeatCount = seats.filter(s => !committeeChairRoles.has(s.role)).length;
  const hasSustainabilityChair = seats.some((s) => s.role === 'sustainabilityChair');
  const optSlots = (hasEnergyTransition ? 1 : 0) + (hasCsrd ? 1 : 0) + (hasStrategy ? 1 : 0) + (hasSustainabilityChair ? 1 : 0);

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

  // Seats with an explicit slotIndex claim that exact slot first — this is what
  // makes NED-seat placement stable: once a director has been placed (by drag,
  // click-assign, etc.), moving or adding any OTHER seat can't silently bump
  // them elsewhere. Only the fallback "next available" fill below is order-
  // dependent, and it now only ever applies to seats that were never assigned
  // a stable slot (e.g. legacy saves, initial company-seeded boards).
  for (const seat of seats) {
    if (
      seat.slotIndex !== undefined &&
      seat.slotIndex >= 0 &&
      seat.slotIndex < effectiveGridSize &&
      !namedSlots.has(seat.slotIndex) &&
      !committeeChairRoles.has(seat.role) &&
      positions[seat.slotIndex] === null &&
      !placed.has(seat.directorId)
    ) {
      positions[seat.slotIndex] = seat.directorId;
      placed.add(seat.directorId);
    }
  }

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
  if (hasSustainabilityChair) roleToOptSlot['sustainabilityChair'] = optSlotIdx++;

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
  /** Callback to start a touch drag from a seated director (mobile/tablet DnD) */
  onTouchDragStart?: (dirId: string, touchX: number, touchY: number) => void;
  /** Slot indices to render with a pulsing gold "event references this seat" glow */
  highlightedSeatIndices?: number[];
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

function truncateForWidth(text: string, maxWidth: number, fontSize: number): string {
  const avgCharWidth = fontSize * 0.62;
  const maxChars = Math.max(3, Math.floor(maxWidth / avgCharWidth));
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1)}…`;
}

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
  onTouchDragStart,
  highlightedSeatIndices = [],
}: BoardroomTableProps) {
  const uid = useId();
  const workerRepSet = new Set(workerRepIds);
  const lockedSet = new Set(lockedDirectorIds);
  const conflictSet = new Set(conflictDirectorIds);
  const highlightSet = new Set(highlightedSeatIndices);

  // Slot derivation is unchanged from before: same role/label metadata, same
  // directorId → slot-index mapping the callers already build their own logic
  // around (play/page.tsx computes this independently via the same exported
  // functions). Only the on-screen placement below is new — index semantics
  // (0 = Chair, etc.) are untouched.
  // isRheinfeld: uses computeGridPositions (Worker Rep labels, min 10 slots).
  // Standard:    uses computeStandardGridPositions (SID/NomChair slots, min 9 slots).
  const committeeChairRoleSet = new Set<string>(['csrdChair', 'strategyChair', 'energyTransitionChair', 'sustainabilityChair']);
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
  const [hoveredSeatIdx, setHoveredSeatIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Rendered avatar node per seat index, used to give the native drag a real
  // ghost image (a transparent drag-source div has nothing to snapshot on its own).
  const avatarRefs = useRef<Map<number, SVGGElement>>(new Map());
  const [containerWidth, setContainerWidth] = useState(1000);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getDirector = (id: string) => directors.find((d) => d.id === id);
  const getSeat = (directorId: string) => seats.find((s) => s.directorId === directorId);

  // N is derived from the slot count above, never hardcoded.
  const { seats: seatPoints, radius: r } = computeSeatLayout(effectivePositions.length);

  const labelMode: 'full' | 'compact' | 'hidden' =
    containerWidth < 270 ? 'hidden' : containerWidth < 420 ? 'compact' : 'full';
  const needsBigHitArea = (r * containerWidth) / 1000 < 20;

  // Lock label text to a real on-screen size (matching the candidate pool card's
  // name text, text-[9px] in PoolCard) rather than a fixed viewBox-unit size —
  // the viewBox is much larger than the old 400-unit canvas, so a fixed unit
  // size would render far smaller on screen than the pool card's text.
  const pxPerUnit = containerWidth / 1000;
  const unitsForPx = (px: number) => px / pxPerUnit;

  const cx = 500;
  const cy = 500;
  const tableRect = { x: cx - 200, y: cy - 200, w: 400, h: 400, rx: 56 };
  // Label width budget: at least ~92 on-screen px so full surnames fit even on
  // phones (tighter on very small boards where adjacent labels would collide).
  // Long labels shrink their font (min 8px, via fitFontPx) rather than
  // truncate; truncateForWidth stays only as a last-resort safety net.
  const labelBudgetPx = containerWidth < 340 ? 76 : Math.max(92, 150 * pxPerUnit);
  const nameMaxWidth = labelBudgetPx / pxPerUnit;
  const fitFontPx = (text: string, basePx: number) =>
    text.length * basePx * 0.62 <= labelBudgetPx
      ? basePx
      : Math.max(8, labelBudgetPx / (text.length * 0.62));

  return (
    <div ref={containerRef} className="relative w-full" style={{ aspectRatio: '1/1' }}>
      <svg
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Wood-grain texture */}
          <pattern id={`${uid}-woodGrain`} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="10" x2="20" y2="10" stroke="#2A5580" strokeWidth="0.75" opacity="0.2" />
          </pattern>
          {/* Radial gradient - lighter centre */}
          <radialGradient id={`${uid}-tableGrad`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1A3A5C" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0D1B2A" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${uid}-selectedGlow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E0B044" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#E0B044" stopOpacity="0" />
          </radialGradient>
          <filter id={`${uid}-seatShadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer table surface - rounded rectangle */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill="#0D1B2A" stroke="#C8960C" strokeWidth={3} />
        {/* Wood-grain overlay */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill={`url(#${uid}-woodGrain)`} />
        {/* Gradient overlay */}
        <rect x={tableRect.x} y={tableRect.y} width={tableRect.w} height={tableRect.h} rx={tableRect.rx} fill={`url(#${uid}-tableGrad)`} />
        {/* Inner edge highlight */}
        <rect
          x={tableRect.x + 8}
          y={tableRect.y + 8}
          width={tableRect.w - 16}
          height={tableRect.h - 16}
          rx={tableRect.rx - 8}
          fill="none"
          stroke="#C8960C"
          strokeWidth={1}
          opacity={0.4}
        />

        {/* Company wordmark, centred in the table */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          fill="#C8960C"
          fontSize={34}
          fontFamily="var(--font-serif, Georgia, serif)"
          fontWeight={700}
          letterSpacing="2"
          opacity={0.75}
        >
          {companyShortName}
        </text>
        <text
          x={cx}
          y={cy + 20}
          textAnchor="middle"
          fill="#C8960C"
          fontSize={15}
          fontFamily="var(--font-serif, Georgia, serif)"
          letterSpacing="1.5"
          fontVariant="small-caps"
          opacity={0.55}
        >
          {companyShortNameSuffix}
        </text>

        {/* Seats — equal arc-length spacing around a rounded-rect ring, N = effectivePositions.length */}
        {effectivePositions.map((pos, index) => {
          const directorId = positions[index];
          const director = directorId ? getDirector(directorId) : null;
          const isActive = activeSeatIndex === index;
          const point = seatPoints[index] ?? { x: cx, y: cy };
          const isLockedChairCeo = combinedChairCeo && pos.isChair;
          const isWorkerRep = directorId ? workerRepSet.has(directorId) : false;
          const isLockedSeat = directorId ? lockedSet.has(directorId) : false;
          const hasConflict = directorId ? conflictSet.has(directorId) : false;
          const isNonInteractive = isLockedChairCeo || isWorkerRep || isLockedSeat;
          const isHovered = hoveredSeatIdx === index && !isNonInteractive;
          const isHighlighted = highlightSet.has(index);
          const roleLabelFull = getRoleLabel(pos.defaultRole, jurisdiction, companyId);
          const ariaLabel = director ? `${director.name}, ${roleLabelFull}` : `Empty seat: ${roleLabelFull}`;
          const ringColor = isWorkerRep ? '#5B9BD5' : '#C8960C';

          return (
            <g
              key={`seat-${index}`}
              data-seat-index={index}
              data-seat-interactive={isNonInteractive ? 'false' : 'true'}
              className={`bcraft-seat-pos bcraft-seat-group ${isNonInteractive ? '' : 'cursor-pointer'}`}
              style={{ transform: `translate(${point.x}px, ${point.y}px)` }}
              role="button"
              tabIndex={isNonInteractive ? -1 : 0}
              aria-label={ariaLabel}
              aria-disabled={isNonInteractive || undefined}
              opacity={isNonInteractive ? 0.75 : 1}
              onPointerEnter={(e) => { if (e.pointerType === 'mouse') setHoveredSeatIdx(index); }}
              onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHoveredSeatIdx(null); }}
              onFocus={() => setHoveredSeatIdx(index)}
              onBlur={() => setHoveredSeatIdx((cur) => (cur === index ? null : cur))}
              onClick={() => { setHoveredSeatIdx(null); if (!isNonInteractive) onSeatClick(index); }}
              onKeyDown={(e) => {
                if (isNonInteractive) return;
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSeatClick(index); }
              }}
            >
              <title>{ariaLabel}</title>

              {isHighlighted && (
                <circle className="bcraft-seat-event-highlight" r={r + 10} fill="none" stroke="#C8960C" strokeWidth={4} />
              )}
              {isActive && <circle r={r + 9} fill={`url(#${uid}-selectedGlow)`} />}
              {dragOverIdx === index && (
                <circle r={r + 4} fill="none" stroke="#C8960C" strokeWidth={2} strokeDasharray="5 5" />
              )}
              <circle
                className="bcraft-seat-focus-ring"
                r={r + 6}
                fill="none"
                stroke="#E0B044"
                strokeWidth={2}
                opacity={0}
                style={{ transition: 'opacity 150ms' }}
              />

              <g className="bcraft-seat-scale" style={{ transform: isHovered ? 'scale(1.06)' : 'scale(1)' }}>
                {director && isLockedChairCeo ? (
                  <>
                    {/* Combined Chair/CEO (Vantage): locked, no portrait — a light
                        red tint + lock glyph, matching the pre-rewrite treatment. */}
                    <circle r={r} fill="#D94040" fillOpacity={0.05} />
                    <circle r={r} fill="none" stroke="#D94040" strokeOpacity={0.6} strokeWidth={3} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.7} fill="#D94040" fillOpacity={0.5}>🔒</text>
                  </>
                ) : director ? (
                  <>
                    <clipPath id={`${uid}-clip-${index}`}>
                      <circle r={r} />
                    </clipPath>
                    <circle r={r} fill="#0D1B2A" />
                    <g
                      ref={(el) => { if (el) avatarRefs.current.set(index, el); else avatarRefs.current.delete(index); }}
                      clipPath={`url(#${uid}-clip-${index})`}
                    >
                      <g transform={`translate(${-r}, ${-r})`}>
                        <DirectorPortrait directorId={director.id} size={r * 2} />
                      </g>
                    </g>
                    <circle
                      r={r}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth={3}
                      filter={`url(#${uid}-seatShadow)`}
                    />
                    {hasConflict && (
                      <>
                        <circle cx={r * 0.72} cy={-r * 0.72} r={r * 0.28} fill="#D94040" />
                        <text x={r * 0.72} y={-r * 0.72} textAnchor="middle" dominantBaseline="central" fontSize={r * 0.32} fill="white" fontWeight={700}>
                          !
                        </text>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <circle r={r} fill="rgba(13, 27, 42, 0.4)" stroke="#E8E4DC" strokeOpacity={0.2} strokeWidth={2} strokeDasharray="6 6" />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={r * 0.55} fill="#E8E4DC" opacity={0.45}>
                      +
                    </text>
                  </>
                )}
                {/* Native HTML5 drag-and-drop is unreliable when one end of the
                    drag is a plain SVG element — browsers are inconsistent about
                    dispatching dragover/drop across the SVG↔HTML boundary. Both
                    the drop target (always) and the drag source (when filled)
                    live in one real HTML div via foreignObject, matching how
                    drag-and-drop worked before this component was rewritten. */}
                {(() => {
                  const hitR = needsBigHitArea ? r * 1.4 : r;
                  return (
                    <foreignObject x={-hitR} y={-hitR} width={hitR * 2} height={hitR * 2}>
                      <div
                        onDragOver={(e) => {
                          if (isNonInteractive) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          setDragOverIdx(index);
                        }}
                        onDragLeave={() => setDragOverIdx((cur) => (cur === index ? null : cur))}
                        onDrop={(e) => {
                          if (isNonInteractive) return;
                          e.preventDefault();
                          setDragOverIdx(null);
                          const dirId = e.dataTransfer.getData('text/plain');
                          if (dirId && onDropOnSeat) onDropOnSeat(dirId, index);
                        }}
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                      >
                        {director && !isNonInteractive && (
                          <div
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', director.id);
                              e.dataTransfer.effectAllowed = 'move';
                              const avatarEl = avatarRefs.current.get(index);
                              if (avatarEl) {
                                const rect = avatarEl.getBoundingClientRect();
                                e.dataTransfer.setDragImage(avatarEl, rect.width / 2, rect.height / 2);
                              }
                            }}
                            onTouchStart={(e) => {
                              if (!onTouchDragStart) return;
                              const touch = e.touches[0];
                              onTouchDragStart(director.id, touch.clientX, touch.clientY);
                            }}
                            style={{ width: '100%', height: '100%', borderRadius: '50%', cursor: 'grab' }}
                          />
                        )}
                      </div>
                    </foreignObject>
                  );
                })()}
              </g>
            </g>
          );
        })}

        {/* Labels — every seat identical pattern, always centred below, never above */}
        {labelMode !== 'hidden' && effectivePositions.map((pos, index) => {
          const directorId = positions[index];
          const director = directorId ? getDirector(directorId) : null;
          const seat = directorId ? getSeat(directorId) : null;
          const point = seatPoints[index] ?? { x: cx, y: cy };
          const isLockedChairCeo = combinedChairCeo && pos.isChair;

          const actualLabel = isLockedChairCeo
            ? 'CEO/Chair'
            : seat && seat.role !== pos.defaultRole
              ? shortRoleLabel(seat.role, jurisdiction, directorId, workerRepSet, companyId)
              : shortRoleLabel(pos.defaultRole, jurisdiction, directorId, workerRepSet, companyId);

          // Match the candidate pool card's name text size (text-[9px]) in real
          // CSS pixels, independent of how large the seat ring renders on screen.
          const nameText = director ? directorShortLabel(director) : '';
          const nameFontSize = unitsForPx(fitFontPx(nameText, labelMode === 'compact' ? 12 : 10));
          const roleFontSize = unitsForPx(fitFontPx(actualLabel, labelMode === 'compact' ? 11 : 9));
          const nameY = r + 14 + nameFontSize;
          const roleY = nameY + roleFontSize + 3;

          return (
            <g key={`label-${index}`} className="bcraft-seat-pos" style={{ transform: `translate(${point.x}px, ${point.y}px)` }}>
              {director ? (
                <>
                  <text y={nameY} textAnchor="middle" fontSize={nameFontSize} fontFamily="var(--font-mono, monospace)" fontWeight={600} fill="#E8E4DC">
                    {truncateForWidth(nameText, nameMaxWidth, nameFontSize)}
                  </text>
                  {labelMode === 'full' && (
                    <text y={roleY} textAnchor="middle" fontSize={roleFontSize} fontFamily="var(--font-mono, monospace)" fill="#E8E4DC" opacity={0.5}>
                      {truncateForWidth(actualLabel, nameMaxWidth, roleFontSize)}
                      <title>{actualLabel}</title>
                    </text>
                  )}
                </>
              ) : (() => {
                const emptyRoleLabel = shortRoleLabel(pos.defaultRole, jurisdiction, null, undefined, companyId);
                return (
                  <text y={nameY} textAnchor="middle" fontSize={roleFontSize} fontFamily="var(--font-mono, monospace)" fill="#E8E4DC" opacity={0.5}>
                    {truncateForWidth(emptyRoleLabel, nameMaxWidth, roleFontSize)}
                    <title>{emptyRoleLabel}</title>
                  </text>
                );
              })()}
            </g>
          );
        })}
      </svg>

      {/* Role tooltip on hover (empty seats only, desktop only). Kept as an HTML
          overlay rather than SVG text so it can wrap/lay out like a real card;
          positioned by percentage from the same ring coordinates as the seat. */}
      {hoveredSeatIdx !== null && (() => {
        const index = hoveredSeatIdx;
        const directorId = positions[index];
        if (directorId) return null;
        const point = seatPoints[index];
        const pos = effectivePositions[index];
        if (!point || !pos) return null;
        const role = pos.defaultRole;
        const tooltip = getRoleTooltip(role, jurisdiction, companyId);
        if (!tooltip) return null;
        const showAbove = point.y > cy;
        const leftPct = (point.x / 1000) * 100;
        const topPct = (point.y / 1000) * 100;
        const rPct = (r / 1000) * 100;
        // Shift inward for left/right column seats so tooltip stays within bounds
        const horizStyle: React.CSSProperties =
          leftPct <= 20
            ? { left: 0, transform: 'none' }
            : leftPct >= 80
              ? { right: 0, left: 'auto', transform: 'none' }
              : { left: `${leftPct}%`, transform: 'translateX(-50%)' };
        return (
          <div
            className="pointer-events-none absolute z-50 hidden md:block"
            style={{
              ...horizStyle,
              ...(showAbove
                ? { bottom: `${100 - topPct + rPct + 1}%` }
                : { top: `${topPct + rPct + 1}%` }),
              width: 180,
            }}
          >
            <div
              className="rounded-lg border border-gold/30 shadow-xl text-left"
              style={{
                background: 'rgba(10, 22, 40, 0.97)',
                padding: '8px 10px',
              }}
            >
              <div className="font-semibold text-gold mb-1" style={{ fontSize: '10px' }}>
                {getRoleLabel(role, jurisdiction, companyId)}
              </div>
              <div className="text-foreground/70 mb-2 leading-snug" style={{ fontSize: '9px' }}>
                {tooltip.description}
              </div>
              {tooltip.requirements.length > 0 && (
                <div>
                  <div className="text-foreground/40 uppercase tracking-wide mb-1" style={{ fontSize: '8px' }}>
                    Requirements
                  </div>
                  {tooltip.requirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-1" style={{ fontSize: '9px' }}>
                      <span className="text-gold/60 mt-px" style={{ fontSize: '8px' }}>›</span>
                      <span className="text-foreground/60 leading-snug">{req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
