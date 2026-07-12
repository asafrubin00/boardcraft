import { describe, it, expect } from 'vitest';
import { checkEventPrecondition, getCurrentEvent, resolveSfgEvent01Event, applyRheinfeldFlagUpdates, applyVantageFlagUpdates } from '../gameStateManager';
import { meridianEvents } from '@/data/meridian/events';
import { rheinfeldEvents } from '@/data/rheinfeld/events';
import { vantageEvents } from '@/data/vantage/events';
import { sfgEvents } from '@/data/sfg/events';
import { meridianFoundation } from '@/data/meridian/company';
import { rheinfeldAG } from '@/data/rheinfeld/company';
import { vantageConsumer } from '@/data/vantage/company';
import { straitsFinancialGroup } from '@/data/sfg/company';
import type { GameState, BoardSeat, Director, ResolvedEvent } from '@/types/game';

// ── Minimal GameState factory ────────────────────────────────────────────────

function stubDirector(id: string, tenure = 3): Director {
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
    annualFee: 100_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: '',
    inherited: false,
  };
}

function stubSeat(directorId: string, role: BoardSeat['role'] = 'ned'): BoardSeat {
  return { directorId, role, feeWithPremium: 100_000 };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    company: { id: 'company_meridian' } as unknown as GameState['company'],
    board: {
      seats: [],
      totalCommittedBudget: 0,
      remainingBudget: 0,
      complianceErrors: [],
    },
    directors: [],
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

function stubResolvedEvent(eventId: string, outcomeTier: ResolvedEvent['outcomeTier']): ResolvedEvent {
  return {
    eventId,
    outcomeTier,
    svDelta: 0,
    deployedDirectorIds: [],
    strategyChosen: `${eventId}_a`,
    resolvedAtTurn: 1,
    resolvedAtQuarter: 'Q1',
  };
}

function findEvent(events: { id: string }[], id: string) {
  const event = events.find((e) => e.id === id);
  if (!event) throw new Error(`event ${id} not found`);
  return event as Parameters<typeof checkEventPrecondition>[0];
}

// ── Meridian ─────────────────────────────────────────────────────────────────

describe('Meridian board-state preconditions', () => {
  const mevent01 = findEvent(meridianEvents, 'mevent_01');
  const mevent03 = findEvent(meridianEvents, 'mevent_03');
  const mevent04 = findEvent(meridianEvents, 'mevent_04');
  const mevent08 = findEvent(meridianEvents, 'mevent_08');
  const mevent09 = findEvent(meridianEvents, 'mevent_09');
  const mevent14 = findEvent(meridianEvents, 'mevent_14');

  it('mevent_01 does not fire when Cavendish is removed pre-lock (full integration: Meridian never sees mevent_01)', () => {
    const seatsWithoutCavendish: BoardSeat[] = meridianFoundation.inheritedBoard
      .filter((s) => s.directorId !== 'mdir_cavendish')
      .map((s) => ({ directorId: s.directorId, role: s.role, feeWithPremium: s.baseFee }));
    const state = makeState({
      company: meridianFoundation,
      board: { seats: seatsWithoutCavendish, totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      currentQuarter: 'Q1',
      currentTurn: 1,
    });
    expect(checkEventPrecondition(mevent01, state)).toBe(false);
    expect(getCurrentEvent(state)).toBeNull();
  });

  it('mevent_01 fires when Cavendish chairs Finance & Risk (audit)', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_cavendish', 'auditChair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(mevent01, state)).toBe(true);
  });

  it('mevent_01 does not fire when Cavendish is seated but not chairing audit', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_cavendish', 'ned')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(mevent01, state)).toBe(false);
  });

  it('mevent_03 does not fire when Osei-Bonsu is removed pre-lock', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_mensah', 'chair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(mevent03, state)).toBe(false);
  });

  it('mevent_04 does not fire when the People & Culture (remuneration) chair is vacant', () => {
    const state = makeState({
      committees: {
        ...makeState().committees,
        remuneration: { active: true, chairDirectorId: null },
      },
    });
    expect(checkEventPrecondition(mevent04, state)).toBe(false);
  });

  it('mevent_04 fires when the People & Culture chair is filled', () => {
    const state = makeState({
      committees: {
        ...makeState().committees,
        remuneration: { active: true, chairDirectorId: 'mdir_ashworth' },
      },
    });
    expect(checkEventPrecondition(mevent04, state)).toBe(true);
  });

  it('mevent_08 does not fire when Cavendish was removed after mevent_01 resolved partial/worse', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_mensah', 'chair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      resolvedEvents: [stubResolvedEvent('mevent_01', 'FAILURE')],
    });
    expect(checkEventPrecondition(mevent08, state)).toBe(false);
  });

  it('mevent_08 fires when Cavendish is still seated and mevent_01 resolved partial/worse', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_cavendish', 'ned')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      resolvedEvents: [stubResolvedEvent('mevent_01', 'FAILURE')],
    });
    expect(checkEventPrecondition(mevent08, state)).toBe(true);
  });

  it('mevent_09 does not fire when Osei-Bonsu was removed, even with Founder Syndrome Score > 60', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_mensah', 'chair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      founderSyndromeScore: 75,
    });
    expect(checkEventPrecondition(mevent09, state)).toBe(false);
  });

  it('mevent_14 does not fire when Mensah is no longer chair', () => {
    const state = makeState({
      board: {
        seats: [stubSeat('mdir_mensah', 'ned'), stubSeat('mdir_osei_bonsu', 'ned')],
        totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [],
      },
    });
    expect(checkEventPrecondition(mevent14, state)).toBe(false);
  });

  it('mevent_14 does not fire when Osei-Bonsu was removed, even if Mensah is still chair', () => {
    const state = makeState({
      board: { seats: [stubSeat('mdir_mensah', 'chair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(mevent14, state)).toBe(false);
  });

  it('mevent_14 fires when Mensah is chair and Osei-Bonsu is seated', () => {
    const state = makeState({
      board: {
        seats: [stubSeat('mdir_mensah', 'chair'), stubSeat('mdir_osei_bonsu', 'ned')],
        totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [],
      },
    });
    expect(checkEventPrecondition(mevent14, state)).toBe(true);
  });
});

// ── Rheinfeld ────────────────────────────────────────────────────────────────

describe('Rheinfeld board-state preconditions', () => {
  const revent01 = findEvent(rheinfeldEvents, 'revent_01');

  it('revent_01 does not fire when the Audit Committee Chair was filled pre-lock (full integration: Rheinfeld never sees revent_01)', () => {
    const seatsWithAuditChair = [
      ...rheinfeldAG.inheritedBoard,
      { directorId: 'rdir_01_lehrmann', role: 'auditChair' as const, baseFee: 90_000 },
    ].map((s) => ({ directorId: s.directorId, role: s.role, feeWithPremium: s.baseFee }));
    const state = makeState({
      company: rheinfeldAG,
      board: { seats: seatsWithAuditChair, totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      committees: {
        ...makeState().committees,
        audit: { active: true, chairDirectorId: 'rdir_01_lehrmann' },
      },
      currentQuarter: 'Q1',
      currentTurn: 1,
    });
    expect(checkEventPrecondition(revent01, state)).toBe(false);
    expect(getCurrentEvent(state)).toBeNull();
  });

  it('revent_01 fires when the Audit Committee Chair is genuinely vacant', () => {
    const state = makeState({
      company: { id: 'company_rheinfeld' } as unknown as GameState['company'],
      committees: {
        ...makeState().committees,
        audit: { active: true, chairDirectorId: null },
      },
    });
    expect(checkEventPrecondition(revent01, state)).toBe(true);
  });
});

describe('applyRheinfeldFlagUpdates: heinrichConflictRevealed', () => {
  it('sets heinrichConflictRevealed on every outcome tier of revent_11', () => {
    const tiers: ResolvedEvent['outcomeTier'][] = [
      'CRITICAL_SUCCESS', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE',
    ];
    for (const tier of tiers) {
      const state = makeState({ heinrichConflictRevealed: false });
      const updates = applyRheinfeldFlagUpdates(state, 'revent_11', tier);
      expect(updates.heinrichConflictRevealed).toBe(true);
    }
  });

  it('leaves heinrichConflictRevealed untouched for other events', () => {
    const state = makeState({ heinrichConflictRevealed: false });
    const updates = applyRheinfeldFlagUpdates(state, 'revent_02', 'CRITICAL_FAILURE');
    expect(updates.heinrichConflictRevealed).toBeUndefined();
  });
});

describe('applyRheinfeldFlagUpdates: meridianStatus escalation ladder', () => {
  it('revent_02 FAILURE/CRITICAL_FAILURE escalates watching -> escalating', () => {
    const failState = makeState({ meridianStatus: 'watching' });
    expect(applyRheinfeldFlagUpdates(failState, 'revent_02', 'FAILURE').meridianStatus).toBe('escalating');
    const critFailState = makeState({ meridianStatus: 'watching' });
    expect(applyRheinfeldFlagUpdates(critFailState, 'revent_02', 'CRITICAL_FAILURE').meridianStatus).toBe('escalating');
  });

  it('revent_02 SUCCESS/CRITICAL_SUCCESS de-escalates escalating -> watching', () => {
    const state = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(state, 'revent_02', 'SUCCESS').meridianStatus).toBe('watching');
    const csState = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(csState, 'revent_02', 'CRITICAL_SUCCESS').meridianStatus).toBe('watching');
  });

  it('revent_02 PARTIAL_SUCCESS leaves meridianStatus unchanged', () => {
    const state = makeState({ meridianStatus: 'escalating' });
    const updates = applyRheinfeldFlagUpdates(state, 'revent_02', 'PARTIAL_SUCCESS');
    expect(updates.meridianStatus).toBeUndefined();
  });

  it('revent_08 escalates on bad outcomes but never de-escalates on good ones (report card is escalate-only)', () => {
    const badState = makeState({ meridianStatus: 'watching' });
    expect(applyRheinfeldFlagUpdates(badState, 'revent_08', 'CRITICAL_FAILURE').meridianStatus).toBe('escalating');

    const goodState = makeState({ meridianStatus: 'escalating' });
    const updates = applyRheinfeldFlagUpdates(goodState, 'revent_08', 'CRITICAL_SUCCESS');
    expect(updates.meridianStatus).toBeUndefined();
  });

  it('revent_09 (HV) CRITICAL_FAILURE escalates to escalating; SUCCESS de-escalates to watching', () => {
    const failState = makeState({ meridianStatus: 'watching' });
    expect(applyRheinfeldFlagUpdates(failState, 'revent_09', 'CRITICAL_FAILURE').meridianStatus).toBe('escalating');
    const successState = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(successState, 'revent_09', 'SUCCESS').meridianStatus).toBe('watching');
  });

  it('revent_12 FAILURE/CRITICAL_FAILURE escalates escalating -> hostile', () => {
    const state = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(state, 'revent_12', 'FAILURE').meridianStatus).toBe('hostile');
    const cfState = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(cfState, 'revent_12', 'CRITICAL_FAILURE').meridianStatus).toBe('hostile');
  });

  it('revent_12 SUCCESS/CRITICAL_SUCCESS (negotiated settlement) de-escalates to watching', () => {
    const state = makeState({ meridianStatus: 'escalating' });
    expect(applyRheinfeldFlagUpdates(state, 'revent_12', 'SUCCESS').meridianStatus).toBe('watching');
  });

  it('revent_12 PARTIAL_SUCCESS leaves meridianStatus unchanged (EGM proceeds, outcome uncertain)', () => {
    const state = makeState({ meridianStatus: 'escalating' });
    const updates = applyRheinfeldFlagUpdates(state, 'revent_12', 'PARTIAL_SUCCESS');
    expect(updates.meridianStatus).toBeUndefined();
  });

  it('guards escalation writes: a bad revent_02/08/09 outcome cannot downgrade an already-hostile status', () => {
    const state = makeState({ meridianStatus: 'hostile' });
    const updates = applyRheinfeldFlagUpdates(state, 'revent_02', 'CRITICAL_FAILURE');
    // escalateMeridianStatus targets 'escalating', which is a lower rank than 'hostile' —
    // guard must refuse the write rather than silently downgrading.
    expect(updates.meridianStatus).toBe('hostile');
  });

  it('guards de-escalation writes: a good revent_12 outcome cannot upgrade an already-watching status', () => {
    const state = makeState({ meridianStatus: 'watching' });
    const updates = applyRheinfeldFlagUpdates(state, 'revent_12', 'SUCCESS');
    expect(updates.meridianStatus).toBe('watching');
  });
});

