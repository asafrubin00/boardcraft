import type { GameEvent } from '@/types/game';

export const sfgEvents: GameEvent[] = [

  // ══════════════════════════════════════════════════════════
  // Q1 EVENTS — Tier 1: Opening governance crises
  // ══════════════════════════════════════════════════════════

  // SFG-01 — Audit Committee Chair Vacancy: MAS Notices
  {
    id: 'sfgevent_01',
    name: 'MAS Notices: Audit Committee Chair Vacancy',
    tier: 1,
    quarter: 'Q1',
    turn: 1,
    imageFile: 'sfgevent-01.png',
    narrativeCard:
      "{acChair.name} has resigned as Audit Committee Chair with immediate effect — a competing offer from a rival financial institution, with a conflict-of-interest dimension serious enough that the board's own counsel flagged it before the ink was dry. MAS has formally notified Straits Financial Group that the resulting Audit Committee Chair vacancy is a breach of MAS Guidelines on Corporate Governance for Financial Institutions. The board has 60 days to appoint a qualified replacement. SGX has been copied on the notice. If unresolved, SFG will be required to make a public SGXNet disclosure — the first formal governance compliance breach in the company's history. The financial press is already asking questions.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.15 },
    ],
    strategies: [
      {
        id: 'sfgevent_01_a',
        label: 'Appoint Lee Siew Geok as AC Chair',
        description:
          'Appoint Lee Siew Geok immediately — highest MAS credibility. Requires Lee Siew Geok in the director pool (Availability B). MAS closes the notice. Sets up the dream-team dynamic with Rajan Sethupathi if both are appointed.',
        multiplier: 1.15,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 85 },
          { domain: 'financialOversight', minimumRating: 80 },
        ],
      },
      {
        id: 'sfgevent_01_b',
        label: 'Appoint Margaret Tan or Robert Halliday',
        description:
          'Competent, market-credible appointment. MAS satisfied. Requires Financial Oversight ≥ 80 in the deployed team. Lower market excitement than Lee Siew Geok but solid governance signal.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 80 }],
      },
      {
        id: 'sfgevent_01_c',
        label: 'Promote Dr. Nadia Rahman to AC Chair',
        description:
          'Promote the existing independent board member. No recruitment cost. Lower market impact — MAS satisfied on technicality but proxy advisors note it as a minimal response. Requires Financial Oversight ≥ 65.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_01_d',
        label: 'Request a 30-day extension from MAS',
        description:
          'Buy time while conducting a search. Signals governance weakness. Market rumours intensify. If not resolved by Q2, SGXNet disclosure is required and SFG-05 fires at elevated severity.',
        multiplier: 0.45,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 3.5],
        narrative:
          "Lee Siew Geok's appointment was on the wires before market open. MAS closed the supervisory notice the same day. Two institutional analysts upgraded their governance score for SFG within 24 hours — the fastest regulatory-to-market translation any analyst could remember.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "A credible appointment is made and the MAS notice closes. The governance community acknowledges the response as appropriate, if not inspired.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "MAS accepts the timeline extension but the market reads the slow response as a symptom of a board that still doesn't move with urgency. The clock is running.",
      },
      FAILURE: {
        svRange: [-2.5, -2.0],
        narrative:
          "SFG is required to make an SGXNet disclosure of the AC Chair vacancy. The governance compliance breach is now public. Glass Lewis Asia flags it in their pre-AGM report.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -4.0],
        narrative:
          "MAS escalates to a formal supervisory letter. The SGXNet disclosure runs on the front page of The Business Times under the headline 'SFG Board Fails Basic Governance Test.' Three institutional shareholders request emergency calls with the SID.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-02 — Director Independence: Two-Tier Shareholder Vote
  {
    id: 'sfgevent_02',
    name: 'Director Independence Review: Two-Tier Shareholder Vote',
    tier: 1,
    quarter: 'Q1',
    turn: 2,
    imageFile: 'sfgevent-02.png',
    narrativeCard:
      "The Nominating Committee must recommend whether to seek shareholder approval to retain Helena Soong as an independent director beyond the 9-year SGX cap. A two-tier resolution is required: the first tier requires all shareholders (including Temasek's 34%) to approve; the second tier requires approval from minority shareholders only — excluding Temasek and any holder above 5%. Glass Lewis Asia has pre-signalled it will recommend against the resolution unless a concrete board renewal plan is disclosed simultaneously. Temasek's vote can carry Tier 1 but cannot touch Tier 2. This is the mechanic that makes SFG different from every other company in the game.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.35 },
      { domain: 'peopleCulture', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_02_a',
        label: 'Two-tier vote + public board renewal roadmap',
        description:
          'Seek the two-tier resolution but simultaneously disclose a board renewal roadmap with named succession timeline. Requires NC Chair with Regulatory ≥ 65 AND Stakeholder ≥ 65. Glass Lewis Asia withdraws its against recommendation. Both vote tiers pass.',
        multiplier: 1.00,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 65 },
          { domain: 'stakeholderComms', minimumRating: 65 },
        ],
      },
      {
        id: 'sfgevent_02_b',
        label: 'Two-tier vote without a renewal roadmap',
        description:
          'Seek the vote but without the accompanying disclosure. Glass Lewis votes against in Tier 2. The minority block may defeat the resolution even if Temasek carries Tier 1. High failure risk.',
        multiplier: 0.60,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 55 }],
      },
      {
        id: 'sfgevent_02_c',
        label: 'Retire Helena Soong immediately',
        description:
          "Clean solution — no shareholder vote required. Orderly exit with an agreed transition period. Requires NC Chair with People & Culture ≥ 60 to manage the transition sensitively. No AGM complexity but loses Helena's institutional knowledge.",
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_02_d',
        label: 'Reclassify Helena as non-independent; do nothing',
        description:
          'Reclassify her as non-independent and avoid the vote entirely. Reduces the independent director count, triggers NC composition breach, and gives proxy advisors fresh ammunition for the AGM.',
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'sfgevent_09',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.0],
        narrative:
          "Both tiers pass. Glass Lewis withdraws their against recommendation before the vote closes. Aberdeen Standard Investments Asia publicly praises the board renewal roadmap as 'rare and refreshing transparency from a Singapore financial institution.'",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "The two-tier vote passes. Helena is retained for one year with clear succession expectations. Proxy advisors acknowledge the board renewal commitment.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "Tier 1 passes but the minority tier is closer than expected — a warning shot. Helena is retained but the institutional message is clear: the board has until the AGM to demonstrate meaningful renewal.",
      },
      FAILURE: {
        svRange: [-3.0, -2.5],
        narrative:
          "The minority tier fails. Helena cannot be classified independent. SFG's NC composition is now non-compliant. Institutional shareholders send a joint letter requesting emergency meetings with the SID.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.5, -4.5],
        narrative:
          "Both tiers fail. Helena is reclassified non-independent, breaching multiple SGX composition rules simultaneously. MAS notes the outcome in its supervisory file. The 'Institutional Shareholder Letter: Independence Demands' event is now guaranteed to fire.",
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if Helena Soong is still on the board.',
    precondition: 'sfg_helena_on_board',
  },

  // SFG-03 — CEO Remuneration: No Clawback Provision
  {
    id: 'sfgevent_03',
    name: "CEO Remuneration: No Clawback in CEO's LTIP",
    tier: 1,
    quarter: 'Q1',
    turn: 3,
    imageFile: 'sfgevent-03.png',
    narrativeCard:
      "SFG's Annual Report has been published. A financial journalist from The Business Times has highlighted that CEO Raymond Tan's SGD 4.2 million LTIP has no clawback provision — meaning the Vietnam credit loss triggers no recovery mechanism whatsoever. Three institutional shareholders have sent private letters to the RemCo Chair requesting an explanation. MAS has noted in its Annual Report on Corporate Governance Practices that clawback provisions are considered best practice for financial institutions. The Remuneration Committee cannot stay quiet.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_03_a',
        label: 'Introduce clawback provisions; immediate disclosure',
        description:
          'Implement clawback provisions in the next LTIP cycle and disclose publicly. Requires RemCo Chair with People & Culture ≥ 70. Strong governance signal. Institutional shareholders publicly satisfied.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
      },
      {
        id: 'sfgevent_03_b',
        label: 'Commission independent remuneration review; defer changes',
        description:
          'Buy time with a credible process. Commission an independent review by a leading remuneration consultant. Shareholders partially satisfied. Decision deferred to next cycle.',
        multiplier: 0.75,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 55 }],
      },
      {
        id: 'sfgevent_03_c',
        label: 'Defend current structure with shareholder letters',
        description:
          'Write to institutional shareholders defending the current pay structure. High risk while Vietnam credit loss continues to be covered in the press. Likely to inflame rather than settle.',
        multiplier: 0.55,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'sfgevent_03_d',
        label: 'Negotiate revised LTIP with CEO privately; no disclosure',
        description:
          'Handle the CEO pay issue privately without board disclosure. Non-disclosure of material pay structure changes is potentially a breach of SGX continuous disclosure obligations. Highest risk option.',
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.0],
        narrative:
          "SFG becomes the first Singapore regional bank to publish a formal clawback policy in the same reporting cycle as the Vietnam loss. The Business Times rewrites the story as a governance turnaround rather than a pay scandal.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "Institutional shareholders acknowledge the RemCo's response. The clawback mechanism is introduced in the next LTIP cycle with clear board-approved triggers.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "The independent review buys time but the market reads it as delay. Glass Lewis Asia notes the absence of clawback provisions in their pre-AGM report regardless.",
      },
      FAILURE: {
        svRange: [-2.5, -2.0],
        narrative:
          "Shareholders make the letter chain public. The CEO's pay structure becomes the dominant governance story for the quarter, drowning out SFG's recovery messaging on the Vietnam portfolio.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.5, -3.5],
        narrative:
          "Non-disclosure of the private LTIP renegotiation surfaces — a whistleblower from within the RemCo support team provides documents to The Business Times. MAS opens a review under MAS Notice on Corporate Governance.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // Q2 EVENTS — Tier 1/2: Whistleblower, Vietnam, Indonesia
  // ══════════════════════════════════════════════════════════

  // SFG-04 — Whistleblower: CEO Related-Party Transactions
  {
    id: 'sfgevent_04',
    name: 'Whistleblower: CEO Related-Party Transaction Allegation',
    tier: 1,
    quarter: 'Q2',
    turn: 1,
    imageFile: 'sfgevent-04.png',
    narrativeCard:
      "SFG's internal whistleblower channel has received a formal complaint alleging that CEO Raymond Tan's family trust received preferential pricing on a SGD 85 million commercial property loan originated by SFG's Singapore lending book — a 180-basis-point concession not available at arm's length. The allegation is internally documented. The Audit Committee must commission an independent investigation before the end of the quarter. MAS regulations require disclosure of related-party transactions above certain thresholds on SGXNet. The board must decide how to proceed without triggering either regulatory penalties or a premature market disclosure.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'sfgevent_04_a',
        label: 'Commission independent external investigation (Big 4)',
        description:
          'AC Chair commissions a Big 4 investigation — clean, auditable, MAS-friendly. Requires AC Chair with Regulatory ≥ 75 AND Financial Oversight ≥ 70. Investigation is credible. Outcome depends on findings: if substantiated, SFG-10 fires in Q4.',
        multiplier: 1.00,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 75 },
          { domain: 'financialOversight', minimumRating: 70 },
        ],
      },
      {
        id: 'sfgevent_04_b',
        label: 'Internal investigation via Group General Counsel',
        description:
          'Faster and less disruptive. Lower credibility — independence of internal investigation will be challenged. Moderate outcome even if cleared.',
        multiplier: 0.70,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_04_c',
        label: 'Seek legal opinion on disclosure thresholds; delay',
        description:
          "Seek external legal advice on whether the transaction meets SGXNet disclosure thresholds before deciding. If delay is seen as covering up, MAS takes a very dim view. -2.5% SV floor regardless of ultimate outcome.",
        multiplier: 0.45,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_04_d',
        label: 'Brief Temasek nominee privately before deciding',
        description:
          "Non-standard process. Briefing Temasek's nominee before the board has formed a view is a governance protocol breach — it positions Temasek above the board in the decision chain. -1.5% SV minimum even if outcome is positive.",
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'sfgevent_10',
        triggerTiers: ['SUCCESS', 'CRITICAL_SUCCESS'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.5, 2.5],
        narrative:
          "The AC Chair's decision to commission an independent investigation is publicly praised as the correct governance response. MAS is briefed proactively. The market reads it as a board that takes its oversight function seriously.",
      },
      SUCCESS: {
        svRange: [0.5, 1.5],
        narrative:
          "Investigation commissioned. MAS informed. The process is credible and the board's role is unambiguous. The outcome of the investigation will determine whether SFG-10 fires.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "The investigation proceeds but its independence is already being questioned. Analysts note that the board moved slowly and the internal process creates optics problems.",
      },
      FAILURE: {
        svRange: [-3.5, -2.5],
        narrative:
          "The delay in commissioning a credible investigation is read as hesitation to expose the truth. MAS has informally indicated it views the board's process as inadequate.",
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -5.0],
        narrative:
          "The whistleblower, frustrated by the lack of visible board action, takes the allegation to The Business Times. The newspaper publishes the loan documents alongside a story titled 'Questions over SFG CEO's Family Trust.' MAS opens its own review.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-05 — Vietnam BRC Crisis
  {
    id: 'sfgevent_05',
    name: 'Vietnam Credit Loss: Board Risk Committee in the Dock',
    tier: 2,
    quarter: 'Q2',
    turn: 2,
    imageFile: 'sfgevent-05.png',
    narrativeCard:
      "An independent review commissioned by MAS has concluded that the Board Risk Committee received two risk escalation memos from the CFO in Q3 and Q4 of the prior year — neither of which was actioned. The SGD 340 million Vietnam credit loss is now being attributed in the financial press to a board-level risk governance failure. MAS has requested that SFG appear before its supervisory panel within 30 days to explain the BRC's governance processes. Institutional shareholders are considering a requisitioned AGM resolution on risk committee reform. The dual-role issue — Dato' Lim chairing both the board and the BRC — is front and centre.",
    primaryDomain: 'financialOversight',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.35 },
      { domain: 'stakeholderComms', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_05_a',
        label: 'Reconstitute BRC; new independent Chair; reform plan to MAS',
        description:
          'Full BRC reform — appoint a new independent Chair (resolving the dual-role issue) and present a risk governance reform plan to the MAS supervisory panel. Requires BRC Chair candidate with Regulatory ≥ 80 AND Financial Oversight ≥ 75. MAS satisfied. Institutional shareholders withdraw resolution.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 80 },
          { domain: 'financialOversight', minimumRating: 75 },
        ],
      },
      {
        id: 'sfgevent_05_b',
        label: 'Commission second independent review of BRC processes',
        description:
          'Commission a second review before the MAS meeting. Credible but slow. Delays institutional shareholder action but does not prevent it. Buys one quarter.',
        multiplier: 0.75,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_05_c',
        label: 'Defend BRC; argue Vietnam loss was market-driven',
        description:
          'Defend the BRC processes and argue the Vietnam loss was a market outcome, not a governance failure. Extremely high risk — if the MAS supervisory panel disagrees, formal enforcement action becomes likely.',
        multiplier: 0.35,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_05_d',
        label: 'CEO volunteers to brief MAS directly on reforms',
        description:
          "Bypass the board channel — the CEO steps forward to brief MAS. Short-term placation but signals board weakness: MAS expects board-level accountability, not executive substitute governance.",
        multiplier: 0.45,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'risk',
    committeeBonusValue: 12,
    followOnTriggers: [
      {
        eventId: 'sfgevent_12',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3.5, 4.5],
        narrative:
          "Anwar bin Hamzah is named BRC Chair before the MAS supervisory panel meets. The dual-role issue is dead. MAS issues a private acknowledgement that the board's response was 'substantive and appropriate.' Institutional shareholders withdraw their requisitioned resolution.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "BRC reform is under way. MAS is not fully satisfied but closes the supervisory inquiry for now. The institution rebuilds credibility one committee meeting at a time.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "A second review is commissioned. MAS accepts the timeline but signals that outcomes matter — not process. Institutional shareholders hold their resolution in reserve.",
      },
      FAILURE: {
        svRange: [-4.0, -3.0],
        narrative:
          "MAS supervisory panel finds the board's defence unconvincing. The panel chair states publicly that SFG's BRC governance 'does not meet the expectations of MAS for financial institutions of this scale.' Enforcement action is now a live risk.",
      },
      CRITICAL_FAILURE: {
        svRange: [-8.0, -6.0],
        narrative:
          "MAS announces a formal review under the Banking Act. SFG shares fall 6% on open. Dato' Lim's dual role is named explicitly in the MAS statement. The SFG-12 MAS Enforcement Action event is now queued.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-06 — Indonesia Digital Bank Licence
  {
    id: 'sfgevent_06',
    name: 'Indonesia Digital Bank Licence Application',
    tier: 2,
    quarter: 'Q2',
    turn: 3,
    imageFile: 'sfgevent-06.png',
    narrativeCard:
      "CEO Raymond Tan has proposed that SFG apply for one of Indonesia's remaining digital bank licences under OJK (Indonesia's FSA) regulations. The opportunity is real: Indonesia's unbanked population is 51 million, and SFG's wealth management arm already serves 12,000 Indonesian high-net-worth clients. The licence requires a committed capital injection of SGD 250 million, board-level sign-off, and MAS approval for the cross-border transaction. Two board members are uncertain about the risk appetite given the Vietnam losses. Temasek nominee Eric Png has signalled that Temasek views the expansion positively.",
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'geopoliticalMacro', weight: 0.30 },
      { domain: 'financialOversight', weight: 0.20 },
      { domain: 'regulatoryLegal', weight: 0.10 },
    ],
    strategies: [
      {
        id: 'sfgevent_06_a',
        label: 'Full board approval; immediate licence application',
        description:
          'Board approves the full SGD 250m capital injection and files immediately. Requires Strategy & Markets ≥ 75 AND Regulatory ≥ 70. If OJK approves: SV +5.0% over 2 turns. High risk if governance health < 60 — MAS may not approve the cross-border exposure.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 75 },
          { domain: 'regulatoryLegal', minimumRating: 70 },
        ],
      },
      {
        id: 'sfgevent_06_b',
        label: 'Conditional approval; independent feasibility review first',
        description:
          'Approve in principle but require an independent feasibility review before committing capital. Slower, lower risk. Satisfies uncertain board members. Temasek neutral.',
        multiplier: 0.85,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 65 },
          { domain: 'financialOversight', minimumRating: 60 },
        ],
      },
      {
        id: 'sfgevent_06_c',
        label: 'Decline; focus on Singapore governance remediation',
        description:
          "Conservative choice — prioritise resolving SFG's existing governance issues before taking on new operational risk. Temasek disappointed (implicit signal). Institutional shareholders may approve. Lower risk profile.",
        multiplier: 0.65,
        competencyGates: [],
      },
      {
        id: 'sfgevent_06_d',
        label: 'Approve with reduced SGD 150m capital injection',
        description:
          "Compromise position — cap the capital at SGD 150m below OJK's minimum threshold. OJK may reject the under-capitalised application. Worst-of-both-worlds risk: no licence AND capital committed.",
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'strategy',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.5, 6.0],
        narrative:
          "OJK approves SFG's application ahead of schedule. Tan Sri Faridah Aziz and Dr. Priscilla Ho's ASEAN expertise is credited in the analyst notes as 'decisive for the board's credible application.' SFG Indonesia is launched. Growth premium starts to rebuild.",
      },
      SUCCESS: {
        svRange: [2.5, 4.0],
        narrative:
          "Application filed. OJK acknowledges receipt. Institutional shareholders respond positively to a growth story that isn't dependent on the legacy banking margins. Two quarters of implementation risk remain.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0.5],
        narrative:
          "The feasibility review recommendation is cautious. Board approves a restricted application. OJK process moves slowly. The market acknowledges the intent but questions execution confidence.",
      },
      FAILURE: {
        svRange: [-2.5, -1.5],
        narrative:
          "OJK rejects the under-capitalised application. SGD 150m is provisionally committed but the licence is refused. Raymond Tan's growth strategy is publicly questioned at the next investor briefing.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -3.5],
        narrative:
          "Full capital committed; OJK denies the application citing SFG's ongoing regulatory scrutiny from MAS as a disqualifying factor. SGD 250m is locked in escrow pending appeal. SFG's MAS relationship further strained.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ══════════════════════════════════════════════════════════
  // Q3 EVENTS — Tier 2: Structural & Reputational
  // ══════════════════════════════════════════════════════════

  // SFG-07 — MAS ESG Deadline: Sustainability Committee
  {
    id: 'sfgevent_07',
    name: 'MAS ESG Deadline: Form the Sustainability Committee',
    tier: 2,
    quarter: 'Q3',
    turn: 1,
    imageFile: 'sfgevent-07.png',
    narrativeCard:
      "MAS has formally incorporated sustainability governance into its expectations for financial institutions' boards, citing the Singapore-Asia Taxonomy and the Green Finance Action Plan. SFG's institutional investors — two of whom are signatories to the Net Zero Asset Owners Alliance — have separately written to the Nominating Committee requesting that a Sustainability Committee be established before the next AGM. Failure to do so will be cited in proxy advisor pre-AGM reports as a governance gap. The MAS deadline is a hard expectation, not a soft recommendation.",
    primaryDomain: 'esgSustainability',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.25 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'sfgevent_07_a',
        label: 'Form committee; Dr. Aiyana Krishnamurthy as Chair',
        description:
          'Appoint Dr. Aiyana Krishnamurthy as Sustainability Committee Chair. Highest ESG credibility — TCFD expert, World Bank background. Proxy advisors satisfied. Requires Dr. Aiyana in the director pool (Availability B).',
        multiplier: 1.10,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 85 }],
      },
      {
        id: 'sfgevent_07_b',
        label: 'Form committee; Ng Kok Wah as Chair',
        description:
          'Appoint Ng Kok Wah as Chair. Slightly lower external profile than Dr. Aiyana but higher Singapore Jurisdiction Score — strong MAS framework familiarity. Proxy advisors satisfied.',
        multiplier: 0.95,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 80 }],
      },
      {
        id: 'sfgevent_07_c',
        label: 'Merge sustainability oversight into AC or BRC',
        description:
          "Technically compliant but substantively inadequate. Proxy advisors will call it a tick-box response. MAS notes the structural deficiency. SV neutral short-term but AGM ammunition for minority shareholders.",
        multiplier: 0.60,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_07_d',
        label: 'Defer to next financial year with a disclosure commitment',
        description:
          "Promise to form the committee in the next year. Proxy advisors flag as inadequate. Institutional shareholders use this as AGM resolution ammunition. Temasek signals dissatisfaction.",
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'sustainability',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.0, 3.0],
        narrative:
          "Dr. Aiyana Krishnamurthy's appointment is the headline at the Singapore Governance Summit. MAS officials are seen taking notes. Two ESG-focused institutional investors increase their positions within the month.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "Sustainability Committee formed and announced. Proxy advisors remove the governance gap flag from their pre-AGM reports. Temasek signals approval via Eric Png.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "The merged oversight structure passes technical scrutiny but no one in the governance community is impressed. Proxy advisors note 'form over substance' in their reports.",
      },
      FAILURE: {
        svRange: [-2.0, -1.5],
        narrative:
          "Proxy advisors include the Sustainability Committee gap prominently in their pre-AGM reports. Minority shareholders signal they will support the tenure resolution unless board renewal is demonstrable.",
      },
      CRITICAL_FAILURE: {
        svRange: [-3.5, -2.5],
        narrative:
          "The deferral is read as institutional bad faith. Temasek sends a private signal through Eric Png that Catherine Phua will be nominated as a second Temasek representative if ESG governance is not visibly addressed. The SFG-08 event fires immediately.",
      },
    },
    isConditional: true,
    conditionDescription: 'Fires if Sustainability Committee has not been formed.',
    precondition: 'sfg_no_sustainability_committee',
  },

  // SFG-08 — Temasek Signals Concern
  {
    id: 'sfgevent_08',
    name: "Temasek Signals Concern Over Board Composition",
    tier: 2,
    quarter: 'Q3',
    turn: 2,
    imageFile: 'sfgevent-08.png',
    narrativeCard:
      "Eric Png, the Temasek nominee, has formally requested a private meeting with the Board Chair. He conveys — carefully, without explicit instruction — that Temasek's Portfolio Review Committee has noted the volume of outstanding governance issues at SFG and is considering whether to exercise its shareholder right to nominate a second board representative. Temasek's preferred additional nominee is Catherine Phua, VP at Temasek International. This is not a threat — it is a signal. In Singapore's institutional market, the difference is academic.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_08_a',
        label: 'Accelerate board reform; proactively brief Temasek on progress',
        description:
          "Board Chair meets Eric Png and presents a concrete board renewal timeline. Requires Board Chair (or new Chair) with Stakeholder ≥ 75. Temasek satisfied — second nominee not exercised.",
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_08_b',
        label: 'Invite Catherine Phua to join the board proactively',
        description:
          "Pre-empt Temasek by inviting Catherine Phua. Temasek satisfied. Catherine strengthens ESG and tech skills. But adds another non-independent director — NC composition requires careful management.",
        multiplier: 0.85,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_08_c',
        label: 'Acknowledge the signal; provide written governance roadmap',
        description:
          'Respond formally in writing with a governance progress update. Buys goodwill. Temasek defers the second nominee decision for one quarter. Moderate outcome.',
        multiplier: 0.70,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_08_d',
        label: 'Politely decline further engagement on board composition',
        description:
          "Assert the board's independence from Temasek's compositional preferences. Legally correct — but Temasek exercises the second nominee right unilaterally. Catherine Phua joins the board without player input. Board signal: governance vacuum.",
        multiplier: 0.25,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [1.5, 2.5],
        narrative:
          "Eric Png reports back to Temasek that the board is moving with purpose and credibility. The second nominee option is taken off the table for this financial year. Temasek's implied endorsement stabilises institutional confidence.",
      },
      SUCCESS: {
        svRange: [0.5, 1.5],
        narrative:
          "Temasek is satisfied for now. The second nominee right is not exercised. The board maintains control of its composition.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "Catherine Phua joins the board. Temasek's ESG and risk expectations are now internalised at the board table. The player still controls Catherine's committee assignments.",
      },
      FAILURE: {
        svRange: [-2.0, -1.5],
        narrative:
          "Temasek exercises the second nominee right unilaterally. Catherine Phua is announced via SGXNet without player sign-off. The governance community reads it as a loss of board autonomy.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.0, -3.0],
        narrative:
          "The board's refusal to engage with Temasek becomes the story. Catherine Phua joins the board and Temasek releases a public statement about 'exercising its shareholder rights to protect portfolio governance standards.' The AGM proxy war intensifies.",
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires if Helena Soong or Winston Goh still have unresolved tenure issues, or BRC reform is incomplete.',
    precondition: 'sfg_temasek_concern_active',
  },

  // SFG-09 — Minority Shareholder Requisitioned Resolution
  {
    id: 'sfgevent_09',
    name: 'Minority Shareholders Requisition EGM: Tenure Limits',
    tier: 2,
    quarter: 'Q3',
    turn: 3,
    imageFile: 'sfgevent-09.png',
    narrativeCard:
      "A coalition of minority shareholders holding 8.3% of SFG's shares — led by Aberdeen Standard Investments Asia and Eastspring Investments — has filed a requisition for an Extraordinary General Meeting. The resolution proposes that all directors who have served more than 9 years be retired at the next AGM and replaced through a public selection process. The requisition is technically valid under the Singapore Companies Act. If SFG opposes it, SFG must file a counter-statement on SGXNet within 21 days. Temasek's 34% stake cannot help here: this is a minority shareholder action that Temasek's bloc vote will not determine.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.35 },
      { domain: 'peopleCulture', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_09_a',
        label: 'Accept the resolution; commit to AGM board renewal',
        description:
          'Accept the minority resolution and commit publicly to the board renewal process. Demonstrates responsiveness. Requisition withdrawn. SFG issues a public governance commitment statement.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'sfgevent_09_b',
        label: 'Engage coalition privately; negotiate a 12-month roadmap',
        description:
          'Meet with Aberdeen Standard and Eastspring before the EGM is formally convened. Offer a credible 12-month renewal roadmap. Coalition may accept if the roadmap is genuine. Requires Stakeholder ≥ 70.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
      },
      {
        id: 'sfgevent_09_c',
        label: 'File counter-statement opposing the requisition',
        description:
          "Legal right of the company. Proxy advisors will recommend FOR the minority resolution. High reputational risk — SFG is seen fighting shareholder rights rather than addressing the underlying problem.",
        multiplier: 0.35,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
      },
      {
        id: 'sfgevent_09_d',
        label: 'Call the EGM; rely on Temasek 34% to defeat resolution',
        description:
          "Temasek votes against the minority resolution in the first tier. But this is not a two-tier vote — Temasek's bloc can determine the outcome. However, the optics are catastrophic: state shareholder vs. independent shareholders at a public EGM. SV hit regardless of vote outcome.",
        multiplier: 0.25,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 3.5],
        narrative:
          "Aberdeen Standard's lead representative issues a statement praising SFG's 'genuine and immediate response to shareholder concerns.' The EGM requisition is formally withdrawn. Governance premium begins to rebuild.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "The coalition accepts the roadmap. Requisition withdrawn. Market reads it as a board that finally got the message — or at least is good at appearing to.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "The coalition is not entirely satisfied but accepts the process. EGM is deferred for one quarter. The AGM will now carry the weight of delivering on the renewal commitment.",
      },
      FAILURE: {
        svRange: [-3.5, -2.5],
        narrative:
          "Counter-statement filed. Proxy advisors recommend FOR the minority resolution immediately. SFG is characterised in the financial press as a company fighting its own shareholders to protect an entrenched board.",
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -4.5],
        narrative:
          "The EGM is called and Temasek's 34% overrides the minority position. Aberdeen Standard issues a public statement about 'state capital undermining minority shareholder rights in Singapore's financial sector.' The MAS notes the public controversy in its supervisory file.",
      },
    },
    isConditional: true,
    conditionDescription: 'Fires if board renewal has not been publicly addressed.',
    precondition: 'sfg_renewal_not_addressed',
  },

  // ══════════════════════════════════════════════════════════
  // Q4 EVENTS — Tier 3: Crisis & Existential
  // ══════════════════════════════════════════════════════════

  // SFG-10 — CEO Conduct: Investigation Substantiated
  {
    id: 'sfgevent_10',
    name: 'CEO Conduct: Investigation Finds Related-Party Breach',
    tier: 3,
    quarter: 'Q4',
    turn: 1,
    imageFile: 'sfgevent-10.png',
    narrativeCard:
      "The independent investigation commissioned in Q2 has concluded. Raymond Tan's family trust received a 180-basis-point pricing concession on the SGD 85 million loan — a concession not available at arm's length. This is a material related-party transaction under SGX Listing Rules and must be disclosed on SGXNet. The board now faces the most consequential decision of the game: act decisively on the CEO, or accept the reputational and regulatory cost of inaction. MAS has been notified of the investigation outcome and is watching the board's response with unusual attention.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.35,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.40 },
      { domain: 'stakeholderComms', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_10_a',
        label: 'Terminate CEO immediately; disclose on SGXNet',
        description:
          "Board votes to terminate Raymond Tan with immediate effect and discloses the related-party transaction on SGXNet. Requires Board Chair with People & Culture ≥ 70 AND Regulatory ≥ 75 and at least 3 truly independent directors supporting the motion. Short-term SV hit; recovery pathway available.",
        multiplier: 1.10,
        competencyGates: [
          { domain: 'peopleCulture', minimumRating: 70 },
          { domain: 'regulatoryLegal', minimumRating: 75 },
        ],
      },
      {
        id: 'sfgevent_10_b',
        label: 'Require CEO to recuse from BCC decisions; formal censure',
        description:
          "Weaker response — CEO stays but is formally censured and recuses from Board Credit Committee decisions. Market and MAS view it as insufficient. Proxy advisors flag board lack of independence.",
        multiplier: 0.50,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_10_c',
        label: "Accept CEO's offer to resign after 3-month transition",
        description:
          "Negotiated exit. Avoids the drama of immediate termination. Market reads it as face-saving. Less disruptive but leaves question marks about governance culture and board spine.",
        multiplier: 0.70,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_10_d',
        label: "Accept CEO's private assurances; close matter internally",
        description:
          "Investigation findings have already been disclosed to MAS. Not disclosing the outcome publicly is a regulatory breach. MAS enforcement action will follow. This is the worst decision available in the game.",
        multiplier: 0.10,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'sfgevent_12',
        triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'],
        delay: 0,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3.0, 5.0],
        narrative:
          "Termination with immediate disclosure. The Business Times calls it 'the most decisive board action by a Singapore financial institution in a decade.' MAS issues a private commendation. Institutional shareholders add to their positions. The SV recovery is faster than anyone expected.",
      },
      SUCCESS: {
        svRange: [-2.0, -0.5],
        narrative:
          "CEO terminated. SGXNet disclosure made. Initial -2.0% SV hit as the related-party transaction is publicised, but recovery pathway is open. Board credibility: significantly enhanced.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3.0, -1.5],
        narrative:
          "The negotiated exit avoids the worst optics but the governance community notes the board's hesitation. MAS acknowledges the disclosure but privately questions whether the board's response was proportionate.",
      },
      FAILURE: {
        svRange: [-5.0, -3.0],
        narrative:
          "CEO retained with censure. Market reads it as the board protecting its own. MAS issues a formal supervisory letter about the board's 'inadequate response to a substantiated related-party transaction.' SFG-12 queues.",
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -8.0],
        narrative:
          "Internal closure of a substantiated related-party transaction allegation disclosed to MAS is a regulatory breach. MAS enforcement action is announced within 48 hours. Three institutional shareholders file a class action notice. SFG shares enter a circuit breaker. SFG-12 fires immediately.",
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires only if SFG-04 was resolved and investigation substantiated the allegation.',
    precondition: 'sfg_ceo_whistleblower_substantiated',
  },

  // SFG-11 — Hostile Takeover Signal: Indonesian Conglomerate
  {
    id: 'sfgevent_11',
    name: 'Hostile Signal: Indonesian Conglomerate Builds 8.7% Stake',
    tier: 3,
    quarter: 'Q4',
    turn: 2,
    imageFile: 'sfgevent-11.png',
    narrativeCard:
      "SGX filings reveal that Salim Pacific Holdings, an Indonesian conglomerate with interests in banking and property, has accumulated 8.7% of SFG's shares through a series of market purchases over 90 days. They have not disclosed their intentions. Singapore's strategic sector rules under MAS may require prior approval for stakes above 12% in financial institutions. Temasek is watching. The board must decide whether this is a passive investment, a precursor to a takeover bid, or an opportunity to find a strategic partner — and has approximately three weeks before the market moves on the story.",
    primaryDomain: 'geopoliticalMacro',
    primaryWeight: 0.35,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.35 },
      { domain: 'regulatoryLegal', weight: 0.20 },
      { domain: 'stakeholderComms', weight: 0.10 },
    ],
    strategies: [
      {
        id: 'sfgevent_11_a',
        label: 'Engage MAS proactively; invoke strategic sector protections',
        description:
          'Brief MAS immediately and invoke strategic sector protection provisions under the Banking Act. MAS aware and monitoring. Any attempt by Salim to cross 12% is blocked pending MAS review. Requires Regulatory ≥ 80.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 80 }],
      },
      {
        id: 'sfgevent_11_b',
        label: 'Engage Salim Pacific directly to understand intentions',
        description:
          'Board Chair meets Salim Pacific principals. May reveal a benign investment rationale. Risk: signals that the board is open to engagement. Requires Stakeholder ≥ 75.',
        multiplier: 0.80,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_11_c',
        label: 'Issue public statement rejecting unsolicited approaches',
        description:
          "Sends a message but has no legal force. Salim can continue purchasing up to 12% without restriction. Moderate SV signal but no substantive defence.",
        multiplier: 0.65,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_11_d',
        label: 'Explore Salim as a strategic partner for Indonesia expansion',
        description:
          "Unconventional — treat the stake-building as a partnership signal rather than a threat. High reward if it works. Extremely high risk: Temasek objects to an Indonesian state-linked shareholder; MAS scrutiny on combined stake intensifies.",
        multiplier: 1.20,
        competencyGates: [
          { domain: 'strategyMarkets', minimumRating: 80 },
          { domain: 'geopoliticalMacro', minimumRating: 75 },
        ],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 5.5],
        narrative:
          "Salim Pacific and SFG announce a strategic partnership for the Indonesia digital banking expansion. The combined stake is restructured as a strategic co-investment with MAS approval. Regional banking premium re-rates SFG's valuation upward.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "MAS engagement deters Salim from crossing 12%. The threat subsides. Board credibility: strengthened by decisive regulatory engagement.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, 0],
        narrative:
          "Public statement noted but Salim continues purchasing. Market waits for the 12% threshold to clarify the situation. Board is reactive rather than proactive.",
      },
      FAILURE: {
        svRange: [-5.0, -3.0],
        narrative:
          "Salim crosses 12% before MAS review is complete. SFG enters a governance limbo — unable to approve major transactions while the shareholding is under MAS scrutiny. CEO Raymond Tan's Indonesia expansion is effectively frozen.",
      },
      CRITICAL_FAILURE: {
        svRange: [-9.0, -6.0],
        narrative:
          "Salim Pacific announces a formal takeover interest. Temasek cannot block it under Singapore's takeover rules without MAS approval. SFG's governance weakness is the acquisition thesis. Every shortcut the board took this year is now in the bid document.",
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires only if governance health < 55 and SV index < 90.',
    precondition: 'sfg_governance_weak_sv_low',
  },

  // SFG-12 — MAS Enforcement Action: Public Censure
  {
    id: 'sfgevent_12',
    name: 'MAS Public Censure: Material Governance Deficiencies',
    tier: 3,
    quarter: 'Q4',
    turn: 3,
    imageFile: 'sfgevent-12.png',
    narrativeCard:
      "MAS has issued a public statement censuring Straits Financial Group for 'material deficiencies in board risk oversight and corporate governance.' The censure cites the Vietnam credit loss, the BRC supervisory letter, and — where applicable — the mishandling of the CEO conduct matter. This is MAS's most serious non-enforcement sanction short of formal restriction. It is published on the MAS website. Every institutional investor holding SFG shares will receive a research alert within 30 minutes. Market opens on Monday. The board has 72 hours to respond.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.40 },
      { domain: 'financialOversight', weight: 0.10 },
    ],
    strategies: [
      {
        id: 'sfgevent_12_a',
        label: 'Comprehensive remediation plan within 48 hours',
        description:
          "Board Chair and AC Chair co-publish a comprehensive remediation plan within 48 hours. Requires Board Chair with Regulatory ≥ 85 AND Stakeholder ≥ 80. Plan accepted by MAS as credible. SV recovers over 2 turns from the initial drop.",
        multiplier: 1.10,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 85 },
          { domain: 'stakeholderComms', minimumRating: 80 },
        ],
      },
      {
        id: 'sfgevent_12_b',
        label: 'Emergency board meeting; appoint external governance advisor',
        description:
          "Slower — emergency board meeting called, external governance advisor appointed, plan published by day 5. SV damage mounts daily but the plan is more thorough. Moderate recovery.",
        multiplier: 0.75,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 75 },
          { domain: 'financialOversight', minimumRating: 65 },
        ],
      },
      {
        id: 'sfgevent_12_c',
        label: "Dispute MAS's characterisation of events",
        description:
          "Dispute the MAS public censure statement publicly. Extremely high risk — disputing a MAS public censure is almost never effective for Singapore financial institutions. MAS may escalate to formal enforcement.",
        multiplier: 0.20,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 90 }],
      },
      {
        id: 'sfgevent_12_d',
        label: 'No coordinated response; directors speak independently',
        description:
          "Board fails to coordinate. Individual directors make statements to the press contradicting each other. MAS considers whether to use its powers to remove directors under MAS Act s.49.",
        multiplier: 0.05,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: null,
    committeeBonusValue: 0,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [-2.0, -1.0],
        narrative:
          "The remediation plan is published at 7am Monday before market open. MAS acknowledges it publicly as 'comprehensive.' The initial SV drop stabilises. Recovery pathway is clear — implementation will determine the final trajectory.",
      },
      SUCCESS: {
        svRange: [-4.0, -2.5],
        narrative:
          "Plan published. MAS accepts it as credible. SV decline moderates. The governance story shifts from crisis to remediation — which, in Singapore, counts for something.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-5.5, -4.0],
        narrative:
          "External governance advisor engaged. MAS awaits the plan. Market damage accumulates daily. The eventual plan is credible but the slow start costs SFG additional SV points.",
      },
      FAILURE: {
        svRange: [-9.0, -7.0],
        narrative:
          "Disputed MAS censure statement. MAS escalates to formal enforcement proceedings. SFG is now subject to MAS Act s.49 director removal review. Three board members receive personal notices.",
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -10.0],
        narrative:
          "Board fragmentation in public. Disarray is the headline. MAS convenes an emergency supervisory panel. SFG shares enter a trading halt pending disclosure of the MAS enforcement scope. Directors are individually contacted by MAS about their personal regulatory obligations.",
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires only if BRC reform was not completed by Q3, OR CEO conduct matter was critically mishandled.',
    precondition: 'sfg_enforcement_precondition',
  },

  // SFG-13 — AGM: Proxy War on Board Independence
  {
    id: 'sfgevent_13',
    name: 'AGM: Contested Resolutions on Board Independence',
    tier: 3,
    quarter: 'AGM',
    turn: 1,
    imageFile: 'sfgevent-13.png',
    narrativeCard:
      "SFG's AGM has three potentially contested resolutions. Resolution 1: Re-election of Helena Soong as independent director (two-tier vote required under SGX rules). Resolution 2: Advisory vote on the remuneration report. Resolution 3 (conditional): The minority-requisitioned resolution on tenure limits, if not withdrawn. Glass Lewis Asia recommends AGAINST Resolution 1. ISS recommends FOR if a board renewal roadmap was disclosed. Temasek's 34% carries weight in Tier 1 — but is entirely excluded from Tier 2. The player's choices through the year now face their ultimate test.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'sfgevent_13_a',
        label: 'Engage proxy advisors proactively; disclose board renewal',
        description:
          "Directly engage Glass Lewis Asia and ISS before the AGM with specific board renewal commitments and timelines. Requires Stakeholder ≥ 75. ISS flips to FOR on Resolution 1. Both vote tiers pass.",
        multiplier: 1.05,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_13_b',
        label: 'Rely on retail shareholder base; no proxy engagement',
        description:
          "Depend on SFG's retail shareholder base and Temasek's Tier 1 vote without active proxy advisor engagement. Risky: if institutional block votes against, both tiers may fail in the minority vote.",
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'sfgevent_13_c',
        label: 'Withdraw Resolution 1; retire Helena Soong before AGM',
        description:
          "Avoid the proxy war entirely — Helena exits with dignity before the AGM. Board renewal narrative takes hold. No two-tier vote required. Clean AGM. Lower SV upside but no downside risk from vote.",
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_13_d',
        label: 'Let the AGM votes fall as they may',
        description:
          "If the board's governance work through Year 1 has been strong, the resolutions may pass regardless. If not — a public AGM defeat on the independence vote is a significant governance marker that will define Year 2.",
        multiplier: 0.75,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3.5, 5.0],
        narrative:
          "Both tiers of Resolution 1 pass. The remuneration report receives 92% approval. The minority resolution (if requisitioned) is withdrawn before the vote. Glass Lewis Asia revises their pre-AGM recommendation to FOR. The AGM closes with SFG's governance narrative decisively rewritten.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "All resolutions pass. The AGM is orderly. Institutional shareholders acknowledge the board's year-one governance work. Recovery story credibly launched.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, 0],
        narrative:
          "Helena retires before the AGM vote, avoiding the contested resolution. Clean optics but the market notes the board still hasn't replaced two chairs and the renewal roadmap is aspirational rather than executed.",
      },
      FAILURE: {
        svRange: [-4.0, -2.5],
        narrative:
          "Tier 2 of Resolution 1 fails. Helena cannot be re-elected as independent. The remuneration vote passes but only barely. The AGM is called a 'partial defeat' by governance media. Three analysts downgrade governance scores.",
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -5.0],
        narrative:
          "Tier 1 and Tier 2 both fail. The minority resolution passes on the back of Glass Lewis and ISS voting with the coalition. Helena's attempted re-election becomes one of the most-cited governance failures in Singapore institutional history. The MAS notes the AGM outcome in its annual corporate governance review.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-14 — Digital Banking Competitor Launches
  {
    id: 'sfgevent_14',
    name: 'Digital Banking Threat: GXS Bank Targets SFG SME Clients',
    tier: 2,
    quarter: 'Q4',
    turn: 3,
    imageFile: 'sfgevent-14.png',
    narrativeCard:
      "GXS Bank (Grab Financial's Singapore digital bank) has launched its first business banking product targeting SMEs — a segment that generates 18% of SFG's net interest income. GXS's digital onboarding takes 7 minutes vs. SFG's current 4-day process. Three analyst reports have cut SFG's revenue growth forecast by 1.5–2.0%, citing digital disruption risk. The board must respond with a credible strategic investment in technology modernisation or an acquisition play — or accept the narrative that SFG is a legacy institution ceding ground to fintech.",
    primaryDomain: 'technologyDigital',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'strategyMarkets', weight: 0.35 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'sfgevent_14_a',
        label: 'Approve SGD 180m core banking modernisation programme',
        description:
          'Board approves a full core banking modernisation investment. Requires Technology & Digital ≥ 75. Long-term structural fix. SV -0.5% short term on capital commitment; +2.5% over 2 turns as analyst upgrades follow the technology story.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'technologyDigital', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_14_b',
        label: 'Acquire a Singapore fintech with digital onboarding capability',
        description:
          'Approve a fintech acquisition play. Requires Strategy & Markets ≥ 75. Faster than organic but carries integration risk. SV +1.5% on announcement if the acquisition target is credible.',
        multiplier: 0.95,
        competencyGates: [{ domain: 'strategyMarkets', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_14_c',
        label: 'Partner with technology vendor; no capital commitment',
        description:
          "Low-cost, low-impact. Analysts are unimpressed with a partnership that doesn't commit SFG to structural change. Short-term governance posture only.",
        multiplier: 0.60,
        competencyGates: [{ domain: 'technologyDigital', minimumRating: 55 }],
      },
      {
        id: 'sfgevent_14_d',
        label: "Monitor competitive impact; decide next year",
        description:
          "Passive response. Analysts and investors read passivity as strategic failure in a digital transition that is already happening. SFG's NII compression will be cited in every Year 2 analyst note.",
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'strategy',
    committeeBonusValue: 15,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2.5, 3.5],
        narrative:
          "The core banking modernisation programme is approved and announced with Dr. Priscilla Ho and Samuel Ong prominently named as board technology oversight leads. Analysts upgrade SFG to a 'digital transformation' thesis. GXS's competitive advantage narrows in forecasts.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "Board approves the technology investment. Market reads it as a credible response to digital competition. SFG's technology governance score improves.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "Vendor partnership announced. Analysts note it as 'necessary but insufficient.' SFG continues to cede NII ground to GXS while the structural fix is deferred.",
      },
      FAILURE: {
        svRange: [-2.5, -1.5],
        narrative:
          "SFG announces it is 'monitoring the situation.' Two analysts immediately downgrade the stock. GXS captures 3% of SFG's SME book in the quarter. The board technology gap is cited as a governance risk in every research note.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.5, -3.0],
        narrative:
          "Passive response interpreted as strategic paralysis. A third analyst initiates coverage with a sell rating citing 'board failure to respond to structural digital disruption.' SFG's SME NII decline accelerates beyond analyst consensus forecasts.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-15 — Chair Succession: Dato' Lim's Exit
  {
    id: 'sfgevent_15',
    name: "Chair Succession: Dato' Lim Steps Down",
    tier: 2,
    quarter: 'Q4',
    turn: 1,
    imageFile: 'sfgevent-15.png',
    narrativeCard:
      "Dato' Lim Boon Kiat has privately informed the Nominating Committee that he intends to step down at the AGM, citing personal reasons. This is not yet public. The board has a six-week window to identify and appoint a successor before the AGM announcement. The market has been expecting this change — Dato' Lim's dual Chair/BRC role has been a persistent governance concern that the MAS supervisory letter made explicit. The choice of successor will be read as a definitive signal of the board's reform intentions. Temasek has not indicated a preference but will be watching very carefully.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.35,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.35 },
    ],
    strategies: [
      {
        id: 'sfgevent_15_a',
        label: 'Appoint Rajan Sethupathi as new Board Chair',
        description:
          "Appoint Rajan Sethupathi — former CEO of Standard Chartered Singapore — as new Board Chair. Requires Rajan in pool (Availability C — search firm required). The highest credibility signal available. MAS and Temasek both respond positively. +1.5% SV on announcement — the credibility premium is immediate.",
        multiplier: 1.20,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 85 },
          { domain: 'regulatoryLegal', minimumRating: 70 },
        ],
      },
      {
        id: 'sfgevent_15_b',
        label: 'Appoint BG Abdul Rashid as Board Chair',
        description:
          "Appoint Brigadier-General Abdul Rashid — governance specialist and INSEAD faculty. Solid governance background, respected in Singapore civil society. Lower market excitement than Rajan but genuine reform credentials.",
        multiplier: 0.90,
        competencyGates: [
          { domain: 'peopleCulture', minimumRating: 75 },
          { domain: 'stakeholderComms', minimumRating: 75 },
        ],
      },
      {
        id: 'sfgevent_15_c',
        label: 'Elevate Helena Soong from SID to Chair',
        description:
          "Continuity pick — Helena takes the Chair while the independence question is unresolved. Proxy advisors will flag this immediately. Tenure issue compounds the Chair independence concern.",
        multiplier: 0.45,
        competencyGates: [],
      },
      {
        id: 'sfgevent_15_d',
        label: 'Leave Chair search ongoing at AGM announcement',
        description:
          "Announce the departure without naming a successor. Public governance vacuum at Board Chair level. Glass Lewis Asia will cite the vacant Chair as an AGM concern. Market reads absence of a named successor as lack of board planning.",
        multiplier: 0.25,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4.0, 5.5],
        narrative:
          "Rajan Sethupathi is named Board Chair. 'Dream team' analyst coverage follows within 24 hours — Rajan as Chair, Lee Siew Geok on Audit Committee. MAS privately signals approval. SFG's governance transformation story is complete.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "New Chair named. Board renewal narrative credibly launched. Market upgrades its assessment of SFG's governance trajectory. Temasek signals quiet approval through Eric Png.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "Helena elevated — the market reads it as a continuity choice rather than a reform signal. Proxy advisors immediately flag the tenure concern. The AGM proxy war intensifies.",
      },
      FAILURE: {
        svRange: [-3.0, -2.0],
        narrative:
          "Board Chair vacant at AGM announcement. Glass Lewis Asia uses the vacancy as their lead governance finding. Institutional shareholders demand timeline commitments on Chair appointment before the AGM.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.5, -4.0],
        narrative:
          "Chair vacancy and AGM coincide. SFG enters its most important shareholder meeting without a named Board Chair successor. Minority shareholders demand an emergency board review. The AGM proxy war fires at maximum intensity.",
      },
    },
    isConditional: true,
    conditionDescription:
      "Fires if Dato' Lim is still Board Chair and the BRC dual-role has not been resolved.",
    precondition: 'sfg_lim_chair_unresolved',
  },
];
