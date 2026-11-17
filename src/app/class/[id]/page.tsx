'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import AccountShell, { Panel } from '@/components/account/AccountShell';
import { companies } from '@/data/company';
import { classDetail, useSession } from '@/lib/account';

type Detail = Awaited<ReturnType<typeof classDetail>>;
const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** The lecturer's class page: who has joined, who has finished, each debrief. */
export default function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const [d, setD] = useState<Detail | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (session) classDetail(id).then(setD); }, [session, id]);

  if (session === null) {
    return <AccountShell overline="Class" title="Sign in to see this class"><Panel><Link href="/account" className="text-gold underline">Sign in</Link></Panel></AccountShell>;
  }
  if (!d) return <AccountShell overline="Class" title="Loading…"><span /></AccountShell>;
  if (!d.cls || d.cls.lecturer_id !== session?.user.id) {
    return <AccountShell overline="Class" title="Not your class"><Panel><p className="text-sm text-foreground/70">Only the lecturer who created a class can see its results.</p></Panel></AccountShell>;
  }

  const cls = d.cls;
  const name = (uid: string) => d.profiles.find((p) => p.id === uid);
  const finished = new Set(d.results.map((r) => r.user_id));
  const company = companies.find((c) => c.id === cls.company_id)?.name;
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${cls.code}` : '';

  return (
    <AccountShell overline={`Class · code ${cls.code}`} title={cls.name} wide>
      <div className="grid gap-5">
        <Panel>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-3xl font-bold text-foreground">{d.members.length}</p><p className="text-xs text-foreground/50">joined</p></div>
            <div><p className="text-3xl font-bold text-foreground">{finished.size}</p><p className="text-xs text-foreground/50">finished a year</p></div>
            <div><p className="text-3xl font-bold text-foreground">{d.results.length}</p><p className="text-xs text-foreground/50">years played</p></div>
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-5 pt-4 border-t border-card-border">
            <span className="text-xs text-foreground/60">Join link:</span>
            <span className="font-mono text-xs text-gold break-all">{joinUrl}</span>
            <button onClick={async () => { try { await navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }}
              className="text-xs border border-gold/40 text-gold rounded px-3 py-1 cursor-pointer hover:bg-gold/10">{copied ? 'Copied' : 'Copy'}</button>
            {company && <span className="text-xs text-foreground/60 ml-auto">Company set: {company}</span>}
          </div>
        </Panel>

        <Panel>
          <p className="bc-overline text-gold mb-3">Results</p>
          {d.results.length === 0 ? (
            <p className="text-sm text-foreground/60">No finished years yet. Results appear here as students complete them.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-foreground/50 border-b border-card-border">
                    <th className="py-2 pr-3 font-semibold">Student</th>
                    <th className="py-2 pr-3 font-semibold">Company</th>
                    <th className="py-2 pr-3 font-semibold text-right">Governance health</th>
                    <th className="py-2 pr-3 font-semibold text-right">Final index</th>
                    <th className="py-2 pr-3 font-semibold text-right">Finished</th>
                    <th className="py-2 font-semibold" />
                  </tr>
                </thead>
                <tbody>
                  {d.results.map((r) => {
                    const p = name(r.user_id);
                    return (
                      <tr key={r.id} className="border-b border-card-border/60">
                        <td className="py-2.5 pr-3"><span className="font-semibold">{p?.display_name || 'Unknown'}</span><span className="block text-xs text-foreground/45">{p?.email}</span></td>
                        <td className="py-2.5 pr-3">{r.company_name}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{r.governance_health ?? '–'}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{r.final_sv != null ? Number(r.final_sv).toFixed(1) : '–'}</td>
                        <td className="py-2.5 pr-3 text-right text-foreground/60">{date(r.created_at)}</td>
                        <td className="py-2.5 text-right"><Link href={`/result/${r.id}`} className="text-gold text-xs font-semibold">Debrief &rarr;</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel>
          <p className="bc-overline text-gold mb-3">Joined, not yet finished</p>
          {d.members.filter((m) => !finished.has(m.user_id)).length === 0 ? (
            <p className="text-sm text-foreground/60">Everyone who has joined has finished at least one year.</p>
          ) : (
            <ul className="grid gap-1 text-sm">
              {d.members.filter((m) => !finished.has(m.user_id)).map((m) => (
                <li key={m.user_id} className="flex justify-between border-b border-card-border/50 py-1.5">
                  <span>{name(m.user_id)?.display_name || 'Unknown'} <span className="text-xs text-foreground/45">{name(m.user_id)?.email}</span></span>
                  <span className="text-xs text-foreground/45">joined {date(m.joined_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </AccountShell>
  );
}
