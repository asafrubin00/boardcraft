// ── Meridian Foundation - Event Schedule ──
// 15 events across Q1–Q4 + AGM.
// Events 06 and 08 are conditional (chain from 02 and 01 respectively).
// Event 09 is conditional with elevated trigger probability if Event 03 was partial/failure.
// svRange values represent MIS deltas (not shareholder value) for Meridian.
// imageFile fields point to /public/images/events/ — drop files there to resolve.

import type { GameEvent } from '@/types/game';

export const meridianEvents: GameEvent[] = [

  // ── Event 01 — The Undisclosed Conflict ──
  {
    id: 'mevent_01',
    name: 'The Undisclosed Conflict',
    tier: 1,
    quarter: 'Q1',
    turn: 1,
    imageFile: 'mevent-conflict-interest.jpg',
    illustrationType: 'mevent-conflict-interest',
    narrativeCard:
      "The Director of Programmes presents the Uganda supply chain tender process to the Finance & Risk Committee. A trustee with a compliance background notices that one of the shortlisted firms — Cavendish Logistics Solutions — shares a surname with trustee Robert Cavendish. A quick search confirms the connection: it is run by his brother-in-law. Cavendish has never declared this relationship. The tender is currently at evaluation stage.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'financialOversight', weight: 0.30 },
      { domain: 'stakeholderComms',   weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_01_a',
        label: 'Halt tender; require formal declaration; report to Charity Commission',
        description:
          'Full transparency — Cavendish formally declares and recuses; trustees vote to file a serious incident report. Regulatory Oversight ≥ 75 to handle the Commission interaction smoothly.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
        fallback: 'mevent_01_b',
        boardEffect: {
          removeDirectorId: 'mdir_cavendish',
          minOutcomeTier: 'CRITICAL_SUCCESS',
          requiresReplacement: true,
          vacatedRole: 'auditChair',
        },
      },
      {
        id: 'mevent_01_b',
        label: 'Require recusal; obtain legal advice; record formal minute',
        description:
          'Internal management — Commission not notified but internal record is clean. Cavendish Logistics excluded from tender.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'mevent_01_c',
        label: 'Remove Cavendish Logistics from evaluation quietly — no formal disclosure',
        description:
          'Informal resolution. No minute, no disclosure. Risk of future exposure remains.',
        multiplier: 0.50,
        competencyGates: [],
      },
      {
        id: 'mevent_01_d',
        label: 'Do nothing — conflict not addressed',
        description:
          'The whistleblower path opens. Event 08 fires on the next turn regardless of all other decisions.',
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'mevent_08',
        triggerTiers: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
        delay: 1,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 6],
        narrative:
          "The board's swift, transparent response is noted by the Charity Commission in writing — an acknowledgment that is both rare and valuable. Cavendish resigns from Finance & Risk; the tender restarts. Governance Health +6, MIS +4.",
      },
      SUCCESS: {
        svRange: [2, 3],
        narrative:
          "A proper recusal, a clean minute, a sensible outcome. The Commission is not notified but the internal record is unimpeachable. Cavendish Logistics is excluded. Governance Health +3, MIS +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, -2],
        narrative:
          "The conflict is handled informally — no minute, no disclosure. The immediate problem is contained; the underlying record is not clean. MIS -2. Charity Commission inquiry risk elevated.",
      },
      FAILURE: {
        svRange: [-6, -5],
        narrative:
          "No action taken. The tender proceeds with the conflict undeclared. A whistleblower has already drafted their email to the Charity Commission. Governance Health -5, MIS -6.",
      },
      CRITICAL_FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The conflict surfaces publicly before the board acts. The Charity Commission has received a formal complaint. All trustees are named. Governance Health -10, MIS -8. Event 08 fires immediately.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 02 — Grant or Mission? ──
  {
    id: 'mevent_02',
    name: 'Grant or Mission?',
    tier: 2,
    quarter: 'Q1',
    turn: 2,
    imageFile: 'mevent-grant-or-mission.jpg',
    illustrationType: 'mevent-grant-or-mission',
    narrativeCard:
      "The Fundraising Director presents a transformational opportunity: a £5 million grant from a Scandinavian bilateral donor for climate-resilient agriculture programming in East Africa over three years. The problem: Meridian's charitable objects are defined around health, education, and livelihoods — not environmental programming. Legal advice from the CEO's office (not yet reviewed by the board's own solicitors) suggests this 'probably' falls within charitable objects with appropriate framing. The Programmes & Impact Committee has not reviewed the application.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'esgSustainability', weight: 0.35 },
      { domain: 'strategyMarkets',   weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_02_a',
        label: 'Commission independent legal opinion; defer acceptance pending review',
        description:
          'Proper governance — independent review commissioned before any commitment. Regulatory Oversight ≥ 70 required to interpret objects stretch.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
        fallback: 'mevent_02_c',
      },
      {
        id: 'mevent_02_b',
        label: 'Accept the grant; instruct executive to align delivery with existing objects',
        description:
          'Income secured; objects tension unresolved. Programmes & Impact Committee bypassed.',
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'mevent_02_c',
        label: 'Decline the grant; issue board statement reaffirming mission focus',
        description:
          'Disciplined refusal. Income pressure increases but mission score improves significantly. ESG/Mission ≥ 65 to credibly articulate the decision.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 65 }],
        fallback: 'mevent_02_b',
      },
      {
        id: 'mevent_02_d',
        label: 'Accept in principle pending trustee objects review and public consultation',
        description:
          'A compromise route — conditional acceptance subject to formal review. Signals seriousness without losing the opportunity.',
        multiplier: 1.00,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 10,
    followOnTriggers: [
      {
        eventId: 'mevent_06',
        triggerTiers: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
        delay: 1,
      },
    ],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [5, 4],
        narrative:
          "Independent review confirms the objects stretch is manageable with a formal amendment; Charity Commission notified of change in activities. The Scandinavian donor cites Meridian's governance rigour as exceptional. MIS +5, Governance Health +4.",
      },
      SUCCESS: {
        svRange: [6, 2],
        narrative:
          "The board declines with a clear, principled statement. Short-term income pain; long-term mission clarity restored. MIS +6, Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3, -3],
        narrative:
          "Grant accepted without independent legal review. The objects tension is unresolved, deferred to the executive. MIS -3. Charity Commission compliance review risk flagged.",
      },
      FAILURE: {
        svRange: [-7, -4],
        narrative:
          "Grant accepted; executive proceeds without board oversight; objects concern raised externally by a staff member. MIS -7, Governance Health -4. Compliance review opens.",
      },
      CRITICAL_FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The objects breach is material and public. A former trustee has written to the Charity Commission. The grant money is committed; the mission is not. MIS -10, Governance Health -8.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 03 — The Founder's Memo ──
  {
    id: 'mevent_03',
    name: "The Founder's Memo",
    tier: 2,
    quarter: 'Q1',
    turn: 3,
    imageFile: 'mevent-founders-memo.jpg',
    illustrationType: 'mevent-founders-memo',
    narrativeCard:
      "Dr. Evelyn Osei-Bonsu has sent a detailed operational memo directly to the four country programme managers — bypassing the CEO entirely — outlining her view of the direction the Uganda programme should take. The CEO learns of this from the Director of Programmes. Osei-Bonsu's memo is substantively reasonable; its process is constitutionally improper. The CEO comes to the board chair, who is reluctant to confront her co-trustee.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'regulatoryLegal',  weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_03_a',
        label: 'Raise formally at full board; conduct trustee code of conduct review',
        description:
          'Formal process — Osei-Bonsu receives written guidance; minutes reflect the discussion; CEO authority visibly reinforced. People & Culture ≥ 70 to handle sensitively.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
        fallback: 'mevent_03_b',
      },
      {
        id: 'mevent_03_b',
        label: 'Request the chair speak to Osei-Bonsu privately; no board action',
        description:
          'Private conversation occurs; Osei-Bonsu acknowledges the issue. No formal record. CEO is partially reassured.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'mevent_03_c',
        label: 'Raise via People & Culture Committee as a trustee conduct issue',
        description:
          'Committee-level formal process — Osei-Bonsu receives written guidance from a committee rather than full board. Slightly less powerful but still creates a formal record.',
        multiplier: 1.00,
        competencyGates: [],
      },
      {
        id: 'mevent_03_d',
        label: 'Accept the memo as informal input; take no action',
        description:
          "Osei-Bonsu reads silence as endorsement. Founder Syndrome Score increases significantly. Event 09 probability rises.",
        multiplier: 0.40,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 7],
        narrative:
          "The board acts decisively and on the record. Osei-Bonsu receives formal written guidance on trustee role boundaries; the minutes are unambiguous. Marcus Finch describes it privately as the best board meeting he has attended. Founder Syndrome -10, Governance Health +4.",
      },
      SUCCESS: {
        svRange: [1, 1],
        narrative:
          "A private conversation occurs; Osei-Bonsu acknowledges the issue without formal consequences. No record. CEO is partly reassured but knows the next incident will be harder to manage. Founder Syndrome -4, Governance Health +1.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3, -3],
        narrative:
          "The memo is absorbed into normal business. Osei-Bonsu interprets the silence as board support. Her next memo will be bolder. Founder Syndrome +6, Governance Health -3.",
      },
      FAILURE: {
        svRange: [-7, -4],
        narrative:
          "No board action. Marcus Finch raises his concerns at a sector conference, naming no names but leaving no ambiguity. Internal morale collapses. MIS -4, Governance Health -7.",
      },
      CRITICAL_FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The CEO's concerns go public. Donors and partners ask pointed questions. The founder's influence is now a reputational liability, not just a governance one. MIS -8, Governance Health -10.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 04 — Safeguarding Alert ──
  {
    id: 'mevent_04',
    name: 'Safeguarding Alert',
    tier: 2,
    quarter: 'Q1',
    turn: 4,
    imageFile: 'mevent-safeguarding-alert.jpg',
    illustrationType: 'mevent-safeguarding-alert',
    narrativeCard:
      "The Bangladesh country director has reported a serious safeguarding allegation involving a Meridian partner organisation employee and a programme beneficiary. The CEO has been informed. Under Charity Commission Serious Incident Reporting requirements, this must be reported to the Commission promptly. The CEO is uncertain whether to report before the investigation is complete; the legal team advises caution. The People & Culture Committee chair is on holiday.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'peopleCulture',   weight: 0.30 },
      { domain: 'esgSustainability', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_04_a',
        label: 'Report to Charity Commission immediately with known facts',
        description:
          'Immediate reporting within 24 hours — the Commission-recommended approach. CEO leads investigation. Regulatory Oversight ≥ 70 to navigate reporting correctly.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 70 }],
        fallback: 'mevent_04_c',
      },
      {
        id: 'mevent_04_b',
        label: 'Wait 48–72 hours for preliminary investigation findings before reporting',
        description:
          'Cautious delay. The Commission notes the late reporting but takes no action.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'mevent_04_c',
        label: 'Appoint independent investigator; report when framework is in place',
        description:
          'Structured response — independent investigator appointed promptly; reported within 72 hours. Commission accepts this as prompt.',
        multiplier: 0.90,
        competencyGates: [],
      },
      {
        id: 'mevent_04_d',
        label: "Refer solely to the partner organisation's processes — Meridian is not the direct employer",
        description:
          "Accountability evasion. The Commission views this as a serious governance failure; Meridian has a duty of care regardless of employment structure.",
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 5],
        narrative:
          "Meridian reports within 24 hours. The Commission's response letter cites the board's handling as exemplary — a rare distinction. MIS +3, Governance Health +5.",
      },
      SUCCESS: {
        svRange: [1, 2],
        narrative:
          "Independent investigator appointed and Commission notified within 72 hours. The Commission accepts this as prompt. Governance Health +2, MIS +1.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "Reporting occurs within 72 hours. The Commission notes the slight delay but takes no further action. Governance Health unchanged.",
      },
      FAILURE: {
        svRange: [-12, -8],
        narrative:
          "Meridian attempts to avoid accountability via the partner relationship. The Commission views this as evasion; formal regulatory action commences. Two major donors request assurances; one pauses grant disbursements. Governance Health -12, MIS -8.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "The safeguarding failure becomes public before the Commission has even been notified. The story is in the press. Senior donors terminate grants. Governance Health -15, MIS -12.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 05 — Annual Report Crisis ──
  {
    id: 'mevent_05',
    name: 'Annual Report Crisis',
    tier: 2,
    quarter: 'Q2',
    turn: 1,
    imageFile: 'mevent-annual-report.jpg',
    illustrationType: 'mevent-annual-report',
    narrativeCard:
      "Meridian's largest institutional donor — responsible for 28% of total income — has written to the chair challenging the methodology behind the '2.3 million lives improved' headline impact figure in the annual report. Their internal evaluation team believes the number is based on reach (people who received services) rather than measurable outcomes, and has asked for the underlying data. The CFO confirms the figure was prepared by the Fundraising team, not verified by Programmes, and was not independently reviewed before publication.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'esgSustainability', weight: 0.35 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_05_a',
        label: 'Apologise; commission independent impact evaluation; revise annual report addendum',
        description:
          'Honest correction — independent evaluation commissioned; addendum published. ESG/Mission ≥ 65 to credibly articulate the data quality reform.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'esgSustainability', minimumRating: 65 }],
        fallback: 'mevent_05_b',
      },
      {
        id: 'mevent_05_b',
        label: 'Defend the figure; provide supplementary data privately to the donor',
        description:
          "Donor temporarily mollified; underlying data quality problem unresolved. Stakeholder Comms ≥ 60 to manage the relationship.",
        multiplier: 0.60,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 60 }],
        fallback: 'mevent_05_d',
      },
      {
        id: 'mevent_05_c',
        label: 'Engage donor in a collaborative re-evaluation; co-design future impact metrics',
        description:
          'Partnership approach — donor becomes a genuine partner in impact design. Strongest long-term outcome. Requires both Stakeholder Comms ≥ 65 and ESG/Mission ≥ 65.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'stakeholderComms',   minimumRating: 65 },
          { domain: 'esgSustainability',  minimumRating: 65 },
        ],
        fallback: 'mevent_05_a',
      },
      {
        id: 'mevent_05_d',
        label: "Refer the donor to the external auditor's sign-off on the accounts",
        description:
          "The donor interprets this as evasion — their evaluation team knows the difference between audited accounts and impact data.",
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [5, 3],
        narrative:
          "The collaborative re-evaluation produces an impact framework that the donor cites as a sector model. The relationship deepens; grant renewal is assured. MIS +5, Governance Health +3.",
      },
      SUCCESS: {
        svRange: [3, 2],
        narrative:
          "Meridian's honest correction is respected. Independent evaluation commissioned; addendum published. The donor is satisfied. MIS +3, Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, -2],
        narrative:
          "The donor is temporarily mollified but the data quality problem is unresolved. Their next report will contain a footnote. MIS -2.",
      },
      FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The donor interprets the auditor reference as institutional evasion. They terminate the grant relationship. Income loss of £3.8m — 28% of total income. MIS -10, Governance Health -8.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "The donor goes public. The '2.3 million lives' figure is now a media story. Other donors begin asking questions. Existential income risk. MIS -15, Governance Health -12.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 06 — Mission Drift Review (Conditional) ──
  {
    id: 'mevent_06',
    name: 'Mission Drift: Compliance Review',
    tier: 2,
    quarter: 'Q2',
    turn: 2,
    imageFile: 'mevent-compliance-review.jpg',
    illustrationType: 'mevent-compliance-review',
    narrativeCard:
      "Following a complaint from a former staff member (Dr. Sarah Lim, the trustee who resigned), the Charity Commission has opened a formal compliance review into whether Meridian's programme activities remain consistent with its charitable objects. The Commission has requested minutes of Programmes & Impact Committee meetings for the past 24 months, copies of all grant agreements entered in the past 18 months, and a board statement on mission alignment. The review is not yet a statutory inquiry — but it could become one.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'stakeholderComms',  weight: 0.25 },
      { domain: 'esgSustainability', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_06_a',
        label: 'Commission independent external governance review; publish findings',
        description:
          'Transparent response — independent review commissioned and results published. Regulatory Oversight ≥ 75 to handle Commission interaction.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 75 }],
        fallback: 'mevent_06_b',
      },
      {
        id: 'mevent_06_b',
        label: 'Submit detailed response with all requested documents; arrange trustee meeting with Commission',
        description:
          'Full cooperation — all documents provided; chair and CEO attend Commission interview. Regulatory ≥ 65 to manage the meeting effectively.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 65 }],
        fallback: 'mevent_06_c',
      },
      {
        id: 'mevent_06_c',
        label: 'Resolve through legal correspondence only',
        description:
          'Legal-only response — Commission extends the review timeline; a note is added to the public register.',
        multiplier: 0.60,
        competencyGates: [],
      },
      {
        id: 'mevent_06_d',
        label: 'Challenge the basis of the complaint; deny mission drift',
        description:
          'Adversarial response. The Commission escalates to statutory inquiry. The chair is named personally in the public register entry.',
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 6],
        narrative:
          "The Commission closes the compliance review with a positive note on the board's responsiveness. MIS +4, Governance Health +6.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "The Commission closes the review without further action. The board's cooperation is noted. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3, -3],
        narrative:
          "Legal-only response. The Commission extends the review timeline and adds a note to the public register. Governance Health -3.",
      },
      FAILURE: {
        svRange: [-15, -10],
        narrative:
          "The Commission escalates to a formal statutory inquiry. The chair is named personally in the public register entry. Governance Health -15, MIS -10.",
      },
      CRITICAL_FAILURE: {
        svRange: [-20, -15],
        narrative:
          "Statutory inquiry with media coverage. Multiple senior trustees receive personal letters from the Commission. Governance Health -20, MIS -15.",
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if Event 02 (Grant or Mission?) was Partial Success or worse.',
    precondition: 'mevent_02_partial_or_worse',
    conditionConfig: {
      requiresEventId: 'mevent_02',
      requiresOutcome: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
    },
  },

  // ── Event 07 — Reserves Crisis ──
  {
    id: 'mevent_07',
    name: 'Reserves Crisis',
    tier: 2,
    quarter: 'Q2',
    turn: 3,
    imageFile: 'mevent-reserves-crisis.jpg',
    illustrationType: 'mevent-reserves-crisis',
    narrativeCard:
      "The CFO presents an emergency Finance & Risk Committee paper: delayed grant disbursements from two institutional donors, combined with upfront programme costs, have reduced unrestricted reserves to 2.1 months of operating expenditure — below the board's own policy minimum of three months. The CFO has been monitoring this for six weeks without escalating. If unrestricted income does not improve within 90 days, the CEO must notify trustees of a formal solvency concern and potentially the Charity Commission.",
    primaryDomain: 'financialOversight',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.25 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_07_a',
        label: 'Initiate formal solvency review; engage Charity Commission proactively',
        description:
          'Transparent response. Commission engaged before crisis escalates. Financial Oversight ≥ 75 required.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'financialOversight', minimumRating: 75 }],
        fallback: 'mevent_07_b',
      },
      {
        id: 'mevent_07_b',
        label: 'Authorise emergency fundraising drive; defer non-essential programme expenditure',
        description:
          'Income-focused response. Reserves stabilised but no structural fix; risk of recurrence flagged by auditors.',
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'mevent_07_c',
        label: 'Negotiate accelerated disbursement with the two delayed donors',
        description:
          'Targeted resolution — donors agree accelerated disbursement; reserves restored within 60 days. CFO performance formally reviewed. Stakeholder Comms ≥ 65 to negotiate effectively.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'mevent_07_b',
      },
      {
        id: 'mevent_07_d',
        label: 'Draw down from restricted reserves; correct later',
        description:
          'A reportable breach of grant conditions. Governance Health -10, MIS -7. Donor relations severely damaged.',
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 3],
        narrative:
          "Both delayed donors agree to accelerated disbursement; reserves are restored within 60 days. The CFO's delayed escalation is formally noted by People & Culture Committee. Governance Health +3.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "Transparent response; reserve breach resolved within 90 days. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [0, 0],
        narrative:
          "Reserves stabilised through the fundraising drive but the structural risk remains. Auditors flag the reserves policy as fragile. Governance Health unchanged.",
      },
      FAILURE: {
        svRange: [-10, -7],
        narrative:
          "Drawing on restricted reserves without donor consent is a reportable breach of grant conditions. Two donors are notified; both are furious. Governance Health -10, MIS -7.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "The restricted reserve breach is discovered during a routine audit. The Commission is notified by the auditors. Solvency risk is now active. Governance Health -15, MIS -12.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 08 — Charity Commission Statutory Inquiry (Conditional) ──
  {
    id: 'mevent_08',
    name: 'Charity Commission Statutory Inquiry',
    tier: 3,
    quarter: 'Q2',
    turn: 4,
    imageFile: 'mevent-statutory-inquiry.jpg',
    illustrationType: 'mevent-statutory-inquiry',
    narrativeCard:
      "A whistleblower has alerted the Charity Commission to the Cavendish logistics conflict. The Commission has opened a statutory inquiry — the most serious form of regulatory intervention — into potential mismanagement of assets and undisclosed conflicts of interest. All trustees are named in the inquiry correspondence. Robert Cavendish has engaged personal legal counsel. The chair has received a formal notice requiring her to attend an interview.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.60,
    secondaryDomains: [
      { domain: 'stakeholderComms',  weight: 0.25 },
      { domain: 'financialOversight', weight: 0.15 },
    ],
    strategies: [
      {
        id: 'mevent_08_a',
        label: 'Cavendish resigns immediately; board cooperates fully with Commission',
        description:
          'Full cooperation — Cavendish resigns; board cooperates; Commission closes inquiry with remedial action only. Regulatory Oversight ≥ 80 to navigate the Commission process.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 80 }],
        fallback: 'mevent_08_b',
      },
      {
        id: 'mevent_08_b',
        label: 'Commission independent governance review; suspend Cavendish from all committee roles',
        description:
          'Structural response — external review commissioned; Cavendish suspended pending outcome. Commission closes with formal directions.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'mevent_08_c',
        label: 'Mount legal challenge to the inquiry on procedural grounds',
        description:
          'Adversarial. The legal challenge fails; Commission makes a removal Order. Game Over threshold reached.',
        multiplier: 0.10,
        isDoNothing: false,
        competencyGates: [],
      },
      {
        id: 'mevent_08_d',
        label: 'Do nothing pending legal advice',
        description:
          'Delay. The inquiry continues; an interim manager is appointed by the Commission to supervise transactions. Governance Health -8.',
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 4],
        narrative:
          "Cavendish resigns; the board cooperates fully. The Commission closes the inquiry with remedial action only — no public register entry. Governance Health +4.",
      },
      SUCCESS: {
        svRange: [1, 1],
        narrative:
          "External review commissioned; Cavendish suspended. Commission closes with formal directions and a public register entry noting the directions. Governance Health +1.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-8, -8],
        narrative:
          "Delay strategy fails. The inquiry continues; an interim manager is appointed. Governance Health -8.",
      },
      FAILURE: {
        svRange: [-20, -12],
        narrative:
          "The legal challenge fails. The Commission makes an Order removing trustees. Governance Health -20, MIS -12. GAME OVER threshold reached.",
      },
      CRITICAL_FAILURE: {
        svRange: [-25, -15],
        narrative:
          "Legal challenge, public spectacle, removal Order. The Commission's press release is widely covered. Governance Health -25, MIS -15. GAME OVER.",
      },
    },
    isConditional: true,
    conditionDescription: 'Fires only if Event 01 (The Undisclosed Conflict) was Partial Success or worse.',
    precondition: 'mevent_01_partial_or_worse',
    conditionConfig: {
      requiresEventId: 'mevent_01',
      requiresOutcome: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
    },
  },

  // ── Event 09 — CEO Ultimatum (Conditional / AGM) ──
  {
    id: 'mevent_09',
    name: 'CEO Ultimatum',
    tier: 2,
    quarter: 'AGM',
    turn: 1,
    imageFile: 'mevent-ceo-ultimatum.jpg',
    illustrationType: 'mevent-ceo-ultimatum',
    narrativeCard:
      "Marcus Finch has written confidentially to the board chair: he cannot continue as CEO while Dr. Osei-Bonsu operates as a parallel authority to the executive. He cites three specific incidents of operational interference over the past six months. He has given the board 30 days to address the governance issue or he will resign, publicly citing trustee conduct. His resignation would trigger a Charity Commission serious incident report and potentially a funding review by institutional donors who cite leadership continuity as a grant condition.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.50,
    secondaryDomains: [
      { domain: 'stakeholderComms', weight: 0.30 },
      { domain: 'regulatoryLegal', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_09_a',
        label: 'Formally raise role boundaries at full board; minute a trustee code of conduct resolution',
        description:
          'Decisive board action — Osei-Bonsu accepts the resolution or resigns gracefully; Marcus withdraws threat. People & Culture ≥ 75 required. Cannot achieve Critical Success while Mensah is chair unless another trustee formally seconds the motion.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 75 }],
        fallback: 'mevent_09_b',
      },
      {
        id: 'mevent_09_b',
        label: 'Negotiate a mediated agreement between Marcus and Evelyn',
        description:
          'Mediation produces a workable but fragile agreement. Short-term stability; issue not fully resolved.',
        multiplier: 0.75,
        competencyGates: [],
      },
      {
        id: 'mevent_09_c',
        label: 'Accept that Marcus may resign; begin discreet CEO succession planning',
        description:
          'Marcus departs; succession disruption; donors request assurances.',
        multiplier: 0.50,
        isDoNothing: false,
        competencyGates: [],
      },
      {
        id: 'mevent_09_d',
        label: 'Ask Marcus to reconsider; make no structural change',
        description:
          'Marcus resigns and goes public; reputational and regulatory crisis. MIS -10, Governance Health -12.',
        multiplier: 0.20,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [4, 7],
        narrative:
          "The board acts decisively. Osei-Bonsu accepts the code of conduct resolution or resigns with grace. Marcus withdraws his threat. MIS +4, Governance Health +7. Founder Syndrome significantly reduced.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "Mediation produces a workable agreement. Short-term stability secured. Governance Health +2. The underlying tension is not resolved.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-4, -5],
        narrative:
          "Marcus departs. Succession disruption begins. Two donors request assurance letters. MIS -4, Governance Health -5.",
      },
      FAILURE: {
        svRange: [-10, -12],
        narrative:
          "Marcus resigns and issues a public statement citing trustee interference in operational matters. The Commission is notified. Institutional donors begin due diligence reviews. MIS -10, Governance Health -12.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -15],
        narrative:
          "Marcus's resignation statement is reported in Third Sector and the FT's NGO coverage. The Commission opens a preliminary review. Two donors pause disbursements. MIS -15, Governance Health -15.",
      },
    },
    isConditional: true,
    conditionDescription: 'Always present at AGM. Probability elevated if Event 03 (The Founder\'s Memo) was Partial or Failure. Fires automatically if Founder Syndrome Score > 60.',
    precondition: 'mevent_09_fss_or_event03',
    conditionConfig: {
      requiresEventId: 'mevent_03',
      requiresOutcome: ['PARTIAL_SUCCESS', 'FAILURE', 'CRITICAL_FAILURE'],
    },
  },

  // ── Event 10 — Donor Due Diligence Request ──
  {
    id: 'mevent_10',
    name: 'Donor Due Diligence Request',
    tier: 2,
    quarter: 'Q3',
    turn: 1,
    imageFile: 'mevent-donor-due-diligence.jpg',
    illustrationType: 'mevent-donor-due-diligence',
    narrativeCard:
      "Meridian has applied for a transformational £8 million, five-year grant from the Ashford Family Foundation. As part of their due diligence, Ashford has requested full board meeting minutes for the past 24 months, trustee register, conflict of interest declarations, and a governance self-assessment against the Charity Governance Code. The grant team considers this the most significant funding opportunity in Meridian's history. The board secretary has flagged that the minutes are incomplete and the conflict of interest register has not been updated in 14 months.",
    primaryDomain: 'regulatoryLegal',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'stakeholderComms',  weight: 0.35 },
      { domain: 'financialOversight', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_10_a',
        label: 'Disclose governance gaps to Ashford proactively with a remediation plan',
        description:
          'Transparency — Ashford cites the honesty as a positive signal; grant proceeds with a governance improvement covenant. Stakeholder Comms ≥ 65 required.',
        multiplier: 1.10,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'mevent_10_c',
      },
      {
        id: 'mevent_10_b',
        label: 'Update records urgently; provide complete pack without highlighting historical gaps',
        description:
          "Records updated quickly. Ashford's due diligence team notices the amendments and asks pointed questions. Grant delayed by 6 months.",
        multiplier: 0.70,
        competencyGates: [],
      },
      {
        id: 'mevent_10_c',
        label: 'Request an extension to the due diligence timeline',
        description:
          'Extension granted; records updated; grant proceeds. Regulatory ≥ 60 to request appropriately.',
        multiplier: 0.85,
        competencyGates: [{ domain: 'regulatoryLegal', minimumRating: 60 }],
        fallback: 'mevent_10_b',
      },
      {
        id: 'mevent_10_d',
        label: 'Withdraw the application — governance is not ready for this level of scrutiny',
        description:
          'Honest withdrawal. Income opportunity forgone; governance credibility preserved.',
        multiplier: 0.60,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'audit',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 5],
        narrative:
          "Ashford cites Meridian's transparency as a positive governance signal — unusual in the sector. Grant proceeds with a governance improvement covenant. MIS +3, Governance Health +5.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "Extension granted; records properly updated; grant proceeds. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1, -1],
        narrative:
          "Ashford's team notices the amended records. Questions are asked. Grant delayed by 6 months. MIS -1.",
      },
      FAILURE: {
        svRange: [-15, -15],
        narrative:
          "Retrospective minutes are fabricated. Ashford discovers this via a former staff contact. Grant withdrawn; regulatory referral to Charity Commission. MIS -15, Governance Health -15.",
      },
      CRITICAL_FAILURE: {
        svRange: [-20, -18],
        narrative:
          "The fabrication is publicised by Ashford, who has a policy of disclosing due diligence fraud. Sector reputation destroyed. MIS -20, Governance Health -18.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 11 — Staff Whistleblower: Executive Pay Concerns ──
  {
    id: 'mevent_11',
    name: 'Staff Whistleblower: Executive Pay',
    tier: 1,
    quarter: 'Q3',
    turn: 2,
    imageFile: 'mevent-whistleblower.jpg',
    illustrationType: 'mevent-whistleblower',
    narrativeCard:
      "A senior staff member has raised a formal concern through the whistleblowing policy: the CEO's salary is benchmarked above the sector median for an organisation of Meridian's income and complexity, and the People & Culture Committee has not conducted an independent pay review in three years. The concern has been logged and escalated to the committee chair. The CEO is aware. Marcus Finch has asked the chair to handle this quietly.",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'regulatoryLegal',  weight: 0.25 },
      { domain: 'stakeholderComms', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_11_a',
        label: 'Commission independent pay benchmarking review; publish outcome',
        description:
          'Transparent response — independent review commissioned and outcome published. People & Culture ≥ 70 required.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'peopleCulture', minimumRating: 70 }],
        fallback: 'mevent_11_b',
      },
      {
        id: 'mevent_11_b',
        label: 'Conduct internal pay review; respond to whistleblower through formal process',
        description:
          'Internal review — adequate but not independent. Whistleblower concern addressed within the formal process.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'mevent_11_c',
        label: 'Defend current salary structure; cite sector comparators',
        description:
          'Defensive response. Staff morale declines; whistleblower escalates to the Charity Commission.',
        multiplier: 0.50,
        competencyGates: [],
      },
      {
        id: 'mevent_11_d',
        label: 'Handle privately at chair level; no formal committee process',
        description:
          "Exactly what the whistleblowing policy is designed to prevent. The policy requires formal escalation; handling it privately is itself a governance failure.",
        multiplier: 0.30,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'remuneration',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [2, 4],
        narrative:
          "Independent review finds the CEO salary modestly above the median but within a defensible range. The review is published; the whistleblower concern is formally closed. Staff trust in the board increases. MIS +2, Governance Health +4.",
      },
      SUCCESS: {
        svRange: [1, 2],
        narrative:
          "Internal review conducted; whistleblower process followed correctly. CEO pay is adjusted modestly. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, -1],
        narrative:
          "The defensive response does not satisfy the whistleblower; they escalate. MIS -1, Governance Health -2.",
      },
      FAILURE: {
        svRange: [-6, -5],
        narrative:
          "The private handling is itself a governance failure. The Charity Commission receives a complaint about failure to follow the whistleblowing policy. Governance Health -5, MIS -6.",
      },
      CRITICAL_FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The whistleblower goes to the press. The CEO's salary is published alongside a staff survey showing low confidence in the board. Major donors request a meeting. Governance Health -8, MIS -10.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 12 — Partner Organisation Collapse: Kenya Programme ──
  {
    id: 'mevent_12',
    name: 'Partner Organisation Collapse',
    tier: 2,
    quarter: 'Q3',
    turn: 3,
    imageFile: 'mevent-partner-collapse.jpg',
    illustrationType: 'mevent-partner-collapse',
    narrativeCard:
      "Meridian's primary Kenyan implementing partner has entered insolvency proceedings. Meridian holds £600k of restricted grant funds in trust with the partner — funds that were designated for programme delivery and cannot legally be diverted. The programme is effectively suspended. Three institutional donors are awaiting reports. The board must decide whether to absorb the programme directly (requiring Charity Commission consent for a material change in activities), find a replacement partner urgently, or notify donors of a programme suspension.",
    primaryDomain: 'strategyMarkets',
    primaryWeight: 0.40,
    secondaryDomains: [
      { domain: 'regulatoryLegal',    weight: 0.35 },
      { domain: 'geopoliticalMacro',  weight: 0.25 },
    ],
    strategies: [
      {
        id: 'mevent_12_a',
        label: 'Absorb the programme directly; notify Charity Commission of material change',
        description:
          'Direct delivery — requires Commission consent but preserves programme continuity. Regulatory ≥ 70 and Geopolitical ≥ 65 required to manage the transition.',
        multiplier: 0.90,
        competencyGates: [
          { domain: 'regulatoryLegal',   minimumRating: 70 },
          { domain: 'geopoliticalMacro', minimumRating: 65 },
        ],
        fallback: 'mevent_12_b',
      },
      {
        id: 'mevent_12_b',
        label: 'Find a replacement partner urgently; maintain programme within existing structure',
        description:
          'Partnership route — replacement partner identified; programme suspended for minimum period. Geopolitical ≥ 70 to identify a credible partner quickly.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'geopoliticalMacro', minimumRating: 70 }],
        fallback: 'mevent_12_c',
      },
      {
        id: 'mevent_12_c',
        label: 'Notify donors of programme suspension; seek consent to reallocate restricted funds',
        description:
          'Transparent suspension — donors notified; consent sought. Stakeholder Comms ≥ 65 to manage donor relationships through the suspension.',
        multiplier: 0.75,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'mevent_12_d',
      },
      {
        id: 'mevent_12_d',
        label: 'Reallocate restricted funds to cover operational costs temporarily',
        description:
          'Restricted fund breach — a reportable incident. Governance Health -10, MIS -7.',
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 4],
        narrative:
          "A replacement partner is identified within 10 days. Programme continuity is maintained; donors receive proactive reports; restricted funds are accounted for. MIS +3, Governance Health +4.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "Donors are notified and consent to a short suspension. The restricted funds are protected; the Commission acknowledges the notification. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, -1],
        narrative:
          "The programme is suspended for longer than planned. Two donors mark their relationship with Meridian as 'under review.' MIS -1, Governance Health -2.",
      },
      FAILURE: {
        svRange: [-10, -7],
        narrative:
          "The restricted fund reallocation is discovered during an audit. The Commission is notified as a serious incident; three donors review their relationships. Governance Health -10, MIS -7.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "Restricted fund breach and programme failure. The Commission opens a review; one donor terminates immediately. Governance Health -15, MIS -12.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 13 — Social Media Crisis: Charity Overhead Myth ──
  {
    id: 'mevent_13',
    name: 'Social Media Crisis: Overhead Myth',
    tier: 1,
    quarter: 'Q4',
    turn: 1,
    imageFile: 'mevent-social-media-crisis.jpg',
    illustrationType: 'mevent-social-media-crisis',
    narrativeCard:
      "A viral social media thread accuses Meridian of spending 34% of income on overheads — based on a misreading of the annual accounts that conflates programme support costs with administrative overhead. The thread has 15,000 shares and has been picked up by two national newspapers. The fundraising team wants to respond aggressively and immediately; the legal team counsels restraint pending a full review of the accounts presentation. The board must set the communications strategy.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.55,
    secondaryDomains: [
      { domain: 'regulatoryLegal',  weight: 0.25 },
      { domain: 'esgSustainability', weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_13_a',
        label: 'Publish a clear, factual correction with full accounts breakdown; engage press directly',
        description:
          'Proactive transparency — corrects the record with evidence. Stakeholder Comms ≥ 70 to execute effectively.',
        multiplier: 1.00,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 70 }],
        fallback: 'mevent_13_b',
      },
      {
        id: 'mevent_13_b',
        label: 'Issue a measured factual statement; decline media interviews',
        description:
          'Measured response — statement issued; media not engaged directly. Lower risk, lower upside.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'mevent_13_c',
        label: "Engage proactively with donors and supporters to pre-empt reputational damage",
        description:
          'Donor-first strategy — direct outreach before press response. Stakeholder Comms ≥ 65 and ESG ≥ 60 required.',
        multiplier: 0.90,
        competencyGates: [
          { domain: 'stakeholderComms',  minimumRating: 65 },
          { domain: 'esgSustainability', minimumRating: 60 },
        ],
        fallback: 'mevent_13_b',
      },
      {
        id: 'mevent_13_d',
        label: 'Say nothing publicly; monitor until the story dies',
        description:
          "Silence reads as guilt. The story grows for two more news cycles.",
        multiplier: 0.30,
        isDoNothing: true,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 8,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [3, 4],
        narrative:
          "The factual correction lands cleanly — the original thread's author acknowledges the error and posts a retraction. Several journalists run follow-up pieces on the complexity of charity overhead measurement. MIS +3, Governance Health +4.",
      },
      SUCCESS: {
        svRange: [2, 2],
        narrative:
          "The measured statement is accepted by most commentators. The story fades within 48 hours. Governance Health +2.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-1, 0],
        narrative:
          "The statement is issued but not widely picked up. The story fades slowly; some reputational residue remains.",
      },
      FAILURE: {
        svRange: [-6, -5],
        narrative:
          "Silence is interpreted as confirmation. Two national newspapers run the overhead figure as a fact. Major donors receive enquiries from their own boards. Governance Health -5, MIS -6.",
      },
      CRITICAL_FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The story becomes a news cycle case study in 'charity waste'. Retail fundraising income drops 12% in the following quarter. Governance Health -8, MIS -10.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 14 — Chair Succession: Patricia Mensah Announces Departure ──
  {
    id: 'mevent_14',
    name: 'Chair Succession',
    tier: 3,
    quarter: 'Q4',
    turn: 2,
    imageFile: 'mevent-chair-succession.jpg',
    illustrationType: 'mevent-chair-succession',
    narrativeCard:
      "Patricia Mensah has announced she will step down as chair at the Annual Public Meeting in six months' time — citing the Charity Governance Code's 9-year tenure guidance. The announcement triggers a formal succession process. The board must decide: who chairs the succession search? Should Osei-Bonsu's continued tenure on the board be addressed as part of the same succession review? And does the board have the composition, independence, and collective will to manage both transitions simultaneously?",
    primaryDomain: 'peopleCulture',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'strategyMarkets',  weight: 0.30 },
      { domain: 'stakeholderComms', weight: 0.25 },
    ],
    strategies: [
      {
        id: 'mevent_14_a',
        label: 'Establish formal Trustee Recruitment & Succession committee; address both vacancies simultaneously',
        description:
          'Comprehensive renewal — chair succession and Osei-Bonsu tenure both addressed in the same structured process. People & Culture ≥ 70 and Strategy ≥ 65 required.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'peopleCulture',   minimumRating: 70 },
          { domain: 'strategyMarkets', minimumRating: 65 },
        ],
        fallback: 'mevent_14_b',
        boardEffect: {
          removeDirectorId: 'mdir_mensah',
          minOutcomeTier: 'CRITICAL_SUCCESS',
          requiresReplacement: true,
          vacatedRole: 'chair',
          simultaneousRemoveIds: ['mdir_osei_bonsu'],
        },
      },
      {
        id: 'mevent_14_b',
        label: 'Run the chair succession process; defer the Osei-Bonsu question',
        description:
          'Partial renewal — chair succession managed well; founder dynamics unresolved. New chair inherits the Osei-Bonsu problem.',
        multiplier: 0.80,
        competencyGates: [],
      },
      {
        id: 'mevent_14_c',
        label: 'Ask Osei-Bonsu to lead the chair succession search',
        description:
          "Governance failure — allowing the founder to select her own successor normalises the interference dynamic. The new chair will owe their position to Osei-Bonsu.",
        multiplier: 0.40,
        isDoNothing: false,
        competencyGates: [],
      },
      {
        id: 'mevent_14_d',
        label: 'Encourage Osei-Bonsu to stand as chair',
        description:
          "The founder becomes chair. Game Over for mission integrity — founder syndrome becomes structurally entrenched.",
        multiplier: 0.10,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'nomination',
    committeeBonusValue: 10,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [7, 8],
        narrative:
          "Comprehensive board renewal — a new independent chair is appointed; Osei-Bonsu departs with grace (if FSS < 20, she delivers a heartfelt valedictory speech at the Annual Public Meeting). MIS +7, Governance Health +8. The board is structurally renewed.",
      },
      SUCCESS: {
        svRange: [3, 4],
        narrative:
          "A strong new chair is appointed through a proper process. Osei-Bonsu's tenure question is deferred. Governance Health +4, MIS +3.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-3, -2],
        narrative:
          "Chair succession managed but without structural board renewal. The new chair inherits the founder syndrome problem intact. Governance Health -2, MIS -3.",
      },
      FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The founder influences the succession; the new chair's independence is compromised from day one. MIS -8, Governance Health -10.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "Osei-Bonsu becomes chair. Founder syndrome is now the governance architecture. Marcus Finch resigns immediately. MIS -15, Governance Health -12. GAME OVER threshold reached.",
      },
    },
    isConditional: false,
    precondition: null,
  },

  // ── Event 15 — AGM: Donor Accountability Motion ──
  {
    id: 'mevent_15',
    name: 'Annual Public Meeting: Accountability Motion',
    tier: 3,
    quarter: 'Q4',
    turn: 3,
    imageFile: 'mevent-agm-accountability.jpg',
    illustrationType: 'mevent-agm-accountability',
    narrativeCard:
      "At the Annual Public Meeting — required under Meridian's CIO constitution — a coalition of major institutional donors presents a formal motion requesting that the board commission an independent beneficiary accountability audit covering the past three years. The motion is not legally binding on the board, but the donors control 55% of Meridian's income. The Charity Governance Code Assessor's preliminary report on the board's performance over the year is tabled at the same meeting. Everything the player has done — or failed to do — is now visible in one room.",
    primaryDomain: 'stakeholderComms',
    primaryWeight: 0.45,
    secondaryDomains: [
      { domain: 'esgSustainability',  weight: 0.35 },
      { domain: 'regulatoryLegal',    weight: 0.20 },
    ],
    strategies: [
      {
        id: 'mevent_15_a',
        label: 'Accept the motion in full; commission the accountability audit immediately',
        description:
          'Full accountability — board accepts the motion and commissions the audit. ESG/Mission ≥ 70 and Stakeholder Comms ≥ 70 required to manage the meeting and the audit process.',
        multiplier: 1.10,
        competencyGates: [
          { domain: 'esgSustainability', minimumRating: 70 },
          { domain: 'stakeholderComms',  minimumRating: 70 },
        ],
        fallback: 'mevent_15_b',
      },
      {
        id: 'mevent_15_b',
        label: 'Accept the motion in principle; propose a modified scope and timeline',
        description:
          'Constructive acceptance — board accepts the motion with agreed modifications. Stakeholder Comms ≥ 65.',
        multiplier: 0.90,
        competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
        fallback: 'mevent_15_c',
      },
      {
        id: 'mevent_15_c',
        label: 'Acknowledge the motion; commit to review within 12 months',
        description:
          'Delayed commitment — donors note the deferral; relationship cools.',
        multiplier: 0.65,
        competencyGates: [],
      },
      {
        id: 'mevent_15_d',
        label: 'Resist the motion; defend the existing accountability framework',
        description:
          'Adversarial. Donors controlling 55% of income vote with their feet.',
        multiplier: 0.20,
        isDoNothing: false,
        competencyGates: [],
      },
    ],
    relevantCommittee: 'csrd',
    committeeBonusValue: 12,
    followOnTriggers: [],
    outcomeTiers: {
      CRITICAL_SUCCESS: {
        svRange: [8, 10],
        narrative:
          "The board accepts the motion wholeheartedly. The Charity Governance Code Assessor's report cites Meridian as having made 'significant and genuine governance progress' during the year. Donors renew; the Mission Integrity Score closes at its highest point. Mission Restored — if MIS ≥ 85.",
      },
      SUCCESS: {
        svRange: [4, 6],
        narrative:
          "The modified accountability audit is accepted. Donors are satisfied with the board's responsiveness. The Code Assessor's report is broadly positive. MIS +4, Governance Health +6.",
      },
      PARTIAL_SUCCESS: {
        svRange: [-2, 0],
        narrative:
          "The deferral is noted without consequence in the short term. Two donors reduce their commitments at renewal. Code Assessor report is neutral.",
      },
      FAILURE: {
        svRange: [-10, -8],
        narrative:
          "The board's resistance to donor accountability triggers a formal withdrawal of two major grants. MIS -8, Governance Health -10. Code Assessor report is critical.",
      },
      CRITICAL_FAILURE: {
        svRange: [-15, -12],
        narrative:
          "Donors controlling 55% of income publicly distance themselves from Meridian. The Charity Commission opens a preliminary review. Code Assessor report recommends an independent governance inquiry. Regulatory Failure — if MIS < 30.",
      },
    },
    isConditional: false,
    precondition: null,
  },
];
