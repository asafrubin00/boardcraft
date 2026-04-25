import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, OutcomeTier } from '@/types/game';

export interface NewsHeadline {
  id: string;
  text: string;
  timestamp: number;
}

const GENERIC_HEADLINES = [
  'FTSE 250 flat in morning trading',
  'Fed signals rates on hold through Q3',
  'ESG governance standards tightened by FRC',
  'Proxy adviser season begins - boards on notice',
];

let headlineCounter = 0;

function makeHeadline(text: string): NewsHeadline {
  return { id: `nh_${++headlineCounter}`, text, timestamp: Date.now() };
}

function getStartHeadlines(companyName: string): NewsHeadline[] {
  return [
    makeHeadline(`${companyName} board under review as governance concerns mount`),
    makeHeadline(`${companyName} institutional shareholders watch closely ahead of AGM`),
    ...GENERIC_HEADLINES.map((t) => makeHeadline(t)),
  ];
}

function getOutcomeHeadline(companyName: string, tier: OutcomeTier): NewsHeadline | null {
  switch (tier) {
    case 'CRITICAL_SUCCESS':
      return makeHeadline(`${companyName} board praised for decisive action - analysts upgrade`);
    case 'FAILURE':
    case 'CRITICAL_FAILURE':
      return makeHeadline(`${companyName} faces scrutiny after board misstep - proxy advisers take note`);
    default:
      return null;
  }
}

function getSvHeadline(companyName: string, sv: number): NewsHeadline | null {
  if (sv > 110) {
    return makeHeadline(`${companyName} shareholder value outperforms sector - governance premium emerges`);
  }
  if (sv < 90) {
    return makeHeadline(`${companyName} under pressure as shareholder value erodes`);
  }
  return null;
}

export function useNewsTicker(gameState: GameState | null) {
  const [headlines, setHeadlines] = useState<NewsHeadline[]>([]);
  const prevResolvedCount = useRef(0);
  const prevSvBand = useRef<'normal' | 'high' | 'low'>('normal');
  const prevApexStatus = useRef(gameState?.apexStatus ?? 'monitoring');
  const prevQuarter = useRef(gameState?.currentQuarter);
  const initialized = useRef(false);

  // Initialize headlines on first game state
  useEffect(() => {
    if (gameState && !initialized.current) {
      initialized.current = true;
      setHeadlines(getStartHeadlines(gameState.company.name));
      prevResolvedCount.current = gameState.resolvedEvents.length;
      prevSvBand.current = gameState.svIndex > 110 ? 'high' : gameState.svIndex < 90 ? 'low' : 'normal';
      prevApexStatus.current = gameState.apexStatus;
      prevQuarter.current = gameState.currentQuarter;
    }
  }, [gameState]);

  // React to game state changes
  useEffect(() => {
    if (!gameState || !initialized.current) return;

    const newHeadlines: NewsHeadline[] = [];
    const companyName = gameState.company.name;

    // New resolved events
    if (gameState.resolvedEvents.length > prevResolvedCount.current) {
      const newEvents = gameState.resolvedEvents.slice(prevResolvedCount.current);
      for (const ev of newEvents) {
        const h = getOutcomeHeadline(companyName, ev.outcomeTier);
        if (h) newHeadlines.push(h);
      }
      prevResolvedCount.current = gameState.resolvedEvents.length;
    }

    // SV band changes
    const currentBand = gameState.svIndex > 110 ? 'high' : gameState.svIndex < 90 ? 'low' : 'normal';
    if (currentBand !== prevSvBand.current) {
      const h = getSvHeadline(companyName, gameState.svIndex);
      if (h) newHeadlines.push(h);
      prevSvBand.current = currentBand;
    }

    // Apex activist stake disclosure (Vantage)
    if (
      gameState.apexStatus !== 'monitoring' &&
      prevApexStatus.current === 'monitoring'
    ) {
      newHeadlines.push(
        makeHeadline(`BREAKING: Activist fund takes stake in ${companyName} - board under pressure`)
      );
    }
    prevApexStatus.current = gameState.apexStatus;

    // AGM concluded
    if (prevQuarter.current === 'AGM' && gameState.currentQuarter !== 'AGM') {
      newHeadlines.push(
        makeHeadline(`${companyName} AGM concludes - board survives shareholder vote`)
      );
    }
    prevQuarter.current = gameState.currentQuarter;

    if (newHeadlines.length > 0) {
      setHeadlines((prev) => [...newHeadlines, ...prev].slice(0, 20));
    }
  }, [gameState]);

  const addHeadline = useCallback((text: string) => {
    setHeadlines((prev) => [makeHeadline(text), ...prev].slice(0, 20));
  }, []);

  return { headlines, addHeadline };
}
