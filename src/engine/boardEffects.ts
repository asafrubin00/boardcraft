// ── Board effects: what an event's outcome does to the board itself ──
//
// Events used to SAY things like "Helena retires" or "Anwar is named BRC Chair"
// while the board stayed exactly as it was. This module is the single place
// where a chosen strategy (or an event outcome) changes who sits where, so the
// table, the committees and every later event agree with the story.
//
// Pure functions only: state in, state out. Wired into page.tsx for both
// ordinary events and the AGM.

import type {
  BoardRole,
  BoardSeat,
  CommitteeId,
  CommitteeState,
  CompetencyDomain,
  Director,
  GameEvent,
  GameState,
  OutcomeTier,
} from '@/types/game';
import { directors as allDirectorsRaw } from '@/data/directors';
import { computeFeeWithPremium } from '@/engine/compliance';

type When = 'always' | OutcomeTier[];

const SUCCESS_UP: OutcomeTier[] = ['SUCCESS', 'CRITICAL_SUCCESS'];
const CRITICAL: OutcomeTier[] = ['CRITICAL_SUCCESS'];
const FAILED: OutcomeTier[] = ['FAILURE', 'CRITICAL_FAILURE'];

export type BoardEffect =
  /** A named director leaves the board. `replace` opens the replacement picker. */
  | { kind: 'remove'; directorId: string; when: When; replace?: boolean }
  /** A named director takes a role: re-roled in place if seated, added if not. */
  | { kind: 'seat'; directorId: string; role: BoardRole; when: When }
  /** An unnamed appointment ("appoint a qualified chair"): the engine picks the
   *  best-qualified person in the event's primary domain. */
  | { kind: 'fillRole'; role: BoardRole; from: 'board' | 'pool' | 'either'; when: When; minRating?: number }
  /** A committee is established. */
  | { kind: 'committee'; committeeId: CommitteeId; when: When }
  /** A director stays on the board but is redesignated non-independent (e.g. past
   *  SGX's nine-year limit). Any role that needs independence is given up. */
  | { kind: 'redesignate'; directorId: string; when: When };

// ── The table ──────────────────────────────────────────────────────────────

