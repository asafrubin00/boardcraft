// ── BoardCraft Director Pool ──
// Combined pool: Harwick (23) + Vantage (18) directors.
// Cross-listed directors appear once with multi-jurisdiction scores.

import type { Director } from '@/types/game';
import { vantageDirectors } from './vantage/directors';
import { rheinfeldDirectors } from './rheinfeld/directors';

export const directors: Director[] = [
  // ── Dame Helen Forsyth - departing inherited Chair ──
  {
    id: 'dir_00_forsyth',
    name: 'Dame Helen Forsyth',
    background:
      'Outgoing Chair of Harwick Energy. Served for 11 years. Respected in the City for steady leadership through multiple commodity cycles. Departing at the upcoming AGM.',
    domainRatings: {
      financialOversight: 55,
      regulatoryLegal: 50,
      strategyMarkets: 65,
      peopleCulture: 52,
      esgSustainability: 45,
      geopoliticalMacro: 40,
      technologyDigital: 15,
      stakeholderComms: 82,
    },
    jurisdictionScores: { UK: 90 },
    independence: 'independent',
    tenure: 11,
    annualFee: 310000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Departing Chair. Marked for departure at AGM - not available for reappointment.',
    inherited: true,
  },

  // ── 1. Dame Patricia Wren ──
  {
    id: 'dir_01_wren',
    name: 'Dame Patricia Wren',
    background:
      'Former Deputy Governor, Bank of England. NED at two FTSE 100 companies. Audit Committee Chair at Meridian Financial Group for 6 years.',
    domainRatings: {
      financialOversight: 92,
      regulatoryLegal: 78,
      strategyMarkets: 61,
      peopleCulture: 34,
      esgSustainability: 29,
      geopoliticalMacro: 55,
      technologyDigital: 18,
      stakeholderComms: 63,
    },
    jurisdictionScores: { UK: 91, US: 68 },
    independence: 'independent',
    tenure: 0,
    annualFee: 185000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee Chair (primary). Board Chair possible but not ideal - low ESG score will be scrutinised.',
    inherited: false,
  },

  // ── 2. Howard Bracewell ──
  {
    id: 'dir_02_bracewell',
    name: 'Howard Bracewell',
    background:
      'Former CFO of two FTSE 100 energy companies. Qualified chartered accountant. Strong North Sea sector knowledge.',
    domainRatings: {
      financialOversight: 88,
      regulatoryLegal: 55,
      strategyMarkets: 72,
      peopleCulture: 40,
      esgSustainability: 51,
      geopoliticalMacro: 48,
      technologyDigital: 29,
      stakeholderComms: 44,
    },
    jurisdictionScores: { UK: 87 },
    independence: 'independent',
    tenure: 0,
    annualFee: 155000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Former employer is under FCA investigation. If a regulatory event involving Harwick fires, this may surface and create reputational drag.',
      activationProbability: 40,
      triggerCategories: ['regulatoryLegal', 'financialOversight'],
      activated: false,
    },
    suitableRoles: 'Audit Committee Chair (ideal). Rem Committee member.',
    inherited: false,
  },

  // ── 3. Caoimhe Brennan ──
  {
    id: 'dir_03_brennan',
    name: 'Caoimhe Brennan',
    background:
      'Partner at a Big Four firm for 22 years (retired). Forensic accounting specialist. Sits on two other FTSE 250 audit committees.',
    domainRatings: {
      financialOversight: 85,
      regulatoryLegal: 61,
      strategyMarkets: 38,
      peopleCulture: 42,
      esgSustainability: 35,
      geopoliticalMacro: 22,
      technologyDigital: 30,
      stakeholderComms: 39,
    },
    jurisdictionScores: { UK: 82 },
    independence: 'independent',
    tenure: 0,
    annualFee: 125000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee member (strong). Audit Chair possible but modest Stakeholder score may limit board voice.',
    inherited: false,
  },

  // ── 4. Lord Alistair Pemberton ──
  {
    id: 'dir_04_pemberton',
    name: 'Lord Alistair Pemberton',
    background:
      'Former Secretary of State for Energy (10 years ago). Now a senior adviser at a policy consultancy. Extensive Whitehall and Brussels network.',
    domainRatings: {
      financialOversight: 31,
      regulatoryLegal: 88,
      strategyMarkets: 55,
      peopleCulture: 44,
      esgSustainability: 62,
      geopoliticalMacro: 79,
      technologyDigital: 20,
      stakeholderComms: 81,
    },
    jurisdictionScores: { UK: 93 },
    independence: 'independent',
    tenure: 0,
    annualFee: 140000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Nom Committee, government relations-heavy events. Good Board Chair candidate given Stakeholder score.',
    inherited: false,
  },

  // ── 5. Tariq Al-Fassih ──
  {
    id: 'dir_05_alfassih',
    name: 'Tariq Al-Fassih',
    background:
      'Former senior partner at global law firm. Specialist in MENA and emerging market regulatory environments and government relations.',
    domainRatings: {
      financialOversight: 38,
      regulatoryLegal: 94,
      strategyMarkets: 55,
      peopleCulture: 31,
      esgSustainability: 29,
      geopoliticalMacro: 91,
      technologyDigital: 22,
      stakeholderComms: 74,
    },
    jurisdictionScores: { UK: 71 },
    independence: 'independent',
    tenure: 0,
    annualFee: 120000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description:
        'Past advisory relationship with a government now under UK sanctions. If a sanctions-related event fires, this may surface.',
      activationProbability: 50,
      triggerCategories: ['geopoliticalMacro', 'regulatoryLegal'],
      activated: false,
    },
    suitableRoles:
      'Geopolitical events (especially West Africa exposure). Regulatory lobbying strategies.',
    inherited: false,
  },

  // ── 6. Fiona MacAllister KC ──
  {
    id: 'dir_06_macallister',
    name: 'Fiona MacAllister KC',
    background:
      "King's Counsel. Specialist in energy regulation, environmental law, and corporate crime. Former CMA panel member.",
    domainRatings: {
      financialOversight: 44,
      regulatoryLegal: 91,
      strategyMarkets: 40,
      peopleCulture: 38,
      esgSustainability: 55,
      geopoliticalMacro: 35,
      technologyDigital: 25,
      stakeholderComms: 51,
    },
    jurisdictionScores: { UK: 90 },
    independence: 'independent',
    tenure: 0,
    annualFee: 130000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Regulatory and legal events. Environmental incidents. CMA/competition scenarios.',
    inherited: false,
  },

  // ── 7. Vivienne Ashworth ──
  {
    id: 'dir_07_ashworth',
    name: 'Vivienne Ashworth',
    background:
      'Former Managing Director at Goldman Sachs (energy & natural resources). Now a portfolio NED. Strong M&A and capital markets track record.',
    domainRatings: {
      financialOversight: 79,
      regulatoryLegal: 42,
      strategyMarkets: 91,
      peopleCulture: 35,
      esgSustainability: 44,
      geopoliticalMacro: 61,
      technologyDigital: 38,
      stakeholderComms: 70,
    },
    jurisdictionScores: { UK: 85, US: 79 },
    independence: 'independent',
    tenure: 0,
    annualFee: 170000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Board Chair candidate (strong Stakeholder + Strategy). M&A events. Hostile bid defence.',
    inherited: false,
  },

  // ── 8. Geoffrey Crane - inherited ──
  {
    id: 'dir_08_crane',
    name: 'Geoffrey Crane',
    background:
      'Former CEO of a mid-size oil services company. Deep North Sea operational knowledge. Has been on the Harwick board for 12 years.',
    domainRatings: {
      financialOversight: 58,
      regulatoryLegal: 40,
      strategyMarkets: 71,
      peopleCulture: 55,
      esgSustainability: 39,
      geopoliticalMacro: 52,
      technologyDigital: 28,
      stakeholderComms: 49,
    },
    jurisdictionScores: { UK: 88 },
    independence: 'questionable',
    tenure: 12,
    annualFee: 110000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Useful for North Sea operational events. Cannot chair Audit or Rem due to independence concerns. Retention risks proxy adviser negative recommendation.',
    inherited: true,
    tenureYears: 12,
  },

  // ── 9. Amara Diallo ──
  {
    id: 'dir_09_diallo',
    name: 'Amara Diallo',
    background:
      'Former VP of Strategy at Shell. Deep experience in West Africa and Guyana. MBA from INSEAD. Growing NED portfolio.',
    domainRatings: {
      financialOversight: 52,
      regulatoryLegal: 48,
      strategyMarkets: 84,
      peopleCulture: 49,
      esgSustainability: 66,
      geopoliticalMacro: 82,
      technologyDigital: 41,
      stakeholderComms: 58,
    },
    jurisdictionScores: { UK: 74 },
    independence: 'independent',
    tenure: 0,
    annualFee: 115000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'West Africa geopolitical events, Guyana operations, ESG strategy. Good second NED for Energy Transition Committee.',
    inherited: false,
  },

  // ── 10. Harriet Lonsdale ──
  {
    id: 'dir_10_lonsdale',
    name: 'Harriet Lonsdale',
    background:
      'Former CHRO of a FTSE 100 company. Expert in executive remuneration, succession planning, and culture transformation. Serves on two Rem Committees.',
    domainRatings: {
      financialOversight: 38,
      regulatoryLegal: 44,
      strategyMarkets: 41,
      peopleCulture: 93,
      esgSustainability: 58,
      geopoliticalMacro: 25,
      technologyDigital: 32,
      stakeholderComms: 67,
    },
    jurisdictionScores: { UK: 86, US: 72 },
    independence: 'independent',
    tenure: 0,
    annualFee: 120000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Remuneration Committee Chair (ideal). People & Culture events. CEO misconduct. Succession crises.',
    inherited: false,
  },

  // ── 11. Professor James Oduya ──
  {
    id: 'dir_11_oduya',
    name: 'Professor James Oduya',
    background:
      'Academic and governance specialist. Professor of Corporate Governance at London Business School. Sits on FRC advisory panels. Frequent commentator on board effectiveness.',
    domainRatings: {
      financialOversight: 42,
      regulatoryLegal: 61,
      strategyMarkets: 38,
      peopleCulture: 77,
      esgSustainability: 70,
      geopoliticalMacro: 33,
      technologyDigital: 44,
      stakeholderComms: 69,
    },
    jurisdictionScores: { UK: 88 },
    independence: 'independent',
    tenure: 0,
    annualFee: 95000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Nom Committee. Governance health events. Proxy adviser engagement.',
    inherited: false,
  },

  // ── 12. Yuki Tanaka - inherited ──
  {
    id: 'dir_12_tanaka',
    name: 'Yuki Tanaka',
    background:
      "Elected employee representative from Harwick's offshore operations workforce. Brings frontline safety perspective. Not a career NED.",
    domainRatings: {
      financialOversight: 22,
      regulatoryLegal: 31,
      strategyMarkets: 28,
      peopleCulture: 69,
      esgSustainability: 58,
      geopoliticalMacro: 20,
      technologyDigital: 35,
      stakeholderComms: 44,
    },
    jurisdictionScores: { UK: 65 },
    independence: 'non-independent',
    tenure: 2,
    annualFee: 90000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Safety & Environment Committee. Workforce relations events. Cannot sit on Audit or Rem.',
    inherited: true,
  },

  // ── 13. Sir David Okafor - inherited ──
  {
    id: 'dir_13_okafor',
    name: 'Sir David Okafor',
    background:
      "Former Director-General of the Environment Agency. Led a major energy company's net-zero transition programme. Safety & Environment Committee Chair at Harwick.",
    domainRatings: {
      financialOversight: 33,
      regulatoryLegal: 58,
      strategyMarkets: 44,
      peopleCulture: 41,
      esgSustainability: 88,
      geopoliticalMacro: 38,
      technologyDigital: 30,
      stakeholderComms: 62,
    },
    jurisdictionScores: { UK: 83 },
    independence: 'independent',
    tenure: 6,
    annualFee: 145000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Safety & Environment Chair (current). Energy Transition Committee Chair if formed.',
    inherited: true,
  },

  // ── 14. Dr. Ingrid Larsson ──
  {
    id: 'dir_14_larsson',
    name: 'Dr. Ingrid Larsson',
    background:
      'Former Chief Sustainability Officer at a major Nordic energy company. TCFD taskforce alumna. Strong institutional investor credibility on ESG disclosure.',
    domainRatings: {
      financialOversight: 41,
      regulatoryLegal: 52,
      strategyMarkets: 59,
      peopleCulture: 44,
      esgSustainability: 92,
      geopoliticalMacro: 55,
      technologyDigital: 48,
      stakeholderComms: 71,
    },
    jurisdictionScores: { UK: 77 },
    independence: 'independent',
    tenure: 0,
    annualFee: 125000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Energy Transition Committee Chair (ideal if formed). ESG-related events. Institutional investor engagement.',
    inherited: false,
  },

  // ── 15. Margaret Holt - inherited ──
  {
    id: 'dir_15_holt',
    name: 'Margaret Holt',
    background:
      'Former Finance Director at a UK utility company. Moved into NED roles 8 years ago. Quiet but forensically thorough in audit work.',
    domainRatings: {
      financialOversight: 74,
      regulatoryLegal: 48,
      strategyMarkets: 42,
      peopleCulture: 35,
      esgSustainability: 44,
      geopoliticalMacro: 28,
      technologyDigital: 22,
      stakeholderComms: 38,
    },
    jurisdictionScores: { UK: 81 },
    independence: 'independent',
    tenure: 4,
    annualFee: 110000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Audit Committee member (strong). Not suitable for board voice roles given low Stakeholder score.',
    inherited: true,
  },

  // ── 16. Chen Wei ──
  {
    id: 'dir_16_chen',
    name: 'Chen Wei',
    background:
      'CTO of a listed SaaS company. Former GCHQ advisory panel member. Specialist in cyber risk, AI governance, and digital transformation in industrial sectors.',
    domainRatings: {
      financialOversight: 31,
      regulatoryLegal: 58,
      strategyMarkets: 72,
      peopleCulture: 35,
      esgSustainability: 60,
      geopoliticalMacro: 29,
      technologyDigital: 97,
      stakeholderComms: 41,
    },
    jurisdictionScores: { UK: 80, US: 75 },
    independence: 'independent',
    tenure: 0,
    annualFee: 95000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Cyber security events. Digital transformation committee if formed. Low cost makes them a good supplementary appointment.',
    inherited: false,
  },

  // ── 17. Priscilla Adeyemi ──
  {
    id: 'dir_17_adeyemi',
    name: 'Priscilla Adeyemi',
    background:
      'Former CIO at a FTSE 100 mining company. Led a major OT/IT cybersecurity overhaul following a ransomware attack. Strong in industrial digital contexts.',
    domainRatings: {
      financialOversight: 38,
      regulatoryLegal: 44,
      strategyMarkets: 61,
      peopleCulture: 42,
      esgSustainability: 52,
      geopoliticalMacro: 35,
      technologyDigital: 88,
      stakeholderComms: 49,
    },
    jurisdictionScores: { UK: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 105000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Technology events. Cyber incidents. OT infrastructure events (relevant to offshore platforms).',
    inherited: false,
  },

  // ── 18. Dame Frances Whitmore ──
  {
    id: 'dir_18_whitmore',
    name: 'Dame Frances Whitmore',
    background:
      'Former Chair of two FTSE 250 companies. Began career in investment banking; last decade in governance. Known for managing activist situations calmly.',
    domainRatings: {
      financialOversight: 65,
      regulatoryLegal: 55,
      strategyMarkets: 74,
      peopleCulture: 62,
      esgSustainability: 58,
      geopoliticalMacro: 48,
      technologyDigital: 30,
      stakeholderComms: 88,
    },
    jurisdictionScores: { UK: 92 },
    independence: 'independent',
    tenure: 0,
    annualFee: 270000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'BOARD CHAIR (primary candidate - highest Stakeholder score, Chair experience). Also SID-capable.',
    inherited: false,
  },

  // ── 21. Kofi Mensah ──
  {
    id: 'dir_21_mensah',
    name: 'Kofi Mensah',
    background:
      'Former Head of Investor Relations at a FTSE 100 company. Now a specialist governance consultant. Deep knowledge of institutional shareholder expectations and proxy adviser methodologies.',
    domainRatings: {
      financialOversight: 44,
      regulatoryLegal: 38,
      strategyMarkets: 52,
      peopleCulture: 55,
      esgSustainability: 61,
      geopoliticalMacro: 40,
      technologyDigital: 35,
      stakeholderComms: 91,
    },
    jurisdictionScores: { UK: 85, US: 78 },
    independence: 'independent',
    tenure: 0,
    annualFee: 105000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'SID (Senior Independent Director). Proxy adviser engagement events. Institutional investor relations crises.',
    inherited: false,
  },

  // ── 22. General Sir Philip Morrow (ret.) ──
  {
    id: 'dir_22_morrow',
    name: 'General Sir Philip Morrow (ret.)',
    background:
      'Former Chief of Defence Staff. Post-retirement non-exec at a defence contractor and an energy infrastructure company. Deep understanding of geopolitical risk and government decision-making.',
    domainRatings: {
      financialOversight: 29,
      regulatoryLegal: 55,
      strategyMarkets: 58,
      peopleCulture: 62,
      esgSustainability: 30,
      geopoliticalMacro: 94,
      technologyDigital: 38,
      stakeholderComms: 72,
    },
    jurisdictionScores: { UK: 80 },
    independence: 'independent',
    tenure: 0,
    annualFee: 130000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'West Africa / Guyana geopolitical events. Sanctions events. Government relations strategies.',
    inherited: false,
  },

  // ── 24. Dr. Eleanor Voss - TIER C ──
  {
    id: 'dir_24_voss',
    name: 'Dr. Eleanor Voss',
    background:
      'Former Managing Partner of a global strategy consultancy (energy practice). Published author on energy transition economics. Extremely high demand; not publicly available.',
    domainRatings: {
      financialOversight: 72,
      regulatoryLegal: 61,
      strategyMarkets: 95,
      peopleCulture: 58,
      esgSustainability: 88,
      geopoliticalMacro: 74,
      technologyDigital: 55,
      stakeholderComms: 82,
    },
    jurisdictionScores: { UK: 89 },
    independence: 'independent',
    tenure: 0,
    annualFee: 200000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      'Energy Transition Committee Chair (elite). Board Chair candidate. M&A/activist events - the best overall NED in the Harwick pool.',
    inherited: false,
  },

  // ── 25. Professor Nnamdi Achebe - TIER C ──
  {
    id: 'dir_25_achebe',
    name: 'Professor Nnamdi Achebe',
    background:
      'World Bank senior adviser (energy sector). Expert in West African petroleum governance and emerging market regulatory frameworks. Rarely takes board roles.',
    domainRatings: {
      financialOversight: 55,
      regulatoryLegal: 81,
      strategyMarkets: 62,
      peopleCulture: 44,
      esgSustainability: 77,
      geopoliticalMacro: 93,
      technologyDigital: 33,
      stakeholderComms: 60,
    },
    jurisdictionScores: { UK: 70 },
    independence: 'independent',
    tenure: 0,
    annualFee: 145000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles:
      "West Africa operations events. Emerging market geopolitical events - uniquely valuable for Harwick's Guyana exposure.",
    inherited: false,
  },

  // ── Vantage Consumer Brands directors ──
  ...vantageDirectors,

  // ── Rheinfeld AG directors ──
  ...rheinfeldDirectors,
];
