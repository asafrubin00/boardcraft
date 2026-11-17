// ── Lore: who you are, who hired you, and who you need to know ──
//
// The player is the Board Adviser: an outsider retained for one year to
// rebuild the board and steer it through what is coming. Each company's
// letter is written by whoever brought the adviser in.

export interface LorePerson {
  name: string;
  role: string;
  line: string;
  /** Director id, so the portrait matches the one at the board table. */
  id?: string;
  /** An organisation rather than a person. */
  org?: boolean;
}

export interface CompanyLore {
  city: string;
  country: string;
  lat: number;
  lon: number;
  /** Who signed the letter of engagement. */
  from: string;
  fromRole: string;
  letter: string[];
  people: LorePerson[];
  /** One line for the world map. */
  hook: string;
}

export const PLAYER_ROLE = 'Board Adviser';

export const YOUR_JOB: { title: string; line: string }[] = [
  { title: 'Build the board', line: 'Choose who sits at the table, inside the fee budget and the local governance code.' },
  { title: 'Steer it through the year', line: 'Each turn a paper lands on your desk. Recommend a course and choose which directors lead on it.' },
  { title: 'Face the owners', line: 'Halfway through the year the board answers for itself at the annual meeting. Then you finish what you started.' },
];

export const LORE: Record<string, CompanyLore> = {
  company_harwick: {
    city: 'Aberdeen', country: 'Scotland', lat: 57.15, lon: -2.09,
    from: 'Dame Helen Forsyth', fromRole: 'Chair, retiring at the AGM',
    letter: [
      'I retire at the AGM and I do not intend to leave a mess behind me.',
      'We have four directors, nobody lined up for my chair, an empty Remuneration Committee and a chief executive who has had ten years of getting his own way. An activist fund has started buying our shares.',
      'I have asked the board to retain you for one year. Build me a board that can stand up to Marcus, to Greenvale and to the North Sea.',
    ],
    people: [
      { name: 'Marcus Blaine', role: 'Chief Executive', line: 'Ten years in the job. Used to winning the argument.' },
      { name: 'Priya Sundaram', role: 'Chief Financial Officer', line: 'Very good, and other companies know it.' },
      { id: 'dir_08_crane', name: 'Geoffrey Crane', role: 'Non-executive director', line: 'Twelve years on the board. The proxy advisers want him gone.' },
      { org: true, name: 'Greenvale Capital', role: 'Activist investor', line: 'Run by Nathaniel Hart. Building a stake. Has not said what it wants yet.' },
    ],
    hook: 'A North Sea oil company with an empty chair and an activist at the door.',
  },
  company_vantage: {
    city: 'Chicago', country: 'United States', lat: 41.88, lon: -87.63,
    from: 'Robert Kellerman', fromRole: 'Lead Independent Director',
    letter: [
      'Sandra Okafor is both Chair and Chief Executive, and she likes it that way. Our largest shareholders do not.',
      'Apex Capital has taken a position. The FDA is asking about our labels. One of our own directors has a contract with a supplier that she should have told us about.',
      'The independent directors have retained you without asking Sandra\'s permission. She knows. Be ready for that.',
    ],
    people: [
      { name: 'Sandra Okafor', role: 'Chair and Chief Executive', line: 'Paid $14.2m last year. Will defend the combined role to the end.' },
      { id: 'vdir_02_nguyen', name: 'Patricia Nguyen', role: 'Director', line: 'Has a consulting contract with a Vantage supplier.' },
      { name: 'Marcus Chen', role: 'Chief Financial Officer', line: 'Wants reform. Will not say so in front of Sandra.' },
      { org: true, name: 'Apex Capital', role: 'Activist hedge fund', line: 'Run by Marcus Adler. Owns 5.3% and has done this before.' },
    ],
    hook: 'An American food giant run by one person wearing two hats.',
  },
  company_rheinfeld: {
    city: 'Düsseldorf', country: 'Germany', lat: 51.23, lon: 6.77,
    from: 'Heinrich Rheinfeld', fromRole: 'Chairman of the Supervisory Board',
    letter: [
      'I did not ask for you. The institutional shareholders made your appointment a condition of their patience, and I have agreed. For one year.',
      'You will find five worker representatives who cannot be moved, a family that owns a third of the shares, and a Supervisory Board that has served this company well since before you were qualified.',
      'Advise. I will decide.',
    ],
    people: [
      { id: 'rdir_heinrich', name: 'Heinrich Rheinfeld', role: 'Chairman, aged 71', line: 'Built the company. Has not accepted that he no longer runs it.' },
      { name: 'Klaus Reinhart', role: 'Chief Executive', line: 'Wants reform, and is careful never to say so to Heinrich.' },
      { id: 'rdir_w_koch', name: 'Hans-Werner Koch', role: 'Worker representative, IG Metall', line: 'Speaks for the five seats you cannot change.' },
      { org: true, name: 'Meridian Capital', role: 'Shareholder, 12%', line: 'Led by Dr. Felix Hartung. Wants an independent review of the whole strategy.' },
    ],
    hook: 'A German family firm that went public and never quite let go.',
  },
  company_meridian: {
    city: 'London', country: 'England', lat: 51.5, lon: -0.09,
    from: 'The Hon. Patricia Mensah', fromRole: 'Chair of Trustees',
    letter: [
      'We are a charity. Nobody on this board is paid, and every one of us is personally liable.',
      'Our founder still sits as a trustee and still behaves as though she runs the place. Our chief executive is chasing grants that pull us away from what we exist to do. I suspect one of my trustees has a conflict he has not declared.',
      'I step down within the year. Help me hand over a board that deserves the name.',
    ],
    people: [
      { id: 'mdir_osei_bonsu', name: 'Dr. Evelyn Osei-Bonsu', role: 'Founder and trustee', line: 'Built Meridian from one school in Kenya. Cannot let it go.' },
      { name: 'Marcus Finch', role: 'Chief Executive', line: 'Eighteen months in, under pressure to bring in money.' },
      { id: 'mdir_cavendish', name: 'Robert Cavendish', role: 'Trustee, chairs Finance and Risk', line: 'Careful with the accounts. Less careful about what he declares.' },
      { org: true, name: 'The Charity Commission', role: 'Regulator', line: 'Watching, and it has powers.' },
    ],
    hook: 'A development charity whose founder cannot let go.',
  },
  company_sfg: {
    city: 'Singapore', country: 'Singapore', lat: 1.28, lon: 103.85,
    from: 'Eric Png Wei Liang', fromRole: 'Non-executive director, Temasek nominee',
    letter: [
      'The regulator has written to us privately about the Vietnam loss. Our Audit Committee chair has just resigned.',
      'Three of our directors have served longer than the rules now like, and there is an allegation about the chief executive that nobody has wanted to open.',
      'Temasek expects this to be put right quietly and properly. In Singapore those are the same thing.',
    ],
    people: [
      { id: 'sfgdir_01_lim', name: 'Dato\' Lim Boon Kiat', role: 'Chair', line: 'A former regulator. Also chairs the Risk Committee, which is the problem.' },
      { name: 'Raymond Tan Chee Wai', role: 'Group Chief Executive', line: 'Ambitious. A whistleblower has named his family trust.' },
      { id: 'sfgdir_02_soong', name: 'Helena Soong Hui Ling', role: 'Senior Independent Director', line: 'Ten years on the board. One year past the limit.' },
      { org: true, name: 'Monetary Authority of Singapore', role: 'Regulator', line: 'Has sent one private letter. The next will not be private.' },
    ],
    hook: 'A Singapore bank with the regulator reading over its shoulder.',
  },
};

/** Sealed files: shown on the map, not yet playable. */
export const SEALED_PINS = [
  { id: 'locked:Valdorian National Grid', name: 'Valdorian National Grid', lat: 9, lon: -38, line: 'Location classified. File sealed.' },
];
