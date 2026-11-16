// ── The Governance Debrief ──
//
// Turns a finished year into a document a facilitator can hand out: every
// decision the player took, what it led to, the provision of the relevant
// code it touches, and what good practice looks like. Pure: state in,
// report out. Rendered by components/debrief/DebriefReport.tsx.
//
// Citations are deliberately kept to provisions that are well established.
// Where a rule is specific to a jurisdiction it is named; nothing here is
// legal advice, and the report says so.

import type { GameState, OutcomeTier, ResolvedEvent } from '@/types/game';
import { events as allEvents } from '@/data/events';
import { checkCompliance } from '@/engine/compliance';
import { getProxyAdviserRating } from '@/engine/gameStateManager';
import type { AgmResolutionVote } from '@/engine/agm';

export type Framework = 'uk' | 'us' | 'de' | 'sg' | 'charity';

export type Topic =
  | 'committees' | 'remuneration' | 'shareholders' | 'takeover' | 'conflicts'
  | 'speakUp' | 'succession' | 'risk' | 'sustainability' | 'strategy'
  | 'regulator' | 'stakeholders' | 'reporting' | 'leadership' | 'agm';

export const FRAMEWORK_NAME: Record<Framework, string> = {
  uk: 'UK Corporate Governance Code 2024 and the Companies Act 2006',
  us: 'NYSE listing standards, SEC rules and Delaware practice',
  de: 'German Stock Corporation Act (AktG) and the German Corporate Governance Code (DCGK 2022)',
  sg: 'Singapore Code of Corporate Governance 2018, SGX Listing Rules and MAS requirements',
  charity: 'Charity Governance Code and Charity Commission guidance (England and Wales)',
};

export function frameworkFor(companyId: string): Framework {
  switch (companyId) {
    case 'company_vantage': return 'us';
    case 'company_rheinfeld': return 'de';
    case 'company_sfg': return 'sg';
    case 'company_meridian': return 'charity';
    default: return 'uk';
  }
}

interface TopicDef {
  label: string;
  /** What good practice looks like, in one or two sentences. */
  good: string;
  cite: Record<Framework, string>;
}

