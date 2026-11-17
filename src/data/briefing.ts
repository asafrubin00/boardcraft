// ── Company briefings and board-strength notes ──
//
// The richer lore behind the "i" button: where the share price has been, who
// owns the place, and what the papers were saying BEFORE the Board Adviser
// arrived. Nothing here may describe events the player is about to play —
// headlines are background, never spoilers, and never contradict a choice.
//
// Mastheads, journalists and articles are invented. Facts (people, stakes,
// figures) match data/lore.ts and each company's company.ts.

import type { CompetencyDomain } from '@/types/game';

export interface BriefingArticle {
  masthead: string;
  when: string;
  headline: string;
  /** One line under the headline. */
  standfirst: string;
  byline: string;
  body: string[];
}

export interface CompanyBriefing {
  /** Stock ticker, or a short label where there are no shares. */
  ticker: string;
  /** What the chart measures, e.g. "Share price, pence". */
  chartLabel: string;
  /** Unit prefix/suffix for the headline number. */
  chartPrefix: string;
  chartSuffix: string;
  /** Twelve points, oldest first; the last is "now". */
  chart: number[];
  /** Labels for the x axis, same length as chart. */
  chartTicks: string[];
  /** Moments worth marking on the chart. */
  chartNotes: { at: number; label: string }[];
  ownersTitle: string;
  owners: { name: string; pct: number; flag?: 'activist' | 'anchor' }[];
  facts: { label: string; value: string }[];
  articles: BriefingArticle[];
  /** Why each skill area matters at THIS company, one sentence each. */
  why: Record<CompetencyDomain, string>;
}

/** What each skill area means, in one line. */
export const DOMAIN_MEANING: Record<CompetencyDomain, string> = {
  financialOversight: 'Reading the numbers properly: accounts, audit, capital, and knowing when a figure does not add up.',
  regulatoryLegal: 'Knowing the rules and the regulator: listing rules, company law, and how enforcement really works.',
  strategyMarkets: 'Judging the big calls: where to compete, what to buy or sell, and how the market will read it.',
  peopleCulture: 'Pay, succession and behaviour: who leads, how they are rewarded, and what the place is really like.',
  esgSustainability: 'Environmental and social risk treated as real risk: climate, safety, supply chains, and honest reporting on them.',
  geopoliticalMacro: 'The world outside the company: governments, trade, sanctions and the economy.',
  technologyDigital: 'Systems, data and cyber: what could break, what could leak, and what competitors are building.',
  stakeholderComms: 'Being believed: by shareholders, staff, the press and the public, especially on a bad day.',
};

const MONTHS = ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

