import type {
  GameState,
  BoardSeat,
  Director,
  DirectorDynamic,
  GameEvent,
  CommitteeId,
  CommitteeState,
  Quarter,
  ResolvedEvent,
  GovernanceHealthBreakdown,
  CompetencyDomain,
  Company,
  ScheduledEvent,
  OutcomeTier,
} from '@/types/game';
import { directors as allDirectorsRaw } from '@/data/directors';
import { events as allEvents } from '@/data/events';
import { directorDynamics } from '@/data/dynamics';
import { resolveEvent, ResolveEventInput } from './resolution';

// ── Quarter ordering ──

const QUARTER_ORDER: Quarter[] = ['Q1', 'Q2', 'AGM', 'Q3', 'Q4'];

export function getQuarterIndex(q: Quarter): number {
  return QUARTER_ORDER.indexOf(q);
}

export function getNextQuarterAndTurn(
  currentQuarter: Quarter,
  currentTurn: number,
  eventSchedule: ScheduledEvent[]
): { quarter: Quarter; turn: number } | null {
  const currentQIdx = getQuarterIndex(currentQuarter);

  for (const sched of eventSchedule) {
    const schedQIdx = getQuarterIndex(sched.quarter);
    if (
      schedQIdx > currentQIdx ||
      (schedQIdx === currentQIdx && sched.turn > currentTurn)
    ) {
      return { quarter: sched.quarter, turn: sched.turn };
    }
  }
  return null; // End of game
}

// ── Initialize game state from board construction output ──

export function initializeGameState(
  seats: BoardSeat[],
  hasEnergyTransition: boolean,
  company?: Company,
  optionalCommittees?: CommitteeId[],
): GameState {
  // Default to Harwick for backwards compatibility
  const co = company ?? require('@/data/company').harwickEnergy as Company;

  // Get directors for this company, excluding specified IDs
  const companyDirectors = allDirectorsRaw
    .filter((d) => co.directorIds.includes(d.id))
    .filter((d) => !co.excludeDirectorIds.includes(d.id))
    .map((d) => ({ ...d })); // deep copy energy etc

  const findChair = (role: string) =>
    seats.find((s) => s.role === role)?.directorId ?? null;

  const committees: Record<CommitteeId, CommitteeState> = {
    audit: { active: true, chairDirectorId: findChair('auditChair') },
    remuneration: {
      active: findChair('remChair') !== null,
      chairDirectorId: findChair('remChair'),
    },
    nomination: { active: true, chairDirectorId: findChair('nomChair') },
    safetyEnvironment: {
      active: co.committees.some((c) => c.id === 'safetyEnvironment' && c.status === 'active'),
      chairDirectorId: findChair('safetyEnvChair'),
    },
    energyTransition: {
      active: hasEnergyTransition,
      chairDirectorId: findChair('energyTransitionChair'),
    },
    // Rheinfeld-specific committees (activated via optional committees param)
    csrd: {
      active: co.committees.some((c) => c.id === 'csrd' && c.status === 'active') || (optionalCommittees?.includes('csrd') ?? false),
      chairDirectorId: findChair('csrdChair'),
    },
    strategy: {
      active: co.committees.some((c) => c.id === 'strategy' && c.status === 'active') || (optionalCommittees?.includes('strategy') ?? false),
      chairDirectorId: findChair('strategyChair'),
    },
    // SFG-specific committees
    risk: {
      active: co.committees.some((c) => c.id === 'risk' && c.status === 'active'),
      chairDirectorId: findChair('riskChair'),
    },
    sustainability: {
      active: co.committees.some((c) => c.id === 'sustainability' && c.status === 'active') || (optionalCommittees?.includes('sustainability') ?? false),
      chairDirectorId: findChair('sustainabilityChair'),
    },
  };

  const totalBudget = co.boardBudget;
  const etFormationCost = co.committees.find((c) => c.id === 'energyTransition')?.formationCost ?? 180_000;
  const csrdFormationCost = co.committees.find((c) => c.id === 'csrd')?.formationCost ?? 0;
  const strategyFormationCost = co.committees.find((c) => c.id === 'strategy')?.formationCost ?? 0;
  const optCommitteesCost = (optionalCommittees?.includes('csrd') ? csrdFormationCost : 0)
    + (optionalCommittees?.includes('strategy') ? strategyFormationCost : 0);
  const committed =
    seats.reduce((sum, s) => sum + s.feeWithPremium, 0) +
    (hasEnergyTransition ? etFormationCost : 0) +
    optCommitteesCost;

  return {
    company: co,
    board: {
      seats: [...seats],
      totalCommittedBudget: committed,
      remainingBudget: totalBudget - committed,
      complianceErrors: [],
    },
    directors: companyDirectors,
    directorDynamics: [...directorDynamics],
    svIndex: co.startingSvIndex,
    governanceHealth: co.startingGovernanceHealth,
    governanceHealthBreakdown: { ...co.startingGovernanceHealthBreakdown },
    boardTension: 0,
    currentQuarter: 'Q1',
    currentTurn: 0, // will be set to 1 when first event fires
    eventQueue: [],
    resolvedEvents: [],
    boardLocked: true,
    phase: 'gameplay',
    committees,
    randomSeed: Date.now(),
    // Vantage-specific fields (neutral defaults for non-Vantage companies)
    apexStatus: 'monitoring',
    chairCeoSeparationProgress: 0,
    apexActive: co.id === 'company_vantage',
    forcedChange: null,
    healthCrisisFired: false,
    // Rheinfeld-specific fields (neutral defaults for non-Rheinfeld companies)
    heinrichConflictRevealed: false,
    workerRepRelations: 'neutral',
    csrdProgress: co.id === 'company_rheinfeld' ? 15 : 0,
    meridianActive: co.id === 'company_rheinfeld',
    meridianStatus: 'watching',
    // Meridian Foundation-specific fields (neutral defaults for non-Meridian companies)
    missionIntegrityScore: co.id === 'company_meridian' ? co.startingSvIndex : 0,
    founderSyndromeScore: co.id === 'company_meridian' ? 55 : 0,
    charityCommissionInquiryActive: false,
    solvencyRisk: false,
    // SFG-specific fields (neutral defaults for non-SFG companies)
    // No vacancy exists until sfgevent_01 fires and the sitting AC Chair
    // resigns live (see applySfgAcChairResignation in forcedChanges.ts).
    acChairVacant: false,
    ceoWhistleblower: co.id === 'company_sfg' ? 'pending' : null,
    pendingBoardNotification: null,
  };
}

// ── Get current event for the current quarter/turn ──