export const TOPICS: Record<Topic, TopicDef> = {
  committees: {
    label: 'Committees and their chairs',
    good: 'Key committees need a qualified, independent chair at all times. A vacancy is filled through the nomination process quickly, and the board says publicly when and how.',
    cite: {
      uk: 'UK Code Provisions 17, 24 and 32 (nomination, audit and remuneration committees)',
      us: 'NYSE Listed Company Manual 303A.04 to 303A.07 (nominating, compensation and audit committees)',
      de: 'AktG §107(4) with §100(5) (audit committee and financial expertise); DCGK D.3',
      sg: 'Code of Corporate Governance Provision 10.2 (audit committee composition); MAS Banking (Corporate Governance) Regulations 2005',
      charity: 'Charity Governance Code: Decision-making; Charity Commission CC8 (internal financial controls)',
    },
  },
  remuneration: {
    label: 'Executive pay',
    good: 'Pay is set by an independent committee, linked to long-term performance, explained before shareholders have to ask, and can be clawed back when things go wrong.',
    cite: {
      uk: 'UK Code Principles P to R and Provisions 33 and 37 (remuneration committee; malus and clawback)',
      us: 'Exchange Act §14A (say-on-pay); Regulation S-K Item 402; SEC Rule 10D-1 and NYSE 303A.14 (clawback)',
      de: 'AktG §87 and §87a (remuneration system), §120a (shareholder vote), §162 (remuneration report)',
      sg: 'Code of Corporate Governance Principles 6 to 8; SGX Listing Rule 1207(10D) (disclosure of exact remuneration)',
      charity: 'Charity Governance Code: Managing resources and risks; Charities SORP disclosure of senior staff pay',
    },
  },
  shareholders: {
    label: 'Shareholder and activist engagement',
    good: 'The board talks to its major holders early and through its independent directors, understands what they want before it becomes a campaign, and explains what it will do about significant dissent.',
    cite: {
      uk: 'UK Code Provisions 3 and 4 (engagement with major shareholders; response to 20% or more votes against)',
      us: 'Exchange Act §13(d) (Schedule 13D); SEC Rules 14a-8 and 14a-19 (shareholder proposals; universal proxy)',
      de: 'AktG §122 (minority right to requisition a general meeting) and §131 (right to information)',
      sg: 'Code of Corporate Governance Principles 11 to 13; Companies Act 1967 s.176 (requisitioned meetings)',
      charity: 'Charity Governance Code: Leadership; Ethics and culture (accountability to members, donors and beneficiaries)',
    },
  },
  takeover: {
    label: 'Takeover approaches',
    good: 'Directors judge an approach on value for the company and its owners, take independent advice, and do not put their own seats ahead of the shareholders\' right to decide.',
    cite: {
      uk: 'Takeover Code General Principle 3 and Rule 21 (no frustrating action); Companies Act 2006 s.172',
      us: 'Delaware fiduciary duties: Unocal (1985) and Revlon (1986)',
      de: 'WpÜG §27 (reasoned opinion) and §33 (limits on defensive measures)',
      sg: 'Singapore Code on Take-overs and Mergers; Banking Act 1970 (MAS approval of substantial shareholdings in a bank)',
      charity: 'Charity Commission CC3 (acting only in the charity\'s interests)',
    },
  },
  conflicts: {
    label: 'Conflicts of interest and related parties',
    good: 'A conflict is declared the moment it exists, the person steps out of the decision, the board records what it did, and the regulator hears it from the board first.',
    cite: {
      uk: 'UK Code Provision 7; Companies Act 2006 ss.175 to 177',
      us: 'NYSE 303A.02 (independence tests); Regulation S-K Item 404 (related-person transactions)',
      de: 'AktG §§111a to 111c (related-party transactions); DCGK E.1 (disclosure of conflicts)',
      sg: 'SGX Listing Manual Chapter 9 (interested person transactions); Companies Act 1967 s.156',
      charity: 'Charity Commission CC29 (conflicts of interest); Charities Act 2011 ss.185 to 188',
    },
  },
  speakUp: {
    label: 'Speaking up, misconduct and investigations',
    good: 'Serious allegations are investigated independently of the people concerned, the person who raised them is protected, and the board owns the process rather than management.',
    cite: {
      uk: 'UK Code Provision 6 (raising concerns; proportionate and independent investigation)',
      us: 'Sarbanes-Oxley §301 and §806; Dodd-Frank §922 (whistleblower protection)',
      de: 'Hinweisgeberschutzgesetz 2023; AktG §91 (internal control and risk management)',
      sg: 'Code of Corporate Governance Provision 10.1(f) (whistleblowing arrangements)',
      charity: 'Charity Commission guidance on reporting serious incidents and on safeguarding',
    },
  },
  succession: {
    label: 'Board renewal, tenure and succession',
    good: 'Tenure is managed before it becomes a headline. The board keeps a live succession plan for the chair, the committee chairs and the chief executive, and refreshes itself on its own timetable, not an activist\'s.',
    cite: {
      uk: 'UK Code Provisions 10, 17, 18 and 19 (nine-year independence test; succession planning; annual re-election; chair tenure)',
      us: 'NYSE 303A.04 and 303A.09 (nominating committee; governance guidelines including succession)',
      de: 'DCGK B.2 (succession planning), C.1 (competence profile) and C.7 (independence, including long tenure)',
      sg: 'Code of Corporate Governance Provisions 2.1 and 4.1; SGX Listing Rule 210(5)(d)(iv) (nine-year limit on independence)',
      charity: 'Charity Governance Code: Leadership, and its long-standing nine-year guidance on trustee terms',
    },
  },
  risk: {
    label: 'Risk, safety and internal control',
    good: 'The board knows its principal risks, tests that controls actually work, and when something fails it leads the response itself: quickly, openly and with the right expertise in the room.',
    cite: {
      uk: 'UK Code Principle O and Provisions 28 and 29 (principal risks; risk management and internal control)',
      us: 'Caremark oversight duty (Delaware); Regulation S-K Item 407(h) (board risk oversight)',
      de: 'AktG §91(2) and (3), §107(3) (risk management system and its monitoring)',
      sg: 'Code of Corporate Governance Principle 9; SGX Listing Rule 1207(10)',
      charity: 'Charity Governance Code: Managing resources and risks; Charity Commission CC19 (reserves) and CC8',
    },
  },
  sustainability: {
    label: 'Sustainability and climate',
    good: 'Sustainability is governed like any other material risk and opportunity: owned at board level, backed by a plan with numbers in it, and reported honestly.',
    cite: {
      uk: 'UK Code Principle A and Provision 1 (long-term sustainable success); FCA climate-related disclosure rules',
      us: 'Regulation S-K Items 101 and 105 (material business and risk disclosure)',
      de: 'Corporate Sustainability Reporting Directive (EU) 2022/2464; DCGK A.1',
      sg: 'SGX Listing Rules 711A and 711B (sustainability reporting); MAS Guidelines on Environmental Risk Management',
      charity: 'Charity Governance Code: Organisational purpose',
    },
  },
  strategy: {
    label: 'Strategy and major decisions',
    good: 'The board tests management\'s case rather than waving it through, takes independent advice on the big calls, and is clear afterwards about what it decided and why.',
    cite: {
      uk: 'UK Code Principles A and B and Provision 1; Companies Act 2006 s.172',
      us: 'Business judgment rule (Delaware); NYSE 303A.09',
      de: 'AktG §111 (supervision of management, including reserved matters under §111(4))',
      sg: 'Code of Corporate Governance Principle 1 (the board\'s conduct of affairs)',
      charity: 'Charity Governance Code: Organisational purpose; Charity Commission CC3 (acting within the charity\'s objects)',
    },
  },
  regulator: {
    label: 'Dealing with regulators',
    good: 'The board engages early, tells the regulator the truth before it is asked, and treats a regulatory letter as a governance matter for directors, not a legal matter for counsel alone.',
    cite: {
      uk: 'UK Code Principle O; Companies Act 2006 s.172 and s.174',
      us: 'Caremark oversight duty (Delaware)',
      de: 'AktG §93 and §116 (duty of care of both boards)',
      sg: 'MAS Guidelines on Individual Accountability and Conduct; Banking Act 1970',
      charity: 'Charities Act 2011 s.46 (statutory inquiry) and ss.76 and 79 (protective powers and removal)',
    },
  },
  stakeholders: {
    label: 'Workforce and wider stakeholders',
    good: 'The board has a real channel to the people its decisions affect, hears them before it decides, and can show how what it heard changed the outcome.',
    cite: {
      uk: 'UK Code Provision 5 (workforce and stakeholder engagement); Companies Act 2006 s.172',
      us: 'NYSE 303A.10 (code of business conduct and ethics)',
      de: 'Mitbestimmungsgesetz 1976 (co-determination); Betriebsverfassungsgesetz',
      sg: 'Code of Corporate Governance Principle 13 (engagement with stakeholders)',
      charity: 'Charity Governance Code: Ethics and culture',
    },
  },
  reporting: {
    label: 'Reporting and disclosure',
    good: 'What the organisation says about itself is fair, balanced and capable of being checked. When a number turns out to be wrong, the board corrects it in public.',
    cite: {
      uk: 'UK Code Principles M and N and Provision 27 (fair, balanced and understandable)',
      us: 'Sarbanes-Oxley §302 and §404',
      de: 'AktG §171 (supervisory board review of the accounts)',
      sg: 'SGX Listing Rule 703 (continuous disclosure)',
      charity: 'Charities SORP (FRS 102) and the trustees\' annual report',
    },
  },
  leadership: {
    label: 'Board leadership and the division of roles',
    good: 'No one person has unfettered power. The chair runs the board, the chief executive runs the organisation, and a founder or dominant figure is held to the same boundaries as everyone else.',
    cite: {
      uk: 'UK Code Principles F and G and Provision 9 (chair and chief executive roles not combined)',
      us: 'Regulation S-K Item 407(h) (leadership structure); NYSE 303A.03 (executive sessions)',
      de: 'DCGK C.10 (independence of the supervisory board chair); AktG §107(1)',
      sg: 'Code of Corporate Governance Provisions 2.2, 3.1 and 3.3 (independent majority; separate chair and CEO; lead independent director)',
      charity: 'Charity Governance Code: Leadership; Charity Commission CC3 (collective responsibility of trustees)',
    },
  },
  agm: {
    label: 'The annual meeting',
    good: 'The meeting is won during the year, not on the day. The board knows how its holders will vote, why, and what it will say if a fifth of them disagree.',
    cite: {
      uk: 'UK Code Provisions 4 and 18',
      us: 'Exchange Act §14A; SEC Rule 14a-8',
      de: 'AktG §120 (Entlastung) and §120a',
      sg: 'Code of Corporate Governance Principle 11; SGX Listing Rule 210(5)(d)(iv)',
      charity: 'Charity Governance Code: Leadership; Ethics and culture',
    },
  },
};

