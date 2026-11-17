// ── Activist investors and their named board nominees ──
//
// Greenvale (Harwick), Apex (Vantage) and Meridian Capital (Rheinfeld) used to
// demand seats for unnamed "nominees". These are the people. They are real
// Director records so that, where an outcome says they join the board, they
// actually take a seat (see engine/boardEffects.ts). They are never in a
// company's candidate pool: the only way onto the board is through the fight.
//
// Every name, fund and career here is invented.
//
// Independence: an activist's nominee is put forward by a large shareholder,
// which the UK Code (Provision 10) and the German Code (C.6-C.9) both treat as
// a question mark over independence. They are 'questionable', so seating one
// has compliance consequences, as it would in life.

import type { Director } from '@/types/game';

export interface ActivistNominee {
  directorId: string;
  /** One line for narratives and the activist card. */
  pitch: string;
}

export interface Activist {
  fund: string;
  companyId: string;
  lead: string;
  leadRole: string;
  nominees: ActivistNominee[];
}

export const ACTIVISTS: Record<string, Activist> = {
  greenvale: {
    fund: 'Greenvale Capital',
    companyId: 'company_harwick',
    lead: 'Nathaniel Hart',
    leadRole: 'Founder and Chief Investment Officer',
    nominees: [
      { directorId: 'act_gv_ashby', pitch: 'former FTSE 100 chair, proposed as Harwick\'s next Chair' },
      { directorId: 'act_gv_rennick', pitch: 'energy analyst who has covered the North Sea for twenty years' },
      { directorId: 'act_gv_mehra', pitch: 'governance specialist who has joined two boards after activist settlements' },
    ],
  },
  apex: {
    fund: 'Apex Capital',
    companyId: 'company_vantage',
    lead: 'Marcus Adler',
    leadRole: 'Managing Partner',
    nominees: [
      { directorId: 'act_ax_reinholt', pitch: 'former CFO of a large US packaged-foods group' },
      { directorId: 'act_ax_whitfield', pitch: 'former head of corporate governance at a big California public pension fund' },
      { directorId: 'act_ax_brennan', pitch: 'restructuring specialist who has never lost a proxy fight' },
    ],
  },
  meridianCapital: {
    fund: 'Meridian Capital',
    companyId: 'company_rheinfeld',
    lead: 'Dr. Felix Hartung',
    leadRole: 'Partner, Frankfurt',
    nominees: [
      { directorId: 'act_mc_vogt', pitch: 'former CFO of a listed automotive supplier' },
      { directorId: 'act_mc_brenner', pitch: 'former audit partner and German Corporate Governance Code commission adviser' },
    ],
  },
};

const base = {
  tenure: 0,
  tenureYears: 0,
  availabilityTier: 'C' as const,
  currentEnergy: 100,
  riskFlag: null,
  inherited: false,
  independence: 'questionable' as const,
};

