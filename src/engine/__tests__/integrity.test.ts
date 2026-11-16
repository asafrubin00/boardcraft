import { describe, it, expect } from 'vitest';
import type { BoardSeat, Company, GameState } from '@/types/game';
import { companies } from '@/data/company';
import { directors } from '@/data/directors';
import { events } from '@/data/events';
import { computeFeeWithPremium } from '@/engine/compliance';
import {
  initializeGameState,
  getCurrentEvent,
  advanceToNextTurn,
  getNextQuarterAndTurn,
} from '@/engine/gameStateManager';
import { applySfgAcChairResignation } from '@/engine/forcedChanges';
import { STRATEGY_EFFECTS, EVENT_EFFECTS, applyBoardEffects, syncCommitteeChairs } from '@/engine/boardEffects';
import { resolveEventTurn } from '@/engine/turn';

// Content integrity: the things that silently break a playthrough when a
// data file is edited — unreachable events, skipped AGMs, effects that point
// at directors or strategies that don't exist.

const seatsFor = (co: Company): BoardSeat[] =>
  co.inheritedBoard.map((s) => ({
    directorId: s.directorId,
    role: s.role,
    feeWithPremium: computeFeeWithPremium(directors.find((d) => d.id === s.directorId)?.annualFee ?? 0, s.role),
  }));

const start = (co: Company, seed: number): GameState => {
  const st: GameState = {
    ...initializeGameState(seatsFor(co), false, co),
    currentQuarter: 'Q1',
    currentTurn: 1,
    phase: 'gameplay',
    randomSeed: seed,
  };
  return syncCommitteeChairs(applySfgAcChairResignation(st));
};

describe('content integrity', () => {
  it('every company has all five in the list', () => {
    expect(companies.map((c) => c.id).sort()).toEqual(
      ['company_harwick', 'company_meridian', 'company_rheinfeld', 'company_sfg', 'company_vantage']
    );
  });

  for (const co of companies) {
    describe(co.id, () => {
      it('schedules every event that exists, one per slot', () => {
        const slots = new Set<string>();
        for (const s of co.eventSchedule) {
          expect(events.some((e) => e.id === s.eventId), `${s.eventId} exists`).toBe(true);
          const key = `${s.quarter}-${s.turn}`;
          expect(slots.has(key), `slot ${key} used twice (${s.eventId})`).toBe(false);
          slots.add(key);
          const ev = events.find((e) => e.id === s.eventId)!;
          expect(`${ev.quarter}-${ev.turn}`, `${s.eventId} slot matches its event`).toBe(key);
        }
      });

      it('walks the calendar in order and reaches the AGM', () => {
        const seen: string[] = [];
        let at: { quarter: GameState['currentQuarter']; turn: number } | null = { quarter: 'Q1', turn: 1 };
        while (at) {
          seen.push(`${at.quarter}-${at.turn}`);
          at = getNextQuarterAndTurn(at.quarter, at.turn, co.eventSchedule);
        }
        expect(seen).toContain('AGM-1');
        expect(seen.length).toBe(co.eventSchedule.length);
      });

      it('plays a full year without crashing, from several seeds', () => {
        for (let seed = 1; seed <= 25; seed++) {
          let st = start(co, seed * 977);
          let guard = 0;
          let sawAgm = false;
          while (st.phase !== 'year_end' && guard++ < 40) {
            if (st.currentQuarter === 'AGM') sawAgm = true;
            const ev = getCurrentEvent(st);
            if (ev && ev.strategies.length > 0) {
              const strat = ev.strategies[(seed + guard) % ev.strategies.length];
              const team = st.board.seats.slice(0, 3).map((s) => s.directorId);
              st = { ...resolveEventTurn(st, ev, strat.id, team).newState, forcedChange: null };
              // nobody is seated twice, and committee chairs are really seated
              const ids = st.board.seats.map((s) => s.directorId);
              expect(new Set(ids).size).toBe(ids.length);
              for (const c of Object.values(st.committees)) {
                if (c.chairDirectorId) expect(ids).toContain(c.chairDirectorId);
              }
            }
            st = advanceToNextTurn(st);
          }
          expect(sawAgm).toBe(true);
        }
      });
    });
  }

  it('board effects only reference real strategies, events and directors', () => {
    const strategyIds = new Set(events.flatMap((e) => e.strategies.map((s) => s.id)));
    const directorIds = new Set(directors.map((d) => d.id));
    for (const [sid, fx] of Object.entries(STRATEGY_EFFECTS)) {
      expect(strategyIds.has(sid), `strategy ${sid}`).toBe(true);
      for (const f of fx) if ('directorId' in f) expect(directorIds.has(f.directorId), f.directorId).toBe(true);
    }
    for (const [eid, fx] of Object.entries(EVENT_EFFECTS)) {
      expect(events.some((e) => e.id === eid), `event ${eid}`).toBe(true);
      for (const f of fx) if ('directorId' in f) expect(directorIds.has(f.directorId), f.directorId).toBe(true);
    }
  });
});

