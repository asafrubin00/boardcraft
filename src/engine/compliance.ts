import type {
  BoardSeat,
  ComplianceError,
  Director,
  BoardRole,
  CommitteeId,
  CommitteeState,
  Jurisdiction,
} from '@/types/game';
import { DOMAIN_LABELS } from '@/engine/boardConstants';

const ROLE_PREMIUMS: Partial<Record<BoardRole, number>> = {
  chair: 0.6,       // +60% midpoint of 40-80%
  auditChair: 0.33, // +33% midpoint of 25-40%
  remChair: 0.28,   // +28% midpoint of 20-35%
  nomChair: 0.20,   // +20% midpoint of 15-25%
  sid: 0.18,         // +18% midpoint of 15-20%
  safetyEnvChair: 0.20,
  energyTransitionChair: 0.20,
  csrdChair: 0.20,
  strategyChair: 0.20,
};

export function computeFeeWithPremium(baseFee: number, role: BoardRole): number {
  const premium = ROLE_PREMIUMS[role] ?? 0;
  return Math.round(baseFee * (1 + premium));
}

// ── Tenure threshold for independence concerns ──
const TENURE_INDEPENDENCE_THRESHOLD_YEARS = 9;

export function checkCompliance(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
  jurisdiction: Jurisdiction = 'UK',
  combinedChairCeo = false,
): ComplianceError[] {
  if (jurisdiction === 'US') {
    return checkComplianceUS(seats, directors, committees, combinedChairCeo);
  }
  if (jurisdiction === 'EU') {
    return checkComplianceEU(seats, directors, committees);
  }
  return checkComplianceUK(seats, directors, committees);
}

// ══════════════════════════════════════════════════════════════
// UK FRC Code compliance rules
// ══════════════════════════════════════════════════════════════

