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
  riskChair: 0.25,          // BRC Chair carries significant MAS accountability premium
  sustainabilityChair: 0.20,
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
  companyId?: string,
): ComplianceError[] {
  let errors: ComplianceError[];
  if (companyId === 'company_meridian') {
    errors = checkComplianceCharityUK(seats, directors, committees);
  } else if (jurisdiction === 'US') {
    errors = checkComplianceUS(seats, directors, committees, combinedChairCeo);
  } else if (jurisdiction === 'EU') {
    errors = checkComplianceEU(seats, directors, committees);
  } else if (jurisdiction === 'SG') {
    errors = checkComplianceSG(seats, directors, committees);
  } else {
    errors = checkComplianceUK(seats, directors, committees);
  }
  return errors.map(tagErrorSource);
}

/** Numeric skill-threshold rules (codes containing "_LOW_") are BoardCraft
 *  heuristics that quantify a real duty; everything else is grounded directly
 *  in a governance code or listing rule. Surfacing the distinction protects
 *  the product's accuracy claim with professional audiences. */
function tagErrorSource(err: ComplianceError): ComplianceError {
  if (err.source) return err;
  return { ...err, source: /_LOW_/.test(err.code) ? 'game' : 'code' };
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
// ══════════════════════════════════════════════════════════════
// MAS / SGX Code of Corporate Governance rules (Straits Financial Group)
// ══════════════════════════════════════════════════════════════

function checkComplianceSG(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
): ComplianceError[] {
  const errors: ComplianceError[] = [];
  const dirById = new Map(directors.map((d) => [d.id, d]));
  const seatedIds = seats.map((s) => s.directorId);
  const seatedDirectors = seatedIds.map((id) => dirById.get(id)).filter(Boolean) as Director[];

  const chair = seats.find((s) => s.role === 'chair');
  const chairDir = chair ? dirById.get(chair.directorId) : undefined;
  const hasSid = seats.some((s) => s.role === 'sid');

  // Board size: MAS expects minimum 5 directors for financial institutions
  if (seats.length < 5) {
    errors.push({
      code: 'SG-MAS-001',
      message: 'MAS expects a minimum of 5 directors on the board of a financial institution.',
      severity: 'error',
      source: 'code',
    });
  }

  // Independent director majority: SGX Code
  const independentCount = seatedDirectors.filter((d) => d.independence === 'independent').length;
  if (independentCount < Math.ceil(seats.length / 2)) {
    errors.push({
      code: 'SG-SGX-001',
      message: 'SGX Code requires a majority of board members to be independent directors.',
      severity: 'error',
      source: 'code',
    });
  }

  // 9-year independence cap: SGX — hard cap, not comply-or-explain
  for (const d of seatedDirectors) {
    const tenure = d.tenureYears ?? d.tenure;
    if (tenure >= 9 && d.independence === 'independent') {
      errors.push({
        code: 'SG-SGX-002',
        message: `${d.name} has served ${tenure} years — at or exceeding the SGX 9-year independence cap. Re-election as independent requires a two-tier shareholder resolution.`,
        severity: tenure > 9 ? 'error' : 'warning',
        source: 'code',
      });
    }
  }

  // Chair independence: SGX recommends Chair be independent; if non-independent, SID required
  if (chairDir && chairDir.independence !== 'independent' && !hasSid) {
    errors.push({
      code: 'SG-SGX-003',
      message: "The Board Chair is non-independent. SGX Code requires a Senior Independent Director (SID) to be appointed when the Chair is not independent.",
      severity: 'error',
      source: 'code',
    });
  }

  // Audit Committee: min 3 members all independent, Chair must have financial expertise (SGX/MAS)
  const auditChairId = committees.audit?.chairDirectorId;
  if (!auditChairId) {
    errors.push({
      code: 'SG-MAS-002',
      message: 'Audit Committee Chair is vacant — a compliance breach under MAS Guidelines for Financial Institutions. MAS expects immediate resolution.',
      severity: 'error',
      source: 'code',
    });
  } else {
    const acChairDir = dirById.get(auditChairId);
    if (acChairDir && (acChairDir.domainRatings.financialOversight ?? 0) < 70) {
      errors.push({
        code: 'SG-MAS-LOW_AC_EXPERTISE',
        message: 'AC Chair should have strong financial expertise (Financial Oversight ≥ 70) per MAS guidelines for financial institutions.',
        severity: 'warning',
        source: 'game',
      });
    }
    if (acChairDir && acChairDir.independence !== 'independent') {
      errors.push({
        code: 'SG-SGX-004',
        message: 'Audit Committee Chair must be independent under SGX Listing Rules.',
        severity: 'error',
        source: 'code',
      });
    }
  }

  // Board Risk Committee: mandatory for banks (MAS). Chair must not also be Board Chair.
  const brcChairId = committees.risk?.chairDirectorId;
  if (!committees.risk?.active) {
    errors.push({
      code: 'SG-MAS-003',
      message: 'A Board Risk Committee is mandatory for financial institutions under MAS guidelines.',
      severity: 'error',
      source: 'code',
    });
  } else if (brcChairId && chair && brcChairId === chair.directorId) {
    errors.push({
      code: 'SG-MAS-004',
      message: 'The Board Chair also chairs the Board Risk Committee — a dual role explicitly flagged by MAS as non-compliant for financial institutions.',
      severity: 'error',
      source: 'code',
    });
  }

  // Nominating Committee: min 3 members, majority independent
  if (!seats.some((s) => s.role === 'nomChair')) {
    errors.push({
      code: 'SG-SGX-005',
      message: 'A Nominating Committee Chair must be designated (SGX Code — mandatory committee).',
      severity: 'error',
      source: 'code',
    });
  }

  // Remuneration Committee: min 3 members, majority independent
  if (!committees.remuneration?.chairDirectorId) {
    errors.push({
      code: 'SG-SGX-006',
      message: 'A Remuneration Committee Chair must be designated (SGX Code — mandatory committee).',
      severity: 'error',
      source: 'code',
    });
  }

  // Skill coverage: SGD financial markets expertise
  const hasBankingExpertise = seatedDirectors.some(
    (d) => (d.domainRatings.financialOversight ?? 0) >= 75
  );
  if (!hasBankingExpertise) {
    errors.push({
      code: 'SG-MAS-LOW_BANKING',
      message: 'No director on the board has sufficient Financial Oversight expertise (≥ 75) for a financial institution of this scale.',
      severity: 'warning',
      source: 'game',
    });
  }

  return errors;
}

// UK Charity Commission / Charity Governance Code rules (Meridian Foundation)
// ══════════════════════════════════════════════════════════════

function checkComplianceCharityUK(
  seats: BoardSeat[],
  directors: Director[],
  committees: Record<CommitteeId, CommitteeState>,
): ComplianceError[] {
  const errors: ComplianceError[] = [];
  const getDirector = (id: string) => directors.find((d) => d.id === id);

  // Rule 1: Minimum 3 trustees (CIO minimum). CGC recommends 5+.
  if (seats.length < 3) {
    errors.push({
      code: 'BOARD_TOO_SMALL',
      message: `A CIO must have at least 3 trustees. Currently ${seats.length}. The board cannot function.`,
      severity: 'error',
    });
  } else if (seats.length <= 4) {
    errors.push({
      code: 'BOARD_BELOW_CGC_MIN',
      message: `The Charity Governance Code recommends at least 5 trustees for effective challenge and succession resilience. Currently ${seats.length}.`,
      severity: 'warning',
    });
  }

  // Rule 2: Board Chair — must be identified. Warn if non-independent or tenure ≥ 9 years.
  const chairSeat = seats.find((s) => s.role === 'chair');
  if (!chairSeat) {
    errors.push({
      code: 'NO_CHAIR',
      message: 'A Board Chair must be appointed before the game can begin.',
      severity: 'error',
    });
  } else {
    const chairDir = getDirector(chairSeat.directorId);
    if (chairDir) {
      if (chairDir.independence === 'non-independent') {
        errors.push({
          code: 'CHAIR_NOT_INDEPENDENT',
          message: `${chairDir.name} is non-independent. The Charity Governance Code strongly recommends the Chair be independent of executive and founder influence.`,
          severity: 'error',
        });
      } else if (chairDir.independence === 'questionable') {
        errors.push({
          code: 'CHAIR_INDEPENDENCE_CONCERN',
          message: `${chairDir.name}'s independence is questionable. Charity Commission scrutiny may follow — review and minute any conflicts.`,
          severity: 'warning',
        });
      }
      if ((chairDir.tenureYears ?? chairDir.tenure) >= 9) {
        errors.push({
          code: 'CHAIR_LONG_TENURE',
          message: `${chairDir.name} has served ${chairDir.tenureYears ?? chairDir.tenure} years as Chair. The Charity Governance Code recommends a maximum 9-year total tenure — succession planning is overdue.`,
          severity: 'warning',
        });
      }
      if (chairDir.domainRatings.strategyMarkets < 55) {
        errors.push({
          code: 'CHAIR_LOW_STRATEGY',
          message: `Board Chair requires Strategy & Markets ≥ 55 for effective mission oversight. ${chairDir.name} has ${chairDir.domainRatings.strategyMarkets}.`,
          severity: 'error',
        });
      }
    }
  }

  // Rule 3: Finance & Risk Committee (mapped to 'audit') — chair must have financial
  // competency. Warn if conflicted chair (conflict of interest not declared).
  const auditChairId = committees.audit.chairDirectorId;
  if (!auditChairId) {
    errors.push({
      code: 'NO_AUDIT_CHAIR',
      message: 'Finance & Risk Committee Chair must be designated. Financial stewardship is a core trustee duty under charity law.',
      severity: 'error',
    });
  } else {
    const auditDir = getDirector(auditChairId);
    if (auditDir) {
      if (auditDir.domainRatings.financialOversight < 65) {
        errors.push({
          code: 'AUDIT_CHAIR_LOW_FIN',
          message: `Finance & Risk Committee Chair requires Financial Oversight ≥ 65. ${auditDir.name} has ${auditDir.domainRatings.financialOversight}.`,
          severity: 'error',
        });
      }
      if (auditDir.independence === 'questionable') {
        errors.push({
          code: 'AUDIT_CHAIR_CONFLICT_RISK',
          message: `${auditDir.name}'s independence is questionable. An undisclosed conflict on the Finance & Risk Committee exposes trustees to personal liability under charity law.`,
          severity: 'error',
        });
      }
    }
  }

  // Rule 4: People & Culture Committee (mapped to 'remuneration') — chair should have
  // People & Culture competency.
  const remChairId = committees.remuneration.chairDirectorId;
  if (!remChairId) {
    errors.push({
      code: 'NO_REM_CHAIR',
      message: 'People & Culture Committee Chair is not designated. Safeguarding and CEO oversight are at risk.',
      severity: 'warning',
    });
  } else {
    const remDir = getDirector(remChairId);
    if (remDir && remDir.domainRatings.peopleCulture < 60) {
      errors.push({
        code: 'REM_CHAIR_LOW_PC',
        message: `People & Culture Committee Chair requires People & Culture ≥ 60. ${remDir.name} has ${remDir.domainRatings.peopleCulture}.`,
        severity: 'error',
      });
    }
  }

  // Rule 5: Programmes & Impact Committee (mapped to 'csrd') — chair should have
  // mission-relevant competency (ESG Sustainability or Geopolitical Macro). A founder
  // chairing this committee with non-independent status is flagged separately.
  const csrdChairId = committees.csrd.chairDirectorId;
  if (!csrdChairId) {
    errors.push({
      code: 'NO_CSRD_CHAIR',
      message: 'Programmes & Impact Committee Chair is not designated. Mission oversight has no accountable lead.',
      severity: 'warning',
    });
  } else {
    const csrdDir = getDirector(csrdChairId);
    if (csrdDir) {
      const missionScore = Math.max(
        csrdDir.domainRatings.esgSustainability,
        csrdDir.domainRatings.geopoliticalMacro,
      );
      if (missionScore < 65) {
        errors.push({
          code: 'CSRD_CHAIR_LOW_MISSION',
          message: `Programmes & Impact Chair should have strong mission-sector knowledge (ESG Sustainability or Geopolitical Macro ≥ 65). ${csrdDir.name} has ${missionScore}.`,
          severity: 'error',
        });
      }
      if (csrdDir.independence === 'non-independent') {
        errors.push({
          code: 'PROGRAMMES_CHAIR_NON_INDEPENDENT',
          message: `${csrdDir.name} is non-independent and chairs Programmes & Impact. This creates a governance conflict — a non-independent trustee exercising oversight over the programmes they founded distorts mission accountability.`,
          severity: 'error',
        });
      }
    }
  }

  // Rule 6: Trustee independence — CGC recommends a majority independent.
  // Flag if fewer than 50% are independent.
  const independentCount = seats.filter((s) => {
    const d = getDirector(s.directorId);
    return d?.independence === 'independent';
  }).length;
  if (seats.length > 0 && independentCount / seats.length < 0.5) {
    errors.push({
      code: 'LOW_INDEPENDENCE',
      message: `The Charity Governance Code recommends a majority of trustees be independent. Currently ${independentCount}/${seats.length} are independent.`,
      severity: 'error',
    });
  }

  // Rule 7: Tenure warnings — CGC 9-year maximum
  checkTenureWarnings(seats, directors, errors, 'Charity Governance Code (9-year recommended maximum)');

  // Rule 8: No duplicates
  checkDuplicateDirectors(seats, errors);

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
