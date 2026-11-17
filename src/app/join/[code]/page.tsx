'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountShell, { Panel } from '@/components/account/AccountShell';
import { joinClass, useSession } from '@/lib/account';

/** The link a lecturer shares: /join/AB12CD. Signed in, it joins at once. */
export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const session = useSession();
  const router = useRouter();
  const [state, setState] = useState<{ name?: string; error?: string } | null>(null);

  useEffect(() => {
    if (session === undefined) return;
    if (!session) { router.replace(`/account?join=${encodeURIComponent(code)}`); return; }
    joinClass(code).then((r) => setState(r));
  }, [session, code, router]);

  return (
    <AccountShell overline="Join a class" title={state?.name ? `You're in: ${state.name}` : 'Joining your class…'}>
      <Panel>
        {state?.error ? (
          <p className="text-sm text-error">{state.error}</p>
        ) : state?.name ? (
          <div className="grid gap-4">
            <p className="text-sm text-foreground/80 leading-relaxed">
              Every year you finish while signed in now goes to <span className="text-gold font-semibold">{state.name}</span>, where your lecturer can read your debrief.
            </p>
            <button onClick={() => router.push('/play')} className="bg-gold text-navy-dark font-bold rounded-md py-2.5 cursor-pointer">Start playing</button>
          </div>
        ) : (
          <p className="text-sm text-foreground/50">One moment…</p>
        )}
      </Panel>
    </AccountShell>
  );
}