export function getCurrentEvent(state: GameState): GameEvent | null {
  const eventSchedule = state.company.eventSchedule;
  const scheduled = eventSchedule.find(
    (s) => s.quarter === state.currentQuarter && s.turn === state.currentTurn
  );
  if (!scheduled) return null;

  const event = allEvents.find((e) => e.id === scheduled.eventId);
  if (!event) return null;

  // Check board-state precondition
  if (!checkEventPrecondition(event, state)) {
    return null; // Precondition not met - skip this event
  }

  // Check conditional events (outcome-based triggers)
  if (event.isConditional) {
    if (!checkEventCondition(event, state)) {
      return null; // Skip this event
    }
  }

  // Check if event was already resolved
  if (state.resolvedEvents.some((r) => r.eventId === event.id)) {
    return null;
  }

  // SFG-01: inject the live resignee's name and filter invalidated strategies
  // (this already applies filterStrategiesByRequires internally for sfgevent_01_c).
  if (event.id === 'sfgevent_01') {
    return resolveSfgEvent01Event(event, state);
  }

  // Generic per-strategy-option gating (see StrategyOption.requires) — no-op
  // for events with no requires-gated strategies.
  let gated = filterStrategiesByRequires(event, state);

  // Rheinfeld: revent_04/08 generic phrasing fallback — no-op for other events
  // or when Margarethe/Strasser are both seated.
  gated = resolveRheinfeldNamedDirectorEvent(gated, state);

  // If ETC is already active, replace "form ETC" strategies with "leverage existing ETC"
  if (state.committees.energyTransition.active) {
    const replaced = replaceEtcStrategies(gated);
    if (replaced) return replaced;
  }

  return gated;
}

// ── Generic board-state precondition helpers ──
// Shared building blocks for event preconditions that depend on board
// composition, following the pattern originally established ad hoc by
// vantage_nguyen_on_board below.

function isDirectorSeated(state: GameState, directorId: string): boolean {
  return state.board.seats.some((s) => s.directorId === directorId);
}

function directorHoldsRole(
  state: GameState,
  directorId: string,
  role: BoardSeat['role']
): boolean {
  return state.board.seats.some(
    (s) => s.directorId === directorId && s.role === role
  );
}

function isCommitteeChairVacant(state: GameState, committeeId: CommitteeId): boolean {
  return state.committees[committeeId]?.chairDirectorId == null;
}

// ── Check board-state preconditions before an event fires ──

