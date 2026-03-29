'use client';

/**
 * Deterministic SVG portrait generator for directors.
 * Uses the director ID as a seed to produce a unique but consistent
 * abstract geometric portrait — no photos, no emoji, no unicode.
 */

interface DirectorPortraitProps {
  directorId: string;
  size?: number; // px, default 64
  className?: string;
}

// Simple deterministic hash from string → array of numbers 0-1
function hashSeed(id: string): number[] {
  const values: number[] = [];
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  // Generate 12 pseudo-random values
  for (let i = 0; i < 12; i++) {
    h = Math.imul(h, 0x5bd1e995);
    h ^= h >>> 15;
    values.push(((h >>> 0) % 1000) / 1000);
  }
  return values;
}

// Palette — muted professional tones
const SKIN_TONES = [
  '#F5D0A9', '#E8B88A', '#D4956B', '#C07B56',
  '#A66B4F', '#8D5B3E', '#704830', '#553622',
];

const HAIR_COLORS = [
  '#2C1810', '#4A3728', '#6B4423', '#8B6914',
  '#A0522D', '#708090', '#C0C0C0', '#E8E8E8',
];

const ACCENT_COLORS = [
  '#1B3A5C', '#2D4A3E', '#4A2D3E', '#3E3A2D',
  '#2D3E4A', '#4A3E2D', '#3A2D4A', '#2D4A4A',
];

function pickFrom<T>(arr: T[], v: number): T {
  return arr[Math.floor(v * arr.length)];
}

