'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { Company } from '@/types/game';
import { BRIEFINGS, type BriefingArticle } from '@/data/briefing';
import { LORE } from '@/data/lore';
import CompanyLogo from '@/components/CompanyLogo';
import DirectorPortrait from '@/components/DirectorPortrait';
import SheetWindow from './SheetWindow';
import { playPaperSlide, playPageTurn } from '@/engine/soundEngine';
import '@/components/boardbuild/boardbuild.css';

const OWNER_COLOR = { activist: '#F87171', anchor: '#E8C766', plain: '#6F8FB3' } as const;

function Chart({ data, ticks, notes, prefix, suffix }: { data: number[]; ticks: string[]; notes: { at: number; label: string }[]; prefix: string; suffix: string }) {
  const W = 680, H = 230, R = 16, T = 30, B = 26;
  const lo = Math.min(...data), hi = Math.max(...data);
  const pad = (hi - lo) * 0.18 || 1;
  const min = lo - pad, max = hi + pad;
  const fmt = (v: number) => `${prefix}${v >= 100 ? Math.round(v) : v.toFixed(v >= 20 ? 1 : 2)}${suffix}`;
  const L = 14 + fmt(hi).length * 6.4;
  const x = (i: number) => L + (i / (data.length - 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const pts = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? '#4ADE80' : '#F87171';
  const last = data.length - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Twelve-month chart">
      <defs>
        <linearGradient id="cb-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={stroke} stopOpacity="0.3" />
          <stop offset="1" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[min + pad, (min + max) / 2, max - pad].map((t, i) => (
        <g key={i}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="rgba(159,179,200,0.13)" />
          <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#7F93A8" className="bw-mono">{fmt(t)}</text>
        </g>
      ))}
      <polygon points={`${x(0)},${H - B} ${pts} ${x(last)},${H - B}`} fill="url(#cb-fill)" />
      <motion.polyline points={pts} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.1, delay: 0.35, ease: 'easeOut' }} />
      {ticks.map((t, i) => (
        <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#7F93A8" className="bw-mono">{t}</text>
      ))}
      {notes.map((n, k) => {
        const right = n.at > data.length * 0.6;
        // Stagger the flags so two notes close together do not collide.
        const fy = 12 + k * 13;
        return (
          <motion.g key={n.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + k * 0.25 }}>
            <line x1={x(n.at)} x2={x(n.at)} y1={fy + 4} y2={y(data[n.at])} stroke="#E8C766" strokeDasharray="2 3" opacity="0.7" />
            <circle cx={x(n.at)} cy={y(data[n.at])} r="4" fill="#0a1626" stroke="#E8C766" strokeWidth="1.6" />
            <text className="cb-note-text" x={x(n.at) + (right ? -7 : 7)} y={fy + 4} textAnchor={right ? 'end' : 'start'} fontSize="10.5" fill="#E8C766">{n.label}</text>
          </motion.g>
        );
      })}
      <circle cx={x(last)} cy={y(data[last])} r="10" fill={stroke} opacity="0.18" />
      <circle cx={x(last)} cy={y(data[last])} r="4" fill={stroke} />
    </svg>
  );
}