function checkComplianceUK(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
): ComplianceError[] {
  const errors: ComplianceError[] = [];
  const getDirector = (id: string) => directors.find((d) => d.id === id);

  // Must have a Chair
  const chairSeat = seats.find((s) => s.role === 'chair');
  if (!chairSeat) {
    errors.push({
      code: 'NO_CHAIR',
      message: 'A Board Chair must be appointed before the game can begin.',
      severity: 'error',
    });
  } else {
    const chairDir = getDirector(chairSeat.directorId);
    if (chairDir && chairDir.independence !== 'independent') {
      errors.push({
        code: 'CHAIR_NOT_INDEPENDENT',
        message: 'The Board Chair must be independent at the time of appointment (FRC Code Provision 9).',
        severity: 'error',
      });
    }
    if (chairDir) {
      if (chairDir.domainRatings.strategyMarkets < 60) {
        errors.push({
          code: 'CHAIR_LOW_STRATEGY',
          message: `Board Chair requires Strategy & Markets >= 60. ${chairDir.name} has ${chairDir.domainRatings.strategyMarkets}.`,
          severity: 'error',
        });
      }
      if (chairDir.domainRatings.stakeholderComms < 60) {
        errors.push({
          code: 'CHAIR_LOW_STAKEHOLDER',
          message: `Board Chair requires Stakeholder & Comms >= 60. ${chairDir.name} has ${chairDir.domainRatings.stakeholderComms}.`,
          severity: 'error',
        });
      }
    }
  }

  // Must have an Audit Chair
  const auditChairSeat = seats.find((s) => s.role === 'auditChair');
  if (!auditChairSeat) {
    errors.push({
      code: 'NO_AUDIT_CHAIR',
      message: 'An Audit Committee Chair must be appointed.',
      severity: 'error',
    });
  } else {
    const auditDir = getDirector(auditChairSeat.directorId);
    if (auditDir && auditDir.independence !== 'independent') {
      errors.push({
        code: 'AUDIT_CHAIR_NOT_INDEPENDENT',
        message: 'The Audit Committee Chair must be independent.',
        severity: 'error',
      });
    }
    if (auditDir && auditDir.domainRatings.financialOversight < 75) {
      errors.push({
        code: 'AUDIT_CHAIR_LOW_FIN',
        message: `Audit Chair requires Financial Oversight >= 75. ${auditDir.name} has ${auditDir.domainRatings.financialOversight}.`,
        severity: 'error',
      });
    }
  }

  // Rem Chair
  const remChairSeat = seats.find((s) => s.role === 'remChair');
  if (!remChairSeat) {
    errors.push({
      code: 'NO_REM_CHAIR',
      message: 'Remuneration Committee Chair is vacant \u2014 governance health will suffer.',
      severity: 'warning',
    });
  } else {
    const remDir = getDirector(remChairSeat.directorId);
    if (remDir && remDir.independence !== 'independent') {
      errors.push({
        code: 'REM_CHAIR_NOT_INDEPENDENT',
        message: 'All Remuneration Committee members must be independent.',
        severity: 'error',
      });
    }
    if (remDir && remDir.domainRatings.peopleCulture < 60) {
      errors.push({
        code: 'REM_CHAIR_LOW_PC',
        message: `Rem Chair requires People & Culture >= 60. ${remDir.name} has ${remDir.domainRatings.peopleCulture}.`,
        severity: 'error',
      });
    }
  }

  // Nom Chair
  const nomChairSeat = seats.find((s) => s.role === 'nomChair');
  if (!nomChairSeat) {
    errors.push({
      code: 'NO_NOM_CHAIR',
      message: 'Nomination Committee Chair should be appointed.',
      severity: 'warning',
    });
  } else {
    const nomDir = getDirector(nomChairSeat.directorId);
    if (nomDir) {
      if (nomDir.domainRatings.peopleCulture < 55) {
        errors.push({
          code: 'NOM_CHAIR_LOW_PC',
          message: `Nom Chair requires People & Culture >= 55. ${nomDir.name} has ${nomDir.domainRatings.peopleCulture}.`,
          severity: 'error',
        });
      }
      if (nomDir.domainRatings.strategyMarkets < 50) {
        errors.push({
          code: 'NOM_CHAIR_LOW_SM',
          message: `Nom Chair requires Strategy & Markets >= 50. ${nomDir.name} has ${nomDir.domainRatings.strategyMarkets}.`,
          severity: 'error',
        });
      }
    }
  }

  // SID required for UK
  const sidSeat = seats.find((s) => s.role === 'sid');
  if (!sidSeat) {
    errors.push({
      code: 'NO_SID',
      message: 'A Senior Independent Director (SID) is required under the UK Corporate Governance Code.',
      severity: 'warning',
    });
  } else {
    const sidDir = getDirector(sidSeat.directorId);
    if (sidDir && sidDir.independence !== 'independent') {
      errors.push({
        code: 'SID_NOT_INDEPENDENT',
        message: 'The SID must be independent.',
        severity: 'error',
      });
    }
    if (sidDir && sidDir.domainRatings.stakeholderComms < 60) {
      errors.push({
        code: 'SID_LOW_STAKEHOLDER',
        message: `SID requires Stakeholder & Comms >= 60. ${sidDir.name} has ${sidDir.domainRatings.stakeholderComms}.`,
        severity: 'error',
      });
    }
  }

  // Board independence: at least 50% must be independent (excluding Chair)
  const nonChairSeats = seats.filter((s) => s.role !== 'chair');
  const independentCount = nonChairSeats.filter((s) => {
    const d = getDirector(s.directorId);
    return d?.independence === 'independent';
  }).length;
  if (nonChairSeats.length > 0 && independentCount / nonChairSeats.length < 0.5) {
    errors.push({
      code: 'LOW_INDEPENDENCE',
      message: `At least 50% of the board (excluding the Chair) must be independent. Currently ${independentCount}/${nonChairSeats.length}.`,
      severity: 'error',
    });
  }

  // Minimum board size
  if (seats.length < 6) {
    errors.push({
      code: 'BOARD_TOO_SMALL',
      message: `Mid-cap boards should have 6-8 NEDs. Currently ${seats.length}.`,
      severity: 'warning',
    });
  }

  // Generic tenure warning: flag any director with 9+ years of service
  checkTenureWarnings(seats, directors, errors, 'FRC Code Provision 10');

  // No director should appear twice
  checkDuplicateDirectors(seats, errors);

  // Safety & Environment Chair check
  checkOptionalChairCompetency(seats, directors, errors, 'safetyEnvChair', 'esgSustainability', 70, 'Safety & Env Chair', 'warning');

  // Energy Transition Chair check
  checkOptionalChairCompetency(seats, directors, errors, 'energyTransitionChair', 'esgSustainability', 70, 'Energy Transition Chair', 'error');

  return errors;
}

