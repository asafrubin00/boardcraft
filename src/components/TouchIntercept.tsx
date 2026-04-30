'use client';

import { useState } from 'react';

export default function TouchIntercept() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = 'https://boardcraft-eight.vercel.app';
    const shareData = { title: 'BoardCraft', text: 'A governance strategy game built for the boardroom.', url };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); return; } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={styles.wrapper}>
        <div style={styles.ringOuter} />
        <div style={styles.ringInner} />

        <div style={styles.logoLockup}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="1" y="1" width="34" height="34" rx="2" stroke="#C8960C" strokeWidth="1"/>
            <rect x="7" y="14" width="6" height="6" rx="1" fill="#C8960C" opacity="0.9"/>
            <rect x="15" y="10" width="6" height="6" rx="1" fill="#C8960C"/>
            <rect x="23" y="14" width="6" height="6" rx="1" fill="#C8960C" opacity="0.9"/>
            <rect x="11" y="22" width="6" height="6" rx="1" fill="#C8960C" opacity="0.6"/>
            <rect x="19" y="22" width="6" height="6" rx="1" fill="#C8960C" opacity="0.6"/>
          </svg>
          <span style={styles.logoText}>BoardCraft</span>
        </div>

        <div style={styles.divider} />

        <p style={styles.headline}>
          A governance strategy game<br />built for <em style={{ color: '#C8960C' }}>the boardroom</em>
        </p>

        <p style={styles.body}>
          BoardCraft is designed for the full desktop experience. Construct boards, navigate crises, and face proxy season across real governance frameworks.
        </p>

        <div style={styles.features}>
          {[
            'Seat directors across FTSE and NYSE-listed companies',
            'Navigate live governance events and activist pressure',
            'Face the AGM and the proxy advisers',
          ].map((f) => (
            <div key={f} style={styles.feature}>
              <div style={styles.dot} />
              <span style={styles.featureText}>{f}</span>
            </div>
          ))}
        </div>

        <div style={styles.ctaGroup}>
          <a href="https://boardcraft-eight.vercel.app" style={styles.btnPrimary}>
            Open on desktop
          </a>
          <button onClick={handleShare} style={styles.btnSecondary}>
            {copied ? 'Link copied' : 'Send link to myself'}
          </button>
        </div>

        <span style={styles.footnote}>Governance Capital · Proxy Season · FRC · NYSE</span>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: '#0D2540',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1.75rem',
    boxSizing: 'border-box',
    fontFamily: "'Source Sans 3', 'Calibri', sans-serif",
    position: 'relative',
    overflow: 'hidden',
    animation: 'fadeUp 0.6s ease forwards',
  },
  ringOuter: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: '50%',
    border: '1px solid rgba(200,150,12,0.12)',
    pointerEvents: 'none',
  },
  ringInner: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: '50%',
    border: '1px solid rgba(200,150,12,0.08)',
    pointerEvents: 'none',
  },
  logoLockup: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: '2.5rem',
  },
  logoText: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    fontWeight: 600,
    color: '#C8960C',
    letterSpacing: '0.02em',
  },
  divider: {
    width: 40,
    height: 1,
    background: '#C8960C',
    marginBottom: '2rem',
  },
  headline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 26,
    fontWeight: 400,
    color: '#F0E8D6',
    textAlign: 'center',
    lineHeight: 1.35,
    margin: '0 0 1.25rem',
  },
  body: {
    fontSize: 15,
    fontWeight: 300,
    color: 'rgba(240,232,214,0.65)',
    textAlign: 'center',
    lineHeight: 1.7,
    margin: '0 0 2.5rem',
    maxWidth: 300,
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginBottom: '2.5rem',
    width: '100%',
    maxWidth: 300,
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#C8960C',
    marginTop: 7,
    flexShrink: 0,
  },
  featureText: {
    fontSize: 13,
    fontWeight: 300,
    color: 'rgba(240,232,214,0.6)',
    lineHeight: 1.5,
  },
  ctaGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  btnPrimary: {
    width: '100%',
    padding: '14px 20px',
    background: '#C8960C',
    color: '#0D2540',
    fontFamily: "'Source Sans 3', 'Calibri', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    border: 'none',
    borderRadius: 2,
    cursor: 'pointer',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'block',
  },
  btnSecondary: {
    fontSize: 13,
    color: 'rgba(240,232,214,0.45)',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid rgba(240,232,214,0.2)',
    paddingBottom: 1,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.03em',
  },
  footnote: {
    position: 'absolute',
    bottom: '1.5rem',
    fontSize: 11,
    color: 'rgba(240,232,214,0.2)',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
};
