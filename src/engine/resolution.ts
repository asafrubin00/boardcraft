import type {
  GameEvent,
  Director,
  DirectorDynamic,
  GameState,
  ResolutionOutput,
  ResolutionBreakdown,
  DirectorContribution,
  BestAvailableGap,
  OutcomeTier,
  EnergyUpdate,
  CompetencyDomain,
  CommitteeState,
  CommitteeId,
  BoardSeat,
} from '@/types/game';

// ── Seeded RNG (Mulberry32) ──

function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

// ── Energy modifier lookup ──
// Spec: >80 → 1.0, >60 → 0.9, >40 → 0.75, >20 → 0.55, else → 0.3
// Boundary values: 80 → 0.9, 60 → 0.75, 40 → 0.55, 20 → 0.3

function getEnergyModifier(energy: number): number {
  if (energy > 80) return 1.0;
  if (energy > 60) return 0.9;
  if (energy > 40) return 0.75;
  if (energy > 20) return 0.55;
  return 0.3;
}

// ── Difficulty-based randomness ranges ──

function getRandomnessRange(difficultyTier: number): [number, number] {
  switch (difficultyTier) {
    case 1: return [0.88, 1.12];
    case 2: return [0.82, 1.18];
    case 3: return [0.72, 1.28];
    case 4: return [0.65, 1.35];
    default: return [0.88, 1.12];
  }
}

// ── Outcome tier from score ──

function getOutcomeTier(score: number): OutcomeTier {
  if (score >= 90) return 'CRITICAL_SUCCESS';
  if (score >= 70) return 'SUCCESS';
  if (score >= 50) return 'PARTIAL_SUCCESS';
  if (score >= 30) return 'FAILURE';
  return 'CRITICAL_FAILURE';
}

// ── Interpolate SV delta within a tier's range ──

function interpolateSvDelta(
  svRange: [number, number],
  finalScore: number,
  outcomeTier: OutcomeTier
): number {
  const tierBounds: Record<OutcomeTier, [number, number]> = {
    CRITICAL_SUCCESS: [90, 120],
    SUCCESS: [70, 89],
    PARTIAL_SUCCESS: [50, 69],
    FAILURE: [30, 49],
    CRITICAL_FAILURE: [0, 29],
  };

  const [tierMin, tierMax] = tierBounds[outcomeTier];
  const clampedScore = Math.max(tierMin, Math.min(tierMax, finalScore));
  const t = tierMax === tierMin ? 0.5 : (clampedScore - tierMin) / (tierMax - tierMin);

  const [svMin, svMax] = svRange;
  return Math.round((svMin + t * (svMax - svMin)) * 100) / 100;
}

// ── Dynamic lookup ──

function lookupDynamic(
  dirAId: string,
  dirBId: string,
  dynamics: DirectorDynamic[]
): DirectorDynamic | undefined {
  return dynamics.find(
    (d) =>
      (d.directorAId === dirAId && d.directorBId === dirBId) ||
      (d.directorAId === dirBId && d.directorBId === dirAId)
  );
}

// ── Clamp utility ──

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Main Resolution Function (Pure) ──

export interface ResolveEventInput {
  event: GameEvent;
  deployedDirectors: Director[];
  strategyChoice: string;
  gameState: {
    company: {
      jurisdiction: string;
      difficultyTier: number;
    };
    committees: Record<string, CommitteeState>;
    directors: Director[];
    randomSeed: number;
    boardSeats?: BoardSeat[];
  };
  directorDynamics: DirectorDynamic[];
  rngOverride?: () => number; // for deterministic testing
}

