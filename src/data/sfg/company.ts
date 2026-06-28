import type { Company } from '@/types/game';

export const straitsFinancialGroup: Company = {
  id: 'company_sfg',
  name: 'Straits Financial Group Pte Ltd',
  shortName: 'STRAITS',
  shortNameSuffix: 'FINANCIAL',
  stockExchange: 'Singapore Exchange (SGX Mainboard)',
  marketCap: 'SGD 8.4 billion',
  marketCapTier: 'large',
  industry: 'Financial Services — Regional Banking, Wealth Management, Insurance',
  jurisdiction: 'SG',
  headquarters: 'Marina Bay Financial Centre, Singapore',
  operations:
    'Singapore (55%), Malaysia (18%), Indonesia (12%), Vietnam (8%), Thailand (7%)',
  annualRevenue: 'SGD 2.1 billion',
  employees: 8_200,
  startingSvIndex: 100,
  boardBudget: 5_200_000,
  startingGovernanceHealth: 58,
  startingGovernanceHealthBreakdown: {
    boardIndependence: 10,
    committeeCompleteness: 9,
    chairCeoSeparation: 15,
    esgGovernance: 12,
    skillMatrixCoverage: 12,
    total: 58,
  },
  governanceLabels: {
    chairCeoSeparation: 'Chair/CEO & BRC Separation',
    esgGovernance: 'Risk Governance Quality',
    skillMatrixCoverage: 'ESG & Sustainability Oversight',
  },
  difficultyTier: 4,
  narrative:
    "Straits Financial Group is a Singapore-headquartered regional financial holding company with roots tracing to 1968. Today it spans retail and corporate banking, wealth management for Southeast Asian high-net-worth individuals, and a life insurance subsidiary. With Temasek Holdings as its anchor shareholder at 34%, SFG operates under the dual pressure of state expectations and the increasingly vocal demands of institutional minority shareholders. Its current Chair, Dato' Lim Boon Kiat, is a former MAS senior official — a background that once reassured the market but now draws scrutiny over the blurring of regulatory and commercial independence. Three long-serving directors have exceeded or reached the 9-year SGX independence cap. The Risk Committee missed two early-warning indicators ahead of a SGD 340 million Vietnam credit loss, and MAS has issued a private supervisory letter flagging board risk oversight concerns. A whistleblower has alleged related-party transactions involving the CEO's family trust. The governance problems are structural, the regulatory environment is unforgiving, and time is short.",
  executives: [
    {
      role: 'Group CEO',
      name: 'Raymond Tan Chee Wai',
      tenure: '6 years',
      notes:
        "Ambitious, growth-oriented. Championing Indonesia digital bank expansion. Whistleblower allegation involves his family trust.",
    },
    {
      role: 'Group CFO',
      name: 'Priya Subramaniam',
      tenure: '3 years',
      notes:
        'Technically strong ex-GIC. Privately concerned about Vietnam credit exposure. Has flagged issues internally that the BRC did not act on.',
    },
    {
      role: 'Chief Risk Officer',
      name: 'David Khoo',
      tenure: '8 years',
      notes:
        "Long-serving. Seen as too close to CEO. Did not escalate Vietnam warning signs to the board in time.",
    },
    {
      role: 'Group General Counsel',
      name: 'Melissa Ong',
      tenure: '2 years',
      notes:
        'Recently appointed. Navigating whistleblower complaint with limited board direction.',
    },
    {
      role: 'Head of Wealth Management',
      name: 'James Hartley',
      tenure: '4 years',
      notes:
        "Runs the high-margin private banking arm. Key to SFG's regional growth story.",
    },
  ],
  committees: [
    {
      id: 'audit',
      name: 'Audit Committee',
      status: 'vacant',
      chairDirectorId: null,
      membersRequired:
        'Min. 3 independent; Chair must have financial expertise (MAS/SGX requirement)',
      notes:
        'AC Chair VACANT — active compliance breach. MAS has been notified. Must appoint qualified Chair with Financial Oversight expertise.',
    },
    {
      id: 'risk',
      name: 'Board Risk Committee',
      status: 'active',
      chairDirectorId: 'sfgdir_01_lim',
      membersRequired:
        'Min. 3 members; at least one with risk management expertise. Chair must not also be Board Chair (MAS requirement)',
      notes:
        "Dato' Lim chairs both BRC and the board — MAS has flagged this dual role. BRC received two unactioned CFO risk escalation memos before the Vietnam credit loss.",
    },
    {
      id: 'nomination',
      name: 'Nominating Committee',
      status: 'active',
      chairDirectorId: 'sfgdir_02_soong',
      membersRequired: 'Min. 3 members, majority independent (SGX)',
      notes:
        'Helena Soong acting Chair. Has not actioned tenure reform despite 3 directors at or exceeding the 9-year cap.',
    },
    {
      id: 'remuneration',
      name: 'Remuneration Committee',
      status: 'active',
      chairDirectorId: 'sfgdir_03_goh',
      membersRequired: 'Min. 3 members, majority independent (SGX)',
      notes:
        "Winston Goh chairs. No clawback provisions in CEO Raymond Tan's SGD 4.2m LTIP — under scrutiny post-Vietnam loss.",
    },
    {
      id: 'strategy',
      name: 'Board Credit Committee',
      status: 'active',
      chairDirectorId: 'sfgdir_02_soong',
      membersRequired: 'Min. 3 members including financial risk expertise',
      notes:
        'Helena Soong also chairs. Failed to act on Vietnam portfolio early-warning signals — post-loss review underway.',
    },
    {
      id: 'sustainability',
      name: 'Sustainability Committee',
      status: 'not_established',
      chairDirectorId: null,
      membersRequired: 'N/A — committee not yet formed',
      notes:
        'MAS expects board-level sustainability oversight by 2026. Not yet formed. Failure to form by Q3 triggers proxy advisor criticism and SFG-07. Formation cost: SGD 120k p.a.',
      formationCost: 120_000,
    },
  ],
  excludeDirectorIds: [],
  inheritedBoard: [
    { directorId: 'sfgdir_01_lim', role: 'chair', baseFee: 0 },
    { directorId: 'sfgdir_02_soong', role: 'sid', baseFee: 280_000 },
    { directorId: 'sfgdir_03_goh', role: 'remChair', baseFee: 240_000 },
    { directorId: 'sfgdir_04_rahman', role: 'ned', baseFee: 160_000 },
    { directorId: 'sfgdir_05_png', role: 'ned', baseFee: 0 },
  ],
  eventSchedule: [
    { eventId: 'sfgevent_01', quarter: 'Q1', turn: 1 },
    { eventId: 'sfgevent_02', quarter: 'Q1', turn: 2 },
    { eventId: 'sfgevent_03', quarter: 'Q1', turn: 3 },
    { eventId: 'sfgevent_04', quarter: 'Q2', turn: 1 },
    { eventId: 'sfgevent_05', quarter: 'Q2', turn: 2 },
    { eventId: 'sfgevent_06', quarter: 'Q2', turn: 3 },
    { eventId: 'sfgevent_07', quarter: 'Q3', turn: 1 },
    { eventId: 'sfgevent_08', quarter: 'Q3', turn: 2 },
    { eventId: 'sfgevent_09', quarter: 'Q3', turn: 3 },
    { eventId: 'sfgevent_10', quarter: 'Q4', turn: 1 },
    { eventId: 'sfgevent_11', quarter: 'Q4', turn: 2 },
    { eventId: 'sfgevent_12', quarter: 'Q4', turn: 3 },
    { eventId: 'sfgevent_13', quarter: 'AGM', turn: 1 },
    { eventId: 'sfgevent_14', quarter: 'Q4', turn: 3 },
    { eventId: 'sfgevent_15', quarter: 'Q4', turn: 1 },
  ],
  directorIds: [
    // Inherited board
    'sfgdir_01_lim',
    'sfgdir_02_soong',
    'sfgdir_03_goh',
    'sfgdir_04_rahman',
    'sfgdir_05_png',
    // Candidate pool
    'sfgdir_06_lee',
    'sfgdir_07_anwar',
    'sfgdir_08_tan_margaret',
    'sfgdir_09_pillai',
    'sfgdir_10_faridah',
    'sfgdir_11_khoo',
    'sfgdir_12_wu',
    'sfgdir_13_vikram',
    'sfgdir_14_ho',
    'sfgdir_15_samuel',
    'sfgdir_16_krishnamurthy',
    'sfgdir_17_ng',
    'sfgdir_18_loh',
    'sfgdir_19_rashid',
    'sfgdir_20_beaumont',
    'sfgdir_21_halliday',
    'sfgdir_22_fauzi',
    'sfgdir_23_eleanor',
    'sfgdir_24_chen',
    'sfgdir_25_grace',
    'sfgdir_26_rajan',
    'sfgdir_27_phua',
  ],
};
