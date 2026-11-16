'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Company } from '@/types/game';
import { LORE, PLAYER_ROLE, YOUR_JOB } from '@/data/lore';
import CompanyLogo from '@/components/CompanyLogo';
import DirectorPortrait from '@/components/DirectorPortrait';
import { playPageTurn } from '@/engine/soundEngine';
import '@/components/boardbuild/boardbuild.css';
import '@/components/office/office.css';

/**
 * The company file as a short dossier you leaf through:
 *   1. the letter that hired you   2. the board file   3. who to know and how the year runs
 * Kept light on words on purpose — it is the lore, not a manual.
 */
export default function Dossier({
  company,
  file,
  onStart,
  onBack,
}: {
  company: Company;
  /** The existing board file (figures and the situation), shown as page two. */
  file: ReactNode;
  onStart: () => void;
  onBack: () => void;
}) {
  const lore = LORE[company.id];
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);
  const pages = lore ? 3 : 1;
  const go = (to: number) => {
    if (to < 0 || to >= pages || to === page) return;
    setDir(to > page ? 1 : -1);
    setPage(to);
    playPageTurn();
  };

  const quarters = ['Q1', 'Q2', 'AGM', 'Q3', 'Q4'];
  const isCharity = company.id === 'company_meridian';
  const meeting = isCharity ? 'Members' : company.id === 'company_rheinfeld' ? 'HV' : 'AGM';

  let body: ReactNode;
  if (!lore || page === 1) {
    body = file;
  } else if (page === 0) {
    body = (
      <div>
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
          <CompanyLogo companyId={company.id} size={44} />
          <div className="min-w-0 flex-1">
            <p className="bc-serif text-[19px] font-bold leading-tight">{company.name}</p>
            <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--ink-soft)' }}>{lore.city === lore.country ? lore.city : `${lore.city} · ${lore.country}`}</p>
          </div>
          <span className="bc-stamp bc-stamp-red" style={{ transform: 'rotate(4deg)' }}>Private</span>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] mt-5" style={{ color: 'var(--ink-soft)' }}>Letter of engagement</p>
        <p className="bc-serif text-[15px] mt-3">To the {PLAYER_ROLE},</p>
        {lore.letter.map((para, i) => (
          <p key={i} className="bc-serif text-[16px] leading-[1.75] mt-3">{para}</p>
        ))}
        <p className="text-[25px] mt-6 leading-none" style={{ fontFamily: '"Snell Roundhand", "Segoe Script", "Brush Script MT", cursive', fontStyle: 'italic' }}>{lore.from}</p>
        <p className="text-[11px] mt-2" style={{ color: 'var(--ink-soft)' }}>{lore.from} · {lore.fromRole}</p>
      </div>
    );
  } else {
    body = (
      <div>
        <div className="flex items-baseline justify-between gap-4 pb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Briefing note</p>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--ink-soft)' }}>{company.name}</p>
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] mt-5 mb-2.5" style={{ color: 'var(--ink-soft)' }}>People to know</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3">
          {lore.people.map((p) => (
            <div key={p.name} className="flex items-start gap-2.5">
              {p.org ? (
                <span className="shrink-0 grid place-items-center rounded-full bc-serif font-bold text-[13px]" style={{ width: 38, height: 38, border: '1.5px solid var(--ink)', color: 'var(--ink)' }} aria-hidden>
                  {p.name.replace(/^The /, '').split(' ').filter((w) => /^[A-Z]/.test(w)).slice(0, 3).map((w) => w[0]).join('')}
                </span>
              ) : (
                <DirectorPortrait directorId={p.id ?? `lore:${p.name}`} size={38} className="rounded-full shrink-0" />
              )}
              <div className="min-w-0">
                <p className="bc-serif text-[14.5px] font-bold leading-tight">{p.name}</p>
                <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: 'var(--ink-soft)' }}>{p.role}</p>
                <p className="text-[12.5px] leading-snug mt-0.5">{p.line}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] mt-6 mb-2.5" style={{ color: 'var(--ink-soft)' }}>Your year</h3>
        <div className="flex items-stretch">
          {quarters.map((q, i) => {
            const n = company.eventSchedule.filter((e) => e.quarter === q).length;
            const agm = q === 'AGM';
            return (
              <div key={q} className="flex-1 text-center px-1 py-2" style={{ borderTop: `3px solid ${agm ? '#7a5a06' : 'var(--ink)'}`, borderLeft: i > 0 ? '1px solid var(--rule)' : undefined, background: agm ? 'rgba(122,90,6,0.08)' : undefined }}>
                <p className="bc-serif text-[15px] font-bold">{agm ? meeting : q}</p>
                <p className="text-[10.5px]" style={{ color: 'var(--ink-soft)' }}>{agm ? 'the vote' : `${n} papers`}</p>
              </div>
            );
          })}
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] mt-6 mb-2" style={{ color: 'var(--ink-soft)' }}>Your job</h3>
        <ol className="grid gap-1.5">
          {YOUR_JOB.map((j, i) => (
            <li key={j.title} className="flex gap-2.5 text-[13px] leading-snug">
              <span className="bc-serif font-bold text-[15px] w-4 shrink-0">{i + 1}</span>
              <span><b>{j.title}.</b> {j.line}</span>
            </li>
          ))}
        </ol>
        <p className="text-[12px] mt-3" style={{ color: 'var(--ink-soft)' }}>
          You are judged on two numbers: {isCharity ? 'mission integrity' : 'shareholder value'}, and governance health.
        </p>
      </div>
    );
  }

  return (
    <article className="bc-paper of-paper">
      <div style={{ minHeight: 400 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={page}
            initial={{ opacity: 0, x: dir * 26 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -26 }}
            transition={{ duration: 0.2 }}
          >
            {body}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 mt-6 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
        <button className="of-btn of-btn-back" onClick={onBack}>‹ Go back</button>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button className="of-btn of-btn-back" style={{ padding: '6px 10px', opacity: page === 0 ? 0.35 : 1 }} onClick={() => go(page - 1)} aria-label="Previous page" disabled={page === 0}>‹</button>
            <span className="text-[11px] tabular-nums" style={{ color: 'var(--ink-soft)' }}>{page + 1} / {pages}</span>
            <button className="of-btn of-btn-back" style={{ padding: '6px 10px', opacity: page === pages - 1 ? 0.35 : 1 }} onClick={() => go(page + 1)} aria-label="Next page" disabled={page === pages - 1}>›</button>
          </div>
        )}
        <button className="of-btn of-btn-start" onClick={onStart}>Start →</button>
      </div>
    </article>
  );
}
