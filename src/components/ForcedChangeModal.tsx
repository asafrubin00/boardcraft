'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ForcedDirectorChange, Director, BoardRole, BoardSeat } from '@/types/game';
import DirectorPortrait from './DirectorPortrait';
import { computeFeeWithPremium } from '@/engine/compliance';

interface ForcedChangeModalProps {
  forcedChange: ForcedDirectorChange;
  directors: Director[];
  boardSeats: BoardSeat[];
  companyDirectorIds: string[];
  budget: number;
  committed: number;
  jurisdiction?: string;
  /** Called only when player has selected a replacement AND confirmed - atomic dismiss+replace */
  onDismissAndReplace: (dismissedDirectorId: string, newDirectorId: string, role: BoardRole) => void;
  onRetain?: () => void;
}

const ROLE_OPTIONS: { role: BoardRole; label: string }[] = [
  { role: 'ned', label: 'NED' },
  { role: 'sid', label: 'SID / LID' },
  { role: 'auditChair', label: 'Audit Chair' },
  { role: 'remChair', label: 'Rem/Comp Chair' },
  { role: 'nomChair', label: 'Nom Chair' },
];

export default function ForcedChangeModal({
  forcedChange,
  directors,
  boardSeats,
  companyDirectorIds,
  budget,
  committed,
  jurisdiction = 'UK',
  onDismissAndReplace,
  onRetain,
}: ForcedChangeModalProps) {
  const [phase, setPhase] = useState<'decision' | 'replacement'>('decision');
  const [selectedDirId, setSelectedDirId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<BoardRole>('ned');

  const boardDirIds = useMemo(() => new Set(boardSeats.map((s) => s.directorId)), [boardSeats]);

  // Available directors for replacement (in company pool, not on board)
  const availableDirectors = useMemo(() => {
    const companySet = new Set(companyDirectorIds);
    return directors.filter(
      (d) => companySet.has(d.id) && !boardDirIds.has(d.id) && d.id !== forcedChange.directorId
    );
  }, [directors, boardDirIds, companyDirectorIds, forcedChange.directorId]);

  const remaining = budget - committed;
  const selectedDir = selectedDirId ? directors.find((d) => d.id === selectedDirId) : null;
  const replacementFee = selectedDir ? computeFeeWithPremium(selectedDir.annualFee, selectedRole) : 0;
  const canAfford = replacementFee <= remaining;

  const handleConfirm = () => {
    if (!selectedDirId || !canAfford) return;
    // Single atomic call - dismiss the departing director AND appoint replacement
    onDismissAndReplace(forcedChange.directorId, selectedDirId, selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-navy border-2 border-error/50 rounded-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">&#9888;</span>
          <h2 className="text-xl font-bold text-error font-narrative">
            {forcedChange.type === 'health_crisis' && 'Director Health Crisis'}
            {forcedChange.type === 'misconduct' && 'Director Misconduct'}
            {forcedChange.type === 'regulatory_disqualification' && 'Regulatory Disqualification'}
          </h2>
        </div>

        <p className="text-foreground/80 text-sm mb-6 font-narrative italic leading-relaxed">
          {forcedChange.narrative}
        </p>

        <AnimatePresence mode="wait">
          {phase === 'decision' ? (
            <motion.div key="decision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Show affected director */}
              <div className="flex items-center gap-3 bg-error/10 border border-error/30 rounded-lg p-3 mb-6">
                <div className="rounded-full overflow-hidden border-2 border-error/50">
                  <DirectorPortrait directorId={forcedChange.directorId} size={48} />
                </div>
                <div>
                  <div className="font-bold text-foreground">{forcedChange.directorName}</div>
                  <div className="text-xs text-error">
                    {forcedChange.turnsRemaining} turn{forcedChange.turnsRemaining !== 1 ? 's' : ''} to resolve
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Dismiss & Replace - moves to replacement picker, no game state change yet */}
                <button
                  onClick={() => setPhase('replacement')}
                  className="w-full py-3 px-4 rounded-lg bg-gold/10 border border-gold/40 text-gold font-semibold hover:bg-gold/20 transition-colors text-sm cursor-pointer"
                >
                  Dismiss {forcedChange.directorName} &amp; Appoint Replacement
                </button>

                {/* Retain (misconduct only) */}
                {forcedChange.canRetain && onRetain && (
                  <button
                    onClick={onRetain}
                    className="w-full py-3 px-4 rounded-lg bg-error/10 border border-error/30 text-error font-semibold hover:bg-error/20 transition-colors text-sm cursor-pointer"
                  >
                    Retain {forcedChange.directorName} (GH -8, proxy flags)
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div key="replacement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Back button */}
              <button
                onClick={() => { setPhase('decision'); setSelectedDirId(null); }}
                className="text-xs text-foreground/50 hover:text-foreground mb-3 flex items-center gap-1 transition-colors cursor-pointer"
              >
                &#8592; Back
              </button>

              <h3 className="text-sm font-semibold text-gold uppercase tracking-wide mb-3">Select Replacement Director</h3>

              {/* Role selector */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-foreground/50">Role:</span>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as BoardRole)}
                  className="text-xs bg-navy-dark text-foreground border border-card-border rounded px-2 py-1 focus:outline-none focus:border-gold"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.role} value={r.role}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Director grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto mb-4">
                {availableDirectors.map((d) => {
                  const fee = computeFeeWithPremium(d.annualFee, selectedRole);
                  const affordable = fee <= remaining;
                  const isSelected = selectedDirId === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => affordable && setSelectedDirId(d.id)}
                      disabled={!affordable}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-gold bg-gold/10'
                          : affordable
                            ? 'border-card-border hover:border-gold/50'
                            : 'border-card-border opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div className="rounded-full overflow-hidden border border-gold/30 shrink-0">
                        <DirectorPortrait directorId={d.id} size={36} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{d.name}</div>
                        <div className="text-[11px] text-foreground/50">
                          {jurisdiction === 'US' ? '$' : '£'}{Math.round(fee / 1000)}k
                          {!affordable && ' (over budget)'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {availableDirectors.length === 0 && (
                <p className="text-foreground/50 text-sm italic text-center py-4">No available directors in the pool.</p>
              )}

              {/* Confirm - fires the atomic dismiss+replace only when a director is selected */}
              <button
                disabled={!selectedDirId || !canAfford}
                onClick={handleConfirm}
                className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
                  selectedDirId && canAfford
                    ? 'bg-gold text-navy-dark hover:bg-gold-light cursor-pointer'
                    : 'bg-navy-light text-foreground/40 cursor-not-allowed'
                }`}
              >
                {selectedDirId ? `Confirm: Dismiss & Appoint ${selectedDir?.name}` : 'Select a Director to Continue'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
