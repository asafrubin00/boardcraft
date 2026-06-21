import type { ResolutionOutput, Director, GameEvent, CompetencyDomain, DirectorDynamic } from '@/types/game';

const DOMAIN_FLUENCY: Record<CompetencyDomain, { strength: string; gap: string; label: string }> = {
  financialOversight: {
    label: 'Financial Oversight',
    strength: 'rigorous command of financial controls, audit integrity, and capital discipline',
    gap: 'financial inconsistencies go unchallenged without someone who lives in audit mechanics',
  },
  regulatoryLegal: {
    label: 'Regulatory & Legal',
    strength: 'fluency in regulatory exposure and the legal mechanics of compliance',
    gap: 'the board is navigating a regulatory minefield with no one who can read the terrain',
  },
  strategyMarkets: {
    label: 'Strategy & Markets',
    strength: 'sharp strategic judgment under market and competitive pressure',
    gap: 'no one with the strategic range to see past the immediate crisis',
  },
  peopleCulture: {
    label: 'People & Culture',
    strength: 'real skill managing people and boardroom dynamics under strain',
    gap: 'no one with the interpersonal skill this kind of conflict needed',
  },
  esgSustainability: {
    label: 'ESG & Sustainability',
    strength: 'ESG credibility that investors and regulators actually take seriously',
    gap: 'the response reads as box-ticking rather than substance',
  },
  geopoliticalMacro: {
    label: 'Geopolitical & Macro',
    strength: 'a seasoned read on geopolitical and macro risk',
    gap: "reasoning about the problem with no one who's actually operated in that terrain",
  },
  technologyDigital: {
    label: 'Technology & Digital',
    strength: 'genuine fluency in technology and digital risk, not boardroom literacy',
    gap: "the problem is several steps removed from anyone who understands it",
  },
  stakeholderComms: {
    label: 'Stakeholder & Communications',
    strength: 'deep experience managing investors, activists, and the public under pressure',
    gap: 'no one deployed has handled an activist or public crisis like this before',
  },
};

