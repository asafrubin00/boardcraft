'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Company } from '@/types/game';

interface BoardGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

// ── UK Corporate Governance Code guidance ──
const UK_GUIDE = {
  title: 'UK Corporate Governance Code',
  sections: [
    {
      heading: 'Board Composition',
      items: [
        'At least half the board (excluding the Chair) should be independent NEDs.',
        'Chair should be independent on appointment.',
        'Chair and CEO roles should be separated.',
        'The board should not be too small (typically 6–12 directors for FTSE companies).',
      ],
    },
    {
      heading: 'Key Roles',
      items: [
        'Chair: leads the board, sets agenda, ensures effective governance.',
        'SID (Senior Independent Director): sounding board for the Chair; available to shareholders.',
        'Audit Chair: leads the Audit Committee; should have recent, relevant financial experience.',
        'Rem Chair: leads the Remuneration Committee; determines executive pay policy.',
        'Nom Chair: leads the Nomination Committee; oversees board appointments and succession.',
      ],
    },
    {
      heading: 'Committees',
      items: [
        'Audit Committee: reviews financial reporting, internal controls, and external audit.',
        'Remuneration Committee: sets executive pay to promote long-term success.',
        'Nomination Committee: oversees board composition, diversity, and succession planning.',
        'Optional: Energy Transition, ESG/CSRD, Strategy committees for specialist oversight.',
      ],
    },
    {
      heading: 'Independence',
      items: [
        'Independence is impaired by: long tenure (>9 years), executive connections, cross-shareholdings.',
        'Proxy advisers (ISS/Glass Lewis) flag independence concerns; this impacts AGM votes.',
        'At least two independent NEDs should serve on each principal committee.',
      ],
    },
  ],
};

// ── US SEC / NYSE / NASDAQ guidance ──
const US_GUIDE = {
  title: 'US Board Governance (NYSE/NASDAQ)',
  sections: [
    {
      heading: 'Board Composition',
      items: [
        'A majority of directors must be independent under NYSE/NASDAQ rules.',
        'Combined Chair/CEO is common in US; an independent LID (Lead Independent Director) is then required.',
        'Typical board size: 7–14 directors.',
      ],
    },
    {
      heading: 'Key Roles',
      items: [
        'LID (Lead Independent Director): chairs executive sessions of independent directors; liaises with shareholders.',
        'Audit Committee Chair: requires financial expertise; oversees SEC filing integrity.',
        'Compensation Committee Chair: sets executive compensation; aligns with long-term shareholder value.',
        'Nominating/Governance Committee Chair: oversees director recruitment and board effectiveness.',
      ],
    },
    {
      heading: 'Committees',
      items: [
        'Audit Committee: required by NYSE/NASDAQ; all members must be independent.',
        'Compensation Committee: required; all members must be independent.',
        'Nominating/Governance Committee: required; all members must be independent.',
        'Optional: Risk, Technology, ESG committees increasingly common at S&P 500 companies.',
      ],
    },
    {
      heading: 'Independence & Proxy',
      items: [
        'Independence standards are stricter post-Sarbanes-Oxley (SOX) and Dodd-Frank.',
        'ISS and Glass Lewis are highly influential; low proxy ratings trigger "withhold" recommendations.',
        'Say-on-Pay votes allow shareholders to vote on executive compensation annually.',
      ],
    },
  ],
};

// ── EU (German/DCGK two-tier) guidance ──
const EU_GUIDE = {
  title: 'EU Two-Tier Board (German DCGK)',
  sections: [
    {
      heading: 'Two-Tier Structure',
      items: [
        'Supervisory Board (Aufsichtsrat): oversees management, approves major decisions.',
        'Management Board (Vorstand): executes day-to-day operations; separate from Supervisory Board.',
        'Chair of Supervisory Board is equivalent to Chair in the UK/US unitary board.',
        'Supervisory Board members are called "SB Members" — not NEDs.',
      ],
    },
    {
      heading: 'Codetermination (Mitbestimmung)',
      items: [
        'For companies with >2,000 employees: half of Supervisory Board seats are worker representatives.',
        'Worker reps are elected by employees and trade unions; they cannot be removed by shareholders.',
        'Worker reps have equal voting rights but the Chair has a casting vote in deadlock.',
        'Worker reps bring operational insight but can constrain certain restructuring decisions.',
      ],
    },
    {
      heading: 'Key Roles',
      items: [
        'SB Chair: leads Supervisory Board; elected by shareholder representatives on the board.',
        'SB Members: shareholder-side members equivalent to independent NEDs.',
        'Audit Committee Chair: oversees financial reporting; must be independent and financially expert.',
        'CSRD Committee Chair: manages EU Corporate Sustainability Reporting Directive compliance.',
      ],
    },
    {
      heading: 'DCGK & EU Sustainability',
      items: [
        'German Corporate Governance Code (DCGK): comply-or-explain basis, similar to UK CGC.',
        'CSRD: mandatory ESG/sustainability reporting from FY 2024 for large listed EU companies.',
        'Meridian (activist investor pressure): common in DAX companies; watch for escalating demands.',
        'Diversity: DCGK targets ≥30% gender diversity on Supervisory Boards.',
      ],
    },
  ],
};

