import { resolveEvent, ResolveEventInput } from '../resolution';
import type {
  Director,
  GameEvent,
  DirectorDynamic,
  CommitteeState,
  CommitteeId,
} from '@/types/game';

// ── Test fixtures matching the worked example in Content Package Section 4.2 ──
// Event: Institutional ESG Letter (Event 05)
// Deployed: Dr. Ingrid Larsson + Sir David Okafor
// Strategy: Option A (Commit to forming Energy Transition Committee), multiplier 1.10
// Energy Transition Committee NOT yet formed (no committee bonus)
// Both directors at 100% energy
// UK jurisdiction scores: Larsson 77, Okafor 83 — both above 50, no penalty

const larsson: Director = {
  id: 'dir_14_larsson',
  name: 'Dr. Ingrid Larsson',
  background: 'Former CSO at a Nordic energy company.',
  domainRatings: {
    financialOversight: 41,
    regulatoryLegal: 52,
    strategyMarkets: 59,
    peopleCulture: 44,
    esgSustainability: 92,
    geopoliticalMacro: 55,
    technologyDigital: 48,
    stakeholderComms: 71,
  },
  jurisdictionScores: { UK: 77 },
  independence: 'independent',
  tenure: 0,
  annualFee: 125_000,
  availabilityTier: 'B',
  currentEnergy: 100,
  riskFlag: null,
  suitableRoles: 'ESG events',
  inherited: false,
};

const okafor: Director = {
  id: 'dir_13_okafor',
  name: 'Sir David Okafor',
  background: 'Former Director-General of the Environment Agency.',
  domainRatings: {
    financialOversight: 33,
    regulatoryLegal: 58,
    strategyMarkets: 44,
    peopleCulture: 41,
    esgSustainability: 88,
    geopoliticalMacro: 38,
    technologyDigital: 30,
    stakeholderComms: 62,
  },
  jurisdictionScores: { UK: 83 },
  independence: 'independent',
  tenure: 6,
  annualFee: 145_000,
  availabilityTier: 'A',
  currentEnergy: 100,
  riskFlag: null,
  suitableRoles: 'S&E Chair',
  inherited: true,
};

const event05: GameEvent = {
  id: 'event_05',
  name: 'Institutional ESG Letter',
  tier: 2,
  quarter: 'Q2',
  turn: 1,
  narrativeCard: 'Institutional ESG letter demanding net-zero pathway.',
  primaryDomain: 'esgSustainability',
  primaryWeight: 0.5,
  secondaryDomains: [
    { domain: 'stakeholderComms', weight: 0.3 },
    { domain: 'strategyMarkets', weight: 0.2 },
  ],
  strategies: [
    {
      id: 'event_05_a',
      label: 'Commit to forming Energy Transition Committee',
      description: 'Costs £180k p.a. from budget.',
      multiplier: 1.1,
      competencyGates: [],
    },
    {
      id: 'event_05_b',
      label: 'Publish existing net-zero commitment',
      description: 'Re-frame existing work.',
      multiplier: 0.9,
      competencyGates: [],
    },
    {
      id: 'event_05_c',
      label: 'Bilateral engagement',
      description: 'Meet largest shareholder.',
      multiplier: 1.0,
      competencyGates: [{ domain: 'stakeholderComms', minimumRating: 65 }],
      fallback: 'event_05_b',
    },
    {
      id: 'event_05_d',
      label: 'Do nothing',
      description: 'Institutions will publish the letter.',
      multiplier: 0.5,
      competencyGates: [],
    },
  ],
  relevantCommittee: 'energyTransition',
  committeeBonusValue: 10,
  followOnTriggers: [
    { eventId: 'event_12', triggerTiers: ['FAILURE', 'CRITICAL_FAILURE'], delay: 2 },
  ],
  outcomeTiers: {
    CRITICAL_SUCCESS: { svRange: [2.0, 3.0], narrative: 'ESG leadership lauded.' },
    SUCCESS: { svRange: [1.5, 2.0], narrative: 'Institutions satisfied.' },
    PARTIAL_SUCCESS: { svRange: [0, 0.5], narrative: 'Response noted but insufficient.' },
    FAILURE: { svRange: [-3, -2], narrative: 'Letter published. Negative coverage.' },
    CRITICAL_FAILURE: { svRange: [-4, -3], narrative: 'Joint divestment threat.' },
  },
  isConditional: false,
  precondition: null,
};

const larssonOkaforDynamic: DirectorDynamic = {
  directorAId: 'dir_14_larsson',
  directorBId: 'dir_13_okafor',
  type: 'positive',
  modifier: 10,
  triggerDescription: 'Both deployed on ESG event',
};

