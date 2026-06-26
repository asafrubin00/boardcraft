import type { BoardSeat, Director, GovernanceHealthBreakdown } from '@/types/game';

interface AgmDebriefParams {
  resolutionLabel: string;
  passed: boolean;
  governanceHealth: number;
  governanceHealthBreakdown: GovernanceHealthBreakdown;
  companyId: string;
  contextFlags: Record<string, boolean | number | string | null | undefined>;
  boardSeats: BoardSeat[];
  directors: Director[];
  deployedDirectorIds: string[];
}

function ghNarrative(gh: number): string {
  if (gh >= 70) return 'a majority-independent board that institutional holders were broadly comfortable with';
  if (gh >= 50) return 'a board with enough credibility to pass the basic test, though with some legitimate concerns';
  return 'a board under real scrutiny from institutional holders';
}

type RelevantDomain = 'stakeholderComms' | 'regulatoryLegal' | 'financialOversight' | 'esgSustainability' | 'strategyMarkets' | 'peopleCulture';

function resolutionDomains(label: string): RelevantDomain[] {
  if (label.includes('Re-Election') || label.includes('Re-Elections') || label.includes('Director Election') || label.includes('Ratification') || label.includes('Appointment') || label.includes('Entlastung') || label.includes('Discharge')) {
    return ['stakeholderComms', 'regulatoryLegal'];
  }
  if (label.includes('Say-on-Pay') || label.includes('Remuneration') || label.includes('Compensation') || label.includes('ARUG')) {
    return ['financialOversight'];
  }
  if (label.includes('ESG') || label.includes('Sustainability') || label.includes('Disclosure')) {
    return ['esgSustainability'];
  }
  if (label.includes('Chair') || label.includes('Strategic Review') || label.includes('Meridian')) {
    return ['strategyMarkets', 'regulatoryLegal'];
  }
  if (label.includes('Mission') || label.includes('Alignment') || label.includes('Audit') || label.includes('Accountability')) {
    return ['peopleCulture', 'stakeholderComms'];
  }
  return ['stakeholderComms'];
}

function buildDirectorParagraph(p: AgmDebriefParams, deployedDirectors: Director[]): string {
  if (deployedDirectors.length === 0) {
    return `No directors were sent to the meeting floor — this signals an absence of boardroom coordination at the moment the vote was called.`;
  }

  const domains = resolutionDomains(p.resolutionLabel);
  const primaryDomain = domains[0];

  const getRating = (d: Director) => {
    const ratings = d.domainRatings as Record<string, number>;
    return Math.max(...domains.map((dom) => ratings[dom] ?? 0));
  };

  const sorted = [...deployedDirectors].sort((a, b) => getRating(b) - getRating(a));
  const best = sorted[0];
  const bestRating = getRating(best);
  const weak = deployedDirectors.filter((d) => {
    const ratings = d.domainRatings as Record<string, number>;
    return domains.every((dom) => (ratings[dom] ?? 0) < 50);
  });

  const domainLabel: Record<RelevantDomain, string> = {
    stakeholderComms: 'stakeholder communications',
    regulatoryLegal: 'regulatory and legal understanding',
    financialOversight: 'financial oversight',
    esgSustainability: 'ESG and sustainability expertise',
    strategyMarkets: 'strategic markets acumen',
    peopleCulture: 'people and culture instincts',
  };

  const parts: string[] = [];

  if (bestRating >= 60) {
    parts.push(`${best.name} was the strongest voice on the floor for this vote, bringing ${domainLabel[primaryDomain]} that directly matched what the resolution demanded.`);
  } else {
    parts.push(`None of the directors deployed were a strong match for what this resolution required — ${domainLabel[primaryDomain]} was the key domain, and the floor team was thin on it.`);
  }

  if (weak.length > 0 && weak.some((d) => d.id !== best.id)) {
    const misfits = weak.filter((d) => d.id !== best.id);
    if (misfits.length > 0) {
      parts.push(`${misfits.map((d) => d.name).join(' and ')} ${misfits.length === 1 ? 'was' : 'were'} not the right fit for this specific vote.`);
    }
  }

  if (p.passed && bestRating >= 60) {
    parts.push(`The deployment matched the moment — the right expertise was in the room.`);
  } else if (!p.passed && bestRating >= 60) {
    parts.push(`The board composition was a structural factor the directors on the floor couldn't overcome alone.`);
  } else if (p.passed && bestRating < 60) {
    parts.push(`The resolution passed on governance health alone — not on the strength of the floor team.`);
  }

  return parts.join(' ');
}

