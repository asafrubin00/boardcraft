# CLAUDE.md — BoardCraft

Orientation for a fresh session. Read [docs/ASSESSMENT.md](docs/ASSESSMENT.md) (product audit + technical roadmap) and [docs/BUSINESS_PLAN.md](docs/BUSINESS_PLAN.md) for the full picture; this file is the quick map.

## What it is

BoardCraft is a corporate governance strategy game — "fantasy football for corporate governance." You build a company board under budget + compliance constraints, then play a year of governance crises (quarterly events → AGM → year-end). Four playable companies, each a different regulatory world. Built by a solo founder (LSE background) heading toward commercializing it as a governance-training/licensing product. Live at https://boardcraft-eight.vercel.app.

## Stack & running

- **Next.js 16 (App Router, Turbopack) · React · TypeScript · Tailwind · Framer Motion.** localStorage only — no backend.
- Git repo root **is** this `boardcraft/` folder. Path has spaces/brackets; quote it in shell.
- `npm run dev` (port 3000) · `npm run build` · `npm test` (vitest). CI runs test+build on every push to main (`.github/workflows/ci.yml`).
- Heads-up: a stray `/Users/asafrubin/package-lock.json` triggers a harmless Next "multiple lockfiles" warning. A stale `.next/dev/lock` can block `npm run dev` after a killed server — `rm -rf .next/dev/lock`.
- **Dev shortcuts (dev mode only):** `?dev=q1|q2|q3|q4|agm|yearend`, plus `vantage-*`, `rheinfeld-*` prefixes (e.g. `/play?dev=rheinfeld-agm`). Jumps straight to a phase with a pre-built board — the fastest way to reach a screen for verification.

## Architecture

- `src/engine/` — pure logic. `resolution.ts` (event scoring), `compliance.ts` (per-jurisdiction board rules), `gameStateManager.ts` (state transitions, AGM votes), `forcedChanges.ts` (mid-game director crises), `governanceCapital.ts` (cross-game currency/leaderboard, localStorage).
- `src/data/` — all content. `company.ts` + `directors.ts` + `events.ts` are Harwick; `vantage/`, `rheinfeld/`, `meridian/` subfolders mirror the same schema per company. **Content is hand-written TypeScript** (the #1 scaling blocker — see ASSESSMENT §6).
- `src/components/` — `BoardroomTable` (SVG table, shared by construction + gameplay), `GameBoardScreen`, `EventCard`, `AgmScreen`, `YearEndScreen`, `CompanySelectScreen`.
- `src/app/play/page.tsx` — the spine. Holds phase state and `BoardConstructionWrapper` (the board-building UI). Large file; read the section you need.

## The four companies (each has bespoke logic — grep the company id)

- `company_harwick` — UK FRC Code, the default/reference company.
- `company_vantage` — US, combined Chair/CEO, Apex Capital activist.
- `company_rheinfeld` — German two-tier board, 5 fixed worker-rep seats (co-determination), Meridian Capital activist. Uses a forced grid layout.
- `company_meridian` — UK charity (CIO), unpaid trustees (budget 0), Mission Integrity Score replaces SV Index.

Company-specific flags live directly on `GameState` (e.g. `apexStatus`, `heinrichConflictRevealed`, `founderSyndromeScore`). AGM content is per-company in `AgmScreen.tsx`.

## Conventions & gotchas

- **Responsive — two layouts, one switch.** `md:` is the *only* layout breakpoint, redefined in `globals.css` as `@custom-variant md (min-width: 64rem) and (orientation: landscape)`. Below it: the touch layout (single column; board construction uses the gold POOL / COMPLIANCE side-tabs → slide-in panels + touch drag-and-drop). At/above it: the multi-panel desktop layout. So **every tablet in portrait gets the touch layout, every tablet in landscape gets the desktop one**, and rotating swaps them. Any JS that branches on layout mode must use `isDesktopViewport()` from `src/lib/breakpoints.ts`, never a hardcoded 768/1024 — the CSS and the JS have to move together.
- Seats are percentage-positioned divs over a 400×400 SVG; changing the SVG `tableRect` does NOT move seats.
- **No device gates.** The "rotate your device" screen (`TabletRotateGate`) is **gone** — portrait tablets get a real layout now, so gating them was blocking a working screen. The older mobile→desktop *redirect* (`TouchGate`/`TouchIntercept`) was removed earlier; those files may still exist unwired. Don't re-add either.
- **Compliance errors** carry `source: 'code' | 'game'` — real code citations vs. BoardCraft skill thresholds (rules whose code contains `_LOW_`). The UI badges them differently; keep new numeric-threshold rules honest.
- **Persistence:** game auto-saves to `localStorage['boardcraft_saved_game']` during gameplay/AGM, restores on load, clears at year-end/restart/change-company.
- **Verification:** prefer the `preview_*` tools + a `?dev=` shortcut to drive the real screen over assuming. Don't lean on tests as proof the app works — run it. For layout work use the Playwright harnesses against `npm run dev` on :3000 — `node scripts/mobile-shots.js` (phones) and `node scripts/tablet-shots.js` (six iPad viewports, both orientations). Both log horizontal/vertical clipping per shot, so regressions show up in the console, not just the images. Do **not** judge layout from the Claude browser pane: it starves requestAnimationFrame and freezes Framer Motion mid-animation, which reads as broken layout but isn't.
- **Git:** this repo commits AND pushes to `main` routinely as work lands. Match that unless told otherwise.

## Current state (June 2026)

P0 hardening from the assessment is **done**: risk-flag probability bug, phantom follow-on events removed, working test suite + CI, code-vs-game compliance labels, mid-game persistence, bespoke Vantage/Rheinfeld AGMs.

**Next priority (P1, ASSESSMENT §8):** the **year-end Governance Debrief report** — maps the player's decisions to governance code provisions and outcomes. Highest-value feature for the B2B/licensing use case. Then: author the missing consequence events (the `TODO(content)` markers in `data/events.ts`), and make the three AGM resolutions resolve independently rather than off one aggregate roll.