export function checkEventPrecondition(
  event: GameEvent,
  state: GameState
): boolean {
  if (event.precondition === null) return true;

  switch (event.precondition) {
    case 'remChairVacant': {
      return state.committees.remuneration.chairDirectorId === null;
    }
    case 'energyTransitionNotEstablished': {
      return !state.committees.energyTransition.active;
    }
    // AUDIT: Vantage - guard vevent_01 ("Patricia Nguyen: Conflict of Interest").
    // Patricia Nguyen (vdir_02_nguyen) is an inherited board member that the player can drop during
    // board construction. If she is not seated, the event narrative makes no sense and must not fire.
    case 'vantage_nguyen_on_board': {
      return state.board.seats.some((s) => s.directorId === 'vdir_02_nguyen');
    }

    // AUDIT: Harwick - guard event_10 ("Greenvale Escalation").
    // event_10 should only be reachable when event_04 was resolved at PARTIAL_SUCCESS or worse.
    // checkEventCondition() already enforces this via the legacy switch, but having the same check
    // here in checkEventPrecondition() means the guard fires even if isConditional is ever changed.
    case 'harwick_greenvale_active': {
      const ev04 = state.resolvedEvents.find((r) => r.eventId === 'event_04');
      if (!ev04) return false;
      return (
        ev04.outcomeTier === 'PARTIAL_SUCCESS' ||
        ev04.outcomeTier === 'FAILURE' ||
        ev04.outcomeTier === 'CRITICAL_FAILURE'
      );
    }

    // AUDIT: Harwick - guard event_15 ("Full Proxy Battle").
    // event_15 requires governance health < 50 AND event_10 resolved as FAILURE or CRITICAL_FAILURE.
    // checkEventCondition() also enforces this via the legacy switch; the precondition adds a
    // belt-and-suspenders board-state gate here.
    case 'harwick_proxy_battle': {
      if (state.governanceHealth >= 50) return false;
      return state.resolvedEvents.some(
        (r) =>
          r.eventId === 'event_10' &&
          (r.outcomeTier === 'FAILURE' || r.outcomeTier === 'CRITICAL_FAILURE')
      );
    }

    // Vantage-specific preconditions
    case 'vantage_apex_escalation': {
      // V-10: fires only if Apex is still active
      if (!state.apexActive) return false;
      return true; // conditionConfig handles the outcome check
    }
    case 'vantage_hostile_bid': {
      // V-13: probability-based - always allow through precondition,
      // actual firing is handled by conditionConfig or SV thresholds
      return true;
    }
    case 'vantage_proxy_battle': {
      // V-15: fires only if GH < 50 AND Apex is still active
      if (!state.apexActive) return false;
      if (state.governanceHealth >= 50) return false;
      return true; // conditionConfig handles GH check too
    }

    // ── Rheinfeld-specific preconditions ──

    // R-04: Heinrich blocks appointment - fires if the player filled one of the two
    // vacant shareholder seats during board construction (board has > 8 seats, meaning
    // at least one of the two slots beyond the 8 inherited members was filled).
    case 'heinrichBlocks': {
      const inheritedIds = new Set([
        'rdir_heinrich', 'rdir_margarethe', 'rdir_strasser',
        'rdir_w_koch', 'rdir_w_alrashid', 'rdir_w_hoffmann', 'rdir_w_mehta', 'rdir_w_gruber',
      ]);
      return state.board.seats.some((s) => !inheritedIds.has(s.directorId));
    }

    // R-12: Meridian EGM threat - fires if Meridian is escalating AND GH < 55
    case 'meridianEGM': {
      if (!state.meridianActive) return false;
      if (state.meridianStatus !== 'escalating') return false;
      return state.governanceHealth < 55;
    }

    // R-14: Heinrich conflict - fires only if the conflict has been revealed
    case 'ceoConfidence': {
      return state.heinrichConflictRevealed;
    }

    // R-15: Full crisis - fires only if GH < 45 AND conflict revealed AND Meridian hostile
    case 'fullCrisis': {
      if (!state.heinrichConflictRevealed) return false;
      if (state.meridianStatus !== 'hostile') return false;
      return state.governanceHealth < 45;
    }

    // ── Meridian Foundation-specific preconditions ──

    // M-06: Compliance Review — fires only if Event 02 (Grant or Mission) was partial/fail.
    // conditionConfig handles the outcome check; precondition just ensures ev02 exists first.
    case 'mevent_02_partial_or_worse': {
      const ev02 = state.resolvedEvents.find((r) => r.eventId === 'mevent_02');
      if (!ev02) return false;
      return (
        ev02.outcomeTier === 'PARTIAL_SUCCESS' ||
        ev02.outcomeTier === 'FAILURE' ||
        ev02.outcomeTier === 'CRITICAL_FAILURE'
      );
    }

    // M-08: Statutory Inquiry — fires only if Event 01 (Undisclosed Conflict) was partial/fail,
    // AND Cavendish is still seated (mevent_08's narrative is entirely about him personally;
    // if he was removed after mevent_01 fired but before mevent_08's slot, it shouldn't fire).
    case 'mevent_01_partial_or_worse': {
      if (!isDirectorSeated(state, 'mdir_cavendish')) return false;
      const ev01 = state.resolvedEvents.find((r) => r.eventId === 'mevent_01');
      if (!ev01) return false;
      return (
        ev01.outcomeTier === 'PARTIAL_SUCCESS' ||
        ev01.outcomeTier === 'FAILURE' ||
        ev01.outcomeTier === 'CRITICAL_FAILURE'
      );
    }

    // M-01: The Undisclosed Conflict — entire premise requires Cavendish to be seated
    // and chairing Finance & Risk (audit committee); otherwise there is no conflict to narrate.
    case 'meridian_cavendish_chairs_finance_risk': {
      return directorHoldsRole(state, 'mdir_cavendish', 'auditChair');
    }

    // M-03: The Founder's Memo — entire premise is Osei-Bonsu bypassing the CEO.
    case 'meridian_osei_bonsu_on_board': {
      return isDirectorSeated(state, 'mdir_osei_bonsu');
    }

    // M-04: Safeguarding Alert — narrative presupposes an active, staffed People & Culture
    // (remuneration) committee whose chair can be "on holiday".
    case 'meridian_people_culture_chair_filled': {
      return !isCommitteeChairVacant(state, 'remuneration');
    }

    // M-14: Chair Succession — entire event assumes Mensah currently chairs the board
    // and Osei-Bonsu is seated (both strategies and the hardcoded role-swap depend on this).
    case 'meridian_mensah_chair_osei_bonsu_seated': {
      return (
        directorHoldsRole(state, 'mdir_mensah', 'chair') &&
        isDirectorSeated(state, 'mdir_osei_bonsu')
      );
    }

    // M-09: CEO Ultimatum — auto-fires if Founder Syndrome Score > 60; otherwise requires
    // Event 03 (Founder's Memo) to have resolved at partial or worse. Either way, Osei-Bonsu
    // must still be seated — the event is entirely about her.
    // checkEventCondition also has a mevent_09 override for the FSS path.
    case 'mevent_09_fss_or_event03': {
      if (!isDirectorSeated(state, 'mdir_osei_bonsu')) return false;
      if (state.founderSyndromeScore > 60) return true;
      const ev03 = state.resolvedEvents.find((r) => r.eventId === 'mevent_03');
      if (!ev03) return false;
      return (
        ev03.outcomeTier === 'PARTIAL_SUCCESS' ||
        ev03.outcomeTier === 'FAILURE' ||
        ev03.outcomeTier === 'CRITICAL_FAILURE'
      );
    }

    // R-01: Audit Committee has no effective chair — the entire premise is that the
    // seat is vacant; if the player filled it pre-lock, there's nothing to report.
    case 'rheinfeld_audit_chair_vacant': {
      return isCommitteeChairVacant(state, 'audit');
    }

    // SFG-09: Minority Shareholder Requisition — fires only if at least one currently
    // seated director actually has tenure > 9 (the thing the resolution is about), AND
    // board renewal hasn't already been addressed via SFG-02's outcome. This case was
    // previously only defined (dead) inside checkEventCondition's event.id-keyed switch,
    // where it could never match since 'sfg_renewal_not_addressed' is not an event id.
    case 'sfg_renewal_not_addressed': {
      const anyLongTenureSeated = state.board.seats.some((s) => {
        const director = state.directors.find((d) => d.id === s.directorId);
        return (director?.tenure ?? 0) > 9;
      });
      if (!anyLongTenureSeated) return false;
      const ev02 = state.resolvedEvents.find((r) => r.eventId === 'sfgevent_02');
      if (!ev02) return true;
      return ev02.outcomeTier === 'FAILURE' || ev02.outcomeTier === 'CRITICAL_FAILURE';
    }

    // SFG-02: Director Independence Review — the two-tier vote is only meaningful
    // while Helena Soong (the director whose tenure triggers it) is still seated.
    // Relocated from checkEventCondition's event.id-keyed switch, where
    // 'sfg_helena_on_board' could never match an event id and was dead code.
    case 'sfg_helena_on_board': {
      return isDirectorSeated(state, 'sfgdir_02_soong');
    }

    // SFG-07: MAS ESG Deadline — fires only if the Sustainability Committee
    // hasn't already been formed. Relocated (was dead, same reason as above).
    case 'sfg_no_sustainability_committee': {
      return !state.committees.sustainability?.active;
    }

    // SFG-08: Temasek Signals Concern — fires if Helena or Winston still have
    // tenure issues, or Lim's Risk Committee dual-role is unresolved. Relocated.
    case 'sfg_temasek_concern_active': {
      const helenaOnBoard = isDirectorSeated(state, 'sfgdir_02_soong');
      const winstonOnBoard = isDirectorSeated(state, 'sfgdir_03_goh');
      const limOnBRC = state.committees.risk?.chairDirectorId === 'sfgdir_01_lim';
      return helenaOnBoard || winstonOnBoard || limOnBRC;
    }

    // SFG-10: CEO Conduct — fires only once the whistleblower investigation
    // (SFG-04) has substantiated the allegation. Relocated.
    case 'sfg_ceo_whistleblower_substantiated': {
      return state.ceoWhistleblower === 'substantiated';
    }

    // SFG-11: Hostile Signal — fires only when governance is visibly weak
    // (low GH and SV). Relocated.
    case 'sfg_governance_weak_sv_low': {
      return state.governanceHealth < 55 && state.svIndex < 90;
    }

    // SFG-12: MAS Public Censure — fires if the BRC crisis (SFG-05) or CEO
    // conduct investigation (SFG-10) was mishandled. Relocated.
    case 'sfg_enforcement_precondition': {
      const brcFailed = state.resolvedEvents.some(
        (r) => r.eventId === 'sfgevent_05' && (r.outcomeTier === 'FAILURE' || r.outcomeTier === 'CRITICAL_FAILURE')
      );
      const ceoMishandled = state.resolvedEvents.some(
        (r) => r.eventId === 'sfgevent_10' && (r.outcomeTier === 'FAILURE' || r.outcomeTier === 'CRITICAL_FAILURE')
      );
      return brcFailed || ceoMishandled;
    }

    // SFG-15: Chair Succession — fires only while Lim still holds both the
    // board chair and the Risk Committee (BRC) chair. Relocated.
    case 'sfg_lim_chair_unresolved': {
      return (
        directorHoldsRole(state, 'sfgdir_01_lim', 'chair') &&
        state.committees.risk?.chairDirectorId === 'sfgdir_01_lim'
      );
    }

    default:
      return true;
  }
}

// ── Replace ETC formation strategies when committee already exists ──

const ETC_FORMATION_STRATEGY_IDS = new Set(['event_05_a', 'event_12_c']);

function replaceEtcStrategies(event: GameEvent): GameEvent | null {
  const hasEtcStrategy = event.strategies.some((s) =>
    ETC_FORMATION_STRATEGY_IDS.has(s.id)
  );
  if (!hasEtcStrategy) return null;

  const newStrategies = event.strategies.map((s) => {
    if (!ETC_FORMATION_STRATEGY_IDS.has(s.id)) return s;
    return {
      ...s,
      label: 'Leverage existing Energy Transition Committee',
      description:
        'Point to the board\'s existing Energy Transition Committee as evidence of structural commitment to the energy transition.',
      multiplier: 1.2,
      competencyGates: [],
    };
  });

  return { ...event, strategies: newStrategies };
}