export function generateAgmResolutionDebrief(p: AgmDebriefParams): string {
  const sentences: string[] = [];
  const deployedDirectors = p.directors.filter((d) => p.deployedDirectorIds.includes(d.id));

  if (p.companyId === 'company_harwick') {
    if (p.resolutionLabel.includes('Re-Election') || p.resolutionLabel.includes('Re-Elections')) {
      const craneOnBoard = p.contextFlags.craneOnBoard;
      if (p.passed) {
        if (craneOnBoard) {
          sentences.push(`Director re-elections passed, but Geoffrey Crane's twelve-year tenure was the story of the vote — ${ghNarrative(p.governanceHealth)} was what held the institutional base.`);
          sentences.push(`ISS and Glass Lewis both flagged the tenure concern; the board's overall composition gave them enough cover to recommend in favour rather than against.`);
        } else {
          sentences.push(`With no tenure flags on the slate, re-elections passed on ${ghNarrative(p.governanceHealth)}.`);
          sentences.push(`Institutional holders were comfortable; there was nothing to vote against.`);
        }
      } else {
        if (craneOnBoard) {
          sentences.push(`Crane's twelve-year tenure was the breaking point — proxy advisers flagged it, institutions followed, and ${ghNarrative(p.governanceHealth)} wasn't strong enough to absorb the overhang.`);
        } else {
          sentences.push(`Re-elections failed on ${ghNarrative(p.governanceHealth)} — a vote against the slate without a specific tenure target is a signal of general institutional discomfort, which is harder to address than a single appointment.`);
        }
      }
    } else if (p.resolutionLabel.includes('Say-on-Pay') || p.resolutionLabel.includes('Remuneration')) {
      if (p.passed) {
        sentences.push(`The remuneration advisory vote passed. ${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} was the backdrop; proxy adviser support carried it across the line.`);
      } else {
        sentences.push(`A failed Say-on-Pay vote is a public rebuke from shareholders — not legally binding, but the Remuneration Committee now owns a response obligation.`);
        sentences.push(`${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} meant there was no cushion to absorb the proxy adviser red flag.`);
      }
    } else if (p.resolutionLabel.includes('ESG') || p.resolutionLabel.includes('Disclosure')) {
      if (p.passed) {
        sentences.push(`The ESG disclosure resolution passed. The Energy Transition Committee's active involvement gave institutional ESG investors a credible governance anchor.`);
      } else {
        sentences.push(`The ESG disclosure resolution failed. Without credible board-level ESG infrastructure, the motion read as aspirational rather than committed.`);
      }
    }
  } else if (p.companyId === 'company_vantage') {
    if (p.resolutionLabel.includes('Director Election')) {
      const apexActive = p.contextFlags.apexActive;
      if (p.passed) {
        if (apexActive) {
          sentences.push(`The director slate survived Apex Capital's withhold campaign — ${ghNarrative(p.governanceHealth)} held the institutional base that Apex was targeting.`);
          sentences.push(`A withhold campaign that fails to get majority support loses most of its leverage; Apex will need to recalibrate.`);
        } else {
          sentences.push(`With Apex neutralised, the director elections were uncontested in any meaningful sense — ${ghNarrative(p.governanceHealth)} was more than enough.`);
        }
      } else {
        sentences.push(`Apex's withhold campaign found its mark — several incumbents fell below majority support, which in Delaware governance is a credibility crisis regardless of legal status.`);
        sentences.push(`${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} provided no cushion; the board's response in the next quarter will be closely watched.`);
      }
    } else if (p.resolutionLabel.includes('Say-on-Pay') || p.resolutionLabel.includes('Compensation')) {
      if (p.passed) {
        sentences.push(`The Say-on-Pay advisory vote passed despite ISS's red flag on the $14.2m package — ${ghNarrative(p.governanceHealth)} was the deciding factor.`);
      } else {
        sentences.push(`ISS's red flag on the CEO package proved decisive — a failed Say-on-Pay puts the Compensation Committee on formal notice that shareholders are watching the number.`);
      }
    } else if (p.resolutionLabel.includes('Chair')) {
      const progress = Number(p.contextFlags.chairCeoSeparationProgress ?? 0);
      if (p.passed) {
        if (progress >= 50) {
          sentences.push(`Shareholders ratified the independent chair mandate — with separation already underway, the vote formalised what the board had already signalled it would do.`);
        } else {
          sentences.push(`Shareholders mandated an independent Chair over the board's objection — the combined structure survives only until the transition is complete.`);
        }
      } else {
        if (progress >= 50) {
          sentences.push(`The independent chair proposal failed — shareholders accepted the board's own separation timetable as sufficient rather than mandating it legislatively.`);
        } else {
          sentences.push(`The Chair/CEO separation proposal fell short — the combined structure survives, and so does the governance discount that institutional holders have been pricing in.`);
        }
      }
    }
  } else if (p.companyId === 'company_rheinfeld') {
    if (p.resolutionLabel.includes('Discharge') || p.resolutionLabel.includes('Entlastung')) {
      const conflictRevealed = p.contextFlags.heinrichConflictRevealed;
      if (p.passed) {
        if (conflictRevealed) {
          sentences.push(`Discharge passed, but narrowly — the China side-deal disclosures cost Heinrich the customary unanimity that a Supervisory Board chair relies on for authority.`);
        } else {
          sentences.push(`Discharge passed with the Supervisory Board's acts ratified — in German corporate practice, this is the baseline; anything less is a vote of no confidence.`);
          sentences.push(`${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} provided the credibility margin the floor needed.`);
        }
      } else {
        sentences.push(`Discharge refused — in German corporate life, Entlastung denial is the loudest vote of no confidence the annual general meeting can pass.`);
        sentences.push(`The Supervisory Board's acts are formally disapproved; the legal and reputational consequences will trail this result into the next financial year.`);
      }
    } else if (p.resolutionLabel.includes('Remuneration') || p.resolutionLabel.includes('ARUG')) {
      if (p.passed) {
        sentences.push(`The remuneration system was approved under ARUG II — a requirement that Rheinfeld navigated cleanly, with conditions noted in the minutes.`);
      } else {
        sentences.push(`The ARUG II advisory vote against the remuneration system puts the Supervisory Board on formal notice — a binding vote follows if the failure is repeated next year.`);
      }
    } else if (p.resolutionLabel.includes('Strategic Review') || p.resolutionLabel.includes('Meridian')) {
      if (p.passed) {
        sentences.push(`Meridian Capital's independent strategic review motion passed — they stand down from their most aggressive posture, but they remain shareholders with a mandate.`);
      } else {
        sentences.push(`The strategic review motion was defeated — Meridian's analysts left the hall already drafting the EGM requisition.`);
        sentences.push(`A failed shareholder proposal is not the end of an activist campaign; it's usually the prelude to one.`);
      }
    }
  } else if (p.companyId === 'company_meridian') {
    if (p.resolutionLabel.includes('Appointment') || p.resolutionLabel.includes('Ratification')) {
      if (p.passed) {
        sentences.push(`Members ratified the trustee appointments — ${ghNarrative(p.governanceHealth)} was the backdrop that made the slate credible.`);
      } else {
        sentences.push(`Members declined to ratify the trustee appointments — a failure at a Charity Commission-regulated body creates an immediate governance concern about trustee legitimacy.`);
      }
    } else if (p.resolutionLabel.includes('Audit') || p.resolutionLabel.includes('Accountability')) {
      if (p.passed) {
        sentences.push(`The beneficiary accountability audit motion passed — the board now owns a formal commitment to independent programme evaluation.`);
      } else {
        sentences.push(`The accountability audit motion failed — members and donors with concerns about programme delivery have fewer formal levers now.`);
      }
    } else if (p.resolutionLabel.includes('Mission') || p.resolutionLabel.includes('Alignment')) {
      if (p.passed) {
        sentences.push(`The mission alignment review passed — a formal independent review of the organisation's grant strategy and charitable objects alignment is now mandated.`);
        sentences.push(`For a founder-led organisation, this is a structural check on drift that the board itself was unlikely to initiate voluntarily.`);
      } else {
        sentences.push(`The mission alignment review motion failed — programme drift remains unchecked by any formal external review.`);
      }
    }
  }

  // Fallback if no sentences generated
  if (sentences.length === 0) {
    sentences.push(p.passed
      ? `Resolution passed. ${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} provided the baseline credibility shareholders needed.`
      : `Resolution failed. ${ghNarrative(p.governanceHealth).charAt(0).toUpperCase() + ghNarrative(p.governanceHealth).slice(1)} — not enough to carry institutional confidence on this specific question.`
    );
  }

  sentences.push(buildDirectorParagraph(p, deployedDirectors));

  return sentences.join(' ');
}
