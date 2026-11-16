'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { BoardSeat, Company, CompetencyDomain, Director } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_LABELS, DOMAIN_SHORT } from '@/engine/boardConstants';
import { BRIEFINGS, DOMAIN_MEANING } from '@/data/briefing';
import { isDesktopViewport } from '@/lib/breakpoints';
import DirectorPortrait from '@/components/DirectorPortrait';
import SheetWindow from './SheetWindow';

const GOOD = '#4ADE80', WARN = '#F5C451', BAD = '#F87171';
const tone = (v: number) => (v >= 65 ? GOOD : v >= 45 ? WARN : BAD);

interface Row {
  domain: CompetencyDomain;
  avg: number;
  best: Director | null;
  bestScore: number;
  strong: number;
}

/**
 * Board strength: the eight skill areas, for whoever is at the table right
 * now. The average is how deep the board is; the best single score is who it
 * would send. Hover an area for what it means and why it matters here.
 */
export default function BoardStrengthWindow({
  company,
  seats,
  directors,
  isOpen,
  onClose,
}: {
  company: Company;
  seats: BoardSeat[];
  directors: Director[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [active, setActive] = useState<CompetencyDomain | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const isCharity = company.id === 'company_meridian';
  const noun = isCharity ? 'trustee' : 'director';
  const why = BRIEFINGS[company.id]?.why;

  const seated = useMemo(
    () => seats.map((s) => directors.find((d) => d.id === s.directorId)).filter((d): d is Director => !!d),
    [seats, directors]
  );

  const rows: Row[] = useMemo(() => ALL_DOMAINS.map((domain) => {
    const scores = seated.map((d) => d.domainRatings[domain] ?? 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const best = seated.reduce<Director | null>((b, d) => (!b || d.domainRatings[domain] > b.domainRatings[domain] ? d : b), null);
    return { domain, avg, best, bestScore: best?.domainRatings[domain] ?? 0, strong: scores.filter((v) => v >= 70).length };
  }), [seated]);

  const overall = rows.length ? Math.round(rows.reduce((s, r) => s + r.avg, 0) / rows.length) : 0;
  const covered = rows.filter((r) => r.bestScore >= 70).length;
  const sorted = [...rows].sort((a, b) => b.bestScore - a.bestScore);
  const strongest = sorted[0];
  const thin = [...rows].filter((r) => r.bestScore < 60).sort((a, b) => a.bestScore - b.bestScore);

  // Radar geometry
  const S = 380, C = S / 2, RAD = 128;
  const point = (i: number, v: number) => {
    const a = (Math.PI * 2 * i) / rows.length - Math.PI / 2;
    return [C + Math.cos(a) * RAD * (v / 100), C + Math.sin(a) * RAD * (v / 100)] as const;
  };
  const poly = (pick: (r: Row) => number) => rows.map((r, i) => point(i, pick(r)).map((n) => n.toFixed(1)).join(',')).join(' ');

  const hover = (domain: CompetencyDomain | null, e?: React.MouseEvent) => {
    setActive(domain);
    setPos(domain && e && isDesktopViewport() ? { x: e.clientX, y: e.clientY } : null);
  };
  const popStyle = pos
    ? {
        left: Math.min(pos.x + 18, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 320),
        top: Math.min(pos.y + 18, (typeof window !== 'undefined' ? window.innerHeight : 800) - 190),
      }
    : null;

  return (
    <SheetWindow isOpen={isOpen} onClose={onClose} overline={`Board strength · ${seated.length} at the table`} title={company.name}>
      {seated.length === 0 ? (
        <p className="bw-serif italic text-[16px] text-[#C7D3DF] py-10 text-center">Nobody is seated yet. Appoint a {noun} and this fills in.</p>
      ) : (
        <>
          <div className="bs-kpis mb-[18px]">
            <div className="bw-panel">
              <p className="bw-label">Overall depth</p>
              <p className="bs-kpi bw-mono mt-1" style={{ color: tone(overall) }}>{overall}<span className="text-[13px] text-[#7F93A8] font-normal"> / 100</span></p>
              <p className="text-[11.5px] text-[#7F93A8] mt-0.5">Average across all eight areas</p>
            </div>
            <div className="bw-panel">
              <p className="bw-label">Areas covered</p>
              <p className="bs-kpi bw-mono mt-1" style={{ color: covered >= 6 ? GOOD : covered >= 4 ? WARN : BAD }}>{covered}<span className="text-[13px] text-[#7F93A8] font-normal"> of 8</span></p>
              <p className="text-[11.5px] text-[#7F93A8] mt-0.5">At least one {noun} at 70 or above</p>
            </div>
            <div className="bw-panel">
              <p className="bw-label">{thin.length > 0 ? 'Thinnest area' : 'Strongest area'}</p>
              <p className="bw-serif text-[19px] font-bold text-[#EAF1F8] mt-1.5 leading-tight">{DOMAIN_SHORT[(thin[0] ?? strongest).domain]}</p>
              <p className="text-[11.5px] mt-0.5" style={{ color: thin.length > 0 ? BAD : GOOD }}>
                {thin.length > 0 ? `Nobody above ${thin[0].bestScore}` : `${strongest.best?.name} at ${strongest.bestScore}`}
              </p>
            </div>
          </div>

          <div className="bs-grid">
            {/* Radar */}
            <section className="bw-panel">
              <svg viewBox={`0 0 ${S} ${S}`} className="w-full h-auto" role="img" aria-label="Board strength radar">
                {[25, 50, 75, 100].map((ring) => (
                  <polygon key={ring} points={rows.map((_, i) => point(i, ring).map((n) => n.toFixed(1)).join(',')).join(' ')} fill="none" stroke="rgba(159,179,200,0.14)" />
                ))}
                {rows.map((r, i) => {
                  const [x, y] = point(i, 100);
                  return <line key={r.domain} x1={C} y1={C} x2={x} y2={y} stroke="rgba(159,179,200,0.1)" />;
                })}
                <motion.polygon points={poly((r) => r.bestScore)} fill="rgba(111,143,179,0.10)" stroke="#6F8FB3" strokeWidth="1.2" strokeDasharray="4 4"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
                <motion.polygon points={poly((r) => r.avg)} fill="rgba(232,199,102,0.22)" stroke="#E8C766" strokeWidth="2" strokeLinejoin="round"
                  initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
                  style={{ transformOrigin: `${C}px ${C}px` }} />
                {rows.map((r, i) => {
                  const [x, y] = point(i, r.avg);
                  const [lx, ly] = point(i, 124);
                  const on = active === r.domain;
                  return (
                    <g key={r.domain} onMouseMove={(e) => hover(r.domain, e)} onMouseLeave={() => hover(null)} onClick={() => setActive(on ? null : r.domain)} style={{ cursor: 'help' }}>
                      <circle cx={x} cy={y} r={on ? 6 : 4} fill="#E8C766" stroke="#0a1626" strokeWidth="1.5" />
                      <circle cx={lx} cy={ly} r="26" fill="transparent" />
                      <text x={lx} y={ly - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill={on ? '#E8C766' : '#C7D3DF'}>{DOMAIN_SHORT[r.domain]}</text>
                      <text x={lx} y={ly + 12} textAnchor="middle" fontSize="11" className="bw-mono" fill={tone(r.avg)}>{r.avg}</text>
                    </g>
                  );
                })}
              </svg>
              <div className="flex items-center justify-center gap-5 text-[11px] text-[#9FB3C8] mt-1">
                <span className="flex items-center gap-1.5"><i className="inline-block w-4 h-[3px] rounded" style={{ background: '#E8C766' }} /> Board average</span>
                <span className="flex items-center gap-1.5"><i className="inline-block w-4 border-t border-dashed" style={{ borderColor: '#6F8FB3' }} /> Best single {noun}</span>
              </div>
            </section>

            {/* Area by area */}
            <section className="bw-panel" style={{ padding: '12px 10px' }}>
              <p className="bw-label px-2.5 mb-1.5">Area by area · <span className="bs-hover">hover</span><span className="bs-tap">tap</span> for why it matters here</p>
              {rows.map((r) => {
                const on = active === r.domain;
                const status = r.bestScore >= 80 ? ['Strong', GOOD] : r.bestScore >= 70 ? ['Covered', GOOD] : r.bestScore >= 60 ? ['Thin', WARN] : ['Gap', BAD];
                return (
                  <div key={r.domain} className={`bs-row ${on ? 'bs-row-on' : ''}`}
                    onMouseMove={(e) => hover(r.domain, e)} onMouseLeave={() => hover(null)} onClick={() => setActive(on ? null : r.domain)}>
                    <span className="bw-mono text-[18px] font-bold" style={{ color: tone(r.avg) }}>{r.avg}</span>
                    <span className="text-[13.5px] text-[#EAF1F8] font-semibold leading-tight">{DOMAIN_LABELS[r.domain]}</span>
                    <span className="bs-track"><span style={{ width: `${r.avg}%`, background: tone(r.avg) }} /></span>
                    <span className="bw-mono text-[11px] text-[#7F93A8] text-right" title={`${r.strong} at 70 or above`}>{r.strong}×</span>
                    <span className="bs-lead flex items-center gap-2 min-w-0">
                      {r.best && <DirectorPortrait directorId={r.best.id} size={24} className="rounded-full shrink-0" />}
                      <span className="min-w-0">
                        <span className="block truncate text-[12px] text-[#C7D3DF] leading-tight">{r.best?.name}</span>
                        <span className="block bw-mono text-[10.5px]" style={{ color: tone(r.bestScore) }}>best: {r.bestScore}</span>
                      </span>
                    </span>
                    <span className="bw-chip text-center" style={{ color: status[1] }}>{status[0]}</span>
                    {on && !pos && (
                      <span className="bs-inline">
                        {DOMAIN_MEANING[r.domain]} {why && <span style={{ color: '#E8D9AE' }}>{why[r.domain]}</span>}
                        {r.best && <span className="block mt-1 text-[#7F93A8]">Strongest: {r.best.name}, {r.bestScore}.</span>}
                      </span>
                    )}
                  </div>
                );
              })}
              <p className="text-[11px] text-[#7F93A8] px-2.5 mt-2 leading-relaxed">
                The big number is the board&rsquo;s average. &ldquo;×&rdquo; counts {noun}s at 70 or above. Board papers are decided by the people you send, so one strong {noun} can cover an area the average hides.
              </p>
            </section>
          </div>
        </>
      )}

      {active && popStyle && (
        <div className="bs-pop" style={popStyle}>
          <h4>{DOMAIN_LABELS[active]}</h4>
          <p>{DOMAIN_MEANING[active]}</p>
          {why && <p className="bs-why"><b>Why it matters here.</b> {why[active]}</p>}
        </div>
      )}
    </SheetWindow>
  );
}
