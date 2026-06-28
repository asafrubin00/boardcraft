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
      // SGX lion's head motif — gold crescent and initials on navy
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <circle cx="32" cy="32" r="30" fill="#0A1628" stroke="#C8960C" strokeWidth="1.5" />
          <text x="32" y="28" textAnchor="middle" fill="#C8960C" fontSize="13" fontFamily="Georgia, serif" fontWeight="bold" letterSpacing="1">SFG</text>
          <text x="32" y="43" textAnchor="middle" fill="#8BA0B8" fontSize="7.5" fontFamily="Georgia, serif" letterSpacing="0.5">SGX · MAS</text>
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
