'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Director, CompetencyDomain } from '@/types/game';
import { estimateAgmVotes, getProxyAdviserRating } from '@/engine/gameStateManager';
import { DOMAIN_SHORT } from '@/engine/boardConstants';
import { playAGMBell, playAGMApplause, playResolutionPass, playResolutionFail } from '@/engine/soundEngine';

const ALL_DOMAINS: CompetencyDomain[] = [
  'financialOversight', 'regulatoryLegal', 'strategyMarkets', 'peopleCulture',
  'esgSustainability', 'geopoliticalMacro', 'technologyDigital', 'stakeholderComms',
];

interface AgmResults {
  resolution1Pass: boolean;
  resolution2Pass: boolean;
  resolution3Pass: boolean;
  narrative: string;
}

interface AgmScreenProps {
  gameState: GameState;
  onResolveAgm: (strategyChoice: string, deployedDirectorIds: string[]) => void;
  onContinue: () => void;
  results?: AgmResults;
  onChangeCompany?: () => void;
}

const STRATEGIES_WITH_CRANE = [
  {
    id: 'event_09_a',
    label: "Defend Crane's re-election and engage institutions",
    description:
      'Stand behind the incumbent chair and rally institutional support through targeted engagement.',
  },
  {
    id: 'event_09_b',
    label: 'Let Crane stand down gracefully; focus on other resolutions',
    description:
      'Accept the governance concern around tenure and redirect board energy to the remaining votes.',
  },
  {
    id: 'event_09_c',
    label: 'Negotiate with Greenvale on their shareholder resolution',
    description:
      'Open a dialogue with the activist coalition to find middle ground on ESG disclosure.',
  },
  {
    id: 'event_09_d',
    label: 'Accept all shareholder resolutions to avoid conflict',
    description:
      'Take a conciliatory approach and accept all resolutions to preserve institutional goodwill.',
  },
];

const STRATEGIES_WITHOUT_CRANE = [
  {
    id: 'event_09_a',
    label: 'Defend all director re-elections and engage institutions',
    description:
      'Rally institutional support for the full slate of NEDs through targeted engagement.',
  },
  {
    id: 'event_09_b',
    label: 'Focus board energy on Say-on-Pay and ESG resolutions',
    description:
      'With no tenure concerns on the board, redirect engagement effort to the contested advisory votes.',
  },
  {
    id: 'event_09_c',
    label: 'Negotiate with Greenvale on their shareholder resolution',
    description:
      'Open a dialogue with the activist coalition to find middle ground on ESG disclosure.',
  },
  {
    id: 'event_09_d',
    label: 'Accept all shareholder resolutions to avoid conflict',
    description:
      'Take a conciliatory approach and accept all resolutions to preserve institutional goodwill.',
  },
];

