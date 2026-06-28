'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Director, CompetencyDomain, GovernanceHealthBreakdown } from '@/types/game';
import { estimateAgmVotes, getProxyAdviserRating } from '@/engine/gameStateManager';
import { generateAgmResolutionDebrief } from '@/engine/agmNarrative';
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

// ── Vantage Consumer Brands AGM strategies (mirror vevent_09 data) ───────────

const STRATEGIES_VANTAGE = [
  {
    id: 'vevent_09_a',
    label: 'Full institutional engagement roadshow',
    description:
      'Full institutional shareholder engagement before the AGM. Highest effort, highest reward.',
  },
  {
    id: 'vevent_09_b',
    label: 'Standard AGM preparation; strong opening statement',
    description:
      'Prepare a governance narrative with supporting data. Solid base approach.',
  },
  {
    id: 'vevent_09_c',
    label: 'Concede on Chair/CEO split to secure other votes',
    description:
      'Support Resolution 3 (Chair/CEO separation) to build goodwill for other contested items.',
  },
  {
    id: 'vevent_09_d',
    label: 'Do nothing',
    description:
      'No preparation. AGM results depend entirely on governance health and prior event outcomes.',
  },
];

// ── Rheinfeld AG Hauptversammlung strategies (mirror revent_09 data) ─────────

const STRATEGIES_RHEINFELD = [
  {
    id: 'revent_09_a',
    label: 'Support reform — back independent review and succession',
    description:
      "Support Meridian's proposals for independent strategic review and Heinrich succession planning. Bold reform stance.",
  },
  {
    id: 'revent_09_b',
    label: 'Negotiate — partial concession on review, defend Heinrich',
    description:
      'Support the strategic review but oppose the no-confidence motion against Heinrich. Compromise position.',
  },
  {
    id: 'revent_09_c',
    label: 'Defend the status quo — oppose all Meridian proposals',
    description:
      "Back Heinrich's position completely. Only viable if governance reforms have been implemented independently.",
  },
  {
    id: 'revent_09_d',
    label: 'Do nothing',
    description:
      'Abstain from positioning. The votes proceed without board guidance.',
  },
];

// ── Straits Financial Group AGM strategies ────────────────────────────────────