/** Effects of choosing a specific strategy. */
export const STRATEGY_EFFECTS: Record<string, BoardEffect[]> = {
  // Harwick — the vacant Remuneration Committee chair actually gets filled
  event_01_a: [{ kind: 'fillRole', role: 'remChair', from: 'board', when: SUCCESS_UP }],
  event_01_b: [{ kind: 'fillRole', role: 'remChair', from: 'pool', when: SUCCESS_UP }],
  event_01_c: [{ kind: 'fillRole', role: 'remChair', from: 'board', when: SUCCESS_UP }],
  // Harwick — committing to an Energy Transition Committee forms it
  event_05_a: [{ kind: 'committee', committeeId: 'energyTransition', when: SUCCESS_UP }],
  event_12_c: [{ kind: 'committee', committeeId: 'energyTransition', when: SUCCESS_UP }],
  // Harwick AGM — Crane stands down
  event_09_b: [{ kind: 'remove', directorId: 'dir_08_crane', when: 'always' }],

  // Vantage — Nguyen leaves the Audit Chair
  vevent_01_a: [{ kind: 'remove', directorId: 'vdir_02_nguyen', when: SUCCESS_UP, replace: true }],

  // Meridian — Cavendish
  mevent_01_a: [{ kind: 'remove', directorId: 'mdir_cavendish', when: CRITICAL, replace: true }],
  mevent_08_a: [{ kind: 'remove', directorId: 'mdir_cavendish', when: 'always', replace: true }],
  // Meridian — chair succession
  mevent_14_a: [
    { kind: 'remove', directorId: 'mdir_mensah', when: SUCCESS_UP, replace: true },
    { kind: 'remove', directorId: 'mdir_osei_bonsu', when: CRITICAL },
  ],
  mevent_14_b: [{ kind: 'remove', directorId: 'mdir_mensah', when: SUCCESS_UP, replace: true }],
  mevent_14_d: [{ kind: 'seat', directorId: 'mdir_osei_bonsu', role: 'chair', when: 'always' }],

  // Rheinfeld — the Audit Committee chair is appointed; the CSRD committee is formed
  revent_01_a: [{ kind: 'fillRole', role: 'auditChair', from: 'either', when: SUCCESS_UP, minRating: 75 }],
  revent_03_b: [{ kind: 'committee', committeeId: 'csrd', when: SUCCESS_UP }],

  // SFG — the nine-year rule. Helena Soong can no longer be independent: she is
  // redesignated and gives up the Senior Independent Director role. With a
  // credible roadmap (a), an independent director steps up to take it.
  sfgevent_02_a: [
    { kind: 'redesignate', directorId: 'sfgdir_02_soong', when: 'always' },
    { kind: 'fillRole', role: 'sid', from: 'board', when: SUCCESS_UP },
  ],
  sfgevent_02_b: [{ kind: 'redesignate', directorId: 'sfgdir_02_soong', when: 'always' }],
  // SFG — Helena Soong retires
  sfgevent_02_c: [{ kind: 'remove', directorId: 'sfgdir_02_soong', when: 'always', replace: true }],
  sfgevent_13_c: [{ kind: 'remove', directorId: 'sfgdir_02_soong', when: 'always' }],
  // SFG — Board Risk Committee gets its own independent chair
  sfgevent_05_a: [{ kind: 'seat', directorId: 'sfgdir_07_anwar', role: 'riskChair', when: SUCCESS_UP }],
  // SFG — Sustainability Committee is formed with a named chair
  sfgevent_07_a: [
    { kind: 'committee', committeeId: 'sustainability', when: SUCCESS_UP },
    { kind: 'seat', directorId: 'sfgdir_16_krishnamurthy', role: 'sustainabilityChair', when: SUCCESS_UP },
  ],
  sfgevent_07_b: [
    { kind: 'committee', committeeId: 'sustainability', when: SUCCESS_UP },
    { kind: 'seat', directorId: 'sfgdir_17_ng', role: 'sustainabilityChair', when: SUCCESS_UP },
  ],
  // SFG — Temasek's second nominee
  sfgevent_08_b: [{ kind: 'seat', directorId: 'sfgdir_27_phua', role: 'ned', when: 'always' }],
  sfgevent_08_d: [{ kind: 'seat', directorId: 'sfgdir_27_phua', role: 'ned', when: 'always' }],
  // SFG — chair succession
  sfgevent_15_a: [
    { kind: 'remove', directorId: 'sfgdir_01_lim', when: SUCCESS_UP },
    { kind: 'seat', directorId: 'sfgdir_26_rajan', role: 'chair', when: SUCCESS_UP },
  ],
  sfgevent_15_b: [
    { kind: 'remove', directorId: 'sfgdir_01_lim', when: SUCCESS_UP },
    { kind: 'seat', directorId: 'sfgdir_19_rashid', role: 'chair', when: SUCCESS_UP },
  ],
  sfgevent_15_c: [
    { kind: 'remove', directorId: 'sfgdir_01_lim', when: 'always' },
    { kind: 'seat', directorId: 'sfgdir_02_soong', role: 'chair', when: 'always' },
  ],
};

/** Effects of an event's outcome whatever strategy was chosen. */
export const EVENT_EFFECTS: Record<string, BoardEffect[]> = {
  // The Charity Commission's removal Order
  mevent_08: [{ kind: 'remove', directorId: 'mdir_cavendish', when: FAILED, replace: true }],
  // Temasek exercises its second-nominee right over the board's head
  sfgevent_08: [{ kind: 'seat', directorId: 'sfgdir_27_phua', role: 'ned', when: FAILED }],
};

// ── Helpers ────────────────────────────────────────────────────────────────

