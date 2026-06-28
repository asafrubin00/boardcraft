'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense, useRef } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';
import AboutModal from '@/components/AboutModal';
import type { BoardSeat, GameState, ResolutionOutput, Company, ForcedDirectorChange, CommitteeId } from '@/types/game';
import {
  initializeGameState,
  getCurrentEvent,
  advanceToNextTurn,
  applyResolution,
  recalcGovernanceBreakdown,
  rescaleBreakdown,
  getSvHistory,
  getProxyAdviserRating,
  estimateAgmVotes,
  getMaxTurnsForQuarter,
  applyBenchRegen,
  applyAgmRegen,
} from '@/engine/gameStateManager';
import { useSearchParams } from 'next/navigation';
import CompanySelectScreen from '@/components/CompanySelectScreen';
import GameBoardScreen from '@/components/GameBoardScreen';
import AgmScreen from '@/components/AgmScreen';
import YearEndScreen from '@/components/YearEndScreen';
import { directors as _devDirectors } from '@/data/directors';
import { computeFeeWithPremium as _devComputeFee } from '@/engine/compliance';
import type { BoardRole as _DevBoardRole } from '@/types/game';
import { harwickEnergy } from '@/data/company';
import { vantageConsumer } from '@/data/vantage/company';
import { rheinfeldAG } from '@/data/rheinfeld/company';
import { straitsFinancialGroup } from '@/data/sfg/company';
import { rheinfeldDirectors } from '@/data/rheinfeld/directors';
import {
  checkHealthCrisis,
  checkMisconduct,
  applyForcedRemoval,
  applyRetainDirector,
  applyReplacement,
  tickForcedChangeTimer,
} from '@/engine/forcedChanges';
import { playBoardSeatDrop, playBoardSeatRemove, playBoardConfirm, playDirectorSelect, ensureAudioContext } from '@/engine/soundEngine';
import HintModal from '@/components/HintModal';

// ── Dev-only pre-built boards ──
const DEV_BOARD_HARWICK: { id: string; role: _DevBoardRole }[] = [
  { id: 'dir_18_whitmore', role: 'chair' },
  { id: 'dir_01_wren', role: 'auditChair' },
  { id: 'dir_10_lonsdale', role: 'remChair' },
  { id: 'dir_24_voss', role: 'nomChair' },
  { id: 'dir_13_okafor', role: 'ned' },
  { id: 'dir_21_mensah', role: 'sid' },
  { id: 'dir_15_holt', role: 'ned' },
  { id: 'dir_12_tanaka', role: 'ned' },
];

const DEV_BOARD_VANTAGE: { id: string; role: _DevBoardRole }[] = [
  { id: 'vdir_15_vance', role: 'sid' },
  { id: 'vdir_05_stern', role: 'auditChair' },
  { id: 'vdir_11_carter', role: 'remChair' },
  { id: 'vdir_12_okoye', role: 'nomChair' },
  { id: 'vdir_04_park', role: 'safetyEnvChair' },
  { id: 'vdir_01_kellerman', role: 'ned' },
  { id: 'vdir_13_thornton', role: 'ned' },
  { id: 'vdir_14_mendez', role: 'ned' },
];

const DEV_BOARD_RHEINFELD: { id: string; role: _DevBoardRole }[] = [
  { id: 'rdir_heinrich', role: 'chair' },
  { id: 'rdir_margarethe', role: 'ned' },
  { id: 'rdir_strasser', role: 'auditChair' },
  { id: 'rdir_w_koch', role: 'ned' },
  { id: 'rdir_w_alrashid', role: 'ned' },
  { id: 'rdir_w_hoffmann', role: 'ned' },
  { id: 'rdir_w_mehta', role: 'ned' },
  { id: 'rdir_w_gruber', role: 'ned' },
  { id: 'rdir_01_lehrmann', role: 'remChair' },
  { id: 'rdir_02_fleischer', role: 'ned' },
];

// SFG dev board: Helena Soong (10yr) still seated — triggers two-tier AGM vote
const DEV_BOARD_SFG: { id: string; role: _DevBoardRole }[] = [
  { id: 'sfgdir_01_lim', role: 'chair' },
  { id: 'sfgdir_02_soong', role: 'sid' },       // 10yr tenure → triggers two-tier vote
  { id: 'sfgdir_08_tan_margaret', role: 'auditChair' },
  { id: 'sfgdir_07_anwar', role: 'riskChair' },
  { id: 'sfgdir_03_goh', role: 'remChair' },
  { id: 'sfgdir_04_rahman', role: 'nomChair' },
  { id: 'sfgdir_05_png', role: 'ned' },
];

function buildDevBoard(board: { id: string; role: _DevBoardRole }[]): BoardSeat[] {
  return board.map(({ id, role }) => {
    const dir = _devDirectors.find((d) => d.id === id);
    return { directorId: id, role, feeWithPremium: _devComputeFee(dir?.annualFee ?? 100_000, role) };
  });
}

type PlayPhase = 'company_select' | 'board_construction' | 'gameplay' | 'agm' | 'year_end';

function AboutButton() {
  const [showAbout, setShowAbout] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowAbout(true)}
        className="fixed bottom-4 left-4 z-40 w-8 h-8 rounded-full bg-navy/80 border border-gold/40 text-gold text-sm font-bold flex items-center justify-center hover:bg-navy hover:border-gold/70 transition-colors cursor-pointer"
        title="About BoardCraft"
      >
        ?
      </button>
      <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
    </>
  );
}

export default function PlayPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-navy" />}>
        <PlayPageInner />
      </Suspense>
      <AboutButton />
    </ErrorBoundary>
  );
}

