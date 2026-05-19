'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { companies } from '@/data/company';
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
  { name: 'Pacific Minerals Corp', region: 'AU', industry: 'Mining', difficulty: 1 },
  { name: 'Nextera Digital Holdings', region: 'US', industry: 'Tech', difficulty: 2 },
  { name: 'Eurobank Continental', region: 'EU', industry: 'Banking', difficulty: 4 },
  { name: 'Nordic Pharma Group', region: 'EU', industry: 'Healthcare', difficulty: 2 },
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

export default function CompanySelectScreen({ onSelectCompany }: CompanySelectScreenProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center px-6 py-12">
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

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Playable Company Tiles */}
        {companies.map((company) => {
          const isExpanded = selectedId === company.id;
          return (
            <motion.div
              key={company.id}
              layoutId={`company-tile-${company.id}`}
              onClick={() => setSelectedId(isExpanded ? null : company.id)}
              className={`relative rounded-xl border cursor-pointer transition-colors
                ${isExpanded
                  ? 'bg-card-bg border-gold col-span-1 sm:col-span-2 lg:col-span-3'
                  : 'bg-card-bg border-card-border hover:border-gold hover:bg-navy-light'
                }
                p-5`}
              transition={{ layout: { duration: 0.4, type: 'spring', stiffness: 200, damping: 25 } }}
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
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs ${difficultyColor(company.difficultyTier)}`}>
                    Difficulty: {difficultyLabel(company.difficultyTier)}
                  </span>
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
    </div>
  );
}