// ── Generic per-strategy-option gating ──
// StrategyOption.requires lets content flag an option that only makes sense
// when a specific director is seated or a specific role is filled — e.g. "the
// SID" strategies, or "promote the sitting X" strategies. An unmet option is
// filtered out entirely; no substitute is shown, the remaining options are
// simply what the player sees. Degenerate-case guarded: if filtering would
// leave fewer than 2 options, skip filtering entirely — an event reduced to a
// single (or zero) option isn't a real choice, and showing a strategy whose
// premise no longer holds is the least-bad fallback until content is fixed.
export function filterStrategiesByRequires(event: GameEvent, state: GameState): GameEvent {
  const filtered = event.strategies.filter((s) => {
    if (!s.requires) return true;
    if (s.requires.directorSeated && !isDirectorSeated(state, s.requires.directorSeated)) return false;
    if (s.requires.roleFilled && !state.board.seats.some((seat) => seat.role === s.requires!.roleFilled)) return false;
    return true;
  });
  if (filtered.length < 2 || filtered.length === event.strategies.length) return event;
  return { ...event, strategies: filtered };
}

// ── Rheinfeld: generic phrasing fallback when Margarethe/Strasser aren't seated ──
// revent_04's strategy A and revent_08's narrativeCard name Margarethe and Strasser
// directly. Unlike Heinrich and the worker reps, both are ordinary removable NEDs
// (no lockedDirectorIds/workerRepIds protection), so either can be dropped or
// reassigned pre-lock. Hiding the whole strategy/event doesn't fit here — both
// remain fully coherent without them — so this swaps in generic "shareholder-side"
// phrasing instead, the same dynamic-content-on-read approach resolveSfgEvent01Event
// uses for its {acChair.name} substitution.
function resolveRheinfeldNamedDirectorEvent(event: GameEvent, state: GameState): GameEvent {
  if (event.id !== 'revent_04' && event.id !== 'revent_08') return event;

  const bothSeated =
    isDirectorSeated(state, 'rdir_margarethe') && isDirectorSeated(state, 'rdir_strasser');
  if (bothSeated) return event;

  if (event.id === 'revent_04') {
    return {
      ...event,
      strategies: event.strategies.map((s) =>
        s.id === 'revent_04_a'
          ? { ...s, description: 'Overrule the Nomination Committee. High risk if the shareholder-side bloc votes with Heinrich.' }
          : s
      ),
    };
  }

  return {
    ...event,
    narrativeCard:
      "Meridian Governance has published its pre-HV assessment of Rheinfeld's supervisory board. Their headline is damning: 'Structural governance failure. Family entrenchment, independence deficit, and CSRD unpreparedness combine to create material risk.' The report flags Heinrich, the shareholder-side NEDs, and the absent Audit Committee Chair specifically.",
  };
}

// ── SFG-01: resolve the live resignation into narrative + strategy list ──
// Minimal, contained token substitution — not a general templating system.
// Substitutes {acChair.name} in narrativeCard with the director who just
// resigned (read from state.forcedChange, set by applySfgAcChairResignation
// in forcedChanges.ts). Strategy filtering is two-layered: appointing Geok
// when she's the one who just resigned is a bespoke check (depends on *who*
// resigned, not just seat presence, so it can't be expressed via `requires`);
// promoting Rahman when she isn't seated is handled generically via
// sfgevent_01_c's own requires: { directorSeated: 'sfgdir_04_rahman' } field,
// run through the same filterStrategiesByRequires every other company uses.
export function resolveSfgEvent01Event(event: GameEvent, state: GameState): GameEvent {
  const resignedId = state.forcedChange?.type === 'resignation' ? state.forcedChange.directorId : null;
  const resignedName = resignedId
    ? state.directors.find((d) => d.id === resignedId)?.name ?? 'The outgoing Audit Committee Chair'
    : 'The outgoing Audit Committee Chair';

  let strategies = event.strategies;
  if (resignedId === 'sfgdir_06_lee') {
    strategies = strategies.filter((s) => s.id !== 'sfgevent_01_a');
  }

  const requiresFiltered = filterStrategiesByRequires({ ...event, strategies }, state);

  return {
    ...requiresFiltered,
    narrativeCard: event.narrativeCard.replace(/\{acChair\.name\}/g, resignedName),
  };
}

// ── Check whether a conditional event should fire ──
// Note: conditions reference event IDs from the event data - these are
// company-specific events defined in the company's event schedule.

function checkEventCondition(event: GameEvent, state: GameState): boolean {
  // Generic condition: check the event's conditionConfig if present
  if (event.conditionConfig) {
    // Meridian: mevent_09 auto-fires when Founder Syndrome Score > 60, bypassing
    // the requiresOutcome check on mevent_03 (the event fires regardless of event 03 outcome).
    if (event.id === 'mevent_09' && state.founderSyndromeScore > 60) return true;

    const { requiresEventId, requiresOutcome, requiresGhBelow } = event.conditionConfig;
    if (requiresEventId) {
      const prior = state.resolvedEvents.find((r) => r.eventId === requiresEventId);
      if (!prior) return false;
      if (requiresOutcome && !requiresOutcome.includes(prior.outcomeTier)) return false;
    }
    if (requiresGhBelow !== undefined && state.governanceHealth >= requiresGhBelow) return false;
    // Vantage: V-10 also requires apexActive to be true
    if (event.id === 'vevent_10' && !state.apexActive) return false;
    // Vantage: V-15 also requires apexActive to be true
    if (event.id === 'vevent_15' && !state.apexActive) return false;
    return true;
  }

  // Legacy hardcoded conditions for Harwick events
  switch (event.id) {
    case 'event_10': {
      const ev04 = state.resolvedEvents.find((r) => r.eventId === 'event_04');
      if (!ev04) return false;
      return (
        ev04.outcomeTier === 'PARTIAL_SUCCESS' ||
        ev04.outcomeTier === 'FAILURE' ||
        ev04.outcomeTier === 'CRITICAL_FAILURE'
      );
    }
    case 'event_15': {
      const greenvaleActive = state.resolvedEvents.some(
        (r) =>
          r.eventId === 'event_10' &&
          (r.outcomeTier === 'FAILURE' || r.outcomeTier === 'CRITICAL_FAILURE')
      );
      return state.governanceHealth < 50 && greenvaleActive;
    }

    default:
      return true;
  }
}

// ── Check if a queued follow-on event should fire this turn ──

export function getFollowOnEvents(state: GameState): GameEvent[] {
  const results: GameEvent[] = [];
  for (const eventId of state.eventQueue) {
    const event = allEvents.find((e) => e.id === eventId);
    if (event && !state.resolvedEvents.some((r) => r.eventId === eventId)) {
      results.push(event);
    }
  }
  return results;
}

// ── Advance to next turn ──