/** Which governance topic each event is really about. */
export const EVENT_TOPIC: Record<string, Topic> = {
  event_01: 'committees', event_02: 'succession', event_03: 'risk', event_04: 'shareholders', event_05: 'sustainability',
  event_06: 'remuneration', event_07: 'regulator', event_09: 'agm', event_10: 'shareholders', event_11: 'speakUp',
  event_12: 'sustainability', event_13: 'takeover', event_14: 'risk', event_15: 'shareholders',
  vevent_01: 'conflicts', vevent_02: 'shareholders', vevent_03: 'remuneration', vevent_04: 'regulator', vevent_05: 'leadership',
  vevent_06: 'risk', vevent_07: 'strategy', vevent_09: 'agm', vevent_10: 'shareholders', vevent_11: 'stakeholders',
  vevent_12: 'regulator', vevent_13: 'takeover', vevent_14: 'risk', vevent_15: 'shareholders',
  revent_01: 'committees', revent_02: 'shareholders', revent_03: 'sustainability', revent_04: 'succession', revent_05: 'strategy',
  revent_06: 'strategy', revent_07: 'stakeholders', revent_09: 'agm', revent_10: 'sustainability', revent_11: 'conflicts',
  revent_12: 'shareholders', revent_13: 'strategy', revent_14: 'succession', revent_15: 'regulator',
  mevent_01: 'conflicts', mevent_02: 'strategy', mevent_03: 'leadership', mevent_04: 'speakUp', mevent_05: 'reporting',
  mevent_06: 'regulator', mevent_07: 'risk', mevent_08: 'regulator', mevent_09: 'leadership', mevent_10: 'reporting',
  mevent_11: 'remuneration', mevent_12: 'risk', mevent_13: 'stakeholders', mevent_14: 'succession', mevent_15: 'stakeholders',
  mevent_amm: 'agm',
  sfgevent_01: 'committees', sfgevent_02: 'succession', sfgevent_03: 'remuneration', sfgevent_04: 'speakUp', sfgevent_05: 'risk',
  sfgevent_06: 'strategy', sfgevent_07: 'sustainability', sfgevent_08: 'shareholders', sfgevent_09: 'shareholders', sfgevent_10: 'conflicts',
  sfgevent_11: 'takeover', sfgevent_12: 'regulator', sfgevent_13: 'agm', sfgevent_14: 'strategy', sfgevent_15: 'succession',
};

