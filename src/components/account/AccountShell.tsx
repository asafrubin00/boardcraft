import Link from 'next/link';
import type { ReactNode } from 'react';
import SiteFooter from '@/components/SiteFooter';

/** Page frame for the account, class and privacy pages: dark glass, one column. */
export default function AccountShell({ overline, title, children, wide = false }: { overline: string; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center px-5 py-12">
      <div className={`w-full ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
        <div className="flex items-center justify-between mb-8">
          <Link href="/play" className="text-xs text-foreground/50 hover:text-gold transition-colors">&larr; Back to the game</Link>
          <Link href="/account" className="text-xs text-foreground/50 hover:text-gold transition-colors">Account</Link>
        </div>
        <p className="bc-overline text-gold mb-1">{overline}</p>
        <h1 className="text-3xl font-narrative font-bold text-foreground mb-8">{title}</h1>
        {children}
        <SiteFooter className="mt-14 pb-2" />
      </div>
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`bg-card-bg border border-card-border rounded-xl p-5 md:p-6 ${className}`}>{children}</section>;
}

export const inputCls =
  'w-full bg-navy/60 border border-card-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-gold';
