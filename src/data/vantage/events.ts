import type { GameEvent } from '@/types/game';

export const vantageEvents: GameEvent[] = [
  // ══════════════════════════════════════════════════════════
  // Q1 EVENTS (Tier 1 — immediate governance problems)
  // ══════════════════════════════════════════════════════════

  // V-01 — Patricia Nguyen: Conflict of Interest
  {
    id: 'vevent_01',
    name: 'Patricia Nguyen: Conflict of Interest',
    tier: 1,
    quarter: 'Q1',
    turn: 1,
    illustrationType: 'vevent-nguyen-conflict',
    narrativeCard:
      'Meridian Governance just hand-delivered a letter to your Lead Independent Director that reads like a litigation threat wrapped in polite stationery. Patricia Nguyen\'s $340K consulting contract with a Vantage supplier — somehow never disclosed to the full board — has been flagged as a material conflict. Meridian wants her out of the Audit Committee Chair before Q2, or they\'ll recommend against her election at the AGM. The letter was cc\'d to the SEC. That part wasn\'t polite at all.',
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_01_a',
        label: 'Remove Nguyen from Audit Chair immediately',
        description:
          'Remove Patricia Nguyen from the Audit Committee Chair and appoint a qualified replacement. Requires a director with Financial Oversight ≥ 75 in the deployed team. Clean and decisive.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 75 }],
      },
      {
        id: 'vevent_01_b',
        label: 'Negotiate timeline with Meridian',
        description:
          'Commit to change before AGM but buy one quarter. Requires Regulatory & Legal ≥ 65 in deployed team. Moderate risk — Meridian may not accept.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'vevent_01_c',
        label: 'Retain Nguyen; argue conflict is immaterial',
        description:
          'Argue the consulting contract is immaterial and Nguyen should remain. High risk. Proxy advisers will escalate.',
        multiplier: 0.60,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'vevent_01_d',
        label: 'Do nothing',
        description:
          'Meridian publishes their recommendation. AGM rebellion risk increases by +40%.',
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.0],
        narrative:
          'Nguyen\'s replacement was announced before the close — Meridian issued a public statement calling it "a model of governance accountability," and two index funds quietly increased their positions overnight.',
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          'A credible replacement is named and Meridian stands down — not thrilled, but satisfied enough to pocket the letter.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Meridian accepts the timeline but makes it clear they\'ll be watching like a parole officer through the AGM.',
      },
      FAILURE: {
        svRange: [-3.0, -2.0],
        narrative:
          'Meridian publishes a "recommend against" on the Audit Committee and the governance health score drops by 8 — the kind of wound that festers.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -4.0],
        narrative:
          'The SEC sends its own letter. Institutional shareholders demand a full board review. Patricia Nguyen\'s consulting contract is now Exhibit A in every governance short thesis on the Street.',
      },
    },
    isConditional: false,
    // AUDIT: vevent_01 names Patricia Nguyen directly; guard against her not being on the board
    // (vdir_02_nguyen is an inherited member the player could drop during board construction).
    precondition: 'vantage_nguyen_on_board',
  },

  // V-02 — Activist Disclosure: Apex Capital Takes 5.3%
  {
    id: 'vevent_02',
    name: 'Activist Disclosure: Apex Capital Takes 5.3%',
    tier: 1,
    quarter: 'Q1',
    turn: 2,
    illustrationType: 'vevent-activist-disclosure',
    narrativeCard:
      'Apex Capital\'s 13D dropped at market open like a perfectly timed grenade — 5.3%, "governance-impaired," and a request for a meeting with the Lead Independent Director within 30 days that wasn\'t really a request. Their letter uses the phrase "destroying shareholder value" twice in three paragraphs and names the combined Chair/CEO structure specifically. Marcus Adler at Apex didn\'t get to $14 billion AUM by making idle threats.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_02_a',
        label: 'LID meets Apex immediately; engage constructively',
        description:
          'The Lead Independent Director meets Apex within the requested timeframe. Proactive engagement signals governance seriousness.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
      },
      {
        id: 'vevent_02_b',
        label: 'Issue holding statement; seek legal advice',
        description:
          'Buy time with a corporate statement while seeking legal counsel on defensive options. Standard playbook.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 55 }],
      },
      {
        id: 'vevent_02_c',
        label: 'Proactively announce governance review',
        description:
          'Announce a board-led governance review including the Chair/CEO structure. Bold move that signals the board takes the activist seriously.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'vevent_02_d',
        label: 'Do nothing',
        description:
          'Apex will escalate. The \'Apex Escalation\' event fires in Q3 as Tier 2 guaranteed.',
        multiplier: 0.35,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [
      {
        eventId: 'vevent_10',
        triggerTiers: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3.0, 4.0],
        narrative:
          'Apex puts out a statement calling the engagement "refreshingly productive" — on Wall Street, that\'s practically a love letter — and the stock ticks up 3% on the détente.',
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          'Apex goes quiet, which in activist circles means you bought yourself exactly one quarter of breathing room.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0.5, 0.5],
        narrative:
          'The response checked a box but moved no needles — Apex is still loading ammunition and everyone on the buy side knows it.',
      },
      FAILURE: {
        svRange: [-2.0, -2.0],
        narrative:
          'Apex\'s head of campaigns just updated his LinkedIn title to "Vantage Project Lead" — so that\'s where things stand.',
      },
      CRITICAL_FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'Apex published a six-page open letter before the board even drafted a response — Bloomberg led with it at 6 AM, and by noon every institutional holder had a copy on their desk.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-03 — CEO Compensation: Say-on-Pay Pre-Warning
  {
    id: 'vevent_03',
    name: 'CEO Compensation: Say-on-Pay Pre-Warning',
    tier: 1,
    quarter: 'Q1',
    turn: 3,
    illustrationType: 'vevent-ceo-pay-revolt',
    narrativeCard:
      'Someone leaked Sandra Okafor\'s comp package to the Wall Street Journal, and the headline writes itself: "$14.2 Million — 187x Median Employee Pay." The story runs above the fold in the business section with a photo of Vantage\'s headquarters that makes it look like a fortress. Sandra is furious — not about the scrutiny, but about the leak. Your Comp Committee Chair has six weeks before the AGM to turn this from a scandal into a story about pay-for-performance, and right now the math isn\'t cooperating.',
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_03_a',
        label: 'Comp Chair briefs institutional shareholders',
        description:
          'The Compensation Committee Chair proactively briefs institutional shareholders with context and benchmarks. Turns the narrative with data.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
      },
      {
        id: 'vevent_03_b',
        label: 'Commission independent pay benchmarking study',
        description:
          'Defend with process. Commission an external review of executive pay against peer benchmarks. Costs one turn.',
        multiplier: 0.85,
        competencyGates: [],
      },
      {
        id: 'vevent_03_c',
        label: 'CEO voluntarily caps bonus for current year',
        description:
          'Sandra Okafor agrees to cap her bonus for the current year. Symbolic but effective if delivered credibly.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
      },
      {
        id: 'vevent_03_d',
        label: 'Do nothing',
        description:
          'Say-on-pay failure at AGM becomes near-certain. Governance health -10.',
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.5, 2.5],
        narrative:
          'The Comp Chair\'s investor roadshow lands perfectly — BlackRock\'s governance team calls the pay structure "aligned and defensible," and ISS quietly removes the flag.',
      },
      SUCCESS: {
        svRange: [1.0, 1.5],
        narrative:
          'The benchmarking data takes the edge off — say-on-pay isn\'t a layup anymore, but it\'s no longer a crisis either.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The fire\'s contained but still smoldering — ISS keeps its flag and the AGM vote is a coin flip.',
      },
      FAILURE: {
        svRange: [-2.0, -2.0],
        narrative:
          'ISS recommends against the Comp Committee Chair by name, and the say-on-pay rebellion has officially found its rallying cry.',
      },
      CRITICAL_FAILURE: {
        svRange: [-3.5, -3.5],
        narrative:
          'The story runs for a second week — this time with an employee quote about cafeteria prices — and three proxy advisers pile on before the weekend.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-04 — FDA Inquiry: Ultra-Processed Food Labelling
  {
    id: 'vevent_04',
    name: 'FDA Inquiry: Ultra-Processed Food Labelling',
    tier: 1,
    quarter: 'Q1',
    turn: 4,
    illustrationType: 'vevent-fda-inquiry',
    narrativeCard:
      'A thick envelope from the FDA arrived at General Counsel\'s office on Tuesday — the kind nobody wants to open. Inside: a formal inquiry letter requesting detailed nutritional labelling documentation for three Vantage product lines under the new proposed UPF disclosure rules. It\'s not an investigation yet. It\'s the FDA politely explaining what an investigation looks like, in case you\'d prefer to avoid one. The response deadline is 45 days, and the clock started when the envelope was signed for.',
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'esgSustainability', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_04_a',
        label: 'Regulatory specialist leads proactive FDA engagement',
        description:
          'Get ahead of the issue before it escalates. Requires Regulatory & Legal ≥ 75 in deployed team.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
      },
      {
        id: 'vevent_04_b',
        label: 'Legal review and compliant response',
        description:
          'Standard legal response within the deadline. Regulatory & Legal ≥ 55. Safe floor outcome.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 55 }],
      },
      {
        id: 'vevent_04_c',
        label: 'Accelerate product reformulation and inform FDA',
        description:
          'Long-term strategic play: begin reformulating products and proactively inform the FDA. ESG ≥ 70 required.',
        multiplier: 1.05,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 70 }],
      },
      {
        id: 'vevent_04_d',
        label: 'Do nothing',
        description:
          'Minimal response; wait and see. Risk: inquiry escalates to formal investigation in Q3.',
        multiplier: 0.35,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'energyTransition', // maps to Consumer Affairs & Regulatory for Vantage
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'The FDA closes the inquiry with a note praising Vantage\'s "proactive and transparent" cooperation — two words that have never appeared in an FDA letter to a food company before, according to your outside counsel.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'A clean, compliant response keeps the inquiry in the "routine" pile — no escalation, no headlines, no follow-up calls.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The FDA wants more documentation on two of the three product lines — not a disaster, but the inquiry now has a second chapter.',
      },
      FAILURE: {
        svRange: [-2.5, -2.5],
        narrative:
          'The inquiry escalates to a formal investigation, and the words "Vantage" and "FDA probe" appear in the same Reuters wire for the first time.',
      },
      CRITICAL_FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The FDA announces a formal investigation live on its website — the stock drops 4% before your IR team can draft a holding statement, and consumer confidence craters ahead of earnings.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // Q2 EVENTS (Tier 1–2 — pressure builds)
  // ══════════════════════════════════════════════════════════

  // V-05 — Chair/CEO Split: Institutional Shareholder Letter
  {
    id: 'vevent_05',
    name: 'Chair/CEO Split: Institutional Shareholder Letter',
    tier: 2,
    quarter: 'Q2',
    turn: 1,
    illustrationType: 'vevent-chair-ceo-split',
    narrativeCard:
      'Three of the biggest index funds on the planet — collectively holding 22% of Vantage — just sent your Lead Independent Director a letter that reads like an ultimatum in business-casual. They want a binding commitment to separate the Chair and CEO roles within 18 months. The letter is marked "confidential" but everyone knows that in proxy season, confidential means "hasn\'t been leaked yet." Sandra Okafor read the letter twice, said nothing, and closed her office door. That\'s never good.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_05_a',
        label: 'LID publicly commits to Chair/CEO separation timeline',
        description:
          'Bold governance move. Requires LID with Stakeholder ≥ 70. High upside, risks CEO confrontation.',
        multiplier: 1.15,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'vevent_05_b',
        label: 'Establish independent board review; defer to process',
        description:
          'Buys time. Moderate risk. People & Culture ≥ 60 in deployed team.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
      },
      {
        id: 'vevent_05_c',
        label: 'Meet institutions privately; negotiate 24-month transition',
        description:
          'Pragmatic middle ground. Requires Stakeholder ≥ 65.',
        multiplier: 0.95,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
      },
      {
        id: 'vevent_05_d',
        label: 'Reject the request; defend combined structure',
        description:
          'High risk. Only viable if governance health > 65 and Stakeholder ≥ 80 in deployed team.',
        multiplier: 0.50,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 80 }],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 5.0],
        narrative:
          'The separation announcement lands like a thunderclap of good governance — proxy advisers upgrade, the coalition sends a thank-you note, and the stock catches a bid it hasn\'t seen in two quarters.',
      },
      SUCCESS: {
        svRange: [2.0, 3.5],
        narrative:
          'A credible timeline with real milestones — the institutions aren\'t celebrating, but they\'re putting the pitchforks down.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0.5, 0.5],
        narrative:
          'The review process is launched but the coalition isn\'t buying what they consider a stall tactic dressed up in committee language.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'The rejection letter leaks to the Financial Times by Thursday, and now 22% of your shareholder base is publicly questioning whether this board can govern itself.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'The coalition goes nuclear — a joint public statement, a press conference, and Apex Capital tweets the letter with the caption "We told you so."',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-06 — Supply Chain Scandal: Child Labour Allegations
  {
    id: 'vevent_06',
    name: 'Supply Chain Scandal: Child Labour Allegations',
    tier: 2,
    quarter: 'Q2',
    turn: 2,
    illustrationType: 'vevent-supply-chain-scandal',
    narrativeCard:
      'An NGO called FairHarvest Alliance just published a 47-page report with satellite imagery and payroll records alleging that a key Vantage cocoa supplier in Cote d\'Ivoire uses child labour on its farms. CNN ran it at the top of the hour. The New York Times has it above the fold online with a photo that will haunt your brand team\'s nightmares. By 3 PM, #BoycottVantage has 200,000 tweets and your VP of Communications has called the boardroom twice asking who\'s authorized to speak.',
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_06_a',
        label: 'Immediate independent supply chain audit; suspend supplier',
        description:
          'Decisive and credible. High short-term cost, strong long-term outcome. Requires ESG ≥ 75 in deployed team.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 75 }],
      },
      {
        id: 'vevent_06_b',
        label: 'Issue statement; begin internal review',
        description:
          'Standard response. Requires Stakeholder ≥ 60. Moderate risk — may be seen as insufficient.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'vevent_06_c',
        label: 'Engage NGO directly; co-design remediation',
        description:
          'Innovative approach. High credibility if genuine. Requires ESG ≥ 65 and Stakeholder ≥ 60.',
        multiplier: 1.05,
        competencyGates: [
          { domain: 'esgSustainability', minimumRating: 65 },
          { domain: 'stakeholderComms', minimumRating: 60 },
        ],
      },
      {
        id: 'vevent_06_d',
        label: 'Legal response; dispute the report',
        description:
          'High risk. If allegations are substantiated, catastrophic reputational damage.',
        multiplier: 0.45,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'safetyEnvironment', // maps to Brand & Reputation for Vantage
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 2.5],
        narrative:
          'FairHarvest Alliance calls Vantage\'s response "unprecedented in the industry" — the supplier is terminated, a new sourcing program is announced, and the boycott hashtag dies within 72 hours, replaced by grudging respect.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The supplier is suspended, the audit is underway, and CNN runs a follow-up that makes you look responsive rather than guilty.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, -0.5],
        narrative:
          'The statement buys time but ethically-conscious consumers have long memories, and Whole Foods just moved your products to a less prominent shelf.',
      },
      FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'The boycott goes mainstream — Target and Walmart temporarily pull select Vantage products, and your head of sales just described the retail calls as "apocalyptic."',
      },
      CRITICAL_FAILURE: {
        svRange: [-8.0, -8.0],
        narrative:
          'A Congressional subcommittee announces hearings on supply chain labour practices with Vantage as the lead case study — class action lawyers are already circling, and your D&O insurer wants a call.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-07 — New UPF Tax Proposed in California
  {
    id: 'vevent_07',
    name: 'New UPF Tax Proposed in California',
    tier: 2,
    quarter: 'Q2',
    turn: 3,
    illustrationType: 'vevent-upf-tax',
    narrativeCard:
      'Sacramento just dropped a bomb on the FMCG sector: Assembly Bill 1847, a 12% excise tax on ultra-processed foods. The bill\'s sponsor went on MSNBC and named Vantage specifically — twice. Your CFO ran the numbers by lunch: 34% of US revenue is exposed. By market close, three analysts had cut their target price by 6%, and the words "structural headwind" appeared in every note. Illinois, New York, and Colorado are reportedly drafting copycat legislation. Welcome to the new regulatory reality.',
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'esgSustainability', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_07_a',
        label: 'Lobby Sacramento aggressively via industry coalition',
        description:
          'High multiplier. Risk of backfire if lobbying is perceived as anti-health. Requires Regulatory & Legal ≥ 70.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
      },
      {
        id: 'vevent_07_b',
        label: 'Accelerate product reformulation; position ahead of regulation',
        description:
          'Long-term strategic play. Short-term margin cost. Requires ESG ≥ 70.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 70 }],
      },
      {
        id: 'vevent_07_c',
        label: 'Divest UPF product lines; accelerate health portfolio',
        description:
          'Radical. High risk/reward. Only available if Strategy ≥ 80 in deployed team.',
        multiplier: 1.20,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 80 }],
      },
      {
        id: 'vevent_07_d',
        label: 'Accept and model pass-through to consumers',
        description:
          'Defensive. Lowest downside. No upside.',
        multiplier: 0.60,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'energyTransition', // maps to Consumer Affairs & Regulatory for Vantage
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 6.0],
        narrative:
          'The Street loves a pivot story, and you just delivered one — analysts upgrade the stock on the health portfolio thesis, and a Goldman note calls Vantage "the only FMCG name positioned for the regulatory shift."',
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          'The strategy is credible enough to walk back the downgrades — sell-side moves from "sell" to "hold," which on Wall Street counts as optimism.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The market shrugs and waits for the Sacramento vote — you\'re in purgatory, and the algos are pricing in uncertainty.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'The downgrades stick, two more states table similar bills by Friday, and your 34% revenue exposure just became the number every short seller leads with.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'Your Sacramento lobbying gets leaked to the LA Times under the headline "Big Food Fights Back Against Health" — the brand takes collateral damage that makes the tax look like the smaller problem.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-08 — Meridian Governance Q2 Report (report card — auto-resolve)
  {
    id: 'vevent_08',
    name: 'Meridian Governance Q2 Report',
    tier: 1,
    quarter: 'Q2',
    turn: 4,
    illustrationType: 'vevent-proxy-adviser-report',
    narrativeCard:
      'Meridian Governance just published their pre-AGM assessment, and the headline is a masterclass in polite devastation: "Governance Remains Structurally Compromised." They single out the combined Chair/CEO role as "the defining concern" — underlined, bolded, the governance equivalent of a neon sign. Every institutional holder on your register will have this on their desk by morning, and the specific flags are generated from your board state. Think of it as a report card written by someone who already decided you\'re failing.',
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
        narrative: 'Meridian notes improvements — your AGM prep just got marginally less painful.',
      },
      SUCCESS: {
        svRange: [0, 0],
        narrative: 'The report is mixed but survivable — governance flags will shape the AGM conversation.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative: 'Multiple flags raised — the AGM is going to be a knife fight and Meridian just handed out the knives.',
      },
      FAILURE: {
        svRange: [0, 0],
        narrative: 'Severe governance concerns across the board — institutional holders are now war-gaming their AGM votes.',
      },
      CRITICAL_FAILURE: {
        svRange: [0, 0],
        narrative: 'Meridian recommends voting against the entire slate — the governance equivalent of a no-confidence motion.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // AGM EVENT
  // ══════════════════════════════════════════════════════════

  // V-09 — Annual General Meeting
  {
    id: 'vevent_09',
    name: 'Annual General Meeting',
    tier: 2,
    quarter: 'AGM',
    turn: 1,
    illustrationType: 'vevent-agm',
    narrativeCard:
      'The AGM is here, and the room feels like a courtroom. Four contested resolutions. Apex Capital\'s representatives are seated in the third row, legal pads out, looking like they\'ve been waiting for this moment all year — because they have. Meridian\'s recommendations are already baked into every institutional proxy card. Sandra Okafor is in the hallway doing a last-minute call with your largest friendly holder. The webcast is live. The vote tallies will move markets.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'vevent_09_a',
        label: 'Full institutional engagement roadshow',
        description:
          'Full institutional shareholder engagement before the AGM. Highest effort, highest reward. Requires Stakeholder ≥ 75.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'vevent_09_b',
        label: 'Standard AGM preparation; strong opening statement',
        description:
          'Prepare a governance narrative with supporting data. Solid base approach.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'vevent_09_c',
        label: 'Concede on Chair/CEO split to secure other votes',
        description:
          'Support Resolution 3 (Chair/CEO separation) to build goodwill for other contested items.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 55 }],
      },
      {
        id: 'vevent_09_d',
        label: 'Do nothing',
        description:
          'No preparation. AGM results depend entirely on governance health and prior event outcomes.',
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 5.0],
        narrative:
          'All four resolutions pass with comfortable margins — Apex\'s representative sits through the results stone-faced, and by the time the webcast ends, the stock is up 5%.',
      },
      SUCCESS: {
        svRange: [2.0, 3.0],
        narrative:
          'Three of four pass — a credible showing that keeps the board intact and gives you a mandate to govern for another year.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, 0],
        narrative:
          'Two pass, two fail — the kind of split decision that satisfies nobody and guarantees six more months of activist pressure.',
      },
      FAILURE: {
        svRange: [-4.0, -3.0],
        narrative:
          'Say-on-pay goes down in flames and only one resolution passes — three analysts downgraded before lunch, the kind of consensus that takes quarters to reverse.',
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -6.0],
        narrative:
          'Every contested item fails — the room empties in silence, Apex issues a statement within the hour, and proxy advisers are already drafting their "board reconstitution" recommendations.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // Q3 EVENTS (Tier 2 — escalation)
  // ══════════════════════════════════════════════════════════

  // V-10 — Apex Escalation (conditional)
  {
    id: 'vevent_10',
    name: 'Apex Escalation',
    tier: 2,
    quarter: 'Q3',
    turn: 1,
    illustrationType: 'vevent-apex-escalation',
    narrativeCard:
      'Marcus Adler just went public. Apex Capital\'s open letter to Vantage shareholders dropped simultaneously on the WSJ, Bloomberg, and CNBC — coordinated like a military operation, because that\'s exactly what it is. Two board seats. Immediate commitment to Chair/CEO separation. An independent strategic review led by advisers of Apex\'s choosing. The letter is twelve pages, footnoted like a law review article, and every sentence is a weapon. Sandra Okafor called it "a declaration of war." She\'s not wrong.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_10_a',
        label: 'Negotiate directly; offer one board seat and commitments',
        description:
          'Defuses the situation publicly. Best long-term outcome. Requires Stakeholder ≥ 75.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'vevent_10_b',
        label: 'Reject publicly with strong governance narrative',
        description:
          'High risk/reward. Requires Stakeholder ≥ 70 AND Strategy ≥ 65.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 70 },
          { domain: 'strategyMarkets', minimumRating: 65 },
        ],
      },
      {
        id: 'vevent_10_c',
        label: 'Commission independent strategic review; invite Apex input',
        description:
          'Defuses Apex. May be seen as board capitulation by management. Requires Strategy ≥ 60.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 60 }],
      },
      {
        id: 'vevent_10_d',
        label: 'Do nothing',
        description:
          'Apex requisitions an EGM. Tier 3 Proxy Battle fires next turn. SV -8%.',
        multiplier: 0.25,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [
      {
        eventId: 'vevent_15',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 4.0],
        narrative:
          'Apex agrees to a standstill — one seat, governance commitments, and a joint statement that makes the market exhale so hard the stock rallies 4% in the last hour of trading.',
      },
      SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'A pragmatic deal is struck behind closed doors — Apex scales back publicly, though everyone knows they\'re keeping the receipts.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'An uneasy ceasefire — Apex suspends the campaign but makes it clear this is a pause, not a peace.',
      },
      FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'Negotiations collapse at 2 AM — by market open, Apex announces a full proxy contest and the stock sells off 5% in the first thirty minutes.',
      },
      CRITICAL_FAILURE: {
        svRange: [-8.0, -8.0],
        narrative:
          'Apex requisitions an EGM before your response letter even hits inboxes — a full proxy battle is now inevitable, and the market is pricing in regime change.',
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if Event V-02 was Partial Success or below, OR AGM Resolution 3 failed, AND Apex is still active',
    precondition: 'vantage_apex_escalation',
    conditionConfig: {
      requiresEventId: 'vevent_02',
      requiresOutcome: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
    },
  },

  // V-11 — Brand Crisis: Social Media Viral Moment
  {
    id: 'vevent_11',
    name: 'Brand Crisis: Social Media Viral Moment',
    tier: 2,
    quarter: 'Q3',
    turn: 2,
    illustrationType: 'vevent-brand-crisis',
    narrativeCard:
      'A college student in Austin dropped a Vantage Crunch Bar into a glass of water on TikTok and filmed it not dissolving for 47 minutes. The video hit 18 million views in 48 hours. #VantagePoison is the number-one trending hashtag in the US. Your head of consumer affairs just forwarded an email chain from Kroger, Walmart, and Target — all asking for a statement by end of business. The science is on your side — the product is safe — but nobody cares about science when 18 million people just watched a snack bar survive a glass of water.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'esgSustainability', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_11_a',
        label: 'Brand Committee leads rapid public response with science',
        description:
          'Requires Stakeholder ≥ 70 in team AND Brand & Reputation Committee active. High effectiveness.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'vevent_11_b',
        label: 'CMO leads response; board stays out of it',
        description:
          'Low competency requirement. Risk: if CMO response is poor, board gets blamed for absence.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'vevent_11_c',
        label: 'Proactively reach out to consumer advocacy groups',
        description:
          'Builds long-term credibility but slow to take effect. Requires ESG ≥ 60 and Stakeholder ≥ 60.',
        multiplier: 0.90,
        competencyGates: [
          { domain: 'esgSustainability', minimumRating: 60 },
          { domain: 'stakeholderComms', minimumRating: 60 },
        ],
      },
      {
        id: 'vevent_11_d',
        label: 'Do nothing; let the news cycle pass',
        description:
          '35% chance the story dies naturally. 65% chance it escalates to a media investigation.',
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'safetyEnvironment', // maps to Brand & Reputation for Vantage
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'Your food scientist\'s calm, data-driven response video goes viral in its own right — 22 million views, #VantageTransparency trends, and the original TikToker posts an apology.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The retailers get their statement, the science holds up under scrutiny, and the hashtag dies a natural death within the week.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -1.0],
        narrative:
          'The hashtag fades but doesn\'t disappear — your brand tracker shows a 3-point dip among 18-34 consumers that your CMO calls "manageable but annoying."',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'Walmart pulls the product from end-caps "pending clarification," which in retail-speak means your sales team has about a week to fix this before it becomes permanent.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -7.0],
        narrative:
          'CNN runs a full investigation segment, the FDA announces a review of the product, and your IR team is fielding calls from short sellers who smell blood.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-12 — FTC Inquiry: Acquisition Anti-Trust Review
  {
    id: 'vevent_12',
    name: 'FTC Inquiry: Acquisition Anti-Trust Review',
    tier: 2,
    quarter: 'Q3',
    turn: 3,
    illustrationType: 'vevent-ftc-inquiry',
    narrativeCard:
      'The FTC just opened a preliminary inquiry into Vantage\'s proposed acquisition of NatureFirst — the regional health food brand you announced two quarters ago as the cornerstone of your portfolio pivot. The Commission is citing "potential anti-competitive effects in the natural snacks segment," which is FTC-speak for "we think you\'re trying to corner a market." The deal was supposed to close this quarter. Your advisory fees are running at $2 million a month. The market is nervous, and the arb desks are widening the spread.',
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_12_a',
        label: 'Engage FTC proactively with divestiture commitments',
        description:
          'Gives the deal the best chance of completion. Requires Regulatory & Legal ≥ 75.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
      },
      {
        id: 'vevent_12_b',
        label: 'Commission independent competitive analysis; submit to FTC',
        description:
          'Thorough process. Moderate success probability. Requires Regulatory & Legal ≥ 60.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 60 }],
      },
      {
        id: 'vevent_12_c',
        label: 'Abandon the acquisition; preserve capital',
        description:
          'Pragmatic. Short-term SV hit; long-term credibility maintained. Requires Strategy ≥ 65.',
        multiplier: 0.75,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 65 }],
      },
      {
        id: 'vevent_12_d',
        label: 'Do nothing; contest FTC jurisdiction',
        description:
          'Very high risk. Only viable if Regulatory & Legal ≥ 85 in deployed team.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 85 }],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 4.0],
        narrative:
          'The FTC clears the deal with minor conditions — NatureFirst is yours, the health portfolio thesis is alive, and a Morgan Stanley note calls it "the most accretive deal in consumer staples this year."',
      },
      SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'The deal closes with targeted divestitures in the natural snacks overlap — not the clean win you wanted, but the arb desks are closing their positions and moving on.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, -0.5],
        narrative:
          'Second request issued — the deal is in FTC purgatory, the advisory clock is still running at $2M a month, and your CFO is losing patience.',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The FTC blocks the acquisition — $45 million in advisory fees evaporated, the health portfolio strategy is in shambles, and your competitors are already circling NatureFirst.',
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -6.0],
        narrative:
          'The FTC doesn\'t just block the deal — they open a broader investigation into Vantage\'s acquisition practices across consumer brands, and suddenly every deal you\'ve done in five years is under a microscope.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // Q4 EVENTS (Tier 2–3 — endgame)
  // ══════════════════════════════════════════════════════════

  // V-13 — Hostile Bid Approach: Constellation Foods
  {
    id: 'vevent_13',
    name: 'Hostile Bid Approach: Constellation Foods',
    tier: 3,
    quarter: 'Q4',
    turn: 1,
    illustrationType: 'vevent-hostile-bid',
    narrativeCard:
      'A courier delivered an envelope to your Lead Independent Director\'s home at 7 AM on a Saturday. Inside: a merger proposal from Constellation Foods at a 14% premium — $4.8 billion — typed on Wachtell letterhead, which tells you everything about how serious they are. The letter gives the board 21 days to respond before Constellation takes the offer directly to shareholders. Sandra Okafor found out at 7:15 and has already called three board members. She wants to fight. The question is whether the board has the firepower to win.',
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_13_a',
        label: 'Reject and mount independent valuation defence',
        description:
          'Poison pill defence. Strategy ≥ 80 AND Financial ≥ 75 required. High risk — if defence fails, SV collapses.',
        multiplier: 1.20,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 80 },
          { domain: 'financialOversight', minimumRating: 75 },
        ],
      },
      {
        id: 'vevent_13_b',
        label: 'Engage Constellation; negotiate better terms',
        description:
          'Pragmatic. May achieve 20-25% premium. Requires Strategy ≥ 65.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 65 }],
      },
      {
        id: 'vevent_13_c',
        label: 'Seek a white knight (alternative bidder)',
        description:
          'Complex. High upside if white knight found. Requires Stakeholder ≥ 70 AND Strategy ≥ 65.',
        multiplier: 1.15,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 70 },
          { domain: 'strategyMarkets', minimumRating: 65 },
        ],
      },
      {
        id: 'vevent_13_d',
        label: 'Accept the offer',
        description:
          'Automatic resolution. SV crystallises at current index + 14%.',
        multiplier: 0.70,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [12.0, 20.0],
        narrative:
          'The independent valuation proves the company is worth 30% more than Constellation\'s offer — they withdraw, the stock rerates to a two-year high, and Sandra Okafor sends the Wachtell letter back with a one-word note: "No."',
      },
      SUCCESS: {
        svRange: [10.0, 15.0],
        narrative:
          'Negotiation extracts a significantly improved premium — the kind of number that makes shareholders feel like the board actually earned their fees this year.',
      },
      PARTIAL_SUCCESS: {
        svRange: [5.0, 8.0],
        narrative:
          'A modest bump in terms — the deal closes at a reasonable premium, and the board can argue it got the best available price, even if nobody\'s popping champagne.',
      },
      FAILURE: {
        svRange: [-10.0, -10.0],
        narrative:
          'The defence crumbles — Constellation takes the offer hostile, the stock collapses below the bid price on execution risk, and the board just lost control of the company\'s future.',
      },
      CRITICAL_FAILURE: {
        svRange: [-15.0, -15.0],
        narrative:
          'Constellation wins at the original 14% premium — the board fought, lost, and now gets to watch someone else run the company they couldn\'t protect.',
      },
    },
    isConditional: true,
    conditionDescription: 'Probability increases if SV < 95 and Apex is still active',
    precondition: 'vantage_hostile_bid',
  },

  // V-14 — Data Breach: Consumer Data Exposed
  {
    id: 'vevent_14',
    name: 'Data Breach: Consumer Data Exposed',
    tier: 2,
    quarter: 'Q4',
    turn: 2,
    illustrationType: 'vevent-data-breach',
    narrativeCard:
      'Your CISO just called an emergency board briefing: an external threat actor accessed the consumer loyalty programme database — 8.4 million customers\' personal data, including payment information. The breach was discovered at 11 PM last night. The 72-hour CCPA notification clock started the moment your security team confirmed the intrusion. It\'s now hour 14. The FTC notification template is open on General Counsel\'s laptop. The breach has not leaked to the press yet, but with 8.4 million affected consumers, "yet" is doing a lot of heavy lifting in that sentence.',
    primaryDomain: 'technologyDigital',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_14_a',
        label: 'Technology specialist leads incident response',
        description:
          'Immediate regulatory notification and full incident response. Correct process. Requires Technology & Digital ≥ 80.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'technologyDigital', minimumRating: 80 }],
      },
      {
        id: 'vevent_14_b',
        label: 'Legal team manages notification and communication',
        description:
          'Compliant but slow. Requires Regulatory & Legal ≥ 65.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'vevent_14_c',
        label: 'Brief media proactively before regulators',
        description:
          'High risk — regulators may view pre-notification media as inappropriate. Requires Stakeholder ≥ 75.',
        multiplier: 0.70,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'vevent_14_d',
        label: 'Delay notification; attempt to contain',
        description:
          'Illegal under CCPA. Automatic Critical Failure if chosen. Regulatory investigation guaranteed.',
        multiplier: 0.20,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The FTC calls your incident response "a benchmark for the industry" — all 8.4 million consumers are notified within 36 hours, and the story runs once and dies.',
      },
      SUCCESS: {
        svRange: [-0.5, -0.5],
        narrative:
          'CCPA notification completed with 11 hours to spare — the FTC closes with a warning letter, and the brand damage is limited to a single bad news cycle.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-2.0, -2.0],
        narrative:
          'Notification goes out late — the FTC imposes a fine that\'s small enough to pay but large enough to make headlines, and loyalty programme signups drop 22% the following month.',
      },
      FAILURE: {
        svRange: [-6.0, -6.0],
        narrative:
          'The FTC opens a formal investigation, a class action is filed before the week is out on behalf of 8.4 million consumers, and your D&O insurance premium just doubled.',
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -12.0],
        narrative:
          'The delayed notification attempt is discovered by a whistleblower — FTC enforcement, CCPA penalties, Congressional hearings, and a brand reputation crater that will take years to fill.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // V-15 — Full Proxy Battle (conditional — Tier 3 existential)
  {
    id: 'vevent_15',
    name: 'Full Proxy Battle',
    tier: 3,
    quarter: 'Q4',
    turn: 3,
    illustrationType: 'vevent-proxy-battle',
    narrativeCard:
      'This is it. Apex Capital has requisitioned an Extraordinary General Meeting — the nuclear option. They want your Lead Independent Director and two NEDs removed and replaced with their own nominees: a former ConAgra CFO, a governance activist from CalPERS, and a restructuring specialist who\'s never lost a proxy fight. Sterling Proxy has issued a preliminary note supporting Apex on all three demands. Marcus Adler called your LID this morning — not to negotiate, but to inform. Sandra Okafor is in the war room with Skadden on one line and Goldman on the other. This is a full proxy contest, and the next three weeks will determine who controls this company.',
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'vevent_15_a',
        label: 'Full institutional roadshow; make the governance case',
        description:
          'Highest effort, highest reward. Requires combined Stakeholder ≥ 75 in deployed team.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'vevent_15_b',
        label: 'Negotiate with Apex; concede two of three demands',
        description:
          'Defuses the battle with concessions. Requires Stakeholder ≥ 65 AND Strategy ≥ 60.',
        multiplier: 0.90,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 65 },
          { domain: 'strategyMarkets', minimumRating: 60 },
        ],
      },
      {
        id: 'vevent_15_c',
        label: 'Seek support from largest friendly institutional shareholders',
        description:
          'Effective only if governance health > 45. Requires Stakeholder ≥ 70.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'vevent_15_d',
        label: 'Do nothing',
        description:
          'Apex wins. Forced board reconstitution. SV -22%.',
        multiplier: 0.15,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [6.0, 6.0],
        narrative:
          'The institutions rally — every major index fund backs the incumbent slate, Apex\'s nominees are defeated by double-digit margins, and the stock closes up 6% as the Street prices in governance stability.',
      },
      SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'A negotiated settlement at the eleventh hour — Apex gets one seat and a governance roadmap, the board keeps control, and both sides call it a win in their press releases.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-3.0, -3.0],
        narrative:
          'Apex takes two seats — the board technically retains control, but the power dynamics in the boardroom just shifted in ways that can\'t be undone with a committee reshuffle.',
      },
      FAILURE: {
        svRange: [-12.0, -12.0],
        narrative:
          'Apex wins the proxy contest — the board is reconstituted, management change is imminent, and Sandra Okafor\'s lawyers are already reviewing her employment agreement.',
      },
      CRITICAL_FAILURE: {
        svRange: [-22.0, -22.0],
        narrative:
          'Total capitulation — Apex sweeps all three seats, the LID is removed, Sandra Okafor is terminated by the new board before the EGM room clears, and the company you were hired to govern belongs to someone else now.',
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if governance health < 50 AND Apex is still active AND AGM Resolution 3 failed',
    precondition: 'vantage_proxy_battle',
    conditionConfig: {
      requiresGhBelow: 50,
    },
  },
];
