import { describe, it, expect } from 'vitest';
import {
  applyForcedRemoval,
  applyRetainDirector,
  tickForcedChangeTimer,
} from '../forcedChanges';
import type { GameState, BoardSeat, Director, ForcedDirectorChange } from '@/types/game';

// ── Minimal GameState factory ────────────────────────────────────────────────

function stubDirector(id: string, tenure = 3, fee = 100_000): Director {
  return {
    id,
    name: `Director ${id}`,
    background: '',
    domainRatings: {
      financialOversight: 70, regulatoryLegal: 70, strategyMarkets: 70,
      peopleCulture: 70, esgSustainability: 70, geopoliticalMacro: 70,
      technologyDigital: 70, stakeholderComms: 70,
    },
    jurisdictionScores: {},
    independence: 'independent',
    tenure,
    annualFee: fee,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: '',
    inherited: false,
  };
}

function stubSeat(directorId: string, role: BoardSeat['role'] = 'ned', fee = 100_000): BoardSeat {
  return { directorId, role, feeWithPremium: fee };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  const seats: BoardSeat[] = [
    stubSeat('dir_a', 'chair', 150_000),
    stubSeat('dir_b', 'ned',   100_000),
    stubSeat('dir_c', 'ned',   100_000),
  ];
  const directors = [stubDirector('dir_a'), stubDirector('dir_b'), stubDirector('dir_c')];
  const budget = 500_000;
  const committed = seats.reduce((s, x) => s + x.feeWithPremium, 0);

  return {
    company: {
      id: 'company_harwick',
      name: 'Harwick Energy',
      jurisdiction: 'UK',
      boardBudget: budget,
      sectors: [],
      primaryDomain: 'strategyMarkets',
      sectorSkillRequirements: {},
      description: '',
      committees: [],
      candidatePool: [],
    } as unknown as GameState['company'],
    board: {
      seats,
      totalCommittedBudget: committed,
      remainingBudget: budget - committed,
      complianceErrors: [],
    },
    directors,
    directorDynamics: [],
    svIndex: 50,
    governanceHealth: 70,
    governanceHealthBreakdown: {} as GameState['governanceHealthBreakdown'],
    boardTension: 0,
    currentQuarter: 'Q1',
    currentTurn: 1,
    eventQueue: [],
    resolvedEvents: [],
    boardLocked: true,
    phase: 'gameplay',
    committees: {
      audit: { active: true, chairDirectorId: null },
      remuneration: { active: true, chairDirectorId: null },
      nomination: { active: true, chairDirectorId: null },
      safetyEnvironment: { active: false, chairDirectorId: null },
      energyTransition: { active: false, chairDirectorId: null },
      csrd: { active: false, chairDirectorId: null },
      strategy: { active: false, chairDirectorId: null },
      risk: { active: false, chairDirectorId: null },
      sustainability: { active: false, chairDirectorId: null },
    },
    randomSeed: 42,
    apexStatus: 'monitoring',
    chairCeoSeparationProgress: 0,
    apexActive: false,
    fdaInquiryActive: false,
    forcedChange: null,
    healthCrisisFired: false,
    heinrichConflictRevealed: false,
    workerRepRelations: 'neutral',
    csrdProgress: 0,
    meridianActive: false,
    meridianStatus: 'watching',
    missionIntegrityScore: 60,
    founderSyndromeScore: 0,
    charityCommissionInquiryActive: false,
    solvencyRisk: false,
    acChairVacant: false,
    masLetterOpen: false,
    ceoWhistleblower: null,
    pendingBoardNotification: null,
    ...overrides,
  };
}

function stubForcedChange(overrides: Partial<ForcedDirectorChange> = {}): ForcedDirectorChange {
  return {
    type: 'misconduct',
    directorId: 'dir_b',
    directorName: 'Director dir_b',
    turnsRemaining: 2,
    narrative: 'Test narrative',
    ...overrides,
  };
}

// ── applyForcedRemoval ───────────────────────────────────────────────────────

describe('applyForcedRemoval', () => {
  it('removes the specified director from board seats', () => {
    const state = makeState();
    const result = applyForcedRemoval(state, 'dir_b');
    expect(result.board.seats.map((s) => s.directorId)).not.toContain('dir_b');
    expect(result.board.seats).toHaveLength(2);
  });

  it('leaves other seats untouched', () => {
    const state = makeState();
    const result = applyForcedRemoval(state, 'dir_b');
    expect(result.board.seats.map((s) => s.directorId)).toContain('dir_a');
    expect(result.board.seats.map((s) => s.directorId)).toContain('dir_c');
  });

  it('recalculates budget correctly after removal', () => {
    const state = makeState();
    // dir_a=150k, dir_b=100k, dir_c=100k → remove dir_b → committed=250k
    const result = applyForcedRemoval(state, 'dir_b');
    expect(result.board.totalCommittedBudget).toBe(250_000);
    expect(result.board.remainingBudget).toBe(250_000); // 500k budget - 250k
  });

  it('applying twice removes both directors (simultaneousRemoveIds pattern)', () => {
    const state = makeState();
    const after1 = applyForcedRemoval(state, 'dir_b');
    const after2 = applyForcedRemoval(after1, 'dir_c');
    expect(after2.board.seats).toHaveLength(1);
    expect(after2.board.seats[0].directorId).toBe('dir_a');
    expect(after2.board.totalCommittedBudget).toBe(150_000);
  });

  it('is a no-op when director is not seated', () => {
    const state = makeState();
    const result = applyForcedRemoval(state, 'dir_nonexistent');
    expect(result.board.seats).toHaveLength(3);
    expect(result.board.totalCommittedBudget).toBe(350_000);
  });

  it('does not mutate the input state', () => {
    const state = makeState();
    const originalSeats = state.board.seats;
    applyForcedRemoval(state, 'dir_b');
    expect(state.board.seats).toBe(originalSeats);
  });
});