export const activistNominees: Director[] = [
  // ── Greenvale Capital (Harwick) ──
  {
    ...base,
    id: 'act_gv_ashby',
    name: 'Dame Caroline Ashby',
    displayName: 'Ashby',
    background:
      'Greenvale Capital nominee. Former chair of a FTSE 100 utility and, before that, its finance director. Proposed by Greenvale as Chair. Calm, exacting, and not Greenvale\'s creature, though she owes them the seat.',
    domainRatings: { financialOversight: 84, regulatoryLegal: 72, strategyMarkets: 86, peopleCulture: 76, esgSustainability: 70, geopoliticalMacro: 68, technologyDigital: 52, stakeholderComms: 82 },
    jurisdictionScores: { UK: 92 },
    annualFee: 320_000,
    suitableRoles: 'Chair; Nomination Committee Chair. Greenvale nominee — independence questioned while Greenvale holds its stake.',
  },
  {
    ...base,
    id: 'act_gv_rennick',
    name: 'Tom Rennick',
    displayName: 'Rennick',
    background:
      'Greenvale Capital nominee. Twenty years as an oil and gas analyst covering the North Sea; wrote the research note that first called Harwick\'s capital allocation "drift". Knows the assets better than most of the board.',
    domainRatings: { financialOversight: 80, regulatoryLegal: 55, strategyMarkets: 85, peopleCulture: 50, esgSustainability: 66, geopoliticalMacro: 74, technologyDigital: 58, stakeholderComms: 64 },
    jurisdictionScores: { UK: 84 },
    annualFee: 95_000,
    suitableRoles: 'NED; Audit or Energy Transition Committee member. Greenvale nominee.',
  },
  {
    ...base,
    id: 'act_gv_mehra',
    name: 'Priyanka Mehra',
    displayName: 'Mehra',
    background:
      'Greenvale Capital nominee. Governance specialist and former company secretary; has joined two boards after activist settlements and rebuilt both nomination processes. Polite, procedural, relentless.',
    domainRatings: { financialOversight: 62, regulatoryLegal: 82, strategyMarkets: 64, peopleCulture: 78, esgSustainability: 72, geopoliticalMacro: 50, technologyDigital: 54, stakeholderComms: 76 },
    jurisdictionScores: { UK: 90 },
    annualFee: 90_000,
    suitableRoles: 'NED; Remuneration or Nomination Committee. Greenvale nominee.',
  },

  // ── Apex Capital (Vantage) ──
  {
    ...base,
    id: 'act_ax_reinholt',
    name: 'David Reinholt',
    displayName: 'Reinholt',
    background:
      'Apex Capital nominee. Former CFO of a large US packaged-foods group, where he sold off three brands and halved the cost base. Apex\'s first choice for any seat it is offered.',
    domainRatings: { financialOversight: 88, regulatoryLegal: 60, strategyMarkets: 82, peopleCulture: 54, esgSustainability: 48, geopoliticalMacro: 56, technologyDigital: 52, stakeholderComms: 66 },
    jurisdictionScores: { US: 90 },
    annualFee: 260_000,
    suitableRoles: 'NED; Audit Committee. Apex nominee — independence questioned while Apex holds its stake.',
  },
  {
    ...base,
    id: 'act_ax_whitfield',
    name: 'Janet Whitfield',
    displayName: 'Whitfield',
    background:
      'Apex Capital nominee. Ran corporate governance for a big California public pension fund for a decade; led its campaigns to split combined Chair and CEO roles. Respected by the index funds.',
    domainRatings: { financialOversight: 64, regulatoryLegal: 80, strategyMarkets: 66, peopleCulture: 76, esgSustainability: 78, geopoliticalMacro: 52, technologyDigital: 50, stakeholderComms: 84 },
    jurisdictionScores: { US: 92 },
    annualFee: 240_000,
    suitableRoles: 'NED; Lead Independent Director candidate; Nominating/Governance Committee. Apex nominee.',
  },
  {
    ...base,
    id: 'act_ax_brennan',
    name: 'Carl Brennan',
    displayName: 'Brennan',
    background:
      'Apex Capital nominee. Restructuring specialist who has sat on six boards after proxy contests and never lost one. Arrives with a plan already written.',
    domainRatings: { financialOversight: 82, regulatoryLegal: 66, strategyMarkets: 84, peopleCulture: 58, esgSustainability: 44, geopoliticalMacro: 60, technologyDigital: 56, stakeholderComms: 70 },
    jurisdictionScores: { US: 88 },
    annualFee: 250_000,
    suitableRoles: 'NED; Strategy or Compensation Committee. Apex nominee.',
  },

  // ── Meridian Capital (Rheinfeld) ──
  {
    ...base,
    id: 'act_mc_vogt',
    name: 'Dr. Katharina Vogt',
    displayName: 'Vogt',
    background:
      'Meridian Capital nominee. Former CFO of a listed automotive supplier that moved production to North America ahead of tariffs. Knows exactly what Rheinfeld\'s Management Board is avoiding.',
    domainRatings: { financialOversight: 86, regulatoryLegal: 68, strategyMarkets: 82, peopleCulture: 62, esgSustainability: 66, geopoliticalMacro: 78, technologyDigital: 58, stakeholderComms: 64 },
    jurisdictionScores: { EU: 92 },
    annualFee: 160_000,
    suitableRoles: 'Shareholder-side Supervisory Board member; Audit Committee. Meridian Capital nominee.',
  },
  {
    ...base,
    id: 'act_mc_brenner',
    name: 'Matthias Brenner',
    displayName: 'Brenner',
    background:
      'Meridian Capital nominee. Former audit partner who advised the commission that writes the German Corporate Governance Code. Has opinions on Heinrich\'s chairmanship and has published them.',
    domainRatings: { financialOversight: 80, regulatoryLegal: 86, strategyMarkets: 62, peopleCulture: 60, esgSustainability: 74, geopoliticalMacro: 56, technologyDigital: 54, stakeholderComms: 66 },
    jurisdictionScores: { EU: 94 },
    annualFee: 150_000,
    suitableRoles: 'Shareholder-side Supervisory Board member; Audit or Nomination Committee. Meridian Capital nominee.',
  },
];

/** "Name, pitch" for each nominee, for use in narratives. */
export function nomineeLine(key: keyof typeof ACTIVISTS): string {
  return ACTIVISTS[key].nominees
    .map((n) => `${activistNominees.find((d) => d.id === n.directorId)!.name}, ${n.pitch}`)
    .join('; ');
}
