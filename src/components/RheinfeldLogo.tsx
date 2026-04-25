'use client';

interface RheinfeldLogoProps {
  size?: number;
  className?: string;
}

/**
 * Rheinfeld AG logo — angular "R" mark with precision engineering motif.
 * Gold angular letterform on deep navy background, hexagonal frame.
 */
export default function RheinfeldLogo({ size = 48, className = '' }: RheinfeldLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hexagonal background frame */}
      <polygon
        points="32,2 58,17 58,47 32,62 6,47 6,17"
        fill="#0D1B2A"
        stroke="#C8960C"
        strokeWidth="1.5"
      />
      {/* Inner hex ring — precision mark */}
      <polygon
        points="32,8 52,19.5 52,44.5 32,56 12,44.5 12,19.5"
        fill="none"
        stroke="#C8960C"
        strokeWidth="0.4"
        opacity="0.35"
      />
      {/* Angular R letterform */}
      {/* Vertical spine */}
      <rect x="19" y="16" width="4" height="32" fill="#C8960C" />
      {/* Upper bowl top bar */}
      <rect x="19" y="16" width="18" height="3.5" fill="#C8960C" />
      {/* Upper bowl curve — angular step */}
      <rect x="33" y="19.5" width="4" height="4" fill="#C8960C" />
      <rect x="37" y="23.5" width="3.5" height="5" fill="#C8960C" />
      {/* Mid-bar joining bowl to spine */}
      <rect x="19" y="28.5" width="22" height="3.5" fill="#C8960C" />
      {/* Diagonal leg — bottom right */}
      <polygon points="25,32 29,32 43,48 39,48" fill="#C8960C" />
    </svg>
  );
}