export function advanceToNextTurn(state: GameState): GameState {
  const next = getNextQuarterAndTurn(state.currentQuarter, state.currentTurn, state.company.eventSchedule);
  if (!next) {
    return {
      ...state,
      phase: 'year_end' as const,
    };
  }

  const newPhase =
    next.quarter === 'AGM' ? ('agm' as const) : ('gameplay' as const);

  return {
    ...state,
    currentQuarter: next.quarter,
    currentTurn: next.turn,
    phase: newPhase,
  };
}

// ── Apply resolution results to game state ──

export function applyResolution(
  state: GameState,
  eventId: string,
  strategyChosen: string,
  deployedDirectorIds: string[]
): { newState: GameState; output: ReturnType<typeof resolveEvent> } {
  const event = allEvents.find((e) => e.id === eventId);
  if (!event) throw new Error(`Event ${eventId} not found`);

  const deployedDirectors = deployedDirectorIds
    .map((id) => state.directors.find((d) => d.id === id))
    .filter((d): d is Director => d !== undefined);

  const input: ResolveEventInput = {
    event,
    deployedDirectors,
    strategyChoice: strategyChosen,
    gameState: {
      company: {
        jurisdiction: state.company.jurisdiction,
        difficultyTier: state.company.difficultyTier,
      },
      committees: state.committees,
      directors: state.directors,
      randomSeed: state.randomSeed,
      boardSeats: state.board.seats,
    },
    directorDynamics: state.directorDynamics,
  };

  const output = resolveEvent(input);

  // Apply energy updates
  const updatedDirectors = state.directors.map((d) => {
    const energyUpdate = output.energyUpdates.find(
      (u) => u.directorId === d.id
    );
    if (energyUpdate) {
      return { ...d, currentEnergy: energyUpdate.newEnergy };
    }
    return d;
  });

  // Apply SV delta
  const newSvIndex = Math.max(
    0,
    Math.round((state.svIndex + output.svDelta) * 100) / 100
  );

  // Update governance health based on outcome
  let ghDelta = 0;
  if (output.outcomeTier === 'CRITICAL_SUCCESS') ghDelta = 2;
  else if (output.outcomeTier === 'SUCCESS') ghDelta = 1;
  else if (output.outcomeTier === 'PARTIAL_SUCCESS') ghDelta = 0;
  else if (output.outcomeTier === 'FAILURE') ghDelta = -2;
  else if (output.outcomeTier === 'CRITICAL_FAILURE') ghDelta = -4;
  const newGH = Math.max(0, Math.min(100, state.governanceHealth + ghDelta));

  // Update board tension from negative dynamics
  let tensionDelta = 0;
  if (deployedDirectorIds.length >= 2) {
    for (let i = 0; i < deployedDirectorIds.length; i++) {
      for (let j = i + 1; j < deployedDirectorIds.length; j++) {
        const dynamic = state.directorDynamics.find(
          (d) =>
            (d.directorAId === deployedDirectorIds[i] &&
              d.directorBId === deployedDirectorIds[j]) ||
            (d.directorAId === deployedDirectorIds[j] &&
              d.directorBId === deployedDirectorIds[i])
        );
        if (dynamic && dynamic.type === 'negative') {
          tensionDelta += Math.abs(dynamic.modifier);
        }
      }
    }
  }
  const newTension = Math.min(100, state.boardTension + tensionDelta);

  // Queue follow-on events
  const newEventQueue = [...state.eventQueue, ...output.followOnEvents];

  // Record resolved event
  const resolvedEvent: ResolvedEvent = {
    eventId,
    outcomeTier: output.outcomeTier,
    svDelta: output.svDelta,
    deployedDirectorIds,
    strategyChosen,
    resolvedAtTurn: state.currentTurn,
    resolvedAtQuarter: state.currentQuarter,
    breakdown: output.breakdown,
  };

  // Increment random seed for next resolution
  const newSeed = state.randomSeed + 1;

  const newState: GameState = {
    ...state,
    directors: updatedDirectors,
    svIndex: newSvIndex,
    governanceHealth: newGH,
    boardTension: newTension,
    eventQueue: newEventQueue,
    resolvedEvents: [...state.resolvedEvents, resolvedEvent],
    randomSeed: newSeed,
  };

  return { newState, output };
}

// ── Rheinfeld: meridianStatus escalation ladder + Heinrich conflict reveal ──
// Both flags gate revent_12/14/15 (see checkEventPrecondition above) and were
// previously never written anywhere, making those three events unreachable.

type MeridianStatus = GameState['meridianStatus'];

const MERIDIAN_STATUS_RANK: Record<MeridianStatus, number> = {
  watching: 0,
  escalating: 1,
  hostile: 2,
};

// Ladder writes are direction-guarded: an escalation write only applies if the
// target is a worse state than the current one, and a de-escalation write only
// applies if the target is better. This stops a later event from silently
// undoing a worse state set by an earlier one purely because of event ordering
// (e.g. revent_09 resolving well after revent_12 already went hostile).
function escalateMeridianStatus(current: MeridianStatus, target: MeridianStatus): MeridianStatus {
  return MERIDIAN_STATUS_RANK[target] > MERIDIAN_STATUS_RANK[current] ? target : current;
}

function deescalateMeridianStatus(current: MeridianStatus, target: MeridianStatus): MeridianStatus {
  return MERIDIAN_STATUS_RANK[target] < MERIDIAN_STATUS_RANK[current] ? target : current;
}

export function applyRheinfeldFlagUpdates(
  state: GameState,
  eventId: string,
  outcomeTier: OutcomeTier
): Partial<GameState> {
  const updates: Partial<GameState> = {};

  // revent_11 ("Heinrich's Secret"): every outcome tier narrates the side-deal
  // becoming known in some form, from a controlled internal disclosure
  // (CRITICAL_SUCCESS) to an international story (CRITICAL_FAILURE) — there is
  // no tier where it stays secret, so this write is unconditional on tier.
  if (eventId === 'revent_11') {
    updates.heinrichConflictRevealed = true;
  }

  // revent_02 (Meridian's first letter), revent_08 (proxy adviser report),
  // revent_09 (AGM/HV): all three narrate Meridian standing down or escalating
  // depending on outcome. revent_08 is an auto-resolved report card with no
  // real player strategy choice, so it's escalate-only — a good report
  // shouldn't stand an activist down on its own; de-escalation has to be
  // earned via a real event win (revent_02/09/12).
  if (eventId === 'revent_02' || eventId === 'revent_08' || eventId === 'revent_09') {
    if (outcomeTier === 'FAILURE' || outcomeTier === 'CRITICAL_FAILURE') {
      updates.meridianStatus = escalateMeridianStatus(state.meridianStatus, 'escalating');
    } else if (
      eventId !== 'revent_08' &&
      (outcomeTier === 'SUCCESS' || outcomeTier === 'CRITICAL_SUCCESS')
    ) {
      updates.meridianStatus = deescalateMeridianStatus(state.meridianStatus, 'watching');
    }
  }

  // revent_12 (Meridian requisitions the EGM): this event settles the fight it
  // started, so its outcome moves the ladder further than the earlier events do.
  if (eventId === 'revent_12') {
    if (outcomeTier === 'FAILURE' || outcomeTier === 'CRITICAL_FAILURE') {
      updates.meridianStatus = escalateMeridianStatus(state.meridianStatus, 'hostile');
    } else if (outcomeTier === 'SUCCESS' || outcomeTier === 'CRITICAL_SUCCESS') {
      // Intentional, not a bug: winning the negotiated settlement de-escalates
      // back to 'watching', which permanently closes off revent_15's fullCrisis
      // gate (meridianStatus === 'hostile') for the rest of this playthrough.
      // Recovering from the EGM is supposed to close the disaster ending.
      updates.meridianStatus = deescalateMeridianStatus(state.meridianStatus, 'watching');
    }
    // PARTIAL_SUCCESS: the EGM proceeds with an uncertain outcome — no status change.
  }

  return updates;
}

