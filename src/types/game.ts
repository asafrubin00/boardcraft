// ── BoardCraft Core Type Definitions ──

// ── Enums & Literals ──

export type CompetencyDomain =
  | 'financialOversight'
  | 'regulatoryLegal'
  | 'strategyMarkets'
  | 'peopleCulture'
  | 'esgSustainability'
  | 'geopoliticalMacro'
  | 'technologyDigital'
  | 'stakeholderComms';

export type Jurisdiction = 'UK' | 'US' | 'EU' | 'AU' | 'Valdoria';

export type AvailabilityTier = 'A' | 'B' | 'C';

export type IndependenceStatus = 'independent' | 'non-independent' | 'questionable';

export type BoardRole =
  | 'chair'
  | 'auditChair'
  | 'remChair'
  | 'nomChair'
  | 'sid'
  | 'esgChair'
  | 'riskChair'
  | 'techChair'
  | 'safetyEnvChair'
  | 'energyTransitionChair'
  | 'csrdChair'
  | 'strategyChair'
  | 'ned';

export type MarketCapTier = 'nano_small' | 'mid' | 'large' | 'mega';

export type OutcomeTier =
  | 'CRITICAL_SUCCESS'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILURE'
  | 'CRITICAL_FAILURE';

export type EventTier = 1 | 2 | 3;

export type Quarter = 'Q1' | 'Q2' | 'AGM' | 'Q3' | 'Q4';

export type DynamicModifierType = 'positive' | 'negative';

export type CommitteeId =
  | 'audit'
  | 'remuneration'
  | 'nomination'
  | 'safetyEnvironment'
  | 'energyTransition'
  | 'csrd'
  | 'strategy';

// ── Domain Ratings ──

export type DomainRatings = Record<CompetencyDomain, number>;

export type JurisdictionScores = Partial<Record<Jurisdiction, number>>;

// ── Director ──

export interface RiskFlag {
  description: string;
  activationProbability: number;
  triggerCategories: CompetencyDomain[];
  activated: boolean;
}

export interface Director {
  id: string;
  name: string;
  background: string;
  domainRatings: DomainRatings;
  jurisdictionScores: JurisdictionScores;
  independence: IndependenceStatus;
  tenure: number;
  annualFee: number;
  availabilityTier: AvailabilityTier;
  currentEnergy: number;
  riskFlag: RiskFlag | null;
  suitableRoles: string;
  inherited: boolean;
  /** Years of service on this board - used for tenure independence warnings */
  tenureYears?: number;
}

// ── Director Dynamics ──

export interface DirectorDynamic {
  directorAId: string;
  directorBId: string;
  type: DynamicModifierType;
  modifier: number;
  triggerDescription: string;
  narrativeReason?: string;
}

// ── Company ──

export interface ExecutiveLeader {
  role: string;
  name: string;
  tenure: string;
  notes: string;
}

export interface CommitteeDefinition {
  id: CommitteeId;
  name: string;
  status: 'active' | 'vacant' | 'not_established';
  chairDirectorId: string | null;
  membersRequired: string;
  notes: string;
  formationCost?: number;
}

export interface ScheduledEvent {
  eventId: string;
  quarter: Quarter;
  turn: number;
}

export interface InheritedBoardSeat {
  directorId: string;
  role: BoardRole;
  baseFee: number;
}

export interface Company {
  id: string;
  name: string;
  /** Short name for table watermark (e.g. "HARWICK", "VANTAGE") */
  shortName: string;
  /** Second line for table watermark (e.g. "ENERGY PLC", "CONSUMER") */
  shortNameSuffix: string;
  stockExchange: string;
  marketCap: string;
  marketCapTier: MarketCapTier;
  industry: string;
  jurisdiction: Jurisdiction;
  headquarters: string;
  operations: string;
  annualRevenue: string;
  employees: number;
  startingSvIndex: number;
  boardBudget: number;
  startingGovernanceHealth: number;
  startingGovernanceHealthBreakdown: GovernanceHealthBreakdown;
  difficultyTier: 1 | 2 | 3 | 4;
  narrative: string;
  executives: ExecutiveLeader[];
  committees: CommitteeDefinition[];
  /** Director IDs to exclude from candidate pool (e.g. outgoing chair) */
  excludeDirectorIds: string[];
  /** Optional display-name overrides for the governance health breakdown dimensions */
  governanceLabels?: Partial<Record<keyof Omit<GovernanceHealthBreakdown, 'total'>, string>>;
  /** The inherited board seats at game start */
  inheritedBoard: InheritedBoardSeat[];
  /** Company-specific event schedule */
  eventSchedule: ScheduledEvent[];
  /** Director IDs that belong to this company's pool */
  directorIds: string[];
}

