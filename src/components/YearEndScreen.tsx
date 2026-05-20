'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, ResolvedEvent, GovernanceHealthBreakdown } from '@/types/game';
import { getSvHistory, getProxyAdviserRating, getAllEvents } from '@/engine/gameStateManager';
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

interface YearEndScreenProps {
  gameState: GameState;
  onRestart: () => void;
  onChangeCompany?: () => void;
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

export default function YearEndScreen({ gameState, onRestart, onChangeCompany }: YearEndScreenProps) {
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
              <div className="text-center border-l border-r border-card-border px-4">
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

        {/* Narrative Assessment */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p className="font-narrative italic text-foreground/80 text-lg leading-relaxed max-w-3xl mx-auto">
            {generateVerdict(gameState, careerStats ? getCareerTitle(careerStats.totalGc) : 'Board Apprentice', eventNameMap)}
          </p>
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

      <SiteFooter className="fixed bottom-4 right-4 z-10" />
    </div>
  );
}