describe('board effects', () => {
  const co = (id: string) => companies.find((c) => c.id === id)!;
  const ev = (id: string) => events.find((e) => e.id === id)!;

  it('Vantage: removing Nguyen from the Audit Chair really removes her, on success', () => {
    const st = start(co('company_vantage'), 1);
    expect(st.board.seats.some((s) => s.directorId === 'vdir_02_nguyen')).toBe(true);
    const ok = applyBoardEffects(st, ev('vevent_01'), 'vevent_01_a', 'SUCCESS');
    expect(ok.state.board.seats.some((s) => s.directorId === 'vdir_02_nguyen')).toBe(false);
    expect(ok.vacancy?.directorId).toBe('vdir_02_nguyen');
    expect(ok.state.committees.audit.chairDirectorId).toBeNull();
    const partial = applyBoardEffects(st, ev('vevent_01'), 'vevent_01_a', 'PARTIAL_SUCCESS');
    expect(partial.state.board.seats.some((s) => s.directorId === 'vdir_02_nguyen')).toBe(true);
    const retain = applyBoardEffects(st, ev('vevent_01'), 'vevent_01_c', 'CRITICAL_SUCCESS');
    expect(retain.state.board.seats.some((s) => s.directorId === 'vdir_02_nguyen')).toBe(true);
  });

  it('Meridian: "Cavendish resigns" removes Cavendish whatever the outcome', () => {
    const st = start(co('company_meridian'), 1);
    for (const tier of ['CRITICAL_SUCCESS', 'PARTIAL_SUCCESS', 'CRITICAL_FAILURE'] as const) {
      const r = applyBoardEffects(st, ev('mevent_08'), 'mevent_08_a', tier);
      expect(r.state.board.seats.some((s) => s.directorId === 'mdir_cavendish')).toBe(false);
    }
  });

  it('SFG: retiring Helena Soong removes her; a new chair replaces Dato\' Lim', () => {
    const st = start(co('company_sfg'), 1);
    const retired = applyBoardEffects(st, ev('sfgevent_02'), 'sfgevent_02_c', 'FAILURE');
    expect(retired.state.board.seats.some((s) => s.directorId === 'sfgdir_02_soong')).toBe(false);

    const succession = applyBoardEffects(st, ev('sfgevent_15'), 'sfgevent_15_a', 'SUCCESS');
    const chair = succession.state.board.seats.filter((s) => s.role === 'chair');
    expect(chair.map((s) => s.directorId)).toEqual(['sfgdir_26_rajan']);
    expect(succession.state.board.seats.some((s) => s.directorId === 'sfgdir_01_lim')).toBe(false);
    expect(succession.notes.join(' ')).not.toMatch(/Chair seat is vacant/);
  });

  it('SFG nine-year rule: redesignating Helena Soong makes her non-independent and frees the SID seat', () => {
    const st = start(co('company_sfg'), 1);
    const before = st.directors.find((d) => d.id === 'sfgdir_02_soong')!;
    expect(before.independence).not.toBe('non-independent');
    const plain = applyBoardEffects(st, ev('sfgevent_02'), 'sfgevent_02_b', 'FAILURE');
    expect(plain.state.directors.find((d) => d.id === 'sfgdir_02_soong')!.independence).toBe('non-independent');
    expect(plain.state.board.seats.find((s) => s.directorId === 'sfgdir_02_soong')!.role).toBe('ned');
    expect(plain.state.board.seats.some((s) => s.role === 'sid')).toBe(false);

    // With a credible roadmap, an INDEPENDENT director takes the SID role.
    const roadmap = applyBoardEffects(st, ev('sfgevent_02'), 'sfgevent_02_a', 'SUCCESS');
    const sid = roadmap.state.board.seats.find((s) => s.role === 'sid');
    if (sid) {
      expect(sid.directorId).not.toBe('sfgdir_02_soong');
      expect(roadmap.state.directors.find((d) => d.id === sid.directorId)!.independence).toBe('independent');
    }
  });

  it('SFG: Dato\' Lim chairs the Board Risk Committee until someone else is given it', () => {
    const st = start(co('company_sfg'), 1);
    expect(st.committees.risk.chairDirectorId).toBe('sfgdir_01_lim');
    const reformed = applyBoardEffects(st, ev('sfgevent_05'), 'sfgevent_05_a', 'SUCCESS');
    expect(reformed.state.committees.risk.chairDirectorId).toBe('sfgdir_07_anwar');
  });

  it('SFG: Temasek\'s nominee joins when invited, or when the board fails', () => {
    const st = start(co('company_sfg'), 1);
    const seated = (s: GameState) => s.board.seats.some((x) => x.directorId === 'sfgdir_27_phua');
    expect(seated(applyBoardEffects(st, ev('sfgevent_08'), 'sfgevent_08_b', 'SUCCESS').state)).toBe(true);
    expect(seated(applyBoardEffects(st, ev('sfgevent_08'), 'sfgevent_08_a', 'FAILURE').state)).toBe(true);
    expect(seated(applyBoardEffects(st, ev('sfgevent_08'), 'sfgevent_08_a', 'SUCCESS').state)).toBe(false);
  });

  it('Harwick: a successful appointment fills the vacant Remuneration chair', () => {
    const st = start(co('company_harwick'), 1);
    if (st.board.seats.some((s) => s.role === 'remChair')) return; // only meaningful when vacant
    const r = applyBoardEffects(st, ev('event_01'), 'event_01_b', 'SUCCESS');
    expect(r.state.board.seats.some((s) => s.role === 'remChair')).toBe(true);
    expect(r.state.committees.remuneration.chairDirectorId).not.toBeNull();
    const nothing = applyBoardEffects(st, ev('event_01'), 'event_01_b', 'FAILURE');
    expect(nothing.state.board.seats.some((s) => s.role === 'remChair')).toBe(false);
  });
});
