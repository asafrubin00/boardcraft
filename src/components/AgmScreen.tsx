'use client';

import React, { useState, useEffect } from 'react';
import { agmForecast, type AgmResolutionVote } from '@/engine/agm';
import VoteCount, { countDuration } from '@/components/agm/VoteCount';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, Director, CompetencyDomain, GovernanceHealthBreakdown } from '@/types/game';
import { estimateAgmVotes, getProxyAdviserRating } from '@/engine/gameStateManager';
import { generateAgmResolutionDebrief } from '@/engine/agmNarrative';
import { DOMAIN_SHORT } from '@/engine/boardConstants';
import { playAGMBell, playAGMApplause, playResolutionPass, playResolutionFail } from '@/engine/soundEngine';
import SiteFooter from './SiteFooter';
import CompanyLogo from './CompanyLogo';
import DirectorPortrait from './DirectorPortrait';
import './boardbuild/boardbuild.css';
import './scenario/scenario.css';

const ALL_DOMAINS: CompetencyDomain[] = [
  'financialOversight', 'regulatoryLegal', 'strategyMarkets', 'peopleCulture',
  'esgSustainability', 'geopoliticalMacro', 'technologyDigital', 'stakeholderComms',
];

interface AgmResults {
  resolution1Pass: boolean;
  resolution2Pass: boolean;
  resolution3Pass: boolean;
  narrative: string;
  /** The three polls, counted block by block (engine/agm.ts) */
  votes?: AgmResolutionVote[];
  /** Tier of the single AGM roll — used to check the story line against the three results */
  outcomeTier?: string;
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
    label: 'Publish a board renewal roadmap; engage the proxy advisers',
    description:
      'Publish a multi-year renewal schedule that deals with the nine-year rule head on, and take it to Glass Lewis Asia and ISS before the meeting.',
  },
  {
    id: 'sfgevent_13_b',
    label: "Rely on Temasek's 34%",
    description:
      'Secure Temasek privately and skip the proxy advisers. It may carry the vote, and the minority institutions will not forgive it.',
  },
  {
    id: 'sfgevent_13_c',
    label: 'Long-serving directors stand down before the meeting',
    description:
      'Take anyone past nine years off the re-election slate. It removes the fight from the ballot and speeds up the change in the board.',
  },
  {
    id: 'sfgevent_13_d',
    label: 'Do nothing — defend the slate as it stands',
    description:
      'Put every director up for re-election and make no commitments on renewal. Expect Glass Lewis Asia to recommend against.',
  },
];

// ── Shared components ──────────────────────────────────────────────────────────

/** One plain sentence on what the poll decided and what moved it most. */
function voteLine(v: AgmResolutionVote): string {
  const result = `${v.pass ? 'Carried' : 'Defeated'} with ${v.forPct.toFixed(1)}% in favour`;
  const wanted =
    v.stance === 'neutral'
      ? ''
      : v.good
        ? v.proposedBy === 'shareholders' && v.stance === 'against' ? ' The board had opposed it and held the line.' : ' That is the result the board asked for.'
        : v.proposedBy === 'shareholders' && v.stance === 'against' ? ' The board had opposed it.' : ' The board had asked for the opposite.';
  const factor =
    v.lean === 0
      ? `Biggest factor: ${v.driver}.`
      : v.pass === (v.lean > 0)
        ? `${v.pass ? 'Helped' : 'Hurt'} most by ${v.driver}.`
        : `That was in spite of ${v.driver}.`;
  return `${result}. ${factor}${wanted}`;
}

