'use client';

import HarwickLogo from './HarwickLogo';
import VantageLogo from './VantageLogo';
import RheinfeldLogo from './RheinfeldLogo';

interface CompanyLogoProps {
  companyId: string;
  size?: number;
  className?: string;
}

/**
 * Generic company logo dispatcher.
 * Returns the appropriate logo SVG based on company ID.
 * Falls back to a generic initial-based mark for unknown companies.
 */
export default function CompanyLogo({ companyId, size = 48, className = '' }: CompanyLogoProps) {
  switch (companyId) {
    case 'harwick_energy':
    case 'company_harwick':
      return <HarwickLogo size={size} className={className} />;
    case 'company_vantage':
      return <VantageLogo size={size} className={className} />;
    case 'company_rheinfeld':
      return <RheinfeldLogo size={size} className={className} />;
    case 'company_sfg':
      // Straits Financial Group — two currents passing through a strait
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="32" cy="32" r="30" fill="#0D1B2A" stroke="#C8960C" strokeWidth="1.5" />
          <path d="M14 26 C22 18, 30 18, 38 26 S 50 34, 52 28" stroke="#C8960C" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 38 C18 32, 26 32, 32 38 S 44 46, 50 38" stroke="#C8960C" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <circle cx="32" cy="32" r="22" stroke="#C8960C" strokeWidth="0.5" opacity="0.35" />
        </svg>
      );
    case 'company_meridian':
      // Meridian Foundation — a globe crossed by its prime meridian
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="32" cy="32" r="30" fill="#0D1B2A" stroke="#C8960C" strokeWidth="1.5" />
          <circle cx="32" cy="32" r="17" stroke="#4C9A8E" strokeWidth="2" />
          <ellipse cx="32" cy="32" rx="8" ry="17" stroke="#4C9A8E" strokeWidth="1.5" opacity="0.75" />
          <path d="M15 32 H49" stroke="#4C9A8E" strokeWidth="1.5" opacity="0.75" />
          <path d="M32 10 V54" stroke="#C8960C" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default:
      // Generic fallback: gold circle with company initial
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <circle cx="32" cy="32" r="30" fill="#0D1B2A" stroke="#C8960C" strokeWidth="1.5" />
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fill="#C8960C"
            fontSize="24"
            fontFamily="Georgia, serif"
            fontWeight="bold"
          >
            {companyId.charAt(0).toUpperCase()}
          </text>
        </svg>
      );
  }
}
