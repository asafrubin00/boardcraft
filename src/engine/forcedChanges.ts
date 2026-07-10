// ── Forced Mid-Game Director Changes ──

import type { GameState, ForcedDirectorChange, BoardSeat, Director } from '@/types/game';

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

  const { computeFeeWithPremium } = require('@/engine/compliance');
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
