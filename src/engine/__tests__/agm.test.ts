import { describe, it, expect } from 'vitest';
import type { BoardSeat, Company, GameState, OutcomeTier } from '@/types/game';
import { companies } from '@/data/company';
import { directors } from '@/data/directors';
import { computeFeeWithPremium } from '@/engine/compliance';
import { initializeGameState } from '@/engine/gameStateManager';
import { agmForecast, resolveAgmVotes, agmGovernanceDelta } from '@/engine/agm';
import { syncCommitteeChairs } from '@/engine/boardEffects';

const start = (co: Company, seed = 5): GameState => {
  const seats: BoardSeat[] = co.inheritedBoard.map((s) => ({
    directorId: s.directorId, role: s.role,
    feeWithPremium: computeFeeWithPremium(directors.find((d) => d.id === s.directorId)?.annualFee ?? 0, s.role),
  }));
  return syncCommitteeChairs({ ...initializeGameState(seats, false, co), currentQuarter: 'AGM', currentTurn: 1, phase: 'agm', randomSeed: seed });
};
const TIERS: OutcomeTier[] = ['CRITICAL_SUCCESS', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'];

describe('AGM votes', () => {
  for (const co of companies) {
    it(`${co.id}: three resolutions, each counted from its own blocks`, () => {
      const st = start(co);
      const votes = resolveAgmVotes(st, 'none', 'SUCCESS');
      expect(votes).toHaveLength(3);
      for (const v of votes) {
        expect(v.blocks.reduce((s, b) => s + b.weight, 0)).toBe(100);
        const sum = v.blocks.reduce((s, b) => s + (b.weight * b.forPct) / 100, 0);
        expect(Math.abs(sum - v.forPct)).toBeLessThan(0.11);
        expect(v.pass).toBe(v.forPct > 50);
      }
    });

    it(`${co.id}: a better campaign never hurts an item the board backs`, () => {
      const st = start(co);
      const byTier = TIERS.map((t) => resolveAgmVotes(st, 'none', t));
      for (let i = 0; i < 3; i++) {
        if (byTier[0][i].stance !== 'for') continue;
        for (let t = 0; t < TIERS.length - 1; t++) {
          expect(byTier[t][i].forPct).toBeGreaterThanOrEqual(byTier[t + 1][i].forPct);
        }
      }
    });

    it(`${co.id}: the three results are not locked together`, () => {
      const patterns = new Set<string>();
      for (let gh = 20; gh <= 90; gh += 5) {
        for (const t of TIERS) {
          const st = { ...start(co, gh), governanceHealth: gh };
          patterns.add(resolveAgmVotes(st, 'none', t).map((v) => (v.pass ? 'P' : 'F')).join(''));
        }
      }
      expect(patterns.size).toBeGreaterThan(2);
    });
  }

  it('SFG: a director past nine years costs more votes while still called independent', () => {
    const sfg = companies.find((c) => c.id === 'company_sfg')!;
    const st = start(sfg);
    const mislabelled = agmForecast(st)[0].forPct;
    const fixed = agmForecast({
      ...st,
      directors: st.directors.map((d) => ((d.tenure ?? 0) > 9 ? { ...d, independence: 'non-independent' as const } : d)),
    })[0].forPct;
    expect(fixed).toBeGreaterThan(mislabelled);
  });

  it('the forecast is the poll without a campaign', () => {
    const st = start(companies[0]);
    const f = agmForecast(st);
    expect(f.map((v) => v.title)).toEqual(resolveAgmVotes(st, 'none', 'PARTIAL_SUCCESS').map((v) => v.title));
  });

  it('governance health moves on how many results went the board\'s way', () => {
    const st = start(companies[0]);
    const v = resolveAgmVotes(st, 'none', 'SUCCESS');
    const all = v.map((x) => ({ ...x, good: true }));
    const none = v.map((x) => ({ ...x, good: false }));
    expect(agmGovernanceDelta(all)).toBe(5);
    expect(agmGovernanceDelta(none)).toBe(-8);
  });
});
