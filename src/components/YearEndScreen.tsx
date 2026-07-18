'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, ResolvedEvent, GovernanceHealthBreakdown, CompetencyDomain } from '@/types/game';
import { getSvHistory, getProxyAdviserRating, getAllEvents } from '@/engine/gameStateManager';
import { generateDebrief } from '@/engine/narrativeExplanation';
import { DOMAIN_LABELS } from '@/engine/boardConstants';
import {
  calculateGameGc,
  getCareerTitle,
  getCareerStats,
  recordGameResult,
  addLeaderboardEntry,
  getLeaderboard,
  clearLeaderboard,
  type CareerStats,
  type LeaderboardEntry,
} from '@/engine/governanceCapital';
import { playYearEnd } from '@/engine/soundEngine';
import SiteFooter from './SiteFooter';

interface AgmResults {
  resolution1Pass: boolean;
  resolution2Pass: boolean;
  resolution3Pass: boolean;
}

interface YearEndScreenProps {
  gameState: GameState;
  onRestart: () => void;
  onChangeCompany?: () => void;
  agmResults?: AgmResults;
}

const OUTCOME_COLORS: Record<string, { bg: string; text: string }> = {
  CRITICAL_SUCCESS: { bg: 'bg-success', text: 'text-white' },
  SUCCESS: { bg: 'bg-green-400', text: 'text-navy-dark' },
  PARTIAL_SUCCESS: { bg: 'bg-warning', text: 'text-navy-dark' },
  FAILURE: { bg: 'bg-error', text: 'text-white' },
  CRITICAL_FAILURE: { bg: 'bg-red-800', text: 'text-white' },
};

const OUTCOME_LABELS: Record<string, string> = {
  CRITICAL_SUCCESS: 'Critical Success',
  SUCCESS: 'Success',
  PARTIAL_SUCCESS: 'Partial Success',
  FAILURE: 'Failure',
  CRITICAL_FAILURE: 'Critical Failure',
};

const BREAKDOWN_LABELS: Record<keyof Omit<GovernanceHealthBreakdown, 'total'>, string> = {
  boardIndependence: 'Board Independence',
  committeeCompleteness: 'Committee Completeness',
  chairCeoSeparation: 'Chair-CEO Separation',
  esgGovernance: 'ESG Governance',
  skillMatrixCoverage: 'Skill Matrix Coverage',
};

function getSvColor(sv: number): string {
  if (sv > 100) return 'text-success';
  if (sv >= 80) return 'text-gold';
  return 'text-error';
}

function getGhColor(gh: number): string {
  if (gh >= 70) return 'text-success';
  if (gh >= 40) return 'text-warning';
  return 'text-error';
}

function getGhBarColor(gh: number): string {
  if (gh >= 70) return 'bg-success';
  if (gh >= 40) return 'bg-warning';
  return 'bg-error';
}

function getProxyColor(rating: string): string {
  const lower = rating.toLowerCase();
  if (lower.includes('strong') || lower.includes('recommend for')) return 'text-success';
  if (lower.includes('adequate') || lower.includes('no concerns')) return 'text-gold-light';
  if (lower.includes('mixed') || lower.includes('monitor')) return 'text-warning';
  return 'text-error';
}

function generateVerdict(gameState: GameState, careerTitle: string, eventNameMap: Record<string, string>): string {
  const sv = gameState.svIndex;
  const gh = gameState.governanceHealth;
  const startGh = gameState.company.startingGovernanceHealth;
  const resolved = gameState.resolvedEvents;

  let opening: string;
  if (sv > 115) opening = 'A masterclass in governance under pressure.';
  else if (sv > 105) opening = 'A solid year - the board held its nerve when it mattered.';
  else if (sv > 95) opening = 'A mixed year. Some good decisions, some costly ones.';
  else if (sv > 85) opening = 'A difficult year that exposed real weaknesses in the board.';
  else opening = 'A governance failure. The board was not equal to the challenges it faced.';

  let bestLine = '';
  if (resolved.length > 0) {
    const best = [...resolved].sort((a, b) => b.svDelta - a.svDelta)[0];
    if (best.svDelta > 0) {
      const tier = best.outcomeTier.replace('_', ' ').toLowerCase();
      bestLine = ` Your strongest moment was ${eventNameMap[best.eventId] ?? best.eventId} - a ${tier} that added ${best.svDelta.toFixed(1)}% to ${gameState.company.id === 'company_meridian' ? 'mission integrity' : 'shareholder value'}.`;
    }
  }

  let worstLine = '';
  if (resolved.length > 0) {
    const worst = [...resolved].sort((a, b) => a.svDelta - b.svDelta)[0];
    if (worst.svDelta < 0) {
      const tier = worst.outcomeTier.replace('_', ' ').toLowerCase();
      worstLine = ` The low point was ${eventNameMap[worst.eventId] ?? worst.eventId}, where a ${tier} cost ${Math.abs(worst.svDelta).toFixed(1)}% in ${gameState.company.id === 'company_meridian' ? 'mission integrity' : 'shareholder value'}.`;
    }
  }

  let ghLine: string;
  if (gh > startGh) {
    ghLine = ` Governance health improved across the year, ending at ${gh}/100.`;
  } else if (gh < startGh) {
    ghLine = ` Governance health deteriorated, ending at ${gh}/100 - a warning sign for the year ahead.`;
  } else {
    ghLine = ` Governance health held steady at ${gh}/100.`;
  }

  const closings: Record<string, string> = {
    'Legend of the Boardroom': 'Few have governed better.',
    'Governance Authority': 'A reputation that opens boardroom doors across the City.',
    'Seasoned Governance Professional': 'A solid track record that will serve you well.',
    'Non-Executive Director': 'The foundations are laid. The next board will be sharper.',
    'Board Apprentice': 'Every career starts somewhere. The lessons here will be invaluable.',
  };
  const closing = ` You leave this board as a ${careerTitle}. ${closings[careerTitle] || ''}`;

  return opening + bestLine + worstLine + ghLine + closing;
}

