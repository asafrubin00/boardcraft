'use client';

import type { Director, CompetencyDomain } from '@/types/game';
import { ALL_DOMAINS, DOMAIN_SHORT, DOMAIN_LABELS } from '@/engine/boardConstants';
import DirectorCard from './DirectorCard';

interface DirectorPoolProps {
  directors: Director[];
  boardDirectorIds: string[];
  onAddDirector: (directorId: string) => void;
  filterDomain: CompetencyDomain | null;
  onFilterChange: (domain: CompetencyDomain | null) => void;
  sortBy: 'fee' | 'domain';
  onSortChange: (sort: 'fee' | 'domain') => void;
}

export default function DirectorPool({
  directors,
  boardDirectorIds,
  onAddDirector,
  filterDomain,
  onFilterChange,
  sortBy,
  onSortChange,
}: DirectorPoolProps) {
  const onBoardSet = new Set(boardDirectorIds);

  // Sort directors
  const sorted = [...directors].sort((a, b) => {
    // Directors on board go to the bottom
    const aOnBoard = onBoardSet.has(a.id);
    const bOnBoard = onBoardSet.has(b.id);
    if (aOnBoard !== bOnBoard) return aOnBoard ? 1 : -1;

    if (sortBy === 'fee') {
      return a.annualFee - b.annualFee;
    }
    if (sortBy === 'domain' && filterDomain) {
      return b.domainRatings[filterDomain] - a.domainRatings[filterDomain];
    }
    return 0;
  });

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-bold text-foreground mb-3">Director Pool</h2>

      {/* Domain filter buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <button
          onClick={() => onFilterChange(null)}
          className={`text-[11px] px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
            filterDomain === null
              ? 'bg-gold text-navy-dark'
              : 'bg-navy-dark text-foreground/60 hover:text-foreground'
          }`}
        >
          All
        </button>
        {ALL_DOMAINS.map((domain) => (
          <button
            key={domain}
            onClick={() => onFilterChange(domain)}
            title={DOMAIN_LABELS[domain]}
            className={`text-[11px] px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
              filterDomain === domain
                ? 'bg-gold text-navy-dark'
                : 'bg-navy-dark text-foreground/60 hover:text-foreground'
            }`}
          >
            {DOMAIN_SHORT[domain]}
          </button>
        ))}
      </div>

      {/* Sort toggle */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-foreground/50">Sort:</span>
        <button
          onClick={() => onSortChange('fee')}
          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
            sortBy === 'fee'
              ? 'bg-gold/20 text-gold border border-gold/40'
              : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          By Fee
        </button>
        <button
          onClick={() => onSortChange('domain')}
          className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
            sortBy === 'domain'
              ? 'bg-gold/20 text-gold border border-gold/40'
              : 'text-foreground/50 hover:text-foreground'
          }`}
        >
          By Domain
        </button>
      </div>

      {/* Director list */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {sorted.map((director) => {
          const isOnBoard = onBoardSet.has(director.id);
          return (
            <div
              key={director.id}
              className={isOnBoard ? 'opacity-40 pointer-events-none' : ''}
            >
              {isOnBoard && (
                <div className="text-[11px] text-foreground/50 font-medium mb-0.5 pl-1">
                  On Board
                </div>
              )}
              {director.availabilityTier === 'C' && !isOnBoard && (
                <div className="text-[11px] text-gold font-medium mb-0.5 pl-1">
                  Search Firm Only
                </div>
              )}
              <DirectorCard
                director={director}
                isOnBoard={isOnBoard}
                compact
                onAdd={isOnBoard ? undefined : () => onAddDirector(director.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