const ROLE_TO_COMMITTEE: Partial<Record<BoardRole, CommitteeId>> = {
  auditChair: 'audit',
  remChair: 'remuneration',
  nomChair: 'nomination',
  safetyEnvChair: 'safetyEnvironment',
  energyTransitionChair: 'energyTransition',
  csrdChair: 'csrd',
  strategyChair: 'strategy',
  riskChair: 'risk',
  sustainabilityChair: 'sustainability',
};

const COMMITTEE_NAMES: Record<CommitteeId, string> = {
  audit: 'Audit Committee',
  remuneration: 'Remuneration Committee',
  nomination: 'Nomination Committee',
  safetyEnvironment: 'Safety & Environment Committee',
  energyTransition: 'Energy Transition Committee',
  csrd: 'CSRD / Sustainability Committee',
  strategy: 'Strategy Committee',
  risk: 'Board Risk Committee',
  sustainability: 'Sustainability Committee',
};

export function roleLabel(role: BoardRole, companyId?: string): string {
  const meridian = companyId === 'company_meridian';
  switch (role) {
    case 'chair': return meridian ? 'Chair of Trustees' : 'Chair';
    case 'auditChair': return meridian ? 'Finance & Risk Committee Chair' : 'Audit Committee Chair';
    case 'remChair': return companyId === 'company_vantage' ? 'Compensation Committee Chair' : 'Remuneration Committee Chair';
    case 'nomChair': return 'Nomination Committee Chair';
    case 'sid': return companyId === 'company_vantage' ? 'Lead Independent Director' : 'Senior Independent Director';
    case 'esgChair': return 'ESG Committee Chair';
    case 'riskChair': return 'Board Risk Committee Chair';
    case 'techChair': return 'Technology Committee Chair';
    case 'safetyEnvChair': return 'Safety & Environment Committee Chair';
    case 'energyTransitionChair': return 'Energy Transition Committee Chair';
    case 'csrdChair': return 'CSRD Committee Chair';
    case 'strategyChair': return 'Strategy Committee Chair';
    case 'sustainabilityChair': return 'Sustainability Committee Chair';
    default: return meridian ? 'trustee' : 'non-executive director';
  }
}

function withSeats(state: GameState, seats: BoardSeat[]): GameState {
  const total = seats.reduce((sum, s) => sum + s.feeWithPremium, 0);
  return {
    ...state,
    board: {
      ...state.board,
      seats,
      totalCommittedBudget: total,
      remainingBudget: state.company.boardBudget - total,
    },
  };
}

/** Committee chairs are derived from seats. Call after ANY seat change so a
 *  departed director is never still counted as chairing a committee. */
export function syncCommitteeChairs(state: GameState): GameState {
  const seats = state.board.seats;
  const holder = (role: BoardRole) => seats.find((s) => s.role === role)?.directorId ?? null;
  const committees = { ...state.committees } as Record<CommitteeId, CommitteeState>;
  for (const [role, committeeId] of Object.entries(ROLE_TO_COMMITTEE) as [BoardRole, CommitteeId][]) {
    const current = committees[committeeId];
    if (!current) continue;
    const chairId = holder(role);
    // The Remuneration Committee only exists once it has a chair.
    const active = committeeId === 'remuneration' ? current.active || chairId !== null : current.active;
    committees[committeeId] = { ...current, active, chairDirectorId: chairId };
  }
  // SFG: Dato' Lim chairs the board AND the Board Risk Committee until someone
  // else is given the risk chair. This dual role is what sfgevent_05/08/15 are about.
  if (state.company.id === 'company_sfg' && committees.risk && !committees.risk.chairDirectorId) {
    const limChairs = seats.some((s) => s.directorId === 'sfgdir_01_lim' && s.role === 'chair');
    if (limChairs) committees.risk = { ...committees.risk, chairDirectorId: 'sfgdir_01_lim' };
  }
  return { ...state, committees };
}

function isProtected(directorId: string): boolean {
  return directorId.startsWith('rdir_w_') || directorId === 'rdir_heinrich';
}