export function resolveEvent(input: ResolveEventInput): ResolutionOutput {
  const { event, deployedDirectors, directorDynamics } = input;
  let { strategyChoice } = input;
  const { company, committees, randomSeed } = input.gameState;

  const rng = input.rngOverride ?? createRng(randomSeed);

  // Step 1: Handle empty deployment or do-nothing
  const isDoNothing =
    deployedDirectors.length === 0 ||
    strategyChoice === 'do_nothing' ||
    event.strategies.find((s) => s.id === strategyChoice)?.label.toLowerCase() === 'do nothing';

  let matchScore = 0;
  let strategyMultiplier = 0.5;
  // Do Nothing score floor: Tier 1 events are more forgiving of inaction
  const doNothingFloor = isDoNothing ? (event.tier === 1 ? 30 : 20) : 0;

  // ── Breakdown tracking ──
  const directorContributions: DirectorContribution[] = [];
  let dynamicsModifier = 0;
  let competencyGatePassed = true;
  let fallbackTriggered = false;
  let usedStrategyId = strategyChoice;
  let fallbackStrategyId: string | undefined;
  const dynamicsTriggered: { directorAId: string; directorBId: string; modifier: number; }[] = [];

  if (!isDoNothing && deployedDirectors.length > 0) {
    // Step 2: Compute Director Match Score
    const allDomains: { domain: CompetencyDomain; weight: number }[] = [
      { domain: event.primaryDomain, weight: event.primaryWeight },
      ...event.secondaryDomains,
    ];

    const directorScores: number[] = [];

    for (const director of deployedDirectors) {
      let directorScore = 0;
      const energyMod = getEnergyModifier(director.currentEnergy);
      const jurisdictionScore =
        director.jurisdictionScores[company.jurisdiction as keyof typeof director.jurisdictionScores];
      const jurisdictionPenaltyApplied = jurisdictionScore !== undefined && jurisdictionScore < 50;

      for (const { domain, weight } of allDomains) {
        let rawRating = director.domainRatings[domain];

        // Jurisdiction familiarity penalty
        if (jurisdictionPenaltyApplied) {
          rawRating = rawRating * 0.7;
        }

        directorScore += rawRating * weight * energyMod;
      }

      directorScores.push(directorScore);
      directorContributions.push({
        directorId: director.id,
        directorName: director.name,
        weightedScore: Math.round(directorScore * 100) / 100,
        energyModifier: energyMod,
        jurisdictionPenaltyApplied,
      });
    }

    // Average across deployed directors
    matchScore =
      directorScores.reduce((sum, s) => sum + s, 0) / deployedDirectors.length;

    // Step 3: Director Dynamics modifier
    if (deployedDirectors.length >= 2) {
      for (let i = 0; i < deployedDirectors.length; i++) {
        for (let j = i + 1; j < deployedDirectors.length; j++) {
          const dynamic = lookupDynamic(
            deployedDirectors[i].id,
            deployedDirectors[j].id,
            directorDynamics
          );
          if (dynamic) {
            matchScore += dynamic.modifier;
            dynamicsModifier += dynamic.modifier;
            dynamicsTriggered.push({ directorAId: deployedDirectors[i].id, directorBId: deployedDirectors[j].id, modifier: dynamic.modifier });
          }
        }
      }
    }

    // Clamp matchScore to 0–100
    matchScore = clamp(matchScore, 0, 100);

    // Step 4: Strategy multiplier
    const strategy = event.strategies.find((s) => s.id === strategyChoice);
    if (strategy) {
      // Step 6: Competency gate check
      let gatesPassed = true;
      for (const gate of strategy.competencyGates) {
        const teamMax = Math.max(
          ...deployedDirectors.map((d) => d.domainRatings[gate.domain])
        );
        if (teamMax < gate.minimumRating) {
          gatesPassed = false;
          break;
        }
      }

      competencyGatePassed = gatesPassed;

      if (gatesPassed) {
        strategyMultiplier = strategy.multiplier;
        usedStrategyId = strategy.id;
      } else if (strategy.fallback) {
        const fallbackStrategy = event.strategies.find(
          (s) => s.id === strategy.fallback
        );
        if (fallbackStrategy) {
          fallbackTriggered = true;
          fallbackStrategyId = fallbackStrategy.id;
          strategyChoice = fallbackStrategy.id;
          usedStrategyId = fallbackStrategy.id;
          strategyMultiplier = fallbackStrategy.multiplier;
        }
      } else {
        // No fallback - use the strategy anyway but it shouldn't reach here
        strategyMultiplier = strategy.multiplier;
        usedStrategyId = strategy.id;
      }
    }
  }

  // Step 5: Committee bonus
  // Guard: bonus only applies if committee is active AND has a chair assigned
  let committeeBonus = 0;
  if (event.relevantCommittee) {
    const committeeState = committees[event.relevantCommittee as CommitteeId];
    if (
      committeeState &&
      committeeState.active &&
      committeeState.chairDirectorId !== null
    ) {
      // Find the chair director in the full game state directors
      const chairDirector = input.gameState.directors.find(
        (d) => d.id === committeeState.chairDirectorId
      );
      if (chairDirector) {
        const chairRating = chairDirector.domainRatings[event.primaryDomain];
        if (chairRating >= 70) {
          committeeBonus = event.committeeBonusValue;
        }
      }
    }
  }

  // Step 7: Raw score before randomness
  let rawScore = matchScore * strategyMultiplier + committeeBonus;
  // Apply Do Nothing floor: ensures inaction isn't always Critical Failure
  if (doNothingFloor > 0) rawScore = Math.max(doNothingFloor, rawScore);
  rawScore = clamp(rawScore, 0, 115);

  // Step 8: Randomness factor
  const randRange = getRandomnessRange(company.difficultyTier);
  const randomFactor = randomInRange(rng, randRange[0], randRange[1]);
  let finalScore = rawScore * randomFactor;
  finalScore = clamp(finalScore, 0, 120);

  // Step 9: Outcome tier
  let outcomeTier = getOutcomeTier(finalScore);

  // Step 9b: Wildcard modifier - 8% chance to shift one tier unexpectedly
  const TIER_ORDER: OutcomeTier[] = ['CRITICAL_FAILURE', 'FAILURE', 'PARTIAL_SUCCESS', 'SUCCESS', 'CRITICAL_SUCCESS'];
  let wildcard = false;
  const wildcardRoll = rng();
  if (wildcardRoll < 0.08) {
    const currentIdx = TIER_ORDER.indexOf(outcomeTier);
    // Randomly shift up or down by 1 tier (if possible)
    const direction = rng() < 0.5 ? -1 : 1;
    const newIdx = currentIdx + direction;
    if (newIdx >= 0 && newIdx < TIER_ORDER.length) {
      outcomeTier = TIER_ORDER[newIdx];
      wildcard = true;
    }
  }

  // Step 10: SV delta lookup
  const tierDef = event.outcomeTiers[outcomeTier];
  const svDelta = interpolateSvDelta(tierDef.svRange, finalScore, outcomeTier);

  // Step 11: Energy depletion
  const energyUpdates: EnergyUpdate[] = [];
  const energyCost =
    event.tier === 1
      ? randomInt(rng, 10, 15)
      : randomInt(rng, 25, 35);

  for (const director of deployedDirectors) {
    const previousEnergy = director.currentEnergy;
    const newEnergy = Math.max(0, previousEnergy - energyCost);
    energyUpdates.push({
      directorId: director.id,
      previousEnergy,
      newEnergy,
    });
  }

  // Step 12: Follow-on event trigger
  const followOnEvents: string[] = [];
  if (
    outcomeTier === 'PARTIAL_SUCCESS' ||
    outcomeTier === 'FAILURE' ||
    outcomeTier === 'CRITICAL_FAILURE'
  ) {
    for (const followOn of event.followOnTriggers) {
      if (followOn.triggerTiers.includes(outcomeTier)) {
        followOnEvents.push(followOn.eventId);
      }
    }
  }

  // ── Best Available Gap analysis ──
  const domainsToCheck: { domain: CompetencyDomain }[] = [
    { domain: event.primaryDomain },
    ...event.secondaryDomains,
  ];
  const bestAvailableGaps: BestAvailableGap[] = [];
  const rosterDirectors = input.gameState.directors;
  if (rosterDirectors.length > 0) {
    for (const { domain } of domainsToCheck) {
      const deployedRatings = deployedDirectors.map((d) => ({
        name: d.name,
        rating: d.domainRatings[domain],
      }));
      const deployedBest =
        deployedRatings.length > 0
          ? deployedRatings.reduce((a, b) => (a.rating >= b.rating ? a : b))
          : null;
      const deployedBestRating = deployedBest?.rating ?? 0;

      const rosterRatings = rosterDirectors.map((d) => ({
        name: d.name,
        rating: d.domainRatings[domain],
      }));
      const rosterBest = rosterRatings.reduce((a, b) =>
        a.rating >= b.rating ? a : b
      );

      const gap = rosterBest.rating - deployedBestRating;
      if (gap > 15) {
        const rosterBestDir = rosterDirectors.find((d) => d.name === rosterBest.name);
        bestAvailableGaps.push({
          domain,
          deployedBestName: deployedBest?.name ?? null,
          deployedBestRating,
          rosterBestName: rosterBest.name,
          rosterBestRating: rosterBest.rating,
          rosterBestBackground: rosterBestDir?.background,
          gap,
        });
      }
    }
  }

  // ── Best Seated Undeployed Gap analysis ──
  const bestSeatedUndeployedGaps: BestAvailableGap[] = [];
  const boardSeatIds = new Set((input.gameState.boardSeats ?? []).map((s) => s.directorId));
  const deployedIds = new Set(deployedDirectors.map((d) => d.id));
  const seatedUndeployed = input.gameState.directors.filter(
    (d) => boardSeatIds.has(d.id) && !deployedIds.has(d.id)
  );
  if (seatedUndeployed.length > 0) {
    for (const { domain } of domainsToCheck) {
      const deplBest = deployedDirectors.length > 0
        ? deployedDirectors.reduce((a, b) => a.domainRatings[domain] >= b.domainRatings[domain] ? a : b)
        : null;
      const deplBestRating = deplBest?.domainRatings[domain] ?? 0;
      const seatedBest = seatedUndeployed.reduce((a, b) =>
        a.domainRatings[domain] >= b.domainRatings[domain] ? a : b
      );
      const gap2 = seatedBest.domainRatings[domain] - deplBestRating;
      if (gap2 > 15) {
        bestSeatedUndeployedGaps.push({
          domain,
          deployedBestName: deplBest?.name ?? null,
          deployedBestRating: deplBestRating,
          rosterBestName: seatedBest.name,
          rosterBestRating: seatedBest.domainRatings[domain],
          rosterBestBackground: seatedBest.background,
          gap: gap2,
        });
      }
    }
  }

  // ── Build breakdown ──
  const breakdown: ResolutionBreakdown = {
    isDoNothing,
    primaryDomain: event.primaryDomain,
    directorContributions,
    dynamicsModifier,
    matchScore: Math.round(matchScore * 100) / 100,
    strategyId: usedStrategyId,
    strategyMultiplier,
    competencyGatePassed,
    fallbackTriggered,
    ...(fallbackStrategyId ? { fallbackStrategyId } : {}),
    committeeBonus,
    rawScore: Math.round(rawScore * 100) / 100,
    randomRange: randRange,
    randomFactor: Math.round(randomFactor * 1000) / 1000,
    bestAvailableGaps,
    dynamicsTriggered,
    bestSeatedUndeployedGaps,
  };

  // ── Dev logging ──
  if (process.env.NODE_ENV === 'development') {
    console.log('[Resolution]', {
      event: event.id,
      deployedDirectors: deployedDirectors.map((d) => d.id),
      strategyChoice,
      isDoNothing,
      matchScore: Math.round(matchScore * 100) / 100,
      strategyMultiplier,
      committeeBonus,
      rawScore: Math.round(rawScore * 100) / 100,
      randomFactor: Math.round(randomFactor * 1000) / 1000,
      finalScore: Math.round(finalScore * 100) / 100,
      outcomeTier,
      wildcard,
      svDelta,
    });
  }

  return {
    outcomeTier,
    finalScore: Math.round(finalScore * 100) / 100,
    svDelta,
    narrativeText: tierDef.narrative,
    energyUpdates,
    followOnEvents,
    wildcard,
    breakdown,
  };
}
