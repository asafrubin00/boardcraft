'use client';

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
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
import {
  checkHealthCrisis,
  checkMisconduct,
  applyForcedRemoval,
  applyRetainDirector,
  applyReplacement,
  tickForcedChangeTimer,
} from '@/engine/forcedChanges';
import { playBoardSeatDrop, playBoardSeatRemove, playBoardConfirm, playDirectorSelect, ensureAudioContext } from '@/engine/soundEngine';

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
      'rheinfeld-q1', 'rheinfeld-q2', 'rheinfeld-q3', 'rheinfeld-q4', 'rheinfeld-agm', 'rheinfeld-yearend'];
    if (!validKeys.includes(devKey)) return;

    setDevBooted(true);
    const isVantage = devKey.startsWith('vantage-');
    const isRheinfeld = devKey.startsWith('rheinfeld-');
    const phaseKey = isVantage ? devKey.replace('vantage-', '') : isRheinfeld ? devKey.replace('rheinfeld-', '') : devKey;
    const devCompany = isVantage ? vantageConsumer : isRheinfeld ? rheinfeldAG : harwickEnergy;
    const seats = buildDevBoard(isVantage ? DEV_BOARD_VANTAGE : isRheinfeld ? DEV_BOARD_RHEINFELD : DEV_BOARD_HARWICK);
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

      // Check for FMC-02: misconduct risk flag activation on deployed directors
      const misconduct = checkMisconduct(newState, deployedDirectorIds);
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

      setGameState(newState);
      return output;
    },
    [gameState]
  );

  // ── Forced Change handlers ──
  const handleForcedDismiss = useCallback((directorId: string) => {
    if (!gameState) return;
    const updated = applyForcedRemoval(gameState, directorId);
    setGameState(updated);
  }, [gameState]);

  const handleForcedRetain = useCallback(() => {
    if (!gameState) return;
    const updated = applyRetainDirector(gameState);
    const breakdown = recalcGovernanceBreakdown(updated);
    updated.governanceHealthBreakdown = rescaleBreakdown(breakdown, updated.governanceHealth);
    setGameState(updated);
  }, [gameState]);

  const handleForcedReplace = useCallback((newDirectorId: string, role: _DevBoardRole) => {
    if (!gameState) return;
    const updated = applyReplacement(gameState, newDirectorId, role);
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
        // Stuck — move to year end
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

      const resolution1Pass = isSuccess || isPartial;
      const resolution2Pass = isSuccess;
      const resolution3Pass = isSuccess || (isPartial && newState.committees.energyTransition.active);

      // AGM GH bonus: all resolutions pass → +5, one or zero pass → -8
      const passCount = [resolution1Pass, resolution2Pass, resolution3Pass].filter(Boolean).length;
      const agmGhDelta = passCount === 3 ? 5 : passCount <= 1 ? -8 : 0;
      newState.governanceHealth = Math.max(0, Math.min(100, newState.governanceHealth + agmGhDelta));
      newState.governanceHealthBreakdown = rescaleBreakdown(breakdown, newState.governanceHealth);

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

  // ── Restart — skip company select, go straight to board construction ──
  const handleRestart = useCallback(() => {
    setGameState(null);
    setAgmResults(null);
    setRegenDirectorIds([]);
    setIsRestart(true);
    setPhase('board_construction');
  }, []);

  // ── Change Company — full reset back to company select ──
  const handleChangeCompany = useCallback(() => {
    setGameState(null);
    setAgmResults(null);
    setRegenDirectorIds([]);
    setIsRestart(false);
    setDevBooted(false);
    setSelectedCompany(null);
    setPhase('company_select');
  }, []);

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
    return <YearEndScreen gameState={gameState} onRestart={handleRestart} onChangeCompany={handleChangeCompany} />;
  }

  if (phase === 'gameplay' && gameState) {
    return (
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
        onForcedDismiss={handleForcedDismiss}
        onForcedRetain={handleForcedRetain}
        onForcedReplace={handleForcedReplace}
      />
    );
  }

  return null;
}