// ── Vantage: apexActive/apexStatus escalation ladder + chairCeoSeparationProgress ──
// apexStatus/apexActive gate vevent_10/15's eligibility and drive the AGM Resolution 1
// vote penalty (AgmScreen.tsx); chairCeoSeparationProgress drives the AGM Resolution 3
// pass/fail lever and vote math. All three were previously never written anywhere.

type ApexStatusValue = GameState['apexStatus'];

const APEX_STATUS_RANK: Record<ApexStatusValue, number> = {
  monitoring: 0,
  escalating: 1,
  hostile: 2,
};

// Same direction-guarded ladder pattern as Rheinfeld's meridianStatus (see above).
function escalateApexStatus(current: ApexStatusValue, target: ApexStatusValue): ApexStatusValue {
  return APEX_STATUS_RANK[target] > APEX_STATUS_RANK[current] ? target : current;
}

function deescalateApexStatus(current: ApexStatusValue, target: ApexStatusValue): ApexStatusValue {
  return APEX_STATUS_RANK[target] < APEX_STATUS_RANK[current] ? target : current;
}

export function applyVantageFlagUpdates(
  state: GameState,
  eventId: string,
  strategyId: string,
  outcomeTier: OutcomeTier
): Partial<GameState> {
  const updates: Partial<GameState> = {};

  // vevent_02 (Apex's opening disclosure) and vevent_09 (AGM): both narrate Apex
  // standing down or ramping up depending on outcome, but neither is the direct
  // negotiation/battle — so neither ever reaches 'hostile' or touches apexActive.
  if (eventId === 'vevent_02' || eventId === 'vevent_09') {
    if (outcomeTier === 'FAILURE' || outcomeTier === 'CRITICAL_FAILURE') {
      updates.apexStatus = escalateApexStatus(state.apexStatus, 'escalating');
    } else if (outcomeTier === 'SUCCESS' || outcomeTier === 'CRITICAL_SUCCESS') {
      updates.apexStatus = deescalateApexStatus(state.apexStatus, 'monitoring');
    } else if (eventId === 'vevent_09' && outcomeTier === 'PARTIAL_SUCCESS') {
      // AGM PARTIAL_SUCCESS: "guarantees six more months of activist pressure" —
      // unlike vevent_02's PARTIAL_SUCCESS (no real signal either way), this one
      // explicitly escalates.
      updates.apexStatus = escalateApexStatus(state.apexStatus, 'escalating');
    }
  }

  // vevent_10 (Apex Escalation — the direct negotiation): this is the one event that
  // can fully neutralise Apex, and the only pre-endgame source of chairCeoSeparationProgress.
  if (eventId === 'vevent_10') {
    if (outcomeTier === 'CRITICAL_SUCCESS') {
      // "Apex agrees to a standstill" — full neutralisation. Intentional, not a bug:
      // this permanently closes vevent_15's fullCrisis-equivalent gate (apexActive
      // required) for the rest of the playthrough, the same way winning Rheinfeld's
      // revent_12 EGM settlement locks out revent_15. Recovering is supposed to
      // close the disaster ending.
      updates.apexActive = false;
      updates.apexStatus = deescalateApexStatus(state.apexStatus, 'monitoring');
    } else if (outcomeTier === 'SUCCESS') {
      // "Apex scales back publicly, though everyone knows they're keeping the
      // receipts" — de-escalated, but still active and could flare up again.
      updates.apexStatus = deescalateApexStatus(state.apexStatus, 'monitoring');
    } else if (outcomeTier === 'FAILURE' || outcomeTier === 'CRITICAL_FAILURE') {
      updates.apexStatus = escalateApexStatus(state.apexStatus, 'hostile');
    }
    // PARTIAL_SUCCESS: "a pause, not a peace" — no status change.

    // Strategy A ("negotiate directly; offer one board seat and commitments") is the
    // only vevent_10 strategy whose negotiated terms plausibly include a Chair/CEO
    // separation commitment — B (public rejection), C (independent review), and D
    // (do nothing) don't touch it, so they contribute no progress at any tier.
    if (strategyId === 'vevent_10_a') {
      const delta = outcomeTier === 'CRITICAL_SUCCESS' ? 30 : outcomeTier === 'SUCCESS' ? 20 : 0;
      if (delta > 0) {
        updates.chairCeoSeparationProgress = Math.min(100, state.chairCeoSeparationProgress + delta);
      }
    }
  }

  // vevent_15 (Full Proxy Battle — the endgame): belt-and-suspenders escalation to
  // 'hostile' on a loss (the precondition already requires apexActive, so status is
  // usually 'hostile' by the time this fires, but not guaranteed if GH dropped for
  // unrelated reasons), and full neutralisation on a win — same "intentional lockout"
  // reasoning as vevent_10's CRITICAL_SUCCESS above.
  if (eventId === 'vevent_15') {
    if (outcomeTier === 'SUCCESS' || outcomeTier === 'CRITICAL_SUCCESS') {
      updates.apexActive = false;
      updates.apexStatus = deescalateApexStatus(state.apexStatus, 'monitoring');
    } else if (outcomeTier === 'FAILURE' || outcomeTier === 'CRITICAL_FAILURE') {
      updates.apexStatus = escalateApexStatus(state.apexStatus, 'hostile');
    }
    // PARTIAL_SUCCESS: "Apex takes two seats... power dynamics shifted" — unresolved, no change.
  }

  // vevent_05 (Chair/CEO Split: Institutional Shareholder Letter) — the event whose
  // entire premise is progress toward separation. Strategies A/B/C all move toward
  // it to varying degrees; strategy D ("reject the request; defend combined
  // structure") is the opposite premise, so it contributes 0 at every tier —
  // outcomeTiers narrative is shared across strategies in this schema, so a
  // well-executed *rejection* must not be misread as separation progress just
  // because the roll came back CRITICAL_SUCCESS.
  if (eventId === 'vevent_05' && strategyId !== 'vevent_05_d') {
    const delta =
      outcomeTier === 'CRITICAL_SUCCESS' ? 50 :
      outcomeTier === 'SUCCESS' ? 30 :
      outcomeTier === 'PARTIAL_SUCCESS' ? 10 : 0;
    if (delta > 0) {
      updates.chairCeoSeparationProgress = Math.min(100, state.chairCeoSeparationProgress + delta);
    }
  }

  return updates;
}

