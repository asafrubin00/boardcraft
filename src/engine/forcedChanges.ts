// ── Forced Mid-Game Director Changes ──

import type { GameState, ForcedDirectorChange, BoardSeat, Director, OutcomeTier } from '@/types/game';
import { computeFeeWithPremium } from '@/engine/compliance';

// ── Seeded RNG helper ──
function seededRandom(seed: number): number {
  let s = seed | 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── FMC-01: Health Crisis (random, 15% per quarter after Q1, max once) ──

export function checkHealthCrisis(state: GameState): ForcedDirectorChange | null {
  if (state.healthCrisisFired) return null;
  if (state.currentQuarter === 'Q1') return null;
  if (state.forcedChange) return null; // already handling a forced change

  // 15% chance using seeded RNG
  const roll = seededRandom(state.randomSeed + 9999);
  if (roll >= 0.15) return null;

  // Select a random non-Chair, non-protected director from the board.
  // Worker reps (rdir_w_*) and locked directors (e.g. rdir_heinrich) are
  // protected — same pattern as revent_12's removal logic in page.tsx.
  const eligibleSeats = state.board.seats.filter(
    (s) =>
      s.role !== 'chair' &&
      !s.directorId.startsWith('rdir_w_') &&
      s.directorId !== 'rdir_heinrich'
  );
  if (eligibleSeats.length === 0) return null;

  const idx = Math.floor(seededRandom(state.randomSeed + 10000) * eligibleSeats.length);
  const targetSeat = eligibleSeats[idx];
  const director = state.directors.find((d) => d.id === targetSeat.directorId);
  if (!director) return null;

  return {
    type: 'health_crisis',
    directorId: director.id,
    directorName: director.name,
    turnsRemaining: 2,
    narrative: `${director.name} has suffered a serious health episode and has submitted their resignation with immediate effect. You have two turns to find a replacement.`,
  };
}

// ── FMC-02: Misconduct (Risk Flag Activation) ──

/** Stable per-director hash so different directors get independent rolls */
function hashDirectorId(dirId: string): number {
  let h = 0;
  for (let i = 0; i < dirId.length; i++) {
    h = (h * 31 + dirId.charCodeAt(i)) | 0;
  }
  return h;
}

export function checkMisconduct(
  state: GameState,
  deployedDirectorIds: string[],
  /** Domains of the event being resolved — a flag only fires on events
   *  whose domains overlap the flag's triggerCategories. */
  eventDomains?: string[]
): ForcedDirectorChange | null {
  if (state.forcedChange) return null;

  for (const dirId of deployedDirectorIds) {
    const director = state.directors.find((d) => d.id === dirId);
    if (!director?.riskFlag) continue;
    if (director.riskFlag.activated) continue; // already activated

    // The flag is only at risk of surfacing on events related to its trigger
    // categories (e.g. a regulatory flag stays dormant on a tech event).
    if (eventDomains && eventDomains.length > 0) {
      const related = director.riskFlag.triggerCategories.some((c) =>
        eventDomains.includes(c)
      );
      if (!related) continue;
    }

    // activationProbability is stored as a percentage (e.g. 40 = 40%);
    // seededRandom returns 0–1, so scale the roll to match.
    const roll = seededRandom(state.randomSeed + hashDirectorId(dirId));
    if (roll * 100 < director.riskFlag.activationProbability) {
      return {
        type: 'misconduct',
        directorId: director.id,
        directorName: director.name,
        turnsRemaining: 1,
        narrative: director.riskFlag.description,
        canRetain: true,
      };
    }
  }

  return null;
}

// ── Apply forced director removal ──

export function applyForcedRemoval(
  state: GameState,
  directorId: string
): GameState {
  const newSeats = state.board.seats.filter((s) => s.directorId !== directorId);
  const totalFee = newSeats.reduce((sum, s) => sum + s.feeWithPremium, 0);

  return {
    ...state,
    board: {
      ...state.board,
      seats: newSeats,
      totalCommittedBudget: totalFee,
      remainingBudget: state.company.boardBudget - totalFee,
    },
  };
}

// ── Apply forced change retention (misconduct - keep director with penalties) ──

export function applyRetainDirector(state: GameState): GameState {
  // event_resolution retain = voluntary acceptance (no governance penalty)
  const ghPenalty = state.forcedChange?.type === 'event_resolution' ? 0 : 8;
  const newGH = Math.max(0, Math.min(100, state.governanceHealth - ghPenalty));

  // Activate the risk flag on the director
  const dirId = state.forcedChange?.directorId;
  const updatedDirectors = state.directors.map((d) => {
    if (d.id === dirId && d.riskFlag) {
      return { ...d, riskFlag: { ...d.riskFlag, activated: true } };
    }
    return d;
  });

  return {
    ...state,
    governanceHealth: newGH,
    directors: updatedDirectors,
    forcedChange: null,
  };
}

// ── Tick down forced change timer ──

export function tickForcedChangeTimer(state: GameState): GameState {
  if (!state.forcedChange) return state;

  const updated = {
    ...state.forcedChange,
    turnsRemaining: state.forcedChange.turnsRemaining - 1,
  };

  if (updated.turnsRemaining <= 0) {
    // Time expired - apply governance health penalty
    return {
      ...state,
      governanceHealth: Math.max(0, Math.min(100, state.governanceHealth - 10)),
      forcedChange: null,
    };
  }

  return {
    ...state,
    forcedChange: updated,
  };
}

// ── Apply replacement appointment ──

export function applyReplacement(
  state: GameState,
  newDirectorId: string,
  role: BoardSeat['role']
): GameState {
  const director = state.directors.find((d) => d.id === newDirectorId);
  if (!director) return state;

  const fee = computeFeeWithPremium(director.annualFee, role);

  const newSeat: BoardSeat = {
    directorId: newDirectorId,
    role,
    feeWithPremium: fee,
  };

  const newSeats = [...state.board.seats, newSeat];
  const totalFee = newSeats.reduce((sum, s) => sum + s.feeWithPremium, 0);

  return {
    ...state,
    board: {
      ...state.board,
      seats: newSeats,
      totalCommittedBudget: totalFee,
      remainingBudget: state.company.boardBudget - totalFee,
    },
    forcedChange: null,
  };
}

// ── SFG-01: Audit Committee Chair resignation (event firing) ──
// Triggered exactly once, when a fresh SFG game reaches Q1T1 — whoever the
// player assigned as AC Chair pre-lock resigns live, creating the vacancy
// sfgevent_01's narrative is actually about. Called from both
// page.tsx's handleStartGame and the ?dev=sfg-q1 shortcut, since it
// self-guards on company + quarter/turn it's safe to call unconditionally.
//
// Deliberately does NOT populate a forcedChange that drives the interactive
// ForcedChangeModal ("dismiss and replace") — that modal's generic
// pick-any-director flow would let the player fill the seat before ever
// seeing sfgevent_01's four curated strategies. type: 'resignation' is
// excluded from showForcedModal in page.tsx for exactly this reason; the
// forcedChange here exists only for the passive board-display/banner
// treatment (same visual language as health crisis) and is cleared the
// moment the event resolves. turnsRemaining is inert — the event always
// resolves same-turn, tickForcedChangeTimer never runs against it — set to
// 1 purely so the banner copy ("within N turns") doesn't imply a multi-turn
// window that doesn't exist.
export function applySfgAcChairResignation(state: GameState): GameState {
  if (state.company.id !== 'company_sfg') return state;
  if (state.currentQuarter !== 'Q1' || state.currentTurn !== 1) return state;
  if (state.forcedChange) return state;

  const acChairSeat = state.board.seats.find((s) => s.role === 'auditChair');
  if (!acChairSeat) return state; // defensive — SG-MAS-002 blocks locking without one

  const director = state.directors.find((d) => d.id === acChairSeat.directorId);
  if (!director) return state;

  const afterRemoval = applyForcedRemoval(state, director.id);

  return {
    ...afterRemoval,
    acChairVacant: true,
    committees: {
      ...afterRemoval.committees,
      audit: { active: true, chairDirectorId: null },
    },
    forcedChange: {
      type: 'resignation',
      directorId: director.id,
      directorName: director.name,
      turnsRemaining: 1,
      narrative: `${director.name} has resigned as Audit Committee Chair with immediate effect, citing a competing offer from a rival institution. MAS has been notified.`,
      canRetain: false,
    },
  };
}

// ── SFG-01: Audit Committee Chair appointment (event resolution) ──

/** Strategies with a single fixed appointee. sfgevent_01_b (Tan/Halliday) is
 *  resolved dynamically below since it has a built-in fallback pair. */
const SFG_AC_CHAIR_APPOINTEE_BY_STRATEGY: Partial<Record<string, string>> = {
  sfgevent_01_a: 'sfgdir_06_lee',    // Lee Siew Geok
  sfgevent_01_c: 'sfgdir_04_rahman', // Dr. Nadia Rahman — promoted from her existing seat
};

function resolveSfgEvent01Appointee(strategyId: string, state: GameState): string | null {
  if (strategyId === 'sfgevent_01_b') {
    // Margaret Tan or Robert Halliday — fall back to whichever wasn't the
    // resignee (mirrors Halliday's own bio: "backup if Lee Siew Geok or
    // Margaret Tan unavailable").
    const resignedId = state.forcedChange?.type === 'resignation' ? state.forcedChange.directorId : null;
    return resignedId === 'sfgdir_08_tan_margaret' ? 'sfgdir_21_halliday' : 'sfgdir_08_tan_margaret';
  }
  return SFG_AC_CHAIR_APPOINTEE_BY_STRATEGY[strategyId] ?? null;
}

/** Applies sfgevent_01's board consequence. On SUCCESS/CRITICAL_SUCCESS the
 *  chosen strategy's appointee takes the AC Chair seat (reassigned in place
 *  if already seated, otherwise added). On PARTIAL_SUCCESS/FAILURE/
 *  CRITICAL_FAILURE — including strategy D's extension request — the seat
 *  stays vacant: acChairVacant remains true and committees.audit.chairDirectorId
 *  stays null, which is now a legitimate, board-state-true consequence (it
 *  drives the AGM Resolution 2 penalty) rather than the old unconditional bug.
 *  Always clears forcedChange — the resignation crisis is settled either way. */
export function applySfgAcChairAppointment(
  state: GameState,
  strategyId: string,
  outcomeTier: OutcomeTier
): GameState {
  const appointed = outcomeTier === 'SUCCESS' || outcomeTier === 'CRITICAL_SUCCESS';
  const appointeeId = appointed ? resolveSfgEvent01Appointee(strategyId, state) : null;

  if (!appointeeId) {
    return {
      ...state,
      acChairVacant: true,
      committees: { ...state.committees, audit: { active: true, chairDirectorId: null } },
      forcedChange: null,
    };
  }

  let next: GameState;
  const existingSeat = state.board.seats.find((s) => s.directorId === appointeeId);

  if (existingSeat) {
    // Already seated (e.g. promoting Rahman) — reassign role in place rather
    // than adding a duplicate seat.
    const director = state.directors.find((d) => d.id === appointeeId);
    const fee = director ? computeFeeWithPremium(director.annualFee, 'auditChair') : existingSeat.feeWithPremium;
    const newSeats = state.board.seats.map((s) =>
      s.directorId === appointeeId ? { ...s, role: 'auditChair' as const, feeWithPremium: fee } : s
    );
    const totalFee = newSeats.reduce((sum, s) => sum + s.feeWithPremium, 0);
    next = {
      ...state,
      board: {
        ...state.board,
        seats: newSeats,
        totalCommittedBudget: totalFee,
        remainingBudget: state.company.boardBudget - totalFee,
      },
    };
  } else {
    next = applyReplacement(state, appointeeId, 'auditChair');
  }

  return {
    ...next,
    acChairVacant: false,
    committees: { ...next.committees, audit: { active: true, chairDirectorId: appointeeId } },
    forcedChange: null,
  };
}
