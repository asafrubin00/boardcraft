'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companies } from '@/data/company';
import SiteFooter from './SiteFooter';
import type { Company } from '@/types/game';
import CompanyLogo from './CompanyLogo';

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

const jurisdictionFlag = (jurisdiction: string) => {
  switch (jurisdiction) {
    case 'UK': return '🇬🇧 UK';
    case 'US': return '🇺🇸 US';
    case 'EU': return '🇪🇺 EU';
    case 'AU': return '🇦🇺 AU';
    default: return jurisdiction;
  }
};

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

  useEffect(() => {
    const saved = localStorage.getItem('boardcraft_skill_level') as SkillLevel | null;
    if (saved) {
      setSkillLevel(saved);
    } else {
      setOnboardingOpen(true);
    }
  }, []);

  function handleSkillSelect(level: SkillLevel) {
    setSkillLevel(level);
    setJiggleKey((k) => k + 1);
    localStorage.setItem('boardcraft_skill_level', level);
    setOnboardingOpen(false);
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center px-6 pt-12 pb-20">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="font-narrative text-gold text-4xl tracking-widest mb-2"
      >
        BOARDCRAFT
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-foreground text-lg mb-10 opacity-80"
      >
        Select Your Company
      </motion.p>

      {/* Play Mode Selector */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setPlayMode('general')}
          className={`px-5 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
            playMode === 'general'
              ? 'bg-gold/15 border-gold text-gold'
              : 'bg-card-bg border-card-border text-foreground/60 hover:border-foreground/40'
          }`}
        >
          General Play
        </button>
        <button
          onClick={() => { setPlayMode('focus'); setFocusModalOpen(true); }}
          className={`flex items-center gap-1.5 px-5 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
            playMode === 'focus'
              ? 'bg-gold/15 border-gold text-gold'
              : 'bg-card-bg border-card-border text-foreground/60 hover:border-foreground/40'
          }`}
        >
          Focus Play
          <span
            onClick={(e) => { e.stopPropagation(); setFocusModalOpen(true); }}
            className="text-foreground/40 hover:text-foreground/70 text-xs leading-none"
            title="What is Focus Play?"
          >
            ⓘ
          </span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Playable Company Tiles — selected company reorders to the front */}
        {[...companies]
          .sort((a, b) => (a.id === selectedId ? -1 : b.id === selectedId ? 1 : 0))
          .map((company) => {
          const isExpanded = selectedId === company.id;
          const isRecommended = !!skillLevel && (SKILL_LEVELS.find((s) => s.value === skillLevel)?.recommended ?? []).includes(company.id);
          return (
            <motion.div
              key={isRecommended ? `${company.id}-${jiggleKey}` : company.id}
              layoutId={`company-tile-${company.id}`}
              layout
              onClick={() => setSelectedId(isExpanded ? null : company.id)}
              className={`relative rounded-xl border cursor-pointer transition-colors
                ${isExpanded
                  ? 'bg-card-bg border-gold col-span-1 sm:col-span-2 lg:col-span-3'
                  : 'bg-card-bg border-card-border hover:border-gold hover:bg-navy-light'
                }
                p-5`}
              animate={isRecommended ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
              transition={isRecommended
                ? { duration: 0.45, ease: 'easeInOut', delay: 0.1 }
                : { layout: { duration: 0.4, type: 'spring', stiffness: 200, damping: 25 } }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <CompanyLogo companyId={company.id} size={40} />
                  <h2 className="font-narrative text-foreground text-xl font-semibold">
                    {company.name}
                  </h2>
                </div>
                <p className="text-foreground text-sm opacity-70">
                  {company.industry}
                </p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-foreground">{jurisdictionFlag(company.jurisdiction)}</span>
                  <span className="bg-navy-dark text-foreground px-2 py-0.5 rounded text-xs">
                    {company.stockExchange} - {company.marketCap}
                  </span>
                </div>

                {/* Governance Health Bar */}
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-foreground opacity-70 mb-1">
                    <span>Governance Health</span>
                    <span>{company.startingGovernanceHealth}/100</span>
                  </div>
                  <div className="w-full h-2 bg-navy-dark rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gold rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${company.startingGovernanceHealth}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Mission Integrity Score — Meridian Foundation only */}
                {company.id === 'company_meridian' && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-xs text-foreground opacity-70 mb-1">
                      <span>Mission Integrity Score</span>
                      <span>{company.startingSvIndex}/100</span>
                    </div>
                    <div className="w-full h-2 bg-navy-dark rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500/70 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${company.startingSvIndex}%` }}
                        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                )}

                {/* Difficulty Badge & Event count */}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className={`text-xs ${difficultyColor(company.difficultyTier)}`}>
                    Difficulty: {difficultyLabel(company.difficultyTier)}
                  </span>
                  {isRecommended && (
                    <span className="text-xs bg-gold/10 text-gold border border-gold/30 px-2 py-0.5 rounded font-semibold">
                      Recommended for you
                    </span>
                  )}
                  {company.id === 'company_meridian' && (
                    <span className="text-xs bg-emerald-900/50 text-emerald-300 border border-emerald-700/40 px-2 py-0.5 rounded">
                      UK Charity (CIO)
                    </span>
                  )}
                  <span className="text-xs text-foreground/40">
                    {company.eventSchedule.length} events
                  </span>
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
                    <p className="font-narrative text-foreground text-sm leading-relaxed mt-4 opacity-85">
                      {getFirstTwoSentences(company.narrative)}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCompany(company);
                      }}
                      className="mt-5 w-full bg-gold hover:bg-gold-light text-navy-dark font-semibold py-3 px-6 rounded-lg transition-colors text-sm tracking-wide"
                    >
                      Start Game
                    </motion.button>
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
            className="relative rounded-xl border border-card-border bg-card-bg p-5 opacity-40 select-none"
          >
            {/* Lock Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-xl bg-navy-dark/50">
              <span className="text-3xl mb-2">🔒</span>
              <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
                Coming Soon
              </span>
            </div>

            {/* Tile Content (greyed out behind overlay) */}
            <div className="flex flex-col gap-2">
              <h2 className="font-narrative text-foreground text-xl font-semibold">
                {company.name}
              </h2>
              <p className="text-foreground text-sm opacity-70">
                {company.region} - {company.industry}
              </p>
              <span className={`text-xs ${difficultyColor(company.difficulty)}`}>
                Difficulty: {difficultyLabel(company.difficulty)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <SiteFooter vertical className="fixed bottom-4 right-4 z-10" />

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

      {/* Onboarding skill-level modal */}
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
              className="bg-navy border border-card-border rounded-xl p-6 w-full max-w-md"
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
    </div>
  );
}