// ══════════════════════════════════════════════════════════════
// EU / German AktG + GCGC compliance rules (Rheinfeld AG)
// ══════════════════════════════════════════════════════════════

function checkComplianceEU(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
): ComplianceError[] {
  const errors: ComplianceError[] = [];
  const getDirector = (id: string) => directors.find((d) => d.id === id);

  // Worker representative IDs are fixed seats - exclude from independence/size counts
  const WORKER_REP_IDS = new Set([
    'rdir_w_koch', 'rdir_w_alrashid', 'rdir_w_hoffmann', 'rdir_w_mehta', 'rdir_w_gruber',
  ]);
  const shareholderSeats = seats.filter((s) => !WORKER_REP_IDS.has(s.directorId));

  // Supervisory Board Chair identification
  const chairSeat = seats.find((s) => s.role === 'chair');
  const chairId = chairSeat?.directorId ?? null;

  // Rule 1: Audit Committee Chair must exist (AktG §107(4))
  const auditChairSeat = seats.find((s) => s.role === 'auditChair');
  if (!auditChairSeat) {
    errors.push({
      code: 'NO_AUDIT_CHAIR',
      message: 'An Audit Committee Chair (Prüfungsausschuss) must be appointed (AktG §107).',
      severity: 'error',
    });
  } else {
    const auditDir = getDirector(auditChairSeat.directorId);

    // Rule 1a: Supervisory Board Chair cannot chair the Audit Committee (GCGC Rec. D.3)
    if (chairId && auditChairSeat.directorId === chairId) {
      errors.push({
        code: 'CHAIR_CHAIRS_AUDIT',
        message: 'The Supervisory Board Chair cannot also chair the Audit Committee (GCGC Recommendation D.3 / AktG §107(4)).',
        severity: 'error',
      });
    }

    // Rule 1b: Audit Chair must have financial expertise (AktG §107(4))
    if (auditDir && auditDir.domainRatings.financialOversight < 75) {
      errors.push({
        code: 'AUDIT_CHAIR_LOW_FIN',
        message: `Audit Committee Chair requires financial expertise (Financial Oversight ≥ 75). ${auditDir.name} has ${auditDir.domainRatings.financialOversight} (AktG §107(4)).`,
        severity: 'error',
      });
    }

    // Rule 1c: Audit Chair independence warning
    if (auditDir && auditDir.independence === 'non-independent') {
      errors.push({
        code: 'AUDIT_CHAIR_NOT_INDEPENDENT',
        message: `The Audit Committee Chair should be independent. ${auditDir.name} is non-independent - this will draw ISS and proxy adviser scrutiny.`,
        severity: 'warning',
      });
    }
  }

  // Rule 2: Remuneration Committee Chair recommended (GCGC Rec. G.6)
  const remChairSeat = seats.find((s) => s.role === 'remChair');
  if (!remChairSeat) {
    errors.push({
      code: 'NO_REM_CHAIR',
      message: 'A Remuneration Committee Chair (Vergütungsausschuss) is recommended under GCGC G.6. CEO pay has not been benchmarked in three years.',
      severity: 'warning',
    });
  } else {
    const remDir = getDirector(remChairSeat.directorId);
    if (remDir && remDir.domainRatings.peopleCulture < 60) {
      errors.push({
        code: 'REM_CHAIR_LOW_PC',
        message: `Rem Chair requires People & Culture ≥ 60. ${remDir.name} has ${remDir.domainRatings.peopleCulture}.`,
        severity: 'error',
      });
    }
  }

  // Rule 3: Nomination Committee Chair should not be the Supervisory Board Chair on contested matters
  // (Heinrich chairs nom - this is a governance concern)
  const nomChairSeat = seats.find((s) => s.role === 'nomChair');
  if (nomChairSeat && chairId && nomChairSeat.directorId === chairId) {
    errors.push({
      code: 'CHAIR_CHAIRS_NOM',
      message: 'The Supervisory Board Chair chairs the Nomination Committee. This concentrates influence over appointments - a significant governance concern noted by Meridian Capital (GCGC Rec. D.3).',
      severity: 'warning',
    });
  }

  // Rule 4: Former executive cooling-off warning (GCGC Rec. C.7)
  // Flag Strasser specifically as a former executive without cooling-off compliance
  const strasserSeat = seats.find((s) => s.directorId === 'rdir_strasser');
  if (strasserSeat) {
    errors.push({
      code: 'FORMER_EXEC_NO_COOLING',
      message: 'Dr. Wolfgang Strasser is a former Rheinfeld AG CFO. GCGC Rec. C.7 requires a two-year cooling-off period before former executives join the Supervisory Board. His appointment pre-dates stricter enforcement but proxy advisers will flag it.',
      severity: 'warning',
    });
  }

  // Rule 5: Shareholder-side independence - at least 50% of shareholder seats must be independent
  // (Worker reps are by definition not independent but this is expected under MitbestG)
  const independentShareholderCount = shareholderSeats.filter((s) => {
    const d = getDirector(s.directorId);
    return d?.independence === 'independent';
  }).length;
  if (shareholderSeats.length > 0 && independentShareholderCount / shareholderSeats.length < 0.5) {
    errors.push({
      code: 'LOW_INDEPENDENCE',
      message: `At least 50% of shareholder-side seats should be independent (GCGC Rec. C.6). Currently ${independentShareholderCount}/${shareholderSeats.length} shareholder-side members are independent.`,
      severity: 'error',
    });
  }

  // Rule 6: Co-determination informational - worker reps are as expected under MitbestG
  const workerRepCount = seats.filter((s) => WORKER_REP_IDS.has(s.directorId)).length;
  if (workerRepCount === 5) {
    // Correct - this is merely informational, not an error
    errors.push({
      code: 'MITBESTG_CODETERMINATION',
      message: `${workerRepCount} worker representatives hold fixed Supervisory Board seats as required under MitbestG (co-determination). These seats are non-assignable.`,
      severity: 'warning',
    });
  }

  // Rule 7: Tenure warnings (GCGC Rec. C.7 - 12 years for German boards)
  checkTenureWarnings(seats, directors, errors, 'GCGC Recommendation C.7');

  // Rule 8: No duplicate directors
  checkDuplicateDirectors(seats, errors);

  return errors;
}

