'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  GameState,
  BoardSeat,
  BoardRole,
  GameEvent,
} from '@/types/game';
import {
  initializeGameState,
  getCurrentEvent,
  advanceToNextTurn,
  applyResolution,
  recalcGovernanceBreakdown,
  getSvHistory,
  getProxyAdviserRating,
  isGameOver,
  estimateAgmVotes,
  getAllEvents,
} from './gameStateManager';
import { resolveEvent } from './resolution';

export type GamePhase =
  | 'company_select'
  | 'board_construction'
  | 'gameplay'
  | 'agm'
  | 'year_end';

interface GameContextValue {
  // State
  phase: GamePhase;
  gameState: GameState | null;
  currentEvent: GameEvent | null;
  svHistory: { turn: string; sv: number }[];
  proxyAdviserRating: string;
  agmVotes: { forPercent: number; againstPercent: number };

  // Actions
  startGame: (seats: BoardSeat[], hasEnergyTransition: boolean) => void;
  resolveCurrentEvent: (
    strategyChoice: string,
    deployedDirectorIds: string[]
  ) => ReturnType<typeof resolveEvent>;
  advanceTurn: () => void;
  setPhase: (phase: GamePhase) => void;
  skipEvent: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<GamePhase>('company_select');
  const [gameState, setGameState] = useState<GameState | null>(null);

  const currentEvent = useMemo(() => {
    if (!gameState || gameState.phase === 'year_end') return null;
    return getCurrentEvent(gameState);
  }, [gameState]);

  const svHistory = useMemo(() => {
    if (!gameState) return [];
    return getSvHistory(gameState);
  }, [gameState]);

  const proxyAdviserRating = useMemo(() => {
    if (!gameState) return '';
    return getProxyAdviserRating(gameState.governanceHealth);
  }, [gameState]);

  const agmVotes = useMemo(() => {
    if (!gameState) return { forPercent: 50, againstPercent: 50 };
    return estimateAgmVotes(gameState);
  }, [gameState]);

  const startGame = useCallback(
    (seats: BoardSeat[], hasEnergyTransition: boolean) => {
      const state = initializeGameState(seats, hasEnergyTransition);
      // Advance to Q1 Turn 1
      const started: GameState = {
        ...state,
        currentQuarter: 'Q1',
        currentTurn: 1,
        phase: 'gameplay',
      };
      // Recalculate governance health based on board composition
      const breakdown = recalcGovernanceBreakdown(started);
      started.governanceHealthBreakdown = breakdown;
      started.governanceHealth = breakdown.total;
      setGameState(started);
      setPhase('gameplay');
    },
    []
  );

  const resolveCurrentEvent = useCallback(
    (strategyChoice: string, deployedDirectorIds: string[]) => {
      if (!gameState || !currentEvent) {
        throw new Error('No active game state or event');
      }

      const { newState, output } = applyResolution(
        gameState,
        currentEvent.id,
        strategyChoice,
        deployedDirectorIds
      );

      // Recalculate governance breakdown
      const breakdown = recalcGovernanceBreakdown(newState);
      newState.governanceHealthBreakdown = breakdown;

      setGameState(newState);
      return output;
    },
    [gameState, currentEvent]
  );

  const advanceTurn = useCallback(() => {
    if (!gameState) return;

    let next = advanceToNextTurn(gameState);

    // If next event is conditional and doesn't fire, keep advancing
    while (next.phase !== 'year_end') {
      const event = getCurrentEvent(next);
      if (event !== null || next.phase === 'agm') break;
      // Skip this turn
      next = advanceToNextTurn(next);
    }

    if (next.phase === 'agm') {
      setPhase('agm');
    } else if (next.phase === 'year_end') {
      setPhase('year_end');
    }

    setGameState(next);
  }, [gameState]);

  const skipEvent = useCallback(() => {
    // For Event 08 (report card) - auto-resolve with no deployment
    if (!gameState || !currentEvent) return;

    if (currentEvent.strategies.length === 0) {
      // Auto-resolve: no SV change, just mark as resolved
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
    }
  }, [gameState, currentEvent]);

  const value: GameContextValue = {
    phase,
    gameState,
    currentEvent,
    svHistory,
    proxyAdviserRating,
    agmVotes,
    startGame,
    resolveCurrentEvent,
    advanceTurn,
    setPhase,
    skipEvent,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
