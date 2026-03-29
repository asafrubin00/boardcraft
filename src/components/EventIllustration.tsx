'use client';

import { useState } from 'react';

interface EventIllustrationProps {
  type?: string;
  className?: string;
}

export default function EventIllustration({ type, className = '' }: EventIllustrationProps) {
  const [hasError, setHasError] = useState(false);

  if (!type || type === 'default' || hasError) return null;

  return (
    <img
      src={`/images/events/${type}.jpg`}
      alt={type.replace(/-/g, ' ')}
      width={200}
      height={130}
      className={`rounded-lg object-cover ${className}`}
      style={{ width: 200, height: 130 }}
      onError={() => setHasError(true)}
    />
  );
}