const TIER_SCORE: Record<OutcomeTier, number> = {
  CRITICAL_SUCCESS: 2, SUCCESS: 1, PARTIAL_SUCCESS: 0, FAILURE: -1, CRITICAL_FAILURE: -2,
};

export const TIER_LABEL: Record<OutcomeTier, string> = {
  CRITICAL_SUCCESS: 'Exemplary', SUCCESS: 'Sound', PARTIAL_SUCCESS: 'Mixed', FAILURE: 'Poor', CRITICAL_FAILURE: 'Damaging',
};

export interface DecisionFinding {
  when: string;
  eventName: string;
  chose: string;
  team: string[];
  tier: OutcomeTier;
  svDelta: number;
  topic: Topic;
  topicLabel: string;
  cite: string;
  /** One sentence on why it went the way it did. */
  why: string;
}

export interface ThemeFinding {
  topic: Topic;
  label: string;
  decisions: number;
  score: number;
  verdict: 'strength' | 'mixed' | 'weakness';
  good: string;
  cite: string;
  /** The player's own decisions in this area. */
  items: { name: string; tier: OutcomeTier }[];
}

export interface Debrief {
  companyName: string;
  framework: string;
  metricName: string;
  metricStart: number;
  metricEnd: number;
  governanceHealth: number;
  rating: string;
  headline: string;
  pillars: { name: string; score: number; max: number }[];
  decisions: DecisionFinding[];
  themes: ThemeFinding[];
  board: { finding: string; fromCode: boolean }[];
  boardSize: number;
  agm: AgmResolutionVote[];
  lessons: string[];
  reliance: { name: string; deployments: number; share: number }[];
}

