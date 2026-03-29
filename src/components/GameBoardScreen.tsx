'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { GameState, GameEvent, BoardSeat, Director, ResolutionOutput, BoardRole } from '@/types/game';
import { DOMAIN_SHORT, ALL_DOMAINS, getRoleLabel } from '@/engine/boardConstants';
import DirectorPortrait from './DirectorPortrait';
import { getMaxTurnsForQuarter } from '@/engine/gameStateManager';
import BoardroomTable, { deriveTablePositions } from './BoardroomTable';
import SvTracker from './SvTracker';
import SvDashboardModal from './SvDashboardModal';
import EventCard from './EventCard';
import DeploymentModal from './DeploymentModal';
import OutcomeDisplay from './OutcomeDisplay';
import ForcedChangeModal from './ForcedChangeModal';
import NewsTicker from './NewsTicker';
import { useNewsTicker } from '@/hooks/useNewsTicker';
import {
  isSoundEnabled, setSoundEnabled, playCardDeal, playDirectorSelect,
  ensureAudioContext, cycleVolume, getVolumeLevel,
  type VolumeLevel,
} from '@/engine/soundEngine';

// Quarter order for AGM countdown
const QUARTER_ORDER = ['Q1', 'Q2', 'AGM', 'Q3', 'Q4'] as const;

interface GameBoardScreenProps {
  gameState: GameState;
  currentEvent: GameEvent | null;
  svHistory: { turn: string; sv: number }[];
  proxyAdviserRating: string;
  onResolveEvent: (strategyChoice: string, deployedDirectorIds: string[]) => ResolutionOutput;
  onAdvanceTurn: () => void;
  onSkipEvent: () => void;
  regenDirectorIds?: string[];
  onClearRegen?: () => void;
  onForcedDismiss?: (directorId: string) => void;
  onForcedRetain?: () => void;
  onForcedReplace?: (newDirectorId: string, role: BoardRole) => void;
}

// Volume level indicator bars component
function VolumeBars({ level }: { level: VolumeLevel }) {
  const bars = level === 'muted' ? 0 : level === 'quiet' ? 1 : level === 'normal' ? 2 : 3;
  return (
    <span className="inline-flex items-end gap-px ml-1" style={{ height: 14 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`inline-block rounded-sm transition-all ${
            i < bars ? 'bg-gold' : 'bg-foreground/15'
          }`}
          style={{ width: 3, height: 5 + i * 3 }}
        />
      ))}
    </span>
  );
}