export const BRIEFINGS: Record<string, CompanyBriefing> = {
  company_harwick: {
    ticker: 'HWK · LSE',
    chartLabel: 'Share price, pence',
    chartPrefix: '', chartSuffix: 'p',
    chart: [412, 405, 398, 391, 377, 369, 372, 358, 349, 341, 362, 355],
    chartTicks: MONTHS,
    chartNotes: [
      { at: 4, label: 'Forsyth says she will retire' },
      { at: 10, label: 'Greenvale appears on the register' },
    ],
    ownersTitle: 'Who owns it',
    owners: [
      { name: 'UK active institutions', pct: 32 },
      { name: 'Index funds', pct: 26 },
      { name: 'Overseas and other holders', pct: 19 },
      { name: 'Retail shareholders', pct: 14 },
      { name: 'Greenvale Capital and allies', pct: 9, flag: 'activist' },
    ],
    facts: [
      { label: 'Listed', value: 'London Stock Exchange · FTSE 250' },
      { label: 'Governed by', value: 'UK Corporate Governance Code' },
      { label: 'Chief Executive', value: 'Marcus Blaine, ten years in post' },
      { label: 'Chair', value: 'Dame Helen Forsyth, retiring at the AGM' },
    ],
    articles: [
      {
        masthead: 'The Granite City Post',
        when: 'Seven months ago',
        headline: 'Forsyth to leave Harwick chair, and nobody is lined up',
        standfirst: 'The woman who steadied the North Sea producer will go at the next AGM.',
        byline: 'By our Energy Correspondent',
        body: [
          'Dame Helen Forsyth told investors yesterday that she will retire as chair of Harwick Energy at the next annual meeting, ending a tenure widely credited with keeping the peace between a forceful chief executive and a cautious board.',
          'The company did not name a successor. With only four non-executives left and no one chairing the Remuneration Committee, one large shareholder called the board "thin for a company this size". Harwick said a search was under way.',
        ],
      },
      {
        masthead: 'The Square Mile Dispatch',
        when: 'Five weeks ago',
        headline: 'Greenvale surfaces on the Harwick register',
        standfirst: 'The activist fund has said nothing. It rarely needs to.',
        byline: 'Markets desk',
        body: [
          'Greenvale Capital, the fund that forced board changes at two mid-cap energy groups in the past three years, has emerged as a shareholder in Harwick Energy. The shares rose 6% on the news.',
          'Greenvale declined to comment. People who have dealt with the fund say its pattern is consistent: buy quietly, write privately, and go public only if the answer is no. Harwick said it "welcomes engagement with all shareholders".',
        ],
      },
      {
        masthead: 'Northern Energy Review',
        when: 'Three weeks ago',
        headline: 'A decade of Blaine: the £4.1m question',
        standfirst: 'Harwick\'s chief executive has delivered. Investors are starting to ask who checks his homework.',
        byline: 'Analysis',
        body: [
          'Marcus Blaine has run Harwick for ten years, longer than most of his board has sat on it. Production is steady, the dividend has held, and his £4.1m package sits well above the sector median.',
          'Proxy advisers have begun to flag the combination: a long-serving chief executive, a retiring chair, a director in his twelfth year and no Remuneration Committee chair to defend the pay report. None of it is a scandal. All of it will be on the agenda.',
        ],
      },
    ],
    why: {
      financialOversight: 'Harwick\'s finance chief is its most trusted voice with the market, and other companies want her.',
      regulatoryLegal: 'Offshore operators answer to the safety regulator first and their shareholders second.',
      strategyMarkets: 'A mid-sized North Sea producer is either a buyer or a target. The board has to know which.',
      peopleCulture: 'A ten-year chief executive, a £4.1m package and no Remuneration Committee chair: pay will be fought over.',
      esgSustainability: 'This is an oil company with ageing platforms and investors asking about the energy transition.',
      geopoliticalMacro: 'Oil prices, windfall taxes and sanctions are set by governments, not by Harwick.',
      technologyDigital: 'Platforms and pipelines run on control systems that are attractive targets.',
      stakeholderComms: 'An activist has arrived. What the board says, and to whom, will decide how that goes.',
    },
  },

  company_vantage: {
    ticker: 'VCB · NYSE',
    chartLabel: 'Share price, US$',
    chartPrefix: '$', chartSuffix: '',
    chart: [61.2, 62.8, 60.1, 58.4, 59.0, 56.3, 54.9, 52.2, 53.8, 50.6, 54.1, 52.9],
    chartTicks: MONTHS,
    chartNotes: [
      { at: 7, label: 'Proxy adviser red-flags CEO pay' },
      { at: 10, label: 'Apex files its 5.3% stake' },
    ],
    ownersTitle: 'Who owns it',
    owners: [
      { name: 'Index funds', pct: 34 },
      { name: 'Active managers', pct: 30 },
      { name: 'Retail shareholders', pct: 16 },
      { name: 'Directors and staff', pct: 12 },
      { name: 'Apex Capital and allies', pct: 8, flag: 'activist' },
    ],
    facts: [
      { label: 'Listed', value: 'New York Stock Exchange' },
      { label: 'Governed by', value: 'NYSE listing standards · SEC rules' },
      { label: 'Chair and Chief Executive', value: 'Sandra Okafor, both roles, three years' },
      { label: 'Lead Independent Director', value: 'Robert Kellerman' },
    ],
    articles: [
      {
        masthead: 'Lakeshore Business Journal',
        when: 'Four weeks ago',
        headline: 'Apex Capital takes 5.3% of Vantage and has "a number of questions"',
        standfirst: 'The filing is short. The fund\'s record is not.',
        byline: 'By our Deals Reporter',
        body: [
          'Apex Capital disclosed a 5.3% stake in Vantage Consumer Brands on Tuesday, saying only that it intends to talk to the board about "governance, capital allocation and a number of questions".',
          'Apex has run four campaigns at consumer companies in five years and won board seats in three. Vantage shares rose 7%. A spokesperson said the company "maintains an open dialogue with its investors".',
        ],
      },
      {
        masthead: 'The Proxy Letter',
        when: 'Four months ago',
        headline: 'One job too many? Investors revisit Okafor\'s twin titles',
        standfirst: 'A $14.2m pay package has reopened an argument Vantage thought it had won.',
        byline: 'Governance column',
        body: [
          'Sandra Okafor is chair and chief executive of Vantage, and has been clear that she intends to stay both. Her supporters point to three years of growth by acquisition.',
          'Her critics point to the bill. A leading proxy adviser red-flagged last year\'s $14.2m package, and several index funds now say privately that they would support an independent chair. The board has a Lead Independent Director. Whether that is enough is the question.',
        ],
      },
      {
        masthead: 'Food & Shelf Weekly',
        when: 'Two months ago',
        headline: 'Ultra-processed and under pressure',
        standfirst: 'Regulators and campaigners are closing in on the snack aisle.',
        byline: 'Industry briefing',
        body: [
          'Snack foods, sports nutrition, frozen meals and soft-drink concentrates: Vantage\'s portfolio reads like a list of what health regulators are now looking at hardest.',
          'Labelling rules are tightening, several states are weighing new taxes, and retailers are giving healthier ranges the better shelves. Vantage says its products "meet every applicable standard". Analysts note that standards move.',
        ],
      },
    ],
    why: {
      financialOversight: 'Vantage grew by buying companies. Someone has to check what was paid and what it was worth.',
      regulatoryLegal: 'Food labelling, antitrust and securities law all bear on this company at once.',
      strategyMarkets: 'An activist is asking where the money goes. The board needs its own answer first.',
      peopleCulture: 'One person holds both top jobs and was paid $14.2m. That is the argument of the year.',
      esgSustainability: 'Supply chains and public health are where this brand is most exposed.',
      geopoliticalMacro: 'Ingredients, tariffs and state taxes shift the cost of every product on the shelf.',
      technologyDigital: 'A consumer company holds a great deal of customer data, and a reputation that lives online.',
      stakeholderComms: 'Consumer brands are won and lost in public. A bad week travels fast.',
    },
  },

  company_rheinfeld: {
    ticker: 'RHF · XETRA',
    chartLabel: 'Share price, €',
    chartPrefix: '€', chartSuffix: '',
    chart: [48.6, 49.2, 47.1, 46.4, 44.0, 41.2, 42.5, 40.8, 39.6, 41.9, 40.1, 39.3],
    chartTicks: MONTHS,
    chartNotes: [
      { at: 5, label: 'US tariff list published' },
      { at: 9, label: 'Meridian Capital reaches 12%' },
    ],
    ownersTitle: 'Who owns it',
    owners: [
      { name: 'Rheinfeld family holding', pct: 34, flag: 'anchor' },
      { name: 'German institutions', pct: 24 },
      { name: 'International funds', pct: 20 },
      { name: 'Meridian Capital', pct: 12, flag: 'activist' },
      { name: 'Retail shareholders', pct: 10 },
    ],
    facts: [
      { label: 'Listed', value: 'Frankfurt (XETRA) · DAX mid-cap' },
      { label: 'Governed by', value: 'Stock Corporation Act · German Governance Code' },
      { label: 'Supervisory Board Chair', value: 'Heinrich Rheinfeld, aged 71' },
      { label: 'Board structure', value: 'Two boards; five worker-representative seats' },
    ],
    articles: [
      {
        masthead: 'Rheinische Wirtschaftszeitung',
        when: 'Six weeks ago',
        headline: 'Meridian Capital reaches 12% of Rheinfeld and wants an outside review',
        standfirst: 'The Frankfurt fund says the strategy needs "eyes that do not share a surname".',
        byline: 'Von unserem Korrespondenten in Düsseldorf',
        body: [
          'Meridian Capital has raised its holding in Rheinfeld AG to 12%, making it the largest shareholder after the founding family, and has asked the Supervisory Board to commission an independent review of the group\'s strategy.',
          'The family holding company controls 34%. Asked whether a review was likely, a person close to the chairman said: "Herr Rheinfeld has reviewed the strategy every day for fifty years."',
        ],
      },
      {
        masthead: 'Börsenblatt am Morgen',
        when: 'Six months ago',
        headline: 'Washington\'s tariff list puts €580m of Rheinfeld sales in the firing line',
        standfirst: 'Automotive components bound for America are squarely in scope.',
        byline: 'Märkte',
        body: [
          'Rheinfeld shares fell 6% after the United States published a tariff list covering precision automotive components. The company sells about €580m a year to American customers.',
          'Management said it was "assessing options", which analysts took to include moving production. Chief operating officer Markus Bauer is known to favour a larger presence in China. The finance chief is known to disagree.',
        ],
      },
      {
        masthead: 'Der Mittelstand',
        when: 'Three months ago',
        headline: 'At 71, Heinrich Rheinfeld is not going anywhere',
        standfirst: 'Fifteen years after the flotation, the patriarch still has the last word.',
        byline: 'Porträt',
        body: [
          'Rheinfeld AG went public fifteen years ago. Visitors to the Düsseldorf headquarters could be forgiven for not noticing. Heinrich Rheinfeld, grandson of the founder, chairs the Supervisory Board and, by most accounts, the room.',
          'Half the board is elected by the workforce, as German law requires. The other half has rarely voted against him. "He built it," says one former colleague. "The difficulty is that he knows it."',
        ],
      },
    ],
    why: {
      financialOversight: 'The Audit Committee needs a real financial expert in the chair, and the auditor is watching.',
      regulatoryLegal: 'German company law gives the Supervisory Board real duties, and personal liability with them.',
      strategyMarkets: 'China or America, family or market: the strategy itself is what shareholders are fighting over.',
      peopleCulture: 'Half the board represents the workforce. Nothing passes without them.',
      esgSustainability: 'European sustainability reporting rules are arriving faster than Rheinfeld\'s data can keep up.',
      geopoliticalMacro: 'Tariffs on €580m of sales, and a proposed pivot to China: this board lives on geopolitics.',
      technologyDigital: 'Precision engineering is increasingly software, and so is the reporting it must now produce.',
      stakeholderComms: 'A family, a works council and an activist fund all want different things, and all have votes.',
    },
  },

  company_meridian: {
    ticker: 'Registered charity',
    chartLabel: 'Income per quarter, £m',
    chartPrefix: '£', chartSuffix: 'm',
    chart: [11.8, 11.6, 11.9, 11.2, 10.9, 10.4, 10.6, 9.9, 9.6, 9.4, 9.7, 9.3],
    chartTicks: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'],
    chartNotes: [
      { at: 3, label: 'Government aid cuts announced' },
      { at: 8, label: 'Finch widens the search for grants' },
    ],
    ownersTitle: 'Where the money comes from',
    owners: [
      { name: 'Institutional donors', pct: 55, flag: 'anchor' },
      { name: 'Trusts and foundations', pct: 20 },
      { name: 'Individual giving', pct: 17 },
      { name: 'Government aid', pct: 8 },
    ],
    facts: [
      { label: 'Registered with', value: 'Charity Commission for England and Wales' },
      { label: 'Governed by', value: 'Charity Governance Code 2025 · Charities Act 2011' },
      { label: 'Chair of Trustees', value: 'The Hon. Patricia Mensah' },
      { label: 'Trustees', value: 'Unpaid, and personally liable' },
    ],
    articles: [
      {
        masthead: 'Development Dispatch',
        when: 'Eight months ago',
        headline: 'Aid cuts leave mid-sized charities hunting for new money',
        standfirst: 'When government funding falls, somebody else\'s priorities fill the gap.',
        byline: 'Sector report',
        body: [
          'Cuts to official development assistance have taken a quarter or more out of some charities\' income in two years. The largest can absorb it. The smallest were never dependent. The squeeze is in the middle.',
          'Meridian Foundation, with income of about £38m, is typical. Its chief executive, Marcus Finch, has said the charity will "diversify its donor base". Programme staff across the sector worry about what donors ask for in return.',
        ],
      },
      {
        masthead: 'The Southwark Gazette',
        when: 'Three months ago',
        headline: 'Local charity says it has reached 2.3 million lives',
        standfirst: 'From one school in rural Kenya to four country programmes.',
        byline: 'Community news',
        body: [
          'Meridian Foundation, based off Borough High Street, marked its latest annual report with a figure its founder calls "humbling": 2.3 million lives reached since 2003.',
          'Dr. Evelyn Osei-Bonsu, who started the charity with a single school-building project and remains a trustee, told supporters the number "belongs to the communities, not to us". The charity now works in health, education and livelihoods.',
        ],
      },
      {
        masthead: 'Third Sector Review',
        when: 'Five weeks ago',
        headline: 'Founders who stay: blessing or burden?',
        standfirst: 'The person who built the charity is not always the person the board can say no to.',
        byline: 'Comment',
        body: [
          'Every sector has them: founders who step down as chief executive and stay on as trustee. At their best they are the organisation\'s memory. At their worst they are a second chief executive nobody appointed.',
          'The Charity Commission\'s guidance is plain that trustees act together and that staff answer to the chief executive. Several mid-sized charities, Meridian Foundation among them, are said to be finding that easier to write down than to live by.',
        ],
      },
    ],
    why: {
      financialOversight: 'Reserves are thin and some money can only be spent on what the donor gave it for.',
      regulatoryLegal: 'The Charity Commission can open an inquiry, suspend trustees and remove them.',
      strategyMarkets: 'Every new grant is a decision about what Meridian is for.',
      peopleCulture: 'A founder on the board and a chief executive under pressure: the hardest problem here is people.',
      esgSustainability: 'This is the mission itself: whether the work really does what the charity says it does.',
      geopoliticalMacro: 'Four country programmes, each exposed to politics the trustees cannot control.',
      technologyDigital: 'Beneficiary data is sensitive, and impact figures are only as good as the systems behind them.',
      stakeholderComms: 'Donors, members, staff and the press all need to believe the same story.',
    },
  },

  company_sfg: {
    ticker: 'SFG · SGX',
    chartLabel: 'Share price, S$',
    chartPrefix: 'S$', chartSuffix: '',
    chart: [9.42, 9.55, 9.61, 9.48, 9.52, 9.37, 8.21, 8.05, 8.19, 7.96, 7.71, 7.84],
    chartTicks: MONTHS,
    chartNotes: [
      { at: 6, label: 'S$340m Vietnam loss announced' },
      { at: 10, label: 'Audit Committee chair resigns' },
    ],
    ownersTitle: 'Who owns it',
    owners: [
      { name: 'Minority institutions', pct: 36 },
      { name: 'Temasek', pct: 34, flag: 'anchor' },
      { name: 'Retail shareholders', pct: 22 },
      { name: 'Other holders', pct: 8 },
    ],
    facts: [
      { label: 'Listed', value: 'Singapore Exchange · Mainboard' },
      { label: 'Governed by', value: 'Code of Corporate Governance · SGX rules · MAS' },
      { label: 'Chair', value: 'Dato\' Lim Boon Kiat, also chairs the Risk Committee' },
      { label: 'Group Chief Executive', value: 'Raymond Tan Chee Wai, six years' },
    ],
    articles: [
      {
        masthead: 'The Straits Ledger',
        when: 'Five months ago',
        headline: 'Straits Financial takes S$340m hit on Vietnam loans',
        standfirst: 'The bank says the problem is contained. The market was less sure.',
        byline: 'By our Banking Correspondent',
        body: [
          'Straits Financial Group has written off S$340m of lending in Vietnam, its largest single credit loss in two decades. The shares fell 12% in a day.',
          'Group chief executive Raymond Tan said the exposure was "identified and ring-fenced". Analysts asked a different question: the loans had been deteriorating for months, so what was the Board Risk Committee looking at? The committee is chaired by the group\'s chairman.',
        ],
      },
      {
        masthead: 'Marina Bay Wire',
        when: 'Two weeks ago',
        headline: 'Audit chair leaves Straits board "for personal reasons"',
        standfirst: 'A bank cannot be without one for long.',
        byline: 'Company news',
        body: [
          'The chair of Straits Financial Group\'s Audit Committee has resigned with immediate effect, the company said in a two-line exchange filing that cited personal reasons.',
          'Listed banks are expected to keep the post filled by an independent director with financial expertise. Straits said its Nominating Committee had "begun the process". The regulator does not comment on individual institutions.',
        ],
      },
      {
        masthead: 'Asia Governance Review',
        when: 'Two months ago',
        headline: 'Nine years and out: Singapore boards meet the tenure cliff',
        standfirst: 'There is no longer a vote that can keep a long-serving director independent.',
        byline: 'Briefing',
        body: [
          'For years a Singapore-listed company could keep calling a director independent after nine years if shareholders approved it in a special two-part vote. That route has closed. Past nine years, a director may stay, but not as an independent.',
          'For boards that leaned on a few trusted veterans, the arithmetic is unforgiving. Straits Financial Group has three directors at or past the limit, a state shareholder holding 34%, and minority investors watching how that vote is used.',
        ],
      },
    ],
    why: {
      financialOversight: 'A bank that has just lost S$340m needs people who can read a loan book.',
      regulatoryLegal: 'The regulator has already written once. In Singapore, the second letter is the one that matters.',
      strategyMarkets: 'Indonesia, digital rivals and a shareholder building a stake: growth is where the risk is.',
      peopleCulture: 'Three directors at or past the nine-year limit, and a chief executive whose pay is under scrutiny.',
      esgSustainability: 'Lenders are now judged on what they finance, and the anchor shareholder has views.',
      geopoliticalMacro: 'This is a regional bank: Vietnam, Indonesia and Malaysia are its balance sheet.',
      technologyDigital: 'Digital banks are taking small-business customers, and the board has little technology depth.',
      stakeholderComms: 'A state shareholder with 34% and minority investors who feel overruled: every message is read twice.',
    },
  },
};
