'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Director, CompetencyDomain } from '@/types/game';
import { estimateAgmVotes, getProxyAdviserRating } from '@/engine/gameStateManager';
import { DOMAIN_SHORT } from '@/engine/boardConstants';
import { playAGMBell, playAGMApplause, playResolutionPass, playResolutionFail } from '@/engine/soundEngine';
import SiteFooter from './SiteFooter';

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

// ── Harwick / default AGM strategies ──────────────────────────────────────────

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

// ── Meridian Foundation AMM strategies ────────────────────────────────────────

const STRATEGIES_MERIDIAN = [
  {
    id: 'amm_strat_a',
    label: 'Support all resolutions',
    description:
      'Accept all three motions; signal openness to accountability and member oversight.',
  },
  {
    id: 'amm_strat_b',
    label: 'Defend current programme strategy',
    description:
      'Resist the mission alignment review; argue the board has matters in hand and a review would create unnecessary disruption.',
  },
  {
    id: 'amm_strat_c',
    label: 'Accept audit; resist mission review',
    description:
      'Split approach: concede on beneficiary accountability, hold the line on the mission alignment review.',
  },
  {
    id: 'amm_strat_d',
    label: 'Engage donors directly before the vote',
    description:
      'Attempt to negotiate the wording of the accountability motion before it goes to a vote, reducing its scope.',
  },
];

