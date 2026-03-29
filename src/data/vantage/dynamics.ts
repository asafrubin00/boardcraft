import type { DirectorDynamic } from '@/types/game';

export const vantageDynamics: DirectorDynamic[] = [
  {
    directorAId: 'vdir_15_vance',
    directorBId: 'vdir_10_reinholt',
    type: 'positive',
    modifier: 14,
    triggerDescription:
      'Both deployed on activist or M&A events — former banker and former activist understand each other perfectly',
  },
  {
    directorAId: 'vdir_11_carter',
    directorBId: 'vdir_04_park',
    type: 'positive',
    modifier: 10,
    triggerDescription:
      'Both deployed on People & Culture or ESG events — People and ESG specialists reinforce each other on culture events',
  },
  {
    directorAId: 'vdir_07_finch',
    directorBId: 'vdir_08_dominguez',
    type: 'positive',
    modifier: 11,
    triggerDescription:
      'Both deployed on regulatory events — legislative and legal perspectives complement each other',
  },
  {
    directorAId: 'vdir_01_kellerman',
    directorBId: 'vdir_15_vance',
    type: 'negative',
    modifier: -14,
    triggerDescription:
      'Both deployed on any event (especially governance events) — Kellerman resents the implication that a new Chair is needed',
  },
  {
    directorAId: 'vdir_03_whitfield',
    directorBId: 'vdir_05_stern',
    type: 'negative',
    modifier: -10,
    triggerDescription:
      'Both deployed on Financial Oversight events — both want to chair the Audit Committee; clash when deployed together',
  },
  {
    directorAId: 'vdir_10_reinholt',
    directorBId: 'vdir_12_okoye',
    type: 'negative',
    modifier: -8,
    triggerDescription:
      'Both deployed on governance or Nom/Gov events — pragmatist vs. theorist; Reinholt dismisses academic governance perspectives',
  },
];
