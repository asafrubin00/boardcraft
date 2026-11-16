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
        requires: { candidateAvailable: 'sfgdir_06_lee' },
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
        requires: { directorSeated: 'sfgdir_04_rahman' },
      },
      {
        id: 'sfgevent_01_d',
        label: 'Request a 30-day extension from MAS',
        description:
          'Buy time while conducting a search. Signals governance weakness. Market rumours intensify.',
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
          "The appointment was on the wires before market open. MAS closed the supervisory notice the same day. Two institutional analysts upgraded their governance score for SFG within 24 hours.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "A credible appointment is made and the MAS notice closes. The governance community acknowledges the response as appropriate, if not inspired.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "MAS gives the board more time, but the market reads the slow response as a symptom of a board that still doesn't move with urgency. The seat is still empty and the clock is running.",
      },
      FAILURE: {
        svRange: [-2.5, -2.0],
        narrative:
          "The seat stays empty. SFG is required to make an SGXNet disclosure of the AC Chair vacancy, and Glass Lewis Asia flags it in their pre-AGM report.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -4.0],
        narrative:
          "The seat stays empty and MAS escalates to a formal supervisory letter. The Business Times runs the SGXNet disclosure under the headline 'SFG Board Fails Basic Governance Test.'",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // SFG-02 — The nine-year rule (SGX Listing Rule 210(5)(d)(iv): a hard cap since 2023; the old two-tier vote no longer exists)
  {
    id: 'sfgevent_02',
    name: "The Nine-Year Rule: Helena Soong's Independence",
    tier: 1,
    quarter: 'Q1',
    turn: 2,
    imageFile: 'sfgevent-02.png',
    narrativeCard:
      "Helena Soong has sat on this board for ten years. Under SGX Listing Rule 210(5)(d)(iv), a director who has served more than nine years can no longer be called independent, and since 2023 there is no shareholder vote that can change that. Yet the annual report still lists her as Senior Independent Director, a role that only an independent director can hold. The Nominating Committee has to decide what to do before SGX RegCo or a proxy adviser decides for it. Glass Lewis Asia has already signalled that it will recommend against her re-election unless the board publishes a concrete renewal plan. Temasek's 34% can carry an ordinary resolution almost on its own, which is exactly what the minority institutions are afraid of.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.35 },
      { domain: 'peopleCulture', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'sfgevent_02_a',
        label: "Redesignate Helena as non-independent and publish a renewal roadmap",
        description:
          "Helena stays on the board as a non-independent director and gives up the Senior Independent Director role. The board publishes a renewal roadmap with a named succession timeline. Requires Regulatory ≥ 65 AND Stakeholder ≥ 65.",
        multiplier: 1.00,
        competencyGates: [
          { domain: 'regulatoryLegal', minimumRating: 65 },
          { domain: 'stakeholderComms', minimumRating: 65 },
        ],
      },
      {
        id: 'sfgevent_02_b',
        label: "Redesignate Helena as non-independent; say nothing more",
        description:
          "Do what the rule requires and no more. Helena stays as a non-independent director, and nothing is said about who succeeds her or when. The proxy advisers will notice the silence.",
        multiplier: 0.60,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 55 }],
      },
      {
        id: 'sfgevent_02_c',
        label: 'Retire Helena Soong immediately',
        description:
          "A clean break. Helena steps down with an agreed handover. Requires People & Culture ≥ 60 to manage the transition sensitively. The board loses her institutional knowledge.",
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 60 }],
      },
      {
        id: 'sfgevent_02_d',
        label: "Do nothing; keep describing Helena as independent",
        description:
          "Leave the annual report as it is and hope nobody raises it. This is a breach of the listing rules, and it hands the proxy advisers their headline for the AGM.",
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
          "The independence question is settled cleanly. Glass Lewis withdraws its against recommendation, and Aberdeen Standard Investments Asia publicly praises the board's 'rare and refreshing transparency'.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "The board's handling of the independence question is accepted. Proxy advisors acknowledge the commitment to board renewal.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "The board gets through, but only just - a warning shot. The institutional message is clear: the board has until the AGM to demonstrate meaningful renewal.",
      },
      FAILURE: {
        svRange: [-3.0, -2.5],
        narrative:
          "Minority shareholders reject the board's position on independence. Institutional shareholders send a joint letter requesting emergency meetings.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.5, -4.5],
        narrative:
          "The board's position on independence collapses. MAS notes the outcome in its supervisory file, and minority shareholders begin to organise.",
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
          "The Business Times rewrites the story as a governance turnaround rather than a pay scandal.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "Institutional shareholders acknowledge the Remuneration Committee's response as credible.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "The board's response buys time but the market reads it as delay. Glass Lewis Asia notes the absence of clawback provisions in their pre-AGM report regardless.",
      },
      FAILURE: {
        svRange: [-2.5, -2.0],
        narrative:
          "The CEO's pay structure becomes the dominant governance story for the quarter, drowning out SFG's recovery messaging on the Vietnam portfolio.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.5, -3.5],
        narrative:
          "Documents on the CEO's pay arrangements reach The Business Times. MAS opens a review under its Notice on Corporate Governance.",
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
          'AC Chair commissions a Big 4 investigation — clean, auditable, MAS-friendly. Requires AC Chair with Regulatory ≥ 75 AND Financial Oversight ≥ 70. Investigation is credible.',
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
          "Seek external legal advice on whether the transaction meets SGXNet disclosure thresholds before deciding. If delay is seen as covering up, MAS takes a very dim view.",
        multiplier: 0.45,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_04_d',
        label: 'Brief Temasek nominee privately before deciding',
        description:
          "Non-standard process. Briefing Temasek's nominee before the board has formed a view is a governance protocol breach — it positions Temasek above the board in the decision chain.",
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
          "The board's handling of the allegation is publicly praised as the correct governance response. The market reads it as a board that takes its oversight function seriously.",
      },
      SUCCESS: {
        svRange: [0.5, 1.5],
        narrative:
          "The process is credible and the board's role in it is unambiguous. What it finds will decide what happens to the CEO.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "The matter is in hand, but the independence of the process is already being questioned. Analysts note that the board moved slowly.",
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
          "MAS issues a private acknowledgement that the board's response was 'substantive and appropriate.' Institutional shareholders withdraw their requisitioned resolution.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "BRC reform is under way. MAS is not fully satisfied but closes the supervisory inquiry for now. The institution rebuilds credibility one committee meeting at a time.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "MAS accepts the board's timeline but signals that outcomes matter - not process. Institutional shareholders hold their resolution in reserve.",
      },
      FAILURE: {
        svRange: [-4.0, -3.0],
        narrative:
          "The MAS supervisory panel is unconvinced. Its chair states publicly that SFG's BRC governance 'does not meet the expectations of MAS for financial institutions of this scale.' Enforcement action is now a live risk.",
      },
      CRITICAL_FAILURE: {
        svRange: [-8.0, -6.0],
        narrative:
          "MAS announces a formal review under the Banking Act. SFG shares fall 6% on open. Dato' Lim's dual role is named explicitly in the MAS statement.",
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
          'Board approves the full SGD 250m capital injection and files immediately. Requires Strategy & Markets ≥ 75 AND Regulatory ≥ 70. High risk if governance health < 60 — MAS may not approve the cross-border exposure.',
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
          "The board's call on Indonesia is vindicated ahead of schedule. Analysts credit the ASEAN expertise around the board table, and the growth premium starts to rebuild.",
      },
      SUCCESS: {
        svRange: [2.5, 4.0],
        narrative:
          "Institutional shareholders respond positively to the board's decision on Indonesia. Two quarters of execution risk remain.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0.5],
        narrative:
          "The market acknowledges the board's intent on Indonesia but questions its confidence in execution.",
      },
      FAILURE: {
        svRange: [-2.5, -1.5],
        narrative:
          "The board's decision on Indonesia backfires. Raymond Tan's growth strategy is publicly questioned at the next investor briefing.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.0, -3.5],
        narrative:
          "The Indonesia decision goes badly wrong, and SFG's ongoing scrutiny from MAS is cited as part of the reason. The MAS relationship is further strained.",
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
    // NOTE: neither strategy below has a board-mutation effect wired in page.tsx —
    // resolving this event never actually seats Krishnamurthy/Ng anywhere, so the
    // requires gate only enforces narrative consistency, not a real appointment.
    // Pre-existing type-C gap (stale display state); out of scope here, but a
    // future board-mutation pass should start with these two.
    strategies: [
      {
        id: 'sfgevent_07_a',
        label: 'Form committee; Dr. Aiyana Krishnamurthy as Chair',
        description:
          'Appoint Dr. Aiyana Krishnamurthy as Sustainability Committee Chair. Highest ESG credibility — TCFD expert, World Bank background. Proxy advisors satisfied. Requires Dr. Aiyana in the director pool (Availability B).',
        multiplier: 1.10,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 85 }],
        // Recruit-from-pool shape ("in the director pool"), not promote-existing —
        // available means NOT currently seated, opposite of directorSeated.
        requires: { candidateAvailable: 'sfgdir_16_krishnamurthy' },
      },
      {
        id: 'sfgevent_07_b',
        label: 'Form committee; Ng Kok Wah as Chair',
        description:
          'Appoint Ng Kok Wah as Chair. Slightly lower external profile than Dr. Aiyana but higher Singapore Jurisdiction Score — strong MAS framework familiarity. Proxy advisors satisfied.',
        multiplier: 0.95,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 80 }],
        requires: { candidateAvailable: 'sfgdir_17_ng' },
      },
      {
        id: 'sfgevent_07_c',
        label: 'Merge sustainability oversight into AC or BRC',
        description:
          "Technically compliant but substantively inadequate. Proxy advisors will call it a tick-box response. MAS notes the structural deficiency.",
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
          "The board's move on sustainability governance is the talk of the Singapore Governance Summit. Two ESG-focused institutional investors increase their positions within the month.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "Proxy advisors remove the sustainability governance flag from their pre-AGM reports. Temasek signals approval via Eric Png.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "The arrangement passes technical scrutiny but no one in the governance community is impressed. Proxy advisors note 'form over substance' in their reports.",
      },
      FAILURE: {
        svRange: [-2.0, -1.5],
        narrative:
          "Proxy advisors include the Sustainability Committee gap prominently in their pre-AGM reports. Minority shareholders signal they will support the tenure resolution unless board renewal is demonstrable.",
      },
      CRITICAL_FAILURE: {
        svRange: [-3.5, -2.5],
        narrative:
          "The board's response is read as institutional bad faith. Temasek signals through Eric Png that it is prepared to nominate a second representative if ESG governance is not visibly addressed.",
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
      "Eric Png, the Temasek nominee, has formally requested a private meeting with the Board Chair. He conveys — carefully, without explicit instruction — that Temasek's Portfolio Review Committee has noted an unresolved governance question at SFG and is considering whether to exercise its shareholder right to nominate a second board representative. Temasek's preferred additional nominee is Catherine Phua, VP at Temasek International. This is not a threat — it is a signal. In Singapore's institutional market, the difference is academic.",
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
          "Temasek holds off for now, but its ESG and risk expectations are on the record and the question of a second nominee has not gone away.",
      },
      FAILURE: {
        svRange: [-2.0, -1.5],
        narrative:
          "Temasek exercises the second nominee right unilaterally. Catherine Phua is announced via SGXNet without the board's sign-off. The governance community reads it as a loss of board autonomy.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.0, -3.0],
        narrative:
          "The board's handling of Temasek becomes the story. Catherine Phua joins the board, and Temasek releases a public statement about 'exercising its shareholder rights to protect portfolio governance standards.'",
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
          "Temasek votes against the minority resolution, and its bloc can decide the outcome on its own. However, the optics are catastrophic: state shareholder vs. independent shareholders at a public EGM.",
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
          "Proxy advisors recommend FOR the minority resolution. SFG is characterised in the financial press as a company fighting its own shareholders to protect an entrenched board.",
      },
      CRITICAL_FAILURE: {
        svRange: [-6.0, -4.5],
        narrative:
          "The minority coalition is defeated but not answered. Aberdeen Standard issues a public statement about 'state capital undermining minority shareholder rights', and MAS notes the controversy in its supervisory file.",
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
          "Board votes to terminate Raymond Tan with immediate effect and discloses the related-party transaction on SGXNet. Requires Board Chair with People & Culture ≥ 70 AND Regulatory ≥ 75 and at least 3 truly independent directors supporting the motion.",
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
          "The Business Times calls it 'the most decisive board action by a Singapore financial institution in a decade.' MAS issues a private commendation and institutional shareholders add to their positions.",
      },
      SUCCESS: {
        svRange: [-2.0, -0.5],
        narrative:
          "The board's response is accepted as proportionate. There is an initial hit as the related-party transaction is publicised, but the recovery pathway is open.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3.0, -1.5],
        narrative:
          "The worst optics are avoided, but the governance community notes the board's hesitation. MAS privately questions whether the response was proportionate.",
      },
      FAILURE: {
        svRange: [-5.0, -3.0],
        narrative:
          "The market reads the board's response as protecting its own. MAS issues a formal supervisory letter about the board's 'inadequate response to a substantiated related-party transaction.'",
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -8.0],
        narrative:
          "MAS treats the board's handling of a substantiated breach as a regulatory failure in its own right. Enforcement action is announced within 48 hours, and three institutional shareholders file a class action notice.",
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
          "Sends a message but has no legal force. Salim can continue purchasing up to 12% without restriction.",
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
          "The Salim stake is turned from a threat into an asset, with MAS on side. The market re-rates SFG's valuation upward.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "Salim stops short of 12%. The threat subsides, and the board's credibility is strengthened by how it handled it.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, 0],
        narrative:
          "Salim keeps buying. The market waits for the 12% threshold to clarify the situation, and the board looks reactive rather than proactive.",
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
          "Board Chair and AC Chair co-publish a comprehensive remediation plan within 48 hours. Requires Board Chair with Regulatory ≥ 85 AND Stakeholder ≥ 80. Plan accepted by MAS as credible.",
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
          "Slower — emergency board meeting called, external governance advisor appointed, plan published by day 5. Moderate recovery.",
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
          "MAS publicly acknowledges the board's response as 'comprehensive.' The share price stabilises. Implementation will decide the rest.",
      },
      SUCCESS: {
        svRange: [-4.0, -2.5],
        narrative:
          "MAS accepts the board's response as credible. The governance story shifts from crisis to remediation - which, in Singapore, counts for something.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-5.5, -4.0],
        narrative:
          "MAS is still waiting for something it can accept, and market damage accumulates daily. The slow start costs SFG more than it needed to.",
      },
      FAILURE: {
        svRange: [-9.0, -7.0],
        narrative:
          "MAS escalates to formal enforcement proceedings. SFG is now subject to a director removal review, and three board members receive personal notices.",
      },
      CRITICAL_FAILURE: {
        svRange: [-12.0, -10.0],
        narrative:
          "Disarray is the headline. MAS convenes an emergency supervisory panel, SFG shares are halted, and directors are contacted individually about their personal regulatory obligations.",
      },
    },
    isConditional: true,
    conditionDescription:
      'Fires only if BRC reform was not completed by Q3, OR CEO conduct matter was critically mishandled.',
    precondition: 'sfg_enforcement_precondition',
  },

  // SFG-13 — AGM: the board renewal vote
  {
    id: 'sfgevent_13',
    name: "AGM: Board Renewal on the Ballot",
    tier: 3,
    quarter: 'AGM',
    turn: 1,
    imageFile: 'sfgevent-13.png',
    narrativeCard:
      "SFG's AGM has three resolutions that could go either way. Resolution 1: the re-election of directors, including anyone who has served more than nine years and can now only stand as a non-independent director. Resolution 2: MAS compliance and governance disclosures. Resolution 3: executive remuneration. Glass Lewis Asia recommends AGAINST Resolution 1 unless a board renewal roadmap has been published. Temasek's 34% counts for a great deal on an ordinary resolution, and the minority institutions know it. The choices made through the year now face their test.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'peopleCulture', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.30 },
    ],
    strategies: [
      {
        id: 'sfgevent_13_a',
        label: "Publish a board renewal roadmap; engage the proxy advisers",
        description:
          "Go to Glass Lewis Asia and ISS before the meeting with specific renewal commitments and dates. Requires Stakeholder ≥ 75.",
        multiplier: 1.05,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_13_b',
        label: "Rely on Temasek's 34%; no proxy engagement",
        description:
          "Count on Temasek and the retail holders to carry the resolutions without talking to the proxy advisers. Risky: the minority institutions will read it as the state shareholder overriding them.",
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'sfgevent_13_c',
        label: "Helena Soong stands down before the AGM",
        description:
          "Take the fight off the ballot. Helena leaves with dignity before the meeting, and the renewal story takes hold.",
        requires: { directorSeated: 'sfgdir_02_soong' },
        multiplier: 0.90,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 65 }],
      },
      {
        id: 'sfgevent_13_d',
        label: 'Let the AGM votes fall as they may',
        description:
          "If the board's governance work through Year 1 has been strong, the resolutions may pass regardless. If not — a public AGM defeat on director re-elections is a significant governance marker that will define Year 2.",
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
          "Every contested resolution goes the board's way, with the remuneration report at 92%. Glass Lewis Asia revises its recommendation, and the AGM closes with SFG's governance narrative decisively rewritten.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "All resolutions pass. The AGM is orderly. Institutional shareholders acknowledge the board's year-one governance work. Recovery story credibly launched.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, 0],
        narrative:
          "The AGM passes without a public defeat, but the market notes that the renewal roadmap is still aspirational rather than executed.",
      },
      FAILURE: {
        svRange: [-4.0, -2.5],
        narrative:
          "The minority institutions vote against the director slate in numbers, and the remuneration vote passes only barely. Governance media call the AGM a 'partial defeat'.",
      },
      CRITICAL_FAILURE: {
        svRange: [-7.0, -5.0],
        narrative:
          "The board loses the director re-elections and the minority resolution. The AGM becomes one of the most-cited governance failures in Singapore institutional history.",
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
    quarter: 'Q1',
    turn: 4,
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
          'Board approves a full core banking modernisation investment. Requires Technology & Digital ≥ 75. Long-term structural fix.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'technologyDigital', minimumRating: 75 }],
      },
      {
        id: 'sfgevent_14_b',
        label: 'Acquire a Singapore fintech with digital onboarding capability',
        description:
          'Approve a fintech acquisition play. Requires Strategy & Markets ≥ 75. Faster than organic but carries integration risk.',
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
          "Analysts upgrade SFG to a 'digital transformation' thesis, and GXS's competitive advantage narrows in their forecasts.",
      },
      SUCCESS: {
        svRange: [1.0, 2.0],
        narrative:
          "The market reads the board's decision as a credible response to digital competition. SFG's technology governance score improves.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-0.5, 0],
        narrative:
          "Analysts call the board's response 'necessary but insufficient.' SFG continues to cede ground to GXS while the structural fix waits.",
      },
      FAILURE: {
        svRange: [-2.5, -1.5],
        narrative:
          "Two analysts downgrade the stock. GXS captures 3% of SFG's SME book in the quarter, and the board's technology gap is cited as a governance risk in every research note.",
      },
      CRITICAL_FAILURE: {
        svRange: [-4.5, -3.0],
        narrative:
          "The board's response is read as strategic paralysis. A third analyst initiates coverage with a sell rating, and the decline in SME income accelerates beyond consensus forecasts.",
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
    quarter: 'Q2',
    turn: 4,
    imageFile: 'sfgevent-15.png',
    narrativeCard:
      "Dato' Lim Boon Kiat has privately informed the Nominating Committee that he intends to step down at the AGM, citing personal reasons. This is not yet public. The board has a six-week window to identify and appoint a successor before the AGM announcement. The market has been expecting this change — Dato' Lim's dual Chair/BRC role has been a persistent governance concern that the MAS supervisory letter made explicit. The choice of successor will be read as a definitive signal of the board's reform intentions. Temasek has not indicated a preference but will be watching very carefully.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.35,
    secondaryDomains: [
      { domain: 'regulatoryLegal', weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.35 },
    ],
    // NOTE: none of the three strategies below have a board-mutation effect wired
    // in page.tsx — resolving this event never actually seats anyone as Chair, so
    // these requires gates only enforce narrative consistency, not a real
    // appointment. Pre-existing type-C gap; out of scope here, but a future
    // board-mutation pass should start with these three.
    strategies: [
      {
        id: 'sfgevent_15_a',
        label: 'Appoint Rajan Sethupathi as new Board Chair',
        description:
          "Appoint Rajan Sethupathi — former CEO of Standard Chartered Singapore — as new Board Chair. Requires Rajan in pool (Availability C — search firm required). The highest credibility signal available. MAS and Temasek both respond positively.",
        multiplier: 1.20,
        competencyGates: [
          { domain: 'stakeholderComms', minimumRating: 85 },
          { domain: 'regulatoryLegal', minimumRating: 70 },
        ],
        requires: { candidateAvailable: 'sfgdir_26_rajan' },
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
        requires: { candidateAvailable: 'sfgdir_19_rashid' },
      },
      {
        id: 'sfgevent_15_c',
        label: 'Elevate Helena Soong from SID to Chair',
        description:
          "Continuity pick — Helena takes the Chair while the independence question is unresolved. Proxy advisors will flag this immediately. Tenure issue compounds the Chair independence concern.",
        multiplier: 0.45,
        competencyGates: [],
        // Seatedness alone isn't enough — the narrative specifically claims she's
        // moving *from SID*, so this is false if she's seated as a plain NED.
        requires: { directorHoldsRole: { directorId: 'sfgdir_02_soong', role: 'sid' } },
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
          "The new Chair is named, and 'dream team' analyst coverage follows within 24 hours. MAS privately signals approval. SFG's governance transformation story has its figurehead.",
      },
      SUCCESS: {
        svRange: [1.5, 3.0],
        narrative:
          "New Chair named. Board renewal narrative credibly launched. Market upgrades its assessment of SFG's governance trajectory. Temasek signals quiet approval through Eric Png.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1.0, -0.5],
        narrative:
          "The market reads the board's answer on the chair as continuity rather than reform. Proxy advisors flag it immediately.",
      },
      FAILURE: {
        svRange: [-3.0, -2.0],
        narrative:
          "Board Chair vacant at AGM announcement. Glass Lewis Asia uses the vacancy as their lead governance finding. Institutional shareholders demand timeline commitments on Chair appointment before the AGM.",
      },
      CRITICAL_FAILURE: {
        svRange: [-5.5, -4.0],
        narrative:
          "Chair vacancy and AGM coincide. SFG enters its most important shareholder meeting without a named Board Chair successor. Minority shareholders demand an emergency board review.",
      },
    },
    isConditional: true,
    conditionDescription:
      "Fires if Dato' Lim is still Board Chair and the BRC dual-role has not been resolved.",
    precondition: 'sfg_lim_chair_unresolved',
  },
];
