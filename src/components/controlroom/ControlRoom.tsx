'use client';

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameState, OutcomeTier } from '@/types/game';
import { events as allEvents } from '@/data/events';
import { getSvHistory, getProxyAdviserRating } from '@/engine/gameStateManager';
import { agmForecast } from '@/engine/agm';
import { roleLabel } from '@/engine/boardEffects';
import DirectorPortrait from '@/components/DirectorPortrait';
import CompanyLogo from '@/components/CompanyLogo';
import { playZoomWhoosh, playCardDeal } from '@/engine/soundEngine';
import './controlroom.css';

/**
 * The control room: the player at their desk, laptop open, everything about
 * the year on one screen. No 3D here — the backdrop is a still rendered from
 * the office scene, so it opens instantly however often it is used.
 */

const TIER: Record<OutcomeTier, { label: string; color: string }> = {
  CRITICAL_SUCCESS: { label: 'EXEMPLARY', color: '#4ADE80' },
  SUCCESS: { label: 'SOUND', color: '#86EFAC' },
  PARTIAL_SUCCESS: { label: 'MIXED', color: '#F5C451' },
  FAILURE: { label: 'POOR', color: '#F87171' },
  CRITICAL_FAILURE: { label: 'DAMAGING', color: '#EF4444' },
};

type Tone = 'good' | 'warn' | 'bad' | 'neutral';
const TONE: Record<Tone, string> = { good: '#4ADE80', warn: '#F5C451', bad: '#F87171', neutral: '#9FB3C8' };

interface Watch { label: string; value: string; tone: Tone; level?: number }