// ── Meridian: founderSyndromeScore (FSS) contested meter ──
// FSS gates mevent_09's auto-fire (checkEventPrecondition's 'mevent_09_fss_or_event03'
// case and checkEventCondition's mevent_09 override, both > 60) and was previously never
// written anywhere, so the auto-fire path — and the "Founder Syndrome -10/+6/..." deltas
// mevent_03's own narrative claims — were both dead. Unlike Vantage's apexActive, this is
// a genuine contested meter, not a one-way ratchet: mevent_03's narrative text states both
// directions explicitly (board acts decisively → score drops; board does nothing → score
// rises), so good outcomes must be able to pull it back down, not just floor at "no change."
export function applyMeridianFlagUpdates(
  state: GameState,
  eventId: string,
  outcomeTier: OutcomeTier
): Partial<GameState> {
  const updates: Partial<GameState> = {};

  // mevent_03 ("The Founder's Memo"): the sole pre-AGM driver. Same delta table
  // regardless of chosen strategy — outcomeTiers narrative is shared across
  // strategies in this schema, and here (unlike Vantage's vevent_05_d) none of
  // the four strategies represent an alternate premise that would make a good
  // roll mean something different; they're all just responses of varying
  // decisiveness to the same memo, and the tier already reflects that.
  if (eventId === 'mevent_03') {
    const delta =
      outcomeTier === 'CRITICAL_SUCCESS' ? -10 :
      outcomeTier === 'SUCCESS' ? -4 :
      outcomeTier === 'PARTIAL_SUCCESS' ? 6 :
      outcomeTier === 'FAILURE' ? 8 : 10;
    updates.founderSyndromeScore = Math.max(0, Math.min(100, state.founderSyndromeScore + delta));
  }

  // mevent_09 ("CEO Ultimatum"): the confrontation itself. These writes are
  // currently write-only — the only two FSS reads in the codebase both gate
  // mevent_09's own firing, and nothing downstream ever reads the score again
  // this playthrough. Kept anyway: it's cheap, it makes "Founder Syndrome
  // significantly reduced" (CRITICAL_SUCCESS) narratively honest rather than a
  // lie, and a future year-end debrief could plausibly read the final value.
  // Not a dead mechanic to "clean up" — just a producer with no consumer yet.
  if (eventId === 'mevent_09') {
    const delta =
      outcomeTier === 'CRITICAL_SUCCESS' ? -20 :
      outcomeTier === 'SUCCESS' ? -8 :
      outcomeTier === 'PARTIAL_SUCCESS' ? 8 :
      outcomeTier === 'FAILURE' ? 12 : 18;
    updates.founderSyndromeScore = Math.max(0, Math.min(100, state.founderSyndromeScore + delta));
  }

  return updates;
}

// ── Recalculate governance health breakdown ──

export function recalcGovernanceBreakdown(
  state: GameState
): GovernanceHealthBreakdown {
  const { board, committees } = state;
  const seats = board.seats;
  const getDir = (id: string) => state.directors.find((d) => d.id === id);

  // 1. Board Independence (0-20)
  // For German two-tier boards (Rheinfeld), exclude worker reps from independence count
  // since co-determination means they're structurally non-independent (this is expected under MitbestG).
  const workerRepPrefixes = ['rdir_w_'];
  const isWorkerRep = (id: string) => workerRepPrefixes.some((p) => id.startsWith(p));
  const nonChairSeats = seats.filter((s) => s.role !== 'chair' && !isWorkerRep(s.directorId));
  const independentCount = nonChairSeats.filter((s) => {
    const d = getDir(s.directorId);
    return d?.independence === 'independent';
  }).length;
  const indRatio = nonChairSeats.length > 0
    ? independentCount / nonChairSeats.length
    : 0;
  const boardIndependence = Math.round(Math.min(20, indRatio * 20 + (indRatio >= 0.5 ? 4 : 0)));

  // 2. Committee Completeness (0-20)
  let committeeScore = 0;
  if (committees.audit.active && committees.audit.chairDirectorId) committeeScore += 5;
  if (committees.remuneration.active && committees.remuneration.chairDirectorId) committeeScore += 5;
  if (committees.nomination.active && committees.nomination.chairDirectorId) committeeScore += 4;
  if (committees.safetyEnvironment.active && committees.safetyEnvironment.chairDirectorId) committeeScore += 3;
  if (committees.energyTransition.active && committees.energyTransition.chairDirectorId) committeeScore += 3;
  // Rheinfeld: strategy committee contributes to committee completeness
  if (committees.strategy.active) committeeScore += 3;
  const committeeCompleteness = Math.min(20, committeeScore);

  // 3. Chair-CEO Separation (0-20)
  const hasChair = seats.some((s) => s.role === 'chair');
  const chairIsIndependent = seats.some((s) => {
    if (s.role !== 'chair') return false;
    const d = getDir(s.directorId);
    return d?.independence === 'independent';
  });
  const hasSid = seats.some((s) => s.role === 'sid');
  let chairCeoSeparation = 0;
  if (hasChair) chairCeoSeparation += 10;
  if (chairIsIndependent) chairCeoSeparation += 6;
  if (hasSid) chairCeoSeparation += 4;

  // 4. ESG Governance (0-20)
  let esgGovernance = 0;
  if (committees.safetyEnvironment.active) esgGovernance += 5;
  if (committees.safetyEnvironment.chairDirectorId) {
    const chair = getDir(committees.safetyEnvironment.chairDirectorId);
    if (chair && chair.domainRatings.esgSustainability >= 70) esgGovernance += 5;
  }
  if (committees.energyTransition.active) esgGovernance += 5;
  if (committees.energyTransition.chairDirectorId) {
    const chair = getDir(committees.energyTransition.chairDirectorId);
    if (chair && chair.domainRatings.esgSustainability >= 70) esgGovernance += 5;
  }
  // Rheinfeld: CSRD committee contributes to ESG governance (replaces safetyEnvironment)
  if (committees.csrd.active) esgGovernance += 8;
  esgGovernance = Math.min(20, esgGovernance);

  // 5. Skill Matrix Coverage (0-20)
  const allDomains: CompetencyDomain[] = [
    'financialOversight', 'regulatoryLegal', 'strategyMarkets',
    'peopleCulture', 'esgSustainability', 'geopoliticalMacro',
    'technologyDigital', 'stakeholderComms',
  ];
  let coveredDomains = 0;
  for (const domain of allDomains) {
    const maxRating = Math.max(
      ...seats.map((s) => {
        const d = getDir(s.directorId);
        return d ? d.domainRatings[domain] : 0;
      }),
      0
    );
    if (maxRating >= 60) coveredDomains++;
  }
  const skillMatrixCoverage = Math.round((coveredDomains / 8) * 20);

  const clampSub = (v: number) => Math.min(20, Math.max(0, v));
  const cBI = clampSub(boardIndependence);
  const cCC = clampSub(committeeCompleteness);
  const cCS = clampSub(chairCeoSeparation);
  const cESG = clampSub(esgGovernance);
  const cSMC = clampSub(skillMatrixCoverage);
  const total = Math.min(100, Math.max(0, cBI + cCC + cCS + cESG + cSMC));

  return {
    boardIndependence: cBI,
    committeeCompleteness: cCC,
    chairCeoSeparation: cCS,
    esgGovernance: cESG,
    skillMatrixCoverage: cSMC,
    total,
  };
}