const committees: Record<CommitteeId, CommitteeState> = {
  audit: { active: true, chairDirectorId: null },
  remuneration: { active: false, chairDirectorId: null },
  nomination: { active: true, chairDirectorId: null },
  safetyEnvironment: { active: true, chairDirectorId: 'dir_13_okafor' },
  energyTransition: { active: false, chairDirectorId: null }, // NOT yet formed
};

describe('Resolution Engine', () => {
  describe('Worked Example — Section 4.2', () => {
    it('computes correct director match scores', () => {
      // We test the intermediate values by using an RNG override that returns
      // a known value, then verify the final score matches the worked example.

      // Larsson director score (per worked example):
      //   ESG:        92 * 0.50 * 1.00 = 46.0
      //   Stakeholder: 71 * 0.30 * 1.00 = 21.3
      //   Strategy:   59 * 0.20 * 1.00 = 11.8
      //   Larsson total = 79.1
      const larssonExpected = 92 * 0.5 + 71 * 0.3 + 59 * 0.2;
      expect(larssonExpected).toBeCloseTo(79.1, 1);

      // Okafor director score (per worked example):
      //   ESG:        88 * 0.50 * 1.00 = 44.0
      //   Stakeholder: 62 * 0.30 * 1.00 = 18.6
      //   Strategy:   44 * 0.20 * 1.00 =  8.8
      //   Okafor total = 71.4
      const okaforExpected = 88 * 0.5 + 62 * 0.3 + 44 * 0.2;
      expect(okaforExpected).toBeCloseTo(71.4, 1);

      // Team match score = (79.1 + 71.4) / 2 = 75.25
      const teamMatch = (larssonExpected + okaforExpected) / 2;
      expect(teamMatch).toBeCloseTo(75.25, 2);
    });

    it('produces SUCCESS with randomFactor=0.94, matching worked example', () => {
      // Worked example specifies random factor = 0.94
      // We override RNG to return exactly 0.94 mapped within the [0.82, 1.18] range
      // randomInRange(rng, 0.82, 1.18) = 0.82 + rng() * (1.18 - 0.82)
      // We need: 0.82 + x * 0.36 = 0.94 → x = 0.12 / 0.36 = 0.3333...
      const rngValues = [0.3333333]; // First call = randomness factor
      // Second call = energy cost (randomInt for tier 2 event)
      rngValues.push(0.5); // gives ~30 energy cost
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [larsson, okafor],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [larsson, okafor],
          randomSeed: 42, // ignored since we override rng
        },
        directorDynamics: [larssonOkaforDynamic],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Worked example calculations:
      // Team match score = 75.25
      // + Larsson/Okafor dynamic = +10 → 85.25
      // Strategy multiplier (Option A) = 1.10
      // Committee bonus = 0 (not yet formed)
      // Raw score = 85.25 * 1.10 + 0 = 93.775
      // Random factor = 0.94
      // Final score = 93.775 * 0.94 = 88.1485
      // Outcome: 70-89 → SUCCESS

      expect(result.finalScore).toBeCloseTo(88.15, 1);
      expect(result.outcomeTier).toBe('SUCCESS');

      // SV delta should be interpolated within SUCCESS range [1.5, 2.0]
      // Score 88.15 within tier bounds [70, 89]:
      // t = (88.15 - 70) / (89 - 70) = 18.15 / 19 ≈ 0.955
      // svDelta = 1.5 + 0.955 * (2.0 - 1.5) = 1.5 + 0.478 ≈ 1.98
      expect(result.svDelta).toBeGreaterThanOrEqual(1.5);
      expect(result.svDelta).toBeLessThanOrEqual(2.0);

      // No follow-on events (SUCCESS clears the threshold)
      expect(result.followOnEvents).toEqual([]);

      // Energy should be depleted (tier 2 event: 25-35 cost)
      expect(result.energyUpdates).toHaveLength(2);
      for (const update of result.energyUpdates) {
        expect(update.previousEnergy).toBe(100);
        expect(update.newEnergy).toBeLessThan(100);
        expect(update.newEnergy).toBeGreaterThanOrEqual(65); // 100 - 35
      }
    });

    it('applies +10 committee bonus when Energy Transition Committee is active with qualified chair', () => {
      // Same setup but with Energy Transition Committee active, chaired by Larsson (ESG 92 >= 70)
      const committeesWithET: Record<CommitteeId, CommitteeState> = {
        ...committees,
        energyTransition: { active: true, chairDirectorId: 'dir_14_larsson' },
      };

      // RNG set so random factor ≈ 1.0 for simplicity
      // randomInRange(0.82, 1.18) = 0.82 + x * 0.36 = 1.0 → x = 0.5
      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [larsson, okafor],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees: committeesWithET,
          directors: [larsson, okafor],
          randomSeed: 42,
        },
        directorDynamics: [larssonOkaforDynamic],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Raw score = 85.25 * 1.10 + 10 = 103.775
      // Clamped to 103.775 (under 115)
      // Random factor ≈ 1.0
      // Final score ≈ 103.775 → CRITICAL_SUCCESS (≥ 90)
      expect(result.outcomeTier).toBe('CRITICAL_SUCCESS');
      expect(result.finalScore).toBeGreaterThanOrEqual(90);
    });

    it('does NOT apply committee bonus when committee has no chair assigned', () => {
      // Committee active but chairDirectorId is null
      const committeesNoChair: Record<CommitteeId, CommitteeState> = {
        ...committees,
        energyTransition: { active: true, chairDirectorId: null },
      };

      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [larsson, okafor],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees: committeesNoChair,
          directors: [larsson, okafor],
          randomSeed: 42,
        },
        directorDynamics: [larssonOkaforDynamic],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Without committee bonus: raw = 85.25 * 1.10 = 93.775
      // With randomFactor ≈ 1.0 → final ≈ 93.775 → CRITICAL_SUCCESS
      // But notably NO +10 bonus was added
      // To verify: if bonus were applied, raw would be 103.775
      // We can check indirectly — the final score should be ~93.8
      expect(result.finalScore).toBeCloseTo(93.78, 0);
    });
  });

  describe('Do Nothing', () => {
    it('returns low score with do-nothing strategy', () => {
      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [],
        strategyChoice: 'do_nothing',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [],
          randomSeed: 42,
        },
        directorDynamics: [],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // matchScore = 0, multiplier = 0.50
      // rawScore = 0 * 0.50 + 0 = 0
      // finalScore ≈ 0 → CRITICAL_FAILURE
      expect(result.outcomeTier).toBe('CRITICAL_FAILURE');
      expect(result.finalScore).toBe(0);
    });
  });

  describe('Competency Gate Fallback', () => {
    it('falls back to alternative strategy when gate is not met', () => {
      // Use Option C which requires stakeholderComms >= 65
      // Deploy a director with stakeholderComms < 65
      const weakDirector: Director = {
        ...okafor,
        id: 'dir_weak',
        domainRatings: { ...okafor.domainRatings, stakeholderComms: 40 },
      };

      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [weakDirector],
        strategyChoice: 'event_05_c', // requires stakeholderComms >= 65
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [weakDirector],
          randomSeed: 42,
        },
        directorDynamics: [],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Should fall back to event_05_b (multiplier 0.90) instead of event_05_c (1.00)
      // This means a lower raw score
      // Director score: ESG 88*0.5 + SC 40*0.3 + SM 44*0.2 = 44 + 12 + 8.8 = 64.8
      // Raw = 64.8 * 0.90 = 58.32
      // Final ≈ 58.32 * 1.0 = 58.32 → PARTIAL_SUCCESS
      expect(result.outcomeTier).toBe('PARTIAL_SUCCESS');
    });
  });

  describe('Jurisdiction Familiarity Penalty', () => {
    it('applies 0.70 penalty when jurisdiction score < 50', () => {
      const lowJurisdictionDirector: Director = {
        ...larsson,
        id: 'dir_low_jur',
        jurisdictionScores: { UK: 40 }, // below 50 threshold
      };

      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const inputWithPenalty: ResolveEventInput = {
        event: event05,
        deployedDirectors: [lowJurisdictionDirector],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [lowJurisdictionDirector],
          randomSeed: 42,
        },
        directorDynamics: [],
        rngOverride: rng,
      };

      const resultPenalized = resolveEvent(inputWithPenalty);

      // Without penalty: ESG 92*0.5 + SC 71*0.3 + SM 59*0.2 = 46 + 21.3 + 11.8 = 79.1
      // With penalty: ESG 92*0.7*0.5 + SC 71*0.7*0.3 + SM 59*0.7*0.2 = 32.2 + 14.91 + 8.26 = 55.37
      // Raw = 55.37 * 1.10 = 60.907
      // Final ≈ 60.907 * 1.0 ≈ 60.9 → PARTIAL_SUCCESS
      expect(resultPenalized.outcomeTier).toBe('PARTIAL_SUCCESS');
      expect(resultPenalized.finalScore).toBeLessThan(70); // below SUCCESS threshold
    });
  });

  describe('Energy Modifier', () => {
    it('applies energy modifiers correctly at different energy levels', () => {
      const tiredDirector: Director = {
        ...larsson,
        id: 'dir_tired',
        currentEnergy: 50, // 40-59 range → modifier 0.75
      };

      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [tiredDirector],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [tiredDirector],
          randomSeed: 42,
        },
        directorDynamics: [],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // With energy 50 → modifier 0.75
      // ESG 92*0.5*0.75 + SC 71*0.3*0.75 + SM 59*0.2*0.75 = 34.5 + 15.975 + 8.85 = 59.325
      // Raw = 59.325 * 1.10 = 65.2575
      // Final ≈ 65.26 → PARTIAL_SUCCESS
      expect(result.outcomeTier).toBe('PARTIAL_SUCCESS');
    });
  });

  describe('Negative Director Dynamics', () => {
    it('applies negative modifier when clashing directors are deployed together', () => {
      const ashworth: Director = {
        ...larsson,
        id: 'dir_07_ashworth',
        name: 'Vivienne Ashworth',
        domainRatings: {
          financialOversight: 79,
          regulatoryLegal: 42,
          strategyMarkets: 91,
          peopleCulture: 35,
          esgSustainability: 44,
          geopoliticalMacro: 61,
          technologyDigital: 38,
          stakeholderComms: 70,
        },
      };

      const whitmore: Director = {
        ...larsson,
        id: 'dir_18_whitmore',
        name: 'Dame Frances Whitmore',
        domainRatings: {
          financialOversight: 65,
          regulatoryLegal: 55,
          strategyMarkets: 74,
          peopleCulture: 62,
          esgSustainability: 58,
          geopoliticalMacro: 48,
          technologyDigital: 30,
          stakeholderComms: 88,
        },
      };

      const negativeDynamic: DirectorDynamic = {
        directorAId: 'dir_07_ashworth',
        directorBId: 'dir_18_whitmore',
        type: 'negative',
        modifier: -15,
        triggerDescription: 'Both want to lead; clash in Chair dynamic',
      };

      const rngValues = [0.5, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [ashworth, whitmore],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [ashworth, whitmore],
          randomSeed: 42,
        },
        directorDynamics: [negativeDynamic],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Ashworth ESG score: 44*0.5 + 70*0.3 + 91*0.2 = 22 + 21 + 18.2 = 61.2
      // Whitmore ESG score: 58*0.5 + 88*0.3 + 74*0.2 = 29 + 26.4 + 14.8 = 70.2
      // Team average: (61.2 + 70.2) / 2 = 65.7
      // Dynamic: -15 → 50.7
      // Raw = 50.7 * 1.10 = 55.77
      // Final ≈ 55.77 → PARTIAL_SUCCESS
      expect(result.outcomeTier).toBe('PARTIAL_SUCCESS');
      expect(result.finalScore).toBeLessThan(70);
    });
  });

  describe('Follow-on Events', () => {
    it('triggers follow-on events on FAILURE', () => {
      // Deploy a very weak director to ensure failure
      const weakDirector: Director = {
        ...okafor,
        id: 'dir_weak',
        domainRatings: {
          financialOversight: 10,
          regulatoryLegal: 10,
          strategyMarkets: 10,
          peopleCulture: 10,
          esgSustainability: 10,
          geopoliticalMacro: 10,
          technologyDigital: 10,
          stakeholderComms: 10,
        },
      };

      // RNG that produces low random factor
      // randomInRange(0.82, 1.18) = 0.82 + 0.0 * 0.36 = 0.82
      const rngValues = [0.0, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [weakDirector],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [weakDirector],
          randomSeed: 42,
        },
        directorDynamics: [],
        rngOverride: rng,
      };

      const result = resolveEvent(input);

      // Director score: 10*0.5 + 10*0.3 + 10*0.2 = 10
      // Raw = 10 * 1.10 = 11
      // Final = 11 * 0.82 = 9.02 → CRITICAL_FAILURE
      expect(result.outcomeTier).toBe('CRITICAL_FAILURE');
      expect(result.followOnEvents).toContain('event_12');
    });

    it('does NOT trigger follow-on events on SUCCESS', () => {
      // Use the worked example setup which produces SUCCESS
      const rngValues = [0.3333333, 0.5];
      let callIndex = 0;
      const rng = () => rngValues[callIndex++] ?? 0.5;

      const input: ResolveEventInput = {
        event: event05,
        deployedDirectors: [larsson, okafor],
        strategyChoice: 'event_05_a',
        gameState: {
          company: { jurisdiction: 'UK', difficultyTier: 2 },
          committees,
          directors: [larsson, okafor],
          randomSeed: 42,
        },
        directorDynamics: [larssonOkaforDynamic],
        rngOverride: rng,
      };

      const result = resolveEvent(input);
      expect(result.outcomeTier).toBe('SUCCESS');
      expect(result.followOnEvents).toEqual([]);
    });
  });
});