function whyLine(r: ResolvedEvent, primaryDomainLabel: string, names: string[]): string {
  const b = r.breakdown;
  if (!b) return 'No directors were deployed.';
  if (b.isDoNothing) return 'The board chose not to act, so the outcome was left to events.';
  if (b.fallbackTriggered) return 'Nobody on the team met the expertise the chosen option called for, so the board fell back on a weaker course.';
  const top = [...b.directorContributions].sort((x, y) => y.weightedScore - x.weightedScore)[0];
  const lead = top ? names.find((n) => n === top.directorName) ?? top.directorName : null;
  const gap = b.bestSeatedUndeployedGaps[0];
  if (TIER_SCORE[r.outcomeTier] > 0) {
    return lead ? `${lead} carried it: the team had real depth in ${primaryDomainLabel}.` : `The team had real depth in ${primaryDomainLabel}.`;
  }
  if (gap) return `The team was thin on ${primaryDomainLabel}. ${gap.rosterBestName} was on the board and far stronger in it, but was not sent.`;
  if (b.dynamicsModifier < 0) return 'The directors sent in did not work well together, and it showed.';
  return `The board did not have enough ${primaryDomainLabel} expertise for the option it chose.`;
}

const DOMAIN_LABEL: Record<string, string> = {
  financialOversight: 'financial oversight', regulatoryLegal: 'regulatory and legal matters', strategyMarkets: 'strategy and markets',
  peopleCulture: 'people and culture', esgSustainability: 'sustainability', geopoliticalMacro: 'geopolitics',
  technologyDigital: 'technology', stakeholderComms: 'stakeholder communication',
};

