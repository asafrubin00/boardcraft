'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameEvent, Director, BoardSeat } from '@/types/game';
import { DOMAIN_LABELS } from '@/engine/boardConstants';
import DirectorPortrait from './DirectorPortrait';
import { playDirectorSelect } from '@/engine/soundEngine';

interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: GameEvent;
  strategyId: string;
  directors: Director[];
  boardSeats: BoardSeat[];
  onConfirmDeployment: (directorIds: string[]) => void;
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

function scoreColor(rating: number): string {
  if (rating >= 70) return 'text-gold';
  if (rating >= 50) return 'text-white';
  return 'text-foreground/50';
}

function energyBarColor(energy: number): string {
  if (energy >= 60) return 'bg-success';
  if (energy >= 20) return 'bg-warning';
  return 'bg-error';
}

const MAX_SELECTED = 3;

export default function DeploymentModal({
  isOpen,
  onClose,
  event,
  strategyId,
  directors,
  boardSeats,
  onConfirmDeployment,
}: DeploymentModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const boardDirectors = useMemo(() => {
    const boardIdSet = new Set(boardSeats.map((s) => s.directorId));
    return directors.filter((d) => boardIdSet.has(d.id));
  }, [boardSeats, directors]);

  const toggleDirector = (id: string) => {
    playDirectorSelect();
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onConfirmDeployment(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleClose = () => {
    setSelectedIds([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="bg-navy rounded-xl border border-card-border max-w-4xl w-full max-h-[90vh] overflow-hidden p-3 md:p-5 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-foreground">
                  Deploy Directors - {event.name}
                </h2>
                <span className="text-xs text-foreground/50 font-semibold">
                  {selectedIds.length}/{MAX_SELECTED} selected
                </span>
              </div>
              <p className="text-xs text-foreground/60 mt-0.5">
                Select up to 3 · Primary: <span className="text-gold font-semibold">{DOMAIN_LABELS[event.primaryDomain]}</span>
              </p>
            </div>

            {/* Director grid - compact, responsive up to 4 cols */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 flex-1 min-h-0">
              {boardDirectors.map((director) => {
                const isExhausted = director.currentEnergy === 0;
                const isSelected = selectedIds.includes(director.id);
                const isMaxed =
                  selectedIds.length >= MAX_SELECTED && !isSelected;
                const isDisabled = isExhausted || isMaxed;
                const domainRating =
                  director.domainRatings[event.primaryDomain];

                return (
                  <motion.button
                    key={director.id}
                    whileHover={isDisabled ? {} : { scale: 1.02 }}
                    onClick={() => !isDisabled && toggleDirector(director.id)}
                    disabled={isDisabled}
                    className={`relative text-left rounded-lg border p-3 transition-all ${
                      isSelected
                        ? 'border-gold bg-card-bg shadow-[0_0_10px_rgba(200,150,12,0.2)]'
                        : isExhausted
                          ? 'border-error/50 bg-navy-dark opacity-60 cursor-not-allowed'
                          : isMaxed
                            ? 'border-card-border bg-navy-dark opacity-50 cursor-not-allowed'
                            : 'border-card-border bg-card-bg hover:border-gold/40 cursor-pointer'
                    }`}
                  >
                    {/* Portrait + name row */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="shrink-0 rounded-full overflow-hidden border border-card-border">
                        <DirectorPortrait directorId={director.id} size={36} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-foreground font-narrative leading-snug truncate">
                          {director.name}
                        </h3>
                        {isExhausted && (
                          <p className="text-[11px] font-bold tracking-widest text-error uppercase">
                            Exhausted
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Domain rating - compact */}
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className={`text-xl font-bold leading-none ${scoreColor(domainRating)}`}>
                        {domainRating}
                      </span>
                      <span className="text-[11px] text-foreground/50 uppercase truncate">
                        {DOMAIN_LABELS[event.primaryDomain]}
                      </span>
                    </div>

                    {/* Stamina bar */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-foreground/50 shrink-0">Stamina</span>
                      <div className="flex-1 h-1.5 bg-navy-dark rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${energyBarColor(director.currentEnergy)}`}
                          style={{ width: `${director.currentEnergy}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-foreground/50 shrink-0">{director.currentEnergy}%</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={handleClose}
                className="text-sm font-medium py-2 px-5 rounded-lg border border-card-border text-foreground/70 hover:text-foreground hover:border-foreground/30 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIds.length === 0}
                className={`text-sm font-bold py-2 px-5 rounded-lg transition-colors ${
                  selectedIds.length > 0
                    ? 'bg-gold text-navy hover:bg-gold-light cursor-pointer'
                    : 'bg-gold/30 text-navy/50 cursor-not-allowed'
                }`}
              >
                Confirm Deployment
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