// ── Year End Analysis ──

function generateYearEndAnalysis(
  gameState: GameState,
  eventNameMap: Record<string, string>,
  careerStats: CareerStats | null,
  agmResults?: AgmResults,
): string {
  const sv = gameState.svIndex;
  const isMeridian = gameState.company.id === 'company_meridian';
  const valueLabel = isMeridian ? 'mission integrity' : 'shareholder value';
  const resolved = gameState.resolvedEvents;
  const paragraphs: string[] = [];

  // ── OPENING ──
  let opening: string;
  if (sv >= 115) {
    opening = `A ${sv} SV Index is close to the ceiling of what this board structure allows — governance pressure absorbed, capital protected, and no quarter lost to a catastrophic call.`;
  } else if (sv >= 108) {
    opening = `${sv} on the SV Index puts this year in the top tier: every event that mattered was handled, and the board's composition held up when it was tested.`;
  } else if (sv >= 100) {
    opening = `${sv} on the SV Index means the board delivered a positive year, but by a margin that leaves little room for error on the next run.`;
  } else if (sv >= 95) {
    opening = `A ${sv} SV Index — fractionally above the survival line, but that gap between 95 and 108 is where most of this year's decisions were lost.`;
  } else if (sv >= 85) {
    opening = `${sv} on the SV Index. The board underperformed — not catastrophically, but enough that the company enters the next cycle with reduced credibility.`;
  } else {
    opening = `A ${sv} SV Index is a governance failure by any institutional standard. The board was consistently outpaced by the events it was built to handle.`;
  }
  paragraphs.push(opening);

  // ── BOARD CONSTRUCTION JUDGMENT ──
  const seats = gameState.board.seats;
  const seatedDirectors = seats
    .map((s) => gameState.directors.find((d) => d.id === s.directorId))
    .filter((d): d is GameState['directors'][number] => d !== undefined);

  const domains = ['stakeholderComms', 'regulatoryLegal', 'financialOversight', 'esgSustainability', 'strategyMarkets', 'peopleCulture'] as const;
  type Domain = typeof domains[number];
  const domainAvg = (domain: Domain): number => {
    if (seatedDirectors.length === 0) return 0;
    return Math.round(seatedDirectors.reduce((s, d) => s + ((d.domainRatings as Record<string, number>)[domain] ?? 0), 0) / seatedDirectors.length);
  };
  const domainLabelsLocal: Record<Domain, string> = {
    stakeholderComms: 'stakeholder communications',
    regulatoryLegal: 'regulatory and legal understanding',
    financialOversight: 'financial oversight',
    esgSustainability: 'ESG and sustainability',
    strategyMarkets: 'strategy and markets',
    peopleCulture: 'people and culture',
  };
  const weakestDomain = domains.reduce((worst, d) => domainAvg(d) < domainAvg(worst) ? d : worst, domains[0]);
  const weakestAvg = domainAvg(weakestDomain);

  // boardIndependence is out of 20; map to a percentage for narrative
  const independenceRate = Math.round((gameState.governanceHealthBreakdown.boardIndependence / 20) * 100);

  const committeeCompleteness = gameState.governanceHealthBreakdown.committeeCompleteness;
  const committeeNote = committeeCompleteness >= 16
    ? 'the committee structure was properly staffed and chaired'
    : committeeCompleteness >= 10
      ? 'committee coverage was partial — some committees were either unstaffed or missing a chair'
      : 'the committee structure had significant gaps';

  const notableWeakDirectors = seatedDirectors.filter((d) => ((d.domainRatings as Record<string, number>)[weakestDomain] ?? 0) < 40);
  let boardLine = `${independenceRate}% of the board was independent. The weakest area across the roster was ${domainLabelsLocal[weakestDomain]}, averaging ${weakestAvg} — ${committeeNote}.`;
  if (notableWeakDirectors.length > 0 && resolved.some((ev) => ev.breakdown?.primaryDomain === weakestDomain)) {
    boardLine += ` ${notableWeakDirectors.map((d) => d.name).join(' and ')} ${notableWeakDirectors.length === 1 ? 'was' : 'were'} below 40 in that domain yet seated for the full season.`;
  }
  paragraphs.push(boardLine);

  // ── DECISION PATTERN ──
  if (resolved.length > 0) {
    const sorted = [...resolved].sort((a, b) => b.svDelta - a.svDelta);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    const bestName = eventNameMap[best.eventId] ?? best.eventId;
    const worstName = eventNameMap[worst.eventId] ?? worst.eventId;

    const avgDeployedRating = (ev: ResolvedEvent): number => {
      const dirs = gameState.directors.filter((d) => ev.deployedDirectorIds.includes(d.id));
      if (!dirs.length || !ev.breakdown) return 0;
      const domain = ev.breakdown.primaryDomain as Domain;
      return Math.round(dirs.reduce((s, d) => s + ((d.domainRatings as Record<string, number>)[domain] ?? 0), 0) / dirs.length);
    };

    const bestRating = avgDeployedRating(best);
    const worstRating = avgDeployedRating(worst);

    let decisionLine = `The season's high point was ${bestName} — a ${best.outcomeTier.replace('_', ' ').toLowerCase()} adding ${best.svDelta > 0 ? '+' : ''}${best.svDelta.toFixed(1)} to ${valueLabel}`;
    decisionLine += bestRating >= 60 ? ', supported by directors well-matched to what the event demanded.' : ', though the director deployment was not the primary reason it went well.';

    if (worst.svDelta < -0.5) {
      decisionLine += ` The low point was ${worstName}, costing ${Math.abs(worst.svDelta).toFixed(1)} in ${valueLabel}`;
      decisionLine += worstRating < 50 ? ' — a mismatch between the event\'s demands and the expertise deployed.' : ', despite reasonable director selection.';
    }

    // Pattern across all events
    const mismatches = resolved.filter((ev) => {
      if (!ev.breakdown) return false;
      const r = avgDeployedRating(ev);
      return r < 45 && (ev.outcomeTier === 'FAILURE' || ev.outcomeTier === 'CRITICAL_FAILURE' || ev.outcomeTier === 'PARTIAL_SUCCESS');
    });
    if (mismatches.length >= 3) {
      decisionLine += ` Across the season, ${mismatches.length} events saw weak director-to-event matches — a systematic deployment problem, not bad luck.`;
    } else if (mismatches.length === 0 && resolved.length >= 4) {
      decisionLine += ` Director deployment was consistently well-targeted — the right expertise was in the room for most events.`;
    }

    paragraphs.push(decisionLine);
  }

  // ── AGM PERFORMANCE ──
  if (agmResults) {
    const { resolution1Pass, resolution2Pass, resolution3Pass } = agmResults;
    const passed = [resolution1Pass, resolution2Pass, resolution3Pass].filter(Boolean).length;
    const agmLine = passed === 3
      ? `At the AGM, all three resolutions passed — a clean meeting that signals institutional confidence in the governance position built across the year.`
      : passed === 2
        ? `Two of three AGM resolutions passed. The failed vote is a signal that one dimension of the board's governance case didn't hold under shareholder scrutiny.`
        : passed === 1
          ? `Only one AGM resolution passed — a difficult meeting that reflects the governance weaknesses accumulated during the year.`
          : `All three AGM resolutions failed. That outcome is a public rebuke from shareholders and the clearest signal that the governance position was untenable.`;
    paragraphs.push(agmLine);
  }

  // ── CLOSING CTA ──
  const companyId = gameState.company.id;
  let cta: string;
  if (sv >= 108) {
    if (companyId === 'company_harwick') {
      cta = `The next step is Vantage Capital or Rheinfeld AG. This board will be simpler by comparison.`;
    } else if (companyId === 'company_vantage') {
      cta = `The next step is Rheinfeld AG. This board will be simpler by comparison.`;
    } else if (companyId === 'company_rheinfeld') {
      cta = `The next step is Vantage Capital. This board will be simpler by comparison.`;
    } else {
      cta = `The next step is Harwick PLC. This board will be simpler by comparison.`;
    }
  } else if (sv >= 95) {
    cta = `One more run at ${gameState.company.name} with what you now know would look very different.`;
  } else {
    cta = `Run it again. The decisions that cost you here are clearer in hindsight.`;
  }
  paragraphs.push(cta);

  return paragraphs.join('\n\n');
}