// ── Rheinfeld: revent_12/14/15 reachability (previously dead — see gameStateManager
// applyRheinfeldFlagUpdates and its precondition cases 'meridianEGM'/'ceoConfidence'/'fullCrisis') ──

describe('Rheinfeld revent_12/14/15 reachability', () => {
  const revent12 = findEvent(rheinfeldEvents, 'revent_12');
  const revent14 = findEvent(rheinfeldEvents, 'revent_14');
  const revent15 = findEvent(rheinfeldEvents, 'revent_15');

  it('revent_12 fires once meridianStatus is escalating and governance health < 55, skips otherwise', () => {
    const reachable = makeState({
      company: rheinfeldAG,
      meridianActive: true,
      meridianStatus: 'escalating',
      governanceHealth: 50,
      currentQuarter: 'Q3',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent12, reachable)).toBe(true);
    expect(getCurrentEvent(reachable)?.id).toBe('revent_12');

    const stillWatching = makeState({
      company: rheinfeldAG,
      meridianActive: true,
      meridianStatus: 'watching',
      governanceHealth: 50,
      currentQuarter: 'Q3',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent12, stillWatching)).toBe(false);
    expect(getCurrentEvent(stillWatching)).toBeNull();

    const ghTooHigh = makeState({
      company: rheinfeldAG,
      meridianActive: true,
      meridianStatus: 'escalating',
      governanceHealth: 60,
      currentQuarter: 'Q3',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent12, ghTooHigh)).toBe(false);
  });

  it('revent_14 fires once heinrichConflictRevealed is true, skips otherwise', () => {
    const reachable = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: true,
      currentQuarter: 'Q4',
      currentTurn: 2,
    });
    expect(checkEventPrecondition(revent14, reachable)).toBe(true);
    expect(getCurrentEvent(reachable)?.id).toBe('revent_14');

    const notRevealed = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: false,
      currentQuarter: 'Q4',
      currentTurn: 2,
    });
    expect(checkEventPrecondition(revent14, notRevealed)).toBe(false);
    expect(getCurrentEvent(notRevealed)).toBeNull();
  });

  it('revent_15 fires only when revealed + hostile + GH < 45 all hold; skips if any one is missing', () => {
    const reachable = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: true,
      meridianStatus: 'hostile',
      governanceHealth: 40,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent15, reachable)).toBe(true);
    expect(getCurrentEvent(reachable)?.id).toBe('revent_15');

    const notRevealed = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: false,
      meridianStatus: 'hostile',
      governanceHealth: 40,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent15, notRevealed)).toBe(false);

    const notHostile = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: true,
      meridianStatus: 'escalating',
      governanceHealth: 40,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent15, notHostile)).toBe(false);

    const ghTooHigh = makeState({
      company: rheinfeldAG,
      heinrichConflictRevealed: true,
      meridianStatus: 'hostile',
      governanceHealth: 50,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(revent15, ghTooHigh)).toBe(false);
  });

  it('end-to-end: a rocky playthrough chains revent_02 -> revent_12 -> revent_11 into a reachable revent_15', () => {
    // Q1T2: revent_02 goes badly -> meridianStatus escalates from 'watching'.
    let state = makeState({ company: rheinfeldAG, meridianActive: true, governanceHealth: 50 });
    Object.assign(state, applyRheinfeldFlagUpdates(state, 'revent_02', 'CRITICAL_FAILURE'));
    expect(state.meridianStatus).toBe('escalating');

    // Q3T3: revent_12 is now reachable (escalating + GH < 55) and goes badly -> hostile.
    state = { ...state, currentQuarter: 'Q3', currentTurn: 3 };
    expect(checkEventPrecondition(revent12, state)).toBe(true);
    Object.assign(state, applyRheinfeldFlagUpdates(state, 'revent_12', 'FAILURE'), { governanceHealth: 40 });
    expect(state.meridianStatus).toBe('hostile');

    // Q3T2 (narratively earlier, applied here for state setup): revent_11 reveals the conflict.
    Object.assign(state, applyRheinfeldFlagUpdates(state, 'revent_11', 'PARTIAL_SUCCESS'));
    expect(state.heinrichConflictRevealed).toBe(true);

    // Q4T3: revent_15's fullCrisis gate is now satisfied.
    state = { ...state, currentQuarter: 'Q4', currentTurn: 3 };
    expect(checkEventPrecondition(revent15, state)).toBe(true);
    expect(getCurrentEvent(state)?.id).toBe('revent_15');
  });
});