function PlayPageInner() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<PlayPhase>('company_select');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [devBooted, setDevBooted] = useState(false);
  const [agmResults, setAgmResults] = useState<{
    resolution1Pass: boolean;
    resolution2Pass: boolean;
    resolution3Pass: boolean;
    narrative: string;
  } | null>(null);
  const [regenDirectorIds, setRegenDirectorIds] = useState<string[]>([]);
  const [isRestart, setIsRestart] = useState(false);
  // ── Replacement confirmed ref: prevents modal from re-showing after atomic dismiss+replace ──
  const replacementConfirmed = useRef(false);

  // ── Dev shortcut: ?dev=q1|q2|q3|q4|agm|yearend skips to that phase ──
  useEffect(() => {
    if (devBooted) return;
    if (process.env.NODE_ENV !== 'development') return;
    const devParam = searchParams.get('dev');
    if (!devParam) return;

    // Also support legacy ?dev=true (same as q1)
    const devKey = devParam === 'true' ? 'q1' : devParam.toLowerCase();
    const validKeys = ['q1', 'q2', 'q3', 'q4', 'agm', 'yearend',
      'vantage-q1', 'vantage-q2', 'vantage-q3', 'vantage-q4', 'vantage-agm', 'vantage-yearend',
      'rheinfeld-q1', 'rheinfeld-q2', 'rheinfeld-q3', 'rheinfeld-q4', 'rheinfeld-agm', 'rheinfeld-yearend',
      'sfg-q1', 'sfg-q2', 'sfg-q3', 'sfg-q4', 'sfg-agm', 'sfg-yearend'];
    if (!validKeys.includes(devKey)) return;

    setDevBooted(true);
    const isVantage = devKey.startsWith('vantage-');
    const isRheinfeld = devKey.startsWith('rheinfeld-');
    const isSfgDev = devKey.startsWith('sfg-');
    const phaseKey = isVantage ? devKey.replace('vantage-', '')
      : isRheinfeld ? devKey.replace('rheinfeld-', '')
      : isSfgDev ? devKey.replace('sfg-', '')
      : devKey;
    const devCompany = isVantage ? vantageConsumer : isRheinfeld ? rheinfeldAG : isSfgDev ? straitsFinancialGroup : harwickEnergy;
    const seats = buildDevBoard(isVantage ? DEV_BOARD_VANTAGE : isRheinfeld ? DEV_BOARD_RHEINFELD : isSfgDev ? DEV_BOARD_SFG : DEV_BOARD_HARWICK);
    setSelectedCompany(devCompany);
    const state = initializeGameState(seats, false, devCompany);

    // Map dev key to quarter + phase
    const quarterMap: Record<string, { quarter: GameState['currentQuarter']; turn: number; phase: PlayPhase }> = {
      q1: { quarter: 'Q1', turn: 1, phase: 'gameplay' },
      q2: { quarter: 'Q2', turn: 1, phase: 'gameplay' },
      q3: { quarter: 'Q3', turn: 1, phase: 'gameplay' },
      q4: { quarter: 'Q4', turn: 1, phase: 'gameplay' },
      agm: { quarter: 'AGM', turn: 1, phase: 'agm' },
      yearend: { quarter: 'Q4', turn: 1, phase: 'year_end' },
    };
    const target = quarterMap[phaseKey];
    const started: GameState = {
      ...state,
      currentQuarter: target.quarter,
      currentTurn: target.turn,
      phase: target.phase === 'gameplay' ? 'gameplay' : target.phase === 'agm' ? 'agm' : 'year_end',
    };
    const breakdown = recalcGovernanceBreakdown(started);
    started.governanceHealthBreakdown = rescaleBreakdown(breakdown, 79);
    started.governanceHealth = 79;
    setGameState(started);
    setPhase(target.phase);
  }, [searchParams, devBooted]);

  // ── Mid-game persistence ──
  // A refresh or tab eviction must not lose a 30–60 minute session.
  // Saved during gameplay/AGM; cleared at year end, restart, or company change.
  const SAVE_KEY = 'boardcraft_saved_game';
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (searchParams.get('dev')) return; // dev shortcuts take priority
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved?.v !== 1 || !saved.gameState) return;
      setGameState(saved.gameState);
      setSelectedCompany(saved.gameState.company);
      setAgmResults(saved.agmResults ?? null);
      setPhase(saved.phase === 'agm' ? 'agm' : 'gameplay');
    } catch {
      // Corrupt save — discard rather than block the app
      try { localStorage.removeItem(SAVE_KEY); } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      if ((phase === 'gameplay' || phase === 'agm') && gameState) {
        localStorage.setItem(
          SAVE_KEY,
          JSON.stringify({ v: 1, phase, gameState, agmResults, savedAt: Date.now() })
        );
      } else if (phase === 'year_end') {
        // Game over — clearing prevents a refresh from double-recording career GC
        localStorage.removeItem(SAVE_KEY);
      }
    } catch {} // storage full/unavailable — play continues unsaved
  }, [phase, gameState, agmResults]);

  // ── Company Select → Board Construction ──
  const handleSelectCompany = useCallback((company: Company) => {
    setSelectedCompany(company);
    setPhase('board_construction');
  }, []);

  // ── Board Construction → Gameplay ──
  const handleStartGame = useCallback(
    (seats: BoardSeat[], hasEnergyTransition: boolean, optionalCommittees?: CommitteeId[]) => {
      const state = initializeGameState(seats, hasEnergyTransition, selectedCompany ?? undefined, optionalCommittees);
      const started: GameState = {
        ...state,
        currentQuarter: 'Q1',
        currentTurn: 1,
        phase: 'gameplay',
      };
      const breakdown = recalcGovernanceBreakdown(started);
      started.governanceHealthBreakdown = breakdown;
      started.governanceHealth = breakdown.total;
      setGameState(started);
      setPhase('gameplay');
    },
    [selectedCompany]
  );

  // ── Resolve event during gameplay ──
  const handleResolveEvent = useCallback(
    (strategyChoice: string, deployedDirectorIds: string[]): ResolutionOutput => {
      if (!gameState) throw new Error('No game state');
      const currentEvent = getCurrentEvent(gameState);
      if (!currentEvent) throw new Error('No current event');

      const { newState, output } = applyResolution(
        gameState,
        currentEvent.id,
        strategyChoice,
        deployedDirectorIds
      );

      const breakdown = recalcGovernanceBreakdown(newState);
      // Rescale breakdown proportionally to match the event-adjusted GH
      newState.governanceHealthBreakdown = rescaleBreakdown(breakdown, newState.governanceHealth);

      // Check for FMC-02: misconduct risk flag activation on deployed directors.
      // Flags only surface on events whose domains relate to the flag —
      // riskFlagTriggerCategories when authored, else the event's own domains.
      const eventDomains = currentEvent.riskFlagTriggerCategories ?? [
        currentEvent.primaryDomain,
        ...currentEvent.secondaryDomains.map((d) => d.domain),
      ];
      const misconduct = checkMisconduct(newState, deployedDirectorIds, eventDomains);
      if (misconduct) {
        // Activate the risk flag
        newState.directors = newState.directors.map((d) => {
          if (d.id === misconduct.directorId && d.riskFlag) {
            return { ...d, riskFlag: { ...d.riskFlag, activated: true } };
          }
          return d;
        });
        newState.forcedChange = misconduct;
      }

      // Check for boardEffect: if the chosen strategy mandates removing a director on success.
      // Only fires if no forced change is already queued (single-flight guard).
      if (!newState.forcedChange) {
        const chosenStrategy = currentEvent.strategies.find((s) => s.id === strategyChoice);
        const effect = chosenStrategy?.boardEffect;
        if (effect) {
          const TIER_RANK: Record<string, number> = {
            CRITICAL_SUCCESS: 4, SUCCESS: 3, PARTIAL_SUCCESS: 2, FAILURE: 1, CRITICAL_FAILURE: 0,
          };
          const tierMet =
            (TIER_RANK[output.outcomeTier] ?? 0) >= (TIER_RANK[effect.minOutcomeTier] ?? 99);
          const directorOnBoard = newState.board.seats.some((s) => s.directorId === effect.removeDirectorId);
          if (tierMet && directorOnBoard) {
            const removedDir = newState.directors.find((d) => d.id === effect.removeDirectorId);
            const afterRemoval = applyForcedRemoval(newState, effect.removeDirectorId);
            Object.assign(newState, afterRemoval);
            const roleLabel = effect.vacatedRole === 'auditChair' ? 'Audit Chair' : effect.vacatedRole;
            newState.forcedChange = {
              type: 'event_resolution',
              directorId: effect.removeDirectorId,
              directorName: removedDir?.name ?? effect.removeDirectorId,
              turnsRemaining: 2,
              narrative: `${removedDir?.name ?? 'The director'} has vacated their ${roleLabel} seat as a result of this event. Appoint a replacement from the candidate pool.`,
              canRetain: false,
            };
            // Silent simultaneous removals (e.g. mevent_14 CRITICAL_SUCCESS: Osei-Bonsu departs alongside Mensah)
            if (effect.simultaneousRemoveIds) {
              for (const simId of effect.simultaneousRemoveIds) {
                if (newState.board.seats.some((s) => s.directorId === simId)) {
                  const afterSim = applyForcedRemoval(newState, simId);
                  Object.assign(newState, afterSim);
                  if (newState.forcedChange) {
                    const simName = newState.directors.find((d) => d.id === simId)?.name ?? simId;
                    newState.forcedChange = {
                      ...newState.forcedChange,
                      narrative: newState.forcedChange.narrative +
                        ` ${simName} has also departed as part of this board renewal.`,
                    };
                  }
                }
              }
            }
          }
        }
      }

      // ── mevent_09 CRITICAL_SUCCESS: Osei-Bonsu retain-or-replace ──
      if (!newState.forcedChange && currentEvent.id === 'mevent_09' &&
          strategyChoice === 'mevent_09_a' && output.outcomeTier === 'CRITICAL_SUCCESS') {
        const oseiBonsu = newState.directors.find((d) => d.id === 'mdir_osei_bonsu');
        if (oseiBonsu && newState.board.seats.some((s) => s.directorId === 'mdir_osei_bonsu')) {
          newState.forcedChange = {
            type: 'event_resolution',
            directorId: 'mdir_osei_bonsu',
            directorName: oseiBonsu.name,
            turnsRemaining: 2,
            narrative: 'The board has formally established role boundaries. Dr. Osei-Bonsu must now choose: accept the resolution and continue as trustee, or step down gracefully.',
            canRetain: true,
          };
        }
      }

      // ── mevent_14 CRITICAL_FAILURE: Osei-Bonsu becomes chair (role swap, no modal) ──
      if (currentEvent.id === 'mevent_14' && output.outcomeTier === 'CRITICAL_FAILURE') {
        newState.board.seats = newState.board.seats.map((s) => {
          if (s.directorId === 'mdir_mensah') return { ...s, role: 'ned' as const };
          if (s.directorId === 'mdir_osei_bonsu') return { ...s, role: 'chair' as const };
          return s;
        });
      }

      // ── revent_12 FAILURE/CRITICAL_FAILURE: Supervisory Board loses two members ──
      if (currentEvent.id === 'revent_12' &&
          (output.outcomeTier === 'FAILURE' || output.outcomeTier === 'CRITICAL_FAILURE')) {
        // Worker reps (rdir_w_*) and Heinrich (fixed chair) are protected
        const removableSeats = newState.board.seats.filter(
          (s) => !s.directorId.startsWith('rdir_w_') && s.directorId !== 'rdir_heinrich'
        );
        const toRemove = removableSeats
          .map((s) => ({
            id: s.directorId,
            tenure: newState.directors.find((d) => d.id === s.directorId)?.tenure ?? 999,
          }))
          .sort((a, b) => a.tenure - b.tenure)
          .slice(0, 2);
        const removedNames: string[] = [];
        for (const { id } of toRemove) {
          const dir = newState.directors.find((d) => d.id === id);
          if (dir) removedNames.push(dir.name);
          Object.assign(newState, applyForcedRemoval(newState, id));
        }
        if (removedNames.length > 0) {
          newState.pendingBoardNotification =
            `Following the EGM vote, ${removedNames.join(' and ')} have been removed from the Supervisory Board.`;
        }
      }

      // ── sfgevent_04: CEO whistleblower — set investigation outcome flag ──
      if (currentEvent.id === 'sfgevent_04') {
        const isSuccess =
          output.outcomeTier === 'SUCCESS' || output.outcomeTier === 'CRITICAL_SUCCESS';
        const chosenStrategyId = strategyChoice;
        // Strategies A and B = commission independent investigation → substantiated track
        // Strategies C and D = internal handling / silence → cleared (suppressed)
        const isInvestigationCommissioned =
          chosenStrategyId === 'sfgevent_04_a' || chosenStrategyId === 'sfgevent_04_b';
        if (isSuccess && isInvestigationCommissioned) {
          newState.ceoWhistleblower = 'substantiated';
        } else {
          newState.ceoWhistleblower = 'cleared';
        }
      }

      // ── revent_12 CRITICAL_SUCCESS: Meridian Capital wins one supervisory board seat ──
      if (currentEvent.id === 'revent_12' && output.outcomeTier === 'CRITICAL_SUCCESS') {
        // Idempotency guard — Reuter should never be added twice
        if (!newState.directors.some((d) => d.id === 'rdir_12_reuter')) {
          const reuter = rheinfeldDirectors.find((d) => d.id === 'rdir_12_reuter');
          if (reuter) newState.directors = [...newState.directors, reuter];
        }
        Object.assign(newState, applyReplacement(newState, 'rdir_12_reuter', 'ned'));
        newState.pendingBoardNotification =
          "Following the negotiated settlement, Dr. Johanna Reuter joins the Supervisory Board as Meridian Capital's nominee.";
      }

      setGameState(newState);
      return output;
    },
    [gameState]
  );

  // ── Forced Change handlers ──
  /** Atomic: dismiss departing director AND appoint replacement in one state update */
  const handleForcedDismissAndReplace = useCallback(
    (dismissedDirectorId: string, newDirectorId: string, role: _DevBoardRole) => {
      if (!gameState) return;
      // First remove the departing director, then appoint the replacement
      const afterRemoval = applyForcedRemoval(gameState, dismissedDirectorId);
      const afterReplacement = applyReplacement(afterRemoval, newDirectorId, role);
      const breakdown = recalcGovernanceBreakdown(afterReplacement);
      afterReplacement.governanceHealthBreakdown = rescaleBreakdown(breakdown, afterReplacement.governanceHealth);
      // Mark replacement confirmed so the modal doesn't re-show while state propagates
      replacementConfirmed.current = true;
      setGameState(afterReplacement);
    },
    [gameState]
  );

  const handleForcedRetain = useCallback(() => {
    if (!gameState) return;
    const updated = applyRetainDirector(gameState);
    const breakdown = recalcGovernanceBreakdown(updated);
    updated.governanceHealthBreakdown = rescaleBreakdown(breakdown, updated.governanceHealth);
    setGameState(updated);
  }, [gameState]);

  // ── Skip event (Event 08 report card) ──
  const handleSkipEvent = useCallback(() => {
    if (!gameState) return;
    const currentEvent = getCurrentEvent(gameState);
    if (!currentEvent) return;

    const resolvedEvent = {
      eventId: currentEvent.id,
      outcomeTier: 'PARTIAL_SUCCESS' as const,
      svDelta: 0,
      deployedDirectorIds: [],
      strategyChosen: 'auto',
      resolvedAtTurn: gameState.currentTurn,
      resolvedAtQuarter: gameState.currentQuarter,
    };

    setGameState({
      ...gameState,
      resolvedEvents: [...gameState.resolvedEvents, resolvedEvent],
    });
  }, [gameState]);

  // ── Advance to next turn ──
  const handleAdvanceTurn = useCallback(() => {
    if (!gameState) return;

    const previousQuarter = gameState.currentQuarter;
    let next = advanceToNextTurn(gameState);

    // Skip conditional events that don't fire
    while (next.phase !== 'year_end') {
      const event = getCurrentEvent(next);
      if (event !== null) break;
      // Check if this is AGM
      if (next.currentQuarter === 'AGM') break;
      // Check if there are more turns
      const nextNext = advanceToNextTurn(next);
      if (nextNext.currentQuarter === next.currentQuarter && nextNext.currentTurn === next.currentTurn) {
        // Stuck - move to year end
        next = { ...next, phase: 'year_end' as const };
        break;
      }
      next = nextNext;
    }

    // Apply bench regen when the quarter changes (30% to non-deployed directors)
    if (next.currentQuarter !== previousQuarter && previousQuarter !== 'AGM') {
      const regen = applyBenchRegen(next, previousQuarter);
      next = regen.state;
      if (regen.regenDirectorIds.length > 0) {
        setRegenDirectorIds(regen.regenDirectorIds);
      }
    }

    // Tick down any existing forced change timer
    if (next.forcedChange) {
      next = tickForcedChangeTimer(next);
    }

    // Check for FMC-01: Health Crisis (15% per quarter after Q1)
    if (next.currentQuarter !== previousQuarter && !next.forcedChange && !next.healthCrisisFired) {
      const crisis = checkHealthCrisis(next);
      if (crisis) {
        next = {
          ...applyForcedRemoval(next, crisis.directorId),
          forcedChange: crisis,
          healthCrisisFired: true,
        };
      }
    }

    if (next.currentQuarter === 'AGM' && next.phase !== 'year_end') {
      setPhase('agm');
    } else if (next.phase === 'year_end') {
      setPhase('year_end');
    }

    setGameState(next);
  }, [gameState]);

  // ── AGM resolution ──
  const handleResolveAgm = useCallback(
    (strategyChoice: string, deployedDirectorIds: string[]) => {
      if (!gameState) return;

      // Find the AGM event for the current company
      const agmEvent = getCurrentEvent(gameState);
      const agmEventId = agmEvent?.id ?? 'event_09';

      const { newState, output } = applyResolution(
        gameState,
        agmEventId,
        strategyChoice,
        deployedDirectorIds
      );

      const breakdown = recalcGovernanceBreakdown(newState);

      // Determine AGM results based on outcome
      const isSuccess =
        output.outcomeTier === 'SUCCESS' ||
        output.outcomeTier === 'CRITICAL_SUCCESS';
      const isPartial = output.outcomeTier === 'PARTIAL_SUCCESS';

      // ── SFG two-tier vote for Res1 ──
      let resolution1Pass: boolean;
      if (newState.company.id === 'company_sfg') {
        const sfgLongTenure = newState.board.seats
          .map((s) => newState.directors.find((d) => d.id === s.directorId))
          .filter((d) => d !== undefined && (d.tenure ?? 0) > 9);
        if (sfgLongTenure.length === 0) {
          // No contested re-elections — standard vote
          resolution1Pass = isSuccess || isPartial;
        } else {
          // Renewal roadmap: strategy A = roadmap disclosed → Glass Lewis Asia "for"
          const glAssLewisFor = strategyChoice === 'sfgevent_13_a';
          const tenurePenalty = sfgLongTenure.length * -6;
          const baseVoteFor = 50 + (newState.governanceHealth - 50) * 0.3;
          const tier1For = Math.max(5, Math.min(95, baseVoteFor + tenurePenalty));
          const tier1Pass = tier1For > 50;
          const glPenalty = glAssLewisFor ? 0 : -18;
          const tier2For = Math.max(5, Math.min(95, baseVoteFor + tenurePenalty + glPenalty - 10));
          const tier2Pass = tier2For > 50;
          resolution1Pass = tier1Pass && tier2Pass;
          // Force the long-tenured directors off the board if the two-tier vote fails
          if (!resolution1Pass) {
            for (const dir of sfgLongTenure) {
              if (dir && newState.board.seats.some((s) => s.directorId === dir.id)) {
                Object.assign(newState, applyForcedRemoval(newState, dir.id));
              }
            }
          }
        }
      } else {
        resolution1Pass = isSuccess || isPartial;
      }

      const resolution2Pass = isSuccess;
      // Resolution 3 on partial outcomes hinges on the company-specific lever:
      // Harwick/default — ET committee demonstrates ESG credibility
      // Vantage — board-endorsed Chair/CEO separation momentum carries the proposal
      // Rheinfeld — Meridian Capital's pressure carries its strategic review
      const res3PartialLever =
        newState.company.id === 'company_vantage'
          ? newState.chairCeoSeparationProgress >= 50
          : newState.company.id === 'company_rheinfeld'
            ? newState.meridianActive
            : newState.committees.energyTransition.active;
      const resolution3Pass = isSuccess || (isPartial && res3PartialLever);

      // AGM GH bonus: all resolutions pass → +5, one or zero pass → -8
      const passCount = [resolution1Pass, resolution2Pass, resolution3Pass].filter(Boolean).length;
      const agmGhDelta = passCount === 3 ? 5 : passCount <= 1 ? -8 : 0;
      newState.governanceHealth = Math.max(0, Math.min(100, newState.governanceHealth + agmGhDelta));
      newState.governanceHealthBreakdown = rescaleBreakdown(breakdown, newState.governanceHealth);

      // ── event_09 Harwick AGM: Crane stands down gracefully ──
      if (newState.company.id === 'company_harwick' && strategyChoice === 'event_09_b') {
        if (newState.board.seats.some((s) => s.directorId === 'dir_08_crane')) {
          Object.assign(newState, applyForcedRemoval(newState, 'dir_08_crane'));
        }
      }

      setGameState(newState);

      setAgmResults({
        resolution1Pass,
        resolution2Pass,
        resolution3Pass,
        narrative: output.narrativeText,
      });
    },
    [gameState]
  );

  // ── Post-AGM continue ──
  const handleAgmContinue = useCallback(() => {
    if (!gameState) return;
    setAgmResults(null);
    // Advance past AGM to Q3
    let next = advanceToNextTurn(gameState);
    // Apply AGM regen: +20% energy to ALL directors (inter-season break)
    const regen = applyAgmRegen(next);
    next = regen.state;
    if (regen.regenDirectorIds.length > 0) {
      setRegenDirectorIds(regen.regenDirectorIds);
    }
    setGameState(next);
    setPhase('gameplay');
  }, [gameState]);

  // ── Restart - skip company select, go straight to board construction ──
  const handleRestart = useCallback(() => {
    try { localStorage.removeItem('boardcraft_saved_game'); } catch {}
    setGameState(null);
    setAgmResults(null);
    setRegenDirectorIds([]);
    setIsRestart(true);
    setPhase('board_construction');
  }, []);

  // ── Change Company - full reset back to company select ──
  const handleChangeCompany = useCallback(() => {
    try { localStorage.removeItem('boardcraft_saved_game'); } catch {}
    setGameState(null);
    setAgmResults(null);
    setRegenDirectorIds([]);
    setIsRestart(false);
    setDevBooted(false);
    setSelectedCompany(null);
    setPhase('company_select');
  }, []);

  // ── Reset replacementConfirmed when a new forcedChange arrives ──
  useEffect(() => {
    if (gameState?.forcedChange) {
      replacementConfirmed.current = false;
    }
  }, [gameState?.forcedChange?.directorId]);

  // ── Derived values ──
  const svHistory = useMemo(() => {
    if (!gameState) return [];
    return getSvHistory(gameState);
  }, [gameState]);

  const proxyAdviserRating = useMemo(() => {
    if (!gameState) return '';
    return getProxyAdviserRating(gameState.governanceHealth);
  }, [gameState]);

  const currentEvent = useMemo(() => {
    if (!gameState) return null;
    return getCurrentEvent(gameState);
  }, [gameState]);

  // ── Render by phase ──
  if (phase === 'company_select') {
    return <CompanySelectScreen onSelectCompany={handleSelectCompany} />;
  }

  if (phase === 'board_construction' && selectedCompany) {
    return <BoardConstructionWrapper company={selectedCompany} onStartGame={(seats, hasET, optComm) => { setIsRestart(false); handleStartGame(seats, hasET, optComm); }} isRestart={isRestart} />;
  }

  if (phase === 'agm' && gameState) {
    return (
      <AgmScreen
        gameState={gameState}
        onResolveAgm={handleResolveAgm}
        onContinue={handleAgmContinue}
        results={agmResults ?? undefined}
        onChangeCompany={handleChangeCompany}
      />
    );
  }

  if (phase === 'year_end' && gameState) {
    return <YearEndScreen gameState={gameState} onRestart={handleRestart} onChangeCompany={handleChangeCompany} agmResults={agmResults ?? undefined} />;
  }

  if (phase === 'gameplay' && gameState) {
    return (
      <>
        <GameBoardScreen
          gameState={gameState}
          currentEvent={currentEvent}
          svHistory={svHistory}
          proxyAdviserRating={proxyAdviserRating}
          onResolveEvent={handleResolveEvent}
          onAdvanceTurn={handleAdvanceTurn}
          onSkipEvent={handleSkipEvent}
          regenDirectorIds={regenDirectorIds}
          onClearRegen={() => setRegenDirectorIds([])}
          onForcedDismissAndReplace={handleForcedDismissAndReplace}
          onForcedRetain={handleForcedRetain}
          showForcedModal={!!gameState.forcedChange && !replacementConfirmed.current}
          onQuit={handleChangeCompany}
        />
        {gameState.pendingBoardNotification && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(13,27,42,0.96)', border: '1px solid rgba(200,150,12,0.45)',
            borderRadius: 12, padding: '14px 20px', maxWidth: 480, width: 'calc(100% - 48px)',
            color: '#E8DCC0', fontSize: 13, lineHeight: 1.6,
            zIndex: 40, display: 'flex', gap: 14, alignItems: 'flex-start',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            <span style={{ flex: 1 }}>{gameState.pendingBoardNotification}</span>
            <button
              onClick={() => setGameState((prev) => prev ? { ...prev, pendingBoardNotification: null } : prev)}
              style={{ color: '#C8960C', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 16, lineHeight: 1 }}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        )}
      </>
    );
  }

  return null;
}

