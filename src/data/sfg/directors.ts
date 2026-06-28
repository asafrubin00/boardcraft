// ── Straits Financial Group — Director Pool ──
// 5 inherited + 22 candidates (including 2 Tier C and 1 event-triggered)
// All fees in SGD. Jurisdiction score = Singapore (MAS/SGX) familiarity.

import type { Director } from '@/types/game';

export const sfgDirectors: Director[] = [

  // ═══════════════════════════════════════════════════════
  // INHERITED DIRECTORS (already on board at game start)
  // ═══════════════════════════════════════════════════════

  // 1. Dato' Lim Boon Kiat — Board Chair & BRC Chair (inherited)
  {
    id: 'sfgdir_01_lim',
    name: "Dato' Lim Boon Kiat",
    background:
      "Former MAS senior official. Board Chair for 11 years and simultaneously chairs the Board Risk Committee — a dual role MAS has formally flagged. His regulatory background once reassured the market but now raises questions about regulatory-commercial independence. Non-independent under SGX rules.",
    domainRatings: {
      financialOversight: 72,
      regulatoryLegal: 85,
      strategyMarkets: 58,
      peopleCulture: 50,
      esgSustainability: 38,
      geopoliticalMacro: 66,
      technologyDigital: 22,
      stakeholderComms: 68,
    },
    jurisdictionScores: { SG: 91 },
    independence: 'non-independent',
    tenure: 11,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "Dual Chair/BRC role has been flagged by MAS. While Dato' Lim chairs both the board and the Risk Committee, a -20% penalty applies to all BRC-related event outcomes. MAS supervisory letter severity escalates if dual role persists past Q3.",
      activationProbability: 1.0,
      triggerCategories: ['regulatoryLegal', 'financialOversight'],
      activated: true,
    },
    suitableRoles:
      "Board Chair (current — player should replace). Cannot hold both Chair and BRC Chair simultaneously without MAS compliance consequences.",
    inherited: true,
    tenureYears: 11,
  },

  // 2. Helena Soong Hui Ling — SID / NC Chair / BCC Chair (inherited)
  {
    id: 'sfgdir_02_soong',
    name: 'Helena Soong Hui Ling',
    background:
      "Senior Independent Director, NC Chair, and Board Credit Committee Chair. Has served 10 years — exceeding the 9-year SGX independence cap. Must be re-classified as non-independent OR retained via a two-tier shareholder vote. Glass Lewis Asia has pre-signalled opposition.",
    domainRatings: {
      financialOversight: 66,
      regulatoryLegal: 70,
      strategyMarkets: 62,
      peopleCulture: 58,
      esgSustainability: 44,
      geopoliticalMacro: 52,
      technologyDigital: 32,
      stakeholderComms: 74,
    },
    jurisdictionScores: { SG: 86 },
    independence: 'questionable',
    tenure: 10,
    annualFee: 280_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "Tenure: 10 years — exceeds the 9-year SGX independence cap. Independence status is contested. Retaining her as independent without a two-tier shareholder vote is a compliance breach. Glass Lewis Asia has signalled it will recommend AGAINST her re-election unless a board renewal plan is disclosed.",
      activationProbability: 1.0,
      triggerCategories: ['regulatoryLegal', 'stakeholderComms'],
      activated: true,
    },
    suitableRoles:
      "SID (current), NC Chair (current), BCC Chair. Independence contested — her retention as independent requires a two-tier shareholder resolution. Most effective succession path is an orderly exit before AGM.",
    inherited: true,
    tenureYears: 10,
  },

  // 3. Winston Goh Teck Nam — NED / RemCo Chair (inherited)
  {
    id: 'sfgdir_03_goh',
    name: 'Winston Goh Teck Nam',
    background:
      "RemCo Chair. Has served exactly 9 years — at the SGX independence cap. Any extension beyond this financial year triggers the two-tier shareholder vote requirement. Has approved CEO pay structures without clawback provisions now under institutional scrutiny.",
    domainRatings: {
      financialOversight: 58,
      regulatoryLegal: 55,
      strategyMarkets: 60,
      peopleCulture: 72,
      esgSustainability: 42,
      geopoliticalMacro: 44,
      technologyDigital: 30,
      stakeholderComms: 64,
    },
    jurisdictionScores: { SG: 82 },
    independence: 'independent',
    tenure: 9,
    annualFee: 240_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "Tenure: 9 years — at the SGX independence limit. Any re-election as independent director after this year requires a two-tier shareholder resolution. RemCo under scrutiny for approving CEO LTIP without clawback provisions.",
      activationProbability: 0.75,
      triggerCategories: ['regulatoryLegal', 'peopleCulture'],
      activated: false,
    },
    suitableRoles:
      "RemCo Chair (current — but tenure creates succession pressure). Player should plan for his replacement before AGM.",
    inherited: true,
    tenureYears: 9,
  },

  // 4. Dr. Nadia Rahman — NED (inherited)
  {
    id: 'sfgdir_04_rahman',
    name: 'Dr. Nadia Rahman',
    background:
      "The strongest independent voice on the current SFG board. Has raised concerns about the Vietnam portfolio risk internally, but her influence has been limited by her relative isolation as the only genuinely independent director with financial expertise. 4 years tenure — no independence concern.",
    domainRatings: {
      financialOversight: 78,
      regulatoryLegal: 64,
      strategyMarkets: 55,
      peopleCulture: 52,
      esgSustainability: 58,
      geopoliticalMacro: 44,
      technologyDigital: 38,
      stakeholderComms: 62,
    },
    jurisdictionScores: { SG: 80 },
    independence: 'independent',
    tenure: 4,
    annualFee: 160_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Audit Committee Chair (eligible — has financial expertise; lower market impact than external appointment). BRC Member. Best retained as a stabilising independent voice.",
    inherited: true,
  },

  // 5. Eric Png Wei Liang — Temasek Nominee NED (inherited, cannot be removed)
  {
    id: 'sfgdir_05_png',
    name: 'Eric Png Wei Liang',
    background:
      "Temasek Holdings nominee. Current VP, Temasek International. Non-independent under SGX rules as a matter of shareholding structure. Rarely challenges management publicly. Temasek's primary channel for signalling expectations — his presence means Temasek is informed of all events in real time, including the whistleblower allegation.",
    domainRatings: {
      financialOversight: 68,
      regulatoryLegal: 55,
      strategyMarkets: 74,
      peopleCulture: 60,
      esgSustainability: 70,
      geopoliticalMacro: 62,
      technologyDigital: 58,
      stakeholderComms: 65,
    },
    jurisdictionScores: { SG: 88 },
    independence: 'non-independent',
    tenure: 3,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "NED (Temasek nominee — cannot be removed by player). BRC Member, Sustainability Committee if formed. His vote counts in Tier 1 of two-tier AGM resolutions but he is excluded from the Tier 2 minority vote.",
    inherited: true,
  },

  // ═══════════════════════════════════════════════════════
  // FINANCIAL & RISK SPECIALISTS
  // ═══════════════════════════════════════════════════════

  // 6. Lee Siew Geok
  {
    id: 'sfgdir_06_lee',
    name: 'Lee Siew Geok',
    background:
      "Former Deputy Managing Director, MAS (Prudential Supervision). 28 years in financial regulation. NED at two SGX-listed banks. The highest-credibility Audit Committee Chair candidate in the pool — her MAS background sends an unmistakable signal to the regulator.",
    domainRatings: {
      financialOversight: 94,
      regulatoryLegal: 97,
      strategyMarkets: 58,
      peopleCulture: 42,
      esgSustainability: 35,
      geopoliticalMacro: 71,
      technologyDigital: 22,
      stakeholderComms: 67,
    },
    jurisdictionScores: { SG: 99 },
    independence: 'independent',
    tenure: 0,
    annualFee: 280_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Audit Committee Chair (primary — highest MAS credibility). Board Risk Committee Chair. Pairing with Anwar bin Hamzah on BRC is the strongest regulatory signal in the pool.",
    inherited: false,
  },

  // 7. Anwar bin Hamzah
  {
    id: 'sfgdir_07_anwar',
    name: 'Anwar bin Hamzah',
    background:
      "Former Group CRO, DBS Bank. Fellow of the Institute of Banking & Finance Singapore. Led Basel III implementation across ASEAN. Ideal for reconstituting the Board Risk Committee following the Vietnam credit loss.",
    domainRatings: {
      financialOversight: 88,
      regulatoryLegal: 81,
      strategyMarkets: 63,
      peopleCulture: 38,
      esgSustainability: 44,
      geopoliticalMacro: 60,
      technologyDigital: 52,
      stakeholderComms: 55,
    },
    jurisdictionScores: { SG: 94 },
    independence: 'independent',
    tenure: 0,
    annualFee: 240_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Board Risk Committee Chair (primary — meets MAS risk expertise requirement and resolves the dual-role issue). Audit Committee Member.",
    inherited: false,
  },

  // 8. Margaret Tan Swee Lin
  {
    id: 'sfgdir_08_tan_margaret',
    name: 'Margaret Tan Swee Lin',
    background:
      "Former CFO, OCBC Bank. Chartered Accountant (ISCA). Audit Committee Chair at two SGX Mainboard companies. Expert in regional financial reporting under SFRS(I). Solid, market-credible appointment.",
    domainRatings: {
      financialOversight: 91,
      regulatoryLegal: 76,
      strategyMarkets: 55,
      peopleCulture: 44,
      esgSustainability: 38,
      geopoliticalMacro: 49,
      technologyDigital: 29,
      stakeholderComms: 60,
    },
    jurisdictionScores: { SG: 91 },
    independence: 'independent',
    tenure: 0,
    annualFee: 220_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Audit Committee Chair (primary — meets MAS financial expertise requirement). Pairs well with Lee Siew Geok for AC best-practice signal.",
    inherited: false,
  },

  // 9. Dr. Suresh Pillai
  {
    id: 'sfgdir_09_pillai',
    name: 'Dr. Suresh Pillai',
    background:
      "Partner, Allen & Gledhill LLP (retired). Specialised in MAS enforcement, bank mergers, and capital markets regulatory work. SGX Listing Committee member for 6 years. Carries a hidden conflict that activates under specific conditions.",
    domainRatings: {
      financialOversight: 68,
      regulatoryLegal: 95,
      strategyMarkets: 52,
      peopleCulture: 37,
      esgSustainability: 41,
      geopoliticalMacro: 57,
      technologyDigital: 30,
      stakeholderComms: 72,
    },
    jurisdictionScores: { SG: 97 },
    independence: 'independent',
    tenure: 0,
    annualFee: 200_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        "[HIDDEN] Advises a Southeast Asian sovereign fund that has been quietly building a position in SFG. Conflict activates if he joins the BRC and the fund votes against management within 18 months.",
      activationProbability: 0.4,
      triggerCategories: ['regulatoryLegal', 'financialOversight'],
      activated: false,
    },
    suitableRoles:
      "Nominating Committee Chair, Audit Committee Member, BRC Member. Strong regulatory expertise — best deployed on NC or AC where conflict risk is lower.",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // STRATEGY & REGIONAL MARKET SPECIALISTS
  // ═══════════════════════════════════════════════════════

  // 10. Tan Sri Faridah Aziz
  {
    id: 'sfgdir_10_faridah',
    name: 'Tan Sri Faridah Aziz',
    background:
      "Former CEO, Maybank Investment Banking. Malaysian national. Extensive M&A advisory experience across ASEAN financial services. Sits on boards in Kuala Lumpur and Jakarta. Key for Indonesia expansion decisions.",
    domainRatings: {
      financialOversight: 72,
      regulatoryLegal: 59,
      strategyMarkets: 90,
      peopleCulture: 52,
      esgSustainability: 48,
      geopoliticalMacro: 81,
      technologyDigital: 44,
      stakeholderComms: 75,
    },
    jurisdictionScores: { SG: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 210_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Board Credit Committee. ASEAN expansion strategy. Pairs with Dr. Priscilla Ho for Indonesia digital bank committee bonus.",
    inherited: false,
  },

  // 11. Jonathan Khoo Kai Seng
  {
    id: 'sfgdir_11_khoo',
    name: 'Jonathan Khoo Kai Seng',
    background:
      "Former McKinsey Singapore Managing Partner. Led financial services practice across Southeast Asia. Now independent board director and strategic advisor with deep relationships across regional banking.",
    domainRatings: {
      financialOversight: 61,
      regulatoryLegal: 45,
      strategyMarkets: 88,
      peopleCulture: 64,
      esgSustainability: 55,
      geopoliticalMacro: 76,
      technologyDigital: 62,
      stakeholderComms: 81,
    },
    jurisdictionScores: { SG: 84 },
    independence: 'independent',
    tenure: 0,
    annualFee: 195_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Nominating Committee, Remuneration Committee, Board Credit Committee. Good all-rounder for strategy and governance reform events.",
    inherited: false,
  },

  // 12. Professor Wu Jianping
  {
    id: 'sfgdir_12_wu',
    name: 'Prof. Wu Jianping',
    background:
      "Dean Emeritus, NUS Business School. Academic specialisation in corporate governance and Southeast Asian capital markets. Policy advisor to SGX and ACRA. Pairs with BG Abdul Rashid for governance reform credibility.",
    domainRatings: {
      financialOversight: 57,
      regulatoryLegal: 64,
      strategyMarkets: 72,
      peopleCulture: 60,
      esgSustainability: 68,
      geopoliticalMacro: 85,
      technologyDigital: 48,
      stakeholderComms: 70,
    },
    jurisdictionScores: { SG: 89 },
    independence: 'independent',
    tenure: 0,
    annualFee: 175_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Nominating Committee Chair, Sustainability Committee Chair. Excellent for governance reform and independence review events.",
    inherited: false,
  },

  // 13. Vikram Nair
  {
    id: 'sfgdir_13_vikram',
    name: 'Vikram Nair',
    background:
      "Former GIC Portfolio Manager, Southeast Asia private equity. Returned 2.3x on financial services portfolio. Currently managing partner of a Singapore family office. Strong on capital allocation — carries a hidden conflict tied to Indonesia expansion.",
    domainRatings: {
      financialOversight: 78,
      regulatoryLegal: 48,
      strategyMarkets: 85,
      peopleCulture: 41,
      esgSustainability: 40,
      geopoliticalMacro: 69,
      technologyDigital: 55,
      stakeholderComms: 58,
    },
    jurisdictionScores: { SG: 82 },
    independence: 'independent',
    tenure: 0,
    annualFee: 185_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        "[HIDDEN] Family office has a small position in a competitor Indonesian digital bank. Conflict activates if SFG Indonesia expansion is approved and the family office increases its position.",
      activationProbability: 0.45,
      triggerCategories: ['strategyMarkets', 'geopoliticalMacro'],
      activated: false,
    },
    suitableRoles:
      "Board Credit Committee, strategy input to NC and RemCo. High financial IQ but deploy carefully if Indonesia expansion is approved.",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // TECHNOLOGY & DIGITAL FINANCE SPECIALISTS
  // ═══════════════════════════════════════════════════════

  // 14. Dr. Priscilla Ho
  {
    id: 'sfgdir_14_ho',
    name: 'Dr. Priscilla Ho',
    background:
      "Former Chief Data Officer, Grab Financial. Led digital lending product across Vietnam and Indonesia. Board observer at two MAS-licensed digital banks. Fintech advisory board member, MAS. Critical for Indonesia digital bank licence event.",
    domainRatings: {
      financialOversight: 58,
      regulatoryLegal: 61,
      strategyMarkets: 73,
      peopleCulture: 56,
      esgSustainability: 59,
      geopoliticalMacro: 48,
      technologyDigital: 92,
      stakeholderComms: 64,
    },
    jurisdictionScores: { SG: 86 },
    independence: 'independent',
    tenure: 0,
    annualFee: 190_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Sustainability Committee, Board Credit Committee (digital lending oversight). Pairs with Samuel Ong for +15% bonus on all Digital Finance and Technology events.",
    inherited: false,
  },

  // 15. Samuel Ong Beng Hock
  {
    id: 'sfgdir_15_samuel',
    name: 'Samuel Ong Beng Hock',
    background:
      "CTO turned NED. Former Head of Technology, Standard Chartered Singapore. Led core banking modernisation and cybersecurity resilience programme for the Asia region. Essential for SFG's digital competitor response.",
    domainRatings: {
      financialOversight: 44,
      regulatoryLegal: 52,
      strategyMarkets: 60,
      peopleCulture: 48,
      esgSustainability: 41,
      geopoliticalMacro: 38,
      technologyDigital: 89,
      stakeholderComms: 55,
    },
    jurisdictionScores: { SG: 80 },
    independence: 'independent',
    tenure: 0,
    annualFee: 170_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Board Risk Committee (cyber risk), Audit Committee (IT audit). Pairs with Dr. Priscilla Ho for technology event bonus.",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // ESG & SUSTAINABILITY SPECIALISTS
  // ═══════════════════════════════════════════════════════

  // 16. Dr. Aiyana Krishnamurthy
  {
    id: 'sfgdir_16_krishnamurthy',
    name: 'Dr. Aiyana Krishnamurthy',
    background:
      "Founder, Meridian Climate Advisory (Singapore). Former World Bank senior economist. TCFD technical expert. Leads ESG reporting advisory for three Asian banks. Primary candidate to chair the Sustainability Committee.",
    domainRatings: {
      financialOversight: 50,
      regulatoryLegal: 55,
      strategyMarkets: 58,
      peopleCulture: 62,
      esgSustainability: 94,
      geopoliticalMacro: 71,
      technologyDigital: 40,
      stakeholderComms: 74,
    },
    jurisdictionScores: { SG: 79 },
    independence: 'independent',
    tenure: 0,
    annualFee: 180_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Sustainability Committee Chair (primary — highest credibility with MAS and proxy advisors). Remuneration Committee.",
    inherited: false,
  },

  // 17. Ng Kok Wah
  {
    id: 'sfgdir_17_ng',
    name: 'Ng Kok Wah',
    background:
      "Former Head of Responsible Investment, GIC. Built GIC's ESG integration framework. Extensive knowledge of MAS Green Finance Action Plan and Singapore-Asia Taxonomy. Strong alternative to Dr. Krishnamurthy for Sustainability Committee Chair.",
    domainRatings: {
      financialOversight: 63,
      regulatoryLegal: 60,
      strategyMarkets: 65,
      peopleCulture: 52,
      esgSustainability: 88,
      geopoliticalMacro: 60,
      technologyDigital: 36,
      stakeholderComms: 67,
    },
    jurisdictionScores: { SG: 88 },
    independence: 'independent',
    tenure: 0,
    annualFee: 175_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Sustainability Committee, Board Risk Committee (ESG risk). Higher SJS than Dr. Krishnamurthy — familiar with MAS-specific framework.",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // PEOPLE, CULTURE & GOVERNANCE SPECIALISTS
  // ═══════════════════════════════════════════════════════

  // 18. Datin Sri Loh Pei Ying
  {
    id: 'sfgdir_18_loh',
    name: 'Datin Sri Loh Pei Ying',
    background:
      "Former Group CHRO, Singapore Airlines. Board-level expertise in executive remuneration design across APAC. Remuneration Committee Chair at two SGX-listed companies. Ideal to resolve the clawback issue and reform the CEO pay structure.",
    domainRatings: {
      financialOversight: 42,
      regulatoryLegal: 48,
      strategyMarkets: 54,
      peopleCulture: 91,
      esgSustainability: 65,
      geopoliticalMacro: 44,
      technologyDigital: 38,
      stakeholderComms: 78,
    },
    jurisdictionScores: { SG: 85 },
    independence: 'independent',
    tenure: 0,
    annualFee: 185_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Remuneration Committee Chair (primary — ideal for CEO pay reform and clawback introduction). Nominating Committee.",
    inherited: false,
  },

  // 19. Brigadier-General (Ret.) Abdul Rashid bin Ismail
  {
    id: 'sfgdir_19_rashid',
    name: 'BG (Ret.) Abdul Rashid bin Ismail',
    background:
      "Former SAF officer turned governance consultant. Teaches corporate governance at INSEAD Asia. Known for challenging management in boardroom settings. Governance Institute of Singapore board member. Pairs with Prof. Wu for governance reform credibility.",
    domainRatings: {
      financialOversight: 44,
      regulatoryLegal: 62,
      strategyMarkets: 57,
      peopleCulture: 79,
      esgSustainability: 55,
      geopoliticalMacro: 84,
      technologyDigital: 35,
      stakeholderComms: 82,
    },
    jurisdictionScores: { SG: 87 },
    independence: 'independent',
    tenure: 0,
    annualFee: 165_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Nominating Committee Chair, Board Risk Committee. Board Chair candidate (if Rajan Sethupathi is unavailable).",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // INTERNATIONAL / CROSS-BORDER DIRECTORS
  // ═══════════════════════════════════════════════════════

  // 20. Sophie Beaumont
  {
    id: 'sfgdir_20_beaumont',
    name: 'Sophie Beaumont',
    background:
      "French national. Former Head of Southeast Asia, Societe Generale. Extensive experience in regional financial services, trade finance, and cross-border regulatory coordination. Valuable for international credibility.",
    domainRatings: {
      financialOversight: 78,
      regulatoryLegal: 66,
      strategyMarkets: 81,
      peopleCulture: 59,
      esgSustainability: 62,
      geopoliticalMacro: 80,
      technologyDigital: 47,
      stakeholderComms: 74,
    },
    jurisdictionScores: { SG: 72 },
    independence: 'independent',
    tenure: 0,
    annualFee: 220_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Board Credit Committee, Audit Committee Member. Cross-border and geopolitical events. Lower SJS — pair with high-SJS directors on regulatory events.",
    inherited: false,
  },

  // 21. Robert Halliday
  {
    id: 'sfgdir_21_halliday',
    name: 'Robert Halliday',
    background:
      "Former CFO, HSBC Asia Pacific. British national, resident Singapore. Extensive cross-border bank governance experience. Sits on boards in Hong Kong and Singapore. Strong financial oversight — credible AC Chair if Lee Siew Geok or Margaret Tan are unavailable.",
    domainRatings: {
      financialOversight: 87,
      regulatoryLegal: 72,
      strategyMarkets: 68,
      peopleCulture: 48,
      esgSustainability: 44,
      geopoliticalMacro: 73,
      technologyDigital: 36,
      stakeholderComms: 64,
    },
    jurisdictionScores: { SG: 76 },
    independence: 'independent',
    tenure: 0,
    annualFee: 230_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Audit Committee Chair (backup if Lee Siew Geok or Margaret Tan unavailable). Board Risk Committee Member. Lower SJS than Singapore locals but strong financial expertise.",
    inherited: false,
  },

  // 22. Datuk Ahmad Fauzi — TIER C
  {
    id: 'sfgdir_22_fauzi',
    name: 'Datuk Ahmad Fauzi',
    background:
      "Former Secretary-General, Malaysian Ministry of Finance. Deep relationships across ASEAN finance ministries and central banks. Independent NED at two Malaysian Bursa-listed banks. Politically exposed person (PEP) under MAS AML screening — carries significant risk if Malaysia-Singapore geopolitical tensions arise.",
    domainRatings: {
      financialOversight: 65,
      regulatoryLegal: 78,
      strategyMarkets: 70,
      peopleCulture: 54,
      esgSustainability: 52,
      geopoliticalMacro: 91,
      technologyDigital: 28,
      stakeholderComms: 80,
    },
    jurisdictionScores: { SG: 68 },
    independence: 'independent',
    tenure: 0,
    annualFee: 195_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: {
      description:
        "[HIDDEN] Politically exposed person under MAS AML screening. If a geopolitical event between Singapore and Malaysia fires while Datuk Ahmad is on the board, MAS AML review triggers — all events paused for one turn, -3.0% SV.",
      activationProbability: 0.35,
      triggerCategories: ['geopoliticalMacro', 'regulatoryLegal'],
      activated: false,
    },
    suitableRoles:
      "Board Credit Committee (ASEAN expansion advisory). Valuable geopolitical expertise but PEP risk makes him high-risk for BRC or AC positions.",
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // HIGH-RISK / HIGH-REWARD DIRECTORS
  // ═══════════════════════════════════════════════════════

  // 23. Eleanor Tan Bee Ling — Non-Independent
  {
    id: 'sfgdir_23_eleanor',
    name: 'Eleanor Tan Bee Ling',
    background:
      "Former CEO, SFG Wealth Management. Has worked with current CEO Raymond Tan for 9 years. Strong relationships across SFG's private banking client base — but SGX would classify her as non-independent given her close relationship with the CEO. Minority shareholder groups will flag her appointment immediately.",
    domainRatings: {
      financialOversight: 75,
      regulatoryLegal: 55,
      strategyMarkets: 80,
      peopleCulture: 66,
      esgSustainability: 44,
      geopoliticalMacro: 52,
      technologyDigital: 50,
      stakeholderComms: 76,
    },
    jurisdictionScores: { SG: 82 },
    independence: 'non-independent',
    tenure: 0,
    annualFee: 175_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        "[VISIBLE] Non-independent on appointment due to close CEO relationship. Reduces the independent director count. Proxy advisors and minority shareholders will flag immediately. Her participation on AC or NC triggers -5% baseline penalty to every committee vote she casts.",
      activationProbability: 1.0,
      triggerCategories: ['regulatoryLegal', 'stakeholderComms'],
      activated: true,
    },
    suitableRoles:
      "Board Credit Committee, Remuneration Committee (if non-independent is acceptable in context). Avoid AC and NC — her non-independent status will draw regulatory criticism.",
    inherited: false,
  },

  // 24. Chen Weiliang — Activist Voice
  {
    id: 'sfgdir_24_chen',
    name: 'Chen Weiliang',
    background:
      "Founding partner, Southeast Asia growth equity fund with USD 1.2bn AUM. Has publicly criticised SFG's Vietnam risk management in the financial press. Known as an activist voice. Appointment sends a strong institutional credibility signal but activates CEO-NED tension that penalises all Strategy events.",
    domainRatings: {
      financialOversight: 80,
      regulatoryLegal: 50,
      strategyMarkets: 86,
      peopleCulture: 45,
      esgSustainability: 55,
      geopoliticalMacro: 65,
      technologyDigital: 58,
      stakeholderComms: 89,
    },
    jurisdictionScores: { SG: 80 },
    independence: 'independent',
    tenure: 0,
    annualFee: 190_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        "[VISIBLE] Publicly on record criticising SFG management. CEO Raymond Tan is aware. If appointed, the CEO-NED tension dynamic activates: all Strategy & Markets events apply a -10% modifier due to management withholding strategic information.",
      activationProbability: 1.0,
      triggerCategories: ['strategyMarkets', 'stakeholderComms'],
      activated: true,
    },
    suitableRoles:
      "Board Credit Committee, Nominating Committee (oversight role). High institutional credibility but accept the CEO tension penalty as the price of that credibility.",
    inherited: false,
  },

  // 25. Grace Leong Shu Yin — Communications Specialist
  {
    id: 'sfgdir_25_grace',
    name: 'Grace Leong Shu Yin',
    background:
      "Former Communications Director, Singapore Prime Minister's Office. Now independent consultant and NED. Deep relationships with Singapore media, civil service, and institutional stakeholder community. Highest Stakeholder & Comms score in the pool.",
    domainRatings: {
      financialOversight: 38,
      regulatoryLegal: 52,
      strategyMarkets: 60,
      peopleCulture: 75,
      esgSustainability: 64,
      geopoliticalMacro: 72,
      technologyDigital: 42,
      stakeholderComms: 95,
    },
    jurisdictionScores: { SG: 90 },
    independence: 'independent',
    tenure: 0,
    annualFee: 165_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Sustainability Committee, Nominating Committee. Stakeholder & Comms events, MAS engagement, proxy advisor negotiations. Deploy on any event requiring public communications or institutional stakeholder management.",
    inherited: false,
  },

  // 26. Rajan Sethupathi — TIER C (Board Chair candidate)
  {
    id: 'sfgdir_26_rajan',
    name: 'Rajan Sethupathi',
    background:
      "Former CEO, Standard Chartered Singapore. Respected across Singapore's banking establishment. Has turned down six board roles this year — currently available but highly selective. His appointment as Board Chair would be the most powerful governance credibility signal available to SFG, triggering an immediate SV boost and MAS goodwill. Comes at the highest fee in the pool.",
    domainRatings: {
      financialOversight: 84,
      regulatoryLegal: 75,
      strategyMarkets: 86,
      peopleCulture: 70,
      esgSustainability: 58,
      geopoliticalMacro: 77,
      technologyDigital: 52,
      stakeholderComms: 88,
    },
    jurisdictionScores: { SG: 93 },
    independence: 'independent',
    tenure: 0,
    annualFee: 320_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "BOARD CHAIR (primary — highest credibility signal in the pool). BRC Chair, SID. Appointment as Chair triggers market SV boost of +1.5% on announcement. Pairing with Lee Siew Geok as AC Chair is the 'dream team' signal for institutional investors.",
    inherited: false,
  },

  // 27. Catherine Phua — Temasek Additional Nominee (event-triggered only)
  {
    id: 'sfgdir_27_phua',
    name: 'Catherine Phua',
    background:
      "Current Vice President, Temasek International (Portfolio). 38 years old. Temasek's preferred replacement for Eric Png if he is rotated out. The player does not control whether Temasek exercises this right — it is triggered by SFG-08. Non-independent under SGX rules as a Temasek nominee. Her appointment signals Temasek's increased engagement and activates a governance pressure multiplier on ESG and risk events.",
    domainRatings: {
      financialOversight: 72,
      regulatoryLegal: 60,
      strategyMarkets: 78,
      peopleCulture: 64,
      esgSustainability: 79,
      geopoliticalMacro: 66,
      technologyDigital: 68,
      stakeholderComms: 71,
    },
    jurisdictionScores: { SG: 92 },
    independence: 'non-independent',
    tenure: 0,
    annualFee: 0,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "Board Risk Committee, Sustainability Committee, Remuneration Committee observer. Non-independent (Temasek nominee) — excluded from Tier 2 minority AGM votes. Triggered by SFG-08 event only.",
    inherited: false,
  },
];
