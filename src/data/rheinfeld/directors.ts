import type { Director } from '@/types/game';

export const rheinfeldDirectors: Director[] = [
  // ── Heinrich Rheinfeld - Fixed Supervisory Board Chair ──
  {
    id: 'rdir_heinrich',
    name: 'Heinrich Rheinfeld',
    background:
      "Founder's son. Ran the company for 20 years before transitioning to Supervisory Board Chair. Knows every corner of the business. Believes governance reform is a distraction invented by people who have never built anything.",
    domainRatings: {
      financialOversight: 72, regulatoryLegal: 55, strategyMarkets: 81,
      peopleCulture: 48, esgSustainability: 22, geopoliticalMacro: 61,
      technologyDigital: 19, stakeholderComms: 58,
    },
    jurisdictionScores: { EU: 95 },
    independence: 'non-independent',
    tenure: 15,
    annualFee: 320_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: {
      description: "Heinrich has been negotiating a private side-deal with a Chinese partner that conflicts with the Management Board's official China strategy. If discovered, this creates a major conflict-of-interest crisis.",
      activationProbability: 100,
      triggerCategories: ['regulatoryLegal', 'stakeholderComms'],
      activated: false,
    },
    suitableRoles: 'Fixed Chair - cannot be removed except via Tier 3 shareholder vote event.',
    inherited: true,
  },

  // ── Margarethe Rheinfeld - Inherited NED (shareholder) ──
  {
    id: 'rdir_margarethe',
    name: 'Margarethe Rheinfeld',
    background:
      "Heinrich's daughter. Board member for three years. Votes with her father on everything. Weak independent credentials but family loyalty is absolute.",
    domainRatings: {
      financialOversight: 42, regulatoryLegal: 38, strategyMarkets: 55,
      peopleCulture: 60, esgSustainability: 45, geopoliticalMacro: 30,
      technologyDigital: 35, stakeholderComms: 48,
    },
    jurisdictionScores: { EU: 85 },
    independence: 'non-independent',
    tenure: 3,
    annualFee: 120_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'NED only. Votes with Heinrich on all contested matters.',
    inherited: true,
  },

  // ── Dr. Wolfgang Strasser - Inherited NED (shareholder, questionable) ──
  {
    id: 'rdir_strasser',
    name: 'Dr. Wolfgang Strasser',
    background:
      'Former Rheinfeld AG CFO. Eight years on the Supervisory Board. GCGC flags former executives on supervisory boards - the two-year cooling-off period should apply but he was appointed before stricter enforcement.',
    domainRatings: {
      financialOversight: 78, regulatoryLegal: 52, strategyMarkets: 65,
      peopleCulture: 35, esgSustainability: 28, geopoliticalMacro: 40,
      technologyDigital: 22, stakeholderComms: 45,
    },
    jurisdictionScores: { EU: 88 },
    independence: 'questionable',
    tenure: 8,
    annualFee: 140_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'NED. Financial expertise but independence is questionable - former executive.',
    inherited: true,
  },

  // ── Worker Representatives (Fixed - cannot be assigned or removed) ──
  {
    id: 'rdir_w_koch',
    name: 'Hans-Werner Koch',
    background:
      'Senior IG Metall official. Six years on the Supervisory Board. Opposes the China pivot. Supports CSRD. Will support the player on ESG if treated respectfully.',
    domainRatings: {
      financialOversight: 35, regulatoryLegal: 55, strategyMarkets: 40,
      peopleCulture: 82, esgSustainability: 65, geopoliticalMacro: 45,
      technologyDigital: 20, stakeholderComms: 70,
    },
    jurisdictionScores: { EU: 90 },
    independence: 'non-independent',
    tenure: 6,
    annualFee: 90_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Worker representative - fixed seat, non-assignable.',
    inherited: true,
  },
  {
    id: 'rdir_w_alrashid',
    name: 'Fatima Al-Rashid',
    background:
      'Works council chair. Pragmatic. Open to reform if job security is protected.',
    domainRatings: {
      financialOversight: 30, regulatoryLegal: 48, strategyMarkets: 35,
      peopleCulture: 78, esgSustainability: 55, geopoliticalMacro: 28,
      technologyDigital: 25, stakeholderComms: 65,
    },
    jurisdictionScores: { EU: 88 },
    independence: 'non-independent',
    tenure: 4,
    annualFee: 90_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Worker representative - fixed seat, non-assignable.',
    inherited: true,
  },
  {
    id: 'rdir_w_hoffmann',
    name: 'Dieter Hoffmann',
    background:
      'IG BCE representative. Nine years on the board. Sceptical of all management proposals. Votes with Koch on most issues.',
    domainRatings: {
      financialOversight: 28, regulatoryLegal: 42, strategyMarkets: 30,
      peopleCulture: 72, esgSustainability: 40, geopoliticalMacro: 35,
      technologyDigital: 15, stakeholderComms: 55,
    },
    jurisdictionScores: { EU: 86 },
    independence: 'non-independent',
    tenure: 9,
    annualFee: 90_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Worker representative - fixed seat, non-assignable.',
    inherited: true,
  },
  {
    id: 'rdir_w_mehta',
    name: 'Priya Mehta',
    background:
      'Represents senior managers. More reform-friendly than other worker representatives. Values CSRD compliance.',
    domainRatings: {
      financialOversight: 45, regulatoryLegal: 50, strategyMarkets: 48,
      peopleCulture: 68, esgSustainability: 62, geopoliticalMacro: 38,
      technologyDigital: 42, stakeholderComms: 58,
    },
    jurisdictionScores: { EU: 87 },
    independence: 'non-independent',
    tenure: 2,
    annualFee: 90_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Worker representative - fixed seat, non-assignable. Most reform-friendly worker rep.',
    inherited: true,
  },
  {
    id: 'rdir_w_gruber',
    name: 'Thomas Gruber',
    background:
      'Works council member. Loyal to Koch. Rarely breaks ranks. Votes as a bloc.',
    domainRatings: {
      financialOversight: 25, regulatoryLegal: 38, strategyMarkets: 28,
      peopleCulture: 70, esgSustainability: 42, geopoliticalMacro: 22,
      technologyDigital: 18, stakeholderComms: 50,
    },
    jurisdictionScores: { EU: 84 },
    independence: 'non-independent',
    tenure: 5,
    annualFee: 90_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Worker representative - fixed seat, non-assignable.',
    inherited: true,
  },

  // ── New Directors - Available for Appointment ──

  // 1. Prof. Dr. Sabine Lehrmann
  {
    id: 'rdir_01_lehrmann',
    name: 'Prof. Dr. Sabine Lehrmann',
    background:
      'Former President of the German Corporate Governance Commission. Professor at Humboldt University. The most credible governance reform voice available to Rheinfeld\'s supervisory board.',
    domainRatings: {
      financialOversight: 62, regulatoryLegal: 81, strategyMarkets: 55,
      peopleCulture: 70, esgSustainability: 74, geopoliticalMacro: 44,
      technologyDigital: 48, stakeholderComms: 85,
    },
    jurisdictionScores: { EU: 97 },
    independence: 'independent',
    tenure: 0,
    annualFee: 155_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Audit Committee Chair (strong), CSRD Committee Chair if formed, Nomination Committee reform - the single most important appointment available.',
    inherited: false,
  },

  // 2. Dr. Marcus Fleischer
  {
    id: 'rdir_02_fleischer',
    name: 'Dr. Marcus Fleischer',
    background:
      'Former CFO of a DAX 40 industrial company. HGB and IFRS expert. Has served on three Audit Committees. Exactly what Rheinfeld\'s Audit Committee needs.',
    domainRatings: {
      financialOversight: 92, regulatoryLegal: 65, strategyMarkets: 58,
      peopleCulture: 38, esgSustainability: 41, geopoliticalMacro: 35,
      technologyDigital: 30, stakeholderComms: 44,
    },
    jurisdictionScores: { EU: 93 },
    independence: 'independent',
    tenure: 0,
    annualFee: 140_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Audit Committee Chair (ideal - financial expert qualification met), Remuneration Committee member.',
    inherited: false,
  },

  // 3. Ingrid Hartmann
  {
    id: 'rdir_03_hartmann',
    name: 'Ingrid Hartmann',
    background:
      'Former State Secretary for Economic Affairs, NRW. Deep political network in Berlin and Brussels. Expert in German industrial policy, EU trade regulation, and government relations.',
    domainRatings: {
      financialOversight: 38, regulatoryLegal: 88, strategyMarkets: 62,
      peopleCulture: 52, esgSustainability: 58, geopoliticalMacro: 84,
      technologyDigital: 28, stakeholderComms: 79,
    },
    jurisdictionScores: { EU: 94 },
    independence: 'independent',
    tenure: 0,
    annualFee: 145_000,
    availabilityTier: 'B',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'US tariff events, EU regulatory events, government relations strategies, CSRD lobbying.',
    inherited: false,
  },

  // 4. Dr. Yuki Taniguchi
  {
    id: 'rdir_04_taniguchi',
    name: 'Dr. Yuki Taniguchi',
    background:
      'Former Asia Pacific Director at a major German industrial company. Expert in Chinese market dynamics, supply chain strategy, and geopolitical risk in manufacturing. Speaks Mandarin and Japanese.',
    domainRatings: {
      financialOversight: 55, regulatoryLegal: 48, strategyMarkets: 82,
      peopleCulture: 44, esgSustainability: 52, geopoliticalMacro: 91,
      technologyDigital: 48, stakeholderComms: 58,
    },
    jurisdictionScores: { EU: 81 },
    independence: 'independent',
    tenure: 0,
    annualFee: 130_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'China pivot events, US tariff events, geopolitical risk events - uniquely valuable for Rheinfeld\'s Asian exposure.',
    inherited: false,
  },

  // 5. Prof. Dr. Anna Becker
  {
    id: 'rdir_05_becker',
    name: 'Prof. Dr. Anna Becker',
    background:
      'Professor of Sustainability Management at RWTH Aachen. Led the CSRD implementation working group for the German industry association. The leading CSRD expert in the available pool.',
    domainRatings: {
      financialOversight: 41, regulatoryLegal: 62, strategyMarkets: 55,
      peopleCulture: 48, esgSustainability: 95, geopoliticalMacro: 38,
      technologyDigital: 52, stakeholderComms: 68,
    },
    jurisdictionScores: { EU: 90 },
    independence: 'independent',
    tenure: 0,
    annualFee: 120_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'CSRD Committee Chair (ideal if formed), ESG and sustainability events, supply chain emissions events.',
    inherited: false,
  },

  // 6. Karl-Heinz Brandt
  {
    id: 'rdir_06_brandt',
    name: 'Karl-Heinz Brandt',
    background:
      'Former CEO of a mid-size German automotive supplier. Understands the industry deeply. Has restructured two companies and managed two rounds of workforce reduction - IG Metall knows and respects him even when they disagree.',
    domainRatings: {
      financialOversight: 68, regulatoryLegal: 44, strategyMarkets: 88,
      peopleCulture: 72, esgSustainability: 45, geopoliticalMacro: 58,
      technologyDigital: 38, stakeholderComms: 65,
    },
    jurisdictionScores: { EU: 89 },
    independence: 'independent',
    tenure: 0,
    annualFee: 150_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Strategy Committee Chair if formed, worker representative engagement events, restructuring events, China pivot vote.',
    inherited: false,
  },

  // 7. Dr. Elena Vasquez
  {
    id: 'rdir_07_vasquez',
    name: 'Dr. Elena Vasquez',
    background:
      'Chief Digital Officer (retired) of a DAX 40 manufacturing company. Led a complete Industry 4.0 transformation. Expert in OT/IT integration, manufacturing digitalisation, and cyber risk.',
    domainRatings: {
      financialOversight: 38, regulatoryLegal: 44, strategyMarkets: 65,
      peopleCulture: 40, esgSustainability: 55, geopoliticalMacro: 32,
      technologyDigital: 93, stakeholderComms: 48,
    },
    jurisdictionScores: { EU: 85 },
    independence: 'independent',
    tenure: 0,
    annualFee: 125_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Technology events, digital transformation events, cyber incidents on manufacturing infrastructure.',
    inherited: false,
  },

  // 8. Friedrich von Kessler
  {
    id: 'rdir_08_vonkessler',
    name: 'Friedrich von Kessler',
    background:
      'Former partner at a leading German M&A law firm. Expert in AktG, takeover law, and supervisory board governance. Has advised on 12 DAX company supervisory board restructurings.',
    domainRatings: {
      financialOversight: 48, regulatoryLegal: 94, strategyMarkets: 58,
      peopleCulture: 42, esgSustainability: 38, geopoliticalMacro: 44,
      technologyDigital: 28, stakeholderComms: 62,
    },
    jurisdictionScores: { EU: 96 },
    independence: 'independent',
    tenure: 0,
    annualFee: 145_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'AktG compliance events, shareholder dispute events, Heinrich conflict-of-interest events, Strasser tenure challenge.',
    inherited: false,
  },

  // 9. Claudia Neumann
  {
    id: 'rdir_09_neumann',
    name: 'Claudia Neumann',
    background:
      'Former Head of Stewardship at a major German asset manager. Expert in institutional investor expectations, proxy voting policies, and ESG disclosure standards. Has voted against management at 40+ German AGMs.',
    domainRatings: {
      financialOversight: 52, regulatoryLegal: 58, strategyMarkets: 55,
      peopleCulture: 60, esgSustainability: 78, geopoliticalMacro: 38,
      technologyDigital: 40, stakeholderComms: 88,
    },
    jurisdictionScores: { EU: 91 },
    independence: 'independent',
    tenure: 0,
    annualFee: 125_000,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Institutional shareholder engagement events, AGM strategy, proxy adviser engagement, CSRD disclosure events.',
    inherited: false,
  },

  // 10. Dr. Thomas Richter - TIER C (Search Firm Only)
  {
    id: 'rdir_10_richter',
    name: 'Dr. Thomas Richter',
    background:
      'Former President of the Federation of German Industries (BDI). Extraordinarily well-connected across German politics, industry, and EU institutions. Rarely takes supervisory board mandates.',
    domainRatings: {
      financialOversight: 65, regulatoryLegal: 72, strategyMarkets: 91,
      peopleCulture: 62, esgSustainability: 60, geopoliticalMacro: 85,
      technologyDigital: 40, stakeholderComms: 92,
    },
    jurisdictionScores: { EU: 98 },
    independence: 'independent',
    tenure: 0,
    annualFee: 240_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'Supervisory Board Chair candidate (if Heinrich removed), institutional shareholder events, government relations, strategic review - the most powerful director in the pool.',
    inherited: false,
  },

  // 11. Dr. Marta Kowalski - TIER C (Search Firm Only)
  {
    id: 'rdir_11_kowalski',
    name: 'Dr. Marta Kowalski',
    background:
      'Former ECB supervisory board member. Expert in European financial regulation, CSRD implementation, and cross-border industrial governance. Polish-German background - uniquely positioned for EU regulatory events.',
    domainRatings: {
      financialOversight: 78, regulatoryLegal: 88, strategyMarkets: 60,
      peopleCulture: 50, esgSustainability: 82, geopoliticalMacro: 70,
      technologyDigital: 44, stakeholderComms: 68,
    },
    jurisdictionScores: { EU: 94 },
    independence: 'independent',
    tenure: 0,
    annualFee: 190_000,
    availabilityTier: 'C',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: 'CSRD Committee Chair (elite), Audit Committee Chair, EU regulatory events - the best combined financial/ESG director in the pool.',
    inherited: false,
  },
];