function YearEndAnalysis({
  gameState,
  eventNameMap,
  careerStats,
  agmResults,
}: {
  gameState: GameState;
  eventNameMap: Record<string, string>;
  careerStats: CareerStats | null;
  agmResults?: AgmResults;
}) {
  const text = generateYearEndAnalysis(gameState, eventNameMap, careerStats, agmResults);
  const paragraphs = text.split('\n\n');

  return (
    <motion.div
      className="bg-card-bg border border-card-border rounded-lg p-6 mb-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5 }}
    >
      <p className="text-gold text-xs uppercase tracking-wide mb-4">Board Review</p>
      <div className="space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i} className="font-narrative italic text-foreground/80 text-base leading-relaxed">
            {para}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

function SvSparkline({ data }: { data: { turn: string; sv: number }[] }) {
  if (data.length < 2) return null;

  const width = 600;
  const height = 200;
  const padX = 50;
  const padY = 30;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const svValues = data.map((d) => d.sv);
  const minSv = Math.min(...svValues, 80);
  const maxSv = Math.max(...svValues, 120);
  const range = maxSv - minSv || 1;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = padY + chartH - ((d.sv - minSv) / range) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const baselineY = padY + chartH - ((100 - minSv) / range) * chartH;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[600px] h-auto" preserveAspectRatio="xMidYMid meet">
      {[minSv, 100, maxSv].map((val) => {
        const y = padY + chartH - ((val - minSv) / range) * chartH;
        return (
          <g key={val}>
            <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#2A5580" strokeWidth={0.5} />
            <text x={padX - 8} y={y + 4} textAnchor="end" fill="#E8E4DC" fontSize={10} opacity={0.6}>{Math.round(val)}</text>
          </g>
        );
      })}
      <line x1={padX} y1={baselineY} x2={width - padX} y2={baselineY} stroke="#C8960C" strokeWidth={1} strokeDasharray="6 4" opacity={0.5} />
      <path d={linePath} fill="none" stroke="#C8960C" strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#C8960C" stroke="#1A3A5C" strokeWidth={1.5} />
      ))}
      {points.map((p, i) => (
        <text key={`l${i}`} x={p.x} y={height - 6} textAnchor="middle" fill="#E8E4DC" fontSize={9} opacity={0.6}>{p.turn}</text>
      ))}
    </svg>
  );
}

