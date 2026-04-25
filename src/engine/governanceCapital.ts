// ── Governance Capital (GC) - persistent cross-game currency ──

import type { GameState } from '@/types/game';

// ── Career titles by GC threshold ──

export function getCareerTitle(gc: number): string {
  if (gc >= 1000) return 'Legend of the Boardroom';
  if (gc >= 500) return 'Governance Authority';
  if (gc >= 250) return 'Seasoned Governance Professional';
  if (gc >= 100) return 'Non-Executive Director';
  return 'Board Apprentice';
}

// ── Calculate GC earned for a single completed game ──

export function calculateGameGc(gameState: GameState): {
  baseGc: number;
  svBonusGc: number;
  criticalSuccessGc: number;
  proxyGc: number;
  failurePenaltyGc: number;
  totalGc: number;
  breakdown: { label: string; value: number }[];
} {
  const breakdown: { label: string; value: number }[] = [];

  // 1. Base: completing Year 1 (any outcome)
  const baseGc = 50;
  breakdown.push({ label: 'Year 1 Completed', value: baseGc });

  // 2. SV bonus (highest tier wins, not additive)
  let svBonusGc = 0;
  if (gameState.svIndex > 140) {
    svBonusGc = 150;
    breakdown.push({ label: 'Final SV > 140', value: 150 });
  } else if (gameState.svIndex > 120) {
    svBonusGc = 80;
    breakdown.push({ label: 'Final SV > 120', value: 80 });
  }

  // 3. Critical Success on 5+ events
  const criticalSuccessCount = gameState.resolvedEvents.filter(
    (e) => e.outcomeTier === 'CRITICAL_SUCCESS'
  ).length;
  let criticalSuccessGc = 0;
  if (criticalSuccessCount >= 5) {
    criticalSuccessGc = 40;
    breakdown.push({ label: '5+ Critical Successes', value: 40 });
  }

  // 4. Zero proxy adviser negative recommendations at AGM
  // Proxy is negative if GH < 55 at AGM (Mixed/Weak/Critical)
  // We check if governance health was >= 55 at the AGM event
  let proxyGc = 0;
  const agmEvent = gameState.resolvedEvents.find(
    (e) => e.resolvedAtQuarter === 'AGM'
  );
  // Simplified: if current GH >= 55, no negative recommendations
  if (gameState.governanceHealth >= 55) {
    proxyGc = 30;
    breakdown.push({ label: 'No Proxy Adviser Concerns', value: 30 });
  }

  // 5. Failure penalty: company failing (SV < 60)
  let failurePenaltyGc = 0;
  if (gameState.svIndex < 60) {
    failurePenaltyGc = -80;
    breakdown.push({ label: 'Company Failure (SV < 60)', value: -80 });
  }

  const totalGc = Math.max(0, baseGc + svBonusGc + criticalSuccessGc + proxyGc + failurePenaltyGc);

  return {
    baseGc,
    svBonusGc,
    criticalSuccessGc,
    proxyGc,
    failurePenaltyGc,
    totalGc,
    breakdown,
  };
}

// ── localStorage persistence ──

const GC_KEY = 'boardcraft_governance_capital';
const CAREER_KEY = 'boardcraft_career_stats';
const LEADERBOARD_KEY = 'boardcraft_leaderboard';

export interface CareerStats {
  totalGc: number;
  gamesPlayed: number;
  totalSvAchieved: number; // sum of all final SVs (for averaging)
  bestSv: number;
}

export interface LeaderboardEntry {
  id: string;
  companyId: string;
  companyName: string;
  finalSv: number;
  governanceHealth: number;
  careerTitle: string;
  eventsResolved: number;
  gcEarned: number;
  datePlayed: string; // ISO string
}

function getStoredCareerStats(): CareerStats {
  if (typeof window === 'undefined') return { totalGc: 0, gamesPlayed: 0, totalSvAchieved: 0, bestSv: 0 };
  try {
    const raw = localStorage.getItem(CAREER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { totalGc: 0, gamesPlayed: 0, totalSvAchieved: 0, bestSv: 0 };
}

function setStoredCareerStats(stats: CareerStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CAREER_KEY, JSON.stringify(stats));
  } catch {}
}

export function getCareerStats(): CareerStats {
  return getStoredCareerStats();
}

export function recordGameResult(gameState: GameState, gcEarned: number): CareerStats {
  const stats = getStoredCareerStats();
  stats.totalGc = Math.max(0, stats.totalGc + gcEarned);
  stats.gamesPlayed += 1;
  stats.totalSvAchieved += gameState.svIndex;
  stats.bestSv = Math.max(stats.bestSv, gameState.svIndex);
  setStoredCareerStats(stats);
  return stats;
}

// ── Leaderboard ──

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function addLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const board = getLeaderboard();
  board.push(entry);
  // Sort by final SV descending
  board.sort((a, b) => b.finalSv - a.finalSv);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board));
    } catch {}
  }
  return board;
}

export function clearLeaderboard(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {}
}

export function clearCareerStats(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CAREER_KEY);
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {}
}
