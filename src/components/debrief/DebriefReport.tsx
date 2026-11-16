'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { GameState } from '@/types/game';
import type { AgmResolutionVote } from '@/engine/agm';
import { buildDebrief, TIER_LABEL } from '@/engine/debrief';
import CompanyLogo from '@/components/CompanyLogo';
import { playPaperSlide } from '@/engine/soundEngine';
import '@/components/boardbuild/boardbuild.css';
import './debrief.css';

const tierColor = (t: string) =>
  t === 'CRITICAL_SUCCESS' || t === 'SUCCESS' ? 'var(--success)' : t === 'PARTIAL_SUCCESS' ? 'var(--warning)' : 'var(--error)';

/**
 * The year as a document: what you decided, what it led to, which provision
 * it touches and what good practice looks like. "Save as PDF" uses the
 * browser's own print dialog, with a print stylesheet that lays it out on A4.
 */
export default function DebriefReport({
  gameState,
  agmVotes,
  onClose,
}: {
  gameState: GameState;
  agmVotes?: AgmResolutionVote[];
  onClose: () => void;
}) {
  const d = useMemo(() => buildDebrief(gameState, agmVotes ?? gameState.agmVotes ?? []), [gameState, agmVotes]);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'db-portal';
    document.body.appendChild(el);
    setHost(el);
    playPaperSlide();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      el.remove();
    };
  }, [onClose]);

  if (!host) return null;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const weaknesses = d.themes.filter((t) => t.verdict === 'weakness');
  const strengths = d.themes.filter((t) => t.verdict === 'strength').reverse();
  const mixed = d.themes.filter((t) => t.verdict === 'mixed');

  return createPortal(
    <div className="db-overlay" role="dialog" aria-label="Governance Debrief">
      <div className="db-bar">
        <span className="text-xs text-foreground/50 mr-auto hidden md:block">In the print dialog, choose &ldquo;Save as PDF&rdquo;.</span>
        <button onClick={() => window.print()} className="px-4 py-2 rounded bg-gold text-navy-dark font-bold text-sm cursor-pointer">Save as PDF</button>
        <button onClick={onClose} className="px-4 py-2 rounded border border-card-border text-foreground/80 text-sm cursor-pointer hover:text-foreground">Close</button>
      </div>

      <article className="bc-doc bc-paper db-page">
        <header className="flex items-center gap-4 pb-4" style={{ borderBottom: '2px solid var(--ink)' }}>
          <div className="shrink-0"><CompanyLogo companyId={gameState.company.id} size={54} /></div>
          <div className="min-w-0">
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>Governance Debrief · {today}</p>
            <h1 className="bc-serif text-[28px] font-bold leading-tight mt-1">{d.companyName}</h1>
            <p className="text-[12.5px] mt-1" style={{ color: 'var(--ink-soft)' }}>Assessed against: {d.framework}</p>
          </div>
        </header>

        <p className="bc-serif text-[17px] leading-relaxed mt-5">{d.headline}</p>

        <div className="db-kpis">
          <div>
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>{d.metricName}</p>
            <p className="db-num">{d.metricStart} → {d.metricEnd}</p>
          </div>
          <div>
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>Governance health</p>
            <p className="db-num">{d.governanceHealth}<span className="text-base font-normal"> / 100</span></p>
          </div>
          <div>
            <p className="bc-overline" style={{ color: 'var(--ink-soft)' }}>Proxy adviser view</p>
            <p className="bc-serif text-[15px] font-bold leading-snug mt-1.5">{d.rating}</p>
          </div>
        </div>

        <h2 className="db-h2">What to take away</h2>
        <ol className="list-decimal pl-5 space-y-2 text-[14.5px] leading-relaxed">
          {d.lessons.map((l, i) => <li key={i}>{l}</li>)}
        </ol>

        <h2 className="db-h2">How the board did, area by area</h2>
        {[['Needs work', weaknesses, 'var(--error)'], ['Strengths', strengths, 'var(--success)'], ['Mixed', mixed, 'var(--warning)']].map(([title, list, color]) =>
          (list as typeof d.themes).length > 0 ? (
            <section key={title as string}>
              <p className="bc-overline mt-4" style={{ color: color as string }}>{title as string}</p>
              {(list as typeof d.themes).map((t) => (
                <div key={t.topic} className="db-theme">
                  <p className="text-[14.5px]"><span className="font-bold">{t.label}</span> <span style={{ color: 'var(--ink-soft)' }}>· {t.decisions} {t.decisions === 1 ? 'decision' : 'decisions'}</span></p>
                  <p className="text-[13.5px] mt-1">
                    {t.items.map((it, k) => (
                      <span key={k}>{k > 0 ? '; ' : ''}{it.name} <span className="font-bold" style={{ color: tierColor(it.tier) }}>({TIER_LABEL[it.tier].toLowerCase()})</span></span>
                    ))}
                  </p>
                  <p className="text-[13.5px] leading-relaxed mt-1"><span className="font-bold">What good looks like:</span> {t.good}</p>
                  <p className="db-cite mt-1">{t.cite}</p>
                </div>
              ))}
            </section>
          ) : null
        )}

        <h2 className="db-h2">The board at year-end</h2>
        <div className="mb-3">
          {d.pillars.map((p) => (
            <div key={p.name} className="db-pillar">
              <span>{p.name}</span>
              <span className="db-track"><span style={{ width: `${Math.max(0, Math.min(100, (p.score / p.max) * 100))}%` }} /></span>
              <span className="text-right tabular-nums font-bold">{Math.round(p.score)}/{p.max}</span>
            </div>
          ))}
        </div>
        {d.board.length === 0 ? (
          <p className="text-[14px]">The {d.boardSize}-member board ends the year with no open departures from the code.</p>
        ) : (
          <>
            <p className="text-[14px] mb-1.5">Open departures from the code ({d.board.length}):</p>
            <ul className="list-disc pl-5 space-y-1 text-[13.5px] leading-relaxed">
              {d.board.map((b, i) => <li key={i}>{b.finding}</li>)}
            </ul>
          </>
        )}
        {d.reliance.length > 0 && (
          <p className="text-[13.5px] mt-3" style={{ color: 'var(--ink-soft)' }}>
            Most used directors: {d.reliance.map((r) => `${r.name} (${r.deployments})`).join(', ')}.
          </p>
        )}

        {d.agm.length > 0 && (
          <>
            <h2 className="db-h2">The annual meeting</h2>
            {d.agm.map((v) => (
              <div key={v.title} className="db-theme">
                <p className="text-[14.5px]">
                  <span className="font-bold">{v.title}</span>{' '}
                  <span className="db-tier ml-1" style={{ color: v.good ? 'var(--success)' : 'var(--error)' }}>{v.pass ? 'Carried' : 'Defeated'} · {v.forPct.toFixed(1)}% for</span>
                </p>
                <p className="text-[13.5px] mt-1">
                  {v.proposedBy === 'shareholders' ? 'Put forward by shareholders. ' : ''}
                  The board {v.stance === 'for' ? 'backed it' : v.stance === 'against' ? 'opposed it' : 'took no position'}. Biggest factor: {v.driver}.
                </p>
              </div>
            ))}
          </>
        )}

        <h2 className="db-h2">Every decision, in order</h2>
        {d.decisions.map((x, i) => (
          <div key={i} className="db-decision">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-soft)' }}>{x.when}</p>
              <span className="db-tier mt-1.5" style={{ color: tierColor(x.tier) }}>{TIER_LABEL[x.tier]}</span>
            </div>
            <div>
              <p className="bc-serif text-[16px] font-bold leading-snug">{x.eventName}</p>
              <p className="text-[13.5px] mt-1"><span className="font-bold">You chose:</span> {x.chose}</p>
              {x.team.length > 0 && <p className="text-[13.5px]"><span className="font-bold">You sent:</span> {x.team.join(', ')}</p>}
              <p className="text-[13.5px] mt-1 leading-relaxed">{x.why}</p>
              <p className="db-cite mt-1.5">{x.topicLabel} · {x.cite}</p>
            </div>
          </div>
        ))}

        <p className="text-[11px] mt-8 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          BoardCraft is a simulation. Companies, people and events are fictional. References to codes, statutes and listing rules are
          signposts for discussion and study, not legal advice; check the current text of any provision before relying on it.
        </p>
      </article>
    </div>,
    host
  );
}