function ensureDirector(state: GameState, directorId: string): GameState {
  if (state.directors.some((d) => d.id === directorId)) return state;
  const raw = allDirectorsRaw.find((d) => d.id === directorId);
  return raw ? { ...state, directors: [...state.directors, { ...raw }] } : state;
}

function nameOf(state: GameState, directorId: string): string {
  return state.directors.find((d) => d.id === directorId)?.name ?? 'A director';
}

function matches(when: When, tier: OutcomeTier): boolean {
  return when === 'always' || when.includes(tier);
}

/** Seat a director in a role. Whoever held a unique chair role before is
 *  stepped back to an ordinary seat. */
function seatDirector(state: GameState, directorId: string, role: BoardRole): GameState {
  const director = state.directors.find((d) => d.id === directorId);
  if (!director) return state;
  const fee = state.company.boardBudget === 0 ? 0 : computeFeeWithPremium(director.annualFee, role);
  let seats = state.board.seats.map((s) =>
    role !== 'ned' && s.role === role && s.directorId !== directorId
      ? { ...s, role: 'ned' as BoardRole, feeWithPremium: feeFor(state, s.directorId, 'ned', s.feeWithPremium) }
      : s
  );
  if (seats.some((s) => s.directorId === directorId)) {
    seats = seats.map((s) => (s.directorId === directorId ? { ...s, role, feeWithPremium: fee } : s));
  } else {
    seats = [...seats, { directorId, role, feeWithPremium: fee }];
  }
  return withSeats(state, seats);
}

function feeFor(state: GameState, directorId: string, role: BoardRole, fallback: number): number {
  if (state.company.boardBudget === 0) return 0;
  const d = state.directors.find((x) => x.id === directorId);
  return d ? computeFeeWithPremium(d.annualFee, role) : fallback;
}

function pickForRole(
  state: GameState,
  domain: CompetencyDomain,
  from: 'board' | 'pool' | 'either',
  role: BoardRole,
  minRating: number
): string | null {
  const rating = (d: Director) => d.domainRatings[domain] ?? 0;
  const best = (list: Director[]) => [...list].sort((a, b) => rating(b) - rating(a))[0] ?? null;

  const seatedIds = new Set(state.board.seats.map((s) => s.directorId));
  // A Senior / Lead Independent Director has to be independent.
  const eligible = (d: Director) => role !== 'sid' || d.independence === 'independent';
  const boardNeds = state.board.seats
    .filter((s) => s.role === 'ned' && !isProtected(s.directorId))
    .map((s) => state.directors.find((d) => d.id === s.directorId))
    .filter((d): d is Director => !!d && eligible(d));
  const budget = state.company.boardBudget;
  const pool = state.directors.filter(
    (d) =>
      !seatedIds.has(d.id) &&
      !isProtected(d.id) &&
      eligible(d) &&
      state.company.directorIds.includes(d.id) &&
      !state.company.excludeDirectorIds.includes(d.id) &&
      (budget === 0 || computeFeeWithPremium(d.annualFee, role) <= state.board.remainingBudget)
  );

  const fromBoard = best(boardNeds);
  const fromPool = best(pool);
  if (from === 'board') return (fromBoard ?? fromPool)?.id ?? null;
  if (from === 'pool') return (fromPool ?? fromBoard)?.id ?? null;
  // either: an insider who clears the bar, else the stronger of the two
  if (fromBoard && rating(fromBoard) >= minRating) return fromBoard.id;
  if (fromPool && (!fromBoard || rating(fromPool) > rating(fromBoard))) return fromPool.id;
  return fromBoard?.id ?? null;
}

// ── Apply ──────────────────────────────────────────────────────────────────

export interface BoardEffectResult {
  state: GameState;
  /** Plain-English lines describing each change that actually happened. */
  notes: string[];
  /** A departed director whose seat the player should now refill. */
  vacancy: { directorId: string; directorName: string; role: BoardRole } | null;
}