// ── Events ──

export interface CompetencyGate {
  domain: CompetencyDomain;
  minimumRating: number;
}

export interface StrategyOption {
  id: string;
  label: string;
  description: string;
  multiplier: number;
  competencyGates: CompetencyGate[];
  fallback?: string;
  isDoNothing?: boolean;
  /** If set, a successful resolution at or above minOutcomeTier triggers a director removal */
  boardEffect?: {
    removeDirectorId: string;
    minOutcomeTier: OutcomeTier;
    requiresReplacement: boolean;
    vacatedRole: BoardRole;
    /** Additional director IDs removed silently alongside the primary removal (no replacement modal) */
    simultaneousRemoveIds?: string[];
  };
}

export interface OutcomeTierDefinition {
  svRange: [number, number];
  narrative: string;
}

export interface FollowOnTrigger {
  eventId: string;
  triggerTiers: OutcomeTier[];
  delay: number;
}

export interface GameEvent {
  id: string;
  name: string;
  tier: EventTier;
  quarter: Quarter;
  turn: number;
  narrativeCard: string;
  primaryDomain: CompetencyDomain;
  primaryWeight: number;
  secondaryDomains: { domain: CompetencyDomain; weight: number }[];
  strategies: StrategyOption[];
  relevantCommittee: CommitteeId | null;
  committeeBonusValue: number;
  followOnTriggers: FollowOnTrigger[];
  outcomeTiers: Record<OutcomeTier, OutcomeTierDefinition>;
  isConditional: boolean;
  conditionDescription?: string;
  riskFlagTriggerCategories?: CompetencyDomain[];
  /** Board-state precondition ID. If null, the event always fires.
   *  If set, checkEventPrecondition() must return true for the event to queue. */
  precondition: string | null;
  /** Data-driven condition config for conditional events (replaces hardcoded switch) */
  conditionConfig?: {
    requiresEventId?: string;
    requiresOutcome?: OutcomeTier[];
    requiresGhBelow?: number;
  };
  /** Illustration type for event card visual. Defaults to 'default' if omitted. */
  illustrationType?: string;
  /** Optional illustration image filename (e.g. 'mevent-conflict-interest.jpg').
   *  Drop image files into /public/images/events/ — they resolve automatically. */
  imageFile?: string;
}

// ── Board Composition ──

export interface BoardSeat {
  directorId: string;
  role: BoardRole;
  feeWithPremium: number;
}

export interface ComplianceError {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  /** 'code' = grounded in a real governance code/listing rule;
   *  'game' = a BoardCraft skill threshold (game heuristic, not a legal requirement) */
  source?: 'code' | 'game';
}

export interface BoardComposition {
  seats: BoardSeat[];
  totalCommittedBudget: number;
  remainingBudget: number;
  complianceErrors: ComplianceError[];
}

// ── Governance Health Breakdown ──

export interface GovernanceHealthBreakdown {
  boardIndependence: number;
  committeeCompleteness: number;
  chairCeoSeparation: number;
  esgGovernance: number;
  skillMatrixCoverage: number;
  total: number;
}

// ── Resolution Engine I/O ──

export interface ResolutionInput {
  eventId: string;
  deployedDirectorIds: string[];
  strategyChoice: string;
}

export interface EnergyUpdate {
  directorId: string;
  previousEnergy: number;
  newEnergy: number;
}

export interface DirectorContribution {
  directorId: string;
  directorName: string;
  weightedScore: number;
  energyModifier: number;
  jurisdictionPenaltyApplied: boolean;
}

export interface BestAvailableGap {
  domain: CompetencyDomain;
  deployedBestName: string | null;
  deployedBestRating: number;
  rosterBestName: string;
  rosterBestRating: number;
  gap: number;
}

export interface ResolutionBreakdown {
  isDoNothing: boolean;
  primaryDomain: CompetencyDomain;
  directorContributions: DirectorContribution[];
  dynamicsModifier: number;
  matchScore: number;
  strategyId: string;
  strategyMultiplier: number;
  competencyGatePassed: boolean;
  fallbackTriggered: boolean;
  fallbackStrategyId?: string;
  committeeBonus: number;
  rawScore: number;
  randomRange: [number, number];
  randomFactor: number;
  bestAvailableGaps: BestAvailableGap[];
  dynamicsTriggered: {
    directorAId: string;
    directorBId: string;
    modifier: number;
  }[];
  bestSeatedUndeployedGaps: BestAvailableGap[];
}

