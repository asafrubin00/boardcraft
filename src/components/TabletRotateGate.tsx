'use client';

import { useState, useEffect } from 'react';

/**
 * TabletRotateGate
 *
 * Shows a full-screen "Rotate your device" overlay when the viewport is
 * portrait AND between 600–1023 px wide (tablet portrait).
 * Uses JS window dimensions so it works reliably in Chrome DevTools
 * device emulation as well as on real devices.
 *
 * Must be placed OUTSIDE <TouchGate> so it renders regardless of pointer type.
 */
export default function TabletRotateGate({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setShow(h > w && w <= 1023);
    };

    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  return (
    <>
      {children}

      {show && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: '#0B1628',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          {/* Pulsing rotate icon */}
          <div style={{ animation: 'bcraft-rotate-pulse 2.4s ease-in-out infinite' }}>
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <rect x="22" y="10" width="36" height="50" rx="5" stroke="#C8960C" strokeWidth="2.5" fill="none" />
              <circle cx="40" cy="54" r="2.5" fill="#C8960C" opacity="0.6" />
              <path d="M62 32 A24 24 0 0 1 40 64" stroke="#C8960C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <polyline points="60,40 62,32 70,34" stroke="#C8960C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>

          <h1 style={{ color: '#C8960C', fontSize: '1.5rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em' }}>
            Rotate your device
          </h1>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 340, margin: 0 }}>
            BoardCraft is designed for landscape mode.
            <br />
            Please rotate your device to continue.
          </p>

          <p style={{ marginTop: 24, color: 'rgba(200,150,12,0.35)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.25em' }}>
            BOARDCRAFT
          </p>
        </div>
      )}
    </>
  );
}
