import type { Company } from '@/types/game';

export const vantageConsumer: Company = {
  id: 'company_vantage',
  name: 'Vantage Consumer Brands Inc',
  shortName: 'VANTAGE',
  shortNameSuffix: 'CONSUMER',
  stockExchange: 'New York Stock Exchange (NYSE)',
  marketCap: '$4.2 billion',
  marketCapTier: 'large',
  industry: 'FMCG — Food & Beverage',
  jurisdiction: 'US',
  headquarters: 'Chicago, Illinois',
  operations:
    'US (primary, 70%), Canada (15%), Mexico (10%), nascent EU expansion (5%)',
  annualRevenue: '$3.8 billion',
  employees: 12_400,
  startingSvIndex: 100,
  boardBudget: 5_800_000,
  startingGovernanceHealth: 54,
  startingGovernanceHealthBreakdown: {
    boardIndependence: 11,
    committeeCompleteness: 10,
    chairCeoSeparation: 4,
    esgGovernance: 14,
    skillMatrixCoverage: 15,
    total: 54,
  },
  difficultyTier: 3,
  narrative:
    'Vantage Consumer Brands is a large-cap American food and beverage company whose portfolio spans snack foods, sports nutrition, frozen meals, and soft drink concentrates. The company has grown aggressively through acquisition over the past decade and is now facing a reckoning: its governance structure has not kept pace with its size, its product range is under regulatory scrutiny for ultra-processed food content, and an activist hedge fund has quietly taken a position.',
  executives: [
    {
      role: 'Chair & CEO (combined)',
      name: 'Sandra Okafor',
      tenure: '3 years',
      notes:
        'Strong operator; fierce defender of combined role; compensation $14.2m last year — ISS red-flagged',
    },
    {
      role: 'CFO',
      name: 'Marcus Chen',
      tenure: '5 years',
      notes:
        'Respected by Street; privately supportive of governance reform but publicly loyal to Okafor',
    },
    {
      role: 'Chief Marketing Officer',
      name: 'Brianna Walsh',
      tenure: '2 years',
      notes:
        'Consumer brand specialist; brought in to modernise product positioning',
    },
    {
      role: 'General Counsel',
      name: 'David Ruiz',
      tenure: '7 years',
      notes:
        'Deeply embedded; knows where all bodies are buried; cautious on disclosure',
    },
    {
      role: 'Chief People Officer',
      name: 'Amara Patel',
      tenure: '1 year',
      notes:
        'New appointment; hired specifically to address culture concerns following an internal report',
    },
  ],
  committees: [
    {
      id: 'audit',
      name: 'Audit Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired:
        'Min. 3 independent; 1 financial expert required (SEC Rule 10A-3)',
      notes:
        'Currently chaired by director with related-party flag — player must replace',
    },
    {
      id: 'remuneration',
      name: 'Compensation Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired: 'All members must be independent (NYSE)',
      notes:
        'Has approved above-median pay packages 4 years running; ISS red-flagged',
    },
    {
      id: 'nomination',
      name: 'Nomination/Governance Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired: 'All members must be independent (NYSE)',
      notes:
        'Has not recommended a new independent director in 4 years; structural weakness',
    },
    {
      id: 'safetyEnvironment',
      name: 'Brand & Reputation Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired: 'Min. 2 NEDs',
      notes:
        'Exists due to Vantage consumer-facing brand risk exposure; relevant to PR events',
    },
    {
      id: 'energyTransition',
      name: 'Consumer Affairs & Regulatory Committee',
      status: 'not_established',
      chairDirectorId: null,
      membersRequired: 'N/A',
      notes:
        'Player decision: establish (costs $240k p.a.). Grants +10 bonus on regulatory/UPF events.',
      formationCost: 240_000,
    },
  ],
  excludeDirectorIds: [],
  inheritedBoard: [
    { directorId: 'vdir_01_kellerman', role: 'sid', baseFee: 180_000 },
    { directorId: 'vdir_02_nguyen', role: 'ned', baseFee: 210_000 },
    { directorId: 'vdir_03_whitfield', role: 'ned', baseFee: 155_000 },
    { directorId: 'vdir_04_park', role: 'ned', baseFee: 155_000 },
  ],
  eventSchedule: [
    { eventId: 'vevent_01', quarter: 'Q1', turn: 1 },
    { eventId: 'vevent_02', quarter: 'Q1', turn: 2 },
    { eventId: 'vevent_03', quarter: 'Q1', turn: 3 },
    { eventId: 'vevent_04', quarter: 'Q1', turn: 4 },
    { eventId: 'vevent_05', quarter: 'Q2', turn: 1 },
    { eventId: 'vevent_06', quarter: 'Q2', turn: 2 },
    { eventId: 'vevent_07', quarter: 'Q2', turn: 3 },
    { eventId: 'vevent_08', quarter: 'Q2', turn: 4 },
    { eventId: 'vevent_09', quarter: 'AGM', turn: 1 },
    { eventId: 'vevent_10', quarter: 'Q3', turn: 1 },
    { eventId: 'vevent_11', quarter: 'Q3', turn: 2 },
    { eventId: 'vevent_12', quarter: 'Q3', turn: 3 },
    { eventId: 'vevent_13', quarter: 'Q4', turn: 1 },
    { eventId: 'vevent_14', quarter: 'Q4', turn: 2 },
    { eventId: 'vevent_15', quarter: 'Q4', turn: 3 },
  ],
  directorIds: [
    'vdir_01_kellerman', 'vdir_02_nguyen', 'vdir_03_whitfield', 'vdir_04_park',
    'vdir_05_stern', 'vdir_06_osei_bonsu', 'vdir_07_finch', 'vdir_08_dominguez',
    'vdir_09_marchetti', 'vdir_10_reinholt', 'vdir_11_carter', 'vdir_12_okoye',
    'vdir_13_thornton', 'vdir_14_mendez', 'vdir_15_vance', 'vdir_16_oduya_washington',
    'vdir_17_singh', 'vdir_18_blackwood',
    // Cross-listed from Harwick pool
    'dir_01_wren', 'dir_07_ashworth', 'dir_16_chen', 'dir_10_lonsdale', 'dir_21_mensah',
  ],
};
