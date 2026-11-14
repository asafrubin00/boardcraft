'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { companies } from '@/data/company';
import SiteFooter from './SiteFooter';
import type { Company } from '@/types/game';
import CompanyLogo from './CompanyLogo';
import { isDesktopViewport } from '@/lib/breakpoints';
import type { OfficeFolder } from './office/OfficeScene';
import './boardbuild/boardbuild.css';
import './office/office.css';

// The 3D office is desktop-only and heavy (three.js + models), so it loads on demand.
const OfficeScene = dynamic(() => import('./office/OfficeScene'), { ssr: false });

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2'));
  } catch {
    return false;
  }
}

interface CompanySelectScreenProps {
  onSelectCompany: (company: Company) => void;
}

interface LockedCompany {
  name: string;
  region: string;
  industry: string;
  difficulty: number;
}

const lockedCompanies: LockedCompany[] = [
  { name: 'Valdorian National Grid', region: 'Emerging Market', industry: 'Utilities', difficulty: 3 },
];

const difficultyLabel = (tier: number) => {
  switch (tier) {
    case 1: return 'Beginner';
    case 2: return 'Intermediate';
    case 3: return 'Advanced';
    case 4: return 'Expert';
    default: return 'Intermediate';
  }
};

const difficultyColor = (tier: number) => {
  switch (tier) {
    case 1: return 'text-success';
    case 2: return 'text-gold-light';
    case 3: return 'text-gold';
    case 4: return 'text-error';
    default: return 'text-gold-light';
  }
};


/** Governance regime each company is played under, shown on its tile. */
const FRAMEWORK: Record<string, { place: string; code: string }> = {
  company_harwick: { place: 'UK', code: 'UK Corporate Governance Code' },
  company_vantage: { place: 'US', code: 'NYSE listing standards · SEC' },
  company_rheinfeld: { place: 'Germany', code: 'GCGC · AktG two-tier board' },
  company_meridian: { place: 'UK', code: 'Charity Governance Code' },
  company_sfg: { place: 'Singapore', code: 'MAS guidelines · SGX Code' },
};

const compactMoney = (v: string) =>
  v.split(' (')[0].replace(' annual income', '').replace(' billion', 'bn').replace(' million', 'm');

function tileStats(company: Company): { label: string; value: string }[] {
  if (company.boardBudget === 0) {
    return [
      { label: 'Income', value: compactMoney(company.marketCap) },
      { label: 'Trustees', value: 'Unpaid' },
      { label: 'Staff', value: company.employees.toLocaleString('en-GB') },
    ];
  }
  return [
    { label: 'Market cap', value: compactMoney(company.marketCap) },
    { label: 'Revenue', value: compactMoney(company.annualRevenue) },
    { label: 'Employees', value: company.employees.toLocaleString('en-GB') },
  ];
}

/** Governance Health as a ring gauge. */
function HealthGauge({ value, size = 58 }: { value: number; size?: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const color = value >= 60 ? '#E0B044' : value >= 50 ? '#D08A2E' : '#D9603F';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`Governance Health ${value}/100`}>
      <svg viewBox="0 0 60 60" width={size} height={size}>
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle
          cx="30" cy="30" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - value / 100) }}
          transition={{ delay: 0.35, duration: 1, ease: 'easeOut' }}
          transform="rotate(-90 30 30)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[15px] font-bold text-foreground tabular-nums">{value}</span>
        <span className="text-[7px] uppercase tracking-[0.14em] text-foreground/45 mt-0.5">Health</span>
      </div>
    </div>
  );
}

function getFirstTwoSentences(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences) return text;
  return sentences.slice(0, 2).join(' ').trim();
}

const FOCUS_PACKS = [
  'Geopolitical Risk',
  'Cybersecurity & Technology Governance',
  'AI Governance',
  'Financial Markets & Capital Allocation',
  'Stakeholder Engagement & Activist Defence',
  'ESG, DEI & Sustainability Reporting',
  'Talent, Succession & Board Renewal',
  'Crisis Management & Reputational Risk',
];

function FocusPlayModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'main' | 'contact' | 'submitted'>('main');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch('https://formspree.io/f/xjgqynpo', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setView('submitted');
      } else {
        const json = await res.json().catch(() => null);
        const msg = json?.error ?? json?.errors?.[0]?.message ?? `Error ${res.status}`;
        setError(msg);
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#070f1a]/97">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-8 pb-4 border-b border-card-border flex items-start justify-between">
        <div>
          <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">In development</p>
          <h2 className="text-2xl font-narrative font-bold text-gold">Focus Play</h2>
        </div>
        <div className="flex items-center gap-4 mt-1">
          {view === 'contact' && (
            <button
              onClick={() => setView('main')}
              className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors cursor-pointer"
            >
              ← Back
            </button>
          )}
          <button
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground text-2xl leading-none cursor-pointer"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-2xl">
        {view === 'main' && (
          <>
            <p className="font-narrative italic text-foreground/80 text-base leading-relaxed mb-6">
              Focus Play lets you run targeted scenario sessions around a specific governance domain. Instead of a full annual cycle, you work through a curated sequence of scenarios that test one area in depth — the kind of intensive practice that maps directly to how boards actually build expertise.
            </p>
            <p className="text-xs text-foreground/40 uppercase tracking-widest mb-3">Topic packs in development</p>
            <ul className="space-y-2">
              {FOCUS_PACKS.map((pack) => (
                <li key={pack} className="flex items-center gap-2 text-foreground/70 text-sm">
                  <span className="text-gold/50 text-xs">•</span>
                  {pack}
                </li>
              ))}
            </ul>
          </>
        )}

        {view === 'contact' && (
          <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
            <p className="text-foreground/60 text-sm">
              Leave your email and we&apos;ll notify you when Focus Play launches.
            </p>
            <div>
              <label htmlFor="fp-email" className="block text-xs text-foreground/40 uppercase tracking-widest mb-2">
                Email address <span className="text-error">*</span>
              </label>
              <input
                id="fp-email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full bg-navy-dark border border-card-border rounded-lg px-4 py-3 text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-gold/60 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fp-message" className="block text-xs text-foreground/40 uppercase tracking-widest mb-2">
                Message <span className="text-foreground/30">(optional)</span>
              </label>
              <textarea
                id="fp-message"
                name="message"
                placeholder="Which topic pack interests you most?"
                rows={3}
                className="w-full bg-navy-dark border border-card-border rounded-lg px-4 py-3 text-foreground text-sm placeholder:text-foreground/30 focus:outline-none focus:border-gold/60 transition-colors resize-none"
              />
            </div>
            {error && <p className="text-error text-xs">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg bg-gold/15 border border-gold/50 hover:bg-gold/25 transition-colors text-gold font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Sending…' : 'Submit'}
            </button>
          </form>
        )}

        {view === 'submitted' && (
          <div className="flex flex-col items-start gap-3 pt-2">
            <p className="text-gold font-narrative font-semibold text-lg">You&apos;re on the list.</p>
            <p className="text-foreground/60 text-sm">We&apos;ll reach out when Focus Play is ready. Thanks for the interest.</p>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2 rounded-lg bg-card-bg border border-card-border text-foreground/60 hover:text-foreground text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {view === 'main' && (
        <div className="flex-shrink-0 px-6 pb-8 pt-4 border-t border-card-border">
          <button
            onClick={() => setView('contact')}
            className="block w-full py-4 rounded-xl bg-gold/10 border border-gold/40 hover:bg-gold/20 transition-colors text-gold font-semibold text-base text-center cursor-pointer"
          >
            Notify me when available
          </button>
        </div>
      )}
    </div>
  );
}

type SkillLevel = 'newcomer' | 'practitioner' | 'experienced';

const SKILL_LEVELS: { value: SkillLevel; label: string; description: string; recommended: string[] }[] = [
  { value: 'newcomer', label: 'Newcomer', description: 'New to board dynamics and governance', recommended: ['company_harwick'] },
  { value: 'practitioner', label: 'Practitioner', description: 'Some governance experience or background', recommended: ['company_vantage'] },
  { value: 'experienced', label: 'Experienced NED', description: 'Seasoned director or governance professional', recommended: ['company_rheinfeld', 'company_meridian'] },
];

export default function CompanySelectScreen({ onSelectCompany }: CompanySelectScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playMode, setPlayMode] = useState<'general' | 'focus'>('general');
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [skillLevel, setSkillLevel] = useState<SkillLevel | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [jiggleKey, setJiggleKey] = useState(0);

  // Desktop gets the 3D office; phones, tablets in portrait, machines without
  // WebGL and anyone who chose "List view" get the tiles. null = not decided yet
  // (first client render), so neither flashes before the other.
  const [view, setView] = useState<'office' | 'list' | null>(null);
  const [skipIntro, setSkipIntro] = useState(false);
  const [canOffice, setCanOffice] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('boardcraft_skill_level') as SkillLevel | null;
    const office = isDesktopViewport() && webglAvailable();
    const wantsList = localStorage.getItem('boardcraft_select_view') === 'list';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setCanOffice(office);
    setSkipIntro(reduced || localStorage.getItem('boardcraft_office_seen') === '1');
    setView(office && !wantsList ? 'office' : 'list');
    if (saved) {
      setSkillLevel(saved);
    } else if (!office || wantsList) {
      setOnboardingOpen(true);
    }
    // In the office the skill question waits until you've sat down (onSeated)
  }, []);

  const chooseView = useCallback((v: 'office' | 'list') => {
    localStorage.setItem('boardcraft_select_view', v);
    setView(v);
  }, []);

  const recommendedIds = useMemo(
    () => (skillLevel ? SKILL_LEVELS.find((s) => s.value === skillLevel)?.recommended ?? [] : []),
    [skillLevel],
  );

  const officeFolders = useMemo((): OfficeFolder[] => [
    ...companies.map((c) => {
      const fw = FRAMEWORK[c.id];
      return { id: c.id, name: c.name, regime: fw ? `${fw.place} · ${fw.code}` : c.jurisdiction, sealed: false, recommended: recommendedIds.includes(c.id) };
    }),
    ...lockedCompanies.map((c) => ({ id: `locked:${c.name}`, name: c.name, regime: `${c.region} · ${c.industry}`, sealed: true, recommended: false })),
  ], [recommendedIds]);

  const renderPaper = useCallback((folderId: string, actions: { onStart: () => void; onBack: () => void }) => {
    const company = companies.find((c) => c.id === folderId);
    if (!company) return null;
    const fw = FRAMEWORK[company.id] ?? { place: company.jurisdiction, code: '' };
    const gh = company.startingGovernanceHealth;
    return (
      <article className="bc-paper of-paper">
        <div className="flex items-baseline justify-between gap-4 pb-3" style={{ borderBottom: '2px solid var(--ink)' }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]">Board file</p>
          <p className="text-[10px] uppercase tracking-[0.16em] text-right" style={{ color: 'var(--ink-soft)' }}>{company.stockExchange}</p>
        </div>
        <div className="flex items-start gap-4 mt-5">
          <div className="shrink-0 rounded-full" style={{ boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}><CompanyLogo companyId={company.id} size={68} /></div>
          <div className="min-w-0 flex-1">
            <h2 className="bc-serif text-[30px] leading-[1.1] font-bold">{company.name}</h2>
            <p className="bc-serif italic text-[14px] mt-1.5" style={{ color: 'var(--ink-soft)' }}>{company.industry} · {company.headquarters}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="bc-stamp bc-stamp-navy" style={{ transform: 'rotate(-2deg)' }}>{fw.place}</span>
          <span className="text-[12px] font-semibold">{fw.code}</span>
          {recommendedIds.includes(company.id) && <span className="bc-stamp bc-stamp-green" style={{ transform: 'rotate(1.5deg)' }}>Recommended for you</span>}
        </div>

        <div className="grid grid-cols-4 mt-5" style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
          {[...tileStats(company), { label: 'Governance health', value: `${gh} / 100` }].map((st, i) => (
            <div key={st.label} className="py-3 pr-3" style={i > 0 ? { borderLeft: '1px solid var(--rule)', paddingLeft: 12 } : undefined}>
              <p className="text-[8.5px] uppercase tracking-[0.16em]" style={{ color: 'var(--ink-soft)' }}>{st.label}</p>
              <p className="bc-serif text-[18px] font-bold tabular-nums mt-0.5" style={st.label === 'Governance health' ? { color: gh >= 60 ? '#1f6b3a' : gh >= 50 ? '#9a5b00' : '#a32222' } : undefined}>{st.value}</p>
            </div>
          ))}
        </div>

        <h3 className="text-[10px] font-bold uppercase tracking-[0.24em] mt-5 mb-2" style={{ color: 'var(--ink-soft)' }}>The situation</h3>
        <p className="bc-serif text-[15px] leading-[1.7]">{company.narrative}</p>

        <p className="text-[12px] mt-4" style={{ color: 'var(--ink-soft)' }}>
          Difficulty: <b style={{ color: 'var(--ink)' }}>{difficultyLabel(company.difficultyTier)}</b> · {company.eventSchedule.length} events · {company.inheritedBoard.length} inherited board {company.inheritedBoard.length === 1 ? 'member' : 'members'}
          {company.id === 'company_meridian' ? ` · Mission Integrity Score ${company.startingSvIndex}/100` : ''}
        </p>

        <div className="flex items-center justify-between gap-4 mt-6 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <button className="of-btn of-btn-back" onClick={actions.onBack}>‹ Go back</button>
          <button className="of-btn of-btn-start" onClick={actions.onStart}>Start →</button>
        </div>
      </article>
    );
  }, [recommendedIds]);

  const handleLaunch = useCallback((folderId: string) => {
    const company = companies.find((c) => c.id === folderId);
    if (company) onSelectCompany(company);
  }, [onSelectCompany]);

  function handleSkillSelect(level: SkillLevel) {
    setSkillLevel(level);
    setJiggleKey((k) => k + 1);
    localStorage.setItem('boardcraft_skill_level', level);
    setOnboardingOpen(false);
  }

  const onboardingModal = (
      <AnimatePresence>
        {onboardingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25 }}
              className="bc-dialog rounded-2xl p-7 w-full max-w-md"
            >
              <p className="text-xs text-foreground/40 uppercase tracking-widest mb-1">Welcome to BoardCraft</p>
              <h2 className="text-xl font-narrative font-bold text-gold mb-2">Where are you in your governance journey?</h2>
              <p className="text-sm text-foreground/60 mb-5">We&apos;ll suggest the best company to start with.</p>
              <div className="space-y-3">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleSkillSelect(level.value)}
                    className="w-full text-left px-4 py-3 rounded-lg bg-card-bg border border-card-border hover:border-gold/50 hover:bg-gold/5 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-semibold text-foreground">{level.label}</p>
                    <p className="text-xs text-foreground/50 mt-0.5">{level.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setOnboardingOpen(false)}
                className="mt-4 w-full text-xs text-foreground/30 hover:text-foreground/50 transition-colors cursor-pointer text-center"
              >
                Skip
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  );

  if (view === null) return <div className="min-h-screen" style={{ background: '#081220' }} />;

  if (view === 'office') {
    return (
      <>
        <OfficeScene
          folders={officeFolders}
          skipIntro={skipIntro}
          renderPaper={renderPaper}
          onLaunch={handleLaunch}
          onListView={() => chooseView('list')}
          onSeated={() => { if (!localStorage.getItem('boardcraft_skill_level')) setOnboardingOpen(true); }}
          onUnsupported={() => { setCanOffice(false); setView('list'); }}
        />
        {onboardingModal}
      </>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 pt-10 pb-20"
      style={{
        background:
          'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(224,176,68,0.10) 0%, rgba(224,176,68,0) 70%), linear-gradient(180deg, #0a1626 0%, #0d1d31 55%, #070f1b 100%)',
      }}
    >
      {/* Header */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-[10px] uppercase tracking-[0.4em] text-gold/60 mb-3"
      >
        Corporate governance strategy
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-narrative text-gold text-4xl md:text-5xl tracking-[0.18em] md:tracking-[0.3em] mb-3 pl-[0.18em] md:pl-[0.3em]"
      >
        BOARDCRAFT
      </motion.h1>
      <div className="w-24 h-px mb-4" style={{ background: 'linear-gradient(90deg, transparent, #C8960C, transparent)' }} />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-foreground text-lg mb-2 opacity-85 font-narrative"
      >
        Select Your Company
      </motion.p>
      <p className="text-[11px] text-foreground/45 mb-8 text-center">
        {companies.length} boards · {new Set(companies.map((c) => FRAMEWORK[c.id]?.place ?? c.jurisdiction)).size} jurisdictions · each plays under its own governance code
      </p>

      {canOffice && (
        <button
          onClick={() => chooseView('office')}
          className="fixed top-5 right-6 z-20 text-xs font-semibold tracking-wide text-foreground/70 hover:text-gold border border-white/20 hover:border-gold rounded-full px-3.5 py-1.5 bg-black/30 backdrop-blur-sm transition-colors cursor-pointer"
        >
          Office view
        </button>
      )}

      {/* Play Mode Selector */}
      <div className="flex items-center gap-1 mb-8 p-1 rounded-xl border border-white/10 bg-black/30">
        <button
          onClick={() => setPlayMode('general')}
          className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            playMode === 'general'
              ? 'bg-gold text-navy-dark'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          General Play
        </button>
        <button
          onClick={() => { setPlayMode('focus'); setFocusModalOpen(true); }}
          className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
            playMode === 'focus'
              ? 'bg-gold text-navy-dark'
              : 'text-foreground/60 hover:text-foreground'
          }`}
        >
          Focus Play
          <span
            onClick={(e) => { e.stopPropagation(); setFocusModalOpen(true); }}
            className="opacity-50 hover:opacity-90 text-xs leading-none"
            title="What is Focus Play?"
          >
            ⓘ
          </span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl w-full">
        {/* Mobile (single column): the selected card expands IN PLACE — no
            reordering, so it never jumps out from under the player's thumb.
            Desktop (multi column): sm:order-first moves it to the top so the
            full-width expansion doesn't leave a hole in the grid. */}
        {companies.map((company, tileIdx) => {
          const isExpanded = selectedId === company.id;
          const isRecommended = !!skillLevel && (SKILL_LEVELS.find((s) => s.value === skillLevel)?.recommended ?? []).includes(company.id);
          const fw = FRAMEWORK[company.id] ?? { place: company.jurisdiction, code: '' };
          const stats = tileStats(company);
          return (
            <motion.div
              key={isRecommended ? `${company.id}-${jiggleKey}` : company.id}
              layoutId={`company-tile-${company.id}`}
              layout
              onClick={() => setSelectedId(isExpanded ? null : company.id)}
              className={`group relative rounded-2xl border cursor-pointer transition-[border-color,box-shadow] duration-200 overflow-hidden
                ${isExpanded
                  ? 'border-gold col-span-1 sm:col-span-2 lg:col-span-3 sm:order-first shadow-[0_0_0_1px_rgba(200,150,12,0.35),0_30px_60px_-30px_rgba(0,0,0,0.9)]'
                  : 'border-white/10 hover:border-gold/70 hover:shadow-[0_24px_50px_-28px_rgba(224,176,68,0.55)]'
                }`}
              style={{ background: 'linear-gradient(160deg, rgba(26,53,82,0.75) 0%, rgba(12,26,44,0.92) 55%, rgba(8,18,31,0.96) 100%)' }}
              initial={{ opacity: 0, y: 14 }}
              animate={isRecommended ? { opacity: 1, y: 0, x: [0, -6, 6, -4, 4, -2, 2, 0] } : { opacity: 1, y: 0, x: 0 }}
              transition={isRecommended
                ? { duration: 0.45, ease: 'easeInOut', delay: 0.1 }
                : { duration: 0.35, delay: 0.06 * tileIdx, layout: { duration: 0.4, type: 'spring', stiffness: 200, damping: 25 } }}
            >
              {/* brass hairline */}
              <div className="absolute inset-x-0 top-0 h-px opacity-70 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(90deg, transparent, #E0B044 30%, #E0B044 70%, transparent)' }} />

              <div className="p-5">
                <div className="flex items-start gap-3.5">
                  <div className="shrink-0 rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #F0CE6E, #8A6A0A 55%, #E0B044)', boxShadow: '0 6px 14px rgba(0,0,0,0.5)' }}>
                    <div className="rounded-full bg-[#0A1524]"><CompanyLogo companyId={company.id} size={50} /></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-narrative text-foreground text-[19px] leading-tight font-semibold">
                      {company.name}
                    </h2>
                    <p className="text-foreground/55 text-[12px] leading-snug mt-1 line-clamp-2">
                      {company.industry}
                    </p>
                  </div>
                  <HealthGauge value={company.startingGovernanceHealth} />
                </div>

                <div className="flex items-center flex-wrap gap-1.5 mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] px-2 py-1 rounded bg-gold/15 text-gold border border-gold/30">{fw.place}</span>
                  <span className="text-[10.5px] px-2 py-1 rounded bg-black/35 text-foreground/75 border border-white/10">{fw.code}</span>
                </div>
                <p className="text-[11px] text-foreground/40 mt-2 truncate" title={company.stockExchange}>{company.stockExchange}</p>

                <div className="grid grid-cols-3 mt-4 rounded-lg border border-white/[0.07] bg-black/25 divide-x divide-white/[0.07]">
                  {stats.map((st) => (
                    <div key={st.label} className="px-3 py-2">
                      <p className="text-[8.5px] uppercase tracking-[0.16em] text-foreground/40">{st.label}</p>
                      <p className="text-[13px] font-semibold text-foreground/90 tabular-nums mt-0.5 truncate">{st.value}</p>
                    </div>
                  ))}
                </div>

                {/* Mission Integrity Score — Meridian Foundation only */}
                {company.id === 'company_meridian' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-foreground/55 mb-1">
                      <span className="uppercase tracking-[0.14em]">Mission Integrity Score</span>
                      <span className="tabular-nums">{company.startingSvIndex}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${company.startingSvIndex}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Difficulty & event count */}
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <span className="flex items-center gap-1.5" title={`Difficulty: ${difficultyLabel(company.difficultyTier)}`}>
                    <span className="flex gap-[3px]">
                      {[1, 2, 3, 4].map((n) => (
                        <span key={n} className={`w-1.5 h-3 rounded-[1px] ${n <= company.difficultyTier ? (company.difficultyTier >= 4 ? 'bg-error' : 'bg-gold') : 'bg-white/12'}`} />
                      ))}
                    </span>
                    <span className={`text-xs ${difficultyColor(company.difficultyTier)}`}>
                      Difficulty: {difficultyLabel(company.difficultyTier)}
                    </span>
                  </span>
                  <span className="text-xs text-foreground/40">
                    {company.eventSchedule.length} events
                  </span>
                  {isRecommended && (
                    <span className="text-[10px] uppercase tracking-wider bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                      Recommended for you
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-white/[0.07] pt-4 md:flex md:items-end md:gap-8">
                      <div className="flex-1">
                        <p className="text-[9px] uppercase tracking-[0.22em] text-gold/70 mb-1.5">The situation</p>
                        <p className="font-narrative text-foreground text-sm leading-relaxed opacity-85">
                          {getFirstTwoSentences(company.narrative)}
                        </p>
                        <p className="text-[11px] text-foreground/45 mt-3">
                          {company.headquarters} · {company.inheritedBoard.length} inherited board {company.inheritedBoard.length === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCompany(company);
                        }}
                        className="mt-5 md:mt-0 w-full md:w-64 bg-gold hover:bg-gold-light text-navy-dark font-semibold py-3 px-6 rounded-lg transition-colors text-sm tracking-wide shadow-[0_10px_30px_-10px_rgba(224,176,68,0.8)]"
                      >
                        Start Game
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Locked Tiles */}
        {lockedCompanies.map((company) => (
          <div
            key={company.name}
            className="relative rounded-2xl border border-dashed border-white/15 bg-black/20 p-5 select-none min-h-[180px] flex flex-col items-center justify-center text-center"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C8960C" strokeWidth="1.5" opacity="0.6">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 018 0v3" />
            </svg>
            <span className="text-gold/70 text-[10px] font-semibold tracking-[0.25em] uppercase mt-3">
              Coming Soon
            </span>
            <h2 className="font-narrative text-foreground/60 text-lg font-semibold mt-1.5">
              {company.name}
            </h2>
            <p className="text-foreground/35 text-xs mt-1">
              {company.region} · {company.industry} · {difficultyLabel(company.difficulty)}
            </p>
          </div>
        ))}
      </div>

      {/* Copyright — pinned on desktop; in-flow on mobile so it never overlaps the cards */}
      <div className="hidden md:block">
        <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />
      </div>
      <SiteFooter className="md:hidden mt-10" />

      <AnimatePresence>
        {focusModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
          >
            <FocusPlayModal onClose={() => { setFocusModalOpen(false); setPlayMode('general'); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {onboardingModal}
    </div>
  );
}