function VoteBar({ forPercent, againstPercent }: { forPercent: number; againstPercent: number }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-foreground/70 mb-1">
        <span>For: {forPercent}%</span>
        <span>Against: {againstPercent}%</span>
      </div>
      <div className="w-full h-4 rounded-full overflow-hidden flex bg-navy-dark">
        <motion.div
          className="h-full bg-success"
          initial={{ width: 0 }}
          animate={{ width: `${forPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.div
          className="h-full bg-error"
          initial={{ width: 0 }}
          animate={{ width: `${againstPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  );
}

export default function AgmScreen({
  gameState,
  onResolveAgm,
  onContinue,
  results,
  onChangeCompany,
}: AgmScreenProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [deployedIds, setDeployedIds] = useState<string[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);

  // Play AGM bell + applause on mount
  useEffect(() => {
    playAGMBell();
    playAGMApplause();
  }, []);

  // Sequential reveal of results with resolution sounds
  useEffect(() => {
    if (!results) {
      setRevealedCount(0);
      return;
    }
    setRevealedCount(0);
    const resOutcomes = [results.resolution1Pass, results.resolution2Pass, results.resolution3Pass];
    const timers: NodeJS.Timeout[] = [];
    for (let i = 1; i <= 4; i++) {
      timers.push(setTimeout(() => {
        setRevealedCount(i);
        // Play resolution pass/fail sound for resolutions 1-3
        if (i <= 3) {
          if (resOutcomes[i - 1]) {
            playResolutionPass();
          } else {
            playResolutionFail();
          }
        }
      }, i * 1000));
    }
    return () => timers.forEach(clearTimeout);
  }, [results]);

  // Check if Geoffrey Crane is still on the board
  const craneOnBoard = gameState.board.seats.some(
    (s) => s.directorId === 'dir_08_crane'
  );
  const STRATEGIES = craneOnBoard ? STRATEGIES_WITH_CRANE : STRATEGIES_WITHOUT_CRANE;

  const baseVotes = estimateAgmVotes(gameState);
  const proxyRating = getProxyAdviserRating(gameState.governanceHealth);

  // Resolution 1 gets a penalty if Crane's long tenure is still on the board
  const res1TenurePenalty = craneOnBoard ? -8 : 0;

  // Resolution 2 adjustments (Say-on-Pay — Event 06)
  const ev06 = gameState.resolvedEvents.find((r) => r.eventId === 'event_06');
  let res2Adjustment = 0;
  if (ev06) {
    if (ev06.outcomeTier === 'FAILURE' || ev06.outcomeTier === 'CRITICAL_FAILURE') {
      res2Adjustment = -10;
    } else if (ev06.outcomeTier === 'SUCCESS' || ev06.outcomeTier === 'CRITICAL_SUCCESS') {
      res2Adjustment = 5;
    }
  }

  // Resolution 3 adjustments (ESG — energyTransition committee + Event 05)
  let res3Adjustment = 0;
  if (gameState.committees.energyTransition.active) {
    res3Adjustment += 10;
  }
  const ev05 = gameState.resolvedEvents.find((r) => r.eventId === 'event_05');
  if (ev05 && (ev05.outcomeTier === 'FAILURE' || ev05.outcomeTier === 'CRITICAL_FAILURE')) {
    res3Adjustment -= 15;
  }

  const res1For = Math.max(5, Math.min(95, baseVotes.forPercent + res1TenurePenalty));
  const res1Against = 100 - res1For;

  const res2For = Math.max(5, Math.min(95, baseVotes.forPercent + res2Adjustment));
  const res2Against = 100 - res2For;

  const res3For = Math.max(5, Math.min(95, baseVotes.forPercent + res3Adjustment));
  const res3Against = 100 - res3For;

  // Directors on the board for deployment selection
  const boardDirectors: Director[] = gameState.board.seats
    .map((s) => gameState.directors.find((d) => d.id === s.directorId))
    .filter((d): d is Director => d !== undefined);

  const toggleDirector = (id: string) => {
    setDeployedIds((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const canSubmit = selectedStrategy !== null && deployedIds.length > 0;

  // ----------- Results view -----------
  if (results) {
    // Generate one-sentence explanations from actual game state factors
    const ghLevel = gameState.governanceHealth >= 70 ? 'strong' : gameState.governanceHealth >= 50 ? 'adequate' : 'weak';

    let res1Explanation: string;
    if (results.resolution1Pass) {
      res1Explanation = craneOnBoard
        ? `Passed — ${ghLevel} governance health offset Crane's 12-year tenure concerns.`
        : `Passed — ${ghLevel} governance health and no tenure flags on the board.`;
    } else {
      res1Explanation = craneOnBoard
        ? `Failed — Geoffrey Crane's 12-year tenure flagged by Meridian Governance, compounded by ${ghLevel} governance health.`
        : `Failed — ${ghLevel} governance health undermined institutional confidence in the board slate.`;
    }

    let res2Explanation: string;
    if (results.resolution2Pass) {
      res2Explanation = ev06
        ? (ev06.outcomeTier === 'SUCCESS' || ev06.outcomeTier === 'CRITICAL_SUCCESS')
          ? `Passed — prior remuneration review strengthened the case for Blaine's package.`
          : `Passed — ${ghLevel} governance health and proxy adviser recommendation carried the vote.`
        : `Passed — ${ghLevel} governance health and proxy adviser recommendation carried the vote.`;
    } else {
      res2Explanation = ev06 && (ev06.outcomeTier === 'FAILURE' || ev06.outcomeTier === 'CRITICAL_FAILURE')
        ? `Failed — earlier remuneration controversy eroded shareholder support for Blaine's £4.1m package.`
        : `Failed — ${ghLevel} governance health left shareholders unconvinced on executive pay.`;
    }

    let res3Explanation: string;
    const etActive = gameState.committees.energyTransition?.active;
    const ev05Failed = ev05 && (ev05.outcomeTier === 'FAILURE' || ev05.outcomeTier === 'CRITICAL_FAILURE');
    if (results.resolution3Pass) {
      res3Explanation = etActive
        ? `Passed — the Energy Transition Committee demonstrated credible ESG governance.`
        : `Passed — ${ghLevel} governance health and proxy adviser support swung the vote.`;
    } else {
      if (ev05Failed && !etActive) {
        res3Explanation = `Failed — prior ESG incident and absence of an Energy Transition Committee undermined credibility.`;
      } else if (ev05Failed) {
        res3Explanation = `Failed — prior ESG incident damaged the board's environmental credentials despite the ET Committee.`;
      } else if (!etActive) {
        res3Explanation = `Failed — no Energy Transition Committee left shareholders sceptical of ESG commitment.`;
      } else {
        res3Explanation = `Failed — ${ghLevel} governance health eroded shareholder confidence on ESG disclosure.`;
      }
    }

    const resolutions = [
      { label: 'Resolution 1: Director Re-Elections', pass: results.resolution1Pass, explanation: res1Explanation },
      { label: 'Resolution 2: Say-on-Pay (Advisory)', pass: results.resolution2Pass, explanation: res2Explanation },
      { label: 'Resolution 3: ESG Disclosure', pass: results.resolution3Pass, explanation: res3Explanation },
    ];

    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
        {/* Change Company — subtle top-left */}
        {onChangeCompany && (
          <button
            onClick={onChangeCompany}
            className="absolute top-6 left-6 text-xs text-foreground/50 hover:text-foreground/70 transition-colors cursor-pointer"
          >
            &larr; Change Company
          </button>
        )}
        {/* AGM Header Image */}
        <div className="w-full max-w-xl mb-6 relative rounded-lg overflow-hidden" style={{ height: 200 }}>
          <img
            src="/images/agm-hero.jpg"
            alt="Annual General Meeting"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,27,42,0.3) 0%, rgba(13,27,42,0.7) 100%)' }} />
        </div>
        <motion.h1
          className="text-3xl md:text-4xl font-narrative font-bold text-gold text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          AGM Results — {gameState.company.name}
        </motion.h1>

        <div className="flex flex-col gap-4 w-full max-w-xl mt-8">
          {resolutions.map((res, idx) => (
            <AnimatePresence key={idx}>
              {revealedCount > idx && (
                <motion.div
                  className="bg-card-bg border border-card-border rounded-lg p-5"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-medium">{res.label}</span>
                    <span
                      className={`text-lg font-bold ${
                        res.pass ? 'text-success' : 'text-error'
                      }`}
                    >
                      {res.pass ? 'PASSED \u2713' : 'FAILED \u2717'}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 font-narrative italic ${res.pass ? 'text-success/70' : 'text-error/70'}`}>
                    {res.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {revealedCount >= 4 && (
            <motion.div
              className="mt-8 max-w-xl w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-narrative italic text-foreground/80 text-center leading-relaxed mb-8">
                {results.narrative}
              </p>
              <div className="flex justify-center">
                <button
                  onClick={onContinue}
                  className="px-8 py-3 rounded-lg bg-gold text-navy-dark font-bold text-lg hover:bg-gold-light transition-colors cursor-pointer"
                >
                  Continue to Q3
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ----------- Pre-resolution view -----------
  return (
    <div className="min-h-screen bg-navy px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.h1
          className="text-3xl md:text-4xl font-narrative font-bold text-gold text-center mb-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Annual General Meeting — {gameState.company.name}
        </motion.h1>

        <motion.p
          className="font-narrative italic text-foreground/70 text-center max-w-3xl mx-auto mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          The AGM has arrived. Three resolutions are contested. Institutional shareholder voting will
          be influenced by Meridian Governance&apos;s recommendations and your governance health
          score.
        </motion.p>

        {/* Proxy Adviser Rating badge */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wide text-foreground/50">
            Proxy Adviser Rating:
          </span>{' '}
          <span
            className={`font-bold ${
              gameState.governanceHealth >= 85
                ? 'text-success'
                : gameState.governanceHealth >= 55
                  ? 'text-warning'
                  : 'text-error'
            }`}
          >
            {proxyRating}
          </span>
        </div>

        {/* Three resolution panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Resolution 1 */}
          <motion.div
            className="bg-card-bg border border-card-border rounded-lg p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
              Resolution 1: Director Re-Elections
            </h3>
            <p className="text-foreground/70 text-sm leading-relaxed mb-3">
              {craneOnBoard
                ? "All NEDs stand for annual re-election. Geoffrey Crane\u2019s 12-year tenure will be scrutinised."
                : "All NEDs stand for annual re-election. No significant tenure concerns on the current board."}
            </p>
            <VoteBar forPercent={res1For} againstPercent={res1Against} />
          </motion.div>

          {/* Resolution 2 */}
          <motion.div
            className="bg-card-bg border border-card-border rounded-lg p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
              Resolution 2: Say-on-Pay (Advisory)
            </h3>
            <p className="text-foreground/70 text-sm leading-relaxed mb-3">
              Marcus Blaine&apos;s &pound;4.1m package will face a shareholder advisory vote.
            </p>
            <VoteBar forPercent={res2For} againstPercent={res2Against} />
          </motion.div>

          {/* Resolution 3 */}
          <motion.div
            className="bg-card-bg border border-card-border rounded-lg p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
              Resolution 3: Shareholder Resolution on ESG Disclosure
            </h3>
            <p className="text-foreground/70 text-sm leading-relaxed mb-3">
              A coalition of institutional shareholders has tabled a binding resolution on net-zero
              disclosure.
            </p>
            <VoteBar forPercent={res3For} againstPercent={res3Against} />
          </motion.div>
        </div>

        {/* Strategy Selection */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-lg font-narrative font-bold text-gold mb-4">
            Select Your AGM Strategy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {STRATEGIES.map((strat) => (
              <motion.button
                key={strat.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`text-left rounded-lg border p-4 transition-colors cursor-pointer ${
                  selectedStrategy === strat.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-card-bg border-card-border text-foreground hover:border-gold/50'
                }`}
              >
                <h4 className="font-bold text-sm mb-1">{strat.label}</h4>
                <p className="text-xs text-foreground/60">{strat.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Director Deployment */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className="text-lg font-narrative font-bold text-gold mb-2">
            Deploy Directors to the AGM
          </h2>
          <p className="text-foreground/50 text-sm mb-4">
            Select up to 3 directors to represent the board at the AGM.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {boardDirectors.map((dir) => {
              const isSelected = deployedIds.includes(dir.id);
              const isExhausted = dir.currentEnergy === 0;
              const isMaxed = deployedIds.length >= 3 && !isSelected;
              const isDisabled = isExhausted || isMaxed;
              return (
                <motion.button
                  key={dir.id}
                  whileHover={isDisabled ? {} : { scale: 1.02 }}
                  whileTap={isDisabled ? {} : { scale: 0.97 }}
                  onClick={() => !isDisabled && toggleDirector(dir.id)}
                  disabled={isDisabled}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? 'bg-gold/20 border-gold shadow-[0_0_10px_rgba(200,150,12,0.2)]'
                      : isExhausted
                        ? 'border-error/50 bg-navy-dark opacity-60 cursor-not-allowed'
                        : isMaxed
                          ? 'border-card-border bg-navy-dark opacity-50 cursor-not-allowed'
                          : 'bg-card-bg border-card-border hover:border-gold/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground truncate">
                      {dir.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-gold font-bold shrink-0 ml-2">SELECTED</span>
                    )}
                    {isExhausted && (
                      <span className="text-[10px] text-error font-bold shrink-0 ml-2">EXHAUSTED</span>
                    )}
                  </div>
                  {/* Energy bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[11px] text-foreground/50 mb-0.5">
                      <span>Stamina</span>
                      <span>{dir.currentEnergy}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-navy-dark rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dir.currentEnergy >= 60 ? 'bg-success' : dir.currentEnergy >= 20 ? 'bg-warning' : 'bg-error'
                        }`}
                        style={{ width: `${dir.currentEnergy}%` }}
                      />
                    </div>
                  </div>
                  {/* All 8 domain scores */}
                  <div className="space-y-0.5">
                    {ALL_DOMAINS.map((domain) => {
                      const rating = dir.domainRatings[domain];
                      return (
                        <div key={domain} className="flex items-center gap-1 text-[11px]">
                          <span className="w-16 text-foreground/50 truncate">{DOMAIN_SHORT[domain]}</span>
                          <div className="flex-1 h-1 bg-navy-dark rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rating >= 70 ? 'bg-gold' : rating >= 50 ? 'bg-foreground/40' : 'bg-foreground/20'}`}
                              style={{ width: `${rating}%` }}
                            />
                          </div>
                          <span className={`w-5 text-right font-medium ${rating >= 70 ? 'text-gold' : 'text-foreground/50'}`}>{rating}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Confirm Button */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <button
            onClick={() => {
              if (canSubmit && selectedStrategy) {
                onResolveAgm(selectedStrategy, deployedIds);
              }
            }}
            disabled={!canSubmit}
            className={`px-10 py-3 rounded-lg font-bold text-lg transition-colors ${
              canSubmit
                ? 'bg-gold text-navy-dark hover:bg-gold-light cursor-pointer'
                : 'bg-foreground/20 text-foreground/40 cursor-not-allowed'
            }`}
          >
            Confirm AGM Strategy
          </button>
        </motion.div>
      </div>
    </div>
  );
}