// ── Board Construction Wrapper ──
// Three-panel boardroom interface: Pool | Centre | Table

import { directors as allDirectors } from '@/data/directors';
import { computeFeeWithPremium, checkCompliance } from '@/engine/compliance';
import CompliancePanel from '@/components/CompliancePanel';
import BoardGuideModal from '@/components/BoardGuideModal';
import BoardroomTable, {
  computeGridPositions,
  computeStandardGridPositions,
  deriveTablePositions,
  getOverflowDirectorIds,
  getRoleTooltip,
} from '@/components/BoardroomTable';
import DirectorPortrait from '@/components/DirectorPortrait';
import type { BoardRole, CompetencyDomain, CommitteeState, Director } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_SHORT, ROLE_LABELS, getRoleLabel, getShortRoleLabel } from '@/engine/boardConstants';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyLogo from '@/components/CompanyLogo';
import SiteFooter from '@/components/SiteFooter';

function fmtFee(value: number, jurisdiction: string = 'UK'): string {
  const sym = jurisdiction === 'US' ? '$' : jurisdiction === 'EU' ? '€' : '£';
  if (value >= 1_000_000) { const m = value / 1_000_000; return `${sym}${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`; }
  if (value >= 1_000) return `${sym}${Math.round(value / 1_000)}k`;
  return `${sym}${value}`;
}

function topDomains(ratings: Record<CompetencyDomain, number>, n: number) {
  return ALL_DOMAINS.map((d) => ({ domain: d, score: ratings[d] })).sort((a, b) => b.score - a.score).slice(0, n);
}

const INDEP_BADGE: Record<Director['independence'], { label: string; cls: string }> = {
  independent: { label: 'Independent', cls: 'bg-success/20 text-success border border-success/30' },
  questionable: { label: 'Questionable', cls: 'bg-warning/20 text-warning border border-warning/30' },
  'non-independent': { label: 'Non-Indep.', cls: 'bg-foreground/10 text-foreground/60 border border-foreground/20' },
};

const TIER_BADGE: Record<Director['availabilityTier'], { label: string; cls: string }> = {
  A: { label: 'Tier A', cls: 'bg-success/10 text-success border border-success/30' },
  B: { label: 'Tier B', cls: 'bg-warning/10 text-warning border border-warning/30' },
  C: { label: 'Search Firm', cls: 'bg-gold/10 text-gold border border-gold/30' },
};

const ALL_BOARD_ROLES: BoardRole[] = ['chair', 'sid', 'auditChair', 'remChair', 'nomChair', 'energyTransitionChair', 'csrdChair', 'strategyChair', 'ned'];

// Optional committee seat positions — all companies use left-column grid positions
// (leftPct=10). For N=9 companies the left column has no base seats, so these appear
// in the open left-column area, matching the Rheinfeld visual style.
const GRID_ETC_TABLE_POS = { defaultRole: 'energyTransitionChair' as BoardRole, label: 'ETC Chair', leftPct: 10, topPct: 27, isChair: false, labelAbove: false };
const GRID_CSRD_TABLE_POS = { defaultRole: 'csrdChair' as BoardRole, label: 'CSRD Chair', leftPct: 10, topPct: 50, isChair: false, labelAbove: false };
const GRID_STRATEGY_TABLE_POS = { defaultRole: 'strategyChair' as BoardRole, label: 'Strategy Chair', leftPct: 10, topPct: 73, isChair: false, labelAbove: false };

function getTablePosition(
  posIdx: number,
  hasEnergyTransition = false,
  hasCsrd = false,
  hasStrategy = false,
  forceGridLayout = false,
  effectiveGridSize = 9,
) {
  // All companies use square-perimeter grid layout.
  // Rheinfeld (forceGridLayout): computeGridPositions — Worker Rep labels, min 10 slots.
  // Standard: computeStandardGridPositions — SID/NomChair named slots, min 9 slots.
  const gridPositions = forceGridLayout
    ? computeGridPositions(effectiveGridSize)
    : computeStandardGridPositions(effectiveGridSize);

  if (posIdx < gridPositions.length) return gridPositions[posIdx];

  // Optional committee chair slots appended after the base grid.
  let optIdx = gridPositions.length;
  if (hasEnergyTransition) { if (posIdx === optIdx) return GRID_ETC_TABLE_POS; optIdx++; }
  if (hasCsrd)             { if (posIdx === optIdx) return GRID_CSRD_TABLE_POS; optIdx++; }
  if (hasStrategy)         { if (posIdx === optIdx) return GRID_STRATEGY_TABLE_POS; }
  return gridPositions[0]; // fallback
}

