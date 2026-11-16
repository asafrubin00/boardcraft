// ── One full event turn: score it, then apply every consequence ──
//
// Lifted out of app/play/page.tsx so the whole turn is a pure function that
// tests and simulations can drive exactly as the game does.

import type { GameEvent, GameState, ResolutionOutput } from '@/types/game';
import {
  applyResolution,
  applyRheinfeldFlagUpdates,
  applyVantageFlagUpdates,
  applyMeridianFlagUpdates,
  recalcGovernanceBreakdown,
  rescaleBreakdown,
} from '@/engine/gameStateManager';
import {
  checkMisconduct,
  applyForcedRemoval,
  applyReplacement,
  applySfgAcChairAppointment,
} from '@/engine/forcedChanges';
import { applyBoardEffects, syncCommitteeChairs } from '@/engine/boardEffects';
import { rheinfeldDirectors } from '@/data/rheinfeld/directors';

export function resolveEventTurn(
  state: GameState,
  currentEvent: GameEvent,
  strategyChoice: string,
  deployedDirectorIds: string[]
): { newState: GameState; output: ResolutionOutput } {
        const { newState, output } = applyResolution(
          state,
          currentEvent.id,
          strategyChoice,
          deployedDirectorIds
        );

        // Rheinfeld: meridianStatus escalation ladder + Heinrich conflict reveal.
        // No-op for non-Rheinfeld companies and events other than revent_02/08/11/12.
        Object.assign(newState, applyRheinfeldFlagUpdates(newState, currentEvent.id, output.outcomeTier));

        // Vantage: apexActive/apexStatus escalation ladder + chairCeoSeparationProgress.
        // No-op for non-Vantage companies and events other than vevent_02/05/09/10/15.
        Object.assign(newState, applyVantageFlagUpdates(newState, currentEvent.id, strategyChoice, output.outcomeTier));

        // Meridian: founderSyndromeScore contested meter. No-op for non-Meridian
        // companies and events other than mevent_03/09.
        Object.assign(newState, applyMeridianFlagUpdates(newState, currentEvent.id, output.outcomeTier));

        const breakdown = recalcGovernanceBreakdown(newState);
        // Rescale breakdown proportionally to match the event-adjusted GH
        newState.governanceHealthBreakdown = rescaleBreakdown(breakdown, newState.governanceHealth);

        // Board effects: the chosen strategy (or the outcome itself) changes who
        // sits where — removals, appointments, new committees. See engine/boardEffects.ts.
        {
          const fx = applyBoardEffects(newState, currentEvent, strategyChoice, output.outcomeTier);
          Object.assign(newState, fx.state);
          if (fx.notes.length > 0) {
            newState.pendingBoardNotification = fx.notes.join(' ');
          }
          if (fx.vacancy && (!newState.forcedChange || newState.forcedChange.type === 'resignation')) {
            newState.forcedChange = {
              type: 'event_resolution',
              directorId: fx.vacancy.directorId,
              directorName: fx.vacancy.directorName,
              turnsRemaining: 3, // one is used up by the turn advancing before the picker opens
              narrative: `${fx.vacancy.directorName} has left the board as a result of this decision. Appoint a replacement from the candidate pool.`,
              canRetain: false,
        vacatedRole: fx.vacancy.role,
            };
          }
        }

        // Check for FMC-02: misconduct risk flag activation on deployed directors.
        // Flags only surface on events whose domains relate to the flag —
        // riskFlagTriggerCategories when authored, else the event's own domains.
        // Runs after board effects so an event-driven departure is never skipped.
        const eventDomains = currentEvent.riskFlagTriggerCategories ?? [
          currentEvent.primaryDomain,
          ...currentEvent.secondaryDomains.map((d) => d.domain),
        ];
        const stillSeated = deployedDirectorIds.filter((id) => newState.board.seats.some((s) => s.directorId === id));
        const misconduct = checkMisconduct(newState, stillSeated, eventDomains);
        if (misconduct) {
          newState.directors = newState.directors.map((d) => {
            if (d.id === misconduct.directorId && d.riskFlag) {
              return { ...d, riskFlag: { ...d.riskFlag, activated: true } };
            }
            return d;
          });
          newState.forcedChange = misconduct;
        }

        // ── mevent_09 CRITICAL_SUCCESS: Osei-Bonsu retain-or-replace ──
        if (!newState.forcedChange && currentEvent.id === 'mevent_09' &&
            strategyChoice === 'mevent_09_a' && output.outcomeTier === 'CRITICAL_SUCCESS') {
          const oseiBonsu = newState.directors.find((d) => d.id === 'mdir_osei_bonsu');
          if (oseiBonsu && newState.board.seats.some((s) => s.directorId === 'mdir_osei_bonsu')) {
            newState.forcedChange = {
              type: 'event_resolution',
              directorId: 'mdir_osei_bonsu',
              directorName: oseiBonsu.name,
              turnsRemaining: 2,
              narrative: 'The board has formally established role boundaries. Dr. Osei-Bonsu must now choose: accept the resolution and continue as trustee, or step down gracefully.',
              canRetain: true,
            };
          }
        }

        // ── mevent_14 CRITICAL_FAILURE: Osei-Bonsu becomes chair (role swap, no modal) ──
        if (currentEvent.id === 'mevent_14' && output.outcomeTier === 'CRITICAL_FAILURE') {
          newState.board.seats = newState.board.seats.map((s) => {
            if (s.directorId === 'mdir_mensah') return { ...s, role: 'ned' as const };
            if (s.directorId === 'mdir_osei_bonsu') return { ...s, role: 'chair' as const };
            return s;
          });
        }

        // ── revent_12 FAILURE/CRITICAL_FAILURE: Supervisory Board loses two members ──
        if (currentEvent.id === 'revent_12' &&
            (output.outcomeTier === 'FAILURE' || output.outcomeTier === 'CRITICAL_FAILURE')) {
          // Worker reps (rdir_w_*) and Heinrich (fixed chair) are protected
          const removableSeats = newState.board.seats.filter(
            (s) => !s.directorId.startsWith('rdir_w_') && s.directorId !== 'rdir_heinrich'
          );
          const toRemove = removableSeats
            .map((s) => ({
              id: s.directorId,
              tenure: newState.directors.find((d) => d.id === s.directorId)?.tenure ?? 999,
            }))
            .sort((a, b) => a.tenure - b.tenure)
            .slice(0, 2);
          const removedNames: string[] = [];
          for (const { id } of toRemove) {
            const dir = newState.directors.find((d) => d.id === id);
            if (dir) removedNames.push(dir.name);
            Object.assign(newState, applyForcedRemoval(newState, id));
          }
          if (removedNames.length > 0) {
            newState.pendingBoardNotification =
              `Following the EGM vote, ${removedNames.join(' and ')} have been removed from the Supervisory Board.`;
          }
        }

        // ── sfgevent_01: AC Chair appointment — on SUCCESS/CRITICAL_SUCCESS the chosen
        // strategy's appointee takes the seat; otherwise it stays vacant (a legitimate
        // consequence now, not a stale flag — see forcedChanges.ts). Always clears the
        // resignation forcedChange, since the crisis is settled either way this turn.
        if (currentEvent.id === 'sfgevent_01') {
          Object.assign(newState, applySfgAcChairAppointment(newState, strategyChoice, output.outcomeTier));
        }

        // ── sfgevent_04: CEO whistleblower — set investigation outcome flag ──
        if (currentEvent.id === 'sfgevent_04') {
          const isSuccess =
            output.outcomeTier === 'SUCCESS' || output.outcomeTier === 'CRITICAL_SUCCESS';
          const chosenStrategyId = strategyChoice;
          // Strategies A and B = commission independent investigation → substantiated track
          // Strategies C and D = internal handling / silence → cleared (suppressed)
          const isInvestigationCommissioned =
            chosenStrategyId === 'sfgevent_04_a' || chosenStrategyId === 'sfgevent_04_b';
          if (isSuccess && isInvestigationCommissioned) {
            newState.ceoWhistleblower = 'substantiated';
          } else {
            newState.ceoWhistleblower = 'cleared';
          }
        }

        // ── revent_12 CRITICAL_SUCCESS: Meridian Capital wins one supervisory board seat ──
        if (currentEvent.id === 'revent_12' && output.outcomeTier === 'CRITICAL_SUCCESS') {
          // Idempotency guard — Reuter should never be added twice
          if (!newState.directors.some((d) => d.id === 'rdir_12_reuter')) {
            const reuter = rheinfeldDirectors.find((d) => d.id === 'rdir_12_reuter');
            if (reuter) newState.directors = [...newState.directors, reuter];
          }
          Object.assign(newState, applyReplacement(newState, 'rdir_12_reuter', 'ned'));
          newState.pendingBoardNotification =
            "Following the negotiated settlement, Dr. Johanna Reuter joins the Supervisory Board as Meridian Capital's nominee.";
        }

  // Keep committee chairs in step with whoever is actually seated.
        Object.assign(newState, syncCommitteeChairs(newState));

  return { newState, output };
}