// ── Rescale governance health breakdown proportionally to match a new total ──

export function rescaleBreakdown(
  breakdown: GovernanceHealthBreakdown,
  newTotal: number
): GovernanceHealthBreakdown {
  const oldTotal = breakdown.total;
  if (oldTotal === 0 || oldTotal === newTotal) return { ...breakdown, total: newTotal };
  const clampedTotal = Math.min(100, Math.max(0, newTotal));
  const ratio = clampedTotal / oldTotal;
  const clampSub = (v: number) => Math.min(20, Math.max(0, v));
  const scaled = {
    boardIndependence: clampSub(Math.round(breakdown.boardIndependence * ratio)),
    committeeCompleteness: clampSub(Math.round(breakdown.committeeCompleteness * ratio)),
    chairCeoSeparation: clampSub(Math.round(breakdown.chairCeoSeparation * ratio)),
    esgGovernance: clampSub(Math.round(breakdown.esgGovernance * ratio)),
    skillMatrixCoverage: clampSub(Math.round(breakdown.skillMatrixCoverage * ratio)),
    total: clampedTotal,
  };
  // Fix rounding drift: adjust the largest component (respecting cap)
  const sum = scaled.boardIndependence + scaled.committeeCompleteness +
    scaled.chairCeoSeparation + scaled.esgGovernance + scaled.skillMatrixCoverage;
  const diff = clampedTotal - sum;
  if (diff !== 0) {
    const keys: (keyof Omit<GovernanceHealthBreakdown, 'total'>)[] = [
      'boardIndependence', 'committeeCompleteness', 'chairCeoSeparation',
      'esgGovernance', 'skillMatrixCoverage',
    ];
    const largest = keys.reduce((a, b) => scaled[a] >= scaled[b] ? a : b);
    scaled[largest] = clampSub(scaled[largest] + diff);
  }
  return scaled;
}

// ── Get all events data ──

export function getAllEvents(): GameEvent[] {
  return allEvents;
}

// ── Get SV history from resolved events ──

export function getSvHistory(state: GameState): { turn: string; sv: number }[] {
  const startingSv = state.company.startingSvIndex;
  const history: { turn: string; sv: number }[] = [
    { turn: 'Start', sv: startingSv },
  ];

  let running = startingSv;
  for (const resolved of state.resolvedEvents) {
    running = Math.max(0, Math.round((running + resolved.svDelta) * 100) / 100);
    const event = allEvents.find((e) => e.id === resolved.eventId);
    history.push({
      turn: `${resolved.resolvedAtQuarter} T${resolved.resolvedAtTurn}`,
      sv: running,
    });
  }

  return history;
}

// ── Proxy adviser rating based on governance health ──

export function getProxyAdviserRating(governanceHealth: number): string {
  if (governanceHealth >= 85) return 'Strong Governance \u2014 Recommend For';
  if (governanceHealth >= 70) return 'Adequate Governance \u2014 No Concerns';
  if (governanceHealth >= 55) return 'Mixed Governance \u2014 Monitor';
  if (governanceHealth >= 40) return 'Weak Governance \u2014 Concerns Raised';
  return 'Critical Governance Deficiency \u2014 Recommend Against';
}

// ── Energy regeneration at quarter boundaries ──

export function getDeployedDirectorIdsForQuarter(
  state: GameState,
  quarter: Quarter
): Set<string> {
  const deployed = new Set<string>();
  for (const resolved of state.resolvedEvents) {
    if (resolved.resolvedAtQuarter === quarter) {
      for (const id of resolved.deployedDirectorIds) {
        deployed.add(id);
      }
    }
  }
  return deployed;
}

export function applyBenchRegen(
  state: GameState,
  quarter: Quarter
): { state: GameState; regenDirectorIds: string[] } {
  const deployed = getDeployedDirectorIdsForQuarter(state, quarter);
  const boardDirectorIds = new Set(state.board.seats.map((s) => s.directorId));
  const regenDirectorIds: string[] = [];

  const updatedDirectors = state.directors.map((d) => {
    if (!boardDirectorIds.has(d.id)) return d;
    if (deployed.has(d.id)) return d;
    const newEnergy = Math.min(100, d.currentEnergy + 30);
    if (newEnergy > d.currentEnergy) {
      regenDirectorIds.push(d.id);
      return { ...d, currentEnergy: newEnergy };
    }
    return d;
  });

  return {
    state: { ...state, directors: updatedDirectors },
    regenDirectorIds,
  };
}

export function applyAgmRegen(
  state: GameState
): { state: GameState; regenDirectorIds: string[] } {
  const boardDirectorIds = new Set(state.board.seats.map((s) => s.directorId));
  const regenDirectorIds: string[] = [];

  const updatedDirectors = state.directors.map((d) => {
    if (!boardDirectorIds.has(d.id)) return d;
    const newEnergy = Math.min(100, d.currentEnergy + 20);
    if (newEnergy > d.currentEnergy) {
      regenDirectorIds.push(d.id);
      return { ...d, currentEnergy: newEnergy };
    }
    return d;
  });

  return {
    state: { ...state, directors: updatedDirectors },
    regenDirectorIds,
  };
}


// ── Get max turns for a quarter ──

export function getMaxTurnsForQuarter(quarter: Quarter, eventSchedule?: ScheduledEvent[]): number {
  // Use provided schedule or fall back to Harwick default
  const schedule = eventSchedule ?? require('@/data/company').harwickEnergy.eventSchedule;
  const scheduled = schedule.filter((s: ScheduledEvent) => s.quarter === quarter);
  return Math.max(...scheduled.map((s: ScheduledEvent) => s.turn), 0);
}

// ── AGM vote estimation ──

export function estimateAgmVotes(
  state: GameState
): { forPercent: number; againstPercent: number } {
  // Base from governance health
  const baseFor = 40 + state.governanceHealth * 0.4;
  // Penalty from board tension
  const tensionPenalty = state.boardTension > 60 ? (state.boardTension - 60) * 0.2 : 0;
  // Bonus from resolved events
  const successCount = state.resolvedEvents.filter(
    (r) => r.outcomeTier === 'SUCCESS' || r.outcomeTier === 'CRITICAL_SUCCESS'
  ).length;
  const failCount = state.resolvedEvents.filter(
    (r) => r.outcomeTier === 'FAILURE' || r.outcomeTier === 'CRITICAL_FAILURE'
  ).length;
  const eventBonus = (successCount - failCount) * 2;

  const forPercent = Math.max(10, Math.min(95, baseFor - tensionPenalty + eventBonus));
  return {
    forPercent: Math.round(forPercent),
    againstPercent: Math.round(100 - forPercent),
  };
}
