'use client';

import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { GameState } from '@/types/game';
import type { AgmResolutionVote } from '@/engine/agm';
import { supabase } from './supabase';

// ── Accounts and classroom mode ──
// The game never needs an account: everything here is optional and sits on
// top of the localStorage game. Signed in, a finished year is saved to the
// player's account and, if they joined a class, shown to that lecturer.

export type Role = 'student' | 'lecturer';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string;
  role: Role;
}

export interface ClassRow {
  id: string;
  name: string;
  code: string;
  lecturer_id: string;
  company_id: string | null;
  created_at: string;
}

export interface ResultRow {
  id: string;
  user_id: string;
  class_id: string | null;
  company_id: string;
  company_name: string;
  final_sv: number | null;
  governance_health: number | null;
  gc_earned: number | null;
  events_resolved: number | null;
  created_at: string;
}

const ACTIVE_CLASS_KEY = 'boardcraft_active_class';
const PENDING_RESULT_KEY = 'boardcraft_pending_result';

/** The class the player is currently playing for (set when they join one). */
export function getActiveClass(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CLASS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setActiveClass(c: { id: string; name: string } | null) {
  try {
    if (c) localStorage.setItem(ACTIVE_CLASS_KEY, JSON.stringify(c));
    else localStorage.removeItem(ACTIVE_CLASS_KEY);
  } catch {}
}

/** Live session; undefined while it is still being read. */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

function friendly(message: string): string {
  if (/Invalid login credentials/i.test(message)) return 'That email and password do not match an account.';
  if (/already registered/i.test(message)) return 'There is already an account with that email. Sign in instead.';
  if (/Password should be/i.test(message)) return 'Passwords need at least 6 characters.';
  if (/Email not confirmed/i.test(message)) return 'This account has not been confirmed yet.';
  if (/rate limit/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  return message;
}

export async function signUp(email: string, password: string, displayName: string, role: Role): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Not available here.';
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName, role } },
  });
  if (error) return friendly(error.message);
  if (!data.session) return 'Account created, but it needs confirming before you can sign in.';
  return null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const sb = supabase();
  if (!sb) return 'Not available here.';
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return error ? friendly(error.message) : null;
}

export async function signOut() {
  setActiveClass(null);
  await supabase()?.auth.signOut();
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase()!.from('profiles').select('id,email,display_name,role').eq('id', userId).maybeSingle();
  return (data as Profile) ?? null;
}

export async function myClasses(): Promise<ClassRow[]> {
  const { data } = await supabase()!.from('classes').select('*').order('created_at', { ascending: false });
  return (data as ClassRow[]) ?? [];
}

export async function createClass(name: string, companyId: string | null): Promise<{ row?: ClassRow; error?: string }> {
  const { data, error } = await supabase()!.from('classes').insert({ name, company_id: companyId }).select('*').single();
  if (error) return { error: /row-level security/i.test(error.message) ? 'Only lecturer accounts can create classes.' : error.message };
  return { row: data as ClassRow };
}

export async function joinClass(code: string): Promise<{ id?: string; name?: string; error?: string }> {
  const { data, error } = await supabase()!.rpc('join_class', { p_code: code });
  if (error) return { error: /No class/i.test(error.message) ? 'No class has that code. Check it with your lecturer.' : error.message };
  const row = (data as { id: string; name: string }[])[0];
  setActiveClass({ id: row.id, name: row.name });
  return row;
}

export async function classDetail(classId: string) {
  const sb = supabase()!;
  const [cls, members, results] = await Promise.all([
    sb.from('classes').select('*').eq('id', classId).maybeSingle(),
    sb.from('class_members').select('user_id,joined_at').eq('class_id', classId),
    sb.from('game_results')
      .select('id,user_id,class_id,company_id,company_name,final_sv,governance_health,gc_earned,events_resolved,created_at')
      .eq('class_id', classId)
      .order('created_at', { ascending: false }),
  ]);
  const ids = (members.data ?? []).map((m) => m.user_id);
  const profiles = ids.length
    ? ((await sb.from('profiles').select('id,email,display_name,role').in('id', ids)).data as Profile[]) ?? []
    : [];
  return {
    cls: (cls.data as ClassRow) ?? null,
    members: (members.data ?? []) as { user_id: string; joined_at: string }[],
    results: (results.data as ResultRow[]) ?? [],
    profiles,
  };
}

export async function myResults(): Promise<ResultRow[]> {
  const { data } = await supabase()!
    .from('game_results')
    .select('id,user_id,class_id,company_id,company_name,final_sv,governance_health,gc_earned,events_resolved,created_at')
    .order('created_at', { ascending: false });
  return (data as ResultRow[]) ?? [];
}

export async function loadResult(id: string): Promise<{ game_state: GameState; agm_votes: AgmResolutionVote[] | null; user_id: string } | null> {
  const { data } = await supabase()!.from('game_results').select('game_state,agm_votes,user_id').eq('id', id).maybeSingle();
  return (data as { game_state: GameState; agm_votes: AgmResolutionVote[] | null; user_id: string }) ?? null;
}

/** Save a finished year to the signed-in account (and the active class). */
export async function saveResult(
  gameState: GameState,
  agmVotes: AgmResolutionVote[] | undefined,
  gcEarned: number | null
): Promise<{ ok: boolean; className?: string; error?: string }> {
  const sb = supabase();
  if (!sb) return { ok: false, error: 'Not available here.' };
  const active = getActiveClass();
  const row = {
    class_id: active?.id ?? null,
    company_id: gameState.company.id,
    company_name: gameState.company.name,
    final_sv: gameState.svIndex,
    governance_health: Math.round(gameState.governanceHealth),
    gc_earned: gcEarned,
    events_resolved: gameState.resolvedEvents.length,
    game_state: gameState,
    agm_votes: agmVotes ?? null,
  };
  let { error } = await sb.from('game_results').insert(row);
  // Removed from the class since joining it: keep the result on the account.
  if (error && active && /row-level security/i.test(error.message)) {
    setActiveClass(null);
    ({ error } = await sb.from('game_results').insert({ ...row, class_id: null }));
    if (!error) return { ok: true };
  }
  if (error) return { ok: false, error: error.message };
  return { ok: true, className: active?.name };
}

/** A year finished while signed out, kept so it can be saved after sign-in. */
export function setPendingResult(gameState: GameState, agmVotes: AgmResolutionVote[] | undefined, gcEarned: number | null) {
  try {
    localStorage.setItem(PENDING_RESULT_KEY, JSON.stringify({ gameState, agmVotes, gcEarned, at: Date.now() }));
  } catch {}
}
export function takePendingResult(): { gameState: GameState; agmVotes?: AgmResolutionVote[]; gcEarned: number | null } | null {
  try {
    const raw = localStorage.getItem(PENDING_RESULT_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_RESULT_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
export function hasPendingResult(): boolean {
  try { return !!localStorage.getItem(PENDING_RESULT_KEY); } catch { return false; }
}
