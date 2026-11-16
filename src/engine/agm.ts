// ── The AGM: three resolutions, three separate votes ──
//
// Each resolution has its own level of support, built from what actually
// happened during the year, moved by the board's AGM campaign, and counted
// shareholder block by shareholder block. The same forecast drives the notice
// of meeting, the control-room dashboard and the final poll, so the bars the
// player sees before the vote are the bars that decide it.

import type { Director, GameState, OutcomeTier } from '@/types/game';
import { estimateAgmVotes } from '@/engine/gameStateManager';

export type BoardStance = 'for' | 'against' | 'neutral';

export interface AgmBlock {
  name: string;
  /** Share of the votes cast, in percent. */
  weight: number;
  /** How much of this block voted FOR, in percent. */
  forPct: number;
}

export interface AgmResolutionVote {
  title: string;
  /** Who put it on the agenda. */
  proposedBy: 'board' | 'shareholders';
  stance: BoardStance;
  forPct: number;
  pass: boolean;
  /** True when the result is the one the board was asking for. */
  good: boolean;
  blocks: AgmBlock[];
  /** SGX two-tier vote: the minority-only count that must also pass. */
  minorityForPct?: number;
  minorityPass?: boolean;
  /** The single biggest thing that moved this vote, in plain words. */
  driver: string;
  /** Which way that factor pushed support: 1 up, -1 down, 0 neither. */
  lean: number;
}

interface BlockDef { name: string; weight: number; bias: number; minority?: boolean }

const clamp = (n: number, lo = 3, hi = 97) => Math.max(lo, Math.min(hi, n));
const failed = (t?: OutcomeTier) => t === 'FAILURE' || t === 'CRITICAL_FAILURE';
const succeeded = (t?: OutcomeTier) => t === 'SUCCESS' || t === 'CRITICAL_SUCCESS';

