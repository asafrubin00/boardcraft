'use client';

/**
 * TabletRotateGate
 *
 * Always renders children AND a fixed overlay div.  The overlay is hidden by
 * default and made visible only via the CSS media query in globals.css:
 *   @media (orientation: portrait) and (min-width: 600px) and (max-width: 1023px)
 *
 * This component must be placed OUTSIDE <TouchGate> in the layout so it
 * renders regardless of pointer type — ensuring the rotate prompt appears even
 * on coarse-pointer tablets that would otherwise hit TouchIntercept.
 */
export default function TabletRotateGate({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}

      <div className="bcraft-tablet-rotate-gate">
        <div className="bcraft-tablet-rotate-icon">
          <svg
            viewBox="0 0 80 80"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width="80"
            height="80"
          >
            {/* Tablet body (portrait orientation) */}
            <rect x="22" y="10" width="36" height="50" rx="5" stroke="#C8960C" strokeWidth="2.5" fill="none" />
            <circle cx="40" cy="54" r="2.5" fill="#C8960C" opacity="0.6" />
            {/* Rotation arc */}
            <path
              d="M62 32 A24 24 0 0 1 40 64"
              stroke="#C8960C"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrow head */}
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
    </>
  );
}