export function applyBoardEffects(
  state: GameState,
  event: GameEvent,
  strategyId: string,
  tier: OutcomeTier
): BoardEffectResult {
  const effects = [...(STRATEGY_EFFECTS[strategyId] ?? []), ...(EVENT_EFFECTS[event.id] ?? [])];
  const companyId = state.company.id;
  const notes: string[] = [];
  let vacancy: BoardEffectResult['vacancy'] = null;
  let next = state;

  for (const effect of effects) {
    if (!matches(effect.when, tier)) continue;

    if (effect.kind === 'remove') {
      const seat = next.board.seats.find((s) => s.directorId === effect.directorId);
      if (!seat) continue;
      const name = nameOf(next, effect.directorId);
      next = withSeats(next, next.board.seats.filter((s) => s.directorId !== effect.directorId));
      notes.push(
        seat.role === 'ned'
          ? `${name} has left the board.`
          : `${name} has left the board. The ${roleLabel(seat.role, companyId)} seat is vacant.`
      );
      if (effect.replace && !vacancy) {
        vacancy = { directorId: effect.directorId, directorName: name, role: seat.role };
      }
    } else if (effect.kind === 'seat') {
      next = ensureDirector(next, effect.directorId);
      const existing = next.board.seats.find((s) => s.directorId === effect.directorId);
      if (existing?.role === effect.role) continue;
      const name = nameOf(next, effect.directorId);
      next = seatDirector(next, effect.directorId, effect.role);
      if (vacancy && vacancy.role === effect.role) vacancy = null;
      notes.push(
        existing
          ? `${name} is now ${roleLabel(effect.role, companyId)}.`
          : effect.role === 'ned'
            ? `${name} has joined the board.`
            : `${name} has joined the board as ${roleLabel(effect.role, companyId)}.`
      );
    } else if (effect.kind === 'fillRole') {
      if (next.board.seats.some((s) => s.role === effect.role)) continue;
      const pick = pickForRole(next, event.primaryDomain, effect.from, effect.role, effect.minRating ?? 0);
      if (!pick) continue;
      const wasSeated = next.board.seats.some((s) => s.directorId === pick);
      next = seatDirector(next, pick, effect.role);
      notes.push(
        wasSeated
          ? `${nameOf(next, pick)} has been appointed ${roleLabel(effect.role, companyId)}.`
          : `${nameOf(next, pick)} has joined the board as ${roleLabel(effect.role, companyId)}.`
      );
    } else if (effect.kind === 'redesignate') {
      const seat = next.board.seats.find((s) => s.directorId === effect.directorId);
      const director = next.directors.find((d) => d.id === effect.directorId);
      if (!seat || !director || director.independence === 'non-independent') continue;
      next = {
        ...next,
        directors: next.directors.map((d) => (d.id === effect.directorId ? { ...d, independence: 'non-independent' as const } : d)),
      };
      // Roles that require independence are given up.
      const needsIndependence = seat.role === 'sid' || seat.role === 'auditChair';
      if (needsIndependence) {
        const vacated = roleLabel(seat.role, companyId);
        next = seatDirector(next, effect.directorId, 'ned');
        notes.push(`${director.name} is now a non-independent director. The ${vacated} seat is vacant.`);
      } else {
        notes.push(`${director.name} is now a non-independent director.`);
      }
    } else if (effect.kind === 'committee') {
      const current = next.committees[effect.committeeId];
      if (current?.active) continue;
      next = {
        ...next,
        committees: {
          ...next.committees,
          [effect.committeeId]: { active: true, chairDirectorId: current?.chairDirectorId ?? null },
        },
      };
      notes.push(`The ${COMMITTEE_NAMES[effect.committeeId]} has been established.`);
    }
  }

  if (notes.length > 0) next = syncCommitteeChairs(next);
  // A seat vacated and refilled in the same breath is not "vacant".
  const tidied = notes.map((n) => {
    const m = n.match(/^(.*?) The (.+) seat is vacant\.$/);
    if (!m) return n;
    const stillVacant = !next.board.seats.some((s) => roleLabel(s.role, companyId) === m[2]);
    return stillVacant ? n : m[1];
  });
  return { state: next, notes: tidied, vacancy };
}
