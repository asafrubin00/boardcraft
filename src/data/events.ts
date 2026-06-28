import { GameEvent } from '@/types/game';
import { vantageEvents } from './vantage/events';
import { rheinfeldEvents } from './rheinfeld/events';
import { meridianEvents } from './meridian/events';
import { sfgEvents } from './sfg/events';

export const events: GameEvent[] = [
  // ── EVENT 01 - The Remuneration Committee Chair Vacancy ──
  {
    id: 'event_01',
    name: 'The Remuneration Committee Chair Vacancy',
    tier: 1,
    quarter: 'Q1',
    turn: 1,
    illustrationType: 'event-rem-chair-vacancy',
    narrativeCard:
      'Two quarters without a Rem Committee Chair, and the silence from the institutions has turned from polite to pointed. Meridian Governance\'s note to the Company Secretary arrived this morning - not a threat, exactly, but the kind of language that leaves very little room for interpretation. If a Chair is not confirmed before Q2, they will recommend against the entire board at the AGM. The Company Secretary looked rather pale delivering it.',
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_01_a',
        label: 'Appoint from current board',
        description: 'Identify a qualified NED already on the board and formally appoint them as Rem Committee Chair. Fastest route to resolution, but requires genuine remuneration expertise.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
        fallback: 'event_01_c',
      },
      {
        id: 'event_01_b',
        label: 'External appointment, urgent',
        description: 'Launch an accelerated search for an external candidate with remuneration committee experience. Higher cost and time pressure, but signals seriousness to institutional shareholders.',
        multiplier: 1.10,
        competencyGates: [],
      },
      {
        id: 'event_01_c',
        label: 'Appoint Chair with commitment to review',
        description: 'Make an interim appointment from the existing board with a public commitment to review the role within six months. Satisfies the minimum requirement but may not impress Meridian.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'event_01_d',
        label: 'Do nothing',
        description: 'Leave the vacancy unfilled and hope the issue fades. Meridian will almost certainly recommend against the board at the AGM.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 10,
    // TODO(content): author 'event_agm_rem_flag' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.5, 2.5], // interpolated
        narrative:
          'Meridian\'s governance note now reads like a love letter - the kind they never send. Institutional confidence is, for once, entirely earned.',
      },
      SUCCESS: {
        svRange: [1.0, 1.5],
        narrative:
          'A credible appointment, quietly made - Meridian withdraws its threat with a terseness that passes for approval in proxy adviser circles.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The appointment satisfies the letter of the requirement, which is another way of saying it satisfies nobody.',
      },
      FAILURE: {
        svRange: [-2, -1],
        narrative:
          'Meridian\'s recommendation against the board arrives with the quiet inevitability of a train you watched leave the station without you.',
      },
      CRITICAL_FAILURE: {
        svRange: [-3, -2], // interpolated
        narrative:
          'The empty Rem Committee chair has become a punchline at governance conferences - the kind that makes Company Secretaries wince and activists smile.',
      },
    },
    isConditional: false,
    precondition: 'remChairVacant',
  },

  // ── EVENT 02 - CFO Poaching Approach ──
  {
    id: 'event_02',
    name: 'CFO Poaching Approach',
    tier: 1,
    quarter: 'Q1',
    turn: 2,
    illustrationType: 'event-cfo-poaching',
    narrativeCard:
      'Priya Sundaram mentioned it almost casually to Marcus Blaine over coffee - a FTSE 100 headhunter, a CFO vacancy, her name at the top of a very short list. She hasn\'t said yes. She hasn\'t said no. What she has said, with characteristic precision, is that she would appreciate the board making her decision easier. Sundaram is the only person the analysts actually believe when she speaks. Losing her now would be like pulling the last load-bearing wall out of a house you\'re still living in.',
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_02_a',
        label: 'Rem Committee recommends retention package',
        description: 'The Rem Committee designs a competitive retention package with deferred equity and enhanced benefits to keep Sundaram committed to Harwick for at least three years.',
        multiplier: 1.10,
        competencyGates: [],
      },
      {
        id: 'event_02_b',
        label: 'Chair engages Sundaram personally',
        description: 'The Chair meets Sundaram directly to understand her motivations, reaffirm the board\'s confidence in her, and discuss her long-term career path at Harwick.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 55 }],
      },
      {
        id: 'event_02_c',
        label: 'Begin quiet succession planning',
        description: 'Accept that Sundaram may leave and begin discreetly identifying internal and external CFO candidates. Minimises disruption if she departs but does nothing to retain her.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'event_02_d',
        label: 'Do nothing',
        description: 'Take no action and wait for Sundaram to make her decision. Risk losing the CFO without a plan in place at the worst possible time.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_cfo_departure' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.0, 2.0], // interpolated
        narrative:
          'Sundaram signs for three more years and tells the FT she turned down the role because Harwick\'s strategy is "too interesting to leave half-finished" - the analysts eat it up.',
      },
      SUCCESS: {
        svRange: [0.5, 1.0],
        narrative:
          'Sundaram stays - quietly, without fanfare, which is exactly how she prefers things and exactly what the market needed.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Sundaram says she\'ll "think about it over the weekend," which in CFO terms means she\'s already made a spreadsheet of pros and cons.',
      },
      FAILURE: {
        svRange: [-1.5, -1.0],
        narrative:
          'Sundaram\'s resignation letter is two sentences long, impeccably professional, and devastating in its timing.',
      },
      CRITICAL_FAILURE: {
        svRange: [-2.5, -1.5], // interpolated
        narrative:
          'Sundaram tells the Sunday Times the board "lacked urgency" - three words that wipe out a quarter\'s worth of careful shareholder management overnight.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 03 - North Sea Safety Incident ──
  {
    id: 'event_03',
    name: 'North Sea Safety Incident',
    tier: 1,
    quarter: 'Q1',
    turn: 3,
    illustrationType: 'event-safety-incident',
    narrativeCard:
      'At 04:17 this morning, a pressure coupling on Harwick\'s Shetland platform failed. Two contractors are in hospital - stable, but one required airlift. The HSE has been notified. No journalists yet, though the union rep has been making calls. The Safety & Environment Committee Chair received the briefing over breakfast and has, to her credit, already cancelled a holiday. What the board does in the next 48 hours will determine whether this is an incident report or a front page.',
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_03_a',
        label: 'S&E Committee leads full incident review',
        description: 'The Safety & Environment Committee takes direct ownership, commissioning a root-cause investigation and briefing the HSE proactively. Demonstrates board-level accountability.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 70 }],
      },
      {
        id: 'event_03_b',
        label: 'Proactive HSE engagement and public statement',
        description: 'Engage the HSE immediately and issue a public statement acknowledging the incident, the injured contractors, and the steps being taken. Transparency over control.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'event_03_c',
        label: 'Legal containment; minimal disclosure',
        description: 'Instruct lawyers to manage the regulatory response. Disclose only what is legally required. Lower risk of self-incrimination but may appear evasive if the story breaks.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'event_03_d',
        label: 'Do nothing beyond statutory reporting',
        description: 'File the statutory report and take no further action. If the HSE escalates or media picks up the story, the board will be caught flat-footed.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'safetyEnvironment',
    committeeBonusValue: 10,
    // TODO(content): author 'event_hse_investigation' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.0, 2.0], // interpolated
        narrative:
          'The HSE inspector who arrived expecting a fight left shaking hands - Harwick\'s response is cited in their next quarterly bulletin as the standard others should meet.',
      },
      SUCCESS: {
        svRange: [0.5, 1.0],
        narrative:
          'The HSE closes its file with a note of satisfaction that somehow reads like a warning not to let it happen again.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The HSE notes "areas for improvement" in the tone of a headmaster who expected better - they\'ll be back in six months to check your homework.',
      },
      FAILURE: {
        svRange: [-3, -2],
        narrative:
          'The BBC runs it at six o\'clock - "Oil Giant Under Investigation" - and suddenly everyone on the board remembers they meant to prioritise safety culture.',
      },
      CRITICAL_FAILURE: {
        svRange: [-4, -3], // interpolated
        narrative:
          'A second coupling fails on the same platform before the investigation report is even drafted - the kind of coincidence that ends careers and invites parliamentary questions.',
      },
    },
    isConditional: false,
    riskFlagTriggerCategories: ['esgSustainability', 'regulatoryLegal'],
    precondition: null,
  },

  // ── EVENT 04 - Greenvale Capital Discloses Its Stake ──
  {
    id: 'event_04',
    name: 'Greenvale Capital Discloses Its Stake',
    tier: 1,
    quarter: 'Q1',
    turn: 4,
    illustrationType: 'event-activist-stake',
    narrativeCard:
      'Greenvale Capital\'s 5.1% filing landed on a Tuesday morning with the subtlety of a brick through a window. Their statement - "governance drift," "constructive engagement" - was the kind of careful language that means exactly the opposite. Your SV ticked up 2% on the speculation, then settled, which is the market\'s way of saying: we\'re watching, and so is everyone else. Your phone hasn\'t stopped.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_04_a',
        label: 'Proactive Chair-to-shareholder meeting',
        description: 'The Chair requests a direct meeting with Greenvale\'s fund manager to understand their concerns and present the board\'s strategic vision. Sets a constructive tone early.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'event_04_b',
        label: 'Issue holding statement; seek legal advice',
        description: 'Release a brief public statement noting the disclosure and engage corporate defence lawyers. Buys time but signals defensiveness to the market.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'event_04_c',
        label: 'Engage SID to lead the engagement',
        description: 'Task the Senior Independent Director with leading the dialogue with Greenvale. Provides a credible, independent voice while keeping the Chair above the fray.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'event_04_d',
        label: 'Do nothing',
        description: 'Ignore the disclosure and wait for Greenvale to make the next move. Risks being seen as complacent and allows the activist to control the narrative.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [
      {
        eventId: 'event_10',
        triggerTiers: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
        delay: 2,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 4.0], // interpolated
        narrative:
          'Greenvale\'s fund manager tells Bloomberg the board showed "refreshing openness" - in activist parlance, this is the equivalent of a standing ovation.',
      },
      SUCCESS: {
        svRange: [2.0, 2.5],
        narrative:
          'Greenvale signals patience - the most dangerous word in an activist\'s vocabulary, but for now it means the guns stay holstered.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0.5],
        narrative:
          'Greenvale remains at the table but their fund manager\'s smile has acquired a certain thinness that the Chair finds unsettling.',
      },
      FAILURE: {
        svRange: [-2, -1],
        narrative:
          'Greenvale\'s lawyers are now billing by the hour, which means the "constructive" phase is definitively over.',
      },
      CRITICAL_FAILURE: {
        svRange: [-3, -2], // interpolated
        narrative:
          'Greenvale publishes a scathing open letter that somehow manages to be more devastating for its restraint - every governance journalist in London has it before lunch.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 05 - Institutional ESG Letter ──
  {
    id: 'event_05',
    name: 'Institutional ESG Letter',
    tier: 2,
    quarter: 'Q2',
    turn: 1,
    illustrationType: 'event-esg-letter',
    narrativeCard:
      'The letter arrived jointly signed - LGIM, Aviva, Brunel Pension Partnership, together holding 18% - and it reads like an ultimatum wearing a dinner jacket. They want a credible net-zero pathway and a dedicated Energy Transition Committee before the AGM, and they have given you thirty days to respond before making the letter public. The coalition\'s lead signatory, you are told, is not bluffing. She never does.',
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_05_a',
        label: 'Commit to forming Energy Transition Committee',
        description: 'Announce the formation of a dedicated board-level Energy Transition Committee with a clear mandate, timeline, and reporting structure. Strongest signal of governance commitment.',
        multiplier: 1.10,
        competencyGates: [],
      },
      {
        id: 'event_05_b',
        label: 'Publish existing net-zero commitment with enhanced metrics',
        description: 'Repackage Harwick\'s existing net-zero targets with more granular milestones and KPIs. Substantive but may be perceived as recycling old commitments.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'event_05_c',
        label: 'Bilateral engagement with lead institution',
        description: 'The Chair meets privately with the coalition\'s lead signatory to negotiate a response that satisfies their concerns without a public commitment. Requires strong stakeholder skills.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'event_05_b',
      },
      {
        id: 'event_05_d',
        label: 'Do nothing',
        description: 'Ignore the letter and hope the coalition does not follow through. If published, the reputational damage will be severe.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'energyTransition',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'event_12',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 2,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.0], // interpolated
        narrative:
          'The coalition\'s lead signatory calls the Chair personally to say "well done" - two words that, from her, carry more weight than most annual reports.',
      },
      SUCCESS: {
        svRange: [1.5, 2.0],
        narrative:
          'The letter stays in its envelope - the coalition is satisfied, or at least satisfied enough to keep their powder dry.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0.5],
        narrative:
          'The coalition acknowledges receipt of your response with the enthusiasm of someone returning a Christmas jumper - technically grateful, visibly unimpressed.',
      },
      FAILURE: {
        svRange: [-3, -2],
        narrative:
          'The letter appears in the FT\'s Monday edition, page three, under the headline "Harwick\'s Climate Silence" - the divestment notices start arriving by Thursday.',
      },
      CRITICAL_FAILURE: {
        svRange: [-4, -3], // interpolated
        narrative:
          'The coalition launches a coordinated public campaign with its own website - the kind of organised institutional anger that makes boards very, very short-lived.',
      },
    },
    isConditional: false,
    // AUDIT: Strategy event_05_a says "Commit to forming Energy Transition Committee" but if the
    // player already established the ETC during board construction the narrative is misleading.
    // This is handled at runtime: getCurrentEvent() in gameStateManager.ts replaces event_05_a with
    // a "Leverage existing ETC" variant whenever state.committees.energyTransition.active is true.
    // The relevantCommittee bonus is therefore always contextually correct - no code change needed.
    precondition: null,
  },

  // ── EVENT 06 - CEO Pay Revolt Brewing ──
  {
    id: 'event_06',
    name: 'CEO Pay Revolt Brewing',
    tier: 2,
    quarter: 'Q2',
    turn: 2,
    illustrationType: 'event-ceo-pay',
    narrativeCard:
      'Someone - HR suspect a disgruntled PA - has leaked Marcus Blaine\'s total compensation to two national papers: £4.1 million, 47 times what the median Harwick employee takes home. Blaine himself seems more annoyed about the leak than the optics, which tells you something about how long he\'s been in the job. The Rem Committee Chair, if you have one, needs to get ahead of this before the AGM say-on-pay vote turns into a public flogging.',
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_06_a',
        label: 'Rem Chair issues proactive statement with context',
        description: 'The Rem Committee Chair gets ahead of the story with a detailed statement explaining the pay structure, performance conditions, and sector benchmarks. Requires credible remuneration expertise.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
      },
      {
        id: 'event_06_b',
        label: 'Commission independent pay benchmarking',
        description: 'Engage an independent pay consultant to produce a peer benchmarking report. Demonstrates willingness to be held accountable but takes time to complete.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'event_06_c',
        label: 'CEO voluntarily defers part of bonus',
        description: 'Negotiate with the CEO to voluntarily defer a portion of his bonus into long-term equity. A visible concession that may defuse the political narrative.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
      },
      {
        id: 'event_06_d',
        label: 'Do nothing',
        description: 'Let the story run and hope it fades before the AGM. Risk that proxy advisors flag the pay vote and institutional shareholders revolt.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 10,
    // TODO(content): author 'event_agm_pay_flag' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.5, 2.5], // interpolated
        narrative:
          'The Rem Chair\'s explanation is so thorough that the Guardian pivots to praising Harwick\'s transparency - a sentence nobody expected to write, least of all the journalist.',
      },
      SUCCESS: {
        svRange: [1.0, 1.5],
        narrative:
          'The story runs once and dies - the say-on-pay vote will pass without the board needing to hold its breath.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The headlines fade but the damage lingers in the proxy advisers\' notes like a stain on a white shirt - visible to anyone who looks.',
      },
      FAILURE: {
        svRange: [-2.5, -1.5],
        narrative:
          'The £4.1m figure trends on social media, proxy advisers recommend voting against, and Marcus Blaine is photographed getting into a car that costs more than most people\'s houses.',
      },
      CRITICAL_FAILURE: {
        svRange: [-3.5, -2.5], // interpolated
        narrative:
          'The pay revolt becomes the story of the AGM season - Harwick\'s name is now shorthand for "board that lost the room."',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 07 - West Africa Operations: Regulatory Change ──
  {
    id: 'event_07',
    name: 'West Africa Operations: Regulatory Change',
    tier: 2,
    quarter: 'Q2',
    turn: 3,
    illustrationType: 'event-west-africa-regulatory',
    narrativeCard:
      'The decree arrived via state television at 9pm local time - 40% of all contracts to domestic firms within eighteen months, or face licence revocation. The Energy Minister gave the announcement the tone of a man who has made up his mind. Harwick\'s country manager rang the Chair at midnight, London time, sounding rather less composed than usual. This is manageable. It is also the kind of thing that has ended the African operations of companies far larger than Harwick.',
    primaryDomain: 'geopoliticalMacro',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_07_a',
        label: 'Deploy geopolitical specialist; engage government directly',
        description: 'A board member with deep geopolitical expertise leads direct engagement with the host government to negotiate a realistic compliance timeline and secure Harwick\'s preferred-operator status.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'geopoliticalMacro', minimumRating: 75 }],
      },
      {
        id: 'event_07_b',
        label: 'Legal review and compliance roadmap',
        description: 'Commission a comprehensive legal review of the new requirements and produce a detailed compliance roadmap with milestones. Credible and methodical but may be seen as slow.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
      },
      {
        id: 'event_07_c',
        label: 'Accelerate local partnerships proactively',
        description: 'Fast-track joint ventures and subcontracting agreements with domestic firms to meet the 40% threshold. Practical but may sacrifice operational quality in the short term.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 65 }],
      },
      {
        id: 'event_07_d',
        label: 'Do nothing and await clarification',
        description: 'Wait for the government to issue detailed implementation guidelines before acting. Risks falling behind competitors and triggering licence compliance warnings.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_licence_revocation' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.5], // interpolated
        narrative:
          'The Energy Minister shakes hands with Harwick\'s Chair for the cameras - "a model partnership," he calls it, while three rival operators quietly begin to panic.',
      },
      SUCCESS: {
        svRange: [1.5, 2.0],
        narrative:
          'The roadmap is accepted without comment, which in this jurisdiction is the highest form of approval.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Harwick is technically compliant, technically on track, and the government\'s monitoring committee is technically satisfied - a lot of "technically" for comfort.',
      },
      FAILURE: {
        svRange: [-4, -3],
        narrative:
          'The formal warning arrives on government letterhead - the kind with the presidential seal that means conversations with lawyers are about to become very expensive.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5, -4], // interpolated
        narrative:
          'Revocation proceedings begin on a Friday afternoon - the country manager is given seventy-two hours to respond, which is not nearly enough time to save a decade of investment.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 08 - Meridian Governance Q2 Report (Proxy Adviser) ──
  {
    id: 'event_08',
    name: 'Meridian Governance Q2 Report',
    tier: 1,
    quarter: 'Q2',
    turn: 4,
    illustrationType: 'event-proxy-adviser-report',
    narrativeCard:
      'Meridian Governance\'s pre-AGM assessment lands in your inbox with the weight of a school report you didn\'t study for. Their headline - "improving but critical gaps remain" - is the proxy adviser equivalent of "could do better." Six weeks to the AGM. Their specific flags are listed below, and every institutional investor on your register has already read them.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.30 },
    ],
    strategies: [],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Meridian\'s report reads like a grudging compliment from someone who expected to write a eulogy instead.',
      },
      SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Progress noted, concerns acknowledged - you have something to show the shareholders that won\'t make them wince.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Meridian\'s tone is the institutional equivalent of a raised eyebrow - not hostile, but not exactly reassuring either.',
      },
      FAILURE: {
        svRange: [0, 0],
        narrative:
          'Meridian\'s flags read like a charge sheet - every unresolved issue laid out with the dispassionate precision of people who do this for a living.',
      },
      CRITICAL_FAILURE: {
        svRange: [0, 0],
        narrative:
          'Meridian recommends against - the two words that turn an AGM from a formality into a battlefield.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 09 - Annual General Meeting ──
  {
    id: 'event_09',
    name: 'Annual General Meeting',
    tier: 2,
    quarter: 'AGM',
    turn: 1,
    illustrationType: 'event-agm',
    narrativeCard:
      'The AGM is this morning. The venue is a conference hotel near Victoria Station that smells faintly of carpet cleaner and institutional anxiety. Three resolutions are contested. Meridian\'s recommendations are already in the hands of every fund manager who matters. Marcus Blaine is wearing his best suit and a smile that doesn\'t quite reach his eyes. The registrar\'s preliminary vote count suggests this will not be straightforward.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'event_09_a',
        label: 'Defend Crane\'s re-election and engage institutions',
        description: 'Actively lobby institutional shareholders to support Crane\'s re-election, making the case for board continuity and governance progress under the current composition.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
      },
      {
        id: 'event_09_b',
        label: 'Let Crane stand down gracefully; focus on other resolutions',
        description: 'Allow Crane to retire from the board voluntarily and concentrate the board\'s political capital on winning the remaining contested resolutions.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'event_09_c',
        label: 'Negotiate with Greenvale on their shareholder resolution',
        description: 'Open direct negotiations with Greenvale to find a compromise on their shareholder resolution before the AGM vote. Requires strategic credibility.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 60 }],
      },
      {
        id: 'event_09_d',
        label: 'Accept all shareholder resolutions to avoid conflict',
        description: 'Capitulate on all three contested resolutions to avoid a public fight. Preserves short-term peace but signals board weakness and emboldens future challengers.',
        multiplier: 0.70,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_post_agm_crisis' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 5], // interpolated
        narrative:
          'All three resolutions pass with margins that make the proxy advisers look foolish for ever doubting - the Chair permits himself a very small smile.',
      },
      SUCCESS: {
        svRange: [1, 3],
        narrative:
          'Clean passes, firm handshakes, and the quiet relief of a board that knows it was closer than the numbers suggest.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, 0],
        narrative:
          'Two pass, one fails - the board survives but the cracks are now visible to anyone with a copy of the voting results, which is everyone.',
      },
      FAILURE: {
        svRange: [-5, -3],
        narrative:
          'One resolution passes; two fail - Greenvale\'s representative is seen making a phone call in the lobby before the results are even read aloud.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7, -5], // interpolated
        narrative:
          'Three defeats - the Chair reads the results to a room that has already started leaving, which is somehow worse than the heckling.',
      },
    },
    isConditional: false,
    // AUDIT: Strategies event_09_a and event_09_b name Geoffrey Crane (dir_08_crane) explicitly.
    // Crane is an inherited board member who could be removed via Forced Change. The AGM resolution
    // logic in AgmScreen.tsx already checks dir_08_crane presence at runtime, so the narrative labels
    // are cosmetically stale when Crane is absent - but no game-breaking logic error results.
    precondition: null,
  },

  // ── EVENT 10 - Greenvale Escalation (conditional) ──
  {
    id: 'event_10',
    name: 'Greenvale Escalation',
    tier: 2,
    quarter: 'Q3',
    turn: 1,
    illustrationType: 'event-greenvale-escalation',
    narrativeCard:
      'Greenvale Capital\'s open letter went live at 7am, timed perfectly to catch the morning research notes. Two board seats. A full strategic review. The CEO removed from capital allocation. The language is measured, forensic, and devastating - the work of people who have done this before and expect to win. The FT is leading with it. By 9am, three of your largest institutional holders have asked for calls with the Chair.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_10_a',
        label: 'Negotiate privately; offer one observer seat',
        description: 'Open a private channel with Greenvale and offer one non-voting observer seat on the board as a compromise. De-escalates the confrontation while maintaining board control.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'event_10_b',
        label: 'Reject publicly with a strong governance narrative',
        description: 'Issue a detailed public rebuttal making the case that the current board is delivering value and governance improvements. High risk, high reward - requires genuine credibility.',
        multiplier: 1.40,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 70 },
          { domain: 'strategyMarkets', minimumRating: 65 },
        ],
      },
      {
        id: 'event_10_c',
        label: 'Commission independent strategic review',
        description: 'Appoint an independent adviser to review Harwick\'s strategy and capital allocation. Shows willingness to listen without conceding board seats.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'event_10_d',
        label: 'Do nothing',
        description: 'Ignore Greenvale\'s open letter and let the market judge. Risks being seen as arrogant and out of touch with shareholders.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [
      {
        eventId: 'event_15',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 1,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 5], // interpolated
        narrative:
          'Greenvale withdraws its demands with a press release so gracious it almost hides the surprise - the board\'s defence was, it turns out, rather better than anyone expected.',
      },
      SUCCESS: {
        svRange: [2, 3],
        narrative:
          'Greenvale accepts an observer seat - the diplomatic equivalent of putting the gun on the table but agreeing not to pick it up.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-1, 0],
        narrative:
          'Neither side blinks - the standoff continues with the polite menace of two chess players who both know the endgame but refuse to play it.',
      },
      FAILURE: {
        svRange: [-5, -3],
        narrative:
          'Greenvale\'s fund manager is having lunches with your top twenty shareholders - the kind of lunches where nobody orders dessert because the conversation is the main course.',
      },
      CRITICAL_FAILURE: {
        svRange: [-8, -5], // interpolated
        narrative:
          'The EGM requisition lands on the Company Secretary\'s desk like a declaration of war written in legalese - the share price drops 8% before lunch.',
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if Event 04 was Partial Success or below',
    // AUDIT: Added precondition to guard against firing if event_04 was resolved well enough that
    // Greenvale has no remaining grievance. checkEventCondition() already enforces the outcome check,
    // but the precondition provides an explicit board-state gate in checkEventPrecondition().
    precondition: 'harwick_greenvale_active',
  },

  // ── EVENT 11 - CEO Misconduct Rumour ──
  {
    id: 'event_11',
    name: 'CEO Misconduct Rumour',
    tier: 2,
    quarter: 'Q3',
    turn: 2,
    illustrationType: 'event-ceo-misconduct',
    narrativeCard:
      'The tip reached a financial journalist at the Mail on Sunday - Marcus Blaine and the Chief People Officer, allegedly rather closer than the organisational chart suggests. Both deny it with the sort of emphatic brevity that makes lawyers comfortable and everyone else suspicious. Blaine\'s solicitor has already rung the editor. The story hasn\'t run yet, but three board members have received calls asking for "background comment," which is Fleet Street for "we\'re publishing this one way or another."',
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_11_a',
        label: 'Chair commissions independent HR investigation',
        description: 'The Chair engages an external law firm to investigate the allegation thoroughly and independently. Gold standard governance response but creates a paper trail.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
      },
      {
        id: 'event_11_b',
        label: 'SID issues statement of board confidence in CEO',
        description: 'The Senior Independent Director issues a public statement backing the CEO while the board assesses the situation. Buys time and controls the narrative if handled credibly.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'event_11_c',
        label: 'Chair meets CEO and CPO privately; internal management',
        description: 'The Chair addresses the matter privately with both executives, seeking facts and managing the situation internally without formal investigation. Discreet but may look like a cover-up.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
      },
      {
        id: 'event_11_d',
        label: 'Do nothing',
        description: 'Ignore the rumour and hope it does not surface publicly. If the story breaks, the board will have no prepared response.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_media_leak' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1, 2], // interpolated
        narrative:
          'The external investigators find nothing - and more importantly, the process was so thorough that even the journalist admits there\'s no story left to tell.',
      },
      SUCCESS: {
        svRange: [0.5, 1.0],
        narrative:
          'The story dies quietly - the journalist moves on to easier targets, and the board agrees never to speak of the matter again.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The rumour circulates at executive level with the persistence of a bad smell in a lift - contained, but everyone knows it\'s there.',
      },
      FAILURE: {
        svRange: [-4, -2],
        narrative:
          'The Mail on Sunday runs it with a photograph - not incriminating, but suggestive enough that every Monday morning meeting in the City starts with the same conversation.',
      },
      CRITICAL_FAILURE: {
        svRange: [-6, -4], // interpolated
        narrative:
          'It\'s on the front page of three papers and trending by lunchtime - the institutional shareholders aren\'t asking about governance any more, they\'re asking about the CEO\'s departure date.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 12 - Energy Transition: Institutional Ultimatum ──
  {
    id: 'event_12',
    name: 'Energy Transition: Institutional Ultimatum',
    tier: 2,
    quarter: 'Q3',
    turn: 3,
    illustrationType: 'event-energy-transition',
    narrativeCard:
      'LGIM\'s letter arrived by recorded delivery, which tells you everything about how seriously they mean it. Without a credible, quantified net-zero plan published before year-end, they will vote against the Chair\'s re-election and divest their 6.4% stake. The letter says "confidential" at the top, but LGIM\'s proxy voting team has already briefed the stewardship community - a contradiction so deliberate it barely qualifies as one. The Chair has until December. LGIM has been waiting since March.',
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_12_a',
        label: 'Publish accelerated net-zero pathway with targets',
        description: 'Release a comprehensive, quantified net-zero plan with interim targets, capital allocation commitments, and third-party verification. The strongest possible response but demands deep ESG expertise.',
        multiplier: 1.40,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 80 }],
      },
      {
        id: 'event_12_b',
        label: 'Meet LGIM; negotiate interim commitments',
        description: 'The Chair meets LGIM\'s stewardship team directly to negotiate mutually acceptable interim milestones and reporting commitments. Buys time while showing good faith.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'event_12_c',
        label: 'Announce formation of Energy Transition Committee (if not yet done)',
        description: 'Announce a new board-level Energy Transition Committee as evidence of structural governance commitment. Meaningful if the committee is new; less impactful if already established.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 60 }],
      },
      {
        id: 'event_12_d',
        label: 'Do nothing',
        description: 'Decline to respond to LGIM\'s ultimatum. Almost certainly triggers divestment and public campaigning against the Chair.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'energyTransition',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 6], // interpolated
        narrative:
          'LGIM\'s head of stewardship calls the plan "genuinely impressive" - and then, almost as an afterthought, increases their stake by 2%, which says rather more.',
      },
      SUCCESS: {
        svRange: [3, 4],
        narrative:
          'LGIM withdraws its threat with a letter exactly as formal as the one that started this - the Chair\'s position is secure, for now.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0.5, 1.0],
        narrative:
          'LGIM acknowledges "directional progress" - the stewardship equivalent of marking an exam paper as "needs improvement but we won\'t fail you yet."',
      },
      FAILURE: {
        svRange: [-4, -2],
        narrative:
          'LGIM\'s divestment announcement triggers a domino effect - by Friday, three more ESG-mandated funds have filed exit notices.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5, -4],
        narrative:
          'LGIM sells their entire position in a single block trade and names Harwick\'s Chair personally in their annual stewardship report - a first, and not the kind anyone wants.',
      },
    },
    isConditional: false,
    // AUDIT: Strategy event_12_c already qualifies itself with "(if not yet done)" in the label,
    // and getCurrentEvent() in gameStateManager.ts replaces it with a "Leverage existing ETC"
    // variant when state.committees.energyTransition.active is true - so no code change needed.
    precondition: null,
  },

  // ── EVENT 13 - Hostile Bid Approach ──
  {
    id: 'event_13',
    name: 'Hostile Bid Approach',
    tier: 3,
    quarter: 'Q4',
    turn: 1,
    illustrationType: 'event-hostile-bid',
    narrativeCard:
      'Kestrel Petroleum\'s approach arrived via their corporate broker at 6pm on a Friday - the timing deliberate, the 12% premium calculated to sound generous to anyone who hasn\'t read Harwick\'s reserve reports. The letter proposes a "merger of equals," which in the E&P sector means the larger company swallows the smaller one and calls it partnership. The board has fourteen days before Kestrel goes to the market. Marcus Blaine, to his credit, has not panicked. He has, however, cancelled his weekend.',
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_13_a',
        label: 'Reject and mount an independent valuation defence',
        description: 'Formally reject the offer and commission an independent valuation to demonstrate Harwick is worth significantly more. Requires deep financial and strategic expertise to be credible.',
        multiplier: 1.40,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 80 },
          { domain: 'financialOversight', minimumRating: 70 },
        ],
      },
      {
        id: 'event_13_b',
        label: 'Engage with Kestrel; negotiate better terms',
        description: 'Enter negotiations with Kestrel to extract a significantly higher premium and better terms for shareholders. Keeps the door open while protecting value.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 65 }],
      },
      {
        id: 'event_13_c',
        label: 'Seek a white knight (alternative bidder)',
        description: 'Approach potential alternative acquirers - potentially an international energy company - to create a competing bid and drive up the price. Complex and requires global networks.',
        multiplier: 1.30,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 70 },
          { domain: 'geopoliticalMacro', minimumRating: 60 },
        ],
      },
      {
        id: 'event_13_d',
        label: 'Do nothing / accept the offer',
        description: 'Allow the offer to proceed without resistance. Shareholders receive the 12% premium but the board is seen as having failed to defend fair value.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_hostile_bid_public' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [12, 20], // interpolated
        narrative:
          'Kestrel withdraws with a terse statement about "changed market conditions" - everyone knows they were outmanoeuvred, and the market reprices Harwick accordingly.',
      },
      SUCCESS: {
        svRange: [8, 12],
        narrative:
          'The board holds its nerve and the terms improve materially - the kind of outcome that gets studied in business schools and quietly celebrated in boardrooms.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 4], // interpolated
        narrative:
          'The negotiations enter their third week with no resolution - the uncertainty is costing more per day than most people earn in a year.',
      },
      FAILURE: {
        svRange: [-8, -4],
        narrative:
          'Kestrel goes hostile with a full-page ad in the FT - "A Fair Offer Deserves a Fair Hearing" - and your largest shareholders start returning their calls.',
      },
      CRITICAL_FAILURE: {
        svRange: [-12, -8], // interpolated
        narrative:
          'The defence folds like wet cardboard - shareholders accept Kestrel\'s terms at a discount everyone will regret in eighteen months, except Kestrel.',
      },
    },
    isConditional: false,
    conditionDescription: 'Probability increases if SV < 90 and Greenvale is active',
    precondition: null,
  },

  // ── EVENT 14 - Cyber Attack on Offshore Infrastructure ──
  {
    id: 'event_14',
    name: 'Cyber Attack on Offshore Infrastructure',
    tier: 2,
    quarter: 'Q4',
    turn: 2,
    illustrationType: 'event-cyber-attack',
    narrativeCard:
      'The screens went dark at 02:30 GMT. By the time the overnight operations manager understood what was happening, two platforms were locked out and a ransom note - professional, almost courteous in its formatting - was demanding £4 million in cryptocurrency. Production is suspended. The NCSC has been notified and is, in their words, "aware of the situation," which means they are deciding how worried to be. The analysts will notice the production halt by market open. You have roughly four hours of silence left.',
    primaryDomain: 'technologyDigital',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_14_a',
        label: 'Cyber specialist leads incident response; no payment',
        description: 'A director with cyber/technology expertise leads the incident response team, coordinates with the NCSC, and works to restore systems without paying the ransom. Best long-term outcome.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'technologyDigital', minimumRating: 80 }],
      },
      {
        id: 'event_14_b',
        label: 'Pay ransom quietly; restore operations',
        description: 'Pay the £4m ransom discreetly through legal channels to restore operations immediately. Faster recovery but sets a dangerous precedent and risks regulatory scrutiny if disclosed.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'event_14_c',
        label: 'Brief analysts proactively; manage reputationally',
        description: 'Get ahead of the story by briefing analysts and key shareholders directly on the operational impact, expected recovery timeline, and cyber investment plans.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'event_14_d',
        label: 'Do nothing',
        description: 'Take no coordinated board-level action. Operational teams handle it alone while the board watches. Risks prolonged outages and reputational damage.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    // TODO(content): author 'event_regulatory_investigation_ncsc' before re-adding the trigger
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1, 3], // interpolated
        narrative:
          'The NCSC writes up Harwick\'s response as a case study in their next bulletin - the analysts who downgraded you last month have quietly reversed their calls.',
      },
      SUCCESS: {
        svRange: [0.5, 1.0],
        narrative:
          'Systems restored, ransom unpaid, and the NCSC sends a commendation that the comms team wisely doesn\'t publicise - no need to advertise you were a target.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-1, 0],
        narrative:
          'Production restarts three days late, which is long enough for every analyst on the sector to have written a note questioning Harwick\'s digital resilience.',
      },
      FAILURE: {
        svRange: [-5, -3],
        narrative:
          'Two weeks of outages, a formal NCSC inquiry, and three analyst downgrades - the board learns the hard way that "cyber" was never just an IT problem.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7, -5], // interpolated
        narrative:
          'The attackers publish Harwick\'s operational data on a leak site before breakfast - the share price craters and the NCSC\'s tone shifts from "supportive" to "investigatory."',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── EVENT 15 - Full Proxy Battle (conditional) ──
  {
    id: 'event_15',
    name: 'Full Proxy Battle',
    tier: 3,
    quarter: 'Q4',
    turn: 3,
    illustrationType: 'event-proxy-battle',
    narrativeCard:
      'It\'s finally here. Greenvale Capital has filed EGM requisitions to remove the Chair and two NEDs - names printed in black and white on Companies House filings that half the City has already downloaded. Their replacement nominees are serious people: a former FTSE 100 chair, a well-known energy analyst, a governance specialist who has done this twice before. Sterling Proxy\'s preliminary note supports Greenvale on two of three demands. The patient, smart activists have stopped being patient.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'event_15_a',
        label: 'Institutional roadshow; make the governance case',
        description: 'The Chair and SID embark on an intensive roadshow meeting the top 20 institutional shareholders to make the case for board continuity and against Greenvale\'s nominees.',
        multiplier: 1.40,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'event_15_b',
        label: 'Negotiate with Greenvale directly; offer two of three demands',
        description: 'Open settlement talks with Greenvale, conceding on two of their three demands to avoid the EGM. Pragmatic but may look like capitulation under pressure.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 65 },
          { domain: 'strategyMarkets', minimumRating: 60 },
        ],
      },
      {
        id: 'event_15_c',
        label: 'Seek support from largest friendly institutional shareholders',
        description: 'Privately rally support from Harwick\'s largest long-term shareholders - pension funds, sovereign wealth funds - to build a blocking coalition against Greenvale\'s resolutions.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'event_15_d',
        label: 'Do nothing',
        description: 'Accept the EGM and let shareholders decide without a coordinated defence. The board will almost certainly lose control.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [5, 8], // interpolated
        narrative:
          'Greenvale concedes before the vote is even counted - the institutional roadshow was so convincing that their own proxy solicitor advised them to stand down.',
      },
      SUCCESS: {
        svRange: [3, 5],
        narrative:
          'A settlement is reached at 11pm the night before the EGM - minor concessions, board control preserved, and a bar tab that nobody will ever expense.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-3, -1],
        narrative:
          'The board survives by a margin thin enough to be embarrassing - Greenvale\'s fund manager is already drafting next year\'s campaign in the taxi home.',
      },
      FAILURE: {
        svRange: [-12, -8],
        narrative:
          'The vote isn\'t close - the Chair clears his desk by Friday, and the two departing NEDs don\'t even get a proper goodbye from the Company Secretary.',
      },
      CRITICAL_FAILURE: {
        svRange: [-20, -12],
        narrative:
          'Greenvale\'s nominees take their seats before the ink is dry on the EGM minutes - the board you built is gone, replaced by strangers who smile like they own the place, because they do.',
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires only if governance health < 50 AND Greenvale is still active',
    // AUDIT: Added precondition to enforce board-state check: event_10 must have resolved as FAILURE
    // or CRITICAL_FAILURE AND governance health must be below 50. checkEventCondition() handles the
    // GH + event_10 outcome test; the precondition provides the same guard via checkEventPrecondition().
    precondition: 'harwick_proxy_battle',
  },

  // ── Vantage Consumer Brands events ──
  ...vantageEvents,

  // ── Rheinfeld AG events ──
  ...rheinfeldEvents,

  // ── Meridian Foundation events ──
  ...meridianEvents,

  // ── Straits Financial Group events ──
  ...sfgEvents,
];
