import type { DirectorDynamic } from '@/types/game';
import { vantageDynamics } from './vantage/dynamics';
import { rheinfeldDynamics } from './rheinfeld/dynamics';
import { meridianDynamics } from './meridian/dynamics';
import { sfgDynamics } from './sfg/dynamics';

export const directorDynamics: DirectorDynamic[] = [
  {
    directorAId: 'dir_01_wren',
    directorBId: 'dir_02_bracewell',
    type: 'positive',
    modifier: 12,
    triggerDescription: 'Both deployed on same financial event',
    narrativeReason: "Wren's central-bank instincts and Bracewell's operational CFO experience cover the same ground from different angles — she reads the regulatory signal, he reads the balance sheet consequence, and together they rarely miss anything in a financial crisis.",
  },
  {
    directorAId: 'dir_04_pemberton',
    directorBId: 'dir_06_macallister',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Both deployed on regulatory event',
    narrativeReason: "Pemberton knows where the political pressure will land before it's publicly stated; MacAllister knows how to exploit the legal architecture to blunt it. They've overlapped on two FCA consultation panels and learned how to divide and conquer.",
  },
  {
    directorAId: 'dir_14_larsson',
    directorBId: 'dir_13_okafor',
    type: 'positive',
    modifier: 10,
    triggerDescription: 'Both deployed on ESG event',
    narrativeReason: "Larsson's TCFD credibility with institutional investors and Okafor's track record running the Environment Agency's net-zero programme create a team that covers both the technical substance and the regulatory process — unusual to have both in the same room.",
  },
  {
    directorAId: 'dir_07_ashworth',
    directorBId: 'dir_18_whitmore',
    type: 'negative',
    modifier: -15,
    triggerDescription:
      'Both deployed on same event (especially Stakeholder events)',
    narrativeReason: "Both are experienced board chairs with strong views on how to manage a room; Ashworth's Goldman Sachs instinct is to move quickly and decisively while Whitmore's is to build consensus first. On activist and investor-facing events they spend too much time managing each other.",
  },
  {
    directorAId: 'dir_08_crane',
    directorBId: 'dir_10_lonsdale',
    type: 'negative',
    modifier: -10,
    triggerDescription: 'Both deployed on People & Culture events',
    narrativeReason: "Crane's operational instinct is that culture problems are really execution problems in disguise; Lonsdale built her career on the view that execution problems are usually culture problems. They talk past each other on anything involving people.",
  },
  {
    directorAId: 'dir_05_alfassih',
    directorBId: 'dir_06_macallister',
    type: 'negative',
    modifier: -12,
    triggerDescription: 'Both deployed on legal/regulatory events',
    narrativeReason: "Al-Fassih's MENA government-relations approach — build relationships, move quietly, use back channels — conflicts sharply with MacAllister KC's instinct to use the legal process formally and publicly. On regulatory matters they recommend incompatible tactics.",
  },

  // ── Vantage Consumer Brands dynamics ──
  ...vantageDynamics,

  // ── Rheinfeld AG dynamics ──
  ...rheinfeldDynamics,

  // ── Meridian Foundation dynamics ──
  ...meridianDynamics,

  // ── Straits Financial Group dynamics ──
  ...sfgDynamics,
];
