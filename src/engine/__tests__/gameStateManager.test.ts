import { describe, it, expect } from 'vitest';
import { checkEventPrecondition, getCurrentEvent } from '../gameStateManager';
import { meridianEvents } from '@/data/meridian/events';
import { rheinfeldEvents } from '@/data/rheinfeld/events';
import { sfgEvents } from '@/data/sfg/events';
import { meridianFoundation } from '@/data/meridian/company';
import { rheinfeldAG } from '@/data/rheinfeld/company';
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