export interface ResolutionOutput {
  outcomeTier: OutcomeTier;
  finalScore: number;
  svDelta: number;
  narrativeText: string;
  energyUpdates: EnergyUpdate[];
  followOnEvents: string[];
  /** True if a wildcard shifted the outcome tier unexpectedly */
  wildcard?: boolean;
  /** Optional explainability data — always populated, used by OutcomeDisplay and YearEndScreen */
  breakdown?: ResolutionBreakdown;
}

// ── Committee State ──

export interface CommitteeState {
  active: boolean;
  chairDirectorId: string | null;
}

// ── Resolved Event Record ──

export interface ResolvedEvent {
  eventId: string;
  outcomeTier: OutcomeTier;
  svDelta: number;
  deployedDirectorIds: string[];
  strategyChosen: string;
  resolvedAtTurn: number;
  resolvedAtQuarter: Quarter;
  /** Explainability data from resolution engine — optional for backwards compatibility */
  breakdown?: ResolutionBreakdown;
}

// ── Forced Mid-Game Director Changes ──

export type ForcedChangeType = 'health_crisis' | 'misconduct' | 'regulatory_disqualification' | 'event_resolution';

export interface ForcedDirectorChange {
  type: ForcedChangeType;
  directorId: string;
  directorName: string;
  turnsRemaining: number;
  narrative: string;
  /** For misconduct: player can choose to retain instead of dismiss */
  canRetain?: boolean;
}

// ── Game State ──

export type ApexStatus = 'monitoring' | 'escalating' | 'hostile';

export interface GameState {
  company: Company;
  board: BoardComposition;
  directors: Director[];
  directorDynamics: DirectorDynamic[];
  svIndex: number;
  governanceHealth: number;
  governanceHealthBreakdown: GovernanceHealthBreakdown;
  boardTension: number;
  currentQuarter: Quarter;
  currentTurn: number;
  eventQueue: string[];
  resolvedEvents: ResolvedEvent[];
  boardLocked: boolean;
  phase: 'board_construction' | 'gameplay' | 'agm' | 'post_agm' | 'year_end';
  committees: Record<CommitteeId, CommitteeState>;
  randomSeed: number;
  /** Vantage-specific: Apex Capital activist status */
  apexStatus: ApexStatus;
  /** Vantage-specific: Chair/CEO separation progress (0–100) */
  chairCeoSeparationProgress: number;
  /** Vantage-specific: whether Apex Capital is still an active threat */
  apexActive: boolean;
  /** Vantage-specific: whether FDA inquiry has escalated */
  fdaInquiryActive: boolean;
  /** Active forced director change (if any) */
  forcedChange: ForcedDirectorChange | null;
  /** Whether FMC-01 (health crisis) has already fired this game */
  healthCrisisFired: boolean;
  /** Rheinfeld-specific: whether Heinrich's China side-deal has been revealed */
  heinrichConflictRevealed: boolean;
  /** Rheinfeld-specific: current state of worker representative relations */
  workerRepRelations: 'hostile' | 'neutral' | 'cooperative';
  /** Rheinfeld-specific: CSRD compliance progress (0–100) */
  csrdProgress: number;
  /** Rheinfeld-specific: whether Meridian Capital is still an active threat */
  meridianActive: boolean;
  /** Rheinfeld-specific: Meridian Capital activist status */
  meridianStatus: 'watching' | 'escalating' | 'hostile';
  /** Meridian Foundation-specific: Mission Integrity Score (0–100) — replaces SV Index */
  missionIntegrityScore: number;
  /** Meridian Foundation-specific: Founder Syndrome Score (0–100, hidden from player) */
  founderSyndromeScore: number;
  /** Meridian Foundation-specific: whether a Charity Commission statutory inquiry is active */
  charityCommissionInquiryActive: boolean;
  /** Meridian Foundation-specific: whether the organisation faces a formal solvency concern */
  solvencyRisk: boolean;
  /** Transient notification from an event consequence (e.g. involuntary board removals).
   *  Shown as a dismissible banner; cleared when player acknowledges. */
  pendingBoardNotification?: string | null;
}