// ── Board Construction Wrapper ──
// Three-panel boardroom interface: Pool | Centre | Table

import { directors as allDirectors } from '@/data/directors';
import { computeFeeWithPremium, checkCompliance } from '@/engine/compliance';
import CompliancePanel from '@/components/CompliancePanel';
import BoardroomTable, {
  TABLE_POSITIONS,
  deriveTablePositions,
  getOverflowDirectorIds,
} from '@/components/BoardroomTable';
import DirectorPortrait from '@/components/DirectorPortrait';
import type { BoardRole, CompetencyDomain, CommitteeState, Director } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_SHORT, ROLE_LABELS, getRoleLabel } from '@/engine/boardConstants';
import { motion, AnimatePresence } from 'framer-motion';
import CompanyLogo from '@/components/CompanyLogo';

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

const ALL_BOARD_ROLES: BoardRole[] = ['chair', 'sid', 'auditChair', 'remChair', 'nomChair', 'energyTransitionChair', 'ned'];

// ETC seat position (matches BoardroomTable's ETC_POSITION)
const ETC_TABLE_POS = { defaultRole: 'energyTransitionChair' as BoardRole, label: 'ETC Chair', leftPct: 32, topPct: 94, isChair: false };

function getTablePosition(posIdx: number) {
  return posIdx < TABLE_POSITIONS.length ? TABLE_POSITIONS[posIdx] : ETC_TABLE_POS;
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

  // ── Build initial seats from inherited board ──
  const buildInitialSeats = useCallback((): BoardSeat[] => {
    return company.inheritedBoard.map((ib) => ({
      directorId: ib.directorId,
      role: ib.role,
      feeWithPremium: computeFeeWithPremium(ib.baseFee, ib.role),
    }));
  }, [company]);

  // ── Core state ──
  const [seats, setSeats] = useState<BoardSeat[]>(() => buildInitialSeats());
  const [hasEnergyTransition, setHasEnergyTransition] = useState(false);
  const [hasCsrd, setHasCsrd] = useState(false);
  const [hasStrategy, setHasStrategy] = useState(false);
  const [filterDomain, setFilterDomain] = useState<CompetencyDomain | null>(null);
  const [sortBy, setSortBy] = useState<'fee' | 'score'>('fee');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showStrength, setShowStrength] = useState(false);
  const [hintsShown, setHintsShown] = useState<number>(() => {
    if (typeof window === 'undefined') return -1;
    return localStorage.getItem('boardcraft_hints_seen') ? -1 : 0;
  });
  const [showRestartBanner, setShowRestartBanner] = useState(isRestart);

  // ── Interaction state ──
  const [activeSeatIdx, setActiveSeatIdx] = useState<number | null>(null);
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);

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

  // ── Derived ──
  const budget = company.boardBudget;
  const etFormationCost = company.committees.find((c) => c.id === 'energyTransition')?.formationCost ?? 180_000;
  const csrdFormationCost = company.committees.find((c) => c.id === 'csrd')?.formationCost ?? 0;
  const strategyFormationCost = company.committees.find((c) => c.id === 'strategy')?.formationCost ?? 0;
  const etCost = hasEnergyTransition ? etFormationCost : 0;
  const csrdCost = hasCsrd ? csrdFormationCost : 0;
  const strategyCost = hasStrategy ? strategyFormationCost : 0;
  const seatsFee = seats.reduce((sum, s) => sum + s.feeWithPremium, 0);
  const committed = seatsFee + etCost + csrdCost + strategyCost;
  const remaining = budget - committed;

  const boardIds = useMemo(() => seats.map((s) => s.directorId), [seats]);
  const boardIdSet = useMemo(() => new Set(boardIds), [boardIds]);
  const tablePos = useMemo(() => deriveTablePositions(seats, hasEnergyTransition), [seats, hasEnergyTransition]);
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
        chairDirectorId: null,
      },
      strategy: {
        active: company.committees.some((c) => c.id === 'strategy' && c.status === 'active') || hasStrategy,
        chairDirectorId: null,
      },
    };
  }, [seats, hasEnergyTransition, hasSafetyEnv, hasCsrd, hasStrategy, company]);

  const isCombinedChairCeo = company.id === 'company_vantage';
  const complianceErrors = useMemo(() => checkCompliance(seats, availableDirectors, committees, company.jurisdiction, isCombinedChairCeo), [seats, availableDirectors, committees, company.jurisdiction, isCombinedChairCeo]);
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
    // Hint 5: Board Strength popover — skip if popover was already opened (wait handled below)
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
      const uniq: BoardRole[] = ['chair','auditChair','remChair','nomChair','sid','safetyEnvChair','energyTransitionChair'];
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
              return { ...s, role: newRole, feeWithPremium: computeFeeWithPremium(d?.annualFee ?? 0, newRole) };
            }
            if (s.directorId === occupant.directorId) {
              return { ...s, role: oldRole, feeWithPremium: computeFeeWithPremium(occupantDir?.annualFee ?? 0, oldRole) };
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
        return { ...s, role: newRole, feeWithPremium: computeFeeWithPremium(d?.annualFee ?? 0, newRole) };
      });
    });
  }, [pushAndSetSeats, directorMap]);

  const handleToggleET = useCallback(() => {
    // Push history before ET toggle since it may change seats
    if (hasEnergyTransition) {
      pushAndSetSeats((p) => p.map((s) => s.role === 'energyTransitionChair'
        ? { ...s, role: 'ned', feeWithPremium: computeFeeWithPremium(directorMap.get(s.directorId)?.annualFee ?? 0, 'ned') } : s));
    }
    setHasEnergyTransition((p) => !p);
  }, [hasEnergyTransition, pushAndSetSeats, directorMap]);

  // ── New interaction handlers ──
  const handleAssignToSeat = useCallback((directorId: string, posIdx: number) => {
    const pos = getTablePosition(posIdx);
    if (boardIdSet.has(directorId)) {
      handleRoleChange(directorId, pos.defaultRole);
    } else {
      const d = directorMap.get(directorId);
      if (!d) return;
      const fee = computeFeeWithPremium(d.annualFee, pos.defaultRole);
      if (committed + fee > budget) return;
      // Remove any existing occupant of this unique role to prevent duplicate role entries
      const uniqRoles: BoardRole[] = ['chair','auditChair','remChair','nomChair','sid','safetyEnvChair','energyTransitionChair'];
      pushAndSetSeats((p) => {
        const filtered = uniqRoles.includes(pos.defaultRole)
          ? p.filter((s) => s.role !== pos.defaultRole)
          : p;
        return [...filtered, { directorId, role: pos.defaultRole, feeWithPremium: fee }];
      });
    }
    setActiveSeatIdx(null); setSelectedDirId(null);
    playBoardSeatDrop();
  }, [boardIdSet, committed, budget, handleRoleChange, pushAndSetSeats, directorMap]);

  const handleSeatClick = useCallback((idx: number) => {
    if (activeSeatIdx === idx) { setActiveSeatIdx(null); setSelectedDirId(null); return; }
    setActiveSeatIdx(idx); setSelectedDirId(null);
  }, [activeSeatIdx]);

  const handlePoolClick = useCallback((dirId: string) => {
    if (boardIdSet.has(dirId) && !overflowSet.has(dirId)) return;
    if (activeSeatIdx !== null) {
      const occupant = tablePos[activeSeatIdx];
      if (occupant === null) { handleAssignToSeat(dirId, activeSeatIdx); }
      else { setSelectedDirId(dirId); playDirectorSelect(); }
    } else { setSelectedDirId(dirId); playDirectorSelect(); }
  }, [activeSeatIdx, tablePos, boardIdSet, overflowSet, handleAssignToSeat]);

  const handleAssignCandidate = useCallback(() => {
    if (activeSeatIdx === null || !selectedDirId) return;
    const cur = tablePos[activeSeatIdx]; if (!cur) return;
    const pos = getTablePosition(activeSeatIdx);
    const cand = directorMap.get(selectedDirId); if (!cand) return;
    const candOnBoard = boardIdSet.has(selectedDirId);
    pushAndSetSeats((p) => {
      const filtered = p.filter((s) => s.directorId !== cur && (candOnBoard ? s.directorId !== selectedDirId : true));
      return [...filtered, { directorId: selectedDirId, role: pos.defaultRole, feeWithPremium: computeFeeWithPremium(cand.annualFee, pos.defaultRole) }];
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
        const aMax = Math.max(...ALL_DOMAINS.map((dom) => a.domainRatings[dom]));
        const bMax = Math.max(...ALL_DOMAINS.map((dom) => b.domainRatings[dom]));
        return (aMax - bMax) * dir;
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
      return true;
    });
  }, [hasEnergyTransition, hasSafetyEnv]);

  return (
    <div className="h-screen bg-navy text-foreground flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-card-border px-6 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gold tracking-wide font-narrative">BOARDCRAFT</h1>
            <p className="text-xs text-gold-dim mt-0.5">Board Construction — {company.name}</p>
          </div>
          <div className="text-right text-xs text-foreground/50">
            {company.industry} · {company.jurisdiction} · GH {company.startingGovernanceHealth}/100
          </div>
        </div>
      </header>

      {/* Permanent picks warning banner */}
      <div className="bg-gold/10 border-b border-gold/30 px-4 py-2 flex items-center justify-center gap-2 text-sm flex-shrink-0">
        <span className="text-gold font-semibold">&#9888;</span>
        <span className="text-gold/90 font-narrative text-xs">Your picks are permanent until the AGM — choose carefully.</span>
      </div>

      <AnimatePresence>
        {showRestartBanner && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="bg-gold/10 border-b border-gold/30 text-center py-2 flex-shrink-0">
            <p className="text-gold font-narrative text-sm italic">New game — same company. Build a better board.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ═══ LEFT: Director Pool (35%) ═══ */}
        <div className="w-[35%] border-r border-card-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-card-border flex-shrink-0 space-y-2">
            <h2 className="text-sm font-bold text-gold">Director Pool</h2>
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
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-[9px] text-foreground/40 uppercase tracking-wide">Sort</span>
              <button onClick={() => { if (sortBy === 'fee') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('fee'); setSortDir('asc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'fee' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>
                Fee {sortBy === 'fee' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => { if (sortBy === 'score') { setSortDir((p) => p === 'asc' ? 'desc' : 'asc'); } else { setSortBy('score'); setSortDir('desc'); } }} className={`px-1.5 py-0.5 rounded flex items-center gap-0.5 ${sortBy === 'score' ? 'bg-gold/20 text-gold border border-gold/40' : 'text-foreground/40 hover:text-foreground/60'}`}>
                Score {sortBy === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
          <div
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
              <p className="text-[10px] text-warning font-medium mb-2">⚠ Unseated directors — click a table seat to place them</p>
            )}
            <div className="grid grid-cols-4 gap-1.5">
              {sortedPool.map((d) => (
                <PoolCard key={d.id} director={d} selected={selectedDirId === d.id} onBoard={boardIdSet.has(d.id) && !overflowSet.has(d.id)} overflow={overflowSet.has(d.id)} onClick={() => handlePoolClick(d.id)} jurisdiction={company.jurisdiction} />
              ))}
            </div>
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
                  <p className="text-xs text-foreground/50 mt-2 font-narrative italic">Build your board. Navigate the crises. Maximise shareholder value.</p>
                </div>
                <div>
                  <div className="w-full h-3 bg-navy-dark rounded-full overflow-hidden">
                    <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${Math.min((committed / budget) * 100, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-foreground/40 text-center mt-1.5">
                    {fmt(committed)} committed · {fmt(Math.max(0, remaining))} remaining · {fmt(budget)} total
                  </p>
                </div>
                <CompliancePanel errors={complianceErrors} />
                {/* ET Toggle — only show if company has ET committee definition */}
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
                {/* CSRD Toggle — Rheinfeld only */}
                {csrdFormationCost > 0 && (
                  <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasCsrd ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={() => setHasCsrd((p) => !p)}>
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
                {/* Strategy Committee Toggle — Rheinfeld only */}
                {strategyFormationCost > 0 && (
                  <div className={`rounded-lg border p-4 cursor-pointer transition-all ${hasStrategy ? 'border-gold bg-gold/5' : 'border-card-border hover:border-gold/50'}`} onClick={() => setHasStrategy((p) => !p)}>
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
                  {seats.length} director{seats.length !== 1 ? 's' : ''} · {remaining < 0 ? <span className="text-error font-medium">Over budget by {fmt(Math.abs(remaining))}</span> : <span>{fmt(remaining)} remaining</span>}
                </div>
                <div className="mt-auto pt-4">
                  <button onClick={() => { if (!hasBlockingErrors) setShowLockConfirm(true); }} disabled={hasBlockingErrors} className={`w-full py-3 rounded-lg text-sm font-semibold transition-all ${hasBlockingErrors ? 'bg-navy-light text-foreground/30 cursor-not-allowed' : 'bg-gold text-navy-dark hover:bg-gold-light active:scale-[0.98]'}`}>
                    {hasBlockingErrors ? 'Resolve Compliance Errors' : 'Lock Board & Start Game'}
                  </button>
                </div>
              </motion.div>
            )}

            {mode === 'select' && (
              <motion.div key="sel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center p-5 text-center">
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-gold/40 flex items-center justify-center mb-4 animate-pulse"><span className="text-gold/40 text-3xl">+</span></div>
                <h3 className="text-lg font-bold text-gold font-narrative mb-2">Select a Director</h3>
                <p className="text-xs text-foreground/50 max-w-xs">Choose a director from the pool to fill the <span className="text-gold font-semibold">{activeSeatIdx !== null ? getTablePosition(activeSeatIdx).label : ''}</span> seat.</p>
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
                          {availableBoardRoles.map((r) => <option key={r} value={r}>{getRoleLabel(r, company.jurisdiction)}</option>)}
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
                    {seated && <button onClick={() => handleRemoveDirector(dir.id)} className="w-full py-2 text-sm bg-error/15 text-error border border-error/30 rounded-lg hover:bg-error/25 transition-colors">Remove from Board</button>}
                  </div>
                </motion.div>
              );
            })()}

            {mode === 'comparison' && seatOccDir && selDir && (() => {
              const cur = seatOccDir, cand = selDir;
              const curFee = seatRec?.feeWithPremium ?? 0;
              const candRole = activeSeatIdx !== null ? getTablePosition(activeSeatIdx).defaultRole : 'ned' as BoardRole;
              const candFee = computeFeeWithPremium(cand.annualFee, candRole);
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
          <div className="mb-3 flex-shrink-0">
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
          </div>

          {/* Boardroom table */}
          <div className="flex-1 flex items-center justify-center">
            <BoardroomTable
              seats={seats}
              directors={availableDirectors}
              activeSeatIndex={activeSeatIdx}
              onSeatClick={handleSeatClick}
              hasEnergyTransition={hasEnergyTransition}
              onDropOnSeat={handleAssignToSeat}
              companyShortName={company.shortName}
              companyShortNameSuffix={company.shortNameSuffix}
              jurisdiction={company.jurisdiction}
              combinedChairCeo={company.id === 'company_vantage'}
              workerRepIds={company.id === 'company_rheinfeld' ? ['rdir_w_koch', 'rdir_w_alrashid', 'rdir_w_hoffmann', 'rdir_w_mehta', 'rdir_w_gruber'] : []}
              lockedDirectorIds={company.id === 'company_rheinfeld' ? ['rdir_heinrich'] : []}
            />
          </div>
          <p className="text-[10px] text-foreground/30 mt-2 text-center flex-shrink-0">Click a seat to assign · Click a filled seat to view profile</p>

          {/* Board Strength — hover popover */}
          {seats.length > 0 && (
            <div className="mt-3 flex-shrink-0 relative" onMouseLeave={() => setShowStrength(false)}>
              <button
                onClick={() => setShowStrength(p => !p)}
                onMouseEnter={() => setShowStrength(true)}
                className="w-full py-1.5 px-3 rounded-full border border-gold/40 text-gold text-[11px] font-semibold hover:bg-gold/10 transition-colors cursor-pointer text-center"
              >
                Board Strength &#8599;
              </button>
              {showStrength && (
                <div className="absolute bottom-full right-0 mb-2 z-50 rounded-lg border border-gold/30 bg-navy-light shadow-xl p-4" style={{ minWidth: 320 }}>
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* First-time hints */}
      <AnimatePresence>
        {hintsShown === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-8 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-xs text-foreground/80 mb-2">Browse directors and drag them onto the board seats &rarr;</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-xs text-foreground/80 mb-2">Resolve all errors before starting &mdash; red means blocked, amber means warning</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-xs text-foreground/80 mb-2">Happy with your board? Lock it in &mdash; your picks are permanent until the AGM</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 3 && hint3Ready && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-[11px] text-gold font-semibold mb-1">Now appoint your Audit Chair</p>
            <p className="text-xs text-foreground/80 mb-2">Your Audit Chair needs strong Financial Oversight &mdash; look for a score of 75 or above. Click &lsquo;Financial&rsquo; in the filter bar to find the best candidates. Drag them into the Audit Chair seat.</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 4 && hint4Ready && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-[11px] text-gold font-semibold mb-1">Remuneration Committee Chair</p>
            <p className="text-xs text-foreground/80 mb-2">Your Rem Chair oversees executive pay. They need strong People &amp; Culture credentials. A vacant Rem Chair will hurt your governance health score.</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 5 && showStrength && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-[11px] text-gold font-semibold mb-1">Your board&rsquo;s combined strength</p>
            <p className="text-xs text-foreground/80 mb-2">This shows your team&rsquo;s average score across all eight domains. Events will test specific domains &mdash; a balanced board handles more situations effectively.</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 6 && hint6Ready && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-[11px] text-gold font-semibold mb-1">Independence matters</p>
            <p className="text-xs text-foreground/80 mb-2">Most committee chairs must be independent directors. Directors with the &lsquo;Questionable&rsquo; badge may not qualify &mdash; check before assigning them to key roles.</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
        {hintsShown === 7 && hint7Ready && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-navy-light border border-gold/40 rounded-lg p-3 shadow-xl max-w-xs">
            <p className="text-[11px] text-gold font-semibold mb-1">Watch your budget</p>
            <p className="text-xs text-foreground/80 mb-2">You&rsquo;re running low on board budget. Remember you can remove directors and replace them with lower-cost alternatives &mdash; or leave seats empty and accept the governance health penalty.</p>
            <button onClick={dismissHint} className="text-[10px] text-gold font-semibold hover:text-gold-light cursor-pointer">Got it</button>
          </motion.div>
        )}
      </AnimatePresence>

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
function PoolCard({ director, selected, onBoard, overflow, onClick, jurisdiction = 'UK' }: {
  director: Director; selected: boolean; onBoard: boolean; overflow?: boolean; onClick: () => void; jurisdiction?: string;
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
          <span className="text-[9px] font-semibold text-gold">{fmtFee(director.annualFee, jurisdiction)}</span>
          <div className="flex flex-wrap justify-center gap-0.5 mt-0.5">
            <span className={`text-[7px] px-0.5 py-0 rounded-full font-medium ${ind.cls}`}>{ind.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