// ── applyRetainDirector — GH penalty rules ──────────────────────────────────

describe('applyRetainDirector', () => {
  it('applies -8 GH penalty for misconduct retain', () => {
    const state = makeState({
      governanceHealth: 70,
      forcedChange: stubForcedChange({ type: 'misconduct' }),
    });
    const result = applyRetainDirector(state);
    expect(result.governanceHealth).toBe(62);
  });

  it('applies -8 GH penalty for regulatory_disqualification retain', () => {
    const state = makeState({
      governanceHealth: 70,
      forcedChange: stubForcedChange({ type: 'regulatory_disqualification' }),
    });
    const result = applyRetainDirector(state);
    expect(result.governanceHealth).toBe(62);
  });

  it('applies NO GH penalty for event_resolution retain (canRetain accept path)', () => {
    // mevent_09: Osei-Bonsu accepts code-of-conduct — this is not a governance failure
    const state = makeState({
      governanceHealth: 70,
      forcedChange: stubForcedChange({ type: 'event_resolution', canRetain: true }),
    });
    const result = applyRetainDirector(state);
    expect(result.governanceHealth).toBe(70);
  });

  it('clears forcedChange after retain regardless of type', () => {
    for (const type of ['misconduct', 'event_resolution', 'health_crisis'] as const) {
      const state = makeState({
        forcedChange: stubForcedChange({ type }),
      });
      const result = applyRetainDirector(state);
      expect(result.forcedChange).toBeNull();
    }
  });

  it('clamps GH at 0 when penalty would go negative', () => {
    const state = makeState({
      governanceHealth: 4,
      forcedChange: stubForcedChange({ type: 'misconduct' }),
    });
    const result = applyRetainDirector(state);
    expect(result.governanceHealth).toBe(0);
  });
});

// ── tickForcedChangeTimer ────────────────────────────────────────────────────

describe('tickForcedChangeTimer', () => {
  it('decrements turnsRemaining by 1', () => {
    const state = makeState({ forcedChange: stubForcedChange({ turnsRemaining: 2 }) });
    const result = tickForcedChangeTimer(state);
    expect(result.forcedChange?.turnsRemaining).toBe(1);
  });

  it('clears forcedChange and applies -10 GH when timer expires', () => {
    const state = makeState({
      governanceHealth: 70,
      forcedChange: stubForcedChange({ turnsRemaining: 1 }),
    });
    const result = tickForcedChangeTimer(state);
    expect(result.forcedChange).toBeNull();
    expect(result.governanceHealth).toBe(60);
  });

  it('is a no-op when no forcedChange is set', () => {
    const state = makeState({ forcedChange: null });
    const result = tickForcedChangeTimer(state);
    expect(result.forcedChange).toBeNull();
    expect(result.governanceHealth).toBe(state.governanceHealth);
  });
});

// ── revent_12 removal logic ──────────────────────────────────────────────────

describe('revent_12 lowest-tenure removal rule', () => {
  // The play/page.tsx handler picks the two seats with lowest tenure,
  // excluding worker reps (rdir_w_*) and Heinrich (rdir_heinrich).
  // Verify the underlying selection logic with a pure simulation.

  it('selects the two shortest-tenured non-protected seats', () => {
    const seats: BoardSeat[] = [
      stubSeat('rdir_heinrich', 'chair'),
      stubSeat('rdir_w_001', 'ned'),
      stubSeat('rdir_short_1', 'ned'), // tenure 1
      stubSeat('rdir_short_2', 'ned'), // tenure 2
      stubSeat('rdir_long', 'ned'),    // tenure 10
    ];
    const directors: Director[] = [
      stubDirector('rdir_heinrich', 15),
      stubDirector('rdir_w_001', 5),
      stubDirector('rdir_short_1', 1),
      stubDirector('rdir_short_2', 2),
      stubDirector('rdir_long', 10),
    ];

    const removableSeats = seats.filter(
      (s) => !s.directorId.startsWith('rdir_w_') && s.directorId !== 'rdir_heinrich'
    );
    const toRemove = removableSeats
      .map((s) => ({
        id: s.directorId,
        tenure: directors.find((d) => d.id === s.directorId)?.tenure ?? 999,
      }))
      .sort((a, b) => a.tenure - b.tenure)
      .slice(0, 2);

    expect(toRemove.map((x) => x.id)).toEqual(['rdir_short_1', 'rdir_short_2']);
  });

  it('never selects worker reps or Heinrich', () => {
    const seats: BoardSeat[] = [
      stubSeat('rdir_heinrich', 'chair'),
      stubSeat('rdir_w_001', 'ned'),
      stubSeat('rdir_w_002', 'ned'),
      stubSeat('rdir_eligible', 'ned'),
    ];
    const directors: Director[] = [
      stubDirector('rdir_heinrich', 0),
      stubDirector('rdir_w_001', 0),
      stubDirector('rdir_w_002', 0),
      stubDirector('rdir_eligible', 5),
    ];

    const removableSeats = seats.filter(
      (s) => !s.directorId.startsWith('rdir_w_') && s.directorId !== 'rdir_heinrich'
    );
    const toRemove = removableSeats
      .map((s) => ({
        id: s.directorId,
        tenure: directors.find((d) => d.id === s.directorId)?.tenure ?? 999,
      }))
      .sort((a, b) => a.tenure - b.tenure)
      .slice(0, 2);

    expect(toRemove.map((x) => x.id)).toEqual(['rdir_eligible']);
    expect(toRemove.map((x) => x.id)).not.toContain('rdir_heinrich');
    expect(toRemove.map((x) => x.id)).not.toContain('rdir_w_001');
  });
});
