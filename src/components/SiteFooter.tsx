import Link from 'next/link';

/**
 * Global copyright footer.
 * Pass a `className` to control positioning — the component itself is unstyled/unpositioned.
 * The text size and opacity are fixed so all instances look identical.
 */
export default function SiteFooter({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-foreground/25 text-xs whitespace-nowrap pointer-events-none ${className}`}>
      <span>© 2025 Asaf Rubin. All rights reserved.</span>
      <span className="text-foreground/15">·</span>
      <Link href="/terms" className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2">
        Terms of Use
      </Link>
    </div>
  );
}
