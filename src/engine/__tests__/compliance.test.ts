import { checkCompliance } from '../compliance';
import type { BoardSeat, Director, CommitteeId, CommitteeState } from '@/types/game';

// Minimal director stubs
function stubDirector(overrides: Partial<Director> & { id: string; name: string }): Director {
  return {
    background: '',
    domainRatings: {
      financialOversight: 70,
      regulatoryLegal: 70,
      strategyMarkets: 70,
      peopleCulture: 70,
      esgSustainability: 70,
      geopoliticalMacro: 70,
      stakeholderComms: 70,
    },
    independence: 'independent',
    annualFee: 100_000,
    tenureYears: 3,
    availabilityTier: 'A',
    currentEnergy: 100,
    riskFlag: null,
    suitableRoles: '',
    inherited: false,
    ...overrides,
  } as Director;
}

const emptyCommittees: Record<CommitteeId, CommitteeState> = {
  audit: { active: true, chairDirectorId: null },
  remuneration: { active: true, chairDirectorId: null },
  nomination: { active: true, chairDirectorId: null },
  safetyEnvironment: { active: false, chairDirectorId: null },
  energyTransition: { active: false, chairDirectorId: null },
};

describe('Nom/Gov Chair compliance check', () => {
  it('should flag the correct director assigned to nomChair, not a stale reference', () => {
    // Eleanor Vance has People & Culture = 65 (passes >= 55)
    const eleanor = stubDirector({
      id: 'vdir_15_vance',
      name: 'Eleanor Vance',
      domainRatings: {
        financialOversight: 68,
        regulatoryLegal: 55,
        strategyMarkets: 78,
        peopleCulture: 65,
        esgSustainability: 58,
        geopoliticalMacro: 50,
        stakeholderComms: 72,
      },
    });

    // Todd Reinholt has People & Culture = 44 (would fail >= 55)
    const todd = stubDirector({
      id: 'vdir_10_reinholt',
      name: 'Todd Reinholt',
      domainRatings: {
        financialOversight: 74,
        regulatoryLegal: 48,
        strategyMarkets: 88,
        peopleCulture: 44,
        esgSustainability: 38,
        geopoliticalMacro: 55,
        stakeholderComms: 52,
      },
    });

    // Seats: Eleanor is Nom/Gov Chair, Todd is a NED
    const seats: BoardSeat[] = [
      { directorId: 'vdir_15_vance', role: 'nomChair', feeWithPremium: 120_000 },
      { directorId: 'vdir_10_reinholt', role: 'ned', feeWithPremium: 100_000 },
      // Fill minimum board with stubs
      { directorId: 'stub_chair', role: 'chair', feeWithPremium: 100_000 },
      { directorId: 'stub_sid', role: 'sid', feeWithPremium: 100_000 },
      { directorId: 'stub_audit', role: 'auditChair', feeWithPremium: 100_000 },
      { directorId: 'stub_rem', role: 'remChair', feeWithPremium: 100_000 },
    ];

    const directors = [
      eleanor,
      todd,
      stubDirector({ id: 'stub_chair', name: 'Chair Stub' }),
      stubDirector({ id: 'stub_sid', name: 'SID Stub' }),
      stubDirector({ id: 'stub_audit', name: 'Audit Stub', domainRatings: { ...eleanor.domainRatings, financialOversight: 80 } }),
      stubDirector({ id: 'stub_rem', name: 'Rem Stub' }),
    ];

    // US jurisdiction (Vantage is US)
    const errors = checkCompliance(seats, directors, emptyCommittees, 'US', false);

    // Should NOT have an error about Todd Reinholt for Nom/Gov Chair
    const toddNomError = errors.find(
      (e) => e.code === 'NOM_CHAIR_LOW_PC' && e.message.includes('Todd Reinholt')
    );
    expect(toddNomError).toBeUndefined();

    // Should NOT have a Nom Chair People & Culture error at all (Eleanor has 65 >= 55)
    const nomPcError = errors.find((e) => e.code === 'NOM_CHAIR_LOW_PC');
    expect(nomPcError).toBeUndefined();
  });
});