function seeded(seed: number): number {
  let s = seed | 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ── Who votes ──────────────────────────────────────────────────────────────
// `bias` is how far a block sits from the average on a board-backed item.
// On an item the board opposes, the same blocks line up the other way round.

function blocksFor(state: GameState): BlockDef[] {
  switch (state.company.id) {
    case 'company_vantage':
      return [
        { name: 'Index funds', weight: 34, bias: 2 },
        { name: 'Active managers', weight: 30, bias: -3 },
        { name: 'Apex Capital and allies', weight: 8, bias: state.apexActive ? -42 : -6 },
        { name: 'Retail shareholders', weight: 16, bias: 8 },
        { name: 'Directors and staff', weight: 12, bias: 26 },
      ];
    case 'company_rheinfeld':
      return [
        { name: 'Rheinfeld family', weight: 38, bias: 30 },
        { name: 'Meridian Capital', weight: 12, bias: state.meridianActive ? -45 : -10 },
        { name: 'German institutions', weight: 24, bias: -12 },
        { name: 'International funds', weight: 18, bias: -16 },
        { name: 'Retail shareholders', weight: 8, bias: 4 },
      ];
    case 'company_meridian':
      return [
        { name: 'Individual members', weight: 40, bias: 4 },
        { name: 'Institutional donors', weight: 30, bias: -8 },
        { name: 'Partner organisations', weight: 18, bias: 2 },
        { name: 'Staff and volunteers', weight: 12, bias: 3 },
      ];
    case 'company_sfg':
      return [
        { name: 'Temasek', weight: 34, bias: 30 },
        { name: 'Minority institutions', weight: 36, bias: -20, minority: true },
        { name: 'Retail shareholders', weight: 22, bias: -4, minority: true },
        { name: 'Other holders', weight: 8, bias: 0, minority: true },
      ];
    default:
      return [
        { name: 'Index funds', weight: 26, bias: 3 },
        { name: 'UK active institutions', weight: 32, bias: -2 },
        { name: 'Greenvale Capital and allies', weight: 9, bias: -40 },
        { name: 'Retail shareholders', weight: 14, bias: 9 },
        { name: 'Overseas and other holders', weight: 19, bias: 12 },
      ];
  }
}

/** Spread an overall level of support across the blocks so that the weighted
 *  total comes back to (almost exactly) the level asked for. */
function countBlocks(defs: BlockDef[], target: number, mode: 'board' | 'contested' | 'agreed'): AgmBlock[] {
  // board: a board item — the blocks sit where their bias puts them.
  // contested: a shareholder item the board resists — everyone swaps sides.
  // agreed: a shareholder item the board has come round to — its proposers are
  //         firmly for it and the rest of the register follows, less sharply.
  const proposer = defs.reduce((a, b) => (b.bias < a.bias ? b : a));
  const biasOf = (b: BlockDef) =>
    mode === 'board' ? b.bias : mode === 'contested' ? -b.bias : b === proposer ? Math.abs(b.bias) : b.bias * 0.3;
  const mean = defs.reduce((s, b) => s + b.weight * biasOf(b), 0) / 100;
  return defs.map((b) => ({
    name: b.name,
    weight: b.weight,
    forPct: Math.round(clamp(target + biasOf(b) - mean, 1, 99)),
  }));
}

const tally = (blocks: AgmBlock[]) =>
  Math.round((blocks.reduce((s, b) => s + b.weight * b.forPct, 0) / blocks.reduce((s, b) => s + b.weight, 0)) * 10) / 10;

// ── What each resolution is, and what moves it ─────────────────────────────

interface ResolutionSpec {
  title: string;
  proposedBy: 'board' | 'shareholders';
  /** Adjustment to baseline support from the year's record. */
  adjust: number;
  driver: string;
  /** The board's stance before any AGM strategy is chosen. */
  stance: BoardStance;
}

export function longTenuredSfgDirectors(state: GameState): Director[] {
  if (state.company.id !== 'company_sfg') return [];
  return state.board.seats
    .map((s) => state.directors.find((d) => d.id === s.directorId))
    .filter((d): d is Director => d !== undefined && (d.tenure ?? 0) > 9);
}

function specs(state: GameState): ResolutionSpec[] {
  const ev = (id: string) => state.resolvedEvents.find((r) => r.eventId === id)?.outcomeTier;
  const remChair = !!state.committees.remuneration.chairDirectorId;

  switch (state.company.id) {
    case 'company_meridian': {
      const e1 = ev('mevent_01'), e2 = ev('mevent_02'), e3 = ev('mevent_03');
      return [
        {
          title: 'Trustee Appointment Ratification', proposedBy: 'board', stance: 'for',
          adjust: failed(e1) ? -10 : succeeded(e1) ? 5 : 0,
          driver: failed(e1) ? 'the Cavendish conflict of interest' : succeeded(e1) ? 'how the board dealt with the Cavendish conflict' : 'the board\'s overall record this year',
        },
        {
          title: 'Beneficiary Accountability Audit', proposedBy: 'shareholders', stance: 'neutral',
          adjust: failed(e2) ? 12 : succeeded(e2) ? -6 : 0,
          driver: failed(e2) ? 'unease about the grant decision' : succeeded(e2) ? 'confidence in how the grant decision was made' : 'members wanting a closer look at accountability',
        },
        {
          title: 'Mission Alignment Review', proposedBy: 'shareholders', stance: 'neutral',
          adjust: failed(e3) ? 15 : succeeded(e3) ? -8 : 0,
          driver: failed(e3) ? 'the founder\'s visible influence over the executive' : succeeded(e3) ? 'the board having drawn a clear line with the founder' : 'members asking whether the mission has drifted',
        },
      ];
    }
    case 'company_vantage':
      return [
        {
          title: 'Director Elections', proposedBy: 'board', stance: 'for',
          adjust: !state.apexActive ? 6 : state.apexStatus === 'hostile' ? -15 : state.apexStatus === 'escalating' ? -8 : -3,
          driver: !state.apexActive ? 'Apex Capital having stood down' : `Apex Capital's withhold campaign`,
        },
        {
          title: 'Say-on-Pay (Advisory)', proposedBy: 'board', stance: 'for',
          adjust: (remChair ? 6 : -4) - 8,
          driver: remChair ? 'a chaired Compensation Committee defending the package' : 'a $14.2m package with nobody chairing the Compensation Committee',
        },
        {
          title: 'Independent Board Chair (Shareholder Proposal)', proposedBy: 'shareholders',
          stance: state.chairCeoSeparationProgress >= 50 ? 'for' : 'against',
          adjust: state.chairCeoSeparationProgress >= 50 ? 12 : state.chairCeoSeparationProgress > 0 ? 5 : -4,
          driver: state.chairCeoSeparationProgress >= 50 ? 'the board\'s own commitment to split the roles' : 'pressure to split the Chair and CEO roles',
        },
      ];
    case 'company_rheinfeld':
      return [
        {
          title: 'Discharge of the Supervisory Board (Entlastung)', proposedBy: 'board', stance: 'for',
          adjust:
            (state.heinrichConflictRevealed ? -15 : 0) +
            (state.meridianStatus === 'hostile' ? -8 : 0) +
            (state.workerRepRelations === 'cooperative' ? 5 : state.workerRepRelations === 'hostile' ? -5 : 0),
          driver: state.heinrichConflictRevealed ? 'Heinrich\'s undisclosed side-deal' : state.meridianStatus === 'hostile' ? 'Meridian Capital\'s open hostility' : 'the Supervisory Board\'s record this year',
        },
        {
          title: 'Remuneration System Approval (ARUG II)', proposedBy: 'board', stance: 'for',
          adjust: remChair ? 6 : -6,
          driver: remChair ? 'a chaired Remuneration Committee' : 'no one chairing the Remuneration Committee',
        },
        {
          title: "Meridian Capital's Independent Strategic Review", proposedBy: 'shareholders', stance: 'against',
          adjust: state.meridianStatus === 'hostile' ? 15 : state.meridianStatus === 'escalating' ? 10 : 4,
          driver: 'Meridian Capital\'s campaign for an outside review',
        },
      ];
    case 'company_sfg': {
      const long = longTenuredSfgDirectors(state);
      return [
        {
          title: long.length > 0 ? 'Director Re-Elections (Two-Tier Vote)' : 'Director Re-Elections', proposedBy: 'board', stance: 'for',
          adjust: long.length * -6,
          driver: long.length > 0 ? `${long.map((d) => d.name).join(' and ')} standing again after more than nine years` : 'a board inside the nine-year independence limit',
        },
        {
          title: 'MAS Compliance & Governance Disclosures', proposedBy: 'board', stance: 'for',
          adjust: state.acChairVacant ? -15 : 8,
          driver: state.acChairVacant ? 'the Audit Committee chair still being vacant' : 'the Audit Committee chair having been filled',
        },
        {
          title: 'Executive Remuneration (Say-on-Pay)', proposedBy: 'board', stance: 'for',
          adjust: state.ceoWhistleblower === 'substantiated' ? -12 : state.ceoWhistleblower === 'cleared' ? 4 : 0,
          driver: state.ceoWhistleblower === 'substantiated' ? 'the finding against the CEO' : 'the CEO\'s pay after the Vietnam loss',
        },
      ];
    }
    default: {
      const crane = state.board.seats.some((s) => s.directorId === 'dir_08_crane');
      const e5 = ev('event_05'), e6 = ev('event_06');
      const et = state.committees.energyTransition.active;
      return [
        {
          title: 'Director Re-Elections', proposedBy: 'board', stance: 'for',
          adjust: crane ? -8 : 0,
          driver: crane ? 'Geoffrey Crane standing again after twelve years' : 'a slate with no tenure concerns',
        },
        {
          title: 'Say-on-Pay (Advisory)', proposedBy: 'board', stance: 'for',
          adjust: failed(e6) ? -10 : succeeded(e6) ? 5 : 0,
          driver: failed(e6) ? 'the earlier row over the CEO\'s £4.1m package' : succeeded(e6) ? 'the board having explained the CEO\'s pay well earlier in the year' : 'the CEO\'s £4.1m package',
        },
        {
          title: 'Shareholder Resolution on ESG Disclosure', proposedBy: 'shareholders', stance: 'for',
          adjust: (et ? 10 : 0) + (failed(e5) ? -15 : 0),
          driver: failed(e5) ? 'the board\'s poor answer to the institutional ESG letter' : et ? 'the Energy Transition Committee' : 'the absence of an Energy Transition Committee',
        },
      ];
    }
  }
}

/** How the board's chosen AGM strategy changes its stance on each item. */
function stanceWithStrategy(state: GameState, strategyId: string | null, base: BoardStance[]): BoardStance[] {
  const s = [...base];
  switch (strategyId) {
    case 'vevent_09_c': s[2] = 'for'; break;             // concede on Chair/CEO split
    case 'revent_09_a': s[2] = 'for'; break;             // back the independent review
    case 'revent_09_b': s[2] = 'neutral'; break;
    case 'amm_strat_a': s[1] = 'for'; s[2] = 'for'; break;
    case 'amm_strat_b': s[1] = 'against'; s[2] = 'against'; break;
    case 'amm_strat_c': s[1] = 'for'; s[2] = 'against'; break;
    case 'event_09_d': s[2] = 'for'; break;
    default: break;
  }
  return s;
}

/** Extra movement from specific strategies, per resolution. */
function strategyAdjust(state: GameState, strategyId: string | null): number[] {
  switch (strategyId) {
    case 'sfgevent_13_a': return [12, 3, 0];   // renewal roadmap: Glass Lewis Asia comes round
    case 'sfgevent_13_b': return [-4, 0, 0];   // leaning on Temasek alienates the minority
    case 'vevent_09_c': return [4, 4, 10];     // goodwill bought with the concession
    case 'revent_09_a': return [5, 2, 10];
    case 'revent_09_c': return [-4, 0, 4];     // stonewalling feeds the activist
    case 'amm_strat_d': return [5, -3, -3];    // donors spoken to before the vote
    case 'event_09_c': return [0, 0, 8];       // deal with Greenvale on its resolution
    case 'event_09_d': return [-3, -3, 12];    // capitulation: the resolution sails through
    default: return [0, 0, 0];
  }
}

const CAMPAIGN: Record<OutcomeTier, number> = {
  CRITICAL_SUCCESS: 10,
  SUCCESS: 6,
  PARTIAL_SUCCESS: 1,
  FAILURE: -6,
  CRITICAL_FAILURE: -11,
};

function build(state: GameState, strategyId: string | null, tier: OutcomeTier | null): AgmResolutionVote[] {
  const base = estimateAgmVotes(state).forPercent;
  const list = specs(state);
  const stances = stanceWithStrategy(state, strategyId, list.map((r) => r.stance));
  const extra = strategyAdjust(state, strategyId);
  const defs = blocksFor(state);

  return list.map((spec, i) => {
    const stance = stances[i];
    // The campaign pushes each vote the way the board wants it to go.
    const push = tier ? CAMPAIGN[tier] * (stance === 'against' ? -1 : stance === 'neutral' ? 0 : 1) : 0;
    // A little independent movement per resolution, so the three are not locked together.
    const noise = tier ? Math.round((seeded(state.randomSeed * 31 + i * 977) - 0.5) * 6) : 0;
    // A board item, or a shareholder item the board backs, rides on the board's
    // standing. One the board resists does better the WEAKER the board is.
    const standing =
      spec.proposedBy === 'board' || stance === 'for'
        ? base
        : stance === 'against'
          ? 100 - base
          : 50 + (50 - base) * 0.4;
    const target = clamp(standing + spec.adjust + extra[i] + push + noise, 5, 95);

        const mode = spec.proposedBy === 'board' ? 'board' : stance === 'for' ? 'agreed' : 'contested';
    const blocks = countBlocks(defs, target, mode);
    const forPct = tally(blocks);
    let pass = forPct > 50;

    let minorityForPct: number | undefined;
    let minorityPass: boolean | undefined;
    if (state.company.id === 'company_sfg' && i === 0 && longTenuredSfgDirectors(state).length > 0) {
      const minority = blocks.filter((b) => defs.find((d) => d.name === b.name)?.minority);
      minorityForPct = tally(minority);
      minorityPass = minorityForPct > 50;
      pass = pass && minorityPass;
    }

    return {
      title: spec.title,
      proposedBy: spec.proposedBy,
      stance,
      forPct,
      pass,
      good: stance === 'against' ? !pass : pass,
      blocks,
      minorityForPct,
      minorityPass,
      driver: spec.driver,
      lean: Math.sign(spec.adjust),
    };
  });
}

/** Where each vote stands today, before any AGM campaign. */
export function agmForecast(state: GameState, strategyId: string | null = null): AgmResolutionVote[] {
  return build(state, strategyId, null);
}

/** The poll itself: the forecast, moved by the chosen strategy and how well the campaign went. */
export function resolveAgmVotes(state: GameState, strategyId: string, tier: OutcomeTier): AgmResolutionVote[] {
  return build(state, strategyId, tier);
}

/** Governance health change from the AGM as a whole. */
export function agmGovernanceDelta(votes: AgmResolutionVote[]): number {
  const good = votes.filter((v) => v.good).length;
  return good === 3 ? 5 : good <= 1 ? -8 : 0;
}
