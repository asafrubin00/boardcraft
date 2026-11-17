'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { GameState } from '@/types/game';
import type { AgmResolutionVote } from '@/engine/agm';
import { saveResult, setPendingResult, useSession } from '@/lib/account';

/**
 * On the year-end screen: signed in, the year is saved to the account (and
 * the class being played for) once; signed out, it is kept in the browser
 * and saved as soon as the player signs in.
 */
export default function SaveToAccount({ gameState, agmVotes, gcEarned }: { gameState: GameState; agmVotes?: AgmResolutionVote[]; gcEarned: number | null }) {
  const session = useSession();
  const done = useRef(false);
  const [status, setStatus] = useState<{ kind: 'saving' | 'saved' | 'error' | 'signedout'; text: string } | null>(null);

  useEffect(() => {
    if (session === undefined || done.current) return;
    done.current = true;
    if (!session) {
      setPendingResult(gameState, agmVotes, gcEarned);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot on mount
      setStatus({ kind: 'signedout', text: 'Not signed in.' });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot on mount
    setStatus({ kind: 'saving', text: 'Saving this year to your account…' });
    saveResult(gameState, agmVotes, gcEarned).then((r) =>
      setStatus(r.ok
        ? { kind: 'saved', text: r.className ? `Saved to your account and shared with ${r.className}.` : 'Saved to your account.' }
        : { kind: 'error', text: `Could not save: ${r.error}` })
    );
  }, [session, gameState, agmVotes, gcEarned]);

  if (!status) return null;
  const color = status.kind === 'saved' ? 'var(--success)' : status.kind === 'error' ? 'var(--error)' : 'var(--gold)';
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap rounded-lg border px-4 py-2.5 mb-6 text-sm"
      style={{ borderColor: color, background: 'rgba(0,0,0,0.22)' }}>
      {status.kind === 'signedout' ? (
        <>
          <span className="text-foreground/80">Want to keep this year and its debrief, or share it with a class?</span>
          <Link href="/account" className="text-gold font-semibold whitespace-nowrap">Sign in to save &rarr;</Link>
        </>
      ) : (
        <>
          <span style={{ color }}>{status.text}</span>
          {status.kind === 'saved' && <Link href="/account" className="text-xs text-foreground/60 hover:text-gold whitespace-nowrap">Your account &rarr;</Link>}
        </>
      )}
    </div>
  );
}