export function generateDebrief(
  output: ResolutionOutput,
  deployedDirectors: Director[],
  event: GameEvent,
  directorDynamics: DirectorDynamic[],
): string {
  const bd = output.breakdown;
  const sentences: string[] = [];
  const domain = event.primaryDomain;
  const fluency = DOMAIN_FLUENCY[domain];
  const tier = output.outcomeTier;
  const isDoNothing = bd?.isDoNothing ?? deployedDirectors.length === 0;

  // STEP 1 — Problem framing
  if (isDoNothing) {
    sentences.push(`No directors were sent. Governance vacuums don't stay neutral — they read as absence of judgment.`);
  } else {
    const isPositive = tier === 'SUCCESS' || tier === 'CRITICAL_SUCCESS';
    if (isPositive) {
      sentences.push(`This was an issue that needed ${fluency.strength} — and the board delivered it.`);
    } else {
      sentences.push(`This was an issue that needed ${fluency.strength}. Instead, ${fluency.gap}.`);
    }
  }

  if (!isDoNothing && deployedDirectors.length > 0) {
    // STEP 2 — Individual fit
    for (const director of deployedDirectors) {
      const rating = director.domainRatings[domain];
      const bg = director.background.split('.')[0]; // first sentence of background
      if (rating >= 75) {
        sentences.push(`${director.name} — ${bg} — brought exactly the kind of ${fluency.strength} this moment called for.`);
      } else if (rating >= 55) {
        sentences.push(`${director.name} contributed: ${bg}, though this event put more weight on ${fluency.label} than their strongest ground.`);
      } else {
        sentences.push(`${director.name}'s background — ${bg} — is valuable in other contexts, but this event needed ${fluency.gap}.`);
      }
    }

    // STEP 3a — Average dilution
    if (bd && deployedDirectors.length > 1) {
      const contribs = bd.directorContributions;
      if (contribs.length >= 2) {
        const sorted = [...contribs].sort((a, b) => b.weightedScore - a.weightedScore);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        if (highest.weightedScore - lowest.weightedScore > 20) {
          const secondHighest = sorted[1];
          if (lowest.directorId !== highest.directorId) {
            sentences.push(
              `${highest.directorName} and ${secondHighest.directorName} were the right call here — but ${lowest.directorName} brought little to this specific issue, and the result reflects all three, not just the strongest two.`
            );
          }
        }
      }
    }

    // STEP 3b — Named chemistry
    if (bd?.dynamicsTriggered) {
      for (const triggered of bd.dynamicsTriggered) {
        const dynamic = directorDynamics.find(
          (d) =>
            (d.directorAId === triggered.directorAId && d.directorBId === triggered.directorBId) ||
            (d.directorAId === triggered.directorBId && d.directorBId === triggered.directorAId)
        );
        if (dynamic?.narrativeReason) {
          if (triggered.modifier > 0) {
            sentences.push(dynamic.narrativeReason);
          } else {
            sentences.push(`That said: ${dynamic.narrativeReason}`);
          }
        }
      }
    }

    // STEP 4 — Context modifiers
    if (bd) {
      if (bd.committeeBonus > 0) {
        sentences.push(`The relevant committee was active and properly chaired — the institutional infrastructure was in place, and it showed.`);
      }
      for (const contrib of bd.directorContributions) {
        if (contrib.energyModifier < 1.0) {
          const dir = deployedDirectors.find((d) => d.id === contrib.directorId);
          if (dir) {
            sentences.push(`${dir.name} had already been stretched across other matters this quarter; even strong directors lose effectiveness when they're overboarded.`);
          }
        }
      }
      if (bd.fallbackTriggered) {
        sentences.push(`The chosen approach needed ${fluency.strength} that nobody deployed had, so the board defaulted to a safer, lower-upside path.`);
      }
    }
  }

  // STEP 5 — Tier closing line
  if (isDoNothing) {
    // already handled in step 1
  } else if (tier === 'CRITICAL_SUCCESS') {
    sentences.push(`This team didn't just clear the bar — they were overqualified for the moment.`);
  } else if (tier === 'SUCCESS') {
    sentences.push(`The right expertise was in the room and it told.`);
  } else if (tier === 'PARTIAL_SUCCESS') {
    sentences.push(`Contained, not solved — ${fluency.gap} kept this from fully resolving.`);
  } else if (tier === 'FAILURE') {
    sentences.push(`The mismatch between what the event needed and who was sent wasn't bad luck. ${fluency.gap.charAt(0).toUpperCase() + fluency.gap.slice(1)}.`);
  } else if (tier === 'CRITICAL_FAILURE') {
    const weakest = bd?.directorContributions.length
      ? [...bd.directorContributions].sort((a, b) => a.weightedScore - b.weightedScore)[0]
      : null;
    const weakestName = weakest ? ` — and sending ${weakest.directorName} compounded it` : '';
    sentences.push(`This was a structural failure in how the problem was read, not randomness. ${fluency.gap.charAt(0).toUpperCase() + fluency.gap.slice(1)}${weakestName}.`);
  }

  // STEP 6 — What could have gone better (non-CRITICAL_SUCCESS only)
  if (tier !== 'CRITICAL_SUCCESS' && !isDoNothing && bd) {
    const seatedGap = bd.bestSeatedUndeployedGaps?.find((g) => g.domain === domain);
    const poolGap = bd.bestAvailableGaps.find((g) => g.domain === domain);
    const weakestDeployed = bd.directorContributions.length
      ? [...bd.directorContributions].sort((a, b) => a.weightedScore - b.weightedScore)[0]
      : null;

    if (seatedGap) {
      const swapTarget = weakestDeployed ? ` instead of ${weakestDeployed.directorName}` : '';
      sentences.push(
        `Your board had ${seatedGap.rosterBestName} — already seated with a ${fluency.label} rating of ${seatedGap.rosterBestRating}. Sending them${swapTarget} would have given this team real strength where it mattered.`
      );
    } else if (poolGap) {
      sentences.push(
        `This board doesn't currently have anyone with ${fluency.strength} — ${poolGap.rosterBestName} would be worth considering at your next board reshuffle.`
      );
    } else {
      sentences.push(
        `This was your strongest available combination for this issue. The shortfall reflects this board's overall depth in ${fluency.label} rather than this turn's deployment choice.`
      );
    }
  }

  // STEP 7 — Randomness (rare)
  if (bd && !isDoNothing) {
    const randomFactor = bd.randomFactor;
    const strongTeam = bd.matchScore > 65;
    const badOutcome = tier === 'FAILURE' || tier === 'CRITICAL_FAILURE';
    const weakTeam = bd.matchScore < 35;
    const goodOutcome = tier === 'SUCCESS' || tier === 'CRITICAL_SUCCESS';
    if ((strongTeam && badOutcome && randomFactor < 0.88) || (weakTeam && goodOutcome && randomFactor > 1.12)) {
      sentences.push(`Regulators and markets don't always reward even well-prepared responses — circumstances outside the board's control played a part here.`);
    }
  }

  // Cap at 7 sentences total
  return sentences.slice(0, 7).join(' ');
}