export default function GameBoardScreen({
  gameState,
  currentEvent,
  svHistory,
  proxyAdviserRating,
  onResolveEvent,
  onAdvanceTurn,
  onSkipEvent,
  regenDirectorIds = [],
  onClearRegen,
  onForcedDismiss,
  onForcedRetain,
  onForcedReplace,
}: GameBoardScreenProps) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [showDeployment, setShowDeployment] = useState(false);
  const [lastOutcome, setLastOutcome] = useState<ResolutionOutput | null>(null);
  const [lastEventName, setLastEventName] = useState('');
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [flashingIds, setFlashingIds] = useState<Set<string>>(new Set());
  const [selectedDirectorId, setSelectedDirectorId] = useState<string | null>(null);
  const [showRegenToast, setShowRegenToast] = useState(false);

  // Ensure AudioContext is ready on first user click
  useEffect(() => { ensureAudioContext(); }, []);

  // News ticker
  const { headlines } = useNewsTicker(gameState);

  // Sound + volume
  const [volumeLevel, setVolumeLevel] = useState<VolumeLevel>(() => {
    isSoundEnabled(); // loads from localStorage
    return getVolumeLevel();
  });
  const handleCycleVolume = useCallback(() => {
    const next = cycleVolume();
    setVolumeLevel(next);
  }, []);

  // Wound indicators — track failed event domains (max 3)
  const wounds = useMemo(() => {
    const w: { type: 'sv' | 'gov'; eventName: string }[] = [];
    for (const re of gameState.resolvedEvents) {
      if (re.outcomeTier === 'FAILURE' || re.outcomeTier === 'CRITICAL_FAILURE') {
        if (re.svDelta < -2) {
          w.push({ type: 'sv', eventName: re.eventId });
        } else {
          w.push({ type: 'gov', eventName: re.eventId });
        }
      }
    }
    return w.slice(-3); // max 3
  }, [gameState.resolvedEvents]);

  // Flash energy bars green for directors who regenerated energy
  useEffect(() => {
    if (regenDirectorIds.length > 0) {
      setFlashingIds(new Set(regenDirectorIds));
      setShowRegenToast(true);
      const timer = setTimeout(() => {
        setFlashingIds(new Set());
        onClearRegen?.();
      }, 1500);
      const toastTimer = setTimeout(() => setShowRegenToast(false), 3000);
      return () => { clearTimeout(timer); clearTimeout(toastTimer); };
    }
  }, [regenDirectorIds, onClearRegen]);

  const boardDirectors = useMemo(() => {
    const result: (Director & { seatRole: string })[] = [];
    for (const seat of gameState.board.seats) {
      const dir = gameState.directors.find((d) => d.id === seat.directorId);
      if (dir) {
        result.push({ ...dir, seatRole: seat.role });
      }
    }
    return result;
  }, [gameState.board.seats, gameState.directors]);

  const directorEnergySummary = useMemo(() => {
    return boardDirectors.map((d) => ({
      name: d.name,
      energy: d.currentEnergy,
    }));
  }, [boardDirectors]);

  const directorNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const d of gameState.directors) {
      map[d.id] = d.name;
    }
    return map;
  }, [gameState.directors]);

  const maxTurns = getMaxTurnsForQuarter(gameState.currentQuarter);

  // Determine if Energy Transition committee is active
  const hasEnergyTransition = gameState.committees?.energyTransition?.active ?? false;

  // Derive table positions so we can map seat click → director
  const tablePositions = useMemo(
    () => deriveTablePositions(gameState.board.seats, hasEnergyTransition),
    [gameState.board.seats, hasEnergyTransition]
  );

  // Play card deal sound when a new event appears
  const prevEventId = useRef<string | null>(null);
  useEffect(() => {
    if (currentEvent && currentEvent.id !== prevEventId.current) {
      prevEventId.current = currentEvent.id;
      playCardDeal();
    }
  }, [currentEvent]);

  // When a seat on the table is clicked, select the director sitting there
  const handleTableSeatClick = useCallback(
    (seatIndex: number) => {
      const dirId = tablePositions[seatIndex];
      if (dirId) {
        playDirectorSelect();
        setSelectedDirectorId((prev) => (prev === dirId ? null : dirId));
      }
    },
    [tablePositions]
  );

  // Find the selected director's full data
  const selectedDir = useMemo(() => {
    if (!selectedDirectorId) return null;
    return boardDirectors.find((d) => d.id === selectedDirectorId) ?? null;
  }, [selectedDirectorId, boardDirectors]);

  // Handle strategy selection
  const handleSelectStrategy = useCallback((strategyId: string) => {
    setSelectedStrategy(strategyId);
    setShowDeployment(true);
  }, []);

  // Handle do-nothing / skip
  const handleDoNothing = useCallback(() => {
    if (!currentEvent) return;

    // Event 08 (report card) — auto-resolve
    if (currentEvent.strategies.length === 0) {
      onSkipEvent();
      setWaitingForNext(true);
      return;
    }

    // Find the do-nothing strategy
    const doNothingStrategy = currentEvent.strategies.find(
      (s) => s.label.toLowerCase() === 'do nothing'
    );
    const strategyId = doNothingStrategy?.id ?? 'do_nothing';

    // Resolve with no directors
    const output = onResolveEvent(strategyId, []);
    setLastOutcome(output);
    setLastEventName(currentEvent.name);
  }, [currentEvent, onResolveEvent, onSkipEvent]);

  // Handle deployment confirmation
  const handleConfirmDeployment = useCallback(
    (directorIds: string[]) => {
      if (!selectedStrategy || !currentEvent) return;
      setShowDeployment(false);

      const output = onResolveEvent(selectedStrategy, directorIds);
      setLastOutcome(output);
      setLastEventName(currentEvent.name);
      setSelectedStrategy(null);
    },
    [selectedStrategy, currentEvent, onResolveEvent]
  );

  // Handle outcome dismissal
  const handleDismissOutcome = useCallback(() => {
    setLastOutcome(null);
    setWaitingForNext(true);
  }, []);

  // Auto-advance after outcome dismissal or event skip
  useEffect(() => {
    if (waitingForNext) {
      setWaitingForNext(false);
      onAdvanceTurn();
    }
  }, [waitingForNext, onAdvanceTurn]);

  // Auto-advance when there is no event this turn (silent skip)
  const hasAutoAdvanced = useRef(false);
  useEffect(() => {
    if (!currentEvent && !lastOutcome && !waitingForNext && !hasAutoAdvanced.current) {
      hasAutoAdvanced.current = true;
      // Use microtask to avoid updating state during render
      Promise.resolve().then(() => {
        onAdvanceTurn();
      });
    }
    if (currentEvent) {
      hasAutoAdvanced.current = false;
    }
  }, [currentEvent, lastOutcome, waitingForNext, onAdvanceTurn]);

  // Jurisdiction from the game state company
  const jurisdiction = gameState.company.jurisdiction;
  const combinedChairCeo = gameState.company.id === 'company_vantage';

  // Short role label helper (jurisdiction-aware)
  const shortRole = (role: string) => {
    const full = getRoleLabel(role as Parameters<typeof getRoleLabel>[0], jurisdiction);
    return full
      .replace(' Committee Chair', ' Chair')
      .replace('Consumer Affairs & Regulatory', 'CA&R')
      .replace(/^Board /, '')
      .replace('Non-Executive Director', 'NED')
      .replace('Senior Independent Director', 'SID')
      .replace('Lead Independent Director', 'LID');
  };

  // AGM countdown
  const currentIdx = QUARTER_ORDER.indexOf(gameState.currentQuarter);
  const agmIdx = QUARTER_ORDER.indexOf('AGM');
  const isAfterAgm = currentIdx > agmIdx;
  const isAtAgm = currentIdx === agmIdx;
  const turnsPerQuarter = Math.ceil(maxTurns / QUARTER_ORDER.length);
  const turnsUntilAgm = isAfterAgm || isAtAgm ? 0 : (agmIdx - currentIdx) * turnsPerQuarter;

  // Governance health colours
  const healthColor = gameState.governanceHealth >= 70 ? 'text-success' : gameState.governanceHealth >= 50 ? 'text-warning' : 'text-error';
  const healthDotColor = gameState.governanceHealth >= 70 ? 'bg-success' : gameState.governanceHealth >= 50 ? 'bg-warning' : 'bg-error';

  return (
    <div className="h-screen bg-navy text-foreground flex flex-col overflow-hidden">
      {/* Top Bar — all game info merged here */}
      <header className="border-b border-card-border px-4 py-2 flex items-center justify-between bg-navy-dark/50 shrink-0">
        {/* Left: Logo */}
        <h1 className="text-lg font-bold text-gold tracking-wide shrink-0">BOARDCRAFT</h1>

        {/* Centre: Quarter + Turn */}
        <div className="flex items-center gap-3">
          <div className="border border-gold/60 rounded px-2.5 py-0.5">
            <span className="text-gold font-narrative font-bold text-base">{gameState.currentQuarter}</span>
          </div>
          <span className="text-foreground text-sm">
            Turn <span className="text-gold font-bold">{gameState.currentTurn}</span>
            {' / '}<span className="text-foreground/60">{maxTurns}</span>
          </span>
        </div>

        {/* Centre-right: SV + GH + AGM */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <SvTracker
              svIndex={gameState.svIndex}
              svHistory={svHistory}
              onOpenDashboard={() => setShowDashboard(true)}
            />
            {wounds.filter(w => w.type === 'sv').map((_, i) => (
              <span key={`sv-w-${i}`} className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" title="SV wound" />
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-card-border pl-3">
            <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
            <span className="text-foreground/60 text-xs">GH</span>
            <span className={`font-bold text-sm ${healthColor}`}>{gameState.governanceHealth}</span>
            {wounds.filter(w => w.type === 'gov').map((_, i) => (
              <span key={`gov-w-${i}`} className="inline-block w-2 h-2 rounded-full bg-error animate-pulse" title="Gov wound" />
            ))}
          </div>

          <div className="text-xs text-foreground/50 border-l border-card-border pl-3">
            AGM:{' '}
            {isAfterAgm ? (
              <span className="text-success font-bold">Done</span>
            ) : isAtAgm ? (
              <span className="text-gold font-bold">Now</span>
            ) : (
              <span className="text-gold font-bold">~{turnsUntilAgm}t</span>
            )}
          </div>
        </div>

        {/* Right: Company + sound */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-foreground/50">{gameState.company.name}</span>
          <button
            onClick={handleCycleVolume}
            className="flex items-center text-foreground/40 hover:text-foreground/70 transition-colors text-base cursor-pointer"
            title={`Volume: ${volumeLevel}`}
          >
            {volumeLevel === 'muted' ? '🔇' : volumeLevel === 'quiet' ? '🔈' : volumeLevel === 'normal' ? '🔉' : '🔊'}
            <VolumeBars level={volumeLevel} />
          </button>
        </div>
      </header>

      {/* Forced Change Urgent Banner */}
      {gameState.forcedChange && (
        <div className="bg-error/20 border-b border-error/40 px-4 py-2 flex items-center justify-center gap-2 text-sm shrink-0">
          <span className="text-error font-bold">URGENT:</span>
          <span className="text-foreground/90">
            {gameState.forcedChange.directorName} has {gameState.forcedChange.type === 'health_crisis' ? 'resigned' : 'been flagged'}.
            Appoint a replacement within {gameState.forcedChange.turnsRemaining} turn{gameState.forcedChange.turnsRemaining !== 1 ? 's' : ''}.
          </span>
        </div>
      )}

      {/* Main Content — 40/60 split */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 90px)' }}>
        {/* Left 40% — Boardroom Table + Director Detail */}
        <div className="flex flex-col border-r border-card-border" style={{ width: '40%' }}>
          {/* Boardroom Table */}
          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center p-3" style={{ paddingTop: '8px' }}>
            <BoardroomTable
              seats={gameState.board.seats}
              directors={gameState.directors}
              activeSeatIndex={selectedDirectorId ? tablePositions.indexOf(selectedDirectorId) : null}
              onSeatClick={handleTableSeatClick}
              hasEnergyTransition={hasEnergyTransition}
              companyShortName={gameState.company.shortName}
              companyShortNameSuffix={gameState.company.shortNameSuffix}
              jurisdiction={jurisdiction}
              combinedChairCeo={combinedChairCeo}
            />
          </div>

          {/* Director Detail Box — fixed 180px, scrolls internally, margin-bottom clears ticker */}
          <div className="flex-none border-t border-card-border bg-navy-dark/30 px-4 py-3 overflow-y-auto" style={{ height: '180px', marginBottom: '44px' }}>
            {selectedDir ? (
              <div className="flex gap-4">
                {/* Portrait + name + role */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="rounded-full overflow-hidden border-2 border-gold/40">
                    <DirectorPortrait directorId={selectedDir.id} size={52} />
                  </div>
                  <span className="font-bold text-foreground text-center mt-1.5 leading-tight" style={{ fontSize: '13px', maxWidth: '120px' }}>
                    {selectedDir.name}
                  </span>
                  <span className="inline-block text-[10px] px-1.5 py-px rounded-full bg-gold/15 text-gold border border-gold/25 font-medium mt-1 leading-none">
                    {shortRole(selectedDir.seatRole)}
                  </span>
                  {/* Stamina */}
                  <div className="flex items-center gap-1.5 mt-2 w-full">
                    <span className="text-[11px] text-foreground/50 shrink-0">Stamina</span>
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${flashingIds.has(selectedDir.id) ? 'bg-success/30' : 'bg-navy-dark'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          flashingIds.has(selectedDir.id)
                            ? 'bg-green-400'
                            : selectedDir.currentEnergy >= 60
                            ? 'bg-success'
                            : selectedDir.currentEnergy >= 20
                            ? 'bg-warning'
                            : 'bg-error'
                        }`}
                        style={{ width: `${selectedDir.currentEnergy}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-foreground/50 shrink-0">{selectedDir.currentEnergy}%</span>
                  </div>
                </div>
                {/* Domain scores */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] text-foreground/50 uppercase tracking-wide mb-1">Competency Profile</h4>
                  <div className="space-y-0.5">
                    {ALL_DOMAINS.map((domain) => {
                      const score = selectedDir.domainRatings[domain];
                      return (
                        <div key={domain} className="flex items-center gap-2 text-[11px]">
                          <span className="text-foreground/50 truncate" style={{ width: '4.5rem' }}>{DOMAIN_SHORT[domain]}</span>
                          <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden">
                            <div className="h-full bg-gold/70 rounded-full" style={{ width: `${score}%` }} />
                          </div>
                          <span className="text-foreground/50 w-5 text-right font-medium">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <p className="text-foreground/40 italic text-sm font-narrative">Select a director to view their profile</p>
              </div>
            )}
          </div>
        </div>

        {/* Right 60% — Event Area: full width, 20px padding, stops above ticker */}
        <main className="flex-1 overflow-y-auto py-6" style={{ height: 'calc(100vh - 100px)', paddingLeft: '20px', paddingRight: '20px' }}>
          <div className="w-full">
            <AnimatePresence mode="wait">
              {currentEvent ? (
                <EventCard
                  key={currentEvent.id}
                  event={currentEvent}
                  directors={gameState.directors}
                  boardSeats={gameState.board.seats}
                  onSelectStrategy={handleSelectStrategy}
                  onDoNothing={handleDoNothing}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Deployment Modal */}
      {currentEvent && (
        <DeploymentModal
          isOpen={showDeployment}
          onClose={() => {
            setShowDeployment(false);
            setSelectedStrategy(null);
          }}
          event={currentEvent}
          strategyId={selectedStrategy ?? ''}
          directors={gameState.directors}
          boardSeats={gameState.board.seats}
          onConfirmDeployment={handleConfirmDeployment}
        />
      )}

      {/* Outcome Display */}
      <OutcomeDisplay
        outcome={lastOutcome}
        eventName={lastEventName}
        onDismiss={handleDismissOutcome}
        directorNames={directorNames}
      />

      {/* SV Dashboard Modal */}
      <SvDashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        svIndex={gameState.svIndex}
        svHistory={svHistory}
        governanceHealth={gameState.governanceHealth}
        governanceBreakdown={gameState.governanceHealthBreakdown}
        boardTension={gameState.boardTension}
        proxyAdviserRating={proxyAdviserRating}
        directorEnergySummary={directorEnergySummary}
        resolvedEvents={gameState.resolvedEvents}
      />

      {/* Stamina Regen Toast */}
      <AnimatePresence>
        {showRegenToast && (
          <div className="fixed bottom-20 right-4 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-card-bg border border-success/30 rounded-lg px-4 py-3 shadow-lg flex items-center gap-2">
              <span className="text-success text-lg">&#9889;</span>
              <div>
                <div className="text-xs font-semibold text-success">Quarter Complete</div>
                <div className="text-[11px] text-foreground/60">Directors resting. Stamina regenerating.</div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Forced Change Modal */}
      {gameState.forcedChange && onForcedDismiss && onForcedReplace && (
        <ForcedChangeModal
          forcedChange={gameState.forcedChange}
          directors={gameState.directors}
          boardSeats={gameState.board.seats}
          companyDirectorIds={gameState.company.directorIds}
          budget={gameState.company.boardBudget}
          committed={gameState.board.totalCommittedBudget}
          jurisdiction={jurisdiction}
          onDismiss={onForcedDismiss}
          onRetain={gameState.forcedChange.canRetain ? onForcedRetain : undefined}
          onReplace={onForcedReplace}
        />
      )}

      {/* Financial News Ticker */}
      <NewsTicker headlines={headlines} />
    </div>
  );
}