// ── Season Postmortem ──

interface PostmortemProps {
  resolvedEvents: ResolvedEvent[];
  eventNameMap: Record<string, string>;
  directors: GameState['directors'];
  isMeridian: boolean;
  allEvents: import('@/types/game').GameEvent[];
  directorDynamics: GameState['directorDynamics'];
}

function buildDomainPattern(
  resolvedEvents: ResolvedEvent[],
  directors: GameState['directors']
): { domain: CompetencyDomain; label: string; boardAvg: number; eventDemand: number; weakEvents: number } | null {
  if (resolvedEvents.length < 3) return null;

  // Tally domain demand across all fired events (using breakdown data)
  const domainDemand: Partial<Record<CompetencyDomain, number>> = {};
  let eventsWithBreakdown = 0;
  for (const ev of resolvedEvents) {
    if (!ev.breakdown) continue;
    eventsWithBreakdown++;
    const { primaryDomain, strategyMultiplier } = ev.breakdown;
    domainDemand[primaryDomain] = (domainDemand[primaryDomain] ?? 0) + strategyMultiplier;
  }
  if (eventsWithBreakdown < 3) return null;

  // Board average per domain
  const boardAvg = (domain: CompetencyDomain): number => {
    if (directors.length === 0) return 0;
    return Math.round(
      directors.reduce((s, d) => s + (d.domainRatings[domain] ?? 0), 0) / directors.length
    );
  };

  // Find the weakest board domain that also had high event demand
  let worstGap = 0;
  let worstDomain: CompetencyDomain | null = null;
  for (const [domain, demand] of Object.entries(domainDemand) as [CompetencyDomain, number][]) {
    const avg = boardAvg(domain);
    if (avg > 60) continue; // not actually weak
    const gap = demand * (60 - avg); // demand-weighted weakness
    if (gap > worstGap) {
      worstGap = gap;
      worstDomain = domain;
    }
  }

  if (!worstDomain) return null;

  // Count events where this was the primary domain AND outcome was FAILURE or CRITICAL_FAILURE or PARTIAL_SUCCESS
  const weakEvents = resolvedEvents.filter(
    (ev) =>
      ev.breakdown?.primaryDomain === worstDomain &&
      (ev.outcomeTier === 'FAILURE' || ev.outcomeTier === 'CRITICAL_FAILURE' || ev.outcomeTier === 'PARTIAL_SUCCESS')
  ).length;

  const totalDomainEvents = resolvedEvents.filter(
    (ev) => ev.breakdown?.primaryDomain === worstDomain
  ).length;

  // Only surface it if there were at least 2 events in this domain and >50% were weak
  if (totalDomainEvents < 2 || weakEvents < 2) return null;

  return {
    domain: worstDomain,
    label: DOMAIN_LABELS[worstDomain] ?? worstDomain,
    boardAvg: boardAvg(worstDomain),
    eventDemand: totalDomainEvents,
    weakEvents,
  };
}

