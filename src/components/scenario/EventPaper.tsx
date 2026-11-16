'use client';

import { useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEvent, Director, BoardSeat, StrategyOption } from '@/types/game';
import { DOMAIN_LABELS, DOMAIN_SHORT } from '@/engine/boardConstants';
import DirectorPortrait from '../DirectorPortrait';
import '../boardbuild/boardbuild.css';
import './scenario.css';

/** Ink colours for the competency domains, readable on cream paper. */
const DOMAIN_INK: Record<string, string> = {
  peopleCulture: '#B4761A',
  financialOversight: '#1F7A45',
  regulatoryLegal: '#2F64A0',
  strategyMarkets: '#6E3F92',
  esgSustainability: '#2E7D5B',
  geopoliticalMacro: '#B5561C',
  technologyDigital: '#12766A',
  stakeholderComms: '#A8322B',
};

const TIER_TAB = { 1: '#C8960C', 2: '#D9692F', 3: '#B3261E' } as const;
export const MAX_DEPLOYED = 3;

function impactTag(multiplier: number): { label: string; cls: string } | null {
  if (multiplier >= 1.1) return { label: 'High impact', cls: 'bc-stamp-amber' };
  if (multiplier >= 0.85) return null;
  if (multiplier >= 0.6) return { label: 'Conservative', cls: 'bc-stamp-grey' };
  return { label: 'Passive', cls: 'bc-stamp-grey' };
}

interface EventPaperProps {
  event: GameEvent;
  directors: Director[];
  boardSeats: BoardSeat[];
  companyName: string;
  /** e.g. "Q1 · Item 2 of 4" */
  agendaLine: string;
  /** null while the player is still choosing a resolution */
  selectedStrategyId: string | null;
  deployIds: string[];
  onSelectStrategy: (strategyId: string) => void;
  onDoNothing: () => void;
  onBack: () => void;
  onToggleDirector: (directorId: string) => void;
  onConfirm: () => void;
  /** Touch layout: tighter paper, and directors are chosen from a list on the paper itself */
  touch?: boolean;
  /** The board is in session — hold the buttons */
  busy?: boolean;
}

/**
 * Desktop presentation of an event: a board paper that lands on the desk.
 * Page one sets out the matter and the resolutions; choosing one turns the
 * page to "who takes this on", filled in by picking directors at the table.
 * Presentation only — gating and scoring stay in the engine.
 */
