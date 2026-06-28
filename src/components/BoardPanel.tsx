'use client';

import type { BoardSeat, Director, BoardRole } from '@/types/game';
import { ROLE_LABELS, AVAILABLE_ROLES } from '@/engine/boardConstants';
import DirectorCard from './DirectorCard';

interface BoardPanelProps {
  seats: BoardSeat[];
  directors: Director[];
  onRemoveDirector: (directorId: string) => void;
  onRoleChange: (directorId: string, role: BoardRole) => void;
}

/** Ordering priority for roles. Lower = higher on the list. */
const ROLE_ORDER: Record<BoardRole, number> = {
  chair: 0,
  auditChair: 1,
  remChair: 2,
  nomChair: 3,
  sid: 4,
  esgChair: 5,
  riskChair: 6,
  techChair: 7,
  safetyEnvChair: 8,
  energyTransitionChair: 9,
  csrdChair: 10,
  strategyChair: 11,
  sustainabilityChair: 12,
  ned: 13,
};

const MANDATORY_ROLES: BoardRole[] = ['chair', 'auditChair'];

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

export default function BoardPanel({
  seats,
  directors,
  onRemoveDirector,
  onRoleChange,
}: BoardPanelProps) {
  const directorMap = new Map(directors.map((d) => [d.id, d]));
  const filledRoles = new Set(seats.map((s) => s.role));

  // Sort seats by role priority
  const sortedSeats = [...seats].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
  );

  // Determine which mandatory roles are not yet filled
  const emptyMandatory = MANDATORY_ROLES.filter((r) => !filledRoles.has(r));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-foreground">Your Board</h2>
        <span className="text-xs text-foreground/50">
          {seats.length} director{seats.length !== 1 ? 's' : ''} seated
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {/* Empty mandatory role placeholders first */}
        {emptyMandatory.map((role) => (
          <div
            key={role}
            className="rounded-lg border-2 border-dashed border-card-border p-4 flex items-center justify-center min-h-[72px]"
          >
            <span className="text-sm text-foreground/50 italic">
              {ROLE_LABELS[role]} - vacant
            </span>
          </div>
        ))}

        {/* Filled seats */}
        {sortedSeats.map((seat) => {
          const director = directorMap.get(seat.directorId);
          if (!director) return null;

          const baseFee = director.annualFee;
          const totalFee = seat.feeWithPremium;
          const premium = totalFee - baseFee;

          return (
            <div key={seat.directorId}>
              {/* Role label + fee breakdown */}
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-semibold text-gold">
                  {ROLE_LABELS[seat.role]}
                </span>
                <span className="text-[11px] text-foreground/50">
                  {formatFee(baseFee)}
                  {premium > 0 && (
                    <>
                      {' + '}
                      <span className="text-gold-light">
                        {formatFee(premium)}
                      </span>
                      {' = '}
                      <span className="text-gold font-medium">
                        {formatFee(totalFee)}
                      </span>
                    </>
                  )}
                </span>
              </div>

              <DirectorCard
                director={director}
                isOnBoard
                assignedRole={seat.role}
                onRemove={() => onRemoveDirector(seat.directorId)}
                onRoleChange={(role) => onRoleChange(seat.directorId, role)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
