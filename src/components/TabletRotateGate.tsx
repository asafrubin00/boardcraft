'use client';

/**
 * TabletRotateGate
 *
 * Renders children normally, but overlays a full-screen "Rotate your device"
 * prompt when the viewport is in portrait orientation and between 600–1023px
 * wide (i.e. tablet portrait).  The overlay is handled entirely by CSS so
 * there is no hydration mismatch and no JS resize listener needed.
 *
 * Phones (<600px):  handled separately by TouchGate / TouchIntercept.
 * Tablet landscape: overlay hidden — desktop layout renders fine.
 * Desktop (≥1024px): overlay hidden — always fine.
 */
export default function TabletRotateGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      {/* Overlay — visible only via the media query below */}
      <div className="bcraft-tablet-rotate-gate">
        {/* Rotating tablet SVG */}
        <div className="bcraft-tablet-rotate-icon">
          <svg
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
          >
            {/* Tablet body (portrait) */}
            <rect x="22" y="10" width="36" height="50" rx="5" stroke="#C8960C" strokeWidth="2.5" fill="none" />
            <circle cx="40" cy="54" r="2.5" fill="#C8960C" opacity="0.6" />
            {/* Rotation arc arrow */}
            <path
              d="M62 32 A24 24 0 0 1 40 64"
              stroke="#C8960C"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <polyline
              points="60,40 62,32 70,34"
              stroke="#C8960C"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        <h1 className="bcraft-tablet-rotate-title">Rotate your device</h1>
        <p className="bcraft-tablet-rotate-subtitle">
          BoardCraft is designed for landscape mode on tablets.
          <br />
          Please rotate your device to continue.
        </p>

        <p className="bcraft-tablet-rotate-brand">BOARDCRAFT</p>
      </div>

      <style>{`
        .bcraft-tablet-rotate-gate {
          display: none;
        }

        @media (orientation: portrait) and (min-width: 600px) and (max-width: 1023px) {
          .bcraft-tablet-rotate-gate {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            position: fixed;
            inset: 0;
            z-index: 9999;
            background-color: #0B1628;
            padding: 40px;
            text-align: center;
          }
        }

        .bcraft-tablet-rotate-icon {
          animation: bcraft-rotate-pulse 2.4s ease-in-out infinite;
        }

        @keyframes bcraft-rotate-pulse {
          0%, 100% { transform: rotate(0deg); opacity: 1; }
          40%       { transform: rotate(15deg); opacity: 0.85; }
          80%       { transform: rotate(-5deg); opacity: 1; }
        }

        .bcraft-tablet-rotate-title {
          color: #C8960C;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin: 0;
        }

        .bcraft-tablet-rotate-subtitle {
          color: rgba(255,255,255,0.55);
          font-size: 0.95rem;
          line-height: 1.6;
          max-width: 340px;
          margin: 0;
        }

        .bcraft-tablet-rotate-brand {
          margin-top: 24px;
          color: rgba(200,150,12,0.35);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.25em;
        }
      `}</style>
    </>
  );
}
