import type { DirectorDynamic } from '@/types/game';
import { vantageDynamics } from './vantage/dynamics';
import { rheinfeldDynamics } from './rheinfeld/dynamics';

export const directorDynamics: DirectorDynamic[] = [
  {
    directorAId: 'dir_01_wren',
    directorBId: 'dir_02_bracewell',
    type: 'positive',
    modifier: 12,
    triggerDescription: 'Both deployed on same financial event',
  },
  {
    directorAId: 'dir_04_pemberton',
    directorBId: 'dir_06_macallister',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Both deployed on regulatory event',
  },
  {
    directorAId: 'dir_14_larsson',
    directorBId: 'dir_13_okafor',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Both deployed on ESG event',
  },
  {
    directorAId: 'dir_07_ashworth',
    directorBId: 'dir_18_whitmore',
    type: 'negative',
    modifier: -15,
    triggerDescription:
      'Both deployed on same event (especially Stakeholder events)',
  },
  {
    directorAId: 'dir_08_crane',
    directorBId: 'dir_10_lonsdale',
    type: 'negative',
    modifier: -10,
    triggerDescription: 'Both deployed on People & Culture events',
  },
  {
    directorAId: 'dir_05_alfassih',
    directorBId: 'dir_06_macallister',
    type: 'negative',
    modifier: -12,
    triggerDescription: 'Both deployed on legal/regulatory events',
  },

  // ── Vantage Consumer Brands dynamics ──
  ...vantageDynamics,

  // ── Rheinfeld AG dynamics ──
  ...rheinfeldDynamics,
];
