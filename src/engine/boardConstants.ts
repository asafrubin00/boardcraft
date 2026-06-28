import type { BoardRole, CompetencyDomain, Jurisdiction } from '@/types/game';

export const DOMAIN_LABELS: Record<CompetencyDomain, string> = {
  financialOversight: 'Financial Oversight',
  regulatoryLegal: 'Regulatory & Legal',
  strategyMarkets: 'Strategy & Markets',
  peopleCulture: 'People & Culture',
  esgSustainability: 'ESG & Sustainability',
  geopoliticalMacro: 'Geopolitical & Macro',
  technologyDigital: 'Technology & Digital',
  stakeholderComms: 'Stakeholder & Comms',
};

export const DOMAIN_SHORT: Record<CompetencyDomain, string> = {
  financialOversight: 'Financial',
  regulatoryLegal: 'Regulatory',
  strategyMarkets: 'Strategy',
  peopleCulture: 'People',
  esgSustainability: 'ESG',
  geopoliticalMacro: 'Geopolitical',
  technologyDigital: 'Technology',
  stakeholderComms: 'Stakeholder',
};

export const ROLE_LABELS: Record<BoardRole, string> = {
  chair: 'Board Chair',
  auditChair: 'Audit Committee Chair',
  remChair: 'Remuneration Committee Chair',
  nomChair: 'Nomination Committee Chair',
  sid: 'Senior Independent Director',
  esgChair: 'ESG Committee Chair',
  riskChair: 'Risk Committee Chair',
  techChair: 'Tech/Cyber Committee Chair',
  safetyEnvChair: 'Safety & Environment Chair',
  energyTransitionChair: 'Energy Transition Chair',
  csrdChair: 'CSRD Committee Chair',
  strategyChair: 'Strategy Committee Chair',
  sustainabilityChair: 'Sustainability Committee Chair',
  ned: 'Non-Executive Director',
};

export const ALL_DOMAINS: CompetencyDomain[] = [
  'financialOversight',
  'regulatoryLegal',
  'strategyMarkets',
  'peopleCulture',
  'esgSustainability',
  'geopoliticalMacro',
  'technologyDigital',
  'stakeholderComms',
];

export const AVAILABLE_ROLES: BoardRole[] = [
  'chair',
  'auditChair',
  'remChair',
  'nomChair',
  'sid',
  'energyTransitionChair',
  'csrdChair',
  'strategyChair',
  'ned',
];

/** US-specific role label overrides */
export const ROLE_LABELS_US: Partial<Record<BoardRole, string>> = {
  sid: 'Lead Independent Director',
  remChair: 'Compensation Committee Chair',
  nomChair: 'Nom/Gov Committee Chair',
  safetyEnvChair: 'Brand & Reputation Chair',
  energyTransitionChair: 'Consumer Affairs & Regulatory Committee Chair',
};

/** EU/German-specific role label overrides (Rheinfeld Aufsichtsrat) */
export const ROLE_LABELS_EU: Partial<Record<BoardRole, string>> = {
  chair: 'Supervisory Board Chair',
  ned: 'Supervisory Board Member',
};

/** Singapore / MAS-SGX role label overrides — Straits Financial Group */
export const ROLE_LABELS_SG: Partial<Record<BoardRole, string>> = {
  riskChair: 'Board Risk Committee Chair',
  strategyChair: 'Board Credit Committee Chair',
  sustainabilityChair: 'Sustainability Committee Chair',
  energyTransitionChair: 'Sustainability Committee Chair',
  safetyEnvChair: 'Board Risk Committee Chair',
};

/** UK Charity (CIO) role label overrides — Meridian Foundation */
export const ROLE_LABELS_CHARITY: Partial<Record<BoardRole, string>> = {
  chair: 'Chair of Trustees',
  auditChair: 'Finance & Risk Committee Chair',
  remChair: 'People & Culture Committee Chair',
  nomChair: 'Nominations Committee Chair',
  sid: 'Deputy Chair',
  csrdChair: 'Programmes & Impact Committee Chair',
  ned: 'Trustee',
};

/** Short display label for a role (strips "Committee Chair" → "Chair", etc.) */
export function getShortRoleLabel(role: BoardRole, jurisdiction: Jurisdiction = 'UK', companyId?: string): string {
  const full = getRoleLabel(role, jurisdiction, companyId);
  return full
    .replace(' Committee Chair', ' Chair')
    .replace('Consumer Affairs & Regulatory', 'CA&R')
    .replace(/^Board /, '')
    .replace('Non-Executive Director', 'NED')
    .replace('Senior Independent Director', 'SID')
    .replace('Lead Independent Director', 'LID')
    .replace('Supervisory Board Member', 'SB Member')
    .replace('Supervisory Board Chair', 'SB Chair')
    .replace('Chair of Trustees', 'Chair');
}

/** Get role label for a given jurisdiction, with optional companyId override */
export function getRoleLabel(role: BoardRole, jurisdiction: Jurisdiction = 'UK', companyId?: string): string {
  if (companyId === 'company_meridian') {
    return ROLE_LABELS_CHARITY[role] ?? ROLE_LABELS[role];
  }
  if (jurisdiction === 'US') {
    return ROLE_LABELS_US[role] ?? ROLE_LABELS[role];
  }
  if (jurisdiction === 'EU') {
    return ROLE_LABELS_EU[role] ?? ROLE_LABELS[role];
  }
  if (jurisdiction === 'SG') {
    return ROLE_LABELS_SG[role] ?? ROLE_LABELS[role];
  }
  return ROLE_LABELS[role];
}
