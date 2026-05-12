'use client';

import { useState, useEffect } from 'react';
import TouchIntercept from './TouchIntercept';

/**
 * TouchGate — renders children on non-touch devices (laptops/desktops) and
 * <TouchIntercept /> on touch devices (phones/tablets).
 *
 * Detection runs client-side after mount so SSR is unaffected.
 * Initial render passes children through (desktop assumption) to avoid a
 * blank flash; the swap to <TouchIntercept /> happens in the first effect,
 * which fires before the browser paints the second frame on touch devices.
 */
export default function TouchGate({ children }: { children: React.ReactNode }) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Require BOTH coarse pointer AND a small screen (<1024px).
    // This prevents false positives on touchscreen laptops, Surface devices,
    // and any desktop browser that reports coarse pointer unexpectedly.
    // No real desktop/laptop satisfies both conditions simultaneously.
    const touch = window.matchMedia('(pointer: coarse) and (max-width: 1023px)').matches;
    setIsTouchDevice(touch);
  }, []);

  if (isTouchDevice) return <TouchIntercept />;
  return <>{children}</>;
}