// ══════════════════════════════════════════════════════════════
// US NYSE / SEC compliance rules
// ══════════════════════════════════════════════════════════════

function checkComplianceUS(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
  combinedChairCeo = false,
): ComplianceError[] {
  const errors: ComplianceError[] = [];
  const getDirector = (id: string) => directors.find((d) => d.id === id);

  // Must have a Chair (or Lead Independent Director)
  // Skip chair check if company has combined Chair/CEO (executive, not in NED pool)
  const chairSeat = seats.find((s) => s.role === 'chair');
  if (!chairSeat && !combinedChairCeo) {
    errors.push({
      code: 'NO_CHAIR',
      message: 'A Board Chair must be appointed before the game can begin.',
      severity: 'error',
    });
  } else if (combinedChairCeo && !chairSeat) {
    // Combined Chair/CEO - warn about governance concern
    errors.push({
      code: 'COMBINED_CHAIR_CEO',
      message: 'The Chair/CEO roles are combined. A Lead Independent Director is essential to offset governance risk.',
      severity: 'warning',
    });
  } else if (chairSeat) {
    const chairDir = getDirector(chairSeat.directorId);
    // US: combined Chair/CEO is allowed but flagged as governance concern
    if (chairDir && chairDir.independence !== 'independent') {
      errors.push({
        code: 'CHAIR_NOT_INDEPENDENT',
        message: 'The Board Chair is not independent. Consider appointing a Lead Independent Director to mitigate governance concerns.',
        severity: 'warning',
      });
    }
    if (chairDir) {
      if (chairDir.domainRatings.strategyMarkets < 60) {
        errors.push({
          code: 'CHAIR_LOW_STRATEGY',
          message: `Board Chair requires Strategy & Markets >= 60. ${chairDir.name} has ${chairDir.domainRatings.strategyMarkets}.`,
          severity: 'error',
        });
      }
    }
  }

  // Majority of directors must be independent (NYSE \u00a7303A.01)
  const independentCount = seats.filter((s) => {
    const d = getDirector(s.directorId);
    return d?.independence === 'independent';
  }).length;
  if (seats.length > 0 && independentCount / seats.length <= 0.5) {
    errors.push({
      code: 'LOW_INDEPENDENCE',
      message: `NYSE \u00a7303A.01: A majority of directors must be independent. Currently ${independentCount}/${seats.length}.`,
      severity: 'error',
    });
  }

  // Audit Committee: minimum 3 independent directors, one financial expert (SEC Rule 10A-3)
  const auditChairSeat = seats.find((s) => s.role === 'auditChair');
  if (!auditChairSeat) {
    errors.push({
      code: 'NO_AUDIT_CHAIR',
      message: 'An Audit Committee Chair must be appointed (SEC Rule 10A-3).',
      severity: 'error',
    });
  } else {
    const auditDir = getDirector(auditChairSeat.directorId);
    if (auditDir && auditDir.independence !== 'independent') {
      errors.push({
        code: 'AUDIT_CHAIR_NOT_INDEPENDENT',
        message: 'All Audit Committee members must be independent (SEC Rule 10A-3).',
        severity: 'error',
      });
    }
    // Financial expert requirement
    if (auditDir && auditDir.domainRatings.financialOversight < 75) {
      errors.push({
        code: 'AUDIT_CHAIR_LOW_FIN',
        message: `Audit Chair must be a financial expert (Financial Oversight >= 75). ${auditDir.name} has ${auditDir.domainRatings.financialOversight}.`,
        severity: 'error',
      });
    }
  }

  // Compensation Committee: all members must be independent (NYSE \u00a7303A.05)
  const remChairSeat = seats.find((s) => s.role === 'remChair');
  if (!remChairSeat) {
    errors.push({
      code: 'NO_REM_CHAIR',
      message: 'A Compensation Committee Chair must be appointed (NYSE \u00a7303A.05).',
      severity: 'warning',
    });
  } else {
    const remDir = getDirector(remChairSeat.directorId);
    if (remDir && remDir.independence !== 'independent') {
      errors.push({
        code: 'REM_CHAIR_NOT_INDEPENDENT',
        message: 'All Compensation Committee members must be independent (NYSE \u00a7303A.05).',
        severity: 'error',
      });
    }
    if (remDir && remDir.domainRatings.peopleCulture < 60) {
      errors.push({
        code: 'REM_CHAIR_LOW_PC',
        message: `Compensation Chair requires People & Culture >= 60. ${remDir.name} has ${remDir.domainRatings.peopleCulture}.`,
        severity: 'error',
      });
    }
  }

  // Nom/Gov Committee: all members must be independent (NYSE \u00a7303A.04)
  const nomChairSeat = seats.find((s) => s.role === 'nomChair');
  if (!nomChairSeat) {
    errors.push({
      code: 'NO_NOM_CHAIR',
      message: 'A Nominating/Governance Committee Chair must be appointed (NYSE \u00a7303A.04).',
      severity: 'warning',
    });
  } else {
    const nomDir = getDirector(nomChairSeat.directorId);
    if (nomDir && nomDir.independence !== 'independent') {
      errors.push({
        code: 'NOM_CHAIR_NOT_INDEPENDENT',
        message: 'All Nominating/Governance Committee members must be independent (NYSE \u00a7303A.04).',
        severity: 'error',
      });
    }
    if (nomDir) {
      if (nomDir.domainRatings.peopleCulture < 55) {
        errors.push({
          code: 'NOM_CHAIR_LOW_PC',
          message: `Nom/Gov Chair requires People & Culture >= 55. ${nomDir.name} has ${nomDir.domainRatings.peopleCulture}.`,
          severity: 'error',
        });
      }
    }
  }

  // US does not require SID, but Lead Independent Director is recommended if chair is not independent
  const sidSeat = seats.find((s) => s.role === 'sid');
  if (combinedChairCeo) {
    // Combined Chair/CEO: LID is strongly recommended
    if (!sidSeat) {
      errors.push({
        code: 'NO_LEAD_INDEPENDENT',
        message: 'With a combined Chair/CEO, a Lead Independent Director (LID) must be designated.',
        severity: 'error',
      });
    }
  } else if (chairSeat) {
    const chairDir = getDirector(chairSeat.directorId);
    if (chairDir && chairDir.independence !== 'independent') {
      if (!sidSeat) {
        errors.push({
          code: 'NO_LEAD_INDEPENDENT',
          message: 'With a non-independent Chair, a Lead Independent Director should be designated.',
          severity: 'warning',
        });
      }
    }
  }

  // Minimum board size
  if (seats.length < 6) {
    errors.push({
      code: 'BOARD_TOO_SMALL',
      message: `NYSE-listed boards typically have 7-12 directors. Currently ${seats.length}.`,
      severity: 'warning',
    });
  }

  // Generic tenure warnings
  checkTenureWarnings(seats, directors, errors, 'ISS/Glass Lewis guidelines');

  // No duplicates
  checkDuplicateDirectors(seats, errors);

  // Optional committee chair competency checks
  checkOptionalChairCompetency(seats, directors, errors, 'safetyEnvChair', 'esgSustainability', 70, 'Brand & Reputation Chair', 'warning');
  // Vantage CA&R Chair requires Regulatory & Legal expertise (not ESG)
  checkOptionalChairCompetency(seats, directors, errors, 'energyTransitionChair', 'regulatoryLegal', 65, 'CA&R Chair', 'error');

  return errors;
}

