'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type {
  GameEvent,
  Director,
  BoardSeat,
} from '@/types/game';
import { DOMAIN_LABELS } from '@/engine/boardConstants';
import EventIllustration from './EventIllustration';

interface EventCardProps {
  event: GameEvent;
  directors: Director[];
  boardSeats: BoardSeat[];
  onSelectStrategy: (strategyId: string) => void;
  onDoNothing: () => void;
}

function tierLeftBorderHex(tier: 1 | 2 | 3): string {
  if (tier === 1) return '#C8960C'; // amber/gold
  if (tier === 2) return '#E87040'; // orange
  return '#C0392B';                  // red
}

function formatFee(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `£${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}m`;
  }
  if (value >= 1_000) {
    return `£${Math.round(value / 1_000)}k`;
  }
  return `£${value}`;
}

export default function EventCard({
  event,
  directors,
  boardSeats,
  onSelectStrategy,
  onDoNothing,
}: EventCardProps) {
  const boardDirectors = useMemo(() => {
    const boardIds = new Set(boardSeats.map((s) => s.directorId));
    return directors.filter((d) => boardIds.has(d.id));
  }, [boardSeats, directors]);

  const gateStatus = useMemo(() => {
    const result: Record<string, { met: boolean; failedGates: string[] }> = {};

    for (const strategy of event.strategies) {
      if (strategy.competencyGates.length === 0) {
        result[strategy.id] = { met: true, failedGates: [] };
        continue;
      }

      const failedGates: string[] = [];
      for (const gate of strategy.competencyGates) {
        const anyMeets = boardDirectors.some(
          (d) => d.domainRatings[gate.domain] >= gate.minimumRating
        );
        if (!anyMeets) {
          failedGates.push(
            `Requires ${DOMAIN_LABELS[gate.domain]} ≥ ${gate.minimumRating} — no qualified director on board`
          );
        }
      }
      result[strategy.id] = { met: failedGates.length === 0, failedGates };
    }

    return result;
  }, [event.strategies, boardDirectors]);

  const isEvent08 = event.strategies.length === 0;

  const getFallbackLabel = (fallbackId: string): string => {
    const fallbackStrategy = event.strategies.find((s) => s.id === fallbackId);
    return fallbackStrategy ? fallbackStrategy.label : fallbackId;
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="rounded-xl bg-card-bg border border-card-border p-6 w-full"
      style={{ borderLeftWidth: '4px', borderLeftColor: tierLeftBorderHex(event.tier) }}
    >
      {/* Header: name */}
      <div className="mb-3">
        <h2 className="text-xl font-bold text-gold">{event.name}</h2>
      </div>

      {/* Domain tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/40">
          {DOMAIN_LABELS[event.primaryDomain]} ({Math.round(event.primaryWeight * 100)}%)
        </span>
        {event.secondaryDomains.map(({ domain, weight }) => (
          <span
            key={domain}
            className="text-[11px] px-2 py-0.5 rounded-full bg-navy-light text-foreground/70 border border-card-border"
          >
            {DOMAIN_LABELS[domain]} ({Math.round(weight * 100)}%)
          </span>
        ))}
      </div>

      {/* Narrative with floating illustration */}
      <div className="mb-6 px-1">
        <EventIllustration
          type={event.illustrationType ?? 'default'}
          className="float-right ml-4 mb-2"
        />
        <p className="font-narrative italic text-foreground/80 leading-relaxed">
          {event.narrativeCard}
        </p>
      </div>

      {/* Strategy options or Event 08 special handling */}
      {isEvent08 ? (
        <button
          onClick={onDoNothing}
          className="w-full py-3 px-4 rounded-lg bg-gold text-navy font-bold text-sm hover:bg-gold-light transition-colors cursor-pointer"
        >
          Meridian Governance Report — Review and Continue
        </button>
      ) : (
        <>
          {/* Strategy cards */}
          <div className="space-y-3">
            {event.strategies.map((strategy) => {
              const status = gateStatus[strategy.id];
              const isLocked = !status?.met;

              return (
                <motion.button
                  key={strategy.id}
                  whileHover={isLocked ? {} : { borderColor: '#C8960C' }}
                  onClick={() => !isLocked && onSelectStrategy(strategy.id)}
                  disabled={isLocked}
                  className={`w-full text-left rounded-lg border p-4 transition-all ${
                    isLocked
                      ? 'opacity-50 cursor-not-allowed border-card-border bg-navy-dark'
                      : 'border-card-border bg-navy-light hover:shadow-[0_0_12px_rgba(200,150,12,0.15)] cursor-pointer'
                  }`}
                >
                  <div className="mb-1">
                    <span className="font-bold text-sm text-foreground">
                      {strategy.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/60 leading-relaxed">
                    {strategy.description}
                  </p>

                  {/* Gate failure messages */}
                  {isLocked && status?.failedGates.map((msg, i) => (
                    <p key={i} className="text-[11px] text-error/80 mt-2">
                      {msg}
                    </p>
                  ))}

                  {/* Fallback note */}
                  {isLocked && strategy.fallback && (
                    <p className="text-[11px] text-warning/70 mt-1 italic">
                      Will fall back to: {getFallbackLabel(strategy.fallback)}
                    </p>
                  )}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