function VoteBar({ forPercent, againstPercent }: { forPercent: number; againstPercent: number }) {
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-foreground/70 mb-1">
        <span>For: {forPercent}%</span>
        <span>Against: {againstPercent}%</span>
      </div>
      <div className="w-full h-2.5 rounded-[2px] overflow-hidden flex bg-navy-dark">
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
    const timers: NodeJS.Timeout[] = [];
    // Each resolution is counted live; the next one opens when the last has closed.
    const per = countDuration(results.votes?.[0]?.blocks.length ?? 4);
    for (let i = 1; i <= 4; i++) {
      timers.push(setTimeout(() => setRevealedCount(i), 500 + (i - 1) * per));
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

  // ── SFG: the nine-year rule ──────────────────────────────────────────────
  // SGX Listing Rule 210(5)(d)(iv): past nine years a director can stand again
  // only as a non-independent director. There is no two-tier vote any more.
  const sfgLongTenureDirectors = isSfg
    ? gameState.board.seats
        .map((s) => gameState.directors.find((d) => d.id === s.directorId))
        .filter((d): d is Director => d !== undefined && (d.tenure ?? 0) > 9)
    : [];
  const sfgMislabelled = sfgLongTenureDirectors.filter((d) => d.independence !== 'non-independent');
  const sfgNames = (list: Director[]) => list.map((d) => d.name).join(' and ');

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

  // The bars on the notice are the engine's own forecast, and they move with
  // the strategy the player is considering.
  const forecast = agmForecast(gameState, selectedStrategy);
  const res1For = Math.round(forecast[0].forPct);
  const res1Against = 100 - res1For;
  const res2For = Math.round(forecast[1].forPct);
  const res2Against = 100 - res2For;
  const res3For = Math.round(forecast[2].forPct);
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
            Resolution 1: Director Re-Elections
          </h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-2">
            {sfgMislabelled.length > 0
              ? `${sfgNames(sfgMislabelled)} ${sfgMislabelled.length === 1 ? 'has' : 'have'} served more than nine years and ${sfgMislabelled.length === 1 ? 'is' : 'are'} still presented as independent. SGX's nine-year rule does not allow that, and the proxy advisers will say so.`
              : sfgLongTenureDirectors.length > 0
                ? `${sfgNames(sfgLongTenureDirectors)} ${sfgLongTenureDirectors.length === 1 ? 'stands' : 'stand'} again after more than nine years, now as non-independent ${sfgLongTenureDirectors.length === 1 ? 'director' : 'directors'}. The question for shareholders is whether the board is renewing itself fast enough.`
                : 'Every director is inside the SGX nine-year limit. An ordinary vote.'}
          </p>
          {sfgLongTenureDirectors.length > 0 && (
            <div className="text-xs text-foreground/50 mb-3">
              Glass Lewis Asia: <span className={selectedStrategy === 'sfgevent_13_a' ? 'text-success font-semibold' : 'text-error font-semibold'}>
                {selectedStrategy === 'sfgevent_13_a' ? 'FOR (renewal roadmap published)' : 'AGAINST (no renewal roadmap)'}
              </span>
            </div>
          )}
          <VoteBar forPercent={res1For} againstPercent={res1Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 2: MAS Compliance &amp; Governance Disclosures</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            Shareholders vote to receive MAS-mandated governance disclosures, including AC composition and BRC adequacy.
            {gameState.acChairVacant ? ' The outstanding AC Chair vacancy is a material item.' : ''}
          </p>
          <VoteBar forPercent={res2For} againstPercent={res2Against} />
        </motion.div>
        <motion.div className="bg-card-bg border border-card-border rounded-lg p-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <h3 className="text-gold font-bold text-sm uppercase tracking-wide mb-2">Resolution 3: Executive Remuneration (Say-on-Pay)</h3>
          <p className="text-foreground/70 text-sm leading-relaxed mb-3">
            Advisory vote on the CEO remuneration framework.
            {gameState.ceoWhistleblower === 'substantiated' ? ' The CEO conduct investigation has raised shareholder concern about the LTIP structure.' : ''}
          </p>
          <VoteBar forPercent={res3For} againstPercent={res3Against} />
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
    // Governance health is quoted as a reason only where it points the same way
    // as the result. A pass on weak health, or a defeat on strong health, is
    // worded as happening despite it — never "Failed — strong governance health…".
    const passGh = (becauseOf: string, despiteWeak: string) =>
      ghLevel === 'weak' ? despiteWeak : becauseOf.replace('{gh}', ghLevel);
    const failGh = (becauseOf: string, despiteStrong: string) =>
      ghLevel === 'strong' ? despiteStrong : becauseOf.replace('{gh}', ghLevel === 'adequate' ? 'only adequate' : 'weak');

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
          : passGh(`Passed — {gh} governance health gave members confidence in the trustee appointments.`, `Passed — members ratified the trustee appointments despite weak governance health.`);
      } else {
        res1Explanation = mevent01 && (mevent01.outcomeTier === 'FAILURE' || mevent01.outcomeTier === 'CRITICAL_FAILURE')
          ? `Failed — the unresolved conflict of interest eroded member confidence in the trustee appointments.`
          : failGh(`Failed — {gh} governance health undermined member confidence in the current trustee slate.`, `Failed — strong governance health was not enough to hold member confidence in the current trustee slate.`);
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
          : `Failed — the review motion did not secure sufficient member support to pass.`;
      }

    } else if (isVantage) {
      // ── Vantage result labels ──────────────────────────────────────────────
      res1Label = 'Resolution 1: Director Elections';
      res2Label = 'Resolution 2: Say-on-Pay (Advisory)';
      res3Label = 'Resolution 3: Independent Board Chair (Shareholder Proposal)';

      if (results.resolution1Pass) {
        res1Explanation = gameState.apexActive
          ? passGh(`Passed — the slate survived Apex Capital's withhold campaign; {gh} governance health held the institutional base.`, `Passed — the slate survived Apex Capital's withhold campaign despite weak governance health.`)
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
          : passGh(`Passed — the Supervisory Board's acts were ratified; {gh} governance health carried the floor.`, `Passed — the Supervisory Board's acts were ratified despite weak governance health.`);
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
      // ── SFG result labels ───────────────
      res1Label = 'Resolution 1: Director Re-Elections';
      res2Label = 'Resolution 2: MAS Compliance & Governance Disclosures';
      res3Label = 'Resolution 3: Executive Remuneration (Say-on-Pay)';
      res1Explanation = results.resolution1Pass
        ? 'Passed — the director slate was re-elected.'
        : 'Failed — shareholders rejected the slate. Directors past nine years were not re-elected.';

      if (results.resolution2Pass) {
        res2Explanation = gameState.acChairVacant
          ? `Passed — despite the outstanding AC Chair vacancy, shareholders accepted the MAS compliance disclosures.`
          : `Passed — with the AC Chair vacancy resolved, shareholders endorsed the governance disclosure package.`;
      } else {
        res2Explanation = gameState.acChairVacant
          ? `Failed — the unresolved AC Chair vacancy was cited as a material deficiency in the compliance disclosure vote.`
          : failGh(`Failed — {gh} governance health left shareholders unconvinced on MAS compliance disclosures.`, `Failed — shareholders were unconvinced on the MAS compliance disclosures despite strong governance health.`);
      }

      if (results.resolution3Pass) {
        res3Explanation = gameState.ceoWhistleblower === 'substantiated'
          ? `Passed — shareholders supported the revised remuneration framework despite the CEO conduct investigation.`
          : `Passed — the executive remuneration package passed the advisory vote.`;
      } else {
        res3Explanation = gameState.ceoWhistleblower === 'substantiated'
          ? `Failed — the CEO conduct investigation fatally undermined shareholder confidence in the remuneration framework.`
          : failGh(`Failed — {gh} governance health and minority shareholder concerns defeated the Say-on-Pay resolution.`, `Failed — minority shareholder concerns defeated the Say-on-Pay resolution despite strong governance health.`);
      }

    } else {
      // ── Default (Harwick) result labels ───────────────────────────────────
      res1Label = 'Resolution 1: Director Re-Elections';
      res2Label = 'Resolution 2: Say-on-Pay (Advisory)';
      res3Label = 'Resolution 3: ESG Disclosure';

      if (results.resolution1Pass) {
        res1Explanation = craneOnBoard
          ? passGh(`Passed - {gh} governance health offset Crane's 12-year tenure concerns.`, `Passed - the slate was re-elected despite Crane's 12-year tenure and weak governance health.`)
          : passGh(`Passed - {gh} governance health and no tenure flags on the board.`, `Passed - no tenure flags on the board, despite weak governance health.`);
      } else {
        res1Explanation = craneOnBoard
          ? failGh(`Failed - Geoffrey Crane's 12-year tenure flagged by Meridian Governance, compounded by {gh} governance health.`, `Failed - Geoffrey Crane's 12-year tenure, flagged by Meridian Governance, outweighed strong governance health.`)
          : failGh(`Failed - {gh} governance health undermined institutional confidence in the board slate.`, `Failed - strong governance health was not enough to hold institutional confidence in the board slate.`);
      }

      if (results.resolution2Pass) {
        res2Explanation = ev06
          ? (ev06.outcomeTier === 'SUCCESS' || ev06.outcomeTier === 'CRITICAL_SUCCESS')
            ? `Passed - prior remuneration review strengthened the case for Blaine's package.`
            : passGh(`Passed - {gh} governance health and proxy adviser recommendation carried the vote.`, `Passed - the proxy adviser recommendation carried the vote despite weak governance health.`)
          : passGh(`Passed - {gh} governance health and proxy adviser recommendation carried the vote.`, `Passed - the proxy adviser recommendation carried the vote despite weak governance health.`);
      } else {
        res2Explanation = ev06 && (ev06.outcomeTier === 'FAILURE' || ev06.outcomeTier === 'CRITICAL_FAILURE')
          ? `Failed - earlier remuneration controversy eroded shareholder support for Blaine's £4.1m package.`
          : failGh(`Failed - {gh} governance health left shareholders unconvinced on executive pay.`, `Failed - shareholders were unconvinced on executive pay despite strong governance health.`);
      }

      const etActive = gameState.committees.energyTransition?.active;
      const ev05Failed = ev05 && (ev05.outcomeTier === 'FAILURE' || ev05.outcomeTier === 'CRITICAL_FAILURE');
      if (results.resolution3Pass) {
        res3Explanation = etActive
          ? `Passed - the Energy Transition Committee demonstrated credible ESG governance.`
          : passGh(`Passed - {gh} governance health and proxy adviser support swung the vote.`, `Passed - proxy adviser support swung the vote despite weak governance health.`);
      } else {
        if (ev05Failed && !etActive) {
          res3Explanation = `Failed - prior ESG incident and absence of an Energy Transition Committee undermined credibility.`;
        } else if (ev05Failed) {
          res3Explanation = `Failed - prior ESG incident damaged the board's environmental credentials despite the ET Committee.`;
        } else if (!etActive) {
          res3Explanation = `Failed - no Energy Transition Committee left shareholders sceptical of ESG commitment.`;
        } else {
          res3Explanation = failGh(`Failed - {gh} governance health eroded shareholder confidence on ESG disclosure.`, `Failed - shareholders were not persuaded on ESG disclosure despite strong governance health.`);
        }
      }
    }

    const resolutions = [
      { label: res1Label, pass: results.resolution1Pass, explanation: res1Explanation },
      { label: res2Label, pass: results.resolution2Pass, explanation: res2Explanation },
      { label: res3Label, pass: results.resolution3Pass, explanation: res3Explanation },
    ];

    // The closing line. Each AGM event carries one story line per outcome tier,
    // and several of them state how many resolutions carried ("Two pass, one
    // fails"). The three results above are derived separately (company levers,
    // the year's record), so the story can disagree with them. Show it only
    // where it is consistent with what the player has just been shown;
    // otherwise state the result plainly.
    const passFlags = resolutions.map((r) => r.pass);
    const passCount = passFlags.filter(Boolean).length;
    const tier = results.outcomeTier;
    const storyAgrees = ((): boolean => {
      if (!tier) return false;
      const top = tier === 'CRITICAL_SUCCESS' || tier === 'SUCCESS';
      if (isMeridian) return true; // its story is about the CEO, not the vote count
      if (isSfg) {
        if (top) return passCount === 3;
        if (tier === 'CRITICAL_FAILURE') return !passFlags[0];
        return false; // partial / failure stories describe outcomes the vote display can contradict
      }
      if (top) return passCount === 3;
      if (tier === 'CRITICAL_FAILURE') return passCount === 0;
      if (isVantage) return tier === 'PARTIAL_SUCCESS' ? passCount === 1 || passCount === 2 : passCount === 0;
      if (isRheinfeld) return tier === 'PARTIAL_SUCCESS' ? passCount === 2 : !passFlags[0];
      // Harwick: partial says two pass, failure says one passes
      return tier === 'PARTIAL_SUCCESS' ? passCount === 2 : passCount === 1;
    })();
    const shortLabel = (label: string) => label.replace(/^Resolution \d+:\s*/, '');
    const defeated = resolutions.filter((r) => !r.pass).map((r) => shortLabel(r.label));
    const plainSummary =
      passCount === 3
        ? 'All three resolutions carried.'
        : passCount === 0
          ? 'All three resolutions were defeated.'
          : `${passCount === 2 ? 'Two resolutions carried and one was defeated' : 'One resolution carried and two were defeated'}: ${defeated.join('; ')}.`;
    void storyAgrees;
    const summaryLine = plainSummary;

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

    void resolutions.map((res) =>
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
        <motion.article
          className="bc-doc bc-paper w-full max-w-2xl rounded-[3px] px-5 md:px-12 pt-8 md:pt-10 pb-8"
          initial={{ opacity: 0, y: -40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        >
        <header className="flex items-center gap-4 pb-4" style={{ borderBottom: '2px solid var(--ink)' }}>
          <div className="shrink-0 rounded-full" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}><CompanyLogo companyId={gameState.company.id} size={52} /></div>
          <div className="min-w-0">
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>Minutes · Results of the poll</p>
            <h1 className="bc-serif text-2xl md:text-3xl font-bold leading-tight mt-1">{meetingName} — {gameState.company.name}</h1>
          </div>
        </header>

        <div className="flex flex-col gap-4 w-full mt-6">
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
                    <span className="bc-serif text-foreground font-bold text-[17px] leading-snug">{res.label}</span>
                    {(
                      <motion.span
                        className={`sc-outcome-stamp shrink-0 ml-3 text-sm ${(results.votes?.[idx]?.good ?? res.pass) ? 'text-success' : 'text-error'}`}
                        style={{ padding: '3px 10px 2px', borderWidth: 3 }}
                        initial={{ opacity: 0, scale: 2.4, rotate: -14 }}
                        animate={{ opacity: 0.9, scale: 1, rotate: res.pass ? -4 : 4 }}
                        transition={{ delay: (countDuration(results.votes?.[idx]?.blocks.length ?? 4) - 700) / 1000, type: 'spring', stiffness: 420, damping: 17 }}
                      >
                        {res.pass ? 'Carried' : 'Defeated'}
                      </motion.span>
                    )}
                  </div>
                  {results.votes?.[idx] && <VoteCount vote={results.votes[idx]} />}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: (countDuration(results.votes?.[idx]?.blocks.length ?? 4) - 500) / 1000, duration: 0.5 }}
                  >
                    <p className={`text-[13px] mt-3 font-narrative italic ${(results.votes?.[idx]?.good ?? res.pass) ? 'text-success' : 'text-error'}`}>
                      {results.votes?.[idx] ? voteLine(results.votes[idx]) : res.explanation}
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {revealedCount >= 4 && (
            <motion.div
              className="mt-8 w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <p className="font-narrative italic text-foreground/80 text-center leading-relaxed mb-8 pt-6" style={{ borderTop: '1px solid var(--rule)' }}>
                {summaryLine}
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
        </motion.article>
      {/* Copyright — pinned on desktop; in-flow on mobile so it never overlaps content */}
      <div className="hidden md:block">
        <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
      </div>
      <SiteFooter className="md:hidden mt-10 pb-2" />

    </div>
    );
  }

  // ── Pre-resolution view ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-navy px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <motion.article
          className="bc-doc bc-paper relative rounded-[3px] px-5 md:px-12 pt-8 md:pt-10 pb-8 md:pb-10 mb-10"
          initial={{ opacity: 0, y: -40, rotate: 1.5 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 170, damping: 22 }}
        >
        {/* Header */}
        <header className="flex items-center gap-4 pb-4 mb-5" style={{ borderBottom: '2px solid var(--ink)' }}>
          <div className="shrink-0 rounded-full" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}><CompanyLogo companyId={gameState.company.id} size={56} /></div>
          <div className="min-w-0 flex-1">
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>Notice of meeting</p>
            <h1 className="bc-serif text-2xl md:text-4xl font-bold leading-tight mt-1">{meetingName} — {gameState.company.name}</h1>
          </div>
        </header>

        <motion.p
          className="bc-serif text-foreground/85 max-w-4xl mb-5 leading-relaxed text-sm md:text-[16px]"
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
                  ? sfgLongTenureDirectors.length > 0
                    ? `The SFG AGM has arrived. Three resolutions are on the agenda. ${sfgNames(sfgLongTenureDirectors)} ${sfgLongTenureDirectors.length === 1 ? 'has' : 'have'} served more than nine years, the point at which SGX no longer treats a director as independent. Temasek holds 34% and the minority institutions are watching how it is used.`
                    : `The SFG AGM has arrived. Three resolutions are on the agenda. Every director is inside SGX's nine-year limit.`
                  : `The AGM has arrived. Three resolutions are contested. Institutional shareholder voting will be influenced by Meridian Governance's recommendations and your governance health score.`}
        </motion.p>

        {/* Rating badge */}
        <div className="mb-7">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {resolutionPanels}
        </div>

        {/* Strategy Selection */}
        <motion.div
          className="mb-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="bc-overline mb-3" style={{ color: 'var(--ink-soft)' }}>
            Select your {meetingNameShort} strategy
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
                    ? 'bg-gold/15 border-gold text-foreground shadow-[inset_4px_0_0_#7a5a06]'
                    : 'bg-card-bg border-card-border text-foreground hover:border-gold/60'
                }`}
              >
                <h4 className="bc-serif font-bold text-[16px] mb-1 leading-snug">{strat.label}</h4>
                <p className="text-[13px] text-foreground/65 leading-snug">{strat.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        </motion.article>

        {/* Director / Trustee Deployment */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <h2 className="text-xl font-narrative font-bold text-foreground mb-1">
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
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 rounded-full overflow-hidden ${isSelected ? 'ring-2 ring-gold' : 'ring-1 ring-white/15'}`}><DirectorPortrait directorId={dir.id} size={34} /></span>
                      <span className="font-narrative text-[15px] font-bold text-foreground truncate">
                        {dir.name}
                      </span>
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
      {/* Copyright — pinned on desktop; in-flow on mobile so it never overlaps content */}
      <div className="hidden md:block">
        <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
      </div>
      <SiteFooter className="md:hidden mt-10 pb-2" />
    </div>
  );
}