function Article({ article, onClose }: { article: BriefingArticle; onClose: () => void }) {
  return createPortal(
    <motion.div className="ar-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose} role="dialog" aria-label={article.headline}>
      <motion.article
        className="bc-doc bc-paper ar-paper"
        initial={{ y: 60, rotate: 2.5, opacity: 0 }} animate={{ y: 0, rotate: -0.6, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="ar-mast">{article.masthead}</p>
        <div className="ar-rule" />
        <div className="ar-meta"><span>{article.byline}</span><span>{article.when}</span></div>
        <h3 className="ar-headline">{article.headline}</h3>
        <p className="ar-stand">{article.standfirst}</p>
        <div className="ar-body">
          {article.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="flex items-center justify-between gap-4 mt-3 pt-3" style={{ borderTop: '1px solid var(--rule)' }}>
          <span className="text-[10px]" style={{ color: 'var(--ink-soft)' }}>A fictional publication. BoardCraft is a simulation.</span>
          <button onClick={onClose} className="sc-confirm px-5 py-2 rounded-[3px] font-bold text-sm cursor-pointer whitespace-nowrap">Put it down</button>
        </div>
      </motion.article>
    </motion.div>,
    document.body
  );
}

/**
 * The company briefing: what the place is, where it has been over the last
 * year, who owns it, who matters, and what the papers were saying before you
 * arrived.
 */
export default function CompanyBriefingWindow({ company, isOpen, onClose }: { company: Company; isOpen: boolean; onClose: () => void }) {
  const [reading, setReading] = useState<BriefingArticle | null>(null);
  const b = BRIEFINGS[company.id];
  const lore = LORE[company.id];
  const isCharity = company.id === 'company_meridian';

  const now = b?.chart[b.chart.length - 1] ?? 0;
  const then = b?.chart[0] ?? 0;
  const change = then ? ((now - then) / then) * 100 : 0;
  const fmt = (v: number) => (b ? `${b.chartPrefix}${v >= 100 ? Math.round(v) : v.toFixed(v >= 20 ? 1 : 2)}${b.chartSuffix}` : '');

  return (
    <>
      <SheetWindow
        isOpen={isOpen}
        onClose={() => { if (!reading) onClose(); }}
        overline={`Company briefing${lore ? ` · ${lore.city}` : ''}`}
        title={company.name}
        lead={<CompanyLogo companyId={company.id} size={46} />}
      >
        {lore && <p className="cb-hook mb-4">{lore.hook}</p>}

        <div className="cb-grid">
          {/* Left: the story, the chart, the press */}
          <div className="grid gap-[18px] min-w-0">
            <section className="bw-panel">
              <p className="bw-label mb-2">The situation</p>
              <p className="cb-story">{company.narrative}</p>
            </section>

            {b && (
              <section className="bw-panel">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <p className="bw-label">{b.chartLabel} · last {isCharity ? 'three years' : 'twelve months'}</p>
                    <p className="cb-price bw-mono mt-1.5">
                      {fmt(now)}
                      <span className="text-[15px] ml-3" style={{ color: change >= 0 ? '#4ADE80' : '#F87171' }}>
                        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                  <span className="bw-chip" style={{ color: '#C9A227' }}>{b.ticker}</span>
                </div>
                <div className="mt-2"><Chart data={b.chart} ticks={b.chartTicks} notes={b.chartNotes} prefix={b.chartPrefix} suffix={b.chartSuffix} /></div>
                <ul className="cb-notes-list">
                  {b.chartNotes.map((n) => (
                    <li key={n.label}><b>{b.chartTicks[n.at]}</b> {n.label}</li>
                  ))}
                </ul>
              </section>
            )}

            {b && (
              <section>
                <p className="bw-label mb-2.5">In the press before you arrived</p>
                <div className="cb-news">
                  {b.articles.map((a) => (
                    <button key={a.headline} className="cb-card" onClick={() => { setReading(a); playPageTurn(); }}>
                      <span className="cb-mast"><span>{a.masthead}</span><span>{a.when}</span></span>
                      <span className="cb-headline">{a.headline}</span>
                      <span className="cb-stand">{a.standfirst}</span>
                      <span className="cb-read">Read the article →</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right: figures, ownership, people */}
          <div className="grid gap-[18px] content-start min-w-0">
            <section className="bw-panel">
              <p className="bw-label mb-1">At a glance</p>
              <div className="cb-fact"><span className="text-[#7F93A8]">{isCharity ? 'Annual income' : 'Market value'}</span><span className="text-[#EAF1F8] font-semibold">{company.marketCap}</span></div>
              {!isCharity && <div className="cb-fact"><span className="text-[#7F93A8]">Revenue</span><span className="text-[#EAF1F8] font-semibold">{company.annualRevenue}</span></div>}
              <div className="cb-fact"><span className="text-[#7F93A8]">{isCharity ? 'Staff' : 'Employees'}</span><span className="text-[#EAF1F8] font-semibold">{company.employees.toLocaleString()}</span></div>
              <div className="cb-fact"><span className="text-[#7F93A8]">Business</span><span>{company.industry}</span></div>
              <div className="cb-fact"><span className="text-[#7F93A8]">Head office</span><span>{company.headquarters}</span></div>
              {b?.facts.map((f) => (
                <div key={f.label} className="cb-fact"><span className="text-[#7F93A8]">{f.label}</span><span>{f.value}</span></div>
              ))}
            </section>

            {b && (
              <section className="bw-panel">
                <p className="bw-label mb-3">{b.ownersTitle}</p>
                {b.owners.map((o, i) => {
                  const color = OWNER_COLOR[o.flag ?? 'plain'];
                  return (
                    <div key={o.name} className="cb-owner">
                      <span className="truncate" style={{ color: o.flag ? color : '#C7D3DF' }}>
                        {o.name}{o.flag === 'activist' ? ' · activist' : ''}
                      </span>
                      <span className="bw-mono text-right font-bold" style={{ color: o.flag ? color : '#EAF1F8' }}>{o.pct}%</span>
                      <span className="cb-bar">
                        <motion.span style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${o.pct}%` }} transition={{ duration: 0.7, delay: 0.3 + i * 0.07 }} />
                      </span>
                    </div>
                  );
                })}
              </section>
            )}

            {lore && (
              <section className="bw-panel">
                <p className="bw-label mb-3">People to know</p>
                <div className="grid gap-3">
                  {lore.people.map((p) => (
                    <div key={p.name} className="flex items-start gap-2.5">
                      {p.org ? (
                        <span className="shrink-0 grid place-items-center rounded-full bw-serif font-bold text-[12px]" style={{ width: 36, height: 36, border: '1.5px solid #C9A227', color: '#E8C766' }} aria-hidden>
                          {p.name.replace(/^The /, '').split(' ').filter((w) => /^[A-Z]/.test(w)).slice(0, 3).map((w) => w[0]).join('')}
                        </span>
                      ) : (
                        <DirectorPortrait directorId={p.id ?? `lore:${p.name}`} size={36} className="rounded-full shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="bw-serif text-[14.5px] font-bold leading-tight text-[#EAF1F8]">{p.name}</p>
                        <p className="text-[9.5px] uppercase tracking-[0.12em] text-[#C9A227]">{p.role}</p>
                        <p className="text-[12.5px] leading-snug mt-0.5">{p.line}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11.5px] mt-4 pt-3 text-[#7F93A8]" style={{ borderTop: '1px solid rgba(159,179,200,0.13)' }}>
                  You were retained by {lore.from}, {lore.fromRole.charAt(0).toLowerCase() + lore.fromRole.slice(1)}.
                </p>
              </section>
            )}
          </div>
        </div>
      </SheetWindow>

      <AnimatePresence>
        {reading && <Article key={reading.headline} article={reading} onClose={() => { setReading(null); playPaperSlide(); }} />}
      </AnimatePresence>
    </>
  );
}