// ── UK Charity (CIO) — Charity Governance Code guidance ──
const CHARITY_GUIDE = {
  title: 'Charity Governance Code (UK)',
  sections: [
    {
      heading: 'Board Composition',
      items: [
        'Minimum 3 trustees required by law; 5–12 recommended by the Charity Governance Code.',
        'The Chair leads the board and is elected by fellow trustees — not appointed externally.',
        'A Deputy Chair may support the Chair and provide continuity during transitions.',
        'All trustees serve voluntarily; remuneration of trustees is not permitted except in exceptional circumstances with Charity Commission approval.',
      ],
    },
    {
      heading: 'Key Roles',
      items: [
        'Chair of Trustees: leads the board, manages trustee relationships, and acts as ambassador.',
        'Deputy Chair: supports the Chair and acts when the Chair is unavailable.',
        'Finance & Risk Committee Chair: oversees financial controls, reserves policy, and solvency obligations — must have strong financial expertise.',
        'People & Culture Committee Chair: oversees staff wellbeing, safeguarding, and trustee diversity — requires strong People & Culture credentials.',
        'Programmes & Impact Committee Chair: scrutinises programme delivery and mission alignment — must have relevant sector knowledge.',
      ],
    },
    {
      heading: 'Committees',
      items: [
        'Finance & Risk Committee: reviews management accounts, reserves, investment policy, and risk register.',
        'People & Culture Committee: oversees HR policy, safeguarding, and trustee recruitment.',
        'Programmes & Impact Committee: evaluates programme effectiveness and mission alignment.',
        'All committee chairs should be independent trustees free from executive conflicts.',
      ],
    },
    {
      heading: 'Independence & Tenure',
      items: [
        'Independence: trustees must act in the charity\'s best interests, not as representatives of funders or donors.',
        'Tenure: the Charity Governance Code recommends no trustee serves more than 9 years without review.',
        'Founder Syndrome: boards dominated by the founding chair risk poor scrutiny and mission drift.',
        'The Charity Commission can investigate and intervene where governance is seriously weak.',
      ],
    },
  ],
};

function getGuide(jurisdiction: string, companyId?: string) {
  if (companyId === 'company_meridian') return CHARITY_GUIDE;
  if (jurisdiction === 'US') return US_GUIDE;
  if (jurisdiction === 'EU') return EU_GUIDE;
  return UK_GUIDE;
}

export default function BoardGuideModal({ isOpen, onClose, company }: BoardGuideModalProps) {
  const guide = getGuide(company.jurisdiction, company.id);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0D2237',
              border: '1px solid rgba(200,150,12,0.35)',
              borderRadius: 14,
              width: '100%',
              maxWidth: 680,
              maxHeight: '85dvh',
              overflowY: 'auto',
              margin: '0 16px',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid rgba(200,150,12,0.2)',
              position: 'sticky', top: 0,
              background: '#0D2237', zIndex: 1,
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#B08A30', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
                  Board Guide — {company.name}
                </div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#C8960C', fontFamily: 'Georgia, serif', margin: 0 }}>
                  {guide.title}
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(232,228,220,0.4)', fontSize: 22, lineHeight: 1,
                  padding: '0 4px',
                }}
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '16px 20px 24px' }}>
              {guide.sections.map((section) => (
                <div key={section.heading} style={{ marginBottom: 22 }}>
                  <h3 style={{
                    fontSize: 13, fontWeight: 700, color: '#C8960C',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    marginBottom: 10, borderBottom: '1px solid rgba(200,150,12,0.2)',
                    paddingBottom: 5,
                  }}>
                    {section.heading}
                  </h3>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        marginBottom: 8, fontSize: 13, color: 'rgba(232,228,220,0.8)',
                        lineHeight: 1.55,
                      }}>
                        <span style={{ color: '#C8960C', flexShrink: 0, marginTop: 1 }}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Footer hint */}
              <div style={{
                marginTop: 8, paddingTop: 12,
                borderTop: '1px solid rgba(200,150,12,0.15)',
                fontSize: 11, color: 'rgba(232,228,220,0.4)', fontStyle: 'italic',
              }}>
                Governance rules in BoardCraft are simplified for educational purposes. Real-world requirements vary by listing rules, company size, and shareholder agreements.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