// ── Vantage ──────────────────────────────────────────────────────────────────

describe('applyVantageFlagUpdates: apexStatus escalation ladder', () => {
  it('vevent_02 FAILURE/CRITICAL_FAILURE escalates monitoring -> escalating; SUCCESS/CRITICAL_SUCCESS de-escalates back', () => {
    const failState = makeState({ apexStatus: 'monitoring' });
    expect(applyVantageFlagUpdates(failState, 'vevent_02', 'vevent_02_d', 'CRITICAL_FAILURE').apexStatus).toBe('escalating');

    const successState = makeState({ apexStatus: 'escalating' });
    expect(applyVantageFlagUpdates(successState, 'vevent_02', 'vevent_02_a', 'SUCCESS').apexStatus).toBe('monitoring');
  });

  it('vevent_02 PARTIAL_SUCCESS leaves apexStatus unchanged', () => {
    const state = makeState({ apexStatus: 'escalating' });
    const updates = applyVantageFlagUpdates(state, 'vevent_02', 'vevent_02_b', 'PARTIAL_SUCCESS');
    expect(updates.apexStatus).toBeUndefined();
  });

  it('vevent_09 (AGM) also escalates on PARTIAL_SUCCESS ("guarantees six more months of activist pressure")', () => {
    const state = makeState({ apexStatus: 'monitoring' });
    expect(applyVantageFlagUpdates(state, 'vevent_09', 'vevent_09_d', 'PARTIAL_SUCCESS').apexStatus).toBe('escalating');
  });

  it('vevent_09 CRITICAL_FAILURE escalates only to escalating, never straight to hostile', () => {
    const state = makeState({ apexStatus: 'monitoring' });
    expect(applyVantageFlagUpdates(state, 'vevent_09', 'vevent_09_d', 'CRITICAL_FAILURE').apexStatus).toBe('escalating');
  });

  it('vevent_10 FAILURE/CRITICAL_FAILURE escalates escalating -> hostile', () => {
    const state = makeState({ apexStatus: 'escalating' });
    expect(applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_b', 'FAILURE').apexStatus).toBe('hostile');
    const cfState = makeState({ apexStatus: 'escalating' });
    expect(applyVantageFlagUpdates(cfState, 'vevent_10', 'vevent_10_d', 'CRITICAL_FAILURE').apexStatus).toBe('hostile');
  });

  it('vevent_10 PARTIAL_SUCCESS ("a pause, not a peace") leaves apexStatus unchanged', () => {
    const state = makeState({ apexStatus: 'escalating' });
    const updates = applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_c', 'PARTIAL_SUCCESS');
    expect(updates.apexStatus).toBeUndefined();
  });

  it('vevent_15 FAILURE/CRITICAL_FAILURE escalates to hostile; SUCCESS/CRITICAL_SUCCESS de-escalates to monitoring', () => {
    const failState = makeState({ apexStatus: 'escalating' });
    expect(applyVantageFlagUpdates(failState, 'vevent_15', 'vevent_15_d', 'CRITICAL_FAILURE').apexStatus).toBe('hostile');

    const successState = makeState({ apexStatus: 'hostile' });
    expect(applyVantageFlagUpdates(successState, 'vevent_15', 'vevent_15_a', 'SUCCESS').apexStatus).toBe('monitoring');
  });

  it('guards escalation writes: a bad vevent_02 outcome cannot downgrade an already-hostile status', () => {
    const state = makeState({ apexStatus: 'hostile' });
    const updates = applyVantageFlagUpdates(state, 'vevent_02', 'vevent_02_d', 'CRITICAL_FAILURE');
    expect(updates.apexStatus).toBe('hostile');
  });

  it('guards de-escalation writes: a good vevent_10 outcome cannot upgrade an already-monitoring status', () => {
    const state = makeState({ apexStatus: 'monitoring' });
    const updates = applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_a', 'SUCCESS');
    expect(updates.apexStatus).toBe('monitoring');
  });
});

describe('applyVantageFlagUpdates: apexActive neutralisation', () => {
  it('vevent_10 CRITICAL_SUCCESS ("standstill") fully neutralises Apex', () => {
    const state = makeState({ apexActive: true, apexStatus: 'escalating' });
    const updates = applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_a', 'CRITICAL_SUCCESS');
    expect(updates.apexActive).toBe(false);
    expect(updates.apexStatus).toBe('monitoring');
  });

  it('vevent_10 SUCCESS de-escalates status but leaves Apex active ("keeping the receipts")', () => {
    const state = makeState({ apexActive: true, apexStatus: 'escalating' });
    const updates = applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_a', 'SUCCESS');
    expect(updates.apexActive).toBeUndefined();
    expect(updates.apexStatus).toBe('monitoring');
  });

  it('vevent_15 SUCCESS/CRITICAL_SUCCESS neutralises Apex; FAILURE/CRITICAL_FAILURE does not', () => {
    const winState = makeState({ apexActive: true });
    expect(applyVantageFlagUpdates(winState, 'vevent_15', 'vevent_15_a', 'CRITICAL_SUCCESS').apexActive).toBe(false);

    const loseState = makeState({ apexActive: true });
    expect(applyVantageFlagUpdates(loseState, 'vevent_15', 'vevent_15_d', 'CRITICAL_FAILURE').apexActive).toBeUndefined();
  });
});

describe('applyVantageFlagUpdates: chairCeoSeparationProgress', () => {
  it('vevent_05 strategies A/B/C add tier-scaled progress', () => {
    const state = makeState({ chairCeoSeparationProgress: 0 });
    expect(applyVantageFlagUpdates(state, 'vevent_05', 'vevent_05_a', 'CRITICAL_SUCCESS').chairCeoSeparationProgress).toBe(50);

    const state2 = makeState({ chairCeoSeparationProgress: 0 });
    expect(applyVantageFlagUpdates(state2, 'vevent_05', 'vevent_05_b', 'SUCCESS').chairCeoSeparationProgress).toBe(30);

    const state3 = makeState({ chairCeoSeparationProgress: 0 });
    expect(applyVantageFlagUpdates(state3, 'vevent_05', 'vevent_05_c', 'PARTIAL_SUCCESS').chairCeoSeparationProgress).toBe(10);
  });

  it('vevent_05 strategy D ("defend combined structure") never adds progress, even at CRITICAL_SUCCESS', () => {
    const state = makeState({ chairCeoSeparationProgress: 0 });
    const updates = applyVantageFlagUpdates(state, 'vevent_05', 'vevent_05_d', 'CRITICAL_SUCCESS');
    expect(updates.chairCeoSeparationProgress).toBeUndefined();
  });

  it('vevent_05 FAILURE/CRITICAL_FAILURE add no progress', () => {
    const state = makeState({ chairCeoSeparationProgress: 0 });
    const updates = applyVantageFlagUpdates(state, 'vevent_05', 'vevent_05_a', 'CRITICAL_FAILURE');
    expect(updates.chairCeoSeparationProgress).toBeUndefined();
  });

  it('vevent_10 strategy A adds progress on SUCCESS/CRITICAL_SUCCESS only; other strategies never do', () => {
    const state = makeState({ chairCeoSeparationProgress: 0 });
    expect(applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_a', 'CRITICAL_SUCCESS').chairCeoSeparationProgress).toBe(30);

    const state2 = makeState({ chairCeoSeparationProgress: 0 });
    expect(applyVantageFlagUpdates(state2, 'vevent_10', 'vevent_10_a', 'SUCCESS').chairCeoSeparationProgress).toBe(20);

    const state3 = makeState({ chairCeoSeparationProgress: 0 });
    const updatesB = applyVantageFlagUpdates(state3, 'vevent_10', 'vevent_10_b', 'CRITICAL_SUCCESS');
    expect(updatesB.chairCeoSeparationProgress).toBeUndefined();
  });

  it('crosses the >= 50 threshold via one vevent_05 CRITICAL_SUCCESS, or via vevent_05 SUCCESS + vevent_10_a SUCCESS combined', () => {
    const solo = makeState({ chairCeoSeparationProgress: 0 });
    const soloUpdates = applyVantageFlagUpdates(solo, 'vevent_05', 'vevent_05_a', 'CRITICAL_SUCCESS');
    expect(soloUpdates.chairCeoSeparationProgress!).toBeGreaterThanOrEqual(50);

    let combined = makeState({ chairCeoSeparationProgress: 0 });
    Object.assign(combined, applyVantageFlagUpdates(combined, 'vevent_05', 'vevent_05_b', 'SUCCESS'));
    expect(combined.chairCeoSeparationProgress).toBe(30);
    Object.assign(combined, applyVantageFlagUpdates(combined, 'vevent_10', 'vevent_10_a', 'SUCCESS'));
    expect(combined.chairCeoSeparationProgress).toBe(50);
  });

  it('clamps at 100', () => {
    const state = makeState({ chairCeoSeparationProgress: 90 });
    const updates = applyVantageFlagUpdates(state, 'vevent_05', 'vevent_05_a', 'CRITICAL_SUCCESS');
    expect(updates.chairCeoSeparationProgress).toBe(100);
  });
});

describe('Vantage vevent_10/15 reachability', () => {
  const vevent10 = findEvent(vantageEvents, 'vevent_10');
  const vevent15 = findEvent(vantageEvents, 'vevent_15');

  it('vevent_10 fires once apexActive is true and vevent_02 resolved at PARTIAL_SUCCESS-or-worse, skips otherwise', () => {
    const reachable = makeState({
      company: vantageConsumer,
      apexActive: true,
      resolvedEvents: [stubResolvedEvent('vevent_02', 'FAILURE')],
      currentQuarter: 'Q3',
      currentTurn: 1,
    });
    expect(checkEventPrecondition(vevent10, reachable)).toBe(true);
    expect(getCurrentEvent(reachable)?.id).toBe('vevent_10');

    const apexNeutralised = makeState({
      company: vantageConsumer,
      apexActive: false,
      resolvedEvents: [stubResolvedEvent('vevent_02', 'FAILURE')],
      currentQuarter: 'Q3',
      currentTurn: 1,
    });
    expect(checkEventPrecondition(vevent10, apexNeutralised)).toBe(false);
    expect(getCurrentEvent(apexNeutralised)).toBeNull();

    const vevent02Succeeded = makeState({
      company: vantageConsumer,
      apexActive: true,
      resolvedEvents: [stubResolvedEvent('vevent_02', 'SUCCESS')],
      currentQuarter: 'Q3',
      currentTurn: 1,
    });
    expect(getCurrentEvent(vevent02Succeeded)).toBeNull();
  });

  it('vevent_15 fires once apexActive is true and governance health < 50, skips otherwise', () => {
    const reachable = makeState({
      company: vantageConsumer,
      apexActive: true,
      governanceHealth: 40,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(vevent15, reachable)).toBe(true);
    expect(getCurrentEvent(reachable)?.id).toBe('vevent_15');

    const ghTooHigh = makeState({
      company: vantageConsumer,
      apexActive: true,
      governanceHealth: 60,
      currentQuarter: 'Q4',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(vevent15, ghTooHigh)).toBe(false);
  });

  it('end-to-end: winning vevent_10 at CRITICAL_SUCCESS neutralises Apex and permanently locks out vevent_15', () => {
    let state = makeState({ company: vantageConsumer, apexActive: true, apexStatus: 'escalating', governanceHealth: 40 });
    Object.assign(state, applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_a', 'CRITICAL_SUCCESS'));
    expect(state.apexActive).toBe(false);

    state = { ...state, currentQuarter: 'Q4', currentTurn: 3 };
    // Even with governance health well under 50, vevent_15 is unreachable — the win closed it off.
    expect(checkEventPrecondition(vevent15, state)).toBe(false);
    expect(getCurrentEvent(state)).toBeNull();
  });

  it('end-to-end: losing vevent_10 escalates to hostile and keeps vevent_15 reachable', () => {
    let state = makeState({ company: vantageConsumer, apexActive: true, apexStatus: 'escalating', governanceHealth: 60 });
    Object.assign(state, applyVantageFlagUpdates(state, 'vevent_10', 'vevent_10_d', 'CRITICAL_FAILURE'), { governanceHealth: 40 });
    expect(state.apexStatus).toBe('hostile');
    expect(state.apexActive).toBe(true);

    state = { ...state, currentQuarter: 'Q4', currentTurn: 3 };
    expect(checkEventPrecondition(vevent15, state)).toBe(true);
    expect(getCurrentEvent(state)?.id).toBe('vevent_15');
  });
});

// ── SFG ──────────────────────────────────────────────────────────────────────

describe('SFG board-state preconditions', () => {
  const sfgevent09 = findEvent(sfgEvents, 'sfgevent_09');

  it('sfgevent_09 does not fire when no seated director has tenure > 9 (full integration: SFG never sees sfgevent_09)', () => {
    const directors = [stubDirector('sfgdir_04_rahman', 4), stubDirector('sfgdir_05_png', 3)];
    const state = makeState({
      company: straitsFinancialGroup,
      board: {
        seats: [stubSeat('sfgdir_04_rahman'), stubSeat('sfgdir_05_png')],
        totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [],
      },
      directors,
      currentQuarter: 'Q3',
      currentTurn: 3,
    });
    expect(checkEventPrecondition(sfgevent09, state)).toBe(false);
    expect(getCurrentEvent(state)).toBeNull();
  });

  it('sfgevent_09 fires when a seated director has tenure > 9 and renewal was not addressed', () => {
    const directors = [stubDirector('sfgdir_02_soong', 10)];
    const state = makeState({
      company: { id: 'company_sfg' } as unknown as GameState['company'],
      board: {
        seats: [stubSeat('sfgdir_02_soong', 'sid')],
        totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [],
      },
      directors,
    });
    expect(checkEventPrecondition(sfgevent09, state)).toBe(true);
  });

  it('sfgevent_09 does not fire when a long-tenure director is seated but SFG-02 succeeded', () => {
    const directors = [stubDirector('sfgdir_02_soong', 10)];
    const state = makeState({
      company: { id: 'company_sfg' } as unknown as GameState['company'],
      board: {
        seats: [stubSeat('sfgdir_02_soong', 'sid')],
        totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [],
      },
      directors,
      resolvedEvents: [stubResolvedEvent('sfgevent_02', 'SUCCESS')],
    });
    expect(checkEventPrecondition(sfgevent09, state)).toBe(false);
  });
});

// ── SFG: relocated cases (previously dead in checkEventCondition) ──────────────

describe('SFG relocated preconditions (sfg_helena_on_board etc.)', () => {
  const sfgevent02 = findEvent(sfgEvents, 'sfgevent_02');
  const sfgevent07 = findEvent(sfgEvents, 'sfgevent_07');
  const sfgevent08 = findEvent(sfgEvents, 'sfgevent_08');
  const sfgevent10 = findEvent(sfgEvents, 'sfgevent_10');
  const sfgevent11 = findEvent(sfgEvents, 'sfgevent_11');
  const sfgevent12 = findEvent(sfgEvents, 'sfgevent_12');
  const sfgevent15 = findEvent(sfgEvents, 'sfgevent_15');

  it('sfgevent_02 (sfg_helena_on_board) does not fire when Helena Soong is removed pre-lock', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_04_rahman')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(sfgevent02, state)).toBe(false);
  });

  it('sfgevent_02 (sfg_helena_on_board) fires when Helena Soong is seated', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_02_soong', 'sid')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(sfgevent02, state)).toBe(true);
  });

  it('sfgevent_07 (sfg_no_sustainability_committee) does not fire when the committee already exists', () => {
    const state = makeState({
      committees: { ...makeState().committees, sustainability: { active: true, chairDirectorId: null } },
    });
    expect(checkEventPrecondition(sfgevent07, state)).toBe(false);
  });

  it('sfgevent_07 (sfg_no_sustainability_committee) fires when the committee has not been formed', () => {
    const state = makeState({
      committees: { ...makeState().committees, sustainability: { active: false, chairDirectorId: null } },
    });
    expect(checkEventPrecondition(sfgevent07, state)).toBe(true);
  });

  it('sfgevent_08 (sfg_temasek_concern_active) does not fire when Helena/Winston are gone and Lim is off the BRC', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_04_rahman')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      committees: { ...makeState().committees, risk: { active: true, chairDirectorId: 'sfgdir_04_rahman' } },
    });
    expect(checkEventPrecondition(sfgevent08, state)).toBe(false);
  });

  it('sfgevent_08 (sfg_temasek_concern_active) fires when Helena Soong is still seated', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_02_soong', 'sid')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
    });
    expect(checkEventPrecondition(sfgevent08, state)).toBe(true);
  });

  it('sfgevent_10 (sfg_ceo_whistleblower_substantiated) does not fire while the investigation is only pending', () => {
    const state = makeState({ ceoWhistleblower: 'pending' });
    expect(checkEventPrecondition(sfgevent10, state)).toBe(false);
  });

  it('sfgevent_10 (sfg_ceo_whistleblower_substantiated) fires once the allegation is substantiated', () => {
    const state = makeState({ ceoWhistleblower: 'substantiated' });
    expect(checkEventPrecondition(sfgevent10, state)).toBe(true);
  });

  it('sfgevent_11 (sfg_governance_weak_sv_low) does not fire when governance and SV are healthy', () => {
    const state = makeState({ governanceHealth: 70, svIndex: 95 });
    expect(checkEventPrecondition(sfgevent11, state)).toBe(false);
  });

  it('sfgevent_11 (sfg_governance_weak_sv_low) fires when governance health and SV are both low', () => {
    const state = makeState({ governanceHealth: 40, svIndex: 80 });
    expect(checkEventPrecondition(sfgevent11, state)).toBe(true);
  });

  it('sfgevent_12 (sfg_enforcement_precondition) does not fire when SFG-05/SFG-10 are unresolved or clean', () => {
    const state = makeState({ resolvedEvents: [] });
    expect(checkEventPrecondition(sfgevent12, state)).toBe(false);
  });

  it('sfgevent_12 (sfg_enforcement_precondition) fires when the BRC crisis (SFG-05) was mishandled', () => {
    const state = makeState({ resolvedEvents: [stubResolvedEvent('sfgevent_05', 'FAILURE')] });
    expect(checkEventPrecondition(sfgevent12, state)).toBe(true);
  });

  it('sfgevent_15 (sfg_lim_chair_unresolved) does not fire once Lim is no longer chair', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_01_lim', 'ned')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      committees: { ...makeState().committees, risk: { active: true, chairDirectorId: 'sfgdir_01_lim' } },
    });
    expect(checkEventPrecondition(sfgevent15, state)).toBe(false);
  });

  it('sfgevent_15 (sfg_lim_chair_unresolved) fires while Lim holds both the board chair and the BRC chair', () => {
    const state = makeState({
      board: { seats: [stubSeat('sfgdir_01_lim', 'chair')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      committees: { ...makeState().committees, risk: { active: true, chairDirectorId: 'sfgdir_01_lim' } },
    });
    expect(checkEventPrecondition(sfgevent15, state)).toBe(true);
  });
});