function SeasonPostmortem({ resolvedEvents, eventNameMap, directors, isMeridian, allEvents, directorDynamics }: PostmortemProps) {
  const [open, setOpen] = useState(false);
  const [debriefTarget, setDebriefTarget] = useState<'best' | 'worst' | null>(null);
  const valueLabel = isMeridian ? 'mission integrity' : 'shareholder value';

  if (resolvedEvents.length === 0) return null;

  const sorted = [...resolvedEvents].sort((a, b) => b.svDelta - a.svDelta);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const bestName = eventNameMap[best.eventId] ?? best.eventId;
  const worstName = eventNameMap[worst.eventId] ?? worst.eventId;

  const pattern = buildDomainPattern(resolvedEvents, directors);

  // Generate debrief narratives for best/worst
  const getDebriefNarrative = (re: ResolvedEvent): string => {
    const fullEvent = allEvents.find((e) => e.id === re.eventId);
    if (!fullEvent || !re.breakdown) return 'No detailed analysis available for this event.';
    const deployedDirs = directors.filter((d) => re.deployedDirectorIds.includes(d.id));
    const output: import('@/types/game').ResolutionOutput = {
      outcomeTier: re.outcomeTier,
      finalScore: 0,
      svDelta: re.svDelta,
      narrativeText: '',
      energyUpdates: [],
      followOnEvents: [],
      wildcard: false,
      breakdown: re.breakdown,
    };
    return generateDebrief(output, deployedDirs, fullEvent, directorDynamics);
  };

  // If nothing interesting to say, don't show the section
  const hasWorstInfo = worst.svDelta < -0.5;
  const hasBestInfo = best.svDelta > 0.5;
  if (!hasBestInfo && !hasWorstInfo && !pattern) return null;

  return (
    <motion.div
      className="bg-card-bg border border-card-border rounded-lg p-5 mb-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.55, duration: 0.5 }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide">
          Season Analysis
        </h3>
        <span className="text-foreground/40 text-sm">{open ? '↑ Collapse' : '↓ Expand'}</span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.25 }}
          className="mt-4 space-y-4"
        >
          {hasBestInfo && (
            <div>
              <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">Strongest outcome</p>
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-foreground">{bestName}</span>
                {' '}—{' '}
                {OUTCOME_LABELS[best.outcomeTier] ?? best.outcomeTier.replace('_', ' ')},{' '}
                adding {best.svDelta.toFixed(1)} to {valueLabel}
                {(best.breakdown?.committeeBonus ?? 0) > 0 ? ', aided by an active and properly chaired committee' : ''}
                {best.breakdown && !best.breakdown.isDoNothing && best.breakdown.directorContributions.length > 0
                  ? ` — the right expertise was in the room`
                  : ''}.
              </p>
              <button
                onClick={() => setDebriefTarget('best')}
                className="mt-1 text-xs text-gold/70 hover:text-gold underline cursor-pointer bg-transparent border-none"
              >
                The Debrief →
              </button>
            </div>
          )}

          {hasWorstInfo && (
            <div>
              <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">Weakest outcome</p>
              <p className="text-sm text-foreground/80">
                <span className="font-semibold text-foreground">{worstName}</span>
                {' '}—{' '}
                {OUTCOME_LABELS[worst.outcomeTier] ?? worst.outcomeTier.replace('_', ' ')},{' '}
                costing {Math.abs(worst.svDelta).toFixed(1)} in {valueLabel}
                {worst.breakdown?.fallbackTriggered ? ', with the board falling back to a weaker approach than intended' : ''}
                {worst.breakdown && !worst.breakdown.isDoNothing && !worst.breakdown.fallbackTriggered
                  ? ' — a mismatch between the event\'s demands and who was sent'
                  : ''}.
              </p>
              <button
                onClick={() => setDebriefTarget('worst')}
                className="mt-1 text-xs text-gold/70 hover:text-gold underline cursor-pointer bg-transparent border-none"
              >
                The Debrief →
              </button>
            </div>
          )}

          {pattern && (
            <div>
              <p className="text-xs text-foreground/50 uppercase tracking-wide mb-1">Roster pattern</p>
              <p className="text-sm text-foreground/80">
                The board was consistently light on{' '}
                <span className="font-semibold text-foreground">{pattern.label}</span>{' '}
                expertise all season — this was a factor in {pattern.weakEvents} of the {pattern.eventDemand} events where it mattered most.{' '}
                A stronger bench in this area would have changed several of those outcomes.
              </p>
            </div>
          )}

          <AnimatePresence>
            {debriefTarget !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] flex flex-col bg-[#070f1a]/97"
              >
                <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-card-border">
                  <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">The Debrief</p>
                  <p className="text-gold-dim text-sm">{debriefTarget === 'best' ? bestName : worstName}</p>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  <p className="font-narrative italic text-foreground/80 text-base leading-relaxed">
                    {getDebriefNarrative(debriefTarget === 'best' ? best : worst)}
                  </p>
                </div>
                <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-card-border">
                  <button
                    onClick={() => setDebriefTarget(null)}
                    className="w-full py-4 rounded-xl bg-gold/10 border border-gold/40 hover:bg-gold/20 transition-colors text-gold font-semibold text-base cursor-pointer"
                  >
                    Continue →
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}

