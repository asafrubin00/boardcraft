import { describe, it, expect } from 'vitest';
import type { BoardSeat, Company, GameState } from '@/types/game';
import { companies } from '@/data/company';
import { directors } from '@/data/directors';
import { events } from '@/data/events';
import { computeFeeWithPremium, checkCompliance } from '@/engine/compliance';
import { initializeGameState } from '@/engine/gameStateManager';
import { applyBoardEffects, syncCommitteeChairs } from '@/engine/boardEffects';
import { ACTIVISTS, activistNominees } from '@/data/activists';

const co = (id: string) => companies.find((c) => c.id === id)!;
const start = (c: Company): GameState => {
  const seats: BoardSeat[] = c.inheritedBoard.map((s) => ({
    directorId: s.directorId,
    role: s.role,
    feeWithPremium: computeFeeWithPremium(directors.find((d) => d.id === s.directorId)?.annualFee ?? 0, s.role),
  }));
  return syncCommitteeChairs({ ...initializeGameState(seats, false, c), phase: 'gameplay' });
};
const ev = (id: string) => events.find((e) => e.id === id)!;
const seated = (st: GameState) => st.board.seats.map((s) => s.directorId);

describe('activist nominees', () => {
  it('every nominee is a real director, never in any candidate pool', () => {
    for (const a of Object.values(ACTIVISTS)) {
      for (const n of a.nominees) {
        expect(directors.some((d) => d.id === n.directorId), n.directorId).toBe(true);
        for (const c of companies) expect(c.directorIds.includes(n.directorId)).toBe(false);
      }
    }
    expect(activistNominees.every((d) => d.independence === 'questionable')).toBe(true);
  });

  it('Greenvale winning the EGM replaces the Chair and two NEDs with its three nominees', () => {
    const base = start(co('company_harwick'));
    // Harwick starts without a chair (the player appoints one): seat one.
    const firstNed = base.board.seats.find((s) => s.role === 'ned')!.directorId;
    const st = { ...base, board: { ...base.board, seats: base.board.seats.map((s) => (s.directorId === firstNed ? { ...s, role: 'chair' as const } : s)) } };
    const oldChair = firstNed;
    const r = applyBoardEffects(st, ev('event_15'), 'event_15_d', 'CRITICAL_FAILURE');
    const now = seated(r.state);
    expect(now).toEqual(expect.arrayContaining(['act_gv_ashby', 'act_gv_rennick', 'act_gv_mehra']));
    expect(now).not.toContain(oldChair);
    expect(r.state.board.seats.find((s) => s.role === 'chair')!.directorId).toBe('act_gv_ashby');
    expect(r.state.board.seats.length).toBe(st.board.seats.length);
    expect(r.notes.join(' ')).toMatch(/voted off/);
  });

  it('Greenvale losing the EGM changes nothing', () => {
    const st = start(co('company_harwick'));
    const r = applyBoardEffects(st, ev('event_15'), 'event_15_a', 'SUCCESS');
    expect(seated(r.state)).toEqual(seated(st));
  });

  it('Apex winning removes the Lead Independent Director and asks for a replacement', () => {
    const st = start(co('company_vantage'));
    const lid = st.board.seats.find((s) => s.role === 'sid');
    const r = applyBoardEffects(st, ev('vevent_15'), 'vevent_15_d', 'FAILURE');
    expect(seated(r.state)).toEqual(expect.arrayContaining(['act_ax_whitfield', 'act_ax_reinholt', 'act_ax_brennan']));
    if (lid) {
      expect(seated(r.state)).not.toContain(lid.directorId);
      expect(r.vacancy?.role).toBe('sid');
    }
  });

  it('the Apex settlement seats David Reinholt', () => {
    const st = start(co('company_vantage'));
    const r = applyBoardEffects(st, ev('vevent_10'), 'vevent_10_a', 'SUCCESS');
    expect(seated(r.state)).toContain('act_ax_reinholt');
    expect(r.state.board.seats.length).toBe(st.board.seats.length + 1);
  });

  it('Meridian Capital winning never touches worker representatives or Heinrich', () => {
    const st = start(co('company_rheinfeld'));
    const r = applyBoardEffects(st, ev('revent_12'), 'revent_12_d', 'CRITICAL_FAILURE');
    const now = seated(r.state);
    expect(now).toEqual(expect.arrayContaining(['act_mc_vogt', 'act_mc_brenner']));
    for (const id of seated(st).filter((i) => i.startsWith('rdir_w_') || i === 'rdir_heinrich')) expect(now).toContain(id);
    // Board still checks out without crashing
    expect(Array.isArray(checkCompliance(r.state.board.seats, r.state.directors, r.state.committees, 'EU', false, 'company_rheinfeld'))).toBe(true);
  });
});
