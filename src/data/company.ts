import type { Company } from '@/types/game';

export const harwickEnergy: Company = {
  id: 'company_harwick',
  name: 'Harwick Energy PLC',
  shortName: 'HARWICK',
  shortNameSuffix: 'ENERGY PLC',
  stockExchange: 'London Stock Exchange - FTSE 250',
  marketCap: '\u00a31.84 billion',
  marketCapTier: 'mid',
  industry: 'Oil & Gas Exploration and Production',
  jurisdiction: 'UK',
  headquarters: 'Aberdeen, Scotland',
  operations:
    'North Sea (primary), West Africa (secondary), emerging position in Guyana',
  annualRevenue: '\u00a32.1 billion',
  employees: 4200,
  startingSvIndex: 100,
  boardBudget: 2200000,
  startingGovernanceHealth: 62,
  startingGovernanceHealthBreakdown: {
    boardIndependence: 14,
    committeeCompleteness: 10,
    chairCeoSeparation: 16,
    esgGovernance: 11,
    skillMatrixCoverage: 11,
    total: 62,
  },
  difficultyTier: 2,
  narrative:
    'Harwick Energy is a mid-size North Sea E&P company at a governance inflection point. The long-serving CEO, Marcus Blaine, has been in post for a decade \u2014 a tenure that proxy advisers are beginning to flag as a risk to board independence. The outgoing Chair, Dame Helen Forsyth, is retiring at the next AGM, leaving the most consequential governance role vacant.',
  executives: [
    {
      role: 'CEO',
      name: 'Marcus Blaine',
      tenure: '10 years',
      notes:
        'Strong operational track record; compensation above sector median; independence risk given tenure',
    },
    {
      role: 'CFO',
      name: 'Priya Sundaram',
      tenure: '3 years',
      notes: 'Highly regarded; rumoured to be on FTSE 100 shortlists',
    },
    {
      role: 'COO',
      name: 'James Hartley',
      tenure: '6 years',
      notes: 'North Sea veteran; close ally of CEO',
    },
    {
      role: 'Chief People Officer',
      name: 'Nneka Osei',
      tenure: '2 years',
      notes: 'New appointment; still establishing credibility',
    },
    {
      role: 'General Counsel',
      name: 'Robert Finch',
      tenure: '8 years',
      notes: 'Institutional knowledge; cautious by nature',
    },
  ],
  committees: [
    {
      id: 'audit',
      name: 'Audit Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired: 'Min. 3 independent NEDs',
      notes:
        'Requires at least one with recent financial experience (FRC Code)',
    },
    {
      id: 'remuneration',
      name: 'Remuneration Committee',
      status: 'vacant',
      chairDirectorId: null,
      membersRequired: 'Min. 3 independent NEDs',
      notes:
        'No committee chair for 2 quarters \u2014 governance health penalty already baked into starting score',
    },
    {
      id: 'nomination',
      name: 'Nomination Committee',
      status: 'active',
      chairDirectorId: null,
      membersRequired: 'Min. 3, majority independent',
      notes:
        'Chair succession is the immediate priority for this committee',
    },
    {
      id: 'safetyEnvironment',
      name: 'Safety & Environment Committee',
      status: 'active',
      chairDirectorId: 'dir_13_okafor',
      membersRequired: 'Min. 2 NEDs',
      notes:
        'Functional but under-resourced; relevant to ESG events',
    },
    {
      id: 'energyTransition',
      name: 'Energy Transition Committee',
      status: 'not_established',
      chairDirectorId: null,
      membersRequired: 'N/A',
      notes:
        'Player decision: establish (costs \u00a3180k p.a. budget allocation) or leave. Having it gives +10 to ESG/energy transition events.',
      formationCost: 180000,
    },
  ],
  excludeDirectorIds: ['dir_00_forsyth'],
  inheritedBoard: [
    { directorId: 'dir_13_okafor', role: 'ned', baseFee: 145_000 },
    { directorId: 'dir_15_holt', role: 'ned', baseFee: 110_000 },
    { directorId: 'dir_08_crane', role: 'ned', baseFee: 110_000 },
    { directorId: 'dir_12_tanaka', role: 'ned', baseFee: 90_000 },
  ],
  eventSchedule: [
    { eventId: 'event_01', quarter: 'Q1', turn: 1 },
    { eventId: 'event_02', quarter: 'Q1', turn: 2 },
    { eventId: 'event_03', quarter: 'Q1', turn: 3 },
    { eventId: 'event_04', quarter: 'Q1', turn: 4 },
    { eventId: 'event_05', quarter: 'Q2', turn: 1 },
    { eventId: 'event_06', quarter: 'Q2', turn: 2 },
    { eventId: 'event_07', quarter: 'Q2', turn: 3 },
    { eventId: 'event_08', quarter: 'Q2', turn: 4 },
    { eventId: 'event_09', quarter: 'AGM', turn: 1 },
    { eventId: 'event_10', quarter: 'Q3', turn: 1 },
    { eventId: 'event_11', quarter: 'Q3', turn: 2 },
    { eventId: 'event_12', quarter: 'Q3', turn: 3 },
    { eventId: 'event_13', quarter: 'Q4', turn: 1 },
    { eventId: 'event_14', quarter: 'Q4', turn: 2 },
    { eventId: 'event_15', quarter: 'Q4', turn: 3 },
  ],
  directorIds: [
    'dir_00_forsyth', 'dir_01_wren', 'dir_02_bracewell', 'dir_03_brennan',
    'dir_04_pemberton', 'dir_05_alfassih', 'dir_06_macallister', 'dir_07_ashworth',
    'dir_08_crane', 'dir_09_diallo', 'dir_10_lonsdale', 'dir_11_oduya',
    'dir_12_tanaka', 'dir_13_okafor', 'dir_14_larsson', 'dir_15_holt',
    'dir_16_chen', 'dir_17_adeyemi', 'dir_18_whitmore', 'dir_21_mensah',
    'dir_22_morrow', 'dir_24_voss', 'dir_25_achebe',
  ],
};

import { vantageConsumer } from './vantage/company';
import { rheinfeldAG } from './rheinfeld/company';
import { meridianFoundation } from './meridian/company';
import { straitsFinancialGroup } from './sfg/company';

/** All available companies */
export const companies: Company[] = [harwickEnergy, vantageConsumer, rheinfeldAG, meridianFoundation, straitsFinancialGroup];
