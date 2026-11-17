'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AccountShell, { Panel, inputCls } from '@/components/account/AccountShell';
import { companies } from '@/data/company';
import {
  type ClassRow, type Profile, type ResultRow, type Role,
  createClass, getActiveClass, getProfile, joinClass, myClasses, myResults,
  saveResult, setActiveClass, signIn, signOut, signUp, takePendingResult, useSession,
} from '@/lib/account';

const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name ?? null;
const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function SignInForm({ joinCode }: { joinCode: string | null }) {
  const [mode, setMode] = useState<'in' | 'up'>(joinCode ? 'up' : 'in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'up' && !agree) return setError('Please confirm you have read the privacy notice.');
    if (mode === 'up' && name.trim().length < 2) return setError('Please give your name, as your lecturer would know it.');
    setBusy(true);
    const err = mode === 'in' ? await signIn(email.trim(), password) : await signUp(email.trim(), password, name.trim(), role);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <Panel>
      <div className="flex gap-1 mb-5 p-1 rounded-lg bg-navy/60 border border-card-border w-fit">
        {(['in', 'up'] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setError(null); }}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold cursor-pointer transition-colors ${mode === m ? 'bg-gold/15 text-gold' : 'text-foreground/50 hover:text-foreground'}`}>
            {m === 'in' ? 'Sign in' : 'Create an account'}
          </button>
        ))}
      </div>
      {joinCode && (
        <p className="text-sm text-foreground/75 mb-4">
          Sign in or create an account to join class <span className="font-mono text-gold">{joinCode}</span>.
        </p>
      )}
      <form onSubmit={submit} className="grid gap-3">
        {mode === 'up' && (
          <>
            <label className="grid gap-1 text-xs text-foreground/60">Your name
              <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
            </label>
            <div className="grid gap-1 text-xs text-foreground/60">I am
              <div className="flex gap-2">
                {(['student', 'lecturer'] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-md border text-sm font-semibold cursor-pointer transition-colors ${role === r ? 'border-gold text-gold bg-gold/10' : 'border-card-border text-foreground/60 hover:text-foreground'}`}>
                    {r === 'student' ? 'A student or player' : 'A lecturer'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        <label className="grid gap-1 text-xs text-foreground/60">Email
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="grid gap-1 text-xs text-foreground/60">Password {mode === 'up' && <span className="text-foreground/40">(at least 6 characters)</span>}
          <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={6} required />
        </label>
        {mode === 'up' && (
          <label className="flex items-start gap-2 text-xs text-foreground/70 mt-1 cursor-pointer">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 accent-[#C9A227]" />
            <span>I have read the <Link href="/privacy" className="text-gold underline underline-offset-2">privacy notice</Link>: what is kept, who sees it, and how to have it deleted.</span>
          </label>
        )}
        {error && <p className="text-sm text-error">{error}</p>}
        <button type="submit" disabled={busy} className="bg-gold text-navy-dark font-bold rounded-md py-2.5 mt-1 cursor-pointer disabled:opacity-60">
          {busy ? 'One moment…' : mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        {mode === 'in' && (
          <p className="text-xs text-foreground/45">Forgotten your password? Ask the site owner to reset it for now; email resets are coming.</p>
        )}
      </form>
    </Panel>
  );
}

function SignedIn({ userId, joinCode }: { userId: string; joinCode: string | null }) {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [active, setActive] = useState(getActiveClass());
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [className, setClassName] = useState('');
  const [classCompany, setClassCompany] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [p, c, r] = await Promise.all([getProfile(userId), myClasses(), myResults()]);
    setProfile(p); setClasses(c); setResults(r);
  }, [userId]);

  useEffect(() => {
    (async () => {
      // A year finished before signing in: save it now.
      const pending = takePendingResult();
      if (pending) {
        const res = await saveResult(pending.gameState, pending.agmVotes, pending.gcEarned);
        setNote(res.ok ? `Your last game (${pending.gameState.company.name}) is saved to your account${res.className ? ` and class ${res.className}` : ''}.` : `Your last game could not be saved: ${res.error}`);
      }
      if (joinCode) {
        const j = await joinClass(joinCode);
        if (j.error) setError(j.error);
        else { setActive({ id: j.id!, name: j.name! }); setNote(`You have joined ${j.name}. Every year you finish now goes to that class.`); }
        router.replace('/account');
      }
      await refresh();
    })();
  }, [joinCode, refresh, router]);

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    const j = await joinClass(code);
    if (j.error) return setError(j.error);
    setActive({ id: j.id!, name: j.name! }); setCode('');
    setNote(`You have joined ${j.name}. Every year you finish now goes to that class.`);
    refresh();
  };
  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (className.trim().length < 2) return setError('Give the class a name.');
    const r = await createClass(className.trim(), classCompany || null);
    if (r.error) return setError(r.error);
    setClassName(''); setClassCompany('');
    setNote(`Class created. Share its link or code with your students.`);
    refresh();
  };
  const joinUrl = (c: ClassRow) => `${window.location.origin}/join/${c.code}`;
  const copy = async (c: ClassRow) => {
    try { await navigator.clipboard.writeText(joinUrl(c)); setCopied(c.id); setTimeout(() => setCopied(null), 1600); } catch {}
  };

  if (!profile) return <p className="text-sm text-foreground/50">Loading your account…</p>;
  const isLecturer = profile.role === 'lecturer';
  const taught = classes.filter((c) => c.lecturer_id === userId);
  const joined = classes.filter((c) => c.lecturer_id !== userId);

  return (
    <div className="grid gap-5">
      <Panel>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-lg font-semibold text-foreground">{profile.display_name || profile.email}</p>
            <p className="text-xs text-foreground/50">{profile.email} · {isLecturer ? 'Lecturer' : 'Student'}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/play" className="bg-gold text-navy-dark font-bold rounded-md px-4 py-2 text-sm">Play</Link>
            <button onClick={async () => { await signOut(); router.refresh(); }} className="border border-card-border text-foreground/70 rounded-md px-4 py-2 text-sm cursor-pointer hover:text-foreground">Sign out</button>
          </div>
        </div>
        {note && <p className="text-sm text-success mt-4">{note}</p>}
        {error && <p className="text-sm text-error mt-4">{error}</p>}
      </Panel>

      {isLecturer && (
        <Panel>
          <p className="bc-overline text-gold mb-3">Your classes</p>
          {taught.length === 0 && <p className="text-sm text-foreground/60 mb-4">No classes yet. Create one, then send students its link.</p>}
          <div className="grid gap-2 mb-5">
            {taught.map((c) => (
              <div key={c.id} className="flex items-center gap-3 flex-wrap border border-card-border rounded-lg px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/class/${c.id}`} className="font-semibold text-foreground hover:text-gold">{c.name}</Link>
                  <p className="text-xs text-foreground/50">Code <span className="font-mono text-gold">{c.code}</span>{companyName(c.company_id) ? ` · ${companyName(c.company_id)}` : ''} · created {date(c.created_at)}</p>
                </div>
                <button onClick={() => copy(c)} className="text-xs border border-gold/40 text-gold rounded px-3 py-1.5 cursor-pointer hover:bg-gold/10">{copied === c.id ? 'Link copied' : 'Copy join link'}</button>
                <Link href={`/class/${c.id}`} className="text-xs text-foreground/60 hover:text-gold">Open &rarr;</Link>
              </div>
            ))}
          </div>
          <form onSubmit={onCreate} className="grid md:grid-cols-[1fr_200px_auto] gap-2">
            <input className={inputCls} placeholder="Class name, e.g. Board Effectiveness, Jan 2027" value={className} onChange={(e) => setClassName(e.target.value)} />
            <select className={inputCls} value={classCompany} onChange={(e) => setClassCompany(e.target.value)}>
              <option value="">Any company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="bg-gold text-navy-dark font-bold rounded-md px-4 py-2 text-sm cursor-pointer">Create class</button>
          </form>
        </Panel>
      )}

      <Panel>
        <p className="bc-overline text-gold mb-3">{isLecturer ? 'Classes you have joined' : 'Your class'}</p>
        {active ? (
          <p className="text-sm text-foreground/80 mb-3">
            You are playing for <span className="font-semibold text-gold">{active.name}</span>: every year you finish is shared with its lecturer.{' '}
            <button onClick={() => { setActiveClass(null); setActive(null); }} className="text-xs underline underline-offset-2 text-foreground/50 cursor-pointer hover:text-foreground">Stop sharing</button>
          </p>
        ) : (
          <p className="text-sm text-foreground/60 mb-3">Not playing for a class. Your results stay on your account only.</p>
        )}
        {joined.length > 0 && (
          <div className="grid gap-1.5 mb-4">
            {joined.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border border-card-border rounded-md px-3 py-2">
                <span>{c.name}{companyName(c.company_id) ? <span className="text-foreground/50"> · play {companyName(c.company_id)}</span> : null}</span>
                {active?.id !== c.id && (
                  <button onClick={() => { setActiveClass({ id: c.id, name: c.name }); setActive({ id: c.id, name: c.name }); }} className="text-xs text-gold cursor-pointer">Play for this class</button>
                )}
              </div>
            ))}
          </div>
        )}
        <form onSubmit={onJoin} className="flex gap-2">
          <input className={`${inputCls} font-mono uppercase`} placeholder="Class code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={12} />
          <button type="submit" className="border border-gold/50 text-gold rounded-md px-4 text-sm font-semibold cursor-pointer hover:bg-gold/10 whitespace-nowrap">Join class</button>
        </form>
      </Panel>

      <Panel>
        <p className="bc-overline text-gold mb-3">Your finished years</p>
        {results.filter((r) => r.user_id === userId).length === 0 ? (
          <p className="text-sm text-foreground/60">None yet. Finish a year signed in and it appears here, with its debrief.</p>
        ) : (
          <div className="grid gap-1.5">
            {results.filter((r) => r.user_id === userId).map((r) => (
              <Link key={r.id} href={`/result/${r.id}`} className="flex items-center justify-between gap-3 text-sm border border-card-border rounded-md px-3 py-2 hover:border-gold/60">
                <span className="font-semibold">{r.company_name}</span>
                <span className="text-xs text-foreground/55">Health {r.governance_health ?? '–'} · {date(r.created_at)} · Debrief &rarr;</span>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function AccountInner() {
  const session = useSession();
  const params = useSearchParams();
  const joinCode = params.get('join');
  return (
    <AccountShell overline="BoardCraft" title={session ? 'Your account' : 'Sign in to save your results'}>
      {session === undefined ? (
        <p className="text-sm text-foreground/50">One moment…</p>
      ) : session ? (
        <SignedIn userId={session.user.id} joinCode={joinCode} />
      ) : (
        <>
          <p className="text-sm text-foreground/70 mb-5 leading-relaxed">
            An account is optional. It keeps every year you finish, with its debrief, and lets you join a class so your lecturer can see your results.
          </p>
          <SignInForm joinCode={joinCode} />
        </>
      )}
    </AccountShell>
  );
}

export default function AccountPage() {
  return <Suspense><AccountInner /></Suspense>;
}
