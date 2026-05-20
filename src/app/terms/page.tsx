import Link from 'next/link';

export const metadata = {
  title: 'Terms of Use — BoardCraft',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
        {/* Back link */}
        <Link
          href="/"
          className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors mb-10 inline-block"
        >
          &larr; Back to BoardCraft
        </Link>

        {/* Header */}
        <h1 className="text-3xl font-narrative font-bold text-gold mb-8">
          Terms of Use
        </h1>

        {/* Body */}
        <div className="space-y-5 text-foreground/75 text-sm leading-relaxed">
          <p>
            BoardCraft and all associated content — including game scenarios, company
            profiles, governance frameworks, and written copy — are the proprietary work
            of Asaf Rubin (© 2025). All rights reserved.
          </p>
          <p>
            This game is made available for personal, non-commercial use only. No part
            of BoardCraft may be reproduced, distributed, licensed, or used for
            commercial purposes without the express prior written permission of the
            author.
          </p>
          <p>
            For licensing or partnership enquiries, contact:{' '}
            <a
              href="mailto:rubin.asaf01@gmail.com"
              className="text-gold/80 hover:text-gold transition-colors underline underline-offset-2"
            >
              rubin.asaf01@gmail.com
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