function BoardConstructionWrapper({
  company,
  onStartGame,
  isRestart = false,
}: {
  company: Company;
  onStartGame: (seats: BoardSeat[], hasEnergyTransition: boolean, optionalCommittees?: CommitteeId[]) => void;
  isRestart?: boolean;
}) {
  // ── Company-specific directors ──
  const availableDirectors = useMemo(() => {
    const companyDirIds = new Set(company.directorIds);
    const excludeIds = new Set(company.excludeDirectorIds);
    return allDirectors.filter((d) => companyDirIds.has(d.id) && !excludeIds.has(d.id));
  }, [company]);

  const directorMap = useMemo(() => new Map(availableDirectors.map((d) => [d.id, d])), [availableDirectors]);

  // Currency-aware fee formatter bound to company jurisdiction
  const fmt = useCallback((v: number) => fmtFee(v, company.jurisdiction), [company.jurisdiction]);

  // ── Core state ──
  // Inline initialisation avoids any useCallback closure timing edge cases during HMR.
  const [seats, setSeats] = useState<BoardSeat[]>(() =>
    company.inheritedBoard.map((ib) => ({
      directorId: ib.directorId,
      role: ib.role,
      feeWithPremium: company.boardBudget === 0 ? 0 : computeFeeWithPremium(ib.baseFee, ib.role),
    }))
  );
  const [hasEnergyTransition, setHasEnergyTransition] = useState(false);
  // For companies where the CSRD/Programmes committee is always active (e.g. Meridian),
  // initialise hasCsrd to true so the seat and role are available from the start.
  const [hasCsrd, setHasCsrd] = useState(
    () => company.committees.some((c) => c.id === 'csrd' && c.status === 'active')
  );
  // Same for Strategy committee
  const [hasStrategy, setHasStrategy] = useState(
    () => company.committees.some((c) => c.id === 'strategy' && c.status === 'active')
  );
  const [filterDomain, setFilterDomain] = useState<CompetencyDomain | null>(null);
  // Default to score sort for zero-budget companies (e.g. Meridian) where all fees show as £0
  const [sortBy, setSortBy] = useState<'fee' | 'score'>(company.boardBudget === 0 ? 'score' : 'fee');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(company.boardBudget === 0 ? 'desc' : 'asc');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [showBoardGuide, setShowBoardGuide] = useState(false);
  const [hintsShown, setHintsShown] = useState<number>(() => {
    if (typeof window === 'undefined') return -1;
    return localStorage.getItem('boardcraft_hints_seen') ? -1 : 0;
  });
  const [activeCommitteeHint, setActiveCommitteeHint] = useState<{ title: string; body: string } | null>(null);
  const [showRestartBanner, setShowRestartBanner] = useState(isRestart);

  // ── Interaction state ──
  const [activeSeatIdx, setActiveSeatIdx] = useState<number | null>(null);
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const [mobileOverlay, setMobileOverlay] = useState<null | 'pool' | 'compliance'>(null);

  // ── Touch drag state (mobile/tablet DnD) ──
  const touchDragRef = useRef<{ dirId: string; startX: number; startY: number; active: boolean } | null>(null);
  const [touchGhost, setTouchGhost] = useState<{ dirId: string; x: number; y: number } | null>(null);
  const touchGhostRef = useRef<HTMLDivElement | null>(null);
  const mobileOverlayRef = useRef<null | 'pool' | 'compliance'>(null);

  // ── Undo / Redo history ──
  const MAX_HISTORY = 20;
  const [history, setHistory] = useState<{ seats: BoardSeat[]; et: boolean }[]>([]);
  const [future, setFuture] = useState<{ seats: BoardSeat[]; et: boolean }[]>([]);

  /** Wrap setSeats to push current state to history first */
  const pushAndSetSeats = useCallback((updater: React.SetStateAction<BoardSeat[]>) => {
    setSeats((prev) => {
      // Push current snapshot to history
      setHistory((h) => {
        const next = [...h, { seats: prev, et: hasEnergyTransition }];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      setFuture([]); // clear redo stack on new action
      return typeof updater === 'function' ? updater(prev) : updater;
    });
  }, [hasEnergyTransition]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    setHistory((h) => {
      const last = h[h.length - 1];
      if (!last) return h;
      // Push current state to future
      setFuture((f) => [...f, { seats, et: hasEnergyTransition }]);
      setSeats(last.seats);
      setHasEnergyTransition(last.et);
      return h.slice(0, -1);
    });
  }, [history, seats, hasEnergyTransition]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    setFuture((f) => {
      const next = f[f.length - 1];
      if (!next) return f;
      // Push current state to history
      setHistory((h) => {
        const updated = [...h, { seats, et: hasEnergyTransition }];
        return updated.length > MAX_HISTORY ? updated.slice(updated.length - MAX_HISTORY) : updated;
      });
      setSeats(next.seats);
      setHasEnergyTransition(next.et);
      return f.slice(0, -1);
    });
  }, [future, seats, hasEnergyTransition]);


  useEffect(() => {
    if (showRestartBanner) { const t = setTimeout(() => setShowRestartBanner(false), 3000); return () => clearTimeout(t); }
  }, [showRestartBanner]);

  useEffect(() => { ensureAudioContext(); }, []);

  const dismissHint = useCallback(() => {
    setHintsShown(prev => {
      const next = prev + 1;
      if (next > 7) {
        if (typeof window !== 'undefined') localStorage.setItem('boardcraft_hints_seen', 'true');
        return -1;
      }
      return next;
    });
  }, []);

  /** Fire a committee hint once per company+committee (keyed by `storageKey`). */
  const showCommitteeHint = useCallback((title: string, body: string, storageKey: string) => {
    if (typeof window === 'undefined') return;
    const seen: string[] = JSON.parse(localStorage.getItem('boardcraft_committee_hints') ?? '[]');
    if (seen.includes(storageKey)) return;
    localStorage.setItem('boardcraft_committee_hints', JSON.stringify([...seen, storageKey]));
    setActiveCommitteeHint({ title, body });
  }, []);

  // ── Derived ──
  const budget = company.boardBudget;
  // For companies with no board budget (e.g. Meridian — unpaid trustees), all fees are £0
  // regardless of the director's base annualFee.
  const effectiveFee = (annualFee: number, role: BoardRole) =>
    budget === 0 ? 0 : computeFeeWithPremium(annualFee, role);
  const etFormationCost = company.committees.find((c) => c.id === 'energyTransition')?.formationCost ?? 180_000;
  const csrdFormationCost = company.committees.find((c) => c.id === 'csrd')?.formationCost ?? 0;
  const strategyFormationCost = company.committees.find((c) => c.id === 'strategy')?.formationCost ?? 0;
  const etCost = hasEnergyTransition ? etFormationCost : 0;
  const csrdCost = hasCsrd ? csrdFormationCost : 0;
  const strategyCost = hasStrategy ? strategyFormationCost : 0;
  const seatsFee = seats.reduce((sum, s) => sum + s.feeWithPremium, 0);
  const committed = seatsFee + etCost + csrdCost + strategyCost;
  const remaining = budget - committed;

  const forceGridLayout = company.id === 'company_rheinfeld';
  const effectiveGridSize = useMemo(() => {
    const committeeChairRoles = new Set(['csrdChair', 'strategyChair', 'energyTransitionChair']);
    const baseSeatCount = seats.filter(s => !committeeChairRoles.has(s.role)).length;
    return forceGridLayout ? Math.max(baseSeatCount, 10) : Math.max(baseSeatCount, 9);
  }, [forceGridLayout, seats]);

  const boardIds = useMemo(() => seats.map((s) => s.directorId), [seats]);
  const boardIdSet = useMemo(() => new Set(boardIds), [boardIds]);
  const tablePos = useMemo(() => deriveTablePositions(seats, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout), [seats, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout]);
  const overflowIds = useMemo(() => getOverflowDirectorIds(seats, tablePos), [seats, tablePos]);
  const overflowSet = useMemo(() => new Set(overflowIds), [overflowIds]);

  // Determine if Safety & Environment committee is active for this company
  const hasSafetyEnv = useMemo(() => {
    const seDef = company.committees.find((c) => c.id === 'safetyEnvironment');
    return seDef ? seDef.status === 'active' : false;
  }, [company]);

  const committees = useMemo((): Record<CommitteeId, CommitteeState> => {
    const fc = (role: BoardRole) => seats.find((s) => s.role === role)?.directorId ?? null;
    return {
      audit: { active: true, chairDirectorId: fc('auditChair') },
      remuneration: { active: fc('remChair') !== null, chairDirectorId: fc('remChair') },
      nomination: { active: true, chairDirectorId: fc('nomChair') },
      safetyEnvironment: { active: hasSafetyEnv, chairDirectorId: fc('safetyEnvChair') },
      energyTransition: { active: hasEnergyTransition, chairDirectorId: fc('energyTransitionChair') },
      csrd: {
        active: company.committees.some((c) => c.id === 'csrd' && c.status === 'active') || hasCsrd,
        // chairDirectorId is derived solely from the live seat state — no static fallback,
        // which would cause stale chair references after removing a director from the seat.
        chairDirectorId: fc('csrdChair'),
      },
      strategy: {
        active: company.committees.some((c) => c.id === 'strategy' && c.status === 'active') || hasStrategy,
        chairDirectorId: fc('strategyChair'),
      },
      risk: {
        active: company.committees.some((c) => c.id === 'risk' && c.status === 'active'),
        chairDirectorId: fc('riskChair'),
      },
      sustainability: {
        active: company.committees.some((c) => c.id === 'sustainability' && c.status === 'active'),
        chairDirectorId: fc('sustainabilityChair'),
      },
    };
  }, [seats, hasEnergyTransition, hasSafetyEnv, hasCsrd, hasStrategy, company]);

  const isCombinedChairCeo = company.id === 'company_vantage';
  const complianceErrors = useMemo(() => checkCompliance(seats, availableDirectors, committees, company.jurisdiction, isCombinedChairCeo, company.id), [seats, availableDirectors, committees, company.jurisdiction, isCombinedChairCeo, company.id]);
  const hasBlockingErrors = complianceErrors.some((e) => e.severity === 'error');

  // Derived seat-role helpers for contextual hints (hints 3-7)
  const hasChairFilled = useMemo(() => seats.some(s => s.role === 'chair'), [seats]);
  const hasAuditChairFilled = useMemo(() => seats.some(s => s.role === 'auditChair'), [seats]);
  const hasRemChairFilled = useMemo(() => seats.some(s => s.role === 'remChair'), [seats]);
  const hasIndependenceError = useMemo(() => complianceErrors.some(e => e.message.toLowerCase().includes('independen')), [complianceErrors]);
  const budgetLow = remaining < budget * 0.2 && budget > 0;

  // Hint 3 condition: chair filled but audit chair empty
  const hint3Ready = hasChairFilled && !hasAuditChairFilled;
  // Hint 4 condition: chair + audit filled but rem empty
  const hint4Ready = hasChairFilled && hasAuditChairFilled && !hasRemChairFilled;
  // Hint 5 condition: triggered when Board Strength popover opens (handled in onClick)
  // Hint 6 condition: independence compliance error present
  const hint6Ready = hasIndependenceError;
  // Hint 7 condition: budget below 20%
  const hint7Ready = budgetLow;

  useEffect(() => {
    // Hints 0-2: original sequential flow
    if (hintsShown === 0 && seats.length > 0) setHintsShown(1);
    if (hintsShown === 1 && !hasBlockingErrors) setHintsShown(2);
    // Hint 3: skip if audit chair already filled
    if (hintsShown === 3 && hasAuditChairFilled) setHintsShown(4);
    // Hint 4: skip if rem chair already filled
    if (hintsShown === 4 && hasRemChairFilled) setHintsShown(5);
    // Hint 5: Board Strength popover - skip if popover was already opened (wait handled below)
    // Hint 6: skip if no independence error and board has 6+ seats
    if (hintsShown === 6 && !hasIndependenceError && seats.length >= 6) setHintsShown(7);
    // Hint 7: skip if budget is not low and board is nearly full
    if (hintsShown === 7 && !budgetLow && seats.length >= 7) setHintsShown(8);
  }, [seats.length, hasBlockingErrors, hintsShown, hasChairFilled, hasAuditChairFilled, hasRemChairFilled, hasIndependenceError, budgetLow]);

  // ── Core handlers (preserved) ──
  const handleRemoveDirector = useCallback((id: string) => {
    pushAndSetSeats((p) => p.filter((s) => s.directorId !== id));
    playBoardSeatRemove();
    setActiveSeatIdx(null); setSelectedDirId(null);
  }, [pushAndSetSeats]);

  const handleRoleChange = useCallback((directorId: string, newRole: BoardRole) => {
    pushAndSetSeats((prev) => {
      const uniq: BoardRole[] = ['chair','auditChair','remChair','nomChair','sid','safetyEnvChair','energyTransitionChair','csrdChair','strategyChair'];
      const currentSeat = prev.find((s) => s.directorId === directorId);
      const oldRole = currentSeat?.role ?? 'ned';

      if (uniq.includes(newRole)) {
        const occupant = prev.find((s) => s.directorId !== directorId && s.role === newRole);
        if (occupant) {
          // Swap: give the occupant this director's old role
          const occupantDir = directorMap.get(occupant.directorId);
          const swapName = occupantDir?.name ?? 'another director';
          setTimeout(() => {
            setSwapMessage(`Role swapped with ${swapName}`);
            setTimeout(() => setSwapMessage(null), 2000);
          }, 0);
          return prev.map((s) => {
            if (s.directorId === directorId) {
              const d = directorMap.get(directorId);
              return { ...s, role: newRole, feeWithPremium: effectiveFee(d?.annualFee ?? 0, newRole) };
            }
            if (s.directorId === occupant.directorId) {
              return { ...s, role: oldRole, feeWithPremium: effectiveFee(occupantDir?.annualFee ?? 0, oldRole) };
            }
            return s;
          });
        }
      }

      setTimeout(() => {
        setSwapMessage('Role updated');
        setTimeout(() => setSwapMessage(null), 2000);
      }, 0);
      return prev.map((s) => {
        if (s.directorId !== directorId) return s;
        const d = directorMap.get(directorId);
        return { ...s, role: newRole, feeWithPremium: effectiveFee(d?.annualFee ?? 0, newRole) };
      });
    });
  }, [pushAndSetSeats, directorMap]);

  const handleToggleET = useCallback(() => {
    // Push history before ET toggle since it may change seats
    if (hasEnergyTransition) {
      pushAndSetSeats((p) => p.map((s) => s.role === 'energyTransitionChair'
        ? { ...s, role: 'ned', feeWithPremium: effectiveFee(directorMap.get(s.directorId)?.annualFee ?? 0, 'ned') } : s));
    } else {
      // First activation — fire company-specific committee hint
      if (company.id === 'company_harwick') {
        showCommitteeHint(
          'Energy Transition Chair',
          'Your Energy Transition Chair should have strong ESG credentials — look for a score of 70 or above. They will lead Harwick\'s response to net-zero pressure from institutional shareholders.',
          `${company.id}_et`,
        );
      } else if (company.id === 'company_vantage') {
        showCommitteeHint(
          'CA&R Chair',
          'Your Consumer Affairs and Regulatory Chair needs strong Regulatory expertise — score of 65 or above. They will handle FDA scrutiny, UPF regulation, and FTC inquiries.',
          `${company.id}_et`,
        );
      }
    }
    setHasEnergyTransition((p) => !p);
  }, [hasEnergyTransition, pushAndSetSeats, directorMap, company.id, showCommitteeHint]);

  const handleToggleCsrd = useCallback(() => {
    // If toggling off, demote any csrdChair seat back to NED
    if (hasCsrd) {
      pushAndSetSeats((p) => p.map((s) => s.role === 'csrdChair'
        ? { ...s, role: 'ned', feeWithPremium: effectiveFee(directorMap.get(s.directorId)?.annualFee ?? 0, 'ned') } : s));
    } else {
      showCommitteeHint(
        'CSRD Committee Chair',
        'Your CSRD Chair needs deep ESG expertise — score of 75 or above. CSRD compliance is existential for Rheinfeld. This is one of the most important appointments you will make.',
        `${company.id}_csrd`,
      );
    }
    setHasCsrd((p) => !p);
  }, [hasCsrd, pushAndSetSeats, directorMap, company.id, showCommitteeHint]);

  const handleToggleStrategy = useCallback(() => {
    // If toggling off, demote any strategyChair seat back to NED
    if (hasStrategy) {
      pushAndSetSeats((p) => p.map((s) => s.role === 'strategyChair'
        ? { ...s, role: 'ned', feeWithPremium: effectiveFee(directorMap.get(s.directorId)?.annualFee ?? 0, 'ned') } : s));
    } else {
      showCommitteeHint(
        'Strategy Chair',
        'Your Strategy Chair should have strong Strategy and Markets credentials — score of 65 or above. They will guide the Supervisory Board\'s response to the China pivot and US tariff crisis.',
        `${company.id}_strategy`,
      );
    }
    setHasStrategy((p) => !p);
  }, [hasStrategy, pushAndSetSeats, directorMap, company.id, showCommitteeHint]);

  // ── New interaction handlers ──
  const handleAssignToSeat = useCallback((directorId: string, posIdx: number) => {
    const pos = getTablePosition(posIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize);
    const d = directorMap.get(directorId);
    if (!d) return;

    const uniqRoles: BoardRole[] = ['chair','auditChair','remChair','nomChair','sid','safetyEnvChair','energyTransitionChair','csrdChair','strategyChair'];
    const fee = budget === 0 ? 0 : computeFeeWithPremium(d.annualFee, pos.defaultRole);
    const isOnBoard = boardIdSet.has(directorId);
    // Who currently occupies this visual slot?
    const currentOccupantId = tablePos[posIdx] ?? null;

    // No-op: dropped on own current seat
    if (currentOccupantId === directorId) return;

    if (isOnBoard && uniqRoles.includes(pos.defaultRole)) {
      // ── Case A: on-board director → named-role slot ──
      // Use existing role-change / swap logic (handles promotions and swaps correctly)
      handleRoleChange(directorId, pos.defaultRole);

    } else if (isOnBoard) {
      // ── Case B: on-board director → NED/non-unique slot ──
      // Must physically move the director in the seats array so their visual position changes.
      // handleRoleChange only updates the role field — it cannot move a NED to a different
      // visual slot because NED positions are determined by array order, not by role.
      pushAndSetSeats((p) => {
        const xSeat = p.find(s => s.directorId === directorId);
        if (!xSeat) return p;

        // If source director currently has a named role (e.g. AuditChair → NED slot),
        // just do a plain role update — they'll land at the first available NED slot.
        if (uniqRoles.includes(xSeat.role)) {
          return p.map(s => s.directorId !== directorId ? s
            : { ...s, role: pos.defaultRole, feeWithPremium: fee });
        }

        // Source is NED/non-unique → use array-position swap for a correct visual result.
        const xIdx = p.findIndex(s => s.directorId === directorId);
        const yIdx = currentOccupantId ? p.findIndex(s => s.directorId === currentOccupantId) : -1;
        if (xIdx < 0) return p;

        if (yIdx >= 0) {
          // Target slot occupied → swap array positions so both directors exchange visual slots
          const result = [...p];
          result[yIdx] = { directorId, role: pos.defaultRole, feeWithPremium: fee };
          result[xIdx] = { ...p[yIdx] }; // occupant keeps their role/fee, moves to X's old slot
          return result;
        } else {
          // Target slot empty → remove director from current position and append to end;
          // deriveTablePositions will place them at the next available NED slot.
          const filtered = p.filter(s => s.directorId !== directorId);
          return [...filtered, { directorId, role: pos.defaultRole, feeWithPremium: fee }];
        }
      });

    } else {
      // ── Case C: pool director → any slot ──
      if (budget > 0 && committed + fee > budget) return;
      pushAndSetSeats((p) => {
        if (uniqRoles.includes(pos.defaultRole)) {
          // Remove any existing holder of this named role
          const filtered = p.filter(s => s.role !== pos.defaultRole);
          return [...filtered, { directorId, role: pos.defaultRole, feeWithPremium: fee }];
        } else {
          // NED slot: if occupied, evict the current director back to pool (they're removed)
          const filtered = currentOccupantId ? p.filter(s => s.directorId !== currentOccupantId) : p;
          return [...filtered, { directorId, role: pos.defaultRole, feeWithPremium: fee }];
        }
      });
    }

    setActiveSeatIdx(null); setSelectedDirId(null);
    playBoardSeatDrop();
  }, [boardIdSet, committed, budget, handleRoleChange, pushAndSetSeats, directorMap, tablePos, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize]);

  const handleSeatClick = useCallback((idx: number) => {
    touchDragRef.current = null; // cancel any in-flight touch drag before opening overlay
    if (activeSeatIdx === idx) { setActiveSeatIdx(null); setSelectedDirId(null); setMobileOverlay(null); return; }
    setActiveSeatIdx(idx); setSelectedDirId(null);
    setMobileOverlay('pool'); // mobile: open pool overlay on any seat tap
  }, [activeSeatIdx]);

  const handlePoolClick = useCallback((dirId: string) => {
    if (boardIdSet.has(dirId) && !overflowSet.has(dirId)) return;
    if (activeSeatIdx !== null) {
      const occupant = tablePos[activeSeatIdx];
      if (occupant === null) {
        handleAssignToSeat(dirId, activeSeatIdx);
        setMobileOverlay(null); // close mobile pool overlay after assignment
      }
      else { setSelectedDirId(dirId); playDirectorSelect(); }
    } else { setSelectedDirId(dirId); playDirectorSelect(); }
  }, [activeSeatIdx, tablePos, boardIdSet, overflowSet, handleAssignToSeat]);

  // ── Touch drag handlers (mobile/tablet DnD) ──
  const startTouchDrag = useCallback((dirId: string, x: number, y: number) => {
    touchDragRef.current = { dirId, startX: x, startY: y, active: false };
  }, []);

  // Keep stable refs so the global touch effect doesn't re-register on every render
  const handleAssignToSeatRef = useRef(handleAssignToSeat);
  useEffect(() => { handleAssignToSeatRef.current = handleAssignToSeat; }, [handleAssignToSeat]);
  const handleRemoveDirectorRef = useRef(handleRemoveDirector);
  useEffect(() => { handleRemoveDirectorRef.current = handleRemoveDirector; }, [handleRemoveDirector]);

  // Keep mobileOverlayRef in sync so the global touch handler can check it without stale closure
  useEffect(() => { mobileOverlayRef.current = mobileOverlay; }, [mobileOverlay]);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      const ref = touchDragRef.current;
      if (!ref) return;
      // On mobile viewports, don't intercept scroll when an overlay is open
      if (mobileOverlayRef.current !== null && window.innerWidth < 768) { touchDragRef.current = null; return; }
      const touch = e.touches[0];
      const dx = touch.clientX - ref.startX;
      const dy = touch.clientY - ref.startY;
      if (!ref.active && Math.sqrt(dx * dx + dy * dy) > 8) {
        ref.active = true;
        setMobileOverlay(null); // close pool overlay to reveal the board
      }
      if (ref.active) {
        e.preventDefault(); // block page scroll while dragging
        setTouchGhost({ dirId: ref.dirId, x: touch.clientX, y: touch.clientY });
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const ref = touchDragRef.current;
      if (!ref) return;
      touchDragRef.current = null;
      if (!ref.active) return; // tap — let normal click handler fire
      setTouchGhost(null);

      const touch = e.changedTouches[0];
      // Temporarily hide ghost so elementFromPoint sees through it
      if (touchGhostRef.current) touchGhostRef.current.style.display = 'none';
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      if (touchGhostRef.current) touchGhostRef.current.style.display = '';
      if (!el) return;
      const seatEl = (el as HTMLElement).closest('[data-seat-index]');
      if (seatEl) {
        // Drop onto a seat
        if ((seatEl as HTMLElement).getAttribute('data-seat-interactive') === 'false') return;
        const idx = parseInt((seatEl as HTMLElement).getAttribute('data-seat-index') ?? '-1', 10);
        if (idx >= 0) handleAssignToSeatRef.current(ref.dirId, idx);
      } else if (window.innerWidth >= 768 && (el as HTMLElement).closest('[data-pool-drop-zone]')) {
        // Tablet only: drop onto the director pool removes the director from the board
        handleRemoveDirectorRef.current(ref.dirId);
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // register once — uses stable refs internally

  const handleAssignCandidate = useCallback(() => {
    if (activeSeatIdx === null || !selectedDirId) return;
    const cur = tablePos[activeSeatIdx]; if (!cur) return;
    const pos = getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize);
    const cand = directorMap.get(selectedDirId); if (!cand) return;
    const candOnBoard = boardIdSet.has(selectedDirId);
    pushAndSetSeats((p) => {
      const filtered = p.filter((s) => s.directorId !== cur && (candOnBoard ? s.directorId !== selectedDirId : true));
      return [...filtered, { directorId: selectedDirId, role: pos.defaultRole, feeWithPremium: effectiveFee(cand.annualFee, pos.defaultRole) }];
    });
    setSelectedDirId(null);
  }, [activeSeatIdx, selectedDirId, tablePos, boardIdSet, pushAndSetSeats, directorMap]);

  // ── Sorted & filtered pool ──
  const sortedPool = useMemo(() => {
    let pool = [...availableDirectors].filter((d) => !boardIdSet.has(d.id) || overflowSet.has(d.id));

    // Filter: show directors who score ≥ 60 in the selected domain
    if (filterDomain) {
      pool = pool.filter((d) => d.domainRatings[filterDomain] >= 60);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    return pool.sort((a, b) => {
      const ao = overflowSet.has(a.id), bo = overflowSet.has(b.id);
      if (ao !== bo) return ao ? -1 : 1;
      if (sortBy === 'fee') return (a.annualFee - b.annualFee) * dir;
      if (sortBy === 'score') {
        const aScore = filterDomain
          ? a.domainRatings[filterDomain]
          : Math.max(...ALL_DOMAINS.map((d) => a.domainRatings[d]));
        const bScore = filterDomain
          ? b.domainRatings[filterDomain]
          : Math.max(...ALL_DOMAINS.map((d) => b.domainRatings[d]));
        return (aScore - bScore) * dir;
      }
      return 0;
    });
  }, [availableDirectors, boardIdSet, overflowSet, sortBy, sortDir, filterDomain]);

  // ── Centre panel mode ──
  const seatOccupant = activeSeatIdx !== null ? tablePos[activeSeatIdx] : null;
  const seatOccDir = seatOccupant ? directorMap.get(seatOccupant) : undefined;
  const selDir = selectedDirId ? directorMap.get(selectedDirId) : undefined;
  const seatRec = seatOccupant ? seats.find((s) => s.directorId === seatOccupant) : undefined;

  let mode: 'default' | 'select' | 'profile-seated' | 'profile-pool' | 'comparison' = 'default';
  if (activeSeatIdx !== null && !seatOccupant && !selectedDirId) mode = 'select';
  else if (activeSeatIdx !== null && seatOccupant && selectedDirId) mode = 'comparison';
  else if (activeSeatIdx !== null && seatOccupant) mode = 'profile-seated';
  else if (selectedDirId) mode = 'profile-pool';

  // Board average domain scores for Harvey balls
  const boardAvgDomains = useMemo(() => {
    if (seats.length === 0) return ALL_DOMAINS.map(() => 0);
    return ALL_DOMAINS.map((domain) => {
      const total = seats.reduce((sum, s) => {
        const d = directorMap.get(s.directorId);
        return sum + (d ? d.domainRatings[domain] : 0);
      }, 0);
      return Math.round(total / seats.length);
    });
  }, [seats, directorMap]);

  // Determine which optional committees are available for this company
  // Only show ET toggle if the committee is actually playable for this company (has a formation cost)
  const hasETCommittee = useMemo(() => {
    return company.committees.some((c) => c.id === 'energyTransition' && c.formationCost !== undefined);
  }, [company]);

  // Filter board roles based on company's available committees
  const availableBoardRoles = useMemo(() => {
    return ALL_BOARD_ROLES.filter((r) => {
      if (r === 'energyTransitionChair' && !hasEnergyTransition) return false;
      if (r === 'safetyEnvChair' && !hasSafetyEnv) return false;
      if (r === 'csrdChair' && !hasCsrd) return false;
      if (r === 'strategyChair' && !hasStrategy) return false;
      return true;
    });
  }, [hasEnergyTransition, hasSafetyEnv, hasCsrd, hasStrategy]);

  // ── Render helpers (shared between mobile overlays and desktop panels) ──

  const companyCardJsx = (
    <div
      className="rounded-lg border border-gold/40 bg-navy cursor-pointer"
      onClick={() => setShowCompanyInfo((p) => !p)}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <CompanyLogo companyId={company.id} size={24} />
          <span className="text-xs font-semibold text-foreground">{company.name}</span>
        </div>
        <span className="text-xs text-gold">{showCompanyInfo ? '−' : 'ℹ'}</span>
      </div>
      {showCompanyInfo && (
        <div className="px-3 pb-3 border-t border-gold/20 mt-0">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px]">
            <div><span className="text-foreground/40">Market Cap:</span> <span className="text-foreground/70">{company.marketCap}</span></div>
            <div><span className="text-foreground/40">Revenue:</span> <span className="text-foreground/70">{company.annualRevenue}</span></div>
            <div><span className="text-foreground/40">Employees:</span> <span className="text-foreground/70">{company.employees.toLocaleString()}</span></div>
            <div><span className="text-foreground/40">Industry:</span> <span className="text-foreground/70">{company.industry}</span></div>
            <div className="col-span-2"><span className="text-foreground/40">HQ:</span> <span className="text-foreground/70">{company.headquarters}</span></div>
          </div>
          <p className="text-[10px] text-foreground/60 font-narrative italic leading-relaxed mt-2">
            {company.narrative.split('.').slice(0, 2).join('.') + '.'}
          </p>
        </div>
      )}
    </div>
  );

  const boardStrengthJsx = seats.length > 0 ? (
    <div className="relative">
      <button
        onClick={() => { setShowStrength(p => !p); if (hintsShown === 5) dismissHint(); }}
        className="w-full py-1.5 px-3 rounded-full border border-gold/40 text-gold text-[11px] font-semibold hover:bg-gold/10 transition-colors cursor-pointer text-center"
      >
        Board Strength &#8599;
      </button>
      {showStrength && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowStrength(false)} />
          <div className="absolute bottom-full right-0 mb-2 z-50 rounded-lg border border-gold/30 bg-navy-light shadow-xl p-4" style={{ minWidth: 300 }}>
            <h4 className="text-[10px] text-gold uppercase tracking-wider font-semibold mb-3 text-center">Board Strength Profile</h4>
            <div className="grid grid-cols-4 gap-3">
              {ALL_DOMAINS.map((domain, i) => {
                const avg = boardAvgDomains[i];
                const pct = avg / 100;
                return (
                  <div key={domain} className="flex flex-col items-center">
                    <svg width="32" height="32" viewBox="0 0 28 28">
                      <circle cx="14" cy="14" r="12" fill="none" stroke="#1A3A5C" strokeWidth="2" />
                      {pct > 0 && (
                        <circle cx="14" cy="14" r="12" fill="none" stroke="#C8960C" strokeWidth="2" strokeDasharray={`${pct * 75.4} ${75.4}`} strokeDashoffset="0" transform="rotate(-90 14 14)" strokeLinecap="round" />
                      )}
                      <text x="14" y="15.5" textAnchor="middle" fill="#C8960C" fontSize="8" fontWeight="bold">{avg}</text>
                    </svg>
                    <span className="text-[8px] text-foreground/50 mt-0.5 text-center leading-tight">{DOMAIN_SHORT[domain]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  ) : null;

  return (
    <div className="h-screen bg-navy text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gold tracking-wide font-narrative">BOARDCRAFT</h1>
            <p className="text-xs text-gold-dim mt-0.5">Board Construction - {company.name}</p>
          </div>
          <div className="text-right text-xs text-foreground/50">
            {company.industry} · {company.jurisdiction} · GH {company.startingGovernanceHealth}/100
          </div>
        </div>
      </header>

      {/* Permanent picks warning banner */}
      <div className="bg-gold/10 border-b border-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-sm flex-shrink-0">
        <span className="text-gold font-semibold">&#9888;</span>
        <span className="text-gold/90 font-narrative text-xs">Your picks are permanent until the AGM - choose carefully.</span>
      </div>

      <AnimatePresence>
        {showRestartBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="bg-gold/10 border-b border-gold/30 text-center py-2 flex-shrink-0">
            <p className="text-gold font-narrative text-sm italic">New game - same company. Build a better board.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════
          MOBILE LAYOUT — overlay system
          (hidden at md+ breakpoint)
          ═══════════════════════════════════════ */}
      <div className="md:hidden flex-1 relative overflow-hidden">

        {/* ── Base layer: board table ── */}
        <div className="absolute inset-0 flex flex-col p-3 overflow-hidden">
          {/* Undo / Redo */}
          <div className="flex-shrink-0 flex items-center justify-center gap-2 mb-2">
            <button onClick={handleUndo} disabled={history.length === 0} className={`text-[11px] px-3 py-1.5 rounded border transition-colors ${history.length > 0 ? 'border-foreground/30 text-foreground/70' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>↩ Undo</button>
            <button onClick={handleRedo} disabled={future.length === 0} className={`text-[11px] px-3 py-1.5 rounded border transition-colors ${future.length > 0 ? 'border-foreground/30 text-foreground/70' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>↪ Redo</button>
          </div>
          {/* Company card — elevated above gold tabs when expanded */}
          <div className={`flex-shrink-0 mb-2 relative${showCompanyInfo ? ' z-20' : ''}`}>{companyCardJsx}</div>

          {/* Boardroom table */}
          <div className="flex-1 flex items-center justify-center min-h-0">
            <BoardroomTable seats={seats} directors={availableDirectors} activeSeatIndex={activeSeatIdx} onSeatClick={handleSeatClick} hasEnergyTransition={hasEnergyTransition} hasCsrd={hasCsrd} hasStrategy={hasStrategy} onDropOnSeat={handleAssignToSeat} companyShortName={company.shortName} companyShortNameSuffix={company.shortNameSuffix} jurisdiction={company.jurisdiction} combinedChairCeo={company.id === 'company_vantage'} workerRepIds={company.id === 'company_rheinfeld' ? ['rdir_w_koch', 'rdir_w_alrashid', 'rdir_w_hoffmann', 'rdir_w_mehta', 'rdir_w_gruber'] : []} lockedDirectorIds={company.id === 'company_rheinfeld' ? ['rdir_heinrich'] : []} companyId={company.id} onTouchDragStart={startTouchDrag} />
          </div>
          <p className="text-[10px] text-foreground/30 mt-1 text-center flex-shrink-0 mb-1">Tap a seat · tap filled seat to view profile</p>

          {/* ── Compliance notification (shown when board is valid) ── */}
          <AnimatePresence>
            {!hasBlockingErrors && seats.length > 0 && (
              <motion.div key="compliant-banner" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.25 }} className="flex-shrink-0 mb-1 rounded-lg bg-success/10 border border-success/30 px-3 py-2">
                <p className="text-success text-xs font-bold text-center mb-1.5">✓ Board compliant</p>
                <button
                  onClick={() => setShowLockConfirm(true)}
                  className="w-full py-1.5 rounded-lg bg-gold text-navy-dark text-xs font-bold cursor-pointer"
                >
                  Lock Board &amp; Start Game
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Board Strength */}
          <div className="flex-shrink-0">{boardStrengthJsx}</div>
        </div>

        {/* ── Golden side-tab buttons (visible on base state only) ── */}
        {mobileOverlay === null && (
          <>
            <motion.button
              onClick={() => setMobileOverlay('compliance')}
              className="absolute left-0 z-10 bg-gold text-navy-dark font-bold tracking-widest py-3 px-2 rounded-r-lg shadow-lg cursor-pointer"
              style={{ top: '130px', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '10px' }}
              animate={{ x: [0, 6, -3, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.9, ease: 'easeInOut' }}
            >
              COMPLIANCE
            </motion.button>
            <motion.button
              onClick={() => setMobileOverlay('pool')}
              className="absolute right-0 z-10 bg-gold text-navy-dark font-bold tracking-widest py-3 px-2 rounded-l-lg shadow-lg cursor-pointer"
              style={{ top: '130px', writingMode: 'vertical-rl', fontSize: '10px' }}
              animate={{ x: [0, -6, 3, -5, 0] }}
              transition={{ duration: 0.6, delay: 0.9, ease: 'easeInOut' }}
            >
              POOL
            </motion.button>
          </>
        )}

        {/* ── Director Pool overlay (slides from right) ── */}
        <AnimatePresence>
          {mobileOverlay === 'pool' && (
            <motion.div key="mobile-pool-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-[60]">
              <div className="absolute inset-0 bg-black/60" onClick={() => { setMobileOverlay(null); setActiveSeatIdx(null); setSelectedDirId(null); }} />
              <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.25, ease: 'easeOut' }} className="absolute right-0 top-0 bottom-0 w-[95%] bg-navy flex flex-col shadow-2xl border-l border-card-border">
                {/* Header */}
                <div className="flex-shrink-0 px-3 py-2.5 border-b border-card-border bg-navy-dark/30">
                  <div className="flex items-center gap-3">
                    {(mode === 'profile-pool' || mode === 'comparison') ? (
                      <button onClick={() => setSelectedDirId(null)} className="text-gold text-sm font-semibold shrink-0">← Back</button>
                    ) : (
                      <button onClick={() => { setMobileOverlay(null); setActiveSeatIdx(null); setSelectedDirId(null); }} className="text-gold text-sm font-semibold shrink-0">← Return</button>
                    )}
                    {activeSeatIdx !== null && mode !== 'profile-seated' && mode !== 'profile-pool' && mode !== 'comparison' && (
                      <span className="text-gold text-xs font-medium truncate">Selecting for: <span className="font-bold">{getShortRoleLabel(getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize).defaultRole, company.jurisdiction, company.id)}</span></span>
                    )}
                    {mode === 'profile-seated' && seatOccDir && (
                      <span className="text-foreground/60 text-xs truncate">{seatOccDir.name}</span>
                    )}
                    {(mode === 'profile-pool' || mode === 'comparison') && selDir && (
                      <span className="text-foreground/60 text-xs truncate">{selDir.name}</span>
                    )}
                  </div>
                </div>
                {/* Content: profile-seated, pool director profile, or pool grid */}
                {mode === 'profile-seated' && seatOccDir ? (
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="rounded-full border-2 border-gold overflow-hidden"><DirectorPortrait directorId={seatOccDir.id} size={72} /></div>
                        <h2 className="text-base font-bold font-narrative text-foreground mt-2">{seatOccDir.name}</h2>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${INDEP_BADGE[seatOccDir.independence].cls}`}>{INDEP_BADGE[seatOccDir.independence].label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIER_BADGE[seatOccDir.availabilityTier].cls}`}>{TIER_BADGE[seatOccDir.availabilityTier].label}</span>
                          {seatOccDir.inherited && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning/10 text-warning border border-warning/30">Inherited</span>}
                        </div>
                        <span className="text-gold font-semibold text-sm mt-1.5">{fmt(seatOccDir.annualFee)} p.a.</span>
                        {seatRec && seatRec.role !== 'ned' && <span className="text-[10px] text-foreground/40 mt-1">Role premium: {fmt(seatRec.feeWithPremium)} total</span>}
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] text-foreground/40 uppercase tracking-wide">Competency Profile</h4>
                        {ALL_DOMAINS.map((domain) => { const sc = seatOccDir.domainRatings[domain]; return (
                          <div key={domain} className="flex items-center gap-2 text-[11px]">
                            <span className="w-16 text-foreground/60 truncate">{DOMAIN_SHORT[domain]}</span>
                            <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${sc}%` }} /></div>
                            <span className="w-6 text-right text-foreground/50">{sc}</span>
                          </div>
                        ); })}
                      </div>
                      <div><h4 className="text-[10px] text-foreground/40 uppercase tracking-wide mb-1">Background</h4><p className="text-xs text-foreground/70 font-narrative leading-relaxed">{seatOccDir.background}</p></div>
                      <div>
                        <label className="text-[10px] text-foreground/40 uppercase tracking-wide">Role Assignment</label>
                        <select value={seatRec?.role ?? 'ned'} onChange={(e) => handleRoleChange(seatOccDir.id, e.target.value as BoardRole)} className="w-full mt-1 text-xs bg-navy-dark text-foreground border border-card-border rounded px-2 py-1.5 focus:outline-none focus:border-gold">
                          {availableBoardRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r, company.jurisdiction, company.id)}</option>)}
                        </select>
                      </div>
                      <button onClick={() => { handleRemoveDirector(seatOccDir.id); setMobileOverlay(null); }} className="w-full py-2 text-sm bg-error/15 text-error border border-error/30 rounded-lg">
                        {company.id === 'company_meridian' ? 'Remove Trustee' : 'Remove from Board'}
                      </button>
                    </div>
                  </div>
                ) : selDir && (mode === 'profile-pool' || mode === 'comparison') ? (
                  /* Pool director profile — shown when user taps a candidate card */
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-4">
                      <div className="flex flex-col items-center text-center">
                        <div className="rounded-full border-2 border-gold overflow-hidden"><DirectorPortrait directorId={selDir.id} size={72} /></div>
                        <h2 className="text-base font-bold font-narrative text-foreground mt-2">{selDir.name}</h2>
                        <div className="flex flex-wrap justify-center gap-1.5 mt-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${INDEP_BADGE[selDir.independence].cls}`}>{INDEP_BADGE[selDir.independence].label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TIER_BADGE[selDir.availabilityTier].cls}`}>{TIER_BADGE[selDir.availabilityTier].label}</span>
                          {selDir.inherited && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning/10 text-warning border border-warning/30">Inherited</span>}
                        </div>
                        <span className="text-gold font-semibold text-sm mt-1.5">{fmt(selDir.annualFee)} p.a.</span>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] text-foreground/40 uppercase tracking-wide">Competency Profile</h4>
                        {ALL_DOMAINS.map((domain) => { const sc = selDir.domainRatings[domain]; return (
                          <div key={domain} className="flex items-center gap-2 text-[11px]">
                            <span className="w-16 text-foreground/60 truncate">{DOMAIN_SHORT[domain]}</span>
                            <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${sc}%` }} /></div>
                            <span className="w-6 text-right text-foreground/50">{sc}</span>
                          </div>
                        ); })}
                      </div>
                      <div><h4 className="text-[10px] text-foreground/40 uppercase tracking-wide mb-1">Background</h4><p className="text-xs text-foreground/70 font-narrative leading-relaxed">{selDir.background}</p></div>
                      {selDir.riskFlag && !selDir.riskFlag.activated && (
                        <div className="flex items-center gap-1.5 text-xs text-warning/80 bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
                          <span>⚠</span><span className="text-foreground/50">Potential risk flag</span>
                        </div>
                      )}
                      {/* Comparison mode: replace button */}
                      {mode === 'comparison' && seatOccDir && (
                        <button
                          onClick={() => { handleAssignCandidate(); setMobileOverlay(null); }}
                          className="w-full py-2.5 rounded-lg bg-gold text-navy-dark text-sm font-bold cursor-pointer"
                        >
                          Replace {seatOccDir.name.split(' ').pop()} with {selDir.name.split(' ').pop()}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-shrink-0 p-3 border-b border-card-border space-y-2">
                      <div>
                        <span className="text-[9px] text-foreground/40 uppercase tracking-wide">Filter by domain (≥60)</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button onClick={() => setFilterDomain(null)} className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${filterDomain === null ? 'bg-gold text-navy-dark' : 'bg-navy-dark text-foreground/50 hover:text-foreground'}`}>All</button>
                          {ALL_DOMAINS.map((d) => (
                            <button key={d} onClick={() => setFilterDomain(d)} className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${filterDomain === d ? 'bg-gold text-navy-dark' : 'bg-navy-dark text-foreground/50 hover:text-foreground'}`}>{DOMAIN_SHORT[d]}</button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-[9px] text-foreground/40 uppercase tracking-wide">Sort</span>
                        {budget > 0 && (
                          <button onClick={() => { if (sortBy === 'fee') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('fee'); setSortDir('asc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'fee' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>Fee {sortBy === 'fee' && (sortDir === 'asc' ? '↑' : '↓')}</button>
                        )}
                        <button onClick={() => { if (sortBy === 'score') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('score'); setSortDir('desc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'score' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>Gov. Score {sortBy === 'score' && (sortDir === 'asc' ? '↑' : '↓')}</button>
                      </div>
                    </div>
                    {/* Role info — shown above the candidate list when selecting for a named role */}
                    {activeSeatIdx !== null && mode === 'select' && (() => {
                      const seatRole = getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize).defaultRole;
                      const info = getRoleTooltip(seatRole, company.jurisdiction, company.id);
                      if (!info) return null;
                      return (
                        <div className="flex-shrink-0 px-3 pt-2 pb-1 border-b border-card-border">
                          <p className="text-xs font-semibold text-gold mb-0.5">{getRoleLabel(seatRole, company.jurisdiction, company.id)}</p>
                          <p className="text-[11px] text-foreground/60 leading-snug mb-1">{info.description}</p>
                          <p className="text-[9px] text-foreground/40 uppercase tracking-wide mb-0.5">Requirements</p>
                          {info.requirements.map((req, i) => (
                            <div key={i} className="flex items-start gap-1 text-[11px] text-foreground/55">
                              <span className="text-gold/60 mt-px">›</span>
                              <span>{req}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                    <div className="flex-1 overflow-y-auto p-3">
                      {overflowIds.length > 0 && <p className="text-[10px] text-warning font-medium mb-2">⚠ Unseated {company.id === 'company_meridian' ? 'trustees' : 'directors'} — tap a seat to place them</p>}
                      {sortedPool.length === 0 && filterDomain !== null ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-[11px] text-foreground/40 font-narrative italic">No candidates score ≥60 in {DOMAIN_SHORT[filterDomain]}.</p>
                          <button onClick={() => setFilterDomain(null)} className="mt-2 text-[10px] text-gold/60 hover:text-gold transition-colors">Clear filter</button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {sortedPool.map((d) => (
                            <PoolCard key={d.id} director={d} selected={selectedDirId === d.id} onBoard={boardIdSet.has(d.id) && !overflowSet.has(d.id)} overflow={overflowSet.has(d.id)} onClick={() => handlePoolClick(d.id)} jurisdiction={company.jurisdiction} displayFee={budget === 0 ? 0 : undefined} />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
                {/* Board Strength pinned to bottom */}
                <div className="flex-shrink-0 p-3 border-t border-card-border">{boardStrengthJsx}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Compliance overlay (slides from left) ── */}
        <AnimatePresence>
          {mobileOverlay === 'compliance' && (
            <motion.div key="mobile-compliance-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 z-[60]">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOverlay(null)} />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.25, ease: 'easeOut' }} className="absolute left-0 top-0 bottom-0 w-[95%] bg-navy flex flex-col shadow-2xl border-r border-card-border">
                {/* Header */}
                <div className="flex-shrink-0 px-3 py-2.5 border-b border-card-border bg-navy-dark/30 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gold">Compliance</h2>
                  <button onClick={() => setMobileOverlay(null)} className="text-gold text-sm font-semibold">Return ➜</button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {budget > 0 ? (
                    <div>
                      <div className="w-full h-3 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full transition-all" style={{ width: `${Math.min((committed / budget) * 100, 100)}%` }} /></div>
                      <p className="text-[10px] text-foreground/40 text-center mt-1.5">{fmt(committed)} committed · {fmt(Math.max(0, remaining))} remaining · {fmt(budget)} total</p>
                    </div>
                  ) : (
                    <div className="text-center"><p className="text-[10px] text-foreground/40">{seats.length} trustee{seats.length !== 1 ? 's' : ''} appointed · All roles are voluntary (unpaid)</p></div>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={handleUndo} disabled={history.length === 0} className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${history.length > 0 ? 'border-foreground/30 text-foreground/70 hover:border-gold hover:text-gold' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>↩ Undo</button>
                    <button onClick={handleRedo} disabled={future.length === 0} className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${future.length > 0 ? 'border-foreground/30 text-foreground/70 hover:border-gold hover:text-gold' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>↪ Redo</button>
                  </div>
                  <CompliancePanel errors={complianceErrors} title={company.id === 'company_meridian' ? 'Charity Governance Code' : company.jurisdiction === 'EU' ? 'GCGC / AktG Compliance' : 'FRC Code Compliance'} />
                  <button onClick={() => setShowBoardGuide(true)} className="w-full py-2 rounded-lg border border-gold/30 text-gold/70 text-xs font-medium hover:border-gold/60 hover:text-gold transition-colors text-center cursor-pointer">
                    &#x2197; {company.id === 'company_meridian' ? 'Trustee Guide — Charity Governance Code' : `Board Guide — ${company.jurisdiction} Governance Rules`}
                  </button>
                  {hasETCommittee && (
                    <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasEnergyTransition ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleET}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1"><h3 className="text-sm font-semibold text-gold">Establish {company.committees.find((c) => c.id === 'energyTransition')?.name ?? 'Energy Transition Committee'}</h3><p className="text-[10px] text-foreground/50 mt-1">{fmt(etFormationCost)} p.a. · Grants +10 bonus on {company.jurisdiction === 'US' ? 'regulatory and brand events' : 'ESG events'}</p></div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${hasEnergyTransition ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasEnergyTransition ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} /></div>
                      </div>
                    </div>
                  )}
                  {csrdFormationCost > 0 && (
                    <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasCsrd ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleCsrd}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1"><h3 className="text-sm font-semibold text-gold">{company.committees.find((c) => c.id === 'csrd')?.name ?? 'CSRD / Sustainability Committee'}</h3><p className="text-[10px] text-foreground/50 mt-1">{fmt(csrdFormationCost)} p.a. · Grants +10 bonus on CSRD and ESG events</p></div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${hasCsrd ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasCsrd ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} /></div>
                      </div>
                    </div>
                  )}
                  {strategyFormationCost > 0 && (
                    <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasStrategy ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleStrategy}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1"><h3 className="text-sm font-semibold text-gold">{company.committees.find((c) => c.id === 'strategy')?.name ?? 'Strategy Committee'}</h3><p className="text-[10px] text-foreground/50 mt-1">{fmt(strategyFormationCost)} p.a. · Grants +10 bonus on strategic review and M&A events</p></div>
                        <div className={`w-11 h-6 rounded-full relative transition-colors ${hasStrategy ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}><div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasStrategy ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} /></div>
                      </div>
                    </div>
                  )}
                  <div className="text-center text-xs text-foreground/40">
                    {budget > 0
                      ? <>{seats.length} director{seats.length !== 1 ? 's' : ''} · {remaining < 0 ? <span className="text-error font-medium">Over budget by {fmt(Math.abs(remaining))}</span> : <span>{fmt(remaining)} remaining</span>}</>
                      : <>{seats.length} trustee{seats.length !== 1 ? 's' : ''} · Unpaid voluntary roles</>
                    }
                  </div>
                  <button onClick={() => { if (!hasBlockingErrors) { setMobileOverlay(null); setShowLockConfirm(true); } }} disabled={hasBlockingErrors} className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${hasBlockingErrors ? 'bg-navy-light text-foreground/30 cursor-not-allowed' : 'bg-gold text-navy-dark hover:bg-gold-light active:scale-[0.98]'}`}>
                    {hasBlockingErrors ? 'Resolve Compliance Errors' : 'Lock Board & Start Game'}
                  </button>
                  <SiteFooter className="mt-3" />
                </div>
                {/* Board Strength pinned to bottom */}
                <div className="flex-shrink-0 p-3 border-t border-card-border">{boardStrengthJsx}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ═══════════════════════════════════════
          DESKTOP LAYOUT — three-panel
          (hidden below md breakpoint)
          ═══════════════════════════════════════ */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* ═══ LEFT: Director Pool (35%) ═══ */}
        <div className="w-[35%] border-r border-card-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-card-border flex-shrink-0 space-y-2">
            <h2 className="text-sm font-bold text-gold">{company.id === 'company_meridian' ? 'Trustee Candidates' : 'Director Pool'}</h2>
            {/* Row 1: Filter by highest domain */}
            <div>
              <span className="text-[9px] text-foreground/40 uppercase tracking-wide">Filter by domain (≥60)</span>
              <div className="flex flex-wrap gap-1 mt-1">
                <button onClick={() => setFilterDomain(null)} className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${filterDomain === null ? 'bg-gold text-navy-dark' : 'bg-navy-dark text-foreground/50 hover:text-foreground'}`}>All</button>
                {ALL_DOMAINS.map((d) => (
                  <button key={d} onClick={() => setFilterDomain(d)} className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${filterDomain === d ? 'bg-gold text-navy-dark' : 'bg-navy-dark text-foreground/50 hover:text-foreground'}`}>{DOMAIN_SHORT[d]}</button>
                ))}
              </div>
            </div>
            {/* Row 2: Sort with direction toggles */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-[9px] text-foreground/40 uppercase tracking-wide">Sort</span>
                {budget > 0 && (
                  <button onClick={() => { if (sortBy === 'fee') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('fee'); setSortDir('asc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'fee' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>
                    Fee {sortBy === 'fee' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                )}
                <button onClick={() => { if (sortBy === 'score') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('score'); setSortDir('desc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'score' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>
                  Gov. Score {sortBy === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
                </button>
              </div>
              {sortBy === 'score' && (
                <p className="text-[9px] text-foreground/30 leading-tight">
                  {filterDomain ? `Sorted by ${DOMAIN_SHORT[filterDomain]} score` : 'Sorted by highest domain score'}
                </p>
              )}
            </div>
          </div>
          <div
            data-pool-drop-zone
            className="flex-1 overflow-y-auto p-3"
            onDragOver={(e) => {
              // Only highlight if dragging a seated director
              const dirId = e.dataTransfer.types.includes('text/plain') ? true : false;
              if (dirId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const dirId = e.dataTransfer.getData('text/plain');
              if (dirId && boardIdSet.has(dirId)) {
                handleRemoveDirector(dirId);
              }
            }}
          >
            {overflowIds.length > 0 && (
              <p className="text-[10px] text-warning font-medium mb-2">⚠ Unseated {company.id === 'company_meridian' ? 'trustees' : 'directors'} — click a table seat to place them</p>
            )}
            {sortedPool.length === 0 && filterDomain !== null ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[11px] text-foreground/40 font-narrative italic">No candidates score ≥60 in {DOMAIN_SHORT[filterDomain]}.</p>
                <button onClick={() => setFilterDomain(null)} className="mt-2 text-[10px] text-gold/60 hover:text-gold transition-colors">Clear filter</button>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {sortedPool.map((d) => (
                  <PoolCard key={d.id} director={d} selected={selectedDirId === d.id} onBoard={boardIdSet.has(d.id) && !overflowSet.has(d.id)} overflow={overflowSet.has(d.id)} onClick={() => handlePoolClick(d.id)} jurisdiction={company.jurisdiction} displayFee={budget === 0 ? 0 : undefined} onTouchStart={(e) => { const t = e.touches[0]; startTouchDrag(d.id, t.clientX, t.clientY); }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ CENTRE (30%) ═══ */}
        <div className="w-[30%] border-r border-card-border flex flex-col overflow-hidden">
          {/* Sticky header: Back to Overview + Undo/Redo */}
          <div className="flex-shrink-0 p-3 pb-0 space-y-2">
            {mode !== 'default' && (
              <button onClick={() => { setActiveSeatIdx(null); setSelectedDirId(null); }} className="w-full py-2 rounded-lg border-2 border-gold text-gold font-semibold text-sm hover:bg-gold/10 transition-colors">
                &larr; Back to Overview
              </button>
            )}
            <div className="flex items-center justify-center gap-2">
              <button onClick={handleUndo} disabled={history.length === 0} className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${history.length > 0 ? 'border-foreground/30 text-foreground/70 hover:border-gold hover:text-gold' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>
                ↩ Undo
              </button>
              <button onClick={handleRedo} disabled={future.length === 0} className={`text-[11px] px-2.5 py-1 rounded border transition-colors ${future.length > 0 ? 'border-foreground/30 text-foreground/70 hover:border-gold hover:text-gold' : 'border-card-border text-foreground/20 cursor-not-allowed'}`}>
                ↪ Redo
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {mode === 'default' && (
              <motion.div key="def" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-5 space-y-5">
                <div className="text-center pt-4">
                  <h2 className="text-3xl font-bold text-gold tracking-widest font-narrative">BOARDCRAFT</h2>
                  <p className="text-xs text-foreground/50 mt-2 font-narrative italic">
                    {company.id === 'company_meridian'
                      ? 'Appoint your trustees. Protect mission integrity. Defend the charity.'
                      : 'Build your board. Navigate the crises. Maximise shareholder value.'}
                  </p>
                </div>
                {budget > 0 ? (
                  <div>
                    <div className="w-full h-3 bg-navy-dark rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${Math.min((committed / budget) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-foreground/40 text-center mt-1.5">
                      {fmt(committed)} committed · {fmt(Math.max(0, remaining))} remaining · {fmt(budget)} total
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-[10px] text-foreground/40">
                      {seats.length} trustee{seats.length !== 1 ? 's' : ''} appointed · All roles are voluntary (unpaid)
                    </p>
                  </div>
                )}
                <CompliancePanel
                  errors={complianceErrors}
                  title={company.id === 'company_meridian' ? 'Charity Governance Code' : company.jurisdiction === 'EU' ? 'GCGC / AktG Compliance' : 'FRC Code Compliance'}
                />
                {/* Board Guide button */}
                <button
                  onClick={() => setShowBoardGuide(true)}
                  className="w-full py-2 rounded-lg border border-gold/30 text-gold/70 text-xs font-medium hover:border-gold/60 hover:text-gold transition-colors text-center cursor-pointer"
                >
                  &#x2197; {company.id === 'company_meridian' ? 'Trustee Guide — Charity Governance Code' : `Board Guide — ${company.jurisdiction} Governance Rules`}
                </button>
                {/* ET Toggle - only show if company has ET committee definition */}
                {hasETCommittee && (
                  <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasEnergyTransition ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleET}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gold">Establish {company.committees.find((c) => c.id === 'energyTransition')?.name ?? 'Energy Transition Committee'}</h3>
                        <p className="text-[10px] text-foreground/50 mt-1">{fmt(etFormationCost)} p.a. · Grants +10 bonus on {company.jurisdiction === 'US' ? 'regulatory and brand events' : 'ESG events'}</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${hasEnergyTransition ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasEnergyTransition ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} />
                      </div>
                    </div>
                  </div>
                )}
                {/* CSRD Toggle - Rheinfeld only */}
                {csrdFormationCost > 0 && (
                  <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasCsrd ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleCsrd}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gold">{company.committees.find((c) => c.id === 'csrd')?.name ?? 'CSRD / Sustainability Committee'}</h3>
                        <p className="text-[10px] text-foreground/50 mt-1">{fmt(csrdFormationCost)} p.a. · Grants +10 bonus on CSRD and ESG events</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${hasCsrd ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasCsrd ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} />
                      </div>
                    </div>
                  </div>
                )}
                {/* Strategy Committee Toggle - Rheinfeld only */}
                {strategyFormationCost > 0 && (
                  <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasStrategy ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={handleToggleStrategy}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gold">{company.committees.find((c) => c.id === 'strategy')?.name ?? 'Strategy Committee'}</h3>
                        <p className="text-[10px] text-foreground/50 mt-1">{fmt(strategyFormationCost)} p.a. · Grants +10 bonus on strategic review and M&A events</p>
                      </div>
                      <div className={`w-11 h-6 rounded-full relative transition-colors ${hasStrategy ? 'bg-gold' : 'bg-navy-dark border border-foreground/30'}`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${hasStrategy ? 'left-[22px] bg-navy-dark' : 'left-0.5 bg-foreground/50'}`} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-center text-xs text-foreground/40">
                  {budget > 0
                    ? <>{seats.length} director{seats.length !== 1 ? 's' : ''} · {remaining < 0 ? <span className="text-error font-medium">Over budget by {fmt(Math.abs(remaining))}</span> : <span>{fmt(remaining)} remaining</span>}</>
                    : <>{seats.length} trustee{seats.length !== 1 ? 's' : ''} · Unpaid voluntary roles</>
                  }
                </div>
                <div className="mt-auto pt-4">
                  <button onClick={() => { if (!hasBlockingErrors) setShowLockConfirm(true); }} disabled={hasBlockingErrors} className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${hasBlockingErrors ? 'bg-navy-light text-foreground/30 cursor-not-allowed' : 'bg-gold text-navy-dark hover:bg-gold-light active:scale-[0.98]'}`}>
                    {hasBlockingErrors ? 'Resolve Compliance Errors' : 'Lock Board & Start Game'}
                  </button>
                  <SiteFooter className="mt-3" />
                </div>
              </motion.div>
            )}

            {mode === 'select' && (
              <motion.div key="sel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-5 text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center mb-4 animate-pulse"><span className="text-gold/40 text-3xl">+</span></div>
                <h3 className="text-lg font-bold text-gold font-narrative mb-2">{company.id === 'company_meridian' ? 'Select a Trustee' : 'Select a Director'}</h3>
                <p className="text-xs text-foreground/50 max-w-xs">Choose a director from the pool to fill the <span className="text-gold font-semibold">{activeSeatIdx !== null ? getShortRoleLabel(getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize).defaultRole, company.jurisdiction, company.id) : ''}</span> seat.</p>
                {activeSeatIdx !== null && (() => {
                  const seatRole = getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize).defaultRole;
                  const info = getRoleTooltip(seatRole, company.jurisdiction, company.id);
                  if (!info) return null;
                  return (
                    <div className="mt-4 text-left w-full max-w-xs rounded-lg border border-gold/20 bg-navy-dark/40 px-4 py-3">
                      <p className="text-[11px] text-foreground/60 leading-snug mb-2">{info.description}</p>
                      <p className="text-[9px] text-foreground/40 uppercase tracking-wide mb-1">Requirements</p>
                      {info.requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-1 text-[11px] text-foreground/55">
                          <span className="text-gold/60 mt-px">›</span>
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                {/* Cancel handled by sticky Back to Overview button above */}
              </motion.div>
            )}

            {(mode === 'profile-seated' || mode === 'profile-pool') && (() => {
              const dir = mode === 'profile-seated' ? seatOccDir : selDir;
              if (!dir) return null;
              const seated = mode === 'profile-seated';
              const seat = seated ? seatRec : undefined;
              const ind = INDEP_BADGE[dir.independence];
              const ti = TIER_BADGE[dir.availabilityTier];
              return (
                <motion.div key={`prof-${dir.id}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-5 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className="rounded-full border-2 border-gold overflow-hidden cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', dir.id);
                          e.dataTransfer.effectAllowed = 'move';
                          (e.currentTarget as HTMLElement).style.opacity = '0.5';
                        }}
                        onDragEnd={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                      ><DirectorPortrait directorId={dir.id} size={80} /></div>
                      <h2 className="text-lg font-bold font-narrative text-foreground mt-3">{dir.name}</h2>
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ind.cls}`}>{ind.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ti.cls}`}>{ti.label}</span>
                        {dir.inherited && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-warning/10 text-warning border border-warning/30">Inherited</span>}
                      </div>
                      <span className="text-gold font-semibold text-sm mt-2">{fmt(dir.annualFee)} p.a.</span>
                      {seat && seat.role !== 'ned' && <span className="text-[10px] text-foreground/40 mt-1">Role premium: {fmt(seat.feeWithPremium)} total</span>}
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] text-foreground/40 uppercase tracking-wide">Competency Profile</h4>
                      {ALL_DOMAINS.map((domain) => { const sc = dir.domainRatings[domain]; return (
                        <div key={domain} className="flex items-center gap-2 text-[11px]">
                          <span className="w-16 text-foreground/60 truncate">{DOMAIN_SHORT[domain]}</span>
                          <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-gold rounded-full" style={{ width: `${sc}%` }} /></div>
                          <span className="w-6 text-right text-foreground/50">{sc}</span>
                        </div>
                      ); })}
                    </div>
                    <div><h4 className="text-[10px] text-foreground/40 uppercase tracking-wide mb-1">Background</h4><p className="text-xs text-foreground/70 font-narrative leading-relaxed">{dir.background}</p></div>
                    {Object.keys(dir.jurisdictionScores).length > 0 && (
                      <div className="text-xs"><span className="text-foreground/40">Jurisdiction: </span>{Object.entries(dir.jurisdictionScores).map(([j, s]) => <span key={j} className="text-foreground/60 mr-2">{j} {s}</span>)}</div>
                    )}
                    {dir.riskFlag && !dir.riskFlag.activated && (
                      <div className="flex items-center gap-1.5 text-xs text-warning/80">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1L1 14h14L8 1zm0 4v4m0 2v1" /><path d="M8 5v4" stroke="#0D1B2A" strokeWidth="1.5" strokeLinecap="round" fill="none" /><circle cx="8" cy="11.5" r="0.8" fill="#0D1B2A" /></svg>
                        <span className="text-foreground/40">Potential risk flag</span>
                      </div>
                    )}
                    {seated && (
                      <div>
                        <label className="text-[10px] text-foreground/40 uppercase tracking-wide">Role Assignment</label>
                        <select value={seat?.role ?? 'ned'} onChange={(e) => handleRoleChange(dir.id, e.target.value as BoardRole)} className="w-full mt-1 text-xs bg-navy-dark text-foreground border border-card-border rounded px-2 py-1.5 focus:outline-none focus:border-gold">
                          {availableBoardRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r, company.jurisdiction, company.id)}</option>)}
                        </select>
                      </div>
                    )}
                    <AnimatePresence>
                      {swapMessage && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="text-[11px] text-gold bg-gold/10 border border-gold/30 rounded-lg px-3 py-2 text-center">
                          {swapMessage}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {seated && <button onClick={() => handleRemoveDirector(dir.id)} className="w-full py-2 text-sm bg-error/15 text-error border border-error/30 rounded-lg hover:bg-error/25 transition-colors">{company.id === 'company_meridian' ? 'Remove Trustee' : 'Remove from Board'}</button>}
                  </div>
                </motion.div>
              );
            })()}

            {mode === 'comparison' && seatOccDir && selDir && (() => {
              const cur = seatOccDir, cand = selDir;
              const curFee = seatRec?.feeWithPremium ?? 0;
              const candRole = activeSeatIdx !== null ? getTablePosition(activeSeatIdx, hasEnergyTransition, hasCsrd, hasStrategy, forceGridLayout, effectiveGridSize).defaultRole : 'ned' as BoardRole;
              const candFee = effectiveFee(cand.annualFee, candRole);
              const fd = candFee - curFee;
              return (
                <motion.div key="cmp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-4 overflow-y-auto">
                  <div className="space-y-4">
                    <div className="text-center"><span className={`text-xs font-bold ${fd > 0 ? 'text-error' : fd < 0 ? 'text-success' : 'text-foreground/40'}`}>Fee: {fd > 0 ? '+' : ''}{fmt(Math.abs(fd))} {fd < 0 ? 'saving' : fd > 0 ? 'increase' : ''}</span></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <p className="text-[9px] text-foreground/40 uppercase tracking-wider mb-1">Current</p>
                        <div className="rounded-full border border-foreground/20 overflow-hidden mx-auto w-14 h-14"><DirectorPortrait directorId={cur.id} size={56} /></div>
                        <h4 className="text-[11px] font-bold text-foreground mt-1 truncate">{cur.name}</h4>
                        <span className="text-[10px] text-gold">{fmt(curFee)}</span>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] text-gold uppercase tracking-wider mb-1 font-semibold">Candidate</p>
                        <div className="rounded-full border-2 border-gold overflow-hidden mx-auto w-14 h-14"><DirectorPortrait directorId={cand.id} size={56} /></div>
                        <h4 className="text-[11px] font-bold text-foreground mt-1 truncate">{cand.name}</h4>
                        <span className="text-[10px] text-gold">{fmt(candFee)}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[9px] text-foreground/40 uppercase tracking-wide">Competency Comparison</h4>
                      {ALL_DOMAINS.map((domain) => {
                        const c = cur.domainRatings[domain], d = cand.domainRatings[domain], delta = d - c;
                        return (
                          <div key={domain} className="flex items-center gap-1 text-[10px]">
                            <span className="w-14 text-foreground/50 truncate">{DOMAIN_SHORT[domain]}</span>
                            <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-foreground/25 rounded-full" style={{ width: `${c}%` }} /></div>
                            <span className="w-4 text-right text-foreground/40 text-[9px]">{c}</span>
                            <span className="text-foreground/15 text-[8px]">vs</span>
                            <span className="w-4 text-foreground/50 text-[9px]">{d}</span>
                            <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden"><div className="h-full bg-gold/60 rounded-full" style={{ width: `${d}%` }} /></div>
                            <span className={`w-7 text-right font-bold text-[9px] ${delta > 0 ? 'text-success' : delta < 0 ? 'text-error' : 'text-foreground/25'}`}>{delta > 0 ? `+${delta}` : delta === 0 ? '=' : `${delta}`}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => setSelectedDirId(null)} className="flex-1 py-2 text-xs rounded-lg border border-card-border text-foreground/60 hover:border-foreground/40 transition-colors">Keep Current</button>
                      <button onClick={handleAssignCandidate} className="flex-1 py-2 text-xs rounded-lg bg-gold text-navy-dark font-semibold hover:bg-gold-light transition-colors">Assign Candidate</button>
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </AnimatePresence>
          </div>
        </div>

        {/* ═══ RIGHT: Boardroom Table (35%) ═══ */}
        <div className="w-[35%] flex flex-col p-4 overflow-y-auto">
          {/* Company info box */}
          <div className="mb-3 flex-shrink-0">{companyCardJsx}</div>

          {/* Boardroom table */}
          <div className="flex-1 flex items-center justify-center">
            <BoardroomTable
              seats={seats}
              directors={availableDirectors}
              activeSeatIndex={activeSeatIdx}
              onSeatClick={handleSeatClick}
              hasEnergyTransition={hasEnergyTransition}
              hasCsrd={hasCsrd}
              hasStrategy={hasStrategy}
              onDropOnSeat={handleAssignToSeat}
              companyShortName={company.shortName}
              companyShortNameSuffix={company.shortNameSuffix}
              jurisdiction={company.jurisdiction}
              combinedChairCeo={company.id === 'company_vantage'}
              workerRepIds={company.id === 'company_rheinfeld' ? ['rdir_w_koch', 'rdir_w_alrashid', 'rdir_w_hoffmann', 'rdir_w_mehta', 'rdir_w_gruber'] : []}
              lockedDirectorIds={company.id === 'company_rheinfeld' ? ['rdir_heinrich'] : []}
              companyId={company.id}
              onTouchDragStart={startTouchDrag}
            />
          </div>
          <p className="text-[10px] text-foreground/30 mt-2 text-center flex-shrink-0">Click a seat to assign · Click a filled seat to view profile</p>

          {/* Board Strength */}
          <div className="mt-3 flex-shrink-0">{boardStrengthJsx}</div>
        </div>
      </div>

      {/* Committee hints — take priority over sequential hints when present */}
      {activeCommitteeHint && (
        <HintModal
          title={activeCommitteeHint.title}
          body={activeCommitteeHint.body}
          onDismiss={() => setActiveCommitteeHint(null)}
        />
      )}

      {/* Sequential first-time hints — shown only when no committee hint is active */}
      {!activeCommitteeHint && (() => {
        if (hintsShown === -1) return null;
        if (hintsShown === 0)
          return <HintModal body="Browse directors and drag them onto the board seats. Each seat shows a suggested role — you can reassign roles after placing a director." onDismiss={dismissHint} />;
        if (hintsShown === 1)
          return <HintModal body="Resolve all compliance errors before starting — red means blocked, amber means a warning. The Compliance panel on the right shows what needs fixing." onDismiss={dismissHint} />;
        if (hintsShown === 2)
          return <HintModal body="Happy with your board? Lock it in — your picks are permanent until the AGM. You can still adjust roles and committee assignments before locking." onDismiss={dismissHint} />;
        if (hintsShown === 3 && hint3Ready)
          return company.id === 'company_meridian'
            ? <HintModal title="Finance & Risk Committee Chair" body="Your Finance & Risk Chair needs strong Financial Oversight — look for a score of 65 or above. They will oversee the charity's financial controls and solvency obligations." onDismiss={dismissHint} />
            : <HintModal title="Now appoint your Audit Chair" body="Your Audit Chair needs strong Financial Oversight — look for a score of 75 or above. Click 'Financial' in the filter bar to find the best candidates. Drag them into the Audit Chair seat." onDismiss={dismissHint} />;
        if (hintsShown === 4 && hint4Ready)
          return company.id === 'company_meridian'
            ? <HintModal title="People & Culture Committee Chair" body="Your People & Culture Chair oversees trustee wellbeing, diversity, and staff culture. They need strong People & Culture credentials — a vacant seat here weakens your governance score." onDismiss={dismissHint} />
            : <HintModal title="Remuneration Committee Chair" body="Your Rem Chair oversees executive pay. They need strong People & Culture credentials. A vacant Rem Chair will hurt your governance health score." onDismiss={dismissHint} />;
        if (hintsShown === 5)
          return <HintModal title="Your board's combined strength" body="This shows your team's average score across all eight domains. Events will test specific domains — a balanced board handles more situations effectively." onDismiss={dismissHint} />;
        if (hintsShown === 6 && hint6Ready)
          return <HintModal title="Independence matters" body="Most committee chairs must be independent directors. Directors with the 'Questionable' badge may not qualify — check before assigning them to key roles." onDismiss={dismissHint} />;
        if (hintsShown === 7 && hint7Ready)
          return <HintModal title="Watch your budget" body="You're running low on board budget. Remember you can remove directors and replace them with lower-cost alternatives — or leave seats empty and accept the governance health penalty." onDismiss={dismissHint} />;
        return null;
      })()}

      {/* Board Guide Modal */}
      <BoardGuideModal isOpen={showBoardGuide} onClose={() => setShowBoardGuide(false)} company={company} />

      {/* Touch drag ghost — follows finger position, pointer-events:none, zIndex below modals */}
      {touchGhost && (
        <div
          ref={touchGhostRef}
          style={{
            position: 'fixed',
            left: touchGhost.x - 26,
            top: touchGhost.y - 26,
            width: 52,
            height: 52,
            zIndex: 9998,
            pointerEvents: 'none',
            borderRadius: '50%',
            border: '2px solid #C8960C',
            overflow: 'hidden',
            opacity: 0.85,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          <DirectorPortrait directorId={touchGhost.dirId} size={52} className="rounded-full" />
        </div>
      )}

      {/* Lock modal */}
      <AnimatePresence>
        {showLockConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLockConfirm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-navy-light border border-gold/30 rounded-lg p-8 max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gold mb-4">Lock Board?</h3>
              <p className="font-narrative text-foreground/80 mb-6">Once locked, your board composition cannot be changed until the AGM. Director roles, committee assignments, and budget allocation will be final.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowLockConfirm(false)} className="flex-1 py-2 rounded border border-card-border text-foreground/80 hover:border-gold/50 transition-colors">Review Board</button>
                <button onClick={() => { playBoardConfirm(); setShowLockConfirm(false); const optComm: CommitteeId[] = [...(hasCsrd ? ['csrd' as CommitteeId] : []), ...(hasStrategy ? ['strategy' as CommitteeId] : [])]; onStartGame(seats, hasEnergyTransition, optComm.length ? optComm : undefined); }} className="flex-1 py-2 rounded bg-gold text-navy-dark font-semibold hover:bg-gold-light transition-colors">Confirm & Start</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pool Card (compact, for 4-column grid) ──
function PoolCard({ director, selected, onBoard, overflow, onClick, jurisdiction = 'UK', displayFee, onTouchStart }: {
  director: Director; selected: boolean; onBoard: boolean; overflow?: boolean; onClick: () => void; jurisdiction?: string; displayFee?: number; onTouchStart?: (e: React.TouchEvent) => void;
}) {
  const ind = INDEP_BADGE[director.independence];
  const canDrag = !onBoard || overflow;
  return (
    <div
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) { e.preventDefault(); return; }
        e.dataTransfer.setData('text/plain', director.id);
        e.dataTransfer.effectAllowed = 'move';
        (e.currentTarget as HTMLElement).style.opacity = '0.5';
      }}
      onDragEnd={(e) => {
        (e.currentTarget as HTMLElement).style.opacity = '1';
      }}
      onTouchStart={canDrag ? onTouchStart : undefined}
      onClick={onBoard && !overflow ? undefined : onClick}
      className={`rounded-lg bg-card-bg border p-1.5 transition-all ${
        selected ? 'border-gold ring-1 ring-gold/40 cursor-pointer'
        : onBoard && !overflow ? 'border-card-border opacity-30 cursor-not-allowed'
        : overflow ? 'border-warning/40 cursor-pointer hover:border-warning/60'
        : 'border-card-border cursor-pointer hover:border-foreground/30'
      }`}
    >
      <div className="flex flex-col items-center text-center gap-1">
        <div className="shrink-0 rounded-full overflow-hidden border border-gold/30"><DirectorPortrait directorId={director.id} size={40} /></div>
        <div className="min-w-0 w-full">
          <h4 className="text-[9px] font-bold text-foreground leading-tight truncate">{director.name}</h4>
          <span className="text-[9px] font-semibold text-gold">{fmtFee(displayFee ?? director.annualFee, jurisdiction)}</span>
          <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
            <span className={`text-[7px] px-0.5 py-0 rounded-full font-medium ${ind.cls}`}>{ind.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
