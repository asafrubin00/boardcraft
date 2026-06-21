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

// Returns the most useful background clause for inline citation.
// Bios that open with a very short fragment (< 25 chars, e.g. "King's Counsel." or
// "Founder's son.") pull in the second sentence too, joined as a clause continuation.
function bgClause(background: string): string {
  const parts = background.split('.');
  const first = parts[0].trim();
  if (first.length < 25 && parts.length > 1) {
    const second = parts[1].trim();
    if (second) {
      return `${first}, ${second.charAt(0).toLowerCase()}${second.slice(1)}`;
    }
  }
  return first;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function generateDebrief(
  output: ResolutionOutput,
  deployedDirectors: Director[],
  event: GameEvent,
  directorDynamics: DirectorDynamic[],
): string {
  const bd = output.breakdown;
  const domain = event.primaryDomain;
  const fluency = DOMAIN_FLUENCY[domain];
  const tier = output.outcomeTier;
  const isDoNothing = bd?.isDoNothing ?? deployedDirectors.length === 0;

  const step1: string[] = [];
  const elastic: string[] = [];     // capped at 4 before assembly
  const guaranteed: string[] = [];  // STEP 5 + STEP 6: always appended after elastic cap
  const step7: string[] = [];

  // STEP 1 — Problem framing (always)
  if (isDoNothing) {
    step1.push(`No directors were sent. Governance vacuums don't stay neutral — they read as absence of judgment.`);
  } else {
    const isPositive = tier === 'SUCCESS' || tier === 'CRITICAL_SUCCESS';
    if (isPositive) {
      step1.push(`This was an issue that needed ${fluency.strength} — and the board delivered it.`);
    } else {
      step1.push(`This was an issue that needed ${fluency.strength}. Instead, ${fluency.gap}.`);
    }
  }

  let dilutionFired = false;

  if (!isDoNothing && deployedDirectors.length > 0) {
    // STEP 2 — Individual fit, capped to the 2 most domain-relevant directors.
    // With 3+ deployed, the weakest by domain is still named in STEP 3a if dilution fires.
    const byRating = [...deployedDirectors].sort(
      (a, b) => b.domainRatings[domain] - a.domainRatings[domain]
    );
    const step2Directors = byRating.slice(0, 2);
    for (const director of step2Directors) {
      const rating = director.domainRatings[domain];
      const bg = bgClause(director.background);
      if (rating >= 75) {
        elastic.push(`${director.name} — ${bg} — brought exactly the kind of ${fluency.strength} this moment called for.`);
      } else if (rating >= 55) {
        elastic.push(`${director.name} contributed: ${bg}, though this event put more weight on ${fluency.label} than their strongest ground.`);
      } else {
        elastic.push(`${director.name}'s background — ${bg} — is valuable in other contexts, but this event needed ${fluency.gap}.`);
      }
    }

    // STEP 3a — Dilution sentence (names the weakest director specifically)
    if (bd && deployedDirectors.length > 1) {
      const contribs = bd.directorContributions;
      if (contribs.length >= 2) {
        const sorted = [...contribs].sort((a, b) => b.weightedScore - a.weightedScore);
        const highest = sorted[0];
        const lowest = sorted[sorted.length - 1];
        if (highest.weightedScore - lowest.weightedScore > 20 && lowest.directorId !== highest.directorId) {
          const secondHighest = sorted[1];
          elastic.push(
            `${highest.directorName} and ${secondHighest.directorName} were the right call here — but ${lowest.directorName} brought little to this specific issue, and the result reflects all three, not just the strongest two.`
          );
          dilutionFired = true;
        }
      }
    }

    // STEP 3b — Named chemistry (cap at 2 pairs; 3 pairs with 3 directors reads repetitive)
    if (bd?.dynamicsTriggered) {
      let pairCount = 0;
      for (const triggered of bd.dynamicsTriggered) {
        if (pairCount >= 2) break;
        const dynamic = directorDynamics.find(
          (d) =>
            (d.directorAId === triggered.directorAId && d.directorBId === triggered.directorBId) ||
            (d.directorAId === triggered.directorBId && d.directorBId === triggered.directorAId)
        );
        if (dynamic?.narrativeReason) {
          elastic.push(triggered.modifier > 0 ? dynamic.narrativeReason : `That said: ${dynamic.narrativeReason}`);
          pairCount++;
        }
      }
    }

    // STEP 4 — Context modifiers
    if (bd) {
      if (bd.committeeBonus > 0) {
        elastic.push(`The relevant committee was active and properly chaired — the institutional infrastructure was in place, and it showed.`);
      }
      // Cap overboard to the first tired director only — multiple copies of this sentence read robotic
      const tiredContrib = bd.directorContributions.find((c) => c.energyModifier < 1.0);
      if (tiredContrib) {
        const dir = deployedDirectors.find((d) => d.id === tiredContrib.directorId);
        if (dir) {
          elastic.push(`${dir.name} had already been stretched across other matters this quarter; even strong directors lose effectiveness when they're overboarded.`);
        }
      }
      if (bd.fallbackTriggered) {
        elastic.push(`The chosen approach needed ${fluency.strength} that nobody deployed had, so the board defaulted to a safer, lower-upside path.`);
      }
    }
  }

  // STEP 5 — Tier closing line (guaranteed — appended after elastic cap, never dropped)
  if (!isDoNothing) {
    if (tier === 'CRITICAL_SUCCESS') {
      guaranteed.push(`This team didn't just clear the bar — they were overqualified for the moment.`);
    } else if (tier === 'SUCCESS') {
      guaranteed.push(`The right expertise was in the room and it told.`);
    } else if (tier === 'PARTIAL_SUCCESS') {
      guaranteed.push(`Contained, not solved — ${fluency.gap} kept this from fully resolving.`);
    } else if (tier === 'FAILURE') {
      guaranteed.push(`The mismatch between what the event needed and who was sent wasn't bad luck. ${cap(fluency.gap)}.`);
    } else if (tier === 'CRITICAL_FAILURE') {
      // Avoid naming the weakest director twice when STEP 3a's dilution sentence already called them out
      const weakest = bd?.directorContributions.length
        ? [...bd.directorContributions].sort((a, b) => a.weightedScore - b.weightedScore)[0]
        : null;
      const weakestName = (!dilutionFired && weakest) ? ` — and sending ${weakest.directorName} compounded it` : '';
      guaranteed.push(`This was a structural failure in how the problem was read, not circumstance. ${cap(fluency.gap)}${weakestName}.`);
    }
  }

  // STEP 6 — What could have gone better (guaranteed for non-CRITICAL_SUCCESS, never dropped)
  if (tier !== 'CRITICAL_SUCCESS' && !isDoNothing && bd) {
    const seatedGap = bd.bestSeatedUndeployedGaps?.find((g) => g.domain === domain);
    const poolGap = bd.bestAvailableGaps.find((g) => g.domain === domain);
    const weakestDeployed = bd.directorContributions.length
      ? [...bd.directorContributions].sort((a, b) => a.weightedScore - b.weightedScore)[0]
      : null;

    if (seatedGap) {
      // Cite the director's actual background text — same approach as STEP 2 deployed directors
      const bg = seatedGap.rosterBestBackground ? bgClause(seatedGap.rosterBestBackground) : null;
      const bgPhrase = bg ? ` — ${bg}` : '';
      const swapTarget = weakestDeployed ? ` instead of ${weakestDeployed.directorName}` : '';
      guaranteed.push(
        `${seatedGap.rosterBestName} was sitting on your board${bgPhrase} — and wasn't deployed here. Sending them${swapTarget} would have given this team real strength where it mattered.`
      );
    } else if (poolGap) {
      guaranteed.push(
        `This board doesn't currently have anyone with ${fluency.strength} — ${poolGap.rosterBestName} would be worth considering at your next board reshuffle.`
      );
    } else {
      guaranteed.push(
        `This was your strongest available combination for this issue. The shortfall reflects this board's overall depth in ${fluency.label} rather than this turn's deployment choice.`
      );
    }
  }

  // STEP 7 — Rare in-world uncertainty
  if (bd && !isDoNothing) {
    const randomFactor = bd.randomFactor;
    const strongTeam = bd.matchScore > 65;
    const badOutcome = tier === 'FAILURE' || tier === 'CRITICAL_FAILURE';
    const weakTeam = bd.matchScore < 35;
    const goodOutcome = tier === 'SUCCESS' || tier === 'CRITICAL_SUCCESS';
    if ((strongTeam && badOutcome && randomFactor < 0.88) || (weakTeam && goodOutcome && randomFactor > 1.12)) {
      step7.push(`Regulators and markets don't always reward even well-prepared responses — circumstances outside the board's control played a part here.`);
    }
  }

  // Assembly: step1 (1) + elastic capped at 4 + guaranteed (1–2) + step7 (0–1)
  // Guaranteed sentences (STEP 5 + STEP 6) are structurally excluded from the cap
  // so they can never be silently dropped by a busy elastic pool.
  return [...step1, ...elastic.slice(0, 4), ...guaranteed, ...step7].join(' ');
}