export default function EventPaper({
  event,
  directors,
  boardSeats,
  companyName,
  agendaLine,
  selectedStrategyId,
  deployIds,
  onSelectStrategy,
  onDoNothing,
  onBack,
  onToggleDirector,
  onConfirm,
  touch = false,
  busy = false,
}: EventPaperProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Touch: turning the page starts the new page at its top, not mid-scroll.
  useEffect(() => {
    if (touch && selectedStrategyId) rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [touch, selectedStrategyId]);

  const boardDirectors = useMemo(() => {
    const ids = new Set(boardSeats.map((s) => s.directorId));
    return directors.filter((d) => ids.has(d.id));
  }, [boardSeats, directors]);

  // Same rule as the touch layout's event card: an option is closed when no
  // seated director meets one of its competency gates.
  const gateStatus = useMemo(() => {
    const result: Record<string, { met: boolean; failed: string[] }> = {};
    for (const strategy of event.strategies) {
      const failed: string[] = [];
      for (const gate of strategy.competencyGates) {
        if (!boardDirectors.some((d) => d.domainRatings[gate.domain] >= gate.minimumRating)) {
          failed.push(`Requires ${DOMAIN_LABELS[gate.domain]} ≥ ${gate.minimumRating} — no qualified director on the board`);
        }
      }
      result[strategy.id] = { met: failed.length === 0, failed };
    }
    return result;
  }, [event.strategies, boardDirectors]);

  const domains = [{ domain: event.primaryDomain, weight: event.primaryWeight }, ...event.secondaryDomains];
  const strategy: StrategyOption | null = selectedStrategyId ? event.strategies.find((s) => s.id === selectedStrategyId) ?? null : null;
  const strategyIdx = strategy ? event.strategies.indexOf(strategy) : -1;
  const deployed = deployIds.map((id) => directors.find((d) => d.id === id)).filter((d): d is Director => Boolean(d));
  const labelOf = (id: string) => event.strategies.find((s) => s.id === id)?.label ?? id;
  const noOptions = event.strategies.length === 0;

  return (
    <motion.div
      ref={rootRef}
      initial={{ opacity: 0, y: -50, x: 40, rotate: 3 }}
      animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
      exit={{ opacity: 0, x: 120, rotate: 4 }}
      transition={{ type: 'spring', stiffness: 210, damping: 24 }}
      className="relative mx-auto w-full max-w-[780px] scroll-mt-3"
    >
      <div className="bc-paper-under absolute inset-0 rounded-[3px]" style={{ transform: 'rotate(0.9deg) translate(6px, 7px)' }} />
      <article className={`bc-doc bc-paper sc-paper relative rounded-[3px] overflow-hidden ${touch ? 'pl-6 pr-4 pt-5 pb-5' : 'pl-10 pr-9 pt-7 pb-7'}`}>
        {/* Index tab — colour carries the event tier, as the card border did */}
        <div className="absolute left-0 top-0 bottom-0 w-[7px]" style={{ background: TIER_TAB[event.tier] }} />

        <header className="flex items-baseline justify-between gap-4 pb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Board paper</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-right" style={{ color: 'var(--ink-soft)' }}>
            {companyName} · {agendaLine}
          </p>
        </header>

        <h2 className={`bc-serif leading-[1.12] font-bold ${touch ? 'text-[24px] mt-4' : 'text-[30px] mt-5'}`}>{event.name}</h2>

        {/* What the matter calls on */}
        <div className="mt-4">
          <div className="flex h-[6px] rounded-[1px] overflow-hidden">
            {domains.map(({ domain, weight }) => (
              <div key={domain} style={{ width: `${weight * 100}%`, background: DOMAIN_INK[domain] ?? '#7a5a06' }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
            {domains.map(({ domain, weight }, i) => (
              <span key={domain} className="text-[11px] flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: DOMAIN_INK[domain] ?? '#7a5a06' }} />
                <span className={i === 0 ? 'font-bold' : ''} style={{ color: i === 0 ? 'var(--ink)' : 'var(--ink-soft)' }}>
                  {DOMAIN_LABELS[domain]} {Math.round(weight * 100)}%
                </span>
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {!strategy ? (
            <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}>
              <p className="sc-narrative bc-serif text-[16px] leading-[1.7] mt-5">{event.narrativeCard}</p>

              {noOptions ? (
                <button onClick={onDoNothing} className="sc-confirm mt-6 w-full py-3 rounded-[3px] font-bold text-sm cursor-pointer">
                  {event.name} — Review and continue
                </button>
              ) : (
                <>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] mt-7 mb-2" style={{ color: 'var(--ink-soft)' }}>
                    Resolutions before the board
                  </h3>
                  <div>
                    {event.strategies.map((s, i) => {
                      const status = gateStatus[s.id];
                      const locked = !status?.met;
                      const tag = impactTag(s.multiplier);
                      return (
                        <button
                          key={s.id}
                          onClick={() => !locked && onSelectStrategy(s.id)}
                          disabled={locked}
                          className={`sc-resolution group w-full text-left flex ${touch ? 'gap-3 py-3 pl-1 pr-1' : 'gap-4 py-3.5 pl-2 pr-2'} ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="sc-letter bc-serif shrink-0">{String.fromCharCode(65 + i)}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="bc-serif text-[17px] font-bold leading-snug">{s.label}</span>
                              {tag && <span className={`bc-stamp ${tag.cls} shrink-0 mt-0.5`} style={{ fontSize: 9 }}>{tag.label}</span>}
                            </span>
                            <span className="block text-[13px] leading-[1.55] mt-1" style={{ color: 'var(--ink-soft)' }}>{s.description}</span>
                            {locked && status?.failed.map((msg, k) => (
                              <span key={k} className="block text-[12px] mt-1.5 font-semibold" style={{ color: '#a32222' }}>{msg}</span>
                            ))}
                            {locked && s.fallback && (
                              <span className="block text-[12px] mt-1 italic" style={{ color: '#9a5b00' }}>Will fall back to: {labelOf(s.fallback)}</span>
                            )}
                          </span>
                          {!locked && !touch && <span className="sc-move shrink-0 self-center text-[11px] font-bold uppercase tracking-[0.14em]">{s.isDoNothing ? 'Note' : 'Move'} →</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div key="p2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mt-6 flex gap-4 pb-4" style={{ borderBottom: '1px solid var(--rule)' }}>
                <span className="sc-letter sc-letter-on bc-serif shrink-0">{String.fromCharCode(65 + strategyIdx)}</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'var(--ink-soft)' }}>Resolution moved</p>
                  <p className="bc-serif text-[19px] font-bold leading-snug mt-0.5">{strategy.label}</p>
                  <p className="text-[13px] leading-[1.55] mt-1" style={{ color: 'var(--ink-soft)' }}>{strategy.description}</p>
                </div>
              </div>

              <h3 className="bc-serif text-[20px] font-bold mt-5">Who takes this on?</h3>
              {touch ? (
                <>
                  <p className="text-[13px] mt-1" style={{ color: 'var(--ink-soft)' }}>
                    Tap up to {MAX_DEPLOYED} directors. The number is their{' '}
                    <b style={{ color: DOMAIN_INK[event.primaryDomain] }}>{DOMAIN_LABELS[event.primaryDomain]}</b> rating; the bar is stamina.
                  </p>
                  <ul className="mt-3">
                    {[...boardDirectors]
                      .sort((x, y) => y.domainRatings[event.primaryDomain] - x.domainRatings[event.primaryDomain])
                      .map((d) => {
                        const order = deployIds.indexOf(d.id);
                        const picked = order >= 0;
                        const spent = d.currentEnergy === 0;
                        const blocked = !picked && (spent || deployIds.length >= MAX_DEPLOYED);
                        const rating = d.domainRatings[event.primaryDomain];
                        const role = boardSeats.find((x) => x.directorId === d.id)?.role;
                        return (
                          <li key={d.id}>
                            <button
                              onClick={() => !blocked && !busy && onToggleDirector(d.id)}
                              disabled={blocked || busy}
                              aria-pressed={picked}
                              className={`sc-pick w-full text-left ${picked ? 'sc-pick-on' : ''} ${blocked ? 'opacity-40' : 'cursor-pointer'}`}
                            >
                              <span className="sc-pick-mark bc-serif">{picked ? order + 1 : ''}</span>
                              <span className="shrink-0 rounded-full overflow-hidden" style={{ boxShadow: picked ? '0 0 0 2px #c8960c' : '0 0 0 1px var(--rule)' }}>
                                <DirectorPortrait directorId={d.id} size={38} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block bc-serif text-[14.5px] font-bold leading-tight truncate">{d.name}</span>
                                <span className="flex items-center gap-2 mt-1">
                                  <span className="sc-stamina"><span style={{ width: `${d.currentEnergy}%`, background: d.currentEnergy >= 60 ? '#1f6b3a' : d.currentEnergy >= 30 ? '#9a5b00' : '#a32222' }} /></span>
                                  <span className="text-[10.5px] tabular-nums" style={{ color: 'var(--ink-soft)' }}>{spent ? 'Spent' : `${d.currentEnergy}%`}{role && role !== 'ned' ? ` · ${role === 'chair' ? 'Chair' : role === 'sid' ? 'SID' : 'Cttee chair'}` : ''}</span>
                                </span>
                              </span>
                              <span className="sc-rating bc-serif" style={{ color: rating >= 70 ? '#1f6b3a' : rating >= 50 ? '#9a5b00' : '#a32222' }}>{rating}</span>
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </>
              ) : (
                <>
              <p className="text-[13px] mt-1" style={{ color: 'var(--ink-soft)' }}>
                Pick up to {MAX_DEPLOYED} directors <b style={{ color: 'var(--ink)' }}>at the table</b>. The chip on each seat is their{' '}
                <b style={{ color: DOMAIN_INK[event.primaryDomain] }}>{DOMAIN_LABELS[event.primaryDomain]}</b> rating; the arc is stamina.
              </p>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {Array.from({ length: MAX_DEPLOYED }).map((_, i) => {
                  const d = deployed[i];
                  return d ? (
                    <motion.button
                      key={d.id}
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      onClick={() => onToggleDirector(d.id)}
                      title="Remove from this resolution"
                      className="sc-slot sc-slot-filled text-left cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="shrink-0 rounded-full overflow-hidden" style={{ boxShadow: '0 0 0 2px #c8960c' }}>
                          <DirectorPortrait directorId={d.id} size={44} />
                        </span>
                        <span className="min-w-0">
                          <span className="block bc-serif text-[13.5px] font-bold leading-tight truncate">{d.name}</span>
                          <span className="block text-[11px] mt-0.5" style={{ color: 'var(--ink-soft)' }}>
                            {DOMAIN_SHORT[event.primaryDomain]} <b style={{ color: 'var(--ink)' }}>{d.domainRatings[event.primaryDomain]}</b> · Stamina {d.currentEnergy}%
                          </span>
                        </span>
                      </span>
                    </motion.button>
                  ) : (
                    <div key={`empty-${i}`} className="sc-slot flex items-center justify-center text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--ink-soft)' }}>
                      {i === 0 && deployed.length === 0 ? 'Click a director' : 'Optional'}
                    </div>
                  );
                })}
              </div>

                </>
              )}

              {/* The engine tests an option's competency gates against the directors sent, not the whole board */}
              {strategy.competencyGates.length > 0 && (
                <div className="mt-4 space-y-1">
                  {strategy.competencyGates.map((gate) => {
                    const best = deployed.reduce<Director | null>((b, d) => (!b || d.domainRatings[gate.domain] > b.domainRatings[gate.domain] ? d : b), null);
                    const met = !!best && best.domainRatings[gate.domain] >= gate.minimumRating;
                    return (
                      <p key={gate.domain} className="text-[12px] font-semibold" style={{ color: met ? '#1f6b3a' : '#9a5b00' }}>
                        {met ? '✓' : '○'} Needs {DOMAIN_LABELS[gate.domain]} ≥ {gate.minimumRating} among those you send
                        {met && best ? ` — covered by ${best.name}` : strategy.fallback ? ` — otherwise falls back to “${labelOf(strategy.fallback)}”` : ''}
                      </p>
                    );
                  })}
                </div>
              )}

              <div className={`flex ${touch ? 'flex-col-reverse items-stretch gap-3' : 'items-center justify-between gap-4'} mt-6 pt-4`} style={{ borderTop: '1px solid var(--rule)' }}>
                <button onClick={onBack} disabled={busy} className={`text-[13px] font-semibold hover:underline cursor-pointer ${touch ? 'py-1 text-center' : ''}`}>‹ Back to the resolutions</button>
                <button
                  onClick={onConfirm}
                  disabled={deployed.length === 0 || busy}
                  className={`sc-confirm px-7 py-3 rounded-[3px] font-bold text-sm ${deployed.length === 0 || busy ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {busy ? 'The board is in session…' : touch && deployed.length > 0 ? `Put it to the board · ${deployed.length} of ${MAX_DEPLOYED}` : 'Put it to the board'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </motion.div>
  );
}
