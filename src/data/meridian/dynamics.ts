// ── Meridian Foundation - Director/Trustee Dynamics ──
// Six pairwise dynamics encoding the core interpersonal tensions of the scenario.
// Notes on executive-linked dynamics from the brief:
//   • Osei-Bonsu / CEO Marcus Finch tension is represented in the CEO's Executive Leader
//     notes and Event 07 narrative rather than a DirectorDynamic (Finch is not a trustee).
//   • Marcus Webb (TRUST-05) / Director of Fundraising Baxter tension is captured via
//     Webb's riskFlag rather than a DirectorDynamic (Baxter is not a trustee).

import type { DirectorDynamic } from '@/types/game';

export const meridianDynamics: DirectorDynamic[] = [

  // ── 1. Mission Integrity Alliance ──────────────────────────────────────────
  // Al-Rashid is Meridian's lone mission-integrity voice at game start.
  // Appointing Okonkwo creates a credible bloc that shifts MIS-positive events
  // toward Critical Success — and signals to the CEO that the board is watching.
  {
    directorAId: 'mdir_alrashid',
    directorBId: 'mdir_01_okonkwo',
    type: 'positive',
    modifier: 8,
    triggerDescription:
      'Both deployed on any MIS-positive event (mission, programmes, beneficiary, or ESG focus) — Al-Rashid and Prof. Okonkwo form Meridian\'s mission-integrity bloc; their combined academic and field voices carry weight the board cannot easily dismiss',
  },

  // ── 2. Founder vs Reform Trustee ───────────────────────────────────────────
  // Dr. Osei-Bonsu views Yusuf's appointment as a direct challenge to her
  // authority over the Programmes & Impact Committee. When both are deployed,
  // the confrontation consumes board bandwidth and suppresses effectiveness.
  // Game mechanic: FSS also reduces by 15/turn while both sit on the same
  // committee — a bitter but structurally healthy outcome.
  {
    directorAId: 'mdir_osei_bonsu',
    directorBId: 'mdir_04_yusuf',
    type: 'negative',
    modifier: -14,
    triggerDescription:
      'Both deployed on Programmes & Impact, mission-alignment, or strategy events — Dr. Osei-Bonsu\'s founder authority collides with Yusuf\'s reform mandate; the confrontation suppresses deployment effectiveness while simultaneously driving down the Founder Syndrome Score',
  },

  // ── 3. Legal Expert Forces Disclosure ──────────────────────────────────────
  // Hedley's expertise as a charity-law partner means he recognises Cavendish's
  // undisclosed conflict the moment both sit in the same Finance & Risk meeting.
  // Appointing Hedley before Event 01 fires transforms what would be a
  // cover-up into a properly managed disclosure — the brief's "critical success
  // unlock" mechanic is surfaced here as a large positive modifier.
  {
    directorAId: 'mdir_cavendish',
    directorBId: 'mdir_03_hedley',
    type: 'positive',
    modifier: 18,
    triggerDescription:
      'Both deployed on Finance & Risk, conflict-of-interest, or procurement events — Hedley\'s charity-law expertise compels immediate and proper disclosure of Cavendish\'s logistics conflict; the board handles the event transparently rather than suppressing it, significantly improving the outcome',
  },

  // ── 4. Chair–Founder Deadlock ───────────────────────────────────────────────
  // Mensah has never successfully challenged Osei-Bonsu in 7 years. When both
  // are deployed, the dynamic replicates: Mensah defers, Osei-Bonsu fills the
  // vacuum, and events that require decisive board leadership stall. Events 03
  // and 09 are specifically named in the brief as unreachable for Critical
  // Success while this pair remains unresolved.
  {
    directorAId: 'mdir_mensah',
    directorBId: 'mdir_osei_bonsu',
    type: 'negative',
    modifier: -10,
    triggerDescription:
      'Both deployed on any event (especially Events 03 and 09) — Mensah\'s seven-year pattern of deference to the founder repeats; without a third independent trustee formally seconding any challenge motion, neither Critical Success nor a clean board majority is achievable',
  },

  // ── 5. Mission-Drift Echo Chamber ──────────────────────────────────────────
  // Webb's commercial instincts reinforce Osei-Bonsu's resistance to external
  // scrutiny — for different reasons but toward the same end: avoiding challenge
  // to income-growth decisions. Together they can block reform attempts on
  // fundraising and grant-strategy events without appearing to collude.
  {
    directorAId: 'mdir_osei_bonsu',
    directorBId: 'mdir_05_webb',
    type: 'negative',
    modifier: -8,
    triggerDescription:
      'Both deployed on fundraising, income-strategy, or donor-relations events — Webb\'s commercial instincts and Osei-Bonsu\'s founder authority converge to deflect scrutiny of the grant-chasing strategy; mission drift decisions evade proper challenge and Mission Integrity drifts further',
  },

  // ── 6. Conflict Exposure — Finance Chair vs Independent Voice ───────────────
  // Al-Rashid's due-diligence instincts make her the trustee most likely to
  // surface Cavendish's undisclosed conflict if Hedley has not already done so.
  // When deployed together on financial or procurement events, the resulting
  // tension suppresses committee effectiveness — until the conflict is formally
  // entered in the register and Cavendish either recuses or resigns from the seat.
  {
    directorAId: 'mdir_cavendish',
    directorBId: 'mdir_alrashid',
    type: 'negative',
    modifier: -12,
    triggerDescription:
      'Both deployed on Finance & Risk, procurement, or accountability events — Al-Rashid\'s diligence surfaces the undisclosed logistics conflict; the resulting stand-off between Cavendish and the mission-integrity bloc suppresses deployment effectiveness until the conflict is formally disclosed and managed',
  },

];
