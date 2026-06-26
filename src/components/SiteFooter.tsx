import Link from 'next/link';

/**
 * Global copyright footer.
 * Pass `className` to control positioning.
 * Pass `vertical` to stack the two lines (copyright above, Terms of Use below) —
 * used on pages where the horizontal layout would clash with content at the same edge.
 */
export default function SiteFooter({
  className = '',
  vertical = false,
}: {
  className?: string;
  vertical?: boolean;
}) {
  if (vertical) {
    return (
      <div className={`flex flex-col items-end text-foreground/25 text-xs pointer-events-none ${className}`}>
        <span className="whitespace-nowrap">© 2025 <a href="https://asafrubin00.github.io/asaf-rubin-website/" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2">Asaf Rubin</a>. All rights reserved.</span>
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-foreground/15">·</span>
          <Link
            href="/terms"
            className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2"
          >
            Terms of Use
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-3 text-foreground/25 text-xs whitespace-nowrap pointer-events-none ${className}`}>
      <span>© 2025 <a href="https://asafrubin00.github.io/asaf-rubin-website/" target="_blank" rel="noopener noreferrer" className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2">Asaf Rubin</a>. All rights reserved.</span>
      <span className="text-foreground/15">·</span>
      <Link
        href="/terms"
        className="pointer-events-auto hover:text-foreground/50 transition-colors underline underline-offset-2"
      >
        Terms of Use
      </Link>
    </div>
  );
}