/** What the board should be keeping an eye on, company by company. */
function watchList(s: GameState): { title: string; items: Watch[] } {
  const tier = (id: string) => s.resolvedEvents.find((r) => r.eventId === id)?.outcomeTier;
  const bad = (t?: OutcomeTier) => t === 'FAILURE' || t === 'CRITICAL_FAILURE';
  switch (s.company.id) {
    case 'company_vantage': {
      const lvl = !s.apexActive ? 0 : s.apexStatus === 'hostile' ? 3 : s.apexStatus === 'escalating' ? 2 : 1;
      return {
        title: 'Activist watch',
        items: [
          { label: 'Apex Capital', value: ['Stood down', 'Watching', 'Escalating', 'Hostile'][lvl], tone: (['good', 'neutral', 'warn', 'bad'] as Tone[])[lvl], level: lvl / 3 },
          { label: 'Chair / CEO separation', value: `${Math.round(s.chairCeoSeparationProgress)}%`, tone: s.chairCeoSeparationProgress >= 50 ? 'good' : 'warn', level: s.chairCeoSeparationProgress / 100 },
          { label: 'Board tension', value: `${Math.round(s.boardTension)}`, tone: s.boardTension > 60 ? 'bad' : s.boardTension > 30 ? 'warn' : 'good', level: s.boardTension / 100 },
        ],
      };
    }
    case 'company_rheinfeld': {
      const lvl = !s.meridianActive ? 0 : s.meridianStatus === 'hostile' ? 3 : s.meridianStatus === 'escalating' ? 2 : 1;
      return {
        title: 'Activist and works council',
        items: [
          { label: 'Meridian Capital', value: ['Stood down', 'Watching', 'Escalating', 'Hostile'][lvl], tone: (['good', 'neutral', 'warn', 'bad'] as Tone[])[lvl], level: lvl / 3 },
          { label: 'Worker representatives', value: s.workerRepRelations[0].toUpperCase() + s.workerRepRelations.slice(1), tone: s.workerRepRelations === 'cooperative' ? 'good' : s.workerRepRelations === 'hostile' ? 'bad' : 'neutral' },
          { label: 'CSRD readiness', value: `${Math.round(s.csrdProgress)}%`, tone: s.csrdProgress >= 60 ? 'good' : s.csrdProgress >= 30 ? 'warn' : 'bad', level: s.csrdProgress / 100 },
          { label: 'Chair\'s side-deal', value: s.heinrichConflictRevealed ? 'Public' : 'Not public', tone: s.heinrichConflictRevealed ? 'bad' : 'neutral' },
        ],
      };
    }
    case 'company_meridian':
      return {
        title: 'Regulator and reserves',
        items: [
          { label: 'Charity Commission', value: s.charityCommissionInquiryActive ? 'Statutory inquiry open' : 'No inquiry', tone: s.charityCommissionInquiryActive ? 'bad' : 'good' },
          { label: 'Solvency', value: s.solvencyRisk ? 'Formal concern' : 'Stable', tone: s.solvencyRisk ? 'bad' : 'good' },
          { label: 'Founder on the board', value: s.board.seats.some((x) => x.directorId === 'mdir_osei_bonsu') ? (s.board.seats.some((x) => x.directorId === 'mdir_osei_bonsu' && x.role === 'chair') ? 'In the chair' : 'Yes') : 'No', tone: s.board.seats.some((x) => x.directorId === 'mdir_osei_bonsu' && x.role === 'chair') ? 'bad' : 'neutral' },
          { label: 'Board tension', value: `${Math.round(s.boardTension)}`, tone: s.boardTension > 60 ? 'bad' : s.boardTension > 30 ? 'warn' : 'good', level: s.boardTension / 100 },
        ],
      };
    case 'company_sfg':
      return {
        title: 'MAS and Temasek watch',
        items: [
          { label: 'Audit Committee chair', value: s.acChairVacant ? 'Vacant' : 'Filled', tone: s.acChairVacant ? 'bad' : 'good' },
          { label: 'CEO investigation', value: s.ceoWhistleblower === 'substantiated' ? 'Breach found' : s.ceoWhistleblower === 'cleared' ? 'Closed' : 'Open', tone: s.ceoWhistleblower === 'substantiated' ? 'bad' : s.ceoWhistleblower === 'cleared' ? 'neutral' : 'warn' },
          { label: 'Chair also chairs Risk', value: s.committees.risk?.chairDirectorId === 'sfgdir_01_lim' ? 'Yes' : 'No', tone: s.committees.risk?.chairDirectorId === 'sfgdir_01_lim' ? 'warn' : 'good' },
          { label: 'Temasek nominees', value: `${s.board.seats.filter((x) => x.directorId === 'sfgdir_05_png' || x.directorId === 'sfgdir_27_phua').length}`, tone: s.board.seats.some((x) => x.directorId === 'sfgdir_27_phua') ? 'warn' : 'neutral' },
        ],
      };
    default: {
      const e4 = tier('event_04'), e10 = tier('event_10'), e15 = tier('event_15');
      const lvl = e15 ? (bad(e15) ? 3 : 0) : e10 ? (bad(e10) ? 3 : 1) : e4 ? (bad(e4) ? 2 : 1) : 1;
      return {
        title: 'Activist watch',
        items: [
          { label: 'Greenvale Capital', value: ['Stood down', 'Watching', 'Escalating', 'Hostile'][lvl], tone: (['good', 'neutral', 'warn', 'bad'] as Tone[])[lvl], level: lvl / 3 },
          { label: 'Energy Transition Committee', value: s.committees.energyTransition.active ? 'In place' : 'Not formed', tone: s.committees.energyTransition.active ? 'good' : 'warn' },
          { label: 'Board tension', value: `${Math.round(s.boardTension)}`, tone: s.boardTension > 60 ? 'bad' : s.boardTension > 30 ? 'warn' : 'good', level: s.boardTension / 100 },
        ],
      };
    }
  }
}

