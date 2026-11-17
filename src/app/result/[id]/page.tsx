'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AccountShell, { Panel } from '@/components/account/AccountShell';
import DebriefReport from '@/components/debrief/DebriefReport';
import { loadResult, useSession } from '@/lib/account';

/** A saved year's Governance Debrief, for the player or their lecturer. */
export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const router = useRouter();
  const [res, setRes] = useState<Awaited<ReturnType<typeof loadResult>> | 'none' | null>(null);

  useEffect(() => { if (session) loadResult(id).then((r) => setRes(r ?? 'none')); }, [session, id]);

  if (session === null || res === 'none') {
    return (
      <AccountShell overline="Debrief" title="Not available">
        <Panel><p className="text-sm text-foreground/70">This debrief belongs to another account, or you are not signed in.</p></Panel>
      </AccountShell>
    );
  }
  if (!res) return <AccountShell overline="Debrief" title="Loading…"><span /></AccountShell>;
  return (
    <div className="min-h-screen bg-navy">
      <DebriefReport gameState={res.game_state} agmVotes={res.agm_votes ?? undefined} onClose={() => router.back()} />
    </div>
  );
}
