'use client';

interface HarwickLogoProps {
  size?: number;
  className?: string;
}

/**
 * Abstract mark for Harwick Energy PLC - a stylised flame/droplet
 * suggesting energy and the North Sea. Gold on navy.
 */
export default function HarwickLogo({ size = 48, className = '' }: HarwickLogoProps) {
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
      {/* Flame / oil-drop shape - gold */}
      <path
        d="M32 12
           C32 12 20 28 20 38
           C20 44.627 25.373 50 32 50
           C38.627 50 44 44.627 44 38
           C44 28 32 12 32 12Z"
        fill="#C8960C"
        fillOpacity="0.9"
      />
      {/* Inner wave highlight */}
      <path
        d="M26 38
           C26 38 28 34 32 34
           C36 34 38 38 38 38
           C38 42.418 35.314 46 32 46
           C28.686 46 26 42.418 26 38Z"
        fill="#0D1B2A"
        fillOpacity="0.5"
      />
      {/* Small wave crest inside droplet */}
      <path
        d="M28 39 Q30 36 32 39 Q34 42 36 39"
        stroke="#C8960C"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
