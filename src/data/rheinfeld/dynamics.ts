import type { DirectorDynamic } from '@/types/game';

export const rheinfeldDynamics: DirectorDynamic[] = [
  {
    directorAId: 'rdir_01_lehrmann',
    directorBId: 'rdir_08_vonkessler',
    type: 'positive',
    modifier: 13,
    triggerDescription: 'Governance reform pairing — academic + legal expertise. Both deployed on governance reform or compliance events.',
  },
  {
    directorAId: 'rdir_04_taniguchi',
    directorBId: 'rdir_06_brandt',
    type: 'positive',
    modifier: 12,
    triggerDescription: 'Geopolitical + industry expertise — natural China pivot team. Both deployed on China pivot or supply chain events.',
  },
  {
    directorAId: 'rdir_05_becker',
    directorBId: 'dir_14_larsson',
    type: 'positive',
    modifier: 11,
    triggerDescription: 'CSRD specialists reinforce each other. Both deployed on ESG/CSRD events.',
  },
  {
    directorAId: 'rdir_heinrich',
    directorBId: 'rdir_01_lehrmann',
    type: 'negative',
    modifier: -16,
    triggerDescription: 'Heinrich sees Lehrmann as a threat to his authority. Both deployed on any event.',
  },
  {
    directorAId: 'rdir_02_fleischer',
    directorBId: 'rdir_strasser',
    type: 'negative',
    modifier: -12,
    triggerDescription: 'Fleischer views Strasser\'s tenure as improper; refuses to collaborate. Both deployed on financial/audit events.',
  },
  {
    directorAId: 'rdir_06_brandt',
    directorBId: 'rdir_w_koch',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Mutual respect built over years in German industry — can broker worker rep support. Both deployed on workforce or restructuring events.',
  },
];