function Chart({ data, start }: { data: { turn: string; sv: number }[]; start: number }) {
  const W = 640, H = 210, L = 38, R = 14, T = 14, B = 26;
  const vals = data.map((d) => d.sv).concat(start);
  const lo = Math.floor((Math.min(...vals) - 4) / 5) * 5;
  const hi = Math.ceil((Math.max(...vals) + 4) / 5) * 5;
  const x = (i: number) => L + (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - L - R));
  const y = (v: number) => T + (1 - (v - lo) / Math.max(1, hi - lo)) * (H - T - B);
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.sv).toFixed(1)}`);
  const up = data[data.length - 1].sv >= start;
  const stroke = up ? '#4ADE80' : '#F87171';
  const ticks = [lo, lo + (hi - lo) / 2, hi];
  const last = data.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Score over the year">
      <defs>
        <linearGradient id="cr-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="rgba(159,179,200,0.14)" />
          <text x={L - 7} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#7F93A8" className="cr-mono">{Math.round(t)}</text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={y(start)} y2={y(start)} stroke="#C9A227" strokeDasharray="3 4" opacity="0.7" />
      <text x={W - R} y={y(start) - 5} textAnchor="end" fontSize="9" fill="#C9A227" className="cr-mono">START {start}</text>
      {data.length > 1 && (
        <>
          <polygon points={`${x(0)},${H - B} ${pts.join(' ')} ${x(last)},${H - B}`} fill="url(#cr-fill)" />
          <motion.polyline
            points={pts.join(' ')} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
          />
        </>
      )}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.sv)} r={i === last ? 4 : 2} fill={i === last ? stroke : '#0B1420'} stroke={stroke} strokeWidth="1.2" />
          {(i === 0 || i === last || data.length <= 8 || i % 2 === 0) && (
            <text x={x(i)} y={H - 9} textAnchor="middle" fontSize="9" fill="#7F93A8" className="cr-mono">{d.turn.replace(' T', '.')}</text>
          )}
        </g>
      ))}
      <circle cx={x(last)} cy={y(data[last].sv)} r="9" fill={stroke} opacity="0.18" />
    </svg>
  );
}

function Meter({ level, color }: { level: number; color: string }) {
  return (
    <span className="cr-meter"><span style={{ width: `${Math.max(0, Math.min(1, level)) * 100}%`, background: color }} /></span>
  );
}

export default function ControlRoom({ gameState, isOpen, onClose }: { gameState: GameState; isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    playZoomWhoosh(0.7);
    const t = setTimeout(() => playCardDeal(), 520);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [isOpen, onClose]);

  const s = gameState;
  const isCharity = s.company.id === 'company_meridian';
  const history = useMemo(() => getSvHistory(s), [s]);
  const start = s.company.startingSvIndex;
  const now = history[history.length - 1].sv;
  const delta = Math.round((now - start) * 10) / 10;
  const gb = s.governanceHealthBreakdown;
  const pillars = [
    ['Independence', gb.boardIndependence], ['Committees', gb.committeeCompleteness], ['Leadership', gb.chairCeoSeparation],
    ['Sustainability', gb.esgGovernance], ['Skills', gb.skillMatrixCoverage],
  ] as [string, number][];
  const watch = useMemo(() => watchList(s), [s]);
  const agmHeld = s.resolvedEvents.some((r) => r.resolvedAtQuarter === 'AGM');
  const forecast = useMemo(() => (agmHeld ? [] : agmForecast(s)), [s, agmHeld]);
  const played = s.resolvedEvents.filter((r) => r.strategyChosen !== 'auto');
  const deployCount = (id: string) => played.filter((r) => r.deployedDirectorIds.includes(id)).length;
  const log = [...played].reverse();
  const schedule = [...s.company.eventSchedule];
  const order = ['Q1', 'Q2', 'AGM', 'Q3', 'Q4'];
  const ghColor = s.governanceHealth >= 70 ? TONE.good : s.governanceHealth >= 50 ? TONE.warn : TONE.bad;
  const ring = 2 * Math.PI * 34;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="cr-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
          <motion.div className="cr-backdrop" initial={{ scale: 1 }} animate={{ scale: 1.22 }} exit={{ scale: 1 }} transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }} />
          <div className="cr-shade" onClick={onClose} />

          <motion.div
            className="cr-laptop"
            initial={{ scale: 0.32, y: 90, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.5, y: 60, opacity: 0 }}
            transition={{ duration: 0.62, ease: [0.2, 0.75, 0.2, 1] }}
            role="dialog" aria-label="Governance terminal"
          >
            <div className="cr-screen">
              {/* Top bar */}
              <header className="cr-top">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CompanyLogo companyId={s.company.id} size={26} />
                  <span className="cr-title truncate">{s.company.name}</span>
                  <span className="cr-tag hidden md:inline">GOVERNANCE TERMINAL</span>
                </div>
                <div className="hidden md:flex items-center gap-3">
                  {order.map((q) => {
                    const turns = schedule.filter((e) => e.quarter === q).length;
                    const doneQ = order.indexOf(q) < order.indexOf(s.currentQuarter);
                    const current = q === s.currentQuarter;
                    return (
                      <span key={q} className="flex items-center gap-1">
                        <span className="cr-q" style={{ color: current ? '#E8C766' : doneQ ? '#9FB3C8' : '#4B6076' }}>{q}</span>
                        {Array.from({ length: turns }).map((_, i) => (
                          <span key={i} className="cr-dot" style={{ background: doneQ || (current && i + 1 < s.currentTurn) ? '#9FB3C8' : current && i + 1 === s.currentTurn ? '#E8C766' : 'rgba(159,179,200,0.18)' }} />
                        ))}
                      </span>
                    );
                  })}
                </div>
                <button onClick={onClose} className="cr-close" aria-label="Close terminal">ESC ✕</button>
              </header>

              <div className="cr-grid">
                {/* Score */}
                <section className="cr-panel cr-a">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="cr-label">{isCharity ? 'Mission integrity score' : 'Shareholder value index'}</p>
                      <p className="cr-big">{now}<span className="cr-delta" style={{ color: delta >= 0 ? TONE.good : TONE.bad }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}</span></p>
                    </div>
                    <p className="cr-label text-right">{played.length} decisions<br />{played.filter((r) => r.outcomeTier === 'SUCCESS' || r.outcomeTier === 'CRITICAL_SUCCESS').length} went well</p>
                  </div>
                  <Chart data={history} start={start} />
                </section>

                {/* Governance health */}
                <section className="cr-panel cr-b">
                  <p className="cr-label">Governance health</p>
                  <div className="flex items-center gap-4 mt-1.5">
                    <svg viewBox="0 0 84 84" width="84" height="84" className="shrink-0">
                      <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(159,179,200,0.16)" strokeWidth="7" />
                      <motion.circle cx="42" cy="42" r="34" fill="none" stroke={ghColor} strokeWidth="7" strokeLinecap="round" transform="rotate(-90 42 42)"
                        strokeDasharray={ring} initial={{ strokeDashoffset: ring }} animate={{ strokeDashoffset: ring * (1 - s.governanceHealth / 100) }} transition={{ duration: 0.9, delay: 0.3 }} />
                      <text x="42" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="#EAF1F8" className="cr-mono">{Math.round(s.governanceHealth)}</text>
                    </svg>
                    <p className="text-[12px] leading-snug" style={{ color: ghColor }}>{getProxyAdviserRating(s.governanceHealth)}</p>
                  </div>
                  <div className="mt-3 grid gap-1.5">
                    {pillars.map(([name, v]) => (
                      <div key={name} className="cr-row">
                        <span className="truncate">{name}</span>
                        <Meter level={v / 20} color={v >= 14 ? TONE.good : v >= 8 ? TONE.warn : TONE.bad} />
                        <span className="cr-mono text-right">{Math.round(v)}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Watch list */}
                <section className="cr-panel cr-c">
                  <p className="cr-label">{watch.title}</p>
                  <div className="mt-2 grid gap-2.5">
                    {watch.items.map((w) => (
                      <div key={w.label}>
                        <div className="flex items-baseline justify-between gap-2 text-[12.5px]">
                          <span className="text-[#B8C7D6] truncate">{w.label}</span>
                          <span className="font-bold shrink-0" style={{ color: TONE[w.tone] }}>{w.value}</span>
                        </div>
                        {w.level !== undefined && <div className="mt-1"><Meter level={w.level} color={TONE[w.tone]} /></div>}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Board */}
                <section className="cr-panel cr-d">
                  <p className="cr-label">The board · stamina and workload</p>
                  <div className="mt-2 grid gap-1.5">
                    {s.board.seats.map((seat) => {
                      const d = s.directors.find((x) => x.id === seat.directorId);
                      if (!d) return null;
                      const e = Math.round(d.currentEnergy);
                      const c = e >= 60 ? TONE.good : e >= 30 ? TONE.warn : TONE.bad;
                      return (
                        <div key={seat.directorId} className="cr-dir">
                          <DirectorPortrait directorId={d.id} size={26} className="rounded-full shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-[12.5px] text-[#EAF1F8] leading-tight">{d.name}</p>
                            <p className="truncate text-[10px] text-[#7F93A8] leading-tight">{roleLabel(seat.role, s.company.id)}</p>
                          </div>
                          <Meter level={e / 100} color={c} />
                          <span className="cr-mono text-right" style={{ color: c }}>{e}%</span>
                          <span className="cr-mono text-right text-[#7F93A8]" title="Times deployed">×{deployCount(d.id)}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Decision log */}
                <section className="cr-panel cr-e">
                  <p className="cr-label">Decision log</p>
                  {log.length === 0 ? (
                    <p className="text-[12.5px] text-[#7F93A8] mt-2">Nothing decided yet. The first paper is on the table.</p>
                  ) : (
                    <div className="mt-2 grid gap-1">
                      {log.map((r, i) => {
                        const ev = allEvents.find((e) => e.id === r.eventId);
                        const t = TIER[r.outcomeTier];
                        return (
                          <div key={i} className="cr-log">
                            <span className="cr-mono text-[#7F93A8]">{r.resolvedAtQuarter === 'AGM' ? 'AGM' : `${r.resolvedAtQuarter}.${r.resolvedAtTurn}`}</span>
                            <span className="truncate text-[#D5E0EA]">{ev?.name ?? r.eventId}</span>
                            <span className="cr-chip" style={{ color: t.color }}>{t.label}</span>
                            <span className="cr-mono text-right" style={{ color: r.svDelta >= 0 ? TONE.good : TONE.bad }}>{r.svDelta >= 0 ? '+' : ''}{(Math.round(r.svDelta * 10) / 10).toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* AGM forecast */}
                <section className="cr-panel cr-f">
                  <p className="cr-label">{agmHeld ? 'Annual meeting · result' : 'Annual meeting · if the vote were today'}</p>
                  {agmHeld ? (
                    s.agmVotes && s.agmVotes.length > 0 ? (
                      <div className="mt-2 grid gap-3">
                        {s.agmVotes.map((v) => (
                          <div key={v.title}>
                            <div className="flex items-baseline justify-between gap-2 text-[12px]">
                              <span className="text-[#D5E0EA] leading-snug">{v.title}</span>
                              <span className="cr-chip shrink-0" style={{ color: v.good ? TONE.good : TONE.bad }}>{v.pass ? 'CARRIED' : 'DEFEATED'}</span>
                            </div>
                            <div className="cr-vote mt-1">
                              <span style={{ width: `${v.forPct}%`, background: v.good ? TONE.good : TONE.bad }} />
                              <i />
                            </div>
                            <p className="text-[10px] text-[#7F93A8] mt-0.5">{v.forPct.toFixed(1)}% for · {v.driver}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12.5px] text-[#B8C7D6] mt-2 leading-relaxed">The meeting has been held. The results are in the minutes.</p>
                    )
                  ) : (
                    <div className="mt-2 grid gap-3">
                      {forecast.map((v) => {
                        const good = v.stance === 'against' ? v.forPct <= 50 : v.forPct > 50;
                        return (
                          <div key={v.title}>
                            <div className="flex items-baseline justify-between gap-2 text-[12px]">
                              <span className="text-[#D5E0EA] leading-snug">{v.title}</span>
                              <span className="cr-mono font-bold shrink-0" style={{ color: good ? TONE.good : TONE.bad }}>{v.forPct.toFixed(0)}%</span>
                            </div>
                            <div className="cr-vote mt-1">
                              <span style={{ width: `${v.forPct}%`, background: good ? TONE.good : TONE.bad }} />
                              <i />
                            </div>
                            <p className="text-[10px] text-[#7F93A8] mt-0.5">{v.proposedBy === 'shareholders' ? (v.stance === 'against' ? 'Shareholder motion · board opposes' : v.stance === 'for' ? 'Shareholder motion · board supports' : 'Member motion') : 'Board resolution'}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
            <div className="cr-hinge" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