// ── SFG-01 redesign: live resignation narrative + strategy filtering ───────

describe('resolveSfgEvent01Event', () => {
  const sfgevent01 = findEvent(sfgEvents, 'sfgevent_01');
  const rahmanSeated = { seats: [stubSeat('sfgdir_04_rahman', 'ned')], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] };

  it('substitutes {acChair.name} with the resigning director and keeps all four strategies for a generic resignee', () => {
    const state = makeState({
      board: rahmanSeated,
      directors: [stubDirector('sfgdir_08_tan_margaret')],
      forcedChange: { type: 'resignation', directorId: 'sfgdir_08_tan_margaret', directorName: 'Margaret Tan Swee Lin', turnsRemaining: 1, narrative: '' },
    });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.narrativeCard).toContain('Director sfgdir_08_tan_margaret has resigned');
    expect(resolved.narrativeCard).not.toContain('{acChair.name}');
    expect(resolved.strategies.map((s) => s.id)).toEqual([
      'sfgevent_01_a', 'sfgevent_01_b', 'sfgevent_01_c', 'sfgevent_01_d',
    ]);
  });

  it('removes the Geok strategy (_a) when Lee Siew Geok is the resignee', () => {
    const state = makeState({
      board: rahmanSeated,
      directors: [stubDirector('sfgdir_06_lee')],
      forcedChange: { type: 'resignation', directorId: 'sfgdir_06_lee', directorName: 'Lee Siew Geok', turnsRemaining: 1, narrative: '' },
    });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.narrativeCard).toContain('Director sfgdir_06_lee has resigned');
    expect(resolved.strategies.map((s) => s.id)).not.toContain('sfgevent_01_a');
    expect(resolved.strategies.map((s) => s.id)).toEqual(['sfgevent_01_b', 'sfgevent_01_c', 'sfgevent_01_d']);
  });

  it('removes the promote-Rahman strategy (_c) when Rahman was replaced pre-lock by someone else', () => {
    const state = makeState({
      board: { seats: [], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] }, // Rahman not seated
      directors: [stubDirector('sfgdir_08_tan_margaret')],
      forcedChange: { type: 'resignation', directorId: 'sfgdir_08_tan_margaret', directorName: 'Margaret Tan Swee Lin', turnsRemaining: 1, narrative: '' },
    });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.strategies.map((s) => s.id)).not.toContain('sfgevent_01_c');
    expect(resolved.strategies.map((s) => s.id)).toEqual(['sfgevent_01_a', 'sfgevent_01_b', 'sfgevent_01_d']);
  });

  it('removes the promote-Rahman strategy (_c) when Rahman herself is the resignee — implicit case via the seated-check, not special-cased', () => {
    // Rahman resigned, so she's no longer in board.seats — isDirectorSeated(state, 'sfgdir_04_rahman')
    // is false for the same reason as the pre-lock-replacement case above, not because of any
    // resignee-identity check. This test pins that behavior so a future refactor (e.g. one that
    // special-cases "is the resignee === Rahman?" the way it does for Geok) can't silently drop it.
    const state = makeState({
      board: { seats: [], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      directors: [stubDirector('sfgdir_04_rahman')],
      forcedChange: { type: 'resignation', directorId: 'sfgdir_04_rahman', directorName: 'Dr. Nadia Rahman', turnsRemaining: 1, narrative: '' },
    });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.narrativeCard).toContain('Director sfgdir_04_rahman has resigned');
    expect(resolved.strategies.map((s) => s.id)).not.toContain('sfgevent_01_c');
    expect(resolved.strategies.map((s) => s.id)).toEqual(['sfgevent_01_a', 'sfgevent_01_b', 'sfgevent_01_d']);
  });

  it('removes both _a and _c when Geok is the resignee and Rahman is unseated', () => {
    const state = makeState({
      board: { seats: [], totalCommittedBudget: 0, remainingBudget: 0, complianceErrors: [] },
      directors: [stubDirector('sfgdir_06_lee')],
      forcedChange: { type: 'resignation', directorId: 'sfgdir_06_lee', directorName: 'Lee Siew Geok', turnsRemaining: 1, narrative: '' },
    });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.strategies.map((s) => s.id)).toEqual(['sfgevent_01_b', 'sfgevent_01_d']);
  });

  it('falls back to generic phrasing when no resignation forcedChange is present', () => {
    const state = makeState({ board: rahmanSeated, directors: [] });
    const resolved = resolveSfgEvent01Event(sfgevent01, state);

    expect(resolved.narrativeCard).toContain('The outgoing Audit Committee Chair has resigned');
  });
});
