import type { GameEvent } from '@/types/game';

export const rheinfeldEvents: GameEvent[] = [
  // ── R-01 - Audit Committee: No Effective Chair ──
  {
    id: 'revent_01',
    name: 'Audit Committee: No Effective Chair',
    tier: 1,
    quarter: 'Q1',
    turn: 1,
    illustrationType: 'revent-audit-vacancy',
    narrativeCard:
      'The external auditor has written directly to the Supervisory Board - not to Heinrich, to the full board - noting that the Audit Committee has had no effective chair for four months. Under HGB §107, this creates a statutory compliance gap. The letter is polite. The implication is not.',
    primaryDomain: 'financialOversight',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_01_a',
        label: 'Appoint a qualified Audit Committee Chair immediately',
        description:
          'Financial Oversight ≥ 75 required. Clean, decisive, restores statutory compliance under HGB §107.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 75 }],
        fallback: 'revent_01_c',
      },
      {
        id: 'revent_01_b',
        label: 'Convene full Supervisory Board session',
        description:
          'Buys one quarter to discuss the appointment process. Signals process over speed.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'revent_01_c',
        label: 'Ask Heinrich to chair the Audit Committee temporarily',
        description:
          'Legally impermissible under GCGC 5.2 - the Supervisory Board Chair cannot also chair the Audit Committee. But Heinrich may not know that.',
        multiplier: 0.50,
        competencyGates: [],
      },
      {
        id: 'revent_01_d',
        label: 'Do nothing',
        description:
          "The auditor's next step is a qualified audit opinion.",
        multiplier: 0.50,
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
          'The new Audit Committee Chair is in place before the auditor\'s ink has dried - a response so swift that Meridian Capital\'s governance analyst described it, privately, as "almost German in its efficiency."',
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          'A credible appointment, properly constituted under HGB §107 - the auditor withdraws the compliance flag with the satisfied brevity of a man whose letter was read by the right people.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The process is in motion but the appointment is not yet confirmed - the auditor notes the progress and extends the deadline by one quarter, which is more patience than Rheinfeld deserves.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'The auditor has escalated to the BaFin - the compliance gap is now a matter of regulatory record, and the institutional shareholders have added it to a list that was already too long.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'A qualified audit opinion - four words that, in German corporate governance, carry roughly the same weight as a vote of no confidence delivered in writing.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-02 - Institutional Shareholder Demands Independent Review ──
  {
    id: 'revent_02',
    name: 'Institutional Shareholder Demands Independent Review',
    tier: 1,
    quarter: 'Q1',
    turn: 2,
    illustrationType: 'revent-institutional-demand',
    narrativeCard:
      "Meridian Capital - 12% shareholder, Frankfurt-based - has written to the Supervisory Board requesting an independent strategic review and questioning whether Heinrich Rheinfeld, at 71 and as a major shareholder, should continue as Chair. The letter is addressed to all Supervisory Board members individually, bypassing Heinrich. He has called an emergency board session to discuss the 'inappropriate communication.'",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_02_a',
        label: 'Respond constructively; commit to independent review',
        description:
          'Commit to an independent strategic review within 6 months. Requires Stakeholder & Comms ≥ 65 in deployed team.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'revent_02_b',
      },
      {
        id: 'revent_02_b',
        label: 'Meet Meridian privately first',
        description:
          'Hear their concerns before committing. Moderate risk - they may interpret delay as stonewalling.',
        multiplier: 0.85,
        competencyGates: [],
      },
      {
        id: 'revent_02_c',
        label: "Support Heinrich's position - reject the letter",
        description:
          'Back Heinrich\'s view that the letter is inappropriate and should be rejected. Signals to all institutional shareholders that the board is captured.',
        multiplier: 0.50,
        competencyGates: [],
      },
      {
        id: 'revent_02_d',
        label: 'Do nothing',
        description:
          'Let Heinrich manage it. He will. Badly.',
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
        svRange: [3.0, 3.0],
        narrative:
          'Meridian Capital has publicly praised the Supervisory Board\'s response - a sentence that has never before appeared in a Rheinfeld press release.',
      },
      SUCCESS: {
        svRange: [1.5, 1.5],
        narrative:
          'The strategic review commitment has been accepted; Meridian stands down from its most aggressive posture, though their analysts remain, as they put it, "constructively engaged."',
      },
      PARTIAL_SUCCESS: {
        svRange: [0.5, 0.5],
        narrative:
          'Meridian has not escalated, which in the current climate counts as a win - though the letter remains on file and the questions it raised have not been answered.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'Meridian has written a second letter - this one copied to the BaFin and the financial press - noting that the Supervisory Board has failed to respond substantively to a legitimate shareholder concern.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'The institutional shareholder bloc is now coordinating - Meridian\'s letter has become a rallying point for every investor who has been quietly uncomfortable with Heinrich\'s chairmanship for years.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-03 - CSRD Gap Assessment: Red Flag ──
  {
    id: 'revent_03',
    name: 'CSRD Gap Assessment: Red Flag',
    tier: 1,
    quarter: 'Q1',
    turn: 3,
    illustrationType: 'revent-csrd-gap',
    narrativeCard:
      "The company's external sustainability consultants have delivered their CSRD gap assessment. The headline: Rheinfeld is 22 months from the reporting deadline and has 'significant preparedness gaps across all material sustainability topics.' The CSO, Yuki Nakamura, has presented the report to the Supervisory Board. Heinrich has thanked her for the presentation and moved on to the next agenda item.",
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_03_a',
        label: 'Mandate CSRD implementation plan within 60 days',
        description:
          'Formally instruct the Management Board to deliver a CSRD implementation plan with consequences for non-delivery. ESG ≥ 70 required.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 70 }],
        fallback: 'revent_03_c',
      },
      {
        id: 'revent_03_b',
        label: 'Establish the CSRD/Sustainability Committee immediately',
        description:
          'Costs €200k p.a. from budget. Creates a permanent governance structure for CSRD oversight.',
        multiplier: 1.10,
        competencyGates: [],
      },
      {
        id: 'revent_03_c',
        label: 'Request a second opinion from another consultant',
        description:
          'Buys time and signals the board is taking it seriously without committing to action.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'revent_03_d',
        label: 'Do nothing',
        description:
          "Accept Heinrich's position and move on. The Management Board will handle it. They won't.",
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'The CSRD implementation plan has been delivered ahead of schedule - Yuki Nakamura finally has the Supervisory Board backing she needed, and the consultants have upgraded their assessment from "critical" to "on track."',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The Supervisory Board has taken ownership of CSRD compliance - a structural change that the consultants note will require sustained commitment but is, at least, a credible beginning.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The second opinion confirms what the first one said, which is what second opinions tend to do - Rheinfeld has bought time but not progress.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'The CSRD gap has widened - the consultants have issued a supplementary report noting that Management Board cooperation has been "intermittent at best," a phrase that in German consulting language means non-existent.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'The external auditor has informed the Audit Committee that CSRD non-compliance may require disclosure in the annual report as a material risk - Heinrich\'s "Brussels distraction" has become an existential threat.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-04 - Heinrich Blocks New Board Appointment ──
  {
    id: 'revent_04',
    name: 'Heinrich Blocks New Board Appointment',
    tier: 1,
    quarter: 'Q1',
    turn: 4,
    illustrationType: 'revent-heinrich-blocks',
    narrativeCard:
      "Heinrich has used his position as Nomination Committee chair to delay ratification of your proposed new Supervisory Board member. His stated reason: 'insufficient industry experience.' The actual reason is visible to everyone in the room. The institutional shareholder is watching.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_04_a',
        label: 'Escalate to the full Supervisory Board for a vote',
        description:
          'Overrule the Nomination Committee. High risk if Margarethe and Strasser vote with Heinrich.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
        fallback: 'revent_04_c',
      },
      {
        id: 'revent_04_b',
        label: 'Engage the worker representatives',
        description:
          'Their votes on Supervisory Board composition can break Heinrich\'s grip. Requires People & Culture ≥ 65 and Stakeholder ≥ 60.',
        multiplier: 1.00,
        competencyGates: [
          { domain: 'peopleCulture', minimumRating: 65 },
          { domain: 'stakeholderComms', minimumRating: 60 },
        ],
        fallback: 'revent_04_c',
      },
      {
        id: 'revent_04_c',
        label: 'Propose a compromise candidate',
        description:
          'Someone Heinrich finds less threatening. Lower-quality appointment but gets through.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'revent_04_d',
        label: 'Do nothing',
        description:
          'Withdraw the nomination. Heinrich wins this round.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 2.5],
        narrative:
          'The appointment passes over Heinrich\'s objection - the first time in fifteen years that the Nomination Committee has been overruled, and the first time the institutional shareholders have had a reason to believe the board can govern itself.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The worker representatives sided with reform - Koch\'s vote was decisive, and Heinrich\'s expression suggested he understood precisely what had changed.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The compromise candidate is acceptable to Heinrich, which means they are acceptable to no one else - but the seat is filled, and that counts for something.',
      },
      FAILURE: {
        svRange: [-2.0, -2.0],
        narrative:
          'Heinrich has blocked the appointment and the Supervisory Board has accepted it - the institutional shareholders note, accurately, that the Nomination Committee operates as a personal fiefdom.',
      },
      CRITICAL_FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The blocked appointment has been leaked to Handelsblatt - the headline reads "Rheinfeld Patriarch Blocks Independent Board Reform," which is devastating because it is entirely accurate.',
      },
    },
    isConditional: true,
    precondition: 'heinrichBlocks',
  },

  // ── R-05 - China Pivot Vote ──
  {
    id: 'revent_05',
    name: 'China Pivot Vote',
    tier: 2,
    quarter: 'Q2',
    turn: 1,
    illustrationType: 'revent-china-pivot',
    narrativeCard:
      "The Management Board has formally submitted its China supply chain pivot proposal for Supervisory Board approval - a requirement under AktG §111 for transactions of this magnitude. The proposal would shift 35% of component sourcing to Chinese suppliers by 2027, reducing cost exposure to US tariffs. Hans-Werner Koch has already told you the IG Metall will oppose it publicly if it passes. The vote is in two weeks.",
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'geopoliticalMacro', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_05_a',
        label: 'Approve with conditions - job security guarantee',
        description:
          'Require the Management Board to present a job security guarantee before implementation. People & Culture ≥ 65 required to bring worker reps along.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
        fallback: 'revent_05_c',
      },
      {
        id: 'revent_05_b',
        label: 'Approve unconditionally',
        description:
          "Trust the Management Board's analysis. Fast but politically costly with the worker representatives.",
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'revent_05_c',
        label: 'Request further due diligence - delay one quarter',
        description:
          'Buys time for a proper geopolitical assessment. Geopolitical & Macro ≥ 70 required.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'geopoliticalMacro', minimumRating: 70 }],
        fallback: 'revent_05_b',
      },
      {
        id: 'revent_05_d',
        label: 'Do nothing',
        description:
          'Reject the proposal - force the Management Board to find an alternative. Only viable with Strategy ≥ 75.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'strategy',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 4.0],
        narrative:
          'The conditional approval has achieved something remarkable - the worker representatives supported the pivot, the Management Board has its mandate, and the job security guarantees are legally binding under the Betriebsverfassungsgesetz.',
      },
      SUCCESS: {
        svRange: [2.0, 2.0],
        narrative:
          'The China pivot proceeds with conditions - not the unconditional mandate the COO wanted, but a structured approach that the institutional shareholders can defend to their own compliance teams.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The due diligence delay has been accepted by the Management Board with the controlled frustration of executives who understand that "further analysis" means "not yet."',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The China pivot has stalled - the worker representatives have publicly opposed it, the Management Board is furious, and Markus Bauer has told Heinrich that the Supervisory Board is "unfit to govern a Stammtisch, let alone a supply chain."',
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -6.0],
        narrative:
          'IG Metall has issued a press release opposing the China pivot and questioning the Supervisory Board\'s competence - the kind of public statement that makes the front page of the Wirtschaftswoche and stays there.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-06 - US Tariff Crisis ──
  {
    id: 'revent_06',
    name: 'US Tariff Crisis: Automotive Revenue at Risk',
    tier: 2,
    quarter: 'Q2',
    turn: 2,
    illustrationType: 'revent-us-tariff',
    narrativeCard:
      'The 25% US tariff on German-manufactured automotive components is now in force. Three of Rheinfeld\'s US customers have written to renegotiate contracts. €580m of annual revenue is directly exposed. The Management Board wants to pass costs to customers. The Supervisory Board has been asked to endorse this strategy publicly.',
    primaryDomain: 'geopoliticalMacro',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_06_a',
        label: 'Endorse cost-pass-through strategy',
        description:
          'Back management publicly. Strategy & Markets ≥ 65 in deployed team required.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 65 }],
        fallback: 'revent_06_d',
      },
      {
        id: 'revent_06_b',
        label: 'Commission independent geopolitical risk assessment',
        description:
          'Before endorsing anything. Geopolitical & Macro ≥ 70 required.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'geopoliticalMacro', minimumRating: 70 }],
        fallback: 'revent_06_a',
      },
      {
        id: 'revent_06_c',
        label: 'Instruct Management Board to accelerate US localisation',
        description:
          'Manufacturing in the US to avoid tariffs. Bold. Strategy ≥ 80 AND Geopolitical ≥ 65 required.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 80 },
          { domain: 'geopoliticalMacro', minimumRating: 65 },
        ],
        fallback: 'revent_06_b',
      },
      {
        id: 'revent_06_d',
        label: 'Do nothing',
        description:
          'Let management handle it without Supervisory Board endorsement.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'strategy',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [5.0, 5.0],
        narrative:
          'The US localisation strategy has been announced to the market - a bold move that the analysts called "strategically transformative" and the US customers called "about time."',
      },
      SUCCESS: {
        svRange: [2.5, 2.5],
        narrative:
          'The geopolitical risk assessment has informed a measured response - the Supervisory Board has endorsed a phased strategy that protects the most critical revenue streams while avoiding overcommitment.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The cost-pass-through has been endorsed but the market response is tepid - the US customers have accepted the first round of increases, which means the next round will be harder.',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'Two of the three US customers have terminated their contracts - €230m of revenue lost in a quarter, and the Management Board\'s strategy lies in ruins on the Supervisory Board\'s table.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -7.0],
        narrative:
          'The US automotive division is in freefall - the tariff has exposed a decade of strategic complacency, and the Supervisory Board\'s failure to act is now the subject of a Reuters analysis piece titled "Rheinfeld: The Cost of Inaction."',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-07 - Worker Representatives: Co-Determination Crisis ──
  {
    id: 'revent_07',
    name: 'Worker Representatives: Co-Determination Crisis',
    tier: 2,
    quarter: 'Q2',
    turn: 3,
    illustrationType: 'revent-worker-reps',
    narrativeCard:
      "Hans-Werner Koch has requested a formal meeting of the Supervisory Board's worker-side members with the shareholder-side - without the Management Board present. His message is direct: the worker representatives feel they are being treated as a rubber stamp. If that does not change, they will use every procedural mechanism available to them to delay any Management Board proposal. That is not a threat. That is a statement of intent.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_07_a',
        label: 'Meet worker reps seriously; commit to structural change',
        description:
          'People & Culture ≥ 70 required. Changes the dynamic for the rest of the game.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
        fallback: 'revent_07_b',
      },
      {
        id: 'revent_07_b',
        label: 'Meet them; listen; make no commitments',
        description:
          'Moderate outcome - buys goodwill without binding the board.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'revent_07_c',
        label: 'Decline the meeting',
        description:
          'The shareholder-side is not obligated to meet separately. Legally correct. Strategically disastrous.',
        multiplier: 0.50,
        competencyGates: [],
      },
      {
        id: 'revent_07_d',
        label: 'Do nothing',
        description:
          'Let Heinrich manage the worker side as he always has.',
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
        svRange: [2.0, 2.0],
        narrative:
          'Koch shook your hand at the end of the meeting - a gesture that, from a man who has spent thirty years in IG Metall, means more than any written agreement.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The worker representatives have agreed to engage constructively on upcoming votes - not enthusiastically, but with the kind of pragmatic cooperation that German co-determination was designed to produce.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Koch listened. He did not agree. He did not disagree. He said he would "take it to the works council," which in IG Metall language means the jury is still out.',
      },
      FAILURE: {
        svRange: [-3.0, -3.0],
        narrative:
          'The worker representatives have formally notified the Supervisory Board that they will exercise their right to delay all Management Board proposals requiring board approval - a procedural weapon that is entirely legal and entirely devastating.',
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -5.0],
        narrative:
          'Koch has gone to the press - "The shareholder-side of the Rheinfeld Aufsichtsrat treats co-determination as a formality. We will treat their proposals the same way." Board tension has reached a level that makes governance impossible.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-08 - Proxy Adviser Report ──
  {
    id: 'revent_08',
    name: 'Proxy Adviser Report: Pre-HV Assessment',
    tier: 1,
    quarter: 'Q2',
    turn: 4,
    illustrationType: 'revent-proxy-report',
    narrativeCard:
      "Meridian Governance has published its pre-HV assessment of Rheinfeld's supervisory board. Their headline is damning: 'Structural governance failure. Family entrenchment, independence deficit, and CSRD unpreparedness combine to create material risk.' The report flags Heinrich, Margarethe, Strasser, and the absent Audit Committee Chair specifically.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'peopleCulture', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'revent_08_a',
        label: 'Report card - no strategy selection',
        description:
          'Auto-generated governance assessment. Feeds into HV voting weights. No player action required.',
        multiplier: 0.80,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The proxy adviser report is critical but acknowledges recent reform efforts - the institutional shareholders have received a narrative that is damning about the past but cautiously optimistic about the direction of travel.',
      },
      SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The report identifies structural problems but notes that the Supervisory Board has begun to address them - a measured assessment that gives the board room to manoeuvre at the HV.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'The report is negative but not catastrophic - the kind of assessment that makes the AGM uncomfortable rather than existential.',
      },
      FAILURE: {
        svRange: [0, 0],
        narrative:
          'The report recommends voting against three Supervisory Board members and the CEO pay package - a comprehensive rejection that will dominate the HV pre-meeting briefings.',
      },
      CRITICAL_FAILURE: {
        svRange: [0, 0],
        narrative:
          'The report has become a roadmap for Meridian Capital\'s EGM campaign - every unresolved issue documented with the precision of a prosecutor\'s brief.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-09 - Hauptversammlung (AGM) ──
  {
    id: 'revent_09',
    name: 'Hauptversammlung',
    tier: 2,
    quarter: 'AGM',
    turn: 1,
    illustrationType: 'revent-agm',
    narrativeCard:
      "Rheinfeld's Hauptversammlung takes place in Düsseldorf. The hall is full - institutional investors, union representatives, and journalists. Meridian Capital has filed three shareholder proposals. Heinrich has opened the meeting with a 40-minute address about the company's heritage. The institutional shareholders are checking their phones.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'revent_09_a',
        label: 'Support reform - back independent review and succession',
        description:
          'Support Meridian\'s proposals for independent strategic review and Heinrich succession planning. Bold reform stance.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
        fallback: 'revent_09_b',
      },
      {
        id: 'revent_09_b',
        label: 'Negotiate - partial concession on review, defend Heinrich',
        description:
          'Support the strategic review but oppose the no-confidence motion against Heinrich. Compromise position.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'revent_09_c',
        label: 'Defend the status quo - oppose all Meridian proposals',
        description:
          'Back Heinrich\'s position completely. Only viable if governance reforms have been implemented independently.',
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'revent_09_d',
        label: 'Do nothing',
        description:
          'Abstain from positioning. The votes proceed without board guidance.',
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
        svRange: [6.0, 6.0],
        narrative:
          'All four resolutions pass favourably - the Hauptversammlung has delivered a mandate for reform that even Heinrich cannot ignore, and the institutional shareholders leave Düsseldorf with something they have not felt about Rheinfeld in years: confidence.',
      },
      SUCCESS: {
        svRange: [3.0, 3.0],
        narrative:
          'Three resolutions pass - the strategic review is mandated, the CEO pay is approved with conditions, and Meridian has achieved enough to stand down from its most aggressive posture.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Two resolutions pass but the Heinrich question remains unresolved - the institutional shareholders have won a battle but not the war, and everyone in the room knows it.',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'Only one resolution passes - the Hauptversammlung has become a public demonstration of Rheinfeld\'s governance dysfunction, reported by Handelsblatt under the headline "Family First."',
      },
      CRITICAL_FAILURE: {
        svRange: [-8.0, -8.0],
        narrative:
          'No resolutions pass favourably - the institutional shareholders have voted with their feet, and Meridian Capital has announced that evening that it will requisition an Extraordinary General Meeting under AktG §122.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-10 - CSRD Deadline: 12 Months Remaining ──
  {
    id: 'revent_10',
    name: 'CSRD Deadline: 12 Months Remaining',
    tier: 2,
    quarter: 'Q3',
    turn: 1,
    illustrationType: 'revent-csrd-deadline',
    narrativeCard:
      "The EU's CSRD reporting deadline is now 12 months away. Yuki Nakamura has presented the Supervisory Board with a progress report. If the implementation is on track, this is a routine update. If it is not - and the Audit Committee's gap assessment suggested it wasn't - this is an emergency.",
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_10_a',
        label: 'Escalate CSRD to board-level priority',
        description:
          'Mandate monthly progress reports and resource the CSO properly. ESG ≥ 75 required.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 75 }],
        fallback: 'revent_10_c',
      },
      {
        id: 'revent_10_b',
        label: 'Commission external CSRD implementation specialist',
        description:
          'Buys expertise at significant cost. Effective but expensive.',
        multiplier: 1.10,
        competencyGates: [],
      },
      {
        id: 'revent_10_c',
        label: 'Plan for partial compliance with transparent disclosure',
        description:
          'Accept that full CSRD compliance in 12 months is impossible. Regulatory & Legal ≥ 70 required.',
        multiplier: 0.75,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
        fallback: 'revent_10_d',
      },
      {
        id: 'revent_10_d',
        label: 'Do nothing',
        description:
          'Leave it to management. They are aware of the deadline.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3.0, 3.0],
        narrative:
          'Rheinfeld is now on track for full CSRD compliance - the external specialist has accelerated the timeline, and the Big Four auditor has confirmed that the data architecture meets the required standard.',
      },
      SUCCESS: {
        svRange: [1.5, 1.5],
        narrative:
          'The CSRD implementation is progressing - not fast enough for comfort, but fast enough that the auditor has stopped sending warning letters.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'Partial compliance has been accepted as the realistic target - the transparent disclosure strategy is legally defensible but reputationally costly for a company that claims to take sustainability seriously.',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The CSRD implementation has stalled - the Management Board cites "competing priorities," which is the corporate equivalent of admitting that nobody has been working on it.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -7.0],
        narrative:
          'The Big Four auditor has formally warned the Supervisory Board that a non-compliant CSRD report will trigger a qualified audit opinion - Heinrich\'s "Brussels distraction" is about to cost Rheinfeld its credit rating.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-11 - Heinrich's Secret: The Side-Deal ──
  {
    id: 'revent_11',
    name: "Heinrich's Secret: The Side-Deal",
    tier: 2,
    quarter: 'Q3',
    turn: 2,
    illustrationType: 'revent-heinrich-secret',
    narrativeCard:
      "A financial journalist has contacted the company's investor relations team with questions about an undisclosed agreement between Heinrich Rheinfeld's family holding company and a Chinese industrial conglomerate - the same conglomerate that is central to the Management Board's China pivot proposal. The questions are specific. Someone has been talking. Heinrich, when informed, says the journalist is 'confused.'",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_11_a',
        label: 'Commission immediate independent legal review',
        description:
          "Regulatory & Legal ≥ 80 required. This is the right answer and Heinrich will resist it.",
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 80 }],
        fallback: 'revent_11_c',
      },
      {
        id: 'revent_11_b',
        label: 'Meet Heinrich privately; demand voluntary disclosure',
        description:
          'Ask him to disclose everything within 48 hours. People & Culture ≥ 70 required. High risk if he refuses.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
        fallback: 'revent_11_c',
      },
      {
        id: 'revent_11_c',
        label: 'Issue a holding statement',
        description:
          'The board is aware of the inquiry and will respond in due course. Buys time. Looks evasive.',
        multiplier: 0.65,
        competencyGates: [],
      },
      {
        id: 'revent_11_d',
        label: 'Do nothing',
        description:
          "Hope the story doesn't run. 70% chance it does.",
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
        svRange: [2.0, 2.0],
        narrative:
          'The independent legal review has been announced before the journalist could publish - the Supervisory Board has got ahead of the story, and Heinrich\'s side-deal is now a matter of formal investigation rather than tabloid speculation.',
      },
      SUCCESS: {
        svRange: [0.5, 0.5],
        narrative:
          'Heinrich has disclosed under pressure - the side-deal is now on the record, the conflict of interest is documented, and the Supervisory Board can claim it acted when the facts emerged.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-2.0, -2.0],
        narrative:
          'The holding statement bought 48 hours - enough time for the journalist to find two additional sources and publish a story that is worse than the original inquiry suggested.',
      },
      FAILURE: {
        svRange: [-6.0, -6.0],
        narrative:
          'The story has run in Handelsblatt - "Rheinfeld Chair\'s Secret China Deal" - and the BaFin has opened a preliminary inquiry into whether the side-deal constitutes a notifiable related-party transaction under AktG §111a.',
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -12.0],
        narrative:
          'The story has gone international - Reuters, Bloomberg, and the Financial Times have all picked it up, and the share price has dropped 8% in pre-market trading as institutional investors scramble to understand what the Supervisory Board knew and when it knew it.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-12 - Meridian Capital Escalates: Requisitions EGM ──
  {
    id: 'revent_12',
    name: 'Meridian Capital Escalates: Requisitions EGM',
    tier: 2,
    quarter: 'Q3',
    turn: 3,
    illustrationType: 'revent-meridian-egm',
    narrativeCard:
      "Meridian Capital has exercised its right under AktG §122 to requisition an Extraordinary General Meeting. They are seeking a shareholder vote to remove two Supervisory Board members and replace them with Meridian's nominees. Their public letter is measured, specific, and devastating.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_12_a',
        label: 'Engage Meridian directly; offer negotiated settlement',
        description:
          'One seat and a commitment to governance reforms. Stakeholder & Comms ≥ 75 required.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
        fallback: 'revent_12_c',
      },
      {
        id: 'revent_12_b',
        label: 'Contest the EGM legally',
        description:
          'Challenge the procedural basis. Regulatory & Legal ≥ 80 required. Buys time but looks obstructive.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 80 }],
        fallback: 'revent_12_c',
      },
      {
        id: 'revent_12_c',
        label: 'Accept the EGM; make the governance case directly',
        description:
          'Stakeholder & Comms ≥ 70 AND governance health > 50 required.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
        fallback: 'revent_12_d',
      },
      {
        id: 'revent_12_d',
        label: 'Do nothing',
        description:
          'Meridian wins by default.',
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
        svRange: [4.0, 4.0],
        narrative:
          'The negotiated settlement has been announced jointly - Meridian gets one board seat, the Supervisory Board commits to an independent governance review, and the press release reads like a ceasefire agreement between two parties who have decided that peace is more profitable than war.',
      },
      SUCCESS: {
        svRange: [1.5, 1.5],
        narrative:
          'The EGM has been averted through direct engagement - Meridian has accepted concessions short of their maximum demands, and the market has responded with cautious approval.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-2.0, -2.0],
        narrative:
          'The EGM will proceed but the Supervisory Board has made its case - the outcome is uncertain, the legal costs are mounting, and the only people who are definitely winning are the lawyers.',
      },
      FAILURE: {
        svRange: [-8.0, -8.0],
        narrative:
          'Meridian has secured 31% combined shareholder support - the EGM will succeed, the Supervisory Board will lose two members, and Heinrich\'s grip on the boardroom has been broken by the people he dismissed as "speculators."',
      },
      CRITICAL_FAILURE: {
        svRange: [-15.0, -15.0],
        narrative:
          'The EGM has become a public referendum on Rheinfeld\'s governance - the vote is overwhelming, the Supervisory Board is humiliated, and the Frankfurter Allgemeine Zeitung\'s editorial page asks whether the Rheinfeld family should have any role in the company\'s future.',
      },
    },
    isConditional: true,
    precondition: 'meridianEGM',
  },

  // ── R-13 - Strategic Review: The Vote ──
  {
    id: 'revent_13',
    name: 'Strategic Review: The Vote',
    tier: 2,
    quarter: 'Q4',
    turn: 1,
    illustrationType: 'revent-strategic-review',
    narrativeCard:
      'The independent strategic review has delivered its findings. The report recommends: accelerated CSRD implementation, a structured Heinrich succession plan beginning immediately, and a strategic pivot away from US automotive toward European energy infrastructure components. The Management Board broadly supports it. Heinrich does not. The Supervisory Board must vote.',
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_13_a',
        label: 'Adopt the strategic review in full',
        description:
          'Including the Heinrich succession recommendation. Bold. Transformative. Requires majority including worker rep support.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 70 }],
        fallback: 'revent_13_b',
      },
      {
        id: 'revent_13_b',
        label: 'Adopt operational recommendations; defer succession',
        description:
          'Accept the strategic pivot and CSRD plan; defer the Heinrich question to next year. Compromise.',
        multiplier: 0.85,
        competencyGates: [],
      },
      {
        id: 'revent_13_c',
        label: 'Adopt CSRD recommendations only',
        description:
          'Reject the strategic pivot. Conservative. Disappoints Meridian.',
        multiplier: 0.65,
        competencyGates: [],
      },
      {
        id: 'revent_13_d',
        label: 'Do nothing',
        description:
          'Reject the review - side with Heinrich.',
        multiplier: 0.50,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'strategy',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [6.0, 6.0],
        narrative:
          'The strategic review has been adopted in full - including the succession plan - and the market has responded with a 6% share price increase, the largest single-day gain in Rheinfeld\'s history as a public company.',
      },
      SUCCESS: {
        svRange: [3.0, 3.0],
        narrative:
          'The operational recommendations have been adopted - the strategic pivot is underway, CSRD is resourced, and the succession question has been deferred with enough specificity that the institutional shareholders believe it will actually happen.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0.5, 0.5],
        narrative:
          'The CSRD recommendations have been adopted but the strategic pivot has been shelved - a half-measure that the analysts describe as "necessary but insufficient," which is the market\'s way of saying "try harder."',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The strategic review has been rejected - Heinrich\'s bloc held, the worker representatives abstained, and the institutional shareholders are now certain that the Supervisory Board is incapable of self-reform.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -7.0],
        narrative:
          'The rejection of the strategic review has triggered a cascade - Meridian Capital has issued a public statement calling the Supervisory Board "structurally compromised," and two other institutional shareholders have joined the call for an EGM.',
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── R-14 - CEO Vote of Confidence ──
  {
    id: 'revent_14',
    name: 'CEO Vote of Confidence',
    tier: 2,
    quarter: 'Q4',
    turn: 2,
    illustrationType: 'revent-ceo-confidence',
    narrativeCard:
      "Klaus Reinhart has requested a formal expression of confidence from the Supervisory Board. He has been governing through an increasingly difficult year - CSRD pressure, US tariffs, the China pivot debate, and now Heinrich's conflict-of-interest revelation hanging over everything. He is not threatening to resign. He is asking you to tell him whether you have his back.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_14_a',
        label: 'Formal vote of confidence - full support',
        description:
          'Strengthens Management Board\'s hand for year-end decisions.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
        fallback: 'revent_14_b',
      },
      {
        id: 'revent_14_b',
        label: 'Conditional support - contingent on CSRD milestones',
        description:
          'Reasonable but signals some doubt.',
        multiplier: 0.85,
        competencyGates: [],
      },
      {
        id: 'revent_14_c',
        label: 'Decline to pass a formal resolution',
        description:
          'Let the question hang. Reinhart will interpret this correctly.',
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'revent_14_d',
        label: 'Do nothing',
        description:
          'Begin CEO succession planning - signal that Reinhart may not be the long-term answer. Very high risk.',
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
        svRange: [3.0, 3.0],
        narrative:
          'Reinhart has his mandate - the unanimous vote of confidence has given him the authority to push through the year-end decisions, and his private note to the Supervisory Board Chair was two words: "Thank you."',
      },
      SUCCESS: {
        svRange: [1.5, 1.5],
        narrative:
          'The vote of confidence passed with conditions - Reinhart accepted the CSRD milestones with the practiced grace of a CEO who knows that "conditional support" is better than the alternative.',
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          'No formal resolution was passed - Reinhart continues to govern, but the Management Board\'s morale has taken a hit that no quarterly bonus can repair.',
      },
      FAILURE: {
        svRange: [-4.0, -4.0],
        narrative:
          'The succession planning signal has leaked - Reinhart\'s chief of staff is already fielding calls from headhunters, and the CFO has been seen meeting with Meridian Capital representatives.',
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -7.0],
        narrative:
          'Reinhart has submitted his resignation - effective immediately, citing "irreconcilable differences with the Supervisory Board" - and the institutional shareholders are holding the board entirely responsible for losing the only competent executive in the building.',
      },
    },
    isConditional: true,
    precondition: 'ceoConfidence',
  },

  // ── R-15 - Full Governance Crisis (conditional) ──
  {
    id: 'revent_15',
    name: 'Full Governance Crisis',
    tier: 3,
    quarter: 'Q4',
    turn: 3,
    illustrationType: 'revent-governance-crisis',
    narrativeCard:
      "Three things happen simultaneously on a Monday morning. The financial journalist's story runs - front page of Handelsblatt, picked up by Reuters. Meridian Capital issues a press release announcing they have secured 31% combined shareholder support for their EGM requisition. And the BaFin contacts the company's legal counsel requesting information about the Heinrich side-deal. This is not a governance problem anymore. This is a crisis.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'strategyMarkets', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'revent_15_a',
        label: 'Full crisis response',
        description:
          'Independent legal counsel, proactive BaFin cooperation, media statement, immediate Heinrich suspension. Regulatory ≥ 80 AND Stakeholder ≥ 75 required.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 80 },
          { domain: 'stakeholderComms', minimumRating: 75 },
        ],
        fallback: 'revent_15_b',
      },
      {
        id: 'revent_15_b',
        label: 'Legal containment',
        description:
          'Engage counsel, cooperate with BaFin, say nothing publicly. Regulatory ≥ 75 required. Slower but legally safer.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
        fallback: 'revent_15_c',
      },
      {
        id: 'revent_15_c',
        label: 'Institutional roadshow',
        description:
          'Brief all major shareholders personally before the story dominates. Stakeholder ≥ 80 required. High-effort, high-reward.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 80 }],
        fallback: 'revent_15_d',
      },
      {
        id: 'revent_15_d',
        label: 'Do nothing',
        description:
          'Let Heinrich manage his own crisis. Game ends. SV -25%.',
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
        svRange: [5.0, 5.0],
        narrative:
          'The crisis has been managed - Heinrich has been suspended, the BaFin inquiry is proceeding cooperatively, and the institutional shareholders have issued a joint statement supporting the Supervisory Board\'s response, which is the closest thing to absolution that German corporate governance provides.',
      },
      SUCCESS: {
        svRange: [1.0, 1.0],
        narrative:
          'The legal containment has worked - the BaFin inquiry is proceeding without publicity, Heinrich\'s lawyers are cooperating, and the share price has stabilised at a level that reflects damage but not catastrophe.',
      },
      PARTIAL_SUCCESS: {
        svRange: [-5.0, -5.0],
        narrative:
          'The institutional roadshow bought time but not forgiveness - the shareholders understand the situation but have not yet decided whether the Supervisory Board is part of the solution or part of the problem.',
      },
      FAILURE: {
        svRange: [-12.0, -12.0],
        narrative:
          'The BaFin has escalated to a formal investigation, Meridian Capital has succeeded in its EGM requisition, and the Handelsblatt editorial page has asked whether Rheinfeld AG can survive its own Supervisory Board.',
      },
      CRITICAL_FAILURE: {
        svRange: [-25.0, -25.0],
        narrative:
          'The crisis has consumed the company - Heinrich is under formal BaFin investigation, the share price has collapsed, the CEO has resigned, and the Supervisory Board\'s legacy is a case study in how family entrenchment, institutional complacency, and governance failure can destroy three generations of industrial achievement in a single fiscal year.',
      },
    },
    isConditional: true,
    precondition: 'fullCrisis',
  },
];
