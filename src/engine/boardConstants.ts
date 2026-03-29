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

/** Get role label for a given jurisdiction */
export function getRoleLabel(role: BoardRole, jurisdiction: Jurisdiction = 'UK'): string {
  if (jurisdiction === 'US') {
    return ROLE_LABELS_US[role] ?? ROLE_LABELS[role];
  }
  return ROLE_LABELS[role];
}
