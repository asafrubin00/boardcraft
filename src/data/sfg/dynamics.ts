import type { DirectorDynamic } from '@/types/game';

export const sfgDynamics: DirectorDynamic[] = [
  // ── Positive Synergies ──

  {
    directorAId: 'sfgdir_06_lee',
    directorBId: 'sfgdir_07_anwar',
    type: 'positive',
    modifier: 12,
    triggerDescription:
      'Lee Siew Geok + Anwar bin Hamzah: +12% on all Risk and Regulatory events.',
    narrativeReason:
      "Former MAS Deputy MD and former DBS Group CRO — MAS credibility signal. The board receives favourable treatment in the next supervisory communication.",
  },

  {
    directorAId: 'sfgdir_08_tan_margaret',
    directorBId: 'sfgdir_06_lee',
    type: 'positive',
    modifier: 10,
    triggerDescription:
      'Margaret Tan + Lee Siew Geok: +10% on all Audit events.',
    narrativeReason:
      "Two ex-senior regulators/bankers on the Audit Committee. Institutional proxy advisors rate the AC as best practice — SV +0.5% passive boost when both serve on AC.",
  },

  {
    directorAId: 'sfgdir_14_ho',
    directorBId: 'sfgdir_15_samuel',
    type: 'positive',
    modifier: 15,
    triggerDescription:
      'Dr. Priscilla Ho + Samuel Ong: +15% on all Digital Finance and Technology events.',
    narrativeReason:
      "Rare digital expertise pairing — former Grab CDO and former StanChart CTO. Reduces Indonesia digital bank licensing risk and signals digital governance maturity to MAS.",
  },

  {
    directorAId: 'sfgdir_12_wu',
    directorBId: 'sfgdir_19_rashid',
    type: 'positive',
    modifier: 8,
    triggerDescription:
      'Prof. Wu + BG Abdul Rashid: +8% on all Governance Reform events.',
    narrativeReason:
      "Academic-military pairing gives credibility with both institutional shareholders and civil society — ideal for NC-led governance reform announcements.",
  },

  {
    directorAId: 'sfgdir_26_rajan',
    directorBId: 'sfgdir_06_lee',
    type: 'positive',
    modifier: 20,
    triggerDescription:
      "Rajan Sethupathi (Chair) + Lee Siew Geok (AC): SV market reaction +2.5% on appointment announcements.",
    narrativeReason:
      "'Dream team' signal for institutional investors — former StanChart CEO as Board Chair and former MAS Deputy MD as Audit Chair. SGX's most credible governance pairing in financial services.",
  },

  // ── Negative Dynamics ──

  {
    directorAId: 'sfgdir_24_chen',
    directorBId: 'sfgdir_06_lee',
    type: 'negative',
    modifier: -10,
    triggerDescription:
      "Chen Weiliang on board while Raymond Tan is CEO: -10% on all Strategy events.",
    narrativeReason:
      "Chen has publicly criticised SFG management. CEO Raymond Tan withholds strategic information in committee discussions. Management-board tension surfaces publicly when Chen participates in strategy reviews.",
  },

  {
    directorAId: 'sfgdir_23_eleanor',
    directorBId: 'sfgdir_04_rahman',
    type: 'negative',
    modifier: -5,
    triggerDescription:
      "Eleanor Tan (non-independent) on AC or NC: -5% baseline penalty to every committee vote she participates in.",
    narrativeReason:
      "AC and NC quorum counts are contested by proxy advisors when Eleanor is classified non-independent. Her presence on independence-sensitive committees draws institutional shareholder objections.",
  },

  {
    directorAId: 'sfgdir_01_lim',
    directorBId: 'sfgdir_07_anwar',
    type: 'negative',
    modifier: -20,
    triggerDescription:
      "Dato' Lim holding dual Chair/BRC role: -20% penalty on BRC response events while dual role persists.",
    narrativeReason:
      "MAS supervisory letter severity escalates by one tier if the dual Chair/BRC role is not resolved before Q3. BRC independence is compromised when the Board Chair also chairs the committee.",
  },
];
