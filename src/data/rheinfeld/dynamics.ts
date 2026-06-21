import type { DirectorDynamic } from '@/types/game';

export const rheinfeldDynamics: DirectorDynamic[] = [
  {
    directorAId: 'rdir_01_lehrmann',
    directorBId: 'rdir_08_vonkessler',
    type: 'positive',
    modifier: 13,
    triggerDescription: 'Governance reform pairing - academic + legal expertise. Both deployed on governance reform or compliance events.',
    narrativeReason: "Lehrmann led the German Corporate Governance Commission reform effort from the academic side; von Kessler has advised on more DAX supervisory board restructurings than anyone in the pool. When both are in the room, Rheinfeld has the theory and the practice of German corporate law available simultaneously.",
  },
  {
    directorAId: 'rdir_04_taniguchi',
    directorBId: 'rdir_06_brandt',
    type: 'positive',
    modifier: 12,
    triggerDescription: 'Geopolitical + industry expertise - natural China pivot team. Both deployed on China pivot or supply chain events.',
    narrativeReason: "Taniguchi's fluency in Chinese market dynamics and supply chain logistics combines naturally with Brandt's track record restructuring German automotive suppliers and managing IG Metall through difficult negotiations — between them they cover the commercial and the operational dimension of any China-facing decision.",
  },
  {
    directorAId: 'rdir_05_becker',
    directorBId: 'dir_14_larsson',
    type: 'positive',
    modifier: 11,
    triggerDescription: 'CSRD specialists reinforce each other. Both deployed on ESG/CSRD events.',
    narrativeReason: "Becker led the CSRD implementation working group for German industry; Larsson brings TCFD credibility with Nordic institutional investors, who set the benchmark most European ESG standards are trying to match. Together they represent both the regulatory compliance dimension and the investor-facing one.",
  },
  {
    directorAId: 'rdir_heinrich',
    directorBId: 'rdir_01_lehrmann',
    type: 'negative',
    modifier: -16,
    triggerDescription: 'Heinrich sees Lehrmann as a threat to his authority. Both deployed on any event.',
    narrativeReason: "Heinrich built Rheinfeld over 20 years on the premise that governance reform is a distraction invented by people who've never had skin in the game; Lehrmann is the former President of the German Corporate Governance Commission, the institutional embodiment of everything he dismisses. He regards her as a direct threat to his continued authority over the supervisory board.",
  },
  {
    directorAId: 'rdir_02_fleischer',
    directorBId: 'rdir_strasser',
    type: 'negative',
    modifier: -12,
    triggerDescription: 'Fleischer views Strasser\'s tenure as improper; refuses to collaborate. Both deployed on financial/audit events.',
    narrativeReason: "Fleischer flagged that Strasser's appointment should have triggered the GCGC's two-year cooling-off period for former executives joining the supervisory board — it didn't, because Strasser was appointed before stricter enforcement. Fleischer has never fully accepted the legitimacy of Strasser's seat and it shows whenever financial matters are at stake.",
  },
  {
    directorAId: 'rdir_06_brandt',
    directorBId: 'rdir_w_koch',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Mutual respect built over years in German industry - can broker worker rep support. Both deployed on workforce or restructuring events.',
    narrativeReason: "Brandt restructured two German automotive suppliers and managed IG Metall through both processes; Koch is a senior IG Metall official who was on the other side of at least one of those negotiations. They disagree on almost everything except the principle that workforce decisions need to be handled with straight talk — which means they can actually move things forward together.",
  },
];