const STRATEGIES_SFG = [
  {
    id: 'sfgevent_13_a',
    label: 'Disclose board renewal roadmap; seek Glass Lewis Asia support',
    description:
      'Publish a formal multi-year board renewal schedule addressing SGX tenure independence rules. Glass Lewis Asia upgrades to "for" recommendation — critical for Tier 2 minority vote.',
  },
  {
    id: 'sfgevent_13_b',
    label: 'Engage Temasek directly; rely on Tier 1 majority',
    description:
      'Hold private dialogue with Temasek to secure their 34% for Tier 1. Without Glass Lewis Asia support, Tier 2 minority vote is exposed.',
  },
  {
    id: 'sfgevent_13_c',
    label: 'Let contested directors stand down before AGM',
    description:
      'Voluntarily remove directors with >9yr tenure from the re-election slate. Avoids the two-tier vote risk entirely but accelerates board composition change.',
  },
  {
    id: 'sfgevent_13_d',
    label: 'Do nothing — contest the independence interpretation',
    description:
      'Argue the independence assessment is a matter for the NC, not shareholder vote. High risk: Glass Lewis Asia "against" recommendation. Likely Tier 2 failure.',
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

function TwoTierVoteDisplay({
  tier1For, tier1Against,
  tier2For, tier2Against,
  tier1Pass, tier2Pass,
}: {
  tier1For: number; tier1Against: number;
  tier2For: number; tier2Against: number;
  tier1Pass: boolean; tier2Pass: boolean;
}) {
  const bothPass = tier1Pass && tier2Pass;
  return (
    <div className="mt-3 space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-foreground/60 uppercase tracking-wide">Tier 1 — All Shareholders</span>
          <span className={`text-[11px] font-bold ${tier1Pass ? 'text-success' : 'text-error'}`}>
            {tier1Pass ? 'PASSED' : 'FAILED'}
          </span>
        </div>
        <VoteBar forPercent={tier1For} againstPercent={tier1Against} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-foreground/60 uppercase tracking-wide">Tier 2 — Minority Shareholders</span>
          <span className={`text-[11px] font-bold ${tier2Pass ? 'text-success' : 'text-error'}`}>
            {tier2Pass ? 'PASSED' : 'FAILED'}
          </span>
        </div>
        <p className="text-[10px] text-foreground/40 mb-1">Temasek (34%) excluded from denominator</p>
        <VoteBar forPercent={tier2For} againstPercent={tier2Against} />
      </div>
      <div className={`rounded px-3 py-1.5 text-[11px] font-semibold text-center ${
        bothPass ? 'bg-success/15 text-success border border-success/30' : 'bg-error/15 text-error border border-error/30'
      }`}>
        {bothPass ? 'Resolution passes — both tiers approved' : 'Resolution fails — both tiers must pass under SGX two-tier rules'}
      </div>
    </div>
  );
}

function AgmDebriefModal({ narrative, label, onClose }: { narrative: string; label: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-[#070f1a]/97"
    >
      <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-card-border">
        <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">The Debrief</p>
        <p className="text-gold-dim text-sm">{label}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="font-narrative italic text-foreground/80 text-base leading-relaxed">{narrative}</p>
      </div>
      <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-card-border">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl bg-gold/10 border border-gold/40 hover:bg-gold/20 transition-colors text-gold font-semibold text-base cursor-pointer"
        >
          Continue →
        </button>
      </div>
    </motion.div>
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
  const isVantage = gameState.company.id === 'company_vantage';
  const isRheinfeld = gameState.company.id === 'company_rheinfeld';
  const isSfg = gameState.company.id === 'company_sfg';
  const meetingName = isMeridian ? 'Annual Members Meeting' : isRheinfeld ? 'Hauptversammlung' : 'AGM';
  const meetingNameShort = isMeridian ? 'AMM' : isRheinfeld ? 'HV' : 'AGM';

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
    : isVantage
      ? STRATEGIES_VANTAGE
      : isRheinfeld
        ? STRATEGIES_RHEINFELD
        : isSfg
          ? STRATEGIES_SFG
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

  // ── Vantage vote adjustments ───────────────────────────────────────────────
  // Res1 (Director elections): Apex Capital's withhold campaign pressure
  const vRes1Adjustment = !gameState.apexActive
    ? 6
    : gameState.apexStatus === 'hostile' ? -15
    : gameState.apexStatus === 'escalating' ? -8
    : -3;
  // Res2 (Say-on-Pay): ISS red flag on the $14.2m package; a chaired Comp Committee mitigates
  const vRes2Adjustment = (gameState.committees.remuneration.chairDirectorId ? 6 : -4) - 8;
  // Res3 (Independent Chair proposal): board-endorsed separation momentum lifts support
  const vRes3Adjustment = gameState.chairCeoSeparationProgress >= 50
    ? 12
    : gameState.chairCeoSeparationProgress > 0 ? 5 : -4;

  // ── Rheinfeld vote adjustments ─────────────────────────────────────────────
  // Res1 (Entlastung/discharge): conflict revelations and activist hostility erode ratification
  const rRes1Adjustment =
    (gameState.heinrichConflictRevealed ? -15 : 0) +
    (gameState.meridianStatus === 'hostile' ? -8 : 0) +
    (gameState.workerRepRelations === 'cooperative' ? 5 : gameState.workerRepRelations === 'hostile' ? -5 : 0);
  // Res2 (Remuneration system, ARUG II): a chaired Rem Committee carries the advisory vote
  const rRes2Adjustment = gameState.committees.remuneration.chairDirectorId ? 6 : -6;
  // Res3 (Meridian's strategic review proposal): activist pressure builds support for it
  const rRes3Adjustment = gameState.meridianStatus === 'hostile'
    ? 15
    : gameState.meridianStatus === 'escalating' ? 10 : 4;

  // ── SFG two-tier vote calculations ────────────────────────────────────────
  // Directors with >9yr tenure on the SFG board must stand for re-election
  // under the SGX two-tier vote rule (Tier 1 = all; Tier 2 = minority only)
  const sfgLongTenureDirectors = isSfg
    ? gameState.board.seats
        .map((s) => gameState.directors.find((d) => d.id === s.directorId))
        .filter((d): d is Director => d !== undefined && (d.tenure ?? 0) > 9)
    : [];
  const sfgHasTwoTierVote = sfgLongTenureDirectors.length > 0;

  // Glass Lewis Asia recommends "against" by default unless a renewal roadmap was disclosed
  // sfgevent_13_a strategy = renewal roadmap disclosed → GL upgrades to "for"
  const sfgRenewalRoadmapDisclosed = gameState.resolvedEvents.some(
    (r) => r.eventId === 'sfgevent_13' && r.strategyChosen === 'sfgevent_13_a'
  );
  const sfgGlassLewisFor = sfgRenewalRoadmapDisclosed;

  // Tenure penalty: each director >9yr on the re-election slate costs votes
  const sfgTenurePenalty = sfgLongTenureDirectors.length * -6;

  // Tier 1: all shareholders including Temasek's 34%
  // Base votes, adjusted by tenure penalty and strategy
  const sfgRes1Tier1For = Math.max(5, Math.min(95, baseVotes.forPercent + sfgTenurePenalty));
  const sfgRes1Tier1Against = 100 - sfgRes1Tier1For;
  const sfgTier1Pass = sfgRes1Tier1For > 50;

  // Tier 2: minority shareholders only — Temasek (34%) excluded from denominator
  // Temasek's 34% stake voted "for" (they support management slate) is removed,
  // so the remaining vote split shifts. Minority votes are ~66% of total.
  // If GL Asia recommends "against", minority institutional weight swings against.
  const sfgGlPenalty = sfgGlassLewisFor ? 0 : -18;
  const sfgRes1Tier2For = Math.max(5, Math.min(95, baseVotes.forPercent + sfgTenurePenalty + sfgGlPenalty - 10));
  const sfgRes1Tier2Against = 100 - sfgRes1Tier2For;
  const sfgTier2Pass = sfgRes1Tier2For > 50;
  const sfgRes1Pass = sfgTier1Pass && sfgTier2Pass;

  // SFG Res2: MAS/SGX compliance — AC vacancy resolved; penalised if acChairVacant still open
  const sfgRes2Adj = gameState.acChairVacant ? -15 : 8;
  // SFG Res3: Executive remuneration — ceoWhistleblower outcome affects vote
  const sfgRes3Adj = gameState.ceoWhistleblower === 'substantiated' ? -12
    : gameState.ceoWhistleblower === 'cleared' ? 4 : 0;

  const sfgRes2For = Math.max(5, Math.min(95, baseVotes.forPercent + sfgRes2Adj));
  const sfgRes2Against = 100 - sfgRes2For;
  const sfgRes3For = Math.max(5, Math.min(95, baseVotes.forPercent + sfgRes3Adj));
  const sfgRes3Against = 100 - sfgRes3For;

  // ── Vote bar percentages ───────────────────────────────────────────────────
  const res1Adj = isMeridian ? mRes1Adjustment : isVantage ? vRes1Adjustment : isRheinfeld ? rRes1Adjustment : res1TenurePenalty;
  const res2Adj = isMeridian ? mRes2Adjustment : isVantage ? vRes2Adjustment : isRheinfeld ? rRes2Adjustment : res2Adjustment;
  const res3Adj = isMeridian ? mRes3Adjustment : isVantage ? vRes3Adjustment : isRheinfeld ? rRes3Adjustment : res3Adjustment;

  const res1For = Math.max(5, Math.min(95, baseVotes.forPercent + res1Adj));
  const res1Against = 100 - res1For;

  const res2For = Math.max(5, Math.min(95, baseVotes.forPercent + res2Adj));
  const res2Against = 100 - res2For;

  const res3For = Math.max(5, Math.min(95, baseVotes.forPercent + res3Adj));
  const res3Against = 100 - res3For;

  // ── Resolution panels (pre-vote) — computed outside JSX to avoid Turbopack ternary depth issue
  let resolutionPanels: React.ReactNode = null;
  if (isMeridian) {
    resolutionPanels = (
      <>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 1: Trustee Appointment Ratification</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Members vote to ratify the trustee appointments made during the year. Standard constitutional requirement for a CIO with a supporter membership structure.</p>
          <VoteBar forPercent={res1For} againstPercent={res1Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: Beneficiary Accountability Audit</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">A coalition of major donors has tabled a motion requesting an independent audit of beneficiary outcomes and programme impact methodology.</p>
          <VoteBar forPercent={res2For} againstPercent={res2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Mission Alignment Review</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Members propose a formal independent review of whether Meridian&apos;s current programme portfolio remains consistent with its charitable objects.</p>
          <VoteBar forPercent={res3For} againstPercent={res3Against} />
        </motion.div>
      </>
    );
  } else if (isVantage) {
    resolutionPanels = (
      <>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 1: Director Elections</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            {gameState.apexActive ? 'The full slate stands for election. Apex Capital is running a withhold campaign against three incumbents.' : 'The full slate stands for election. With Apex Capital neutralised, no organised opposition remains.'}
          </p>
          <VoteBar forPercent={res1For} againstPercent={res1Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: Say-on-Pay (Advisory)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Sandra Okafor&apos;s $14.2m package faces the advisory vote carrying ISS&apos;s red flag.</p>
          <VoteBar forPercent={res2For} againstPercent={res2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Independent Board Chair (Shareholder Proposal)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            {gameState.chairCeoSeparationProgress >= 50 ? 'The board has already begun separating the roles. Shareholders are voting to make this binding.' : 'Institutional shareholders are pushing for a mandatory separation of Chair and CEO roles.'}
          </p>
          <VoteBar forPercent={res3For} againstPercent={res3Against} />
        </motion.div>
      </>
    );
  } else if (isRheinfeld) {
    resolutionPanels = (
      <>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 1: Discharge of the Supervisory Board (Entlastung)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Shareholders vote to formally ratify the Supervisory Board&apos;s conduct for the financial year — the broadest governance vote in German corporate law.</p>
          <VoteBar forPercent={res1For} againstPercent={res1Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: Remuneration System Approval (ARUG II)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Under Germany&apos;s ARUG II, the remuneration system must be put to a shareholder vote every four years and after any material change.</p>
          <VoteBar forPercent={res2For} againstPercent={res2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Meridian Capital&apos;s Independent Strategic Review</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Meridian Capital has tabled a binding resolution calling for an independent review of Rheinfeld&apos;s strategic direction and capital allocation.</p>
          <VoteBar forPercent={res3For} againstPercent={res3Against} />
        </motion.div>
      </>
    );
  } else if (isSfg) {
    resolutionPanels = (
      <>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">
            Resolution 1: Director Re-Elections{sfgHasTwoTierVote ? ' (Two-Tier Vote)' : ''}
          </h3>
          {sfgHasTwoTierVote ? (
            <>
              <p className="text-foreground/70 text-sm leading-relaxed mb-2">
                {sfgLongTenureDirectors.map((d) => d.name).join(', ')} {sfgLongTenureDirectors.length === 1 ? 'has' : 'have'} served more than 9 years — the SGX hard cap. Their re-election requires both tiers to pass.
              </p>
              <div className="text-xs text-foreground/50 mb-1">
                Glass Lewis Asia: <span className={sfgGlassLewisFor ? 'text-success font-semibold' : 'text-error font-semibold'}>
                  {sfgGlassLewisFor ? 'FOR (renewal roadmap disclosed)' : 'AGAINST (no renewal roadmap)'}
                </span>
              </div>
              <p className="text-[11px] text-foreground/40 mb-3">Temasek (34%) included in Tier 1 · excluded from Tier 2 denominator</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] text-foreground/60 uppercase tracking-wide mb-1">Tier 1 — All Shareholders</p>
                  <VoteBar forPercent={sfgRes1Tier1For} againstPercent={sfgRes1Tier1Against} />
                </div>
                <div>
                  <p className="text-[11px] text-foreground/60 uppercase tracking-wide mb-1">Tier 2 — Minority Shareholders Only</p>
                  <VoteBar forPercent={sfgRes1Tier2For} againstPercent={sfgRes1Tier2Against} />
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-foreground/70 text-sm leading-relaxed mb-3">All directors are within the SGX 9-year independence limit. Standard shareholder vote applies.</p>
              <VoteBar forPercent={sfgRes1Tier1For} againstPercent={sfgRes1Tier1Against} />
            </>
          )}
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: MAS Compliance &amp; Governance Disclosures</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            Shareholders vote to receive MAS-mandated governance disclosures, including AC composition and BRC adequacy.
            {gameState.acChairVacant ? ' The outstanding AC Chair vacancy is a material item.' : ''}
          </p>
          <VoteBar forPercent={sfgRes2For} againstPercent={sfgRes2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Executive Remuneration (Say-on-Pay)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            Advisory vote on the CEO remuneration framework.
            {gameState.ceoWhistleblower === 'substantiated' ? ' The CEO conduct investigation has raised shareholder concern about the LTIP structure.' : ''}
          </p>
          <VoteBar forPercent={sfgRes3For} againstPercent={sfgRes3Against} />
        </motion.div>
      </>
    );
  } else {
    resolutionPanels = (
      <>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 1: Director Re-Elections</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">{craneOnBoard ? 'Greenvale Partners has called for shareholders to vote against Geoffrey Crane\'s re-election, citing his 12-year board tenure.' : 'Director re-elections. No long-tenure flags have been raised by proxy advisers.'}</p>
          <VoteBar forPercent={res1For} againstPercent={res1Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: Say-on-Pay (Advisory)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">Marcus Blaine&apos;s &pound;4.1m package will face a shareholder advisory vote.</p>
          <VoteBar forPercent={res2For} againstPercent={res2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Shareholder Resolution on ESG Disclosure</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">A coalition of institutional shareholders has tabled a binding resolution on net-zero disclosure.</p>
          <VoteBar forPercent={res3For} againstPercent={res3Against} />
        </motion.div>
      </>
    );
  }

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

    } else if (isVantage) {
      // ── Vantage result labels ──────────────────────────────────────────────
      res1Label = 'Resolution 1: Director Elections';
      res2Label = 'Resolution 2: Say-on-Pay (Advisory)';
      res3Label = 'Resolution 3: Independent Board Chair (Shareholder Proposal)';

      if (results.resolution1Pass) {
        res1Explanation = gameState.apexActive
          ? `Passed — the slate survived Apex Capital's withhold campaign; ${ghLevel} governance health held the institutional base.`
          : `Passed — with Apex neutralised, the slate was re-elected comfortably.`;
      } else {
        res1Explanation = `Failed — Apex's withhold campaign found its mark; several incumbents fell below majority support.`;
      }

      if (results.resolution2Pass) {
        res2Explanation = `Passed — Okafor's $14.2m package survived the advisory vote despite ISS's red flag.`;
      } else {
        res2Explanation = `Failed — ISS's red flag on the $14.2m package proved decisive; the Compensation Committee now owns a formal shareholder rebuke.`;
      }

      if (results.resolution3Pass) {
        res3Explanation = gameState.chairCeoSeparationProgress >= 50
          ? `Passed — with separation already underway, shareholders voted to make the independent Chair binding.`
          : `Passed — shareholders mandated an independent Chair over the board's objection.`;
      } else {
        res3Explanation = gameState.chairCeoSeparationProgress >= 50
          ? `Failed — shareholders accepted the board's own separation timetable as sufficient.`
          : `Failed — the proposal fell short; the combined Chair/CEO structure survives, and so does the governance discount.`;
      }

    } else if (isRheinfeld) {
      // ── Rheinfeld result labels ────────────────────────────────────────────
      res1Label = 'Resolution 1: Discharge of the Supervisory Board (Entlastung)';
      res2Label = 'Resolution 2: Remuneration System Approval (ARUG II)';
      res3Label = "Resolution 3: Meridian Capital's Independent Strategic Review";

      if (results.resolution1Pass) {
        res1Explanation = gameState.heinrichConflictRevealed
          ? `Passed — discharge granted, but narrowly; the conflict disclosures cost Heinrich the customary unanimity.`
          : `Passed — the Supervisory Board's acts were ratified; ${ghLevel} governance health carried the floor.`;
      } else {
        res1Explanation = `Failed — discharge refused. In German corporate life there is no louder vote of no confidence.`;
      }

      if (results.resolution2Pass) {
        res2Explanation = `Passed — the remuneration system was approved under ARUG II, with conditions noted in the minutes.`;
      } else {
        res2Explanation = `Failed — the advisory vote against the remuneration system puts the Supervisory Board on formal notice.`;
      }

      if (results.resolution3Pass) {
        res3Explanation = `Passed — the independent strategic review is mandated; Meridian Capital stands down from its most aggressive posture.`;
      } else {
        res3Explanation = `Failed — the review was defeated; Meridian's analysts left the hall already drafting the EGM requisition.`;
      }

    } else if (isSfg) {
      // ── SFG result labels (two-tier for Res1 if applicable) ───────────────
      res1Label = sfgHasTwoTierVote
        ? 'Resolution 1: Director Re-Elections (Two-Tier Vote)'
        : 'Resolution 1: Director Re-Elections';
      res2Label = 'Resolution 2: MAS Compliance & Governance Disclosures';
      res3Label = 'Resolution 3: Executive Remuneration (Say-on-Pay)';

      if (results.resolution1Pass) {
        res1Explanation = sfgHasTwoTierVote
          ? sfgRenewalRoadmapDisclosed
            ? `Passed — the renewal roadmap secured Glass Lewis Asia's support, carrying the minority Tier 2 vote.`
            : `Passed — both tiers approved the re-election despite Glass Lewis Asia's concerns.`
          : `Passed — the director slate was re-elected with ${ghLevel} governance health and no SGX tenure concerns.`;
      } else {
        res1Explanation = sfgHasTwoTierVote
          ? !sfgTier2Pass
            ? `Failed — the Tier 2 minority vote fell below 50%; without Glass Lewis Asia's support, minority shareholders rejected the re-election. The director(s) must stand down.`
            : `Failed — the Tier 1 all-shareholder vote failed to carry the re-election.`
          : `Failed — ${ghLevel} governance health undermined institutional confidence in the director slate.`;
      }

      if (results.resolution2Pass) {
        res2Explanation = gameState.acChairVacant
          ? `Passed — despite the outstanding AC Chair vacancy, shareholders accepted the MAS compliance disclosures.`
          : `Passed — with the AC Chair vacancy resolved, shareholders endorsed the governance disclosure package.`;
      } else {
        res2Explanation = gameState.acChairVacant
          ? `Failed — the unresolved AC Chair vacancy was cited as a material deficiency in the compliance disclosure vote.`
          : `Failed — ${ghLevel} governance health left shareholders unconvinced on MAS compliance disclosures.`;
      }

      if (results.resolution3Pass) {
        res3Explanation = gameState.ceoWhistleblower === 'substantiated'
          ? `Passed — shareholders supported the revised remuneration framework despite the CEO conduct investigation.`
          : `Passed — the executive remuneration package passed the advisory vote.`;
      } else {
        res3Explanation = gameState.ceoWhistleblower === 'substantiated'
          ? `Failed — the CEO conduct investigation fatally undermined shareholder confidence in the remuneration framework.`
          : `Failed — ${ghLevel} governance health and minority shareholder concerns defeated the Say-on-Pay resolution.`;
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

    const sfgTwoTierData = isSfg && sfgHasTwoTierVote ? {
      tier1For: sfgRes1Tier1For, tier1Against: sfgRes1Tier1Against, tier1Pass: sfgTier1Pass,
      tier2For: sfgRes1Tier2For, tier2Against: sfgRes1Tier2Against, tier2Pass: sfgTier2Pass,
    } : null;

    const resolutions = [
      { label: res1Label, pass: results.resolution1Pass, explanation: res1Explanation, twoTier: sfgTwoTierData },
      { label: res2Label, pass: results.resolution2Pass, explanation: res2Explanation, twoTier: null },
      { label: res3Label, pass: results.resolution3Pass, explanation: res3Explanation, twoTier: null },
    ];

    const agmDebriefParams = {
      governanceHealth: gameState.governanceHealth,
      governanceHealthBreakdown: gameState.governanceHealthBreakdown as GovernanceHealthBreakdown,
      companyId: gameState.company.id,
      contextFlags: {
        craneOnBoard,
        apexActive: gameState.apexActive,
        heinrichConflictRevealed: gameState.heinrichConflictRevealed,
        chairCeoSeparationProgress: gameState.chairCeoSeparationProgress,
      },
      boardSeats: gameState.board.seats,
      directors: gameState.directors,
      deployedDirectorIds: deployedIds,
    };

    const agmDebriefNarratives = resolutions.map((res) =>
      generateAgmResolutionDebrief({ ...agmDebriefParams, resolutionLabel: res.label, passed: res.pass })
    );

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
                    {!res.twoTier && (
                      <span className={`text-lg font-bold ${res.pass ? 'text-success' : 'text-error'}`}>
                        {res.pass ? 'PASSED ✓' : 'FAILED ✗'}
                      </span>
                    )}
                  </div>
                  {res.twoTier && (
                    <TwoTierVoteDisplay {...res.twoTier} />
                  )}
                  <p className={`text-xs mt-2 font-narrative italic ${res.pass ? 'text-success/70' : 'text-error/70'}`}>
                    {res.explanation}
                  </p>
                  <div className="mt-3 pt-3 border-t border-card-border">
                    <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1.5">The Debrief</p>
                    <p className="font-narrative italic text-foreground/70 text-sm leading-relaxed">
                      {agmDebriefNarratives[idx]}
                    </p>
                  </div>
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
          className="font-narrative italic text-foreground/70 text-center max-w-3xl mx-auto mb-6 md:mb-8 leading-relaxed text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isMeridian
            ? `The Annual Members Meeting has arrived. Meridian Foundation operates a supporter membership structure — registered members hold voting rights on constitutional matters. Three resolutions are contested. The Charity Governance Code assessor's view and your governance health score will influence how members vote.`
            : isVantage
              ? `The AGM has arrived. Three resolutions are contested. Institutional voting will be shaped by the proxy advisers' recommendations, ISS's red flag on executive pay, and your governance health score — with Apex Capital's representatives watching from the third row.`
              : isRheinfeld
                ? `The Hauptversammlung has arrived in Düsseldorf. Three resolutions are contested. Institutional voting will be shaped by Meridian Capital's campaign, the proxy advisers' recommendations, and your governance health score. The worker representatives hold their five seats regardless — co-determination is not on the ballot.`
                : isSfg
                  ? sfgHasTwoTierVote
                    ? `The SFG AGM has arrived. Three resolutions are on the agenda. ${sfgLongTenureDirectors.map((d) => d.name).join(' and ')} — with tenure exceeding the SGX 9-year independence limit — must face a two-tier shareholder vote under the SGX Code. Temasek's 34% stake counts in Tier 1 but is excluded from the Tier 2 minority vote. Both tiers must pass for re-election to proceed. Glass Lewis Asia has issued its recommendation.`
                    : `The SFG AGM has arrived. Three resolutions are on the agenda. All directors are within SGX independence tenure limits — no two-tier vote required this year.`
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
          {resolutionPanels}
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