// ══════════════════════════════════════════════════════════════
// Shared compliance helpers
// ══════════════════════════════════════════════════════════════

function checkTenureWarnings(
  seats: BoardSeat[],
  directors: Director[],
  errors: ComplianceError[],
  codeReference: string,
): void {
  for (const seat of seats) {
    const dir = directors.find((d) => d.id === seat.directorId);
    if (dir && dir.tenureYears !== undefined && dir.tenureYears >= TENURE_INDEPENDENCE_THRESHOLD_YEARS) {
      errors.push({
        code: 'LONG_TENURE',
        message: `${dir.name} has served ${dir.tenureYears} years. ${codeReference} questions independence after ${TENURE_INDEPENDENCE_THRESHOLD_YEARS} years. Proxy advisers will flag this.`,
        severity: 'warning',
      });
    }
  }
}

function checkDuplicateDirectors(seats: BoardSeat[], errors: ComplianceError[]): void {
  const directorIds = seats.map((s) => s.directorId);
  const uniqueIds = new Set(directorIds);
  if (uniqueIds.size !== directorIds.length) {
    errors.push({
      code: 'DUPLICATE_DIRECTOR',
      message: 'A director cannot occupy multiple seats.',
      severity: 'error',
    });
  }
}

function checkOptionalChairCompetency(
  seats: BoardSeat[],
  directors: Director[],
  errors: ComplianceError[],
  role: BoardRole,
  domain: keyof Director['domainRatings'],
  threshold: number,
  label: string,
  severity: 'error' | 'warning',
): void {
  const chairSeat = seats.find((s) => s.role === role);
  if (chairSeat) {
    const dir = directors.find((d) => d.id === chairSeat.directorId);
    if (dir && dir.domainRatings[domain] < threshold) {
      const domainLabel = DOMAIN_LABELS[domain] ?? domain.replace(/([A-Z])/g, ' $1').trim();
      errors.push({
        code: `${role.toUpperCase()}_LOW_${domain.toUpperCase()}`,
        message: `${label} needs ${domainLabel} >= ${threshold}. ${dir.name} has ${dir.domainRatings[domain]}.`,
        severity,
      });
    }
  }
}
