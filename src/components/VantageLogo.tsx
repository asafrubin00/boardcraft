'use client';

interface VantageLogoProps {
  size?: number;
  className?: string;
}

/**
 * Abstract mark for Vantage Consumer Brands - a stylised "V" chevron
 * with a rising bar-chart motif suggesting consumer market leadership.
 * Gold on navy, matching BoardCraft visual identity.
 */
export default function VantageLogo({ size = 48, className = '' }: VantageLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle - navy background */}
      <circle cx="32" cy="32" r="30" fill="#0D1B2A" stroke="#C8960C" strokeWidth="1.5" />
      {/* Bold V chevron */}
      <path
        d="M18 18 L32 44 L46 18"
        stroke="#C8960C"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
      {/* Rising bars at bottom - consumer growth motif */}
      <rect x="22" y="46" width="4" height="4" rx="0.5" fill="#C8960C" opacity="0.4" />
      <rect x="28" y="44" width="4" height="6" rx="0.5" fill="#C8960C" opacity="0.55" />
      <rect x="34" y="42" width="4" height="8" rx="0.5" fill="#C8960C" opacity="0.7" />
      <rect x="40" y="39" width="4" height="11" rx="0.5" fill="#C8960C" opacity="0.85" />
    </svg>
  );
}