// ── Shared components ──────────────────────────────────────────────────────────

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
  const isMeridian = gameState.company.id === 'company_meridian';
  const meetingName = isMeridian ? 'Annual Members Meeting' : 'AGM';
  const meetingNameShort = isMeridian ? 'AMM' : 'AGM';

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

  // ── Harwick-specific state ─────────────────────────────────────────────────
  const craneOnBoard = gameState.board.seats.some((s) => s.directorId === 'dir_08_crane');

  // ── Strategy list ──────────────────────────────────────────────────────────
  const STRATEGIES = isMeridian
    ? STRATEGIES_MERIDIAN
    : craneOnBoard ? STRATEGIES_WITH_CRANE : STRATEGIES_WITHOUT_CRANE;

  const baseVotes = estimateAgmVotes(gameState);
  const proxyRating = getProxyAdviserRating(gameState.governanceHealth);

  // ── Harwick vote adjustments ───────────────────────────────────────────────
  const res1TenurePenalty = craneOnBoard ? -8 : 0;

  const ev06 = gameState.resolvedEvents.find((r) => r.eventId === 'event_06');
  let res2Adjustment = 0;
  if (ev06) {
    if (ev06.outcomeTier === 'FAILURE' || ev06.outcomeTier === 'CRITICAL_FAILURE') res2Adjustment = -10;
    else if (ev06.outcomeTier === 'SUCCESS' || ev06.outcomeTier === 'CRITICAL_SUCCESS') res2Adjustment = 5;
  }

  let res3Adjustment = 0;
  if (gameState.committees.energyTransition.active) res3Adjustment += 10;
  const ev05 = gameState.resolvedEvents.find((r) => r.eventId === 'event_05');
  if (ev05 && (ev05.outcomeTier === 'FAILURE' || ev05.outcomeTier === 'CRITICAL_FAILURE')) res3Adjustment -= 15;

  // ── Meridian vote adjustments ──────────────────────────────────────────────
  const mevent01 = gameState.resolvedEvents.find((r) => r.eventId === 'mevent_01');
  const mevent02 = gameState.resolvedEvents.find((r) => r.eventId === 'mevent_02');
  const mevent03 = gameState.resolvedEvents.find((r) => r.eventId === 'mevent_03');

  // Res1 (Trustee Ratification): conflict of interest scandal reduces member confidence
  let mRes1Adjustment = 0;
  if (mevent01 && (mevent01.outcomeTier === 'FAILURE' || mevent01.outcomeTier === 'CRITICAL_FAILURE')) mRes1Adjustment = -10;
  else if (mevent01 && (mevent01.outcomeTier === 'SUCCESS' || mevent01.outcomeTier === 'CRITICAL_SUCCESS')) mRes1Adjustment = 5;

  // Res2 (Beneficiary Accountability Audit): weak accountability increases donor/member pressure for audit
  let mRes2Adjustment = 0;
  if (mevent02 && (mevent02.outcomeTier === 'FAILURE' || mevent02.outcomeTier === 'CRITICAL_FAILURE')) mRes2Adjustment = 12;
  else if (mevent02 && (mevent02.outcomeTier === 'SUCCESS' || mevent02.outcomeTier === 'CRITICAL_SUCCESS')) mRes2Adjustment = -6;

  // Res3 (Mission Alignment Review): mission drift increases member pressure for independent review
  let mRes3Adjustment = 0;
  if (mevent03 && (mevent03.outcomeTier === 'FAILURE' || mevent03.outcomeTier === 'CRITICAL_FAILURE')) mRes3Adjustment = 15;
  else if (mevent03 && (mevent03.outcomeTier === 'SUCCESS' || mevent03.outcomeTier === 'CRITICAL_SUCCESS')) mRes3Adjustment = -8;

  // ── Vote bar percentages ───────────────────────────────────────────────────
  const res1For = isMeridian
    ? Math.max(5, Math.min(95, baseVotes.forPercent + mRes1Adjustment))
    : Math.max(5, Math.min(95, baseVotes.forPercent + res1TenurePenalty));
  const res1Against = 100 - res1For;

  const res2For = isMeridian
    ? Math.max(5, Math.min(95, baseVotes.forPercent + mRes2Adjustment))
    : Math.max(5, Math.min(95, baseVotes.forPercent + res2Adjustment));
  const res2Against = 100 - res2For;

  const res3For = isMeridian
    ? Math.max(5, Math.min(95, baseVotes.forPercent + mRes3Adjustment))
    : Math.max(5, Math.min(95, baseVotes.forPercent + res3Adjustment));
  const res3Against = 100 - res3For;

  // ── Directors on board for deployment ─────────────────────────────────────
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

  // ── Results view ───────────────────────────────────────────────────────────
  if (results) {
    const ghLevel = gameState.governanceHealth >= 70 ? 'strong' : gameState.governanceHealth >= 50 ? 'adequate' : 'weak';

    let res1Label: string;
    let res2Label: string;
    let res3Label: string;
    let res1Explanation: string;
    let res2Explanation: string;
    let res3Explanation: string;

    if (isMeridian) {
      // ── Meridian result labels ─────────────────────────────────────────────
      res1Label = 'Resolution 1: Trustee Appointment Ratification';
      res2Label = 'Resolution 2: Beneficiary Accountability Audit';
      res3Label = 'Resolution 3: Mission Alignment Review';

      // Res1 explanations
      if (results.resolution1Pass) {
        res1Explanation = mevent01 && (mevent01.outcomeTier === 'FAILURE' || mevent01.outcomeTier === 'CRITICAL_FAILURE')
          ? `Passed — members ratified the trustee appointments despite the earlier conflict of interest concerns.`
          : `Passed — ${ghLevel} governance health gave members confidence in the trustee appointments.`;
      } else {
        res1Explanation = mevent01 && (mevent01.outcomeTier === 'FAILURE' || mevent01.outcomeTier === 'CRITICAL_FAILURE')
          ? `Failed — the unresolved conflict of interest eroded member confidence in the trustee appointments.`
          : `Failed — ${ghLevel} governance health undermined member confidence in the current trustee slate.`;
      }

      // Res2 explanations
      if (results.resolution2Pass) {
        res2Explanation = mevent02 && (mevent02.outcomeTier === 'FAILURE' || mevent02.outcomeTier === 'CRITICAL_FAILURE')
          ? `Passed — prior accountability failings gave donors and members strong grounds for an independent audit.`
          : `Passed — the motion carried; an independent beneficiary outcomes audit will proceed.`;
      } else {
        res2Explanation = mevent02 && (mevent02.outcomeTier === 'SUCCESS' || mevent02.outcomeTier === 'CRITICAL_SUCCESS')
          ? `Failed — the board's accountability track record persuaded members the motion was unnecessary.`
          : `Failed — the audit motion did not secure sufficient member support to pass.`;
      }

      // Res3 explanations
      if (results.resolution3Pass) {
        res3Explanation = mevent03 && (mevent03.outcomeTier === 'FAILURE' || mevent03.outcomeTier === 'CRITICAL_FAILURE')
          ? `Passed — programme drift made a compelling case; members voted for an independent mission alignment review.`
          : `Passed — members backed the proposal for an independent review of charitable objects alignment.`;
      } else {
        res3Explanation = mevent03 && (mevent03.outcomeTier === 'SUCCESS' || mevent03.outcomeTier === 'CRITICAL_SUCCESS')
          ? `Failed — the board's demonstrated mission discipline persuaded members a formal review was unnecessary.`
          : `Failed — ${ghLevel} governance health and insufficient member support meant the review motion fell.`;
      }

    } else {
      // ── Default (Harwick) result labels ───────────────────────────────────
      res1Label = 'Resolution 1: Director Re-Elections';
      res2Label = 'Resolution 2: Say-on-Pay (Advisory)';
      res3Label = 'Resolution 3: ESG Disclosure';

      if (results.resolution1Pass) {
        res1Explanation = craneOnBoard
          ? `Passed - ${ghLevel} governance health offset Crane's 12-year tenure concerns.`
          : `Passed - ${ghLevel} governance health and no tenure flags on the board.`;
      } else {
        res1Explanation = craneOnBoard
          ? `Failed - Geoffrey Crane's 12-year tenure flagged by Meridian Governance, compounded by ${ghLevel} governance health.`
          : `Failed - ${ghLevel} governance health undermined institutional confidence in the board slate.`;
      }

      if (results.resolution2Pass) {
        res2Explanation = ev06
          ? (ev06.outcomeTier === 'SUCCESS' || ev06.outcomeTier === 'CRITICAL_SUCCESS')
            ? `Passed - prior remuneration review strengthened the case for Blaine's package.`
            : `Passed - ${ghLevel} governance health and proxy adviser recommendation carried the vote.`
          : `Passed - ${ghLevel} governance health and proxy adviser recommendation carried the vote.`;
      } else {
        res2Explanation = ev06 && (ev06.outcomeTier === 'FAILURE' || ev06.outcomeTier === 'CRITICAL_FAILURE')
          ? `Failed - earlier remuneration controversy eroded shareholder support for Blaine's £4.1m package.`
          : `Failed - ${ghLevel} governance health left shareholders unconvinced on executive pay.`;
      }

      const etActive = gameState.committees.energyTransition?.active;
      const ev05Failed = ev05 && (ev05.outcomeTier === 'FAILURE' || ev05.outcomeTier === 'CRITICAL_FAILURE');
      if (results.resolution3Pass) {
        res3Explanation = etActive
          ? `Passed - the Energy Transition Committee demonstrated credible ESG governance.`
          : `Passed - ${ghLevel} governance health and proxy adviser support swung the vote.`;
      } else {
        if (ev05Failed && !etActive) {
          res3Explanation = `Failed - prior ESG incident and absence of an Energy Transition Committee undermined credibility.`;
        } else if (ev05Failed) {
          res3Explanation = `Failed - prior ESG incident damaged the board's environmental credentials despite the ET Committee.`;
        } else if (!etActive) {
          res3Explanation = `Failed - no Energy Transition Committee left shareholders sceptical of ESG commitment.`;
        } else {
          res3Explanation = `Failed - ${ghLevel} governance health eroded shareholder confidence on ESG disclosure.`;
        }
      }
    }

    const resolutions = [
      { label: res1Label, pass: results.resolution1Pass, explanation: res1Explanation },
      { label: res2Label, pass: results.resolution2Pass, explanation: res2Explanation },
      { label: res3Label, pass: results.resolution3Pass, explanation: res3Explanation },
    ];

    return (
      <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-4 py-12">
        {onChangeCompany && (
          <button
            onClick={onChangeCompany}
            className="absolute top-6 left-6 text-xs text-foreground/50 hover:text-foreground/70 transition-colors cursor-pointer"
          >
            &larr; Change Company
          </button>
        )}
        <div className="w-full max-w-xl mb-6 relative rounded-lg overflow-hidden" style={{ height: 200 }}>
          <img
            src="/images/agm-hero.jpg"
            alt={meetingName}
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
          {meetingName} Results — {gameState.company.name}
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
                    <span className={`text-lg font-bold ${res.pass ? 'text-success' : 'text-error'}`}>
                      {res.pass ? 'PASSED ✓' : 'FAILED ✗'}
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
      <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
    </div>
    );
  }

  // ── Pre-resolution view ────────────────────────────────────────────────────
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
          {meetingName} — {gameState.company.name}
        </motion.h1>

        <motion.p
          className="font-narrative italic text-foreground/70 text-center max-w-3xl mx-auto mb-8 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isMeridian
            ? `The Annual Members Meeting has arrived. Meridian Foundation operates a supporter membership structure — registered members hold voting rights on constitutional matters. Three resolutions are contested. The Charity Governance Code assessor's view and your governance health score will influence how members vote.`
            : `The AGM has arrived. Three resolutions are contested. Institutional shareholder voting will be influenced by Meridian Governance's recommendations and your governance health score.`}
        </motion.p>

        {/* Rating badge */}
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wide text-foreground/50">
            {isMeridian ? 'Charity Governance Code Assessor:' : 'Proxy Adviser Rating:'}
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
          {isMeridian ? (
            <>
              {/* Meridian Resolution 1 */}
              <motion.div
                className="bg-card-bg border border-card-border rounded-lg p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
                  Resolution 1: Trustee Appointment Ratification
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-3">
                  Members vote to ratify the trustee appointments made during the year. Standard constitutional requirement for a CIO with a supporter membership structure.
                </p>
                <VoteBar forPercent={res1For} againstPercent={res1Against} />
              </motion.div>

              {/* Meridian Resolution 2 */}
              <motion.div
                className="bg-card-bg border border-card-border rounded-lg p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
                  Resolution 2: Beneficiary Accountability Audit
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-3">
                  A coalition of major donors has tabled a motion requesting an independent audit of beneficiary outcomes and programme impact methodology.
                </p>
                <VoteBar forPercent={res2For} againstPercent={res2Against} />
              </motion.div>

              {/* Meridian Resolution 3 */}
              <motion.div
                className="bg-card-bg border border-card-border rounded-lg p-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
                  Resolution 3: Mission Alignment Review
                </h3>
                <p className="text-foreground/70 text-sm leading-relaxed mb-3">
                  Members propose a formal independent review of whether Meridian&apos;s current programme portfolio remains consistent with its charitable objects.
                </p>
                <VoteBar forPercent={res3For} againstPercent={res3Against} />
              </motion.div>
            </>
          ) : (
            <>
              {/* Default Resolution 1 */}
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
                    ? "All NEDs stand for annual re-election. Geoffrey Crane’s 12-year tenure will be scrutinised."
                    : "All NEDs stand for annual re-election. No significant tenure concerns on the current board."}
                </p>
                <VoteBar forPercent={res1For} againstPercent={res1Against} />
              </motion.div>

              {/* Default Resolution 2 */}
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

              {/* Default Resolution 3 */}
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
            </>
          )}
        </div>

        {/* Strategy Selection */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-lg font-narrative font-bold text-gold mb-4">
            Select Your {meetingNameShort} Strategy
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

        {/* Director / Trustee Deployment */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className="text-lg font-narrative font-bold text-gold mb-2">
            Deploy {isMeridian ? 'Trustees' : 'Directors'} to the {isMeridian ? 'Annual Members Meeting' : meetingNameShort}
          </h2>
          <p className="text-foreground/50 text-sm mb-4">
            {isMeridian
              ? `Select up to 3 trustees to represent the board at the Annual Members Meeting.`
              : `Select up to 3 directors to represent the board at the ${meetingNameShort}.`}
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
            Confirm {meetingNameShort} Strategy
          </button>
        </motion.div>
      </div>
      <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
    </div>
  );
}
