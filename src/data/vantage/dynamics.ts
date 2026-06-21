import type { DirectorDynamic } from '@/types/game';

export const vantageDynamics: DirectorDynamic[] = [
  {
    directorAId: 'vdir_15_vance',
    directorBId: 'vdir_10_reinholt',
    type: 'positive',
    modifier: 14,
    triggerDescription:
      'Both deployed on activist or M&A events - former banker and former activist understand each other perfectly',
    narrativeReason: "Vance spent two decades running NYSE companies that activists targeted; Reinholt spent a decade being the activist. When they're in the same room, the board has an unusually complete picture of what an activist campaign looks like from both sides — and how to pre-empt it.",
  },
  {
    directorAId: 'vdir_11_carter',
    directorBId: 'vdir_04_park',
    type: 'positive',
    modifier: 10,
    triggerDescription:
      'Both deployed on People & Culture or ESG events - People and ESG specialists reinforce each other on culture events',
    narrativeReason: "Carter's expertise in executive culture and succession planning and Park's work on supply chain ethics and consumer regulation make a natural pair on any event touching workforce or ESG disclosure — Park frames the external expectation, Carter translates it into internal change.",
  },
  {
    directorAId: 'vdir_07_finch',
    directorBId: 'vdir_08_dominguez',
    type: 'positive',
    modifier: 11,
    triggerDescription:
      'Both deployed on regulatory events - legislative and legal perspectives complement each other',
    narrativeReason: "Finch's Washington network and legislative fluency and Dominguez's courtroom command of FDA compliance and class-action defence are genuinely complementary — she can navigate the political angle while he handles the legal exposure, and they've overlapped on enough consumer-goods matters to trust each other's read.",
  },
  {
    directorAId: 'vdir_01_kellerman',
    directorBId: 'vdir_15_vance',
    type: 'negative',
    modifier: -14,
    triggerDescription:
      'Both deployed on any event (especially governance events) - Kellerman resents the implication that a new Chair is needed',
    narrativeReason: "Kellerman built his LID reputation on avoiding confrontation with management; Vance's entire governance career is built on the view that NEDs who avoid confrontation are failing their shareholders. He reads her as a threat to the working relationship he's spent six years cultivating.",
  },
  {
    directorAId: 'vdir_03_whitfield',
    directorBId: 'vdir_05_stern',
    type: 'negative',
    modifier: -10,
    triggerDescription:
      'Both deployed on Financial Oversight events - both want to chair the Audit Committee; clash when deployed together',
    narrativeReason: "Both want to chair the Audit Committee and neither has found a graceful way to acknowledge that only one of them can. Whitfield's eight-year tenure gives him seniority; Stern's SEC registration gives him the technical credential ISS actually cares about. The tension surfaces every time financials are on the table.",
  },
  {
    directorAId: 'vdir_10_reinholt',
    directorBId: 'vdir_12_okoye',
    type: 'negative',
    modifier: -8,
    triggerDescription:
      'Both deployed on governance or Nom/Gov events - pragmatist vs. theorist; Reinholt dismisses academic governance perspectives',
    narrativeReason: "Reinholt ran an activist fund on the premise that academic governance frameworks are rationalised after the fact by people who've never had real money at risk; Okoye has spent twenty years at Harvard Business School building those frameworks. Neither finds the other's perspective credible.",
  },
];