// ── Leaderboard Modal ──

function LeaderboardModal({ isOpen, onClose, currentEntryId }: { isOpen: boolean; onClose: () => void; currentEntryId: string | null }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) setEntries(getLeaderboard());
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-navy border border-card-border rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-narrative font-bold text-gold">Leaderboard</h2>
          <button onClick={onClose} className="text-foreground/40 hover:text-foreground text-xl cursor-pointer">&times;</button>
        </div>

        {entries.length === 0 ? (
          <p className="text-foreground/50 text-center py-8 italic">No completed games yet. Play your first game to see results here.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-foreground/50 font-medium py-2 pr-2">#</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-3">Company</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">SV</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">GH</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-3">Title</th>
                <th className="text-right text-foreground/50 font-medium py-2 pr-3">Events</th>
                <th className="text-right text-foreground/50 font-medium py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => {
                const isCurrentGame = entry.id === currentEntryId;
                const isNewBest = i === 0 && isCurrentGame;
                return (
                  <tr key={entry.id} className={`border-b border-card-border/30 ${isCurrentGame ? 'bg-gold/10' : ''}`}>
                    <td className={`py-2 pr-2 font-bold ${isNewBest ? 'text-gold' : 'text-foreground/60'}`}>{i + 1}</td>
                    <td className={`py-2 pr-3 ${isCurrentGame ? 'text-gold font-semibold' : 'text-foreground'}`}>{entry.companyName}</td>
                    <td className={`text-right py-2 pr-3 font-bold ${entry.finalSv > 100 ? 'text-success' : entry.finalSv >= 80 ? 'text-gold' : 'text-error'}`}>{entry.finalSv}</td>
                    <td className={`text-right py-2 pr-3 ${entry.governanceHealth >= 70 ? 'text-success' : entry.governanceHealth >= 40 ? 'text-warning' : 'text-error'}`}>{entry.governanceHealth}</td>
                    <td className="py-2 pr-3 text-foreground/70 text-xs">{entry.careerTitle}</td>
                    <td className="text-right py-2 pr-3 text-foreground/60">{entry.eventsResolved}</td>
                    <td className="text-right py-2 text-foreground/50 text-xs">{new Date(entry.datePlayed).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        <div className="flex items-center justify-between mt-6">
          <button onClick={onClose} className="text-sm text-foreground/50 hover:text-foreground transition-colors cursor-pointer">&larr; Back</button>
          {entries.length > 0 && (
            showClearConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-error">Clear all history?</span>
                <button onClick={() => { clearLeaderboard(); setEntries([]); setShowClearConfirm(false); }} className="text-xs bg-error/20 text-error px-3 py-1 rounded hover:bg-error/30 cursor-pointer">Yes, clear</button>
                <button onClick={() => setShowClearConfirm(false)} className="text-xs text-foreground/50 px-3 py-1 rounded hover:text-foreground cursor-pointer">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowClearConfirm(true)} className="text-xs text-foreground/40 hover:text-error transition-colors cursor-pointer">Clear History</button>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ──

export default function YearEndScreen({ gameState, onRestart, onChangeCompany, agmResults }: YearEndScreenProps) {
  // Play year-end sound on mount
  useEffect(() => { playYearEnd(gameState.svIndex); }, []);

  const isMeridian = gameState.company.id === 'company_meridian';
  const metricLabel = isMeridian ? 'MIS' : 'SV Index';
  const metricFullLabel = isMeridian ? 'Mission Integrity Score' : 'SV Index';
  const svHistory = getSvHistory(gameState);
  const proxyRating = getProxyAdviserRating(gameState.governanceHealth);
  const allEventsData = getAllEvents();
  const eventNameMap = Object.fromEntries(allEventsData.map((e) => [e.id, e.name]));
  const startingSv = gameState.company.startingSvIndex;
  const svDelta = gameState.svIndex - startingSv;
  const svDeltaPercent = ((svDelta / startingSv) * 100).toFixed(1);
  const breakdown = gameState.governanceHealthBreakdown;

  // ── Governance Capital calculation & persistence ──
  const recorded = useRef(false);
  const [gcResult, setGcResult] = useState<ReturnType<typeof calculateGameGc> | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;

    const gc = calculateGameGc(gameState);
    setGcResult(gc);

    // Record to career stats
    const stats = recordGameResult(gameState, gc.totalGc);
    setCareerStats(stats);

    // Add to leaderboard
    const entryId = `game_${Date.now()}`;
    setCurrentEntryId(entryId);
    addLeaderboardEntry({
      id: entryId,
      companyId: gameState.company.id,
      companyName: gameState.company.name,
      finalSv: gameState.svIndex,
      governanceHealth: gameState.governanceHealth,
      careerTitle: getCareerTitle(stats.totalGc),
      eventsResolved: gameState.resolvedEvents.length,
      gcEarned: gc.totalGc,
      datePlayed: new Date().toISOString(),
    });
  }, [gameState]);

  return (
    <div className="min-h-screen bg-navy px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Change Company - subtle top-left */}
        {onChangeCompany && (
          <button onClick={onChangeCompany} className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors mb-4 cursor-pointer">
            &larr; Change Company
          </button>
        )}

        {/* Contextual Header Image */}
        <div className="w-full mb-6 relative rounded-lg overflow-hidden" style={{ height: 200 }}>
          <img
            src={gameState.svIndex > 105 ? '/images/year-end-success.jpg' : gameState.svIndex < 95 ? '/images/year-end-failure.jpg' : '/images/year-end-neutral.jpg'}
            alt="Year End"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,27,42,0.2) 0%, rgba(13,27,42,0.8) 100%)' }} />
        </div>

        {/* Header */}
        <motion.h1
          className="text-3xl md:text-4xl font-narrative font-bold text-gold text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Year End Summary - {gameState.company.name}
        </motion.h1>

        {/* Three metric cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-card-bg border border-card-border rounded-lg p-5 text-center">
            <h3 className="text-xs uppercase tracking-wide text-foreground/50 mb-2">Final {metricLabel}</h3>
            <span className={`text-5xl font-bold ${getSvColor(gameState.svIndex)}`}>{gameState.svIndex}</span>
            <div className={`text-sm font-medium mt-1 ${svDelta >= 0 ? 'text-success' : 'text-error'}`}>
              {svDelta >= 0 ? '+' : ''}{svDeltaPercent}%
            </div>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-5 text-center">
            <h3 className="text-xs uppercase tracking-wide text-foreground/50 mb-2">Final Governance Health</h3>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-5xl font-bold ${getGhColor(gameState.governanceHealth)}`}>{gameState.governanceHealth}</span>
              <span className="text-foreground/50 text-lg">/100</span>
            </div>
            <div className="w-full bg-navy-dark rounded-full h-3 mt-3">
              <div className={`h-3 rounded-full transition-all ${getGhBarColor(gameState.governanceHealth)}`} style={{ width: `${Math.min(gameState.governanceHealth, 100)}%` }} />
            </div>
          </div>

          <div className="bg-card-bg border border-card-border rounded-lg p-5 text-center">
            <h3 className="text-xs uppercase tracking-wide text-foreground/50 mb-2">{isMeridian ? 'Governance Assessor Rating' : 'Proxy Adviser Rating'}</h3>
            <span className={`text-lg font-bold font-narrative ${getProxyColor(proxyRating)}`}>{proxyRating}</span>
          </div>
        </motion.div>

        {/* Year End Analysis */}
        <YearEndAnalysis
          gameState={gameState}
          eventNameMap={eventNameMap}
          careerStats={careerStats}
          agmResults={agmResults}
        />

        {/* Governance Capital Earned */}
        {gcResult && careerStats && (
          <motion.div
            className="bg-card-bg border-2 border-gold/40 rounded-lg p-6 mb-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide mb-4">Governance Capital Earned</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* This Game */}
              <div className="text-center">
                <div className="text-xs text-foreground/50 uppercase tracking-wide mb-1">This Game</div>
                <div className="text-4xl font-bold text-gold">+{gcResult.totalGc}</div>
                <div className="text-xs text-foreground/50 mt-1">GC</div>
                <div className="mt-3 space-y-1">
                  {gcResult.breakdown.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-foreground/50">{item.label}</span>
                      <span className={item.value >= 0 ? 'text-success font-semibold' : 'text-error font-semibold'}>
                        {item.value >= 0 ? '+' : ''}{item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Career Total */}
              <div className="text-center border-t border-b md:border-t-0 md:border-b-0 md:border-l md:border-r border-card-border py-4 md:py-0 px-4">
                <div className="text-xs text-foreground/50 uppercase tracking-wide mb-1">Career Total</div>
                <div className="text-4xl font-bold text-gold">{careerStats.totalGc}</div>
                <div className="text-xs text-foreground/50 mt-1">GC</div>
                <div className="mt-3">
                  <span className="inline-block px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-sm font-semibold font-narrative">
                    {getCareerTitle(careerStats.totalGc)}
                  </span>
                </div>
              </div>

              {/* Career Stats */}
              <div>
                <div className="text-xs text-foreground/50 uppercase tracking-wide mb-3 text-center">Career Stats</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Games Played</span>
                    <span className="text-foreground font-semibold">{careerStats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Average SV</span>
                    <span className="text-foreground font-semibold">
                      {careerStats.gamesPlayed > 0 ? Math.round(careerStats.totalSvAchieved / careerStats.gamesPlayed) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Best SV</span>
                    <span className="text-success font-semibold">{careerStats.bestSv}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Total GC</span>
                    <span className="text-gold font-semibold">{careerStats.totalGc}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SV History Chart */}
        <motion.div
          className="bg-card-bg border border-card-border rounded-lg p-5 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide mb-4">{metricFullLabel} History</h3>
          <div className="flex justify-center">
            <SvSparkline data={svHistory} />
          </div>
        </motion.div>

        {/* Event Resolution Summary Table */}
        <motion.div
          className="bg-card-bg border border-card-border rounded-lg p-5 mb-10 overflow-x-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide mb-4">Event Resolution Summary</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                <th className="text-left text-foreground/50 font-medium py-2 pr-4">Event</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-4">Quarter</th>
                <th className="text-left text-foreground/50 font-medium py-2 pr-4">Outcome</th>
                <th className="text-right text-foreground/50 font-medium py-2">{isMeridian ? 'MIS Impact' : 'SV Impact'}</th>
              </tr>
            </thead>
            <tbody>
              {gameState.resolvedEvents.map((ev: ResolvedEvent) => {
                const colors = OUTCOME_COLORS[ev.outcomeTier] || { bg: 'bg-foreground/20', text: 'text-foreground' };
                return (
                  <tr key={ev.eventId} className="border-b border-card-border/50">
                    <td className="text-foreground py-2 pr-4">{eventNameMap[ev.eventId] ?? ev.eventId}</td>
                    <td className="text-foreground/70 py-2 pr-4">{ev.resolvedAtQuarter} T{ev.resolvedAtTurn}</td>
                    <td className="py-2 pr-4">
                      <span className={`${colors.bg} ${colors.text} text-xs font-bold px-2 py-0.5 rounded-full`}>
                        {OUTCOME_LABELS[ev.outcomeTier] || ev.outcomeTier}
                      </span>
                    </td>
                    <td className={`text-right py-2 font-bold ${ev.svDelta >= 0 ? 'text-success' : 'text-error'}`}>
                      {ev.svDelta >= 0 ? '+' : ''}{ev.svDelta.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>

        {/* Governance Health Breakdown */}
        <motion.div
          className="bg-card-bg border border-card-border rounded-lg p-5 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h3 className="text-gold font-narrative font-bold text-sm uppercase tracking-wide mb-4">Governance Health Breakdown</h3>
          <div className="flex flex-col gap-3">
            {(Object.keys(BREAKDOWN_LABELS) as Array<keyof Omit<GovernanceHealthBreakdown, 'total'>>).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-foreground/70 w-48 shrink-0">{BREAKDOWN_LABELS[key]}</span>
                <span className="text-sm text-gold font-bold w-10 text-right">{breakdown[key]}</span>
                <span className="text-sm text-foreground/50">/20</span>
                <div className="flex-1 bg-navy-dark rounded-full h-3">
                  <motion.div className="bg-gold-light h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${(breakdown[key] / 20) * 100}%` }} transition={{ duration: 0.8, delay: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col items-center gap-4 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <div className="flex gap-4">
            <button
              onClick={onRestart}
              className="px-8 py-4 rounded-lg bg-gold text-navy-dark font-bold text-lg hover:bg-gold-light transition-colors cursor-pointer"
            >
              Same Company
            </button>
            {onChangeCompany && (
              <button
                onClick={onChangeCompany}
                className="px-8 py-4 rounded-lg border border-gold/50 text-gold font-bold text-lg hover:bg-gold/10 transition-colors cursor-pointer"
              >
                New Company
              </button>
            )}
          </div>
          <button
            onClick={() => setShowLeaderboard(true)}
            className="px-8 py-2 rounded-lg border border-gold/40 text-gold text-sm font-semibold hover:bg-gold/10 transition-colors cursor-pointer"
          >
            Leaderboard
          </button>
        </motion.div>
      </div>

      {/* Leaderboard Modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            currentEntryId={currentEntryId}
          />
        )}
      </AnimatePresence>

      {/* Copyright — pinned on desktop; in-flow on mobile so it never overlaps content */}
      <div className="hidden md:block">
        <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
      </div>
      <SiteFooter className="md:hidden mt-10 pb-2" />
    </div>
  );
}