export function buildDebrief(state: GameState, agmVotes: AgmResolutionVote[] = []): Debrief {
  const fw = frameworkFor(state.company.id);
  const isCharity = fw === 'charity';
  const nameOf = (id: string) => state.directors.find((d) => d.id === id)?.name ?? id;

  const played = state.resolvedEvents.filter((r) => r.strategyChosen !== 'auto');

  const decisions: DecisionFinding[] = played.map((r) => {
    const ev = allEvents.find((e) => e.id === r.eventId);
    const topic = EVENT_TOPIC[r.eventId] ?? 'strategy';
    const strat = ev?.strategies.find((s) => s.id === r.strategyChosen);
    const team = r.deployedDirectorIds.map(nameOf);
    return {
      when: r.resolvedAtQuarter === 'AGM' ? 'Annual meeting' : `${r.resolvedAtQuarter}, turn ${r.resolvedAtTurn}`,
      eventName: ev?.name ?? r.eventId,
      chose: strat?.label ?? 'Addressed the meeting',
      team,
      tier: r.outcomeTier,
      svDelta: r.svDelta,
      topic,
      topicLabel: TOPICS[topic].label,
      cite: TOPICS[topic].cite[fw],
      why: whyLine(r, DOMAIN_LABEL[ev?.primaryDomain ?? ''] ?? 'the relevant area', team),
    };
  });

  // Themes: how the player did, topic by topic
  const byTopic = new Map<Topic, DecisionFinding[]>();
  for (const d of decisions) byTopic.set(d.topic, [...(byTopic.get(d.topic) ?? []), d]);
  const themes: ThemeFinding[] = [...byTopic.entries()]
    .map(([topic, list]) => {
      const score = list.reduce((s, d) => s + TIER_SCORE[d.tier], 0);
      const avg = score / list.length;
      return {
        topic,
        label: TOPICS[topic].label,
        decisions: list.length,
        score,
        verdict: (avg >= 0.5 ? 'strength' : avg <= -0.5 ? 'weakness' : 'mixed') as ThemeFinding['verdict'],
        good: TOPICS[topic].good,
        cite: TOPICS[topic].cite[fw],
        items: list.map((d) => ({ name: d.eventName, tier: d.tier })),
      };
    })
    .sort((a, b) => a.score / a.decisions - b.score / b.decisions);

  // The board as it stands at year-end, against the code
  const errors = checkCompliance(
    state.board.seats, state.directors, state.committees, state.company.jurisdiction,
    state.company.id === 'company_vantage', state.company.id
  );
  const board = errors
    .filter((e) => e.source !== 'game')
    .map((e) => ({ finding: e.message, fromCode: true }));

  // Reliance on individuals
  const counts = new Map<string, number>();
  for (const r of played) for (const id of r.deployedDirectorIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  const reliance = [...counts.entries()]
    .map(([id, n]) => ({ name: nameOf(id), deployments: n, share: played.length ? n / played.length : 0 }))
    .sort((a, b) => b.deployments - a.deployments)
    .slice(0, 5);

  // Lessons
  const lessons: string[] = [];
  const weakest = themes.find((t) => t.verdict === 'weakness');
  const strongest = [...themes].reverse().find((t) => t.verdict === 'strength');
  if (weakest) {
    lessons.push(`Weakest area: ${weakest.label.toLowerCase()}. ${weakest.good} (${weakest.cite}.)`);
  }
  if (strongest) {
    lessons.push(`Strongest area: ${strongest.label.toLowerCase()}. Keep doing what you did there, and look at who you sent.`);
  }
  const inaction = played.filter((r) => r.breakdown?.isDoNothing).length;
  if (inaction >= 2) {
    lessons.push(`The board chose not to act ${inaction} times. Inaction is a decision, and regulators and shareholders read it as one.`);
  }
  const outOfDepth = played.filter((r) => r.breakdown?.fallbackTriggered).length;
  if (outOfDepth >= 2) {
    lessons.push(`${outOfDepth} times the board picked a course its team did not have the expertise to carry out. That is a skills-matrix problem: recruit for the gaps, or choose within your means.`);
  }
  if (reliance[0] && reliance[0].share >= 0.5 && played.length >= 6) {
    lessons.push(`${reliance[0].name} was sent into ${reliance[0].deployments} of ${played.length} decisions. A board that leans this hard on one director has a key-person risk and should say so in its next evaluation.`);
  }
  if (board.length > 0) {
    lessons.push(`The board ends the year with ${board.length} open ${board.length === 1 ? 'departure' : 'departures'} from the code. Each needs either fixing or a public explanation.`);
  }
  if (lessons.length === 0) {
    lessons.push('A steady year with no single weak area. The next test is whether the board can repeat it with different people in the room.');
  }

  const wins = decisions.filter((d) => TIER_SCORE[d.tier] > 0).length;
  const losses = decisions.filter((d) => TIER_SCORE[d.tier] < 0).length;
  const metricStart = state.company.startingSvIndex;
  const metricEnd = isCharity ? state.missionIntegrityScore || state.svIndex : state.svIndex;
  const moved = metricEnd - metricStart;
  const headline =
    `${decisions.length} decisions: ${wins} went well, ${losses} went badly. ` +
    `${isCharity ? 'Mission integrity' : 'Shareholder value'} ${moved >= 0 ? 'rose' : 'fell'} ${Math.abs(Math.round(moved * 10) / 10)} points ` +
    `and governance health closed at ${Math.round(state.governanceHealth)}.`;

  const gb = state.governanceHealthBreakdown;
  const pillars = [
    { name: 'Board independence', score: gb.boardIndependence, max: 20 },
    { name: 'Committees', score: gb.committeeCompleteness, max: 20 },
    { name: isCharity ? 'Chair and executive roles' : 'Chair and CEO roles', score: gb.chairCeoSeparation, max: 20 },
    { name: 'Sustainability governance', score: gb.esgGovernance, max: 20 },
    { name: 'Skills coverage', score: gb.skillMatrixCoverage, max: 20 },
  ];

  return {
    companyName: state.company.name,
    framework: FRAMEWORK_NAME[fw],
    metricName: isCharity ? 'Mission integrity' : 'Shareholder value index',
    metricStart,
    metricEnd: Math.round(metricEnd * 10) / 10,
    governanceHealth: Math.round(state.governanceHealth),
    rating: getProxyAdviserRating(state.governanceHealth),
    headline,
    pillars,
    decisions,
    themes,
    board,
    boardSize: state.board.seats.length,
    agm: agmVotes,
    lessons: lessons.slice(0, 5),
    reliance,
  };
}