export default function DirectorPortrait({
  directorId,
  size = 64,
  className = '',
}: DirectorPortraitProps) {
  const s = hashSeed(directorId);

  const skinTone = pickFrom(SKIN_TONES, s[0]);
  const hairColor = pickFrom(HAIR_COLORS, s[1]);
  const accentColor = pickFrom(ACCENT_COLORS, s[2]);

  // Face shape variations
  const faceWidth = 28 + s[3] * 8;   // 28-36
  const faceHeight = 32 + s[4] * 8;  // 32-40
  const faceY = 26 + s[5] * 4;       // 26-30

  // Hair style seed
  const hairStyle = Math.floor(s[6] * 5); // 0-4
  const hasGlasses = s[7] > 0.65;

  // Shoulder width
  const shoulderW = 36 + s[8] * 12; // 36-48

  // Eye position
  const eyeY = faceY - 2 + s[9] * 2;
  const eyeSpacing = 6 + s[10] * 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="40" fill={accentColor} opacity="0.3" />
      <circle cx="40" cy="40" r="38" fill="#0D1B2A" />

      {/* Shoulders / torso */}
      <ellipse
        cx="40"
        cy="72"
        rx={shoulderW / 2}
        ry="14"
        fill={accentColor}
      />
      {/* Collar detail */}
      <path
        d={`M ${40 - shoulderW * 0.15} 64 L 40 70 L ${40 + shoulderW * 0.15} 64`}
        fill="none"
        stroke={skinTone}
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Neck */}
      <rect x="36" y={faceY + faceHeight / 2 - 2} width="8" height="10" rx="3" fill={skinTone} />

      {/* Face */}
      <ellipse
        cx="40"
        cy={faceY}
        rx={faceWidth / 2}
        ry={faceHeight / 2}
        fill={skinTone}
      />

      {/* Hair - different styles */}
      {hairStyle === 0 && (
        // Short cropped
        <path
          d={`M ${40 - faceWidth / 2 - 1} ${faceY - faceHeight / 2 + 4}
              Q 40 ${faceY - faceHeight / 2 - 6} ${40 + faceWidth / 2 + 1} ${faceY - faceHeight / 2 + 4}
              Q ${40 + faceWidth / 2 + 2} ${faceY - 4} ${40 + faceWidth / 2} ${faceY - 2}
              L ${40 - faceWidth / 2} ${faceY - 2}
              Q ${40 - faceWidth / 2 - 2} ${faceY - 4} ${40 - faceWidth / 2 - 1} ${faceY - faceHeight / 2 + 4}`}
          fill={hairColor}
        />
      )}
      {hairStyle === 1 && (
        // Swept back
        <ellipse
          cx="40"
          cy={faceY - faceHeight / 2 + 2}
          rx={faceWidth / 2 + 3}
          ry={faceHeight / 4}
          fill={hairColor}
        />
      )}
      {hairStyle === 2 && (
        // Parted
        <>
          <ellipse
            cx="40"
            cy={faceY - faceHeight / 2 + 3}
            rx={faceWidth / 2 + 2}
            ry={faceHeight / 4 + 1}
            fill={hairColor}
          />
          <line
            x1="38"
            y1={faceY - faceHeight / 2 - 2}
            x2="36"
            y2={faceY - faceHeight / 2 + 8}
            stroke={skinTone}
            strokeWidth="1"
            opacity="0.3"
          />
        </>
      )}
      {hairStyle === 3 && (
        // Longer, covering ears
        <path
          d={`M ${40 - faceWidth / 2 - 3} ${faceY + 2}
              Q ${40 - faceWidth / 2 - 4} ${faceY - faceHeight / 2 - 4} 40 ${faceY - faceHeight / 2 - 5}
              Q ${40 + faceWidth / 2 + 4} ${faceY - faceHeight / 2 - 4} ${40 + faceWidth / 2 + 3} ${faceY + 2}
              Q ${40 + faceWidth / 2 + 1} ${faceY - 2} ${40 + faceWidth / 2 - 1} ${faceY - 4}
              L ${40 - faceWidth / 2 + 1} ${faceY - 4}
              Q ${40 - faceWidth / 2 - 1} ${faceY - 2} ${40 - faceWidth / 2 - 3} ${faceY + 2}`}
          fill={hairColor}
        />
      )}
      {hairStyle === 4 && (
        // Receding / minimal
        <path
          d={`M ${40 - faceWidth / 2 + 2} ${faceY - faceHeight / 2 + 6}
              Q ${40 - 4} ${faceY - faceHeight / 2 - 3} ${40 + 4} ${faceY - faceHeight / 2 - 3}
              Q ${40 + faceWidth / 2 - 2} ${faceY - faceHeight / 2 + 2} ${40 + faceWidth / 2 - 2} ${faceY - faceHeight / 2 + 6}`}
          fill={hairColor}
          opacity="0.7"
        />
      )}

      {/* Eyes */}
      <ellipse cx={40 - eyeSpacing} cy={eyeY} rx="2.5" ry="1.8" fill="white" />
      <ellipse cx={40 + eyeSpacing} cy={eyeY} rx="2.5" ry="1.8" fill="white" />
      <circle cx={40 - eyeSpacing} cy={eyeY} r="1.2" fill="#1a1a2e" />
      <circle cx={40 + eyeSpacing} cy={eyeY} r="1.2" fill="#1a1a2e" />

      {/* Eyebrows */}
      <line
        x1={40 - eyeSpacing - 2.5}
        y1={eyeY - 3.5}
        x2={40 - eyeSpacing + 2.5}
        y2={eyeY - 4 + s[11] * 1.5}
        stroke={hairColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1={40 + eyeSpacing - 2.5}
        y1={eyeY - 4 + s[11] * 1.5}
        x2={40 + eyeSpacing + 2.5}
        y2={eyeY - 3.5}
        stroke={hairColor}
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Glasses */}
      {hasGlasses && (
        <>
          <circle
            cx={40 - eyeSpacing}
            cy={eyeY}
            r="4.5"
            fill="none"
            stroke={hairColor}
            strokeWidth="0.8"
            opacity="0.6"
          />
          <circle
            cx={40 + eyeSpacing}
            cy={eyeY}
            r="4.5"
            fill="none"
            stroke={hairColor}
            strokeWidth="0.8"
            opacity="0.6"
          />
          <line
            x1={40 - eyeSpacing + 4.5}
            y1={eyeY}
            x2={40 + eyeSpacing - 4.5}
            y2={eyeY}
            stroke={hairColor}
            strokeWidth="0.6"
            opacity="0.6"
          />
        </>
      )}

      {/* Nose */}
      <path
        d={`M 40 ${eyeY + 2} Q 41.5 ${eyeY + 6} 40 ${eyeY + 7}`}
        fill="none"
        stroke={hairColor}
        strokeWidth="0.6"
        opacity="0.25"
      />

      {/* Mouth */}
      <path
        d={`M ${40 - 3.5} ${faceY + faceHeight / 4 - 1} Q 40 ${faceY + faceHeight / 4 + 1} ${40 + 3.5} ${faceY + faceHeight / 4 - 1}`}
        fill="none"
        stroke={hairColor}
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* Rim highlight */}
      <circle
        cx="40"
        cy="40"
        r="38"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}
