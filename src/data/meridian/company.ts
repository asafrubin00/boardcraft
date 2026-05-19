import type { Company } from '@/types/game';

export const meridianFoundation: Company = {
  id: 'company_meridian',
  name: 'Meridian Foundation',
  shortName: 'MERIDIAN',
  shortNameSuffix: 'FOUNDATION',
  // Replaces stock exchange — Charity Commission register number
  stockExchange: 'Charity Commission Register — No. 1189742',
  // Replaces market cap — annual income figure
  marketCap: '£38m annual income',
  marketCapTier: 'mid',
  industry: 'International Development — Health, Education & Livelihoods',
  jurisdiction: 'UK',
  headquarters: 'London, UK (Southwark)',
  operations: 'UK (HQ & fundraising), Kenya, Uganda, Bangladesh, Colombia',
  annualRevenue: '£38 million (90% grant/donor-funded)',
  employees: 320,
  // startingSvIndex carries the Mission Integrity Score for this company
  startingSvIndex: 68,
  // Trustees are unpaid volunteers — no board budget
  boardBudget: 0,
  startingGovernanceHealth: 51,
  startingGovernanceHealthBreakdown: {
    // Charity governance dimensions mapped to existing breakdown fields:
    boardIndependence:     7,  // → Independence & Conflicts of Interest
    committeeCompleteness: 8,  // → Accountability & Transparency
    chairCeoSeparation:   11,  // → Board Composition & Diversity (founder dynamic)
    esgGovernance:        12,  // → Mission Alignment & Strategy
    skillMatrixCoverage:  13,  // → Financial Stewardship
    total: 51,
  },
  difficultyTier: 4,
  narrative:
    "Meridian Foundation was established in 2003 by Dr. Evelyn Osei-Bonsu, a Ghanaian-British development economist who built the organisation from a small school-building initiative in rural Kenya into one of the UK's mid-tier international development charities. That reputation has frayed. A funding crisis triggered by cuts to Official Development Assistance has led CEO Marcus Finch to aggressively pursue grants from donors whose priorities do not align with Meridian's charitable objects. The board has been slow to notice the drift. Dr. Osei-Bonsu — who remains as a trustee after stepping down as founding CEO in 2017 — conflates her personal legacy with the organisation's best interests. The player inherits a board with one undisclosed conflict of interest, a founder who cannot let go, a CEO under pressure to chase money rather than mission, and a Charity Commission that is watching. Trustees are personally liable. The Mission Integrity Score replaces the Shareholder Value Index.",
  executives: [
    {
      role: 'CEO',
      name: 'Marcus Finch',
      tenure: '18 months',
      notes:
        'Former DFID/FCDO civil servant; risk-averse; under pressure to grow income. His relationship with Dr. Osei-Bonsu is increasingly tense — he regards her as a parallel authority who bypasses him to reach programme staff directly.',
    },
    {
      role: 'COO',
      name: 'Dr. Priya Anand',
      tenure: '12 years',
      notes:
        'Operationally strong; deeply trusted by field staff. Privately sceptical of the grant-chasing strategy but publicly loyal to Marcus. Potential CEO succession candidate.',
    },
    {
      role: 'CFO',
      name: 'James Woolley',
      tenure: '3 years',
      notes:
        'Joined from a mid-tier housing association. Not specialist in development sector accounting. Has flagged liquidity risks to the Finance Committee informally; has not yet escalated to full board.',
    },
    {
      role: 'Director of Programmes',
      name: 'Amara Diallo',
      tenure: '5 years',
      notes:
        'Leads all four country programmes. Wrote the original 2023 programme strategy now being quietly diluted. Her discomfort is becoming visible at sub-committee level.',
    },
    {
      role: 'Director of Fundraising',
      name: 'Chloe Baxter',
      tenure: '2 years',
      notes:
        'Joined from a commercial fundraising agency. Highly effective at donor acquisition; limited understanding of how grant conditions interact with charitable objects.',
    },
  ],
  committees: [
    {
      id: 'audit',
      name: 'Finance & Risk Committee',
      status: 'active',
      chairDirectorId: 'mdir_cavendish',
      membersRequired: 'Min. 3 trustees; at least one with financial oversight competency',
      notes:
        "Robert Cavendish chairs by delegation from the board chair. ALERT: undisclosed conflict of interest — Cavendish's brother-in-law's logistics firm is shortlisted for the Uganda supply contract (£400k). CFO has flagged liquidity risk not yet formally escalated.",
    },
    {
      id: 'remuneration',
      name: 'People & Culture Committee',
      status: 'active',
      chairDirectorId: 'mdir_ashworth',
      membersRequired: 'Min. 2 trustees; HR/people management experience preferred',
      notes:
        'Chaired by Daniel Ashworth. Covers CEO performance review, staff pay, safeguarding policy, and whistleblowing. No lay members on any committee — a Charity Governance Code gap.',
    },
    {
      id: 'csrd',
      name: 'Programmes & Impact Committee',
      status: 'active',
      chairDirectorId: 'mdir_osei_bonsu',
      membersRequired: 'Min. 2 trustees; programme and international development expertise preferred',
      notes:
        "Chaired by Dr. Osei-Bonsu — gives the founder direct leverage over mission-critical decisions. Has not formally reviewed mission alignment in 18 months. The most contested seat in the scenario.",
    },
    {
      id: 'nomination',
      name: 'Trustee Recruitment & Succession',
      status: 'not_established',
      chairDirectorId: null,
      membersRequired: 'N/A — constituted ad hoc when a vacancy arises',
      notes:
        "Not yet constituted. The current vacancy (Dr. Sarah Lim's seat) is the player's first strategic decision. Establishing a formal recruitment committee is a Charity Governance Code recommendation.",
    },
  ],
  excludeDirectorIds: [],
  governanceLabels: {
    boardIndependence:     'Independence & Conflicts of Interest',
    committeeCompleteness: 'Committee Oversight',
    chairCeoSeparation:    'Mission Alignment & Strategy',
    esgGovernance:         'Accountability & Transparency',
    skillMatrixCoverage:   'Financial Stewardship',
  },
  inheritedBoard: [
    { directorId: 'mdir_mensah',     role: 'chair',     baseFee: 0 },
    { directorId: 'mdir_osei_bonsu', role: 'ned',        baseFee: 0 },
    { directorId: 'mdir_ashworth',   role: 'remChair',   baseFee: 0 },
    { directorId: 'mdir_alrashid',   role: 'ned',        baseFee: 0 },
    { directorId: 'mdir_cavendish',  role: 'auditChair', baseFee: 0 },
  ],
  eventSchedule: [
    { eventId: 'mevent_01', quarter: 'Q1', turn: 1 },
    { eventId: 'mevent_02', quarter: 'Q1', turn: 2 },
    { eventId: 'mevent_03', quarter: 'Q1', turn: 3 },
    { eventId: 'mevent_04', quarter: 'Q1', turn: 4 },
    { eventId: 'mevent_05', quarter: 'Q2', turn: 1 },
    { eventId: 'mevent_06', quarter: 'Q2', turn: 2 }, // conditional on mevent_02 partial/failure
    { eventId: 'mevent_07', quarter: 'Q2', turn: 3 },
    { eventId: 'mevent_08', quarter: 'Q2', turn: 4 }, // conditional on mevent_01 partial/failure
    { eventId: 'mevent_09', quarter: 'AGM', turn: 1 }, // conditional; probability ↑ if mevent_03 partial/fail
    { eventId: 'mevent_10', quarter: 'Q3', turn: 1 },
    { eventId: 'mevent_11', quarter: 'Q3', turn: 2 },
    { eventId: 'mevent_12', quarter: 'Q3', turn: 3 },
    { eventId: 'mevent_13', quarter: 'Q4', turn: 1 },
    { eventId: 'mevent_14', quarter: 'Q4', turn: 2 },
    { eventId: 'mevent_15', quarter: 'Q4', turn: 3 },
  ],
  directorIds: [
    // Inherited trustees
    'mdir_mensah', 'mdir_osei_bonsu', 'mdir_ashworth', 'mdir_alrashid', 'mdir_cavendish',
    // Meridian-specific candidate trustees
    'mdir_01_okonkwo', 'mdir_02_nwosu',    'mdir_03_hedley',
    'mdir_04_yusuf',   'mdir_05_webb',     'mdir_06_mbeki',
    'mdir_07_patel',   'mdir_08_gao',      'mdir_09_adeyemi',
    'mdir_10_hartley', 'mdir_11_blythe',   'mdir_12_malik',
    // Cross-listed from shared pools — high geo/esg/regulatory scores, development fit
    'dir_04_pemberton',  // Former Energy Secretary; bilateral donor / Whitehall networks
    'dir_06_macallister',// UK regulatory KC; Charity Commission compliance depth
    'dir_09_diallo',     // West Africa strategy & ESG; Kenya/Uganda operational context
    'dir_11_oduya',      // Governance professor; FRC panels; Charity Governance Code fit
    'dir_13_okafor',     // Environment Agency DG; ESG oversight; programme accountability
    'dir_14_larsson',    // Nordic CSO, TCFD; impact reporting; beneficiary accountability
    'vdir_04_park',      // VP Sustainability; supply-chain ethics; ESG mission fit
    'vdir_12_okoye',     // Harvard governance professor; accountability / Code Assessor fit
  ],
};
