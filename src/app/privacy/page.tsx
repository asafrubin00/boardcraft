import AccountShell, { Panel } from '@/components/account/AccountShell';

export const metadata = { title: 'Privacy — BoardCraft' };

export default function PrivacyPage() {
  return (
    <AccountShell overline="Privacy notice" title="What BoardCraft keeps about you">
      <Panel>
        <div className="space-y-5 text-sm leading-relaxed text-foreground/80">
          <p>
            You can play BoardCraft without an account. Nothing about you leaves your browser unless you create one.
            Games played without an account are kept only in your browser&rsquo;s own storage.
          </p>
          <div>
            <p className="bc-overline text-gold mb-2">If you create an account, we keep</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>your email address and a password (stored only in scrambled form; nobody can read it);</li>
              <li>the name you give and whether you signed up as a student or a lecturer;</li>
              <li>the classes you create or join;</li>
              <li>each year you finish: the company, your scores, your decisions and your debrief.</li>
            </ul>
          </div>
          <div>
            <p className="bc-overline text-gold mb-2">Why, and who sees it</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To keep your results so you can come back to them.</li>
              <li>If you join a class, so the lecturer who runs it can see your name, email and results for that class. No other student sees them.</li>
              <li>It is not sold, shared for marketing, or used to build profiles of you. There are no adverts and no tracking cookies.</li>
            </ul>
          </div>
          <div>
            <p className="bc-overline text-gold mb-2">Where it is kept, and for how long</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>In a database run by Supabase in its London (UK) data centre.</li>
              <li>Until you ask for your account to be deleted, which removes your profile, memberships and results.</li>
            </ul>
          </div>
          <div>
            <p className="bc-overline text-gold mb-2">Your rights</p>
            <p>
              Under UK data protection law you can ask to see, correct or delete what is held about you. BoardCraft is run by
              Asaf Rubin, who is responsible for this data. Email{' '}
              <a href="mailto:rubin.asaf01@gmail.com" className="text-gold underline underline-offset-2">rubin.asaf01@gmail.com</a>{' '}
              and it will be dealt with within a month. You can also complain to the Information Commissioner&rsquo;s Office (ico.org.uk).
            </p>
          </div>
          <p className="text-xs text-foreground/50">Last updated 17 November 2026.</p>
        </div>
      </Panel>
    </AccountShell>
  );
}
