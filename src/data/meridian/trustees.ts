// ── Meridian Foundation - Trustee Pool ──
// 5 inherited trustees + 12 Meridian-specific candidates
// 8 cross-listed directors are referenced by their existing dir_/vdir_ IDs (no entry needed here)
// All annualFee values are £0 — trustees are unpaid volunteers (expenses only)

import type { Director } from '@/types/game';

export const meridianTrustees: Director[] = [

  // ═══════════════════════════════════════════════════════
  // INHERITED TRUSTEES (already on board at game start)
  // ═══════════════════════════════════════════════════════

  // 1. Hon. Patricia Mensah — Chair (7 years)
  {
    id: 'mdir_mensah',
    name: 'Hon. Patricia Mensah',
    background:
      "Former FCDO senior civil servant; board chair for 7 years. Competent administrator with strong institutional networks. Has allowed governance drift through avoidance of confrontation with Dr. Osei-Bonsu. Approaching the Charity Governance Code's recommended 9-year maximum tenure.",
    domainRatings: {
      financialOversight:  62,
      regulatoryLegal:     75,
      strategyMarkets:     63,
      peopleCulture:       56,
      esgSustainability:   61,
      geopoliticalMacro:   80,
      technologyDigital:   30,
      stakeholderComms:    74,
    },
    jurisdictionScores: { UK: 88 },
    independence: 'questionable', // long tenure; reluctance to challenge founder
    tenure: 7,
    tenureYears: 7,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "Approaching 9-year tenure limit (Charity Governance Code recommendation). Her reluctance to confront Osei-Bonsu means Events 03 and 09 cannot achieve Critical Success while she remains chair, unless another trustee formally seconds the challenge motion.",
      activationProbability: 0.8,
      triggerCategories: ['regulatoryLegal', 'stakeholderComms'],
      activated: true,
    },
    suitableRoles:
      'Chair (current). Not suitable for committee chair roles while also serving as board chair. Key decision-point in Event 14 (Chair Succession).',
    inherited: true,
  },

  // 2. Dr. Evelyn Osei-Bonsu — Trustee / Founder (9 years)
  {
    id: 'mdir_osei_bonsu',
    name: 'Dr. Evelyn Osei-Bonsu',
    background:
      "Ghanaian-British development economist; Meridian's founder and CEO 2003–2017. Stepped down as CEO but remained on the board as a trustee — a transition that has never fully completed psychologically. Chairs the Programmes & Impact Committee; treats Marcus Finch as subordinate rather than peer. Has sent operational memos directly to country programme managers, bypassing the CEO.",
    domainRatings: {
      financialOversight:  53,
      regulatoryLegal:     59,
      strategyMarkets:     82,
      peopleCulture:       64,
      esgSustainability:   91,
      geopoliticalMacro:   87,
      technologyDigital:   24,
      stakeholderComms:    70,
    },
    jurisdictionScores: { UK: 75 },
    independence: 'non-independent', // founder; 9-year tenure; operational interference
    tenure: 9,
    tenureYears: 9,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Founder syndrome: treats the CEO role as subordinate to her own authority. At 9 years she is at the Charity Governance Code tenure limit. Directly drives the Founder Syndrome Score (FSS). If FSS exceeds 60, Event 09 fires automatically. FSS below 20 unlocks a graceful transition outcome for Event 14.',
      activationProbability: 1.0,
      triggerCategories: ['strategyMarkets', 'esgSustainability'],
      activated: true,
    },
    suitableRoles:
      'NED / Programmes & Impact Committee Chair (current). High programme value; serious governance liability. Most players will need to manage her exit as part of Event 14 (Chair Succession).',
    inherited: true,
  },

  // 3. Daniel Ashworth — Trustee / People & Culture Chair (4 years)
  {
    id: 'mdir_ashworth',
    name: 'Daniel Ashworth',
    background:
      'Former COO of a large UK housing association. Strong on people and HR matters; weaker on international development sector specifics. Generally supportive of executive leadership; tends to defer to the chair. Chairs the People & Culture Committee.',
    domainRatings: {
      financialOversight:  50,
      regulatoryLegal:     52,
      strategyMarkets:     55,
      peopleCulture:       81,
      esgSustainability:   48,
      geopoliticalMacro:   32,
      technologyDigital:   38,
      stakeholderComms:    60,
    },
    jurisdictionScores: { UK: 82 },
    independence: 'independent',
    tenure: 4,
    tenureYears: 4,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'People & Culture Committee Chair (current). Strongest on safeguarding and CEO conduct events. Cannot provide strong challenge on programmatic or financial matters.',
    inherited: true,
  },

  // 4. Fatima Al-Rashid — Trustee (2 years)
  {
    id: 'mdir_alrashid',
    name: 'Fatima Al-Rashid',
    background:
      'Public health specialist; field experience in East Africa. The most recent appointee and the strongest voice for mission integrity on the current board. Beginning to push back on the grant-chasing strategy at board level. At risk of isolation without allies.',
    domainRatings: {
      financialOversight:  45,
      regulatoryLegal:     55,
      strategyMarkets:     60,
      peopleCulture:       68,
      esgSustainability:   84,
      geopoliticalMacro:   72,
      technologyDigital:   35,
      stakeholderComms:    63,
    },
    jurisdictionScores: { UK: 77 },
    independence: 'independent',
    tenure: 2,
    tenureYears: 2,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'NED. Strongest current voice for mission integrity. Natural ally for Prof. Okonkwo (TRUST-01). Appointment of complementary mission-focused trustees dramatically amplifies her effectiveness.',
    inherited: true,
  },

  // 5. Robert Cavendish — Trustee / Finance & Risk Chair (6 years)
  {
    id: 'mdir_cavendish',
    name: 'Robert Cavendish',
    background:
      "Retired investment banker; chairs Finance & Risk Committee by delegation from the board chair. Six years on the board. UNDISCLOSED CONFLICT: Cavendish's brother-in-law runs Cavendish Logistics Solutions, which has submitted a tender for Meridian's Uganda supply chain contract (£400k). This has not been declared to the board or entered in the conflict of interest register.",
    domainRatings: {
      financialOversight:  80,
      regulatoryLegal:     55,
      strategyMarkets:     68,
      peopleCulture:       40,
      esgSustainability:   35,
      geopoliticalMacro:   50,
      technologyDigital:   30,
      stakeholderComms:    52,
    },
    jurisdictionScores: { UK: 80 },
    independence: 'questionable', // undisclosed conflict
    tenure: 6,
    tenureYears: 6,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "UNDISCLOSED CONFLICT: brother-in-law's logistics firm (Cavendish Logistics Solutions) is shortlisted for Meridian's Uganda supply chain contract (£400k). Appointing TRUST-03 (Hedley) before Event 01 fires forces the conflict to surface immediately. Partial/Failure resolution of Event 01 triggers Event 08 (Statutory Inquiry).",
      activationProbability: 1.0,
      triggerCategories: ['financialOversight', 'regulatoryLegal'],
      activated: true,
    },
    suitableRoles:
      'Finance & Risk Committee Chair (current — conflicted). Player must decide whether to retain or remove. Strong financial oversight scores make him valuable if the conflict is properly managed.',
    inherited: true,
  },

  // ═══════════════════════════════════════════════════════
  // MERIDIAN-SPECIFIC CANDIDATE TRUSTEES
  // ═══════════════════════════════════════════════════════

  // TRUST-01 — Professor James Okonkwo
  {
    id: 'mdir_01_okonkwo',
    name: 'Professor James Okonkwo',
    background:
      'Professor of Development Economics, LSE. Published extensively on aid effectiveness and programme evaluation. Will challenge mission drift directly. Natural ally for Fatima Al-Rashid. If appointed to Programmes & Impact Committee, will act as a credible counterweight to Osei-Bonsu.',
    domainRatings: {
      financialOversight:  55,
      regulatoryLegal:     62,
      strategyMarkets:     80,
      peopleCulture:       52,
      esgSustainability:   88,
      geopoliticalMacro:   85,
      technologyDigital:   40,
      stakeholderComms:    72,
    },
    jurisdictionScores: { UK: 84 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Programmes & Impact Committee (high value). Natural bloc with Al-Rashid — joint appointment gives +8 bonus on all MIS-positive event outcomes. Will push for formal mission alignment review immediately.',
    inherited: false,
  },

  // TRUST-02 — Councillor Diana Nwosu
  {
    id: 'mdir_02_nwosu',
    name: 'Councillor Diana Nwosu',
    background:
      'Elected London borough councillor; former NHS Trust governor. Community engagement background. Brings external accountability perspective. Unlikely to challenge senior trustees on substance. Tends to support the chair.',
    domainRatings: {
      financialOversight:  38,
      regulatoryLegal:     52,
      strategyMarkets:     44,
      peopleCulture:       72,
      esgSustainability:   58,
      geopoliticalMacro:   35,
      technologyDigital:   32,
      stakeholderComms:    68,
    },
    jurisdictionScores: { UK: 79 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'NED. Fills the lay voice gap on People & Culture Committee. Does not shift power dynamics materially. Good incremental governance appointment; not a game-changer.',
    inherited: false,
  },

  // TRUST-03 — Simon Hedley
  {
    id: 'mdir_03_hedley',
    name: 'Simon Hedley',
    background:
      "Partner, Clifford Chance charity and not-for-profit law practice. Advises major INGO boards on Charity Commission compliance, regulatory investigations, and trustee liability. Governance score among the highest in the candidate pool. POTENTIAL CONFLICT: Clifford Chance acts for the Heron Foundation, one of Meridian's major institutional donors — must be disclosed and minuted at appointment.",
    domainRatings: {
      financialOversight:  63,
      regulatoryLegal:     95,
      strategyMarkets:     50,
      peopleCulture:       40,
      esgSustainability:   57,
      geopoliticalMacro:   36,
      technologyDigital:   28,
      stakeholderComms:    61,
    },
    jurisdictionScores: { UK: 92 },
    independence: 'questionable', // Heron Foundation donor conflict
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Clifford Chance acts for the Heron Foundation (major Meridian donor). Must be declared at appointment — not disqualifying but must be minuted and managed. GAME MECHANIC: if appointed before Event 01 resolves, Hedley detects the Cavendish logistics conflict immediately and forces the Critical Success outcome regardless of player choice.',
      activationProbability: 0.6,
      triggerCategories: ['regulatoryLegal'],
      activated: false,
    },
    suitableRoles:
      'Finance & Risk Committee; Programmes & Impact Committee. Strongest regulatory appointment available. The player who appoints Hedley early gains a decisive Event 01 advantage.',
    inherited: false,
  },

  // TRUST-04 — Dr. Amina Yusuf
  {
    id: 'mdir_04_yusuf',
    name: 'Dr. Amina Yusuf',
    background:
      'Former UNICEF Country Director (Uganda, Bangladesh). Now independent consultant. Strong field credibility; has walked away from previous roles over mission compromise. Natural successor for Programmes & Impact Committee Chair. Could trigger Osei-Bonsu resignation if handled poorly.',
    domainRatings: {
      financialOversight:  48,
      regulatoryLegal:     60,
      strategyMarkets:     75,
      peopleCulture:       70,
      esgSustainability:   90,
      geopoliticalMacro:   88,
      technologyDigital:   35,
      stakeholderComms:    72,
    },
    jurisdictionScores: { UK: 76 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Programmes & Impact Committee (ideal — highest MIS value appointment). If both Yusuf and Osei-Bonsu are on the committee simultaneously, FSS reduces by 15 per turn. High friction; Osei-Bonsu may table a motion to remove her. Highest mission restoration value; highest short-term board harmony risk.',
    inherited: false,
  },

  // TRUST-05 — Marcus Webb
  {
    id: 'mdir_05_webb',
    name: 'Marcus Webb',
    background:
      "CEO of a UK social enterprise network. Significant fundraising and income diversification experience. Views income growth as intrinsically positive; limited sensitivity to mission drift risk. The board chair's preferred candidate. Appointing Webb without a mission-focused counterpart is the 'easy but wrong' choice.",
    domainRatings: {
      financialOversight:  55,
      regulatoryLegal:     42,
      strategyMarkets:     72,
      peopleCulture:       58,
      esgSustainability:   44,
      geopoliticalMacro:   40,
      technologyDigital:   48,
      stakeholderComms:    80,
    },
    jurisdictionScores: { UK: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "If appointed, Webb's presence gives Chloe Baxter's income-growth strategy implicit board validation. All income-related event outcomes shift one tier toward Partial (Critical Success→Success; Success→Partial) as oversight pressure decreases.",
      activationProbability: 1.0,
      triggerCategories: ['strategyMarkets', 'stakeholderComms'],
      activated: false,
    },
    suitableRoles:
      'NED. Fundraising and income strategy events. Should not be appointed without a counterweight mission-focused trustee — the dynamic with Baxter (CFO) significantly reduces board oversight effectiveness.',
    inherited: false,
  },

  // TRUST-06 — Dr. Claire Mbeki
  {
    id: 'mdir_06_mbeki',
    name: 'Dr. Claire Mbeki',
    background:
      'Specialist in safeguarding and child protection in humanitarian contexts. Former Save the Children policy director. Addresses a genuine skills gap (safeguarding). Her appointment does not destabilise existing power dynamics — a safe, credible, incremental improvement.',
    domainRatings: {
      financialOversight:  42,
      regulatoryLegal:     70,
      strategyMarkets:     48,
      peopleCulture:       88,
      esgSustainability:   80,
      geopoliticalMacro:   65,
      technologyDigital:   32,
      stakeholderComms:    62,
    },
    jurisdictionScores: { UK: 80 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "People & Culture Committee (safeguarding expertise). Signals beneficiary accountability without disrupting board dynamics. The 'safe hands' first appointment — reasonable but does not resolve mission drift or founder syndrome.",
    inherited: false,
  },

  // TRUST-07 — Raj Patel
  {
    id: 'mdir_07_patel',
    name: 'Raj Patel',
    background:
      "Head of Philanthropy at a major UK family foundation. Controls c.£15m annual grants budget. Significant donor-side perspective. DISQUALIFYING CONFLICT: his foundation has an active grant application from Meridian (£2m over 3 years). Appointment while the application is pending would trigger a Charity Commission inquiry. Application must be withdrawn or decided before he could serve.",
    domainRatings: {
      financialOversight:  55,
      regulatoryLegal:     48,
      strategyMarkets:     65,
      peopleCulture:       50,
      esgSustainability:   68,
      geopoliticalMacro:   55,
      technologyDigital:   40,
      stakeholderComms:    80,
    },
    jurisdictionScores: { UK: 82 },
    independence: 'questionable', // active grant application — disqualifying conflict
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        "DISQUALIFYING CONFLICT: Raj's foundation has an active £2m grant application with Meridian. Appointment in current circumstances would trigger a Charity Commission inquiry. The player must withdraw the application or wait for the grant cycle to conclude before appointing him.",
      activationProbability: 1.0,
      triggerCategories: ['regulatoryLegal', 'stakeholderComms'],
      activated: true,
    },
    suitableRoles:
      'NED (deferred — cannot be appointed until grant conflict is resolved). Trap candidate for the inattentive player. Network value is real; appointment timing is critical.',
    inherited: false,
  },

  // TRUST-08 — Gao Yan
  {
    id: 'mdir_08_gao',
    name: 'Gao Yan',
    background:
      'CFO of a listed UK social impact investment firm. Specialist in blended finance and development finance institutions. Would immediately strengthen the Finance & Risk Committee. Would surface the liquidity risk question the CFO has not escalated.',
    domainRatings: {
      financialOversight:  88,
      regulatoryLegal:     62,
      strategyMarkets:     65,
      peopleCulture:       44,
      esgSustainability:   72,
      geopoliticalMacro:   58,
      technologyDigital:   50,
      stakeholderComms:    55,
    },
    jurisdictionScores: { UK: 84 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Finance & Risk Committee (strong addition). Complements Cavendish's strategic orientation with technical financial depth. Does not resolve the Cavendish conflict issue, but reduces the board's dependency on his oversight.",
    inherited: false,
  },

  // TRUST-09 — Ngozi Adeyemi
  {
    id: 'mdir_09_adeyemi',
    name: 'Ngozi Adeyemi',
    background:
      'Former Nigerian diplomat; now at Chatham House. International policy perspective; networks across FCDO, UN agencies, bilateral donors. Critical of aid-effectiveness fashions that distort delivery organisations. Appetite for Programmes & Impact Committee; would not challenge Osei-Bonsu as directly as Amina Yusuf.',
    domainRatings: {
      financialOversight:  44,
      regulatoryLegal:     60,
      strategyMarkets:     70,
      peopleCulture:       52,
      esgSustainability:   75,
      geopoliticalMacro:   88,
      technologyDigital:   35,
      stakeholderComms:    72,
    },
    jurisdictionScores: { UK: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "NED / Programmes & Impact Committee. Useful counterweight to Chloe Baxter's commercial fundraising instincts. Less confrontational than Yusuf — valuable if board harmony is a priority.",
    inherited: false,
  },

  // TRUST-10 — Fiona Hartley
  {
    id: 'mdir_10_hartley',
    name: 'Fiona Hartley',
    background:
      "Partner, Deloitte Social Impact Practice. Specialist in charity audits, governance reviews, and Charity Commission compliance frameworks. DISQUALIFYING CONFLICT: Deloitte is Meridian's external auditor. Cannot serve as trustee while her firm holds the audit mandate. Firm would need to resign the audit before she could be appointed — minimum 12 months.",
    domainRatings: {
      financialOversight:  88,
      regulatoryLegal:     85,
      strategyMarkets:     52,
      peopleCulture:       45,
      esgSustainability:   60,
      geopoliticalMacro:   38,
      technologyDigital:   42,
      stakeholderComms:    55,
    },
    jurisdictionScores: { UK: 90 },
    independence: 'questionable', // audit conflict — disqualifying until resolved
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        "DISQUALIFYING CONFLICT: Deloitte is Meridian's external auditor. Hartley cannot serve as trustee while her firm holds the mandate. Audit relationship must be resigned first — minimum 12 months process. Second trap candidate: extremely qualified but appointment is technically impossible within the game timeline without resolving the audit conflict.",
      activationProbability: 1.0,
      triggerCategories: ['financialOversight', 'regulatoryLegal'],
      activated: true,
    },
    suitableRoles:
      'Finance & Risk Committee (ideal — if audit conflict resolved). Trap for the inattentive player. Highest combined financial + regulatory score in the pool after Hedley.',
    inherited: false,
  },

  // TRUST-11 — Sir Edward Blythe
  {
    id: 'mdir_11_blythe',
    name: 'Sir Edward Blythe',
    background:
      'Retired British diplomat; former High Commissioner. Significant honorary network value but limited operational charity experience. Will defer to the chair on contested questions. Tendency toward passive trusteeship — a Charity Commission concern.',
    domainRatings: {
      financialOversight:  28,
      regulatoryLegal:     45,
      strategyMarkets:     50,
      peopleCulture:       40,
      esgSustainability:   42,
      geopoliticalMacro:   78,
      technologyDigital:   20,
      stakeholderComms:    72,
    },
    jurisdictionScores: { UK: 80 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "Charity Commission guidance explicitly warns against appointing trustees primarily for their name rather than their contribution. If appointed, players score poorly on board composition metrics. Passive trusteeship risk — will not vote against the chair in contested decisions.",
      activationProbability: 0.7,
      triggerCategories: ['stakeholderComms'],
      activated: false,
    },
    suitableRoles:
      "NED. Fills the vacancy on paper; does nothing to address the underlying governance weaknesses. The 'vanity appointment' trap. Strong players avoid him.",
    inherited: false,
  },

  // TRUST-12 — Dr. Aisha Malik
  {
    id: 'mdir_12_malik',
    name: 'Dr. Aisha Malik',
    background:
      "Public health specialist; significant experience in South Asia and East Africa programme delivery. Direct successor profile to Dr. Sarah Lim (resigned trustee). Would fill the East Africa programme expertise gap immediately. The 'obvious repair' appointment if the player prioritises field credibility and mission alignment over structural reform.",
    domainRatings: {
      financialOversight:  42,
      regulatoryLegal:     55,
      strategyMarkets:     62,
      peopleCulture:       75,
      esgSustainability:   86,
      geopoliticalMacro:   80,
      technologyDigital:   38,
      stakeholderComms:    65,
    },
    jurisdictionScores: { UK: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "NED / Programmes & Impact Committee. Directly replaces the skills lost when Dr. Sarah Lim resigned. Natural fit with Al-Rashid. Good first appointment if mission alignment is the priority.",
    inherited: false,
  },
];
