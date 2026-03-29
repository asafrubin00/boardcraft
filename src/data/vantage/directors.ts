// ── Vantage Consumer Brands — Director Pool ──
// 18 Vantage-specific directors (4 inherited, 14 new candidates incl. 2 Tier C)
// + 5 cross-listed from Harwick pool (referenced by their existing dir_ IDs)

import type { Director } from '@/types/game';

export const vantageDirectors: Director[] = [
  // ═══════════════════════════════════════════════════════
  // INHERITED DIRECTORS (already on board at game start)
  // ═══════════════════════════════════════════════════════

  // 1. Robert Kellerman — Lead Independent Director (inherited)
  {
    id: 'vdir_01_kellerman',
    name: 'Robert Kellerman',
    background:
      'Former COO of a Fortune 500 retailer. Has been Lead Independent Director at Vantage for 6 years. Known for avoiding confrontation with management.',
    domainRatings: {
      financialOversight: 61,
      regulatoryLegal: 44,
      strategyMarkets: 72,
      peopleCulture: 55,
      esgSustainability: 40,
      geopoliticalMacro: 35,
      technologyDigital: 38,
      stakeholderComms: 58,
    },
    jurisdictionScores: { US: 85 },
    independence: 'independent',
    tenure: 6,
    annualFee: 180_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'LID (current, weak), NED — not suitable for committee chairs given low domain scores',
    inherited: true,
  },

  // 2. Patricia Nguyen — NED / Audit Chair (inherited, flagged)
  {
    id: 'vdir_02_nguyen',
    name: 'Patricia Nguyen',
    background:
      'Former partner at a mid-tier accounting firm. Audit Committee Chair for 4 years. Consulting contract with a Vantage supplier creates a conflict of interest that must be resolved.',
    domainRatings: {
      financialOversight: 79,
      regulatoryLegal: 55,
      strategyMarkets: 38,
      peopleCulture: 32,
      esgSustainability: 29,
      geopoliticalMacro: 22,
      technologyDigital: 25,
      stakeholderComms: 41,
    },
    jurisdictionScores: { US: 82 },
    independence: 'questionable',
    tenure: 4,
    annualFee: 210_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Consulting contract with Vantage supplier flagged by proxy advisers. Must be removed from Audit Chair role. If retained as plain NED, independence remains questionable.',
      activationProbability: 1.0,
      triggerCategories: ['financialOversight', 'regulatoryLegal'],
      activated: true,
    },
    suitableRoles:
      'Cannot chair Audit Committee while conflict exists. Plain NED role is marginal — most players will remove her.',
    inherited: true,
  },

  // 3. James Whitfield — NED (inherited)
  {
    id: 'vdir_03_whitfield',
    name: 'James Whitfield',
    background:
      'Former CFO of a major US food conglomerate. Strong financial expertise. 8 years on the Vantage board — approaching ISS\'s 9-year independence flag.',
    domainRatings: {
      financialOversight: 88,
      regulatoryLegal: 52,
      strategyMarkets: 65,
      peopleCulture: 38,
      esgSustainability: 35,
      geopoliticalMacro: 42,
      technologyDigital: 28,
      stakeholderComms: 48,
    },
    jurisdictionScores: { US: 90 },
    independence: 'independent',
    tenure: 8,
    annualFee: 155_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee Chair (strong financial score), Comp Committee member',
    inherited: true,
    tenureYears: 8,
  },

  // 4. Dr. Cynthia Park — NED (inherited)
  {
    id: 'vdir_04_park',
    name: 'Dr. Cynthia Park',
    background:
      'Former VP of Sustainability at a Fortune 100 consumer goods company. Expert in ESG disclosure, supply chain ethics, and consumer regulation. Two years on the Vantage board — underutilised.',
    domainRatings: {
      financialOversight: 38,
      regulatoryLegal: 61,
      strategyMarkets: 55,
      peopleCulture: 58,
      esgSustainability: 91,
      geopoliticalMacro: 44,
      technologyDigital: 40,
      stakeholderComms: 67,
    },
    jurisdictionScores: { US: 84 },
    independence: 'independent',
    tenure: 2,
    annualFee: 155_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Consumer Affairs & Regulatory Committee Chair (ideal if formed), Brand & Reputation Committee, ESG events',
    inherited: true,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — Financial & Audit
  // ═══════════════════════════════════════════════════════

  // 5. Howard Stern III
  {
    id: 'vdir_05_stern',
    name: 'Howard Stern III',
    background:
      'Former Audit Partner at Deloitte (consumer practice). SEC-registered CPA. Audit Committee financial expert on two NYSE boards. No relation to the radio host.',
    domainRatings: {
      financialOversight: 94,
      regulatoryLegal: 68,
      strategyMarkets: 44,
      peopleCulture: 35,
      esgSustainability: 31,
      geopoliticalMacro: 28,
      technologyDigital: 32,
      stakeholderComms: 45,
    },
    jurisdictionScores: { US: 95 },
    independence: 'independent',
    tenure: 0,
    annualFee: 195_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee Chair (ideal — meets SEC financial expert requirement), Comp Committee member',
    inherited: false,
  },

  // 6. Margaret Osei-Bonsu
  {
    id: 'vdir_06_osei_bonsu',
    name: 'Margaret Osei-Bonsu',
    background:
      'CFO (retired) of a major US beverage company. Deep FMCG sector knowledge. Strong on capital allocation and M&A.',
    domainRatings: {
      financialOversight: 86,
      regulatoryLegal: 48,
      strategyMarkets: 74,
      peopleCulture: 42,
      esgSustainability: 44,
      geopoliticalMacro: 38,
      technologyDigital: 35,
      stakeholderComms: 55,
    },
    jurisdictionScores: { US: 88 },
    independence: 'independent',
    tenure: 0,
    annualFee: 165_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee Chair (solid), M&A events, hostile bid defence',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — Regulatory & Legal
  // ═══════════════════════════════════════════════════════

  // 7. Senator Barbara Finch (ret.)
  {
    id: 'vdir_07_finch',
    name: 'Sen. Barbara Finch (ret.)',
    background:
      'Former US Senator (Commerce Committee). Expert in FDA regulation, food safety law, and federal trade policy. Deep Washington network.',
    domainRatings: {
      financialOversight: 35,
      regulatoryLegal: 92,
      strategyMarkets: 55,
      peopleCulture: 48,
      esgSustainability: 61,
      geopoliticalMacro: 78,
      technologyDigital: 28,
      stakeholderComms: 84,
    },
    jurisdictionScores: { US: 97 },
    independence: 'independent',
    tenure: 0,
    annualFee: 185_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Regulatory events (UPF tax, FDA scrutiny), government relations strategies, Consumer Affairs & Regulatory Committee Chair',
    inherited: false,
  },

  // 8. Rafael Dominguez
  {
    id: 'vdir_08_dominguez',
    name: 'Rafael Dominguez',
    background:
      'Partner at a leading US corporate law firm (food & beverage practice). Expert in FDA compliance, class action defence, and consumer protection law.',
    domainRatings: {
      financialOversight: 42,
      regulatoryLegal: 88,
      strategyMarkets: 44,
      peopleCulture: 38,
      esgSustainability: 52,
      geopoliticalMacro: 40,
      technologyDigital: 31,
      stakeholderComms: 55,
    },
    jurisdictionScores: { US: 91 },
    independence: 'independent',
    tenure: 0,
    annualFee: 145_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Regulatory events, litigation defence, FDA/FTC investigations',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — Strategy & Markets
  // ═══════════════════════════════════════════════════════

  // 9. Diana Marchetti
  {
    id: 'vdir_09_marchetti',
    name: 'Diana Marchetti',
    background:
      'Former President of North America at a global consumer goods company. Expert in brand management, retail strategy, and consumer trend navigation.',
    domainRatings: {
      financialOversight: 62,
      regulatoryLegal: 44,
      strategyMarkets: 93,
      peopleCulture: 58,
      esgSustainability: 52,
      geopoliticalMacro: 48,
      technologyDigital: 44,
      stakeholderComms: 72,
    },
    jurisdictionScores: { US: 92 },
    independence: 'independent',
    tenure: 0,
    annualFee: 175_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Board Chair candidate (high Strategy + Stakeholder), M&A events, activist defence, brand crisis events',
    inherited: false,
  },

  // 10. Todd Reinholt
  {
    id: 'vdir_10_reinholt',
    name: 'Todd Reinholt',
    background:
      'Managing Director at a major US activist hedge fund (retired). Knows exactly how activists think and operate. Controversial appointment — signals the board is serious about reform.',
    domainRatings: {
      financialOversight: 74,
      regulatoryLegal: 48,
      strategyMarkets: 88,
      peopleCulture: 44,
      esgSustainability: 38,
      geopoliticalMacro: 55,
      technologyDigital: 40,
      stakeholderComms: 79,
    },
    jurisdictionScores: { US: 89 },
    independence: 'independent',
    tenure: 0,
    annualFee: 160_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Former fund may still hold positions in Vantage competitors. If an M&A event fires, this may create a conflict of interest that surfaces.',
      activationProbability: 0.5,
      triggerCategories: ['strategyMarkets', 'financialOversight'],
      activated: false,
    },
    suitableRoles:
      'Activist defence events (uniquely effective — knows the playbook), M&A strategy, proxy battle defence',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — People, Culture & Governance
  // ═══════════════════════════════════════════════════════

  // 11. Dr. Josephine Carter
  {
    id: 'vdir_11_carter',
    name: 'Dr. Josephine Carter',
    background:
      'Former CHRO of a Fortune 100 company. Expert in executive remuneration, CEO succession, and culture transformation in large consumer organisations.',
    domainRatings: {
      financialOversight: 40,
      regulatoryLegal: 48,
      strategyMarkets: 44,
      peopleCulture: 95,
      esgSustainability: 60,
      geopoliticalMacro: 28,
      technologyDigital: 35,
      stakeholderComms: 70,
    },
    jurisdictionScores: { US: 90 },
    independence: 'independent',
    tenure: 0,
    annualFee: 155_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Compensation Committee Chair (ideal), CEO misconduct events, Chair/CEO split negotiation events, People & Culture events',
    inherited: false,
  },

  // 12. Professor William Okoye
  {
    id: 'vdir_12_okoye',
    name: 'Prof. William Okoye',
    background:
      'Professor of Corporate Governance at Harvard Business School. Adviser to the SEC on board composition standards. Published extensively on activist defence and board effectiveness.',
    domainRatings: {
      financialOversight: 45,
      regulatoryLegal: 65,
      strategyMarkets: 42,
      peopleCulture: 74,
      esgSustainability: 68,
      geopoliticalMacro: 38,
      technologyDigital: 48,
      stakeholderComms: 71,
    },
    jurisdictionScores: { US: 93 },
    independence: 'independent',
    tenure: 0,
    annualFee: 120_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Nom/Gov Committee Chair (ideal), proxy adviser engagement, governance health events',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — ESG & Sustainability
  // ═══════════════════════════════════════════════════════

  // 13. Maya Thornton
  {
    id: 'vdir_13_thornton',
    name: 'Maya Thornton',
    background:
      'Former Chief Sustainability Officer at a major US food company. Led a successful reformulation programme that removed artificial ingredients from 40% of the product range. TCFD expert.',
    domainRatings: {
      financialOversight: 44,
      regulatoryLegal: 58,
      strategyMarkets: 62,
      peopleCulture: 50,
      esgSustainability: 94,
      geopoliticalMacro: 40,
      technologyDigital: 45,
      stakeholderComms: 72,
    },
    jurisdictionScores: { US: 87 },
    independence: 'independent',
    tenure: 0,
    annualFee: 140_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Consumer Affairs & Regulatory Committee Chair (if formed), Brand & Reputation Committee, UPF and ESG events',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — Technology & Digital
  // ═══════════════════════════════════════════════════════

  // 14. Carlos Mendez
  {
    id: 'vdir_14_mendez',
    name: 'Carlos Mendez',
    background:
      'Former CTO of a major US retail company. Expert in e-commerce infrastructure, data privacy (CCPA compliance), and AI-driven consumer marketing.',
    domainRatings: {
      financialOversight: 35,
      regulatoryLegal: 52,
      strategyMarkets: 68,
      peopleCulture: 38,
      esgSustainability: 44,
      geopoliticalMacro: 30,
      technologyDigital: 91,
      stakeholderComms: 48,
    },
    jurisdictionScores: { US: 88 },
    independence: 'independent',
    tenure: 0,
    annualFee: 135_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Technology events, data breach events, digital transformation, AI governance',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // NEW DIRECTORS — Stakeholder & Chair Candidates
  // ═══════════════════════════════════════════════════════

  // 15. Eleanor Vance
  {
    id: 'vdir_15_vance',
    name: 'Eleanor Vance',
    background:
      'Former Chair of two NYSE companies. Began career in investment banking (Goldman Sachs consumer practice). Expert in managing activist situations and proxy contests. Widely respected in US governance circles.',
    domainRatings: {
      financialOversight: 68,
      regulatoryLegal: 55,
      strategyMarkets: 78,
      peopleCulture: 65,
      esgSustainability: 58,
      geopoliticalMacro: 50,
      technologyDigital: 35,
      stakeholderComms: 91,
    },
    jurisdictionScores: { US: 96 },
    independence: 'independent',
    tenure: 0,
    annualFee: 320_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'BOARD CHAIR / INDEPENDENT CHAIR (primary candidate — highest Stakeholder score, Chair experience, activist credibility). Also LID-capable.',
    inherited: false,
  },

  // 16. James Oduya-Washington
  {
    id: 'vdir_16_oduya_washington',
    name: 'James Oduya-Washington',
    background:
      'Former Head of Corporate Governance at a major US asset manager (Vanguard equivalent). Deep knowledge of institutional shareholder expectations and proxy voting policies.',
    domainRatings: {
      financialOversight: 50,
      regulatoryLegal: 44,
      strategyMarkets: 55,
      peopleCulture: 58,
      esgSustainability: 65,
      geopoliticalMacro: 38,
      technologyDigital: 40,
      stakeholderComms: 88,
    },
    jurisdictionScores: { US: 92 },
    independence: 'independent',
    tenure: 0,
    annualFee: 135_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Lead Independent Director (excellent for institutional investor engagement), proxy adviser events, Nom/Gov Committee',
    inherited: false,
  },

  // ═══════════════════════════════════════════════════════
  // TIER C — Search Firm Only
  // ═══════════════════════════════════════════════════════

  // 17. Dr. Amara Singh — TIER C
  {
    id: 'vdir_17_singh',
    name: 'Dr. Amara Singh',
    background:
      'Former FTC Commissioner. Expert in antitrust, consumer protection, and food industry regulation. Rarely takes board roles. Appointment would send a powerful signal to regulators.',
    domainRatings: {
      financialOversight: 48,
      regulatoryLegal: 96,
      strategyMarkets: 58,
      peopleCulture: 44,
      esgSustainability: 70,
      geopoliticalMacro: 65,
      technologyDigital: 38,
      stakeholderComms: 75,
    },
    jurisdictionScores: { US: 98 },
    independence: 'independent',
    tenure: 0,
    annualFee: 225_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Regulatory events (elite effectiveness), FTC/FDA investigations, Consumer Affairs & Regulatory Committee Chair — the most powerful regulatory director in the Vantage pool',
    inherited: false,
  },

  // 18. Richard Blackwood — TIER C
  {
    id: 'vdir_18_blackwood',
    name: 'Richard Blackwood',
    background:
      'Former CEO of a Fortune 100 consumer goods company. One of the most recognised names in US consumer goods governance. Appointment would immediately signal board seriousness to activists.',
    domainRatings: {
      financialOversight: 78,
      regulatoryLegal: 55,
      strategyMarkets: 96,
      peopleCulture: 68,
      esgSustainability: 62,
      geopoliticalMacro: 58,
      technologyDigital: 48,
      stakeholderComms: 88,
    },
    jurisdictionScores: { US: 94 },
    independence: 'independent',
    tenure: 0,
    annualFee: 280_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Board Chair (elite), activist defence events, strategic review events — the strongest overall director in the Vantage pool',
    inherited: false,
  },
];
