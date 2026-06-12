# BoardCraft — Comprehensive Product Assessment

*Prepared June 2026. Full audit of content, game mechanics, and functionality across the codebase (~22,000 lines: engine, four companies, all gameplay screens). Audience: the founder, preparing to commercialize BoardCraft as an educational/licensing product for board members and governance professionals.*

---

## 1. Executive Summary

BoardCraft is substantially better than a typical solo-built MVP. The writing is genuinely excellent, the governance content is grounded in real codes with real citations, and the four-jurisdiction structure (UK plc / US combined Chair-CEO / German two-tier co-determination / UK charity) is a differentiator that no competitor in the board-education space currently offers. The "fantasy football for corporate governance" reaction is earned: the core loop — build a board under budget and compliance constraints, then live with your choices through a year of crises — works, and it teaches.

But the audit found a meaningful gap between **what the game appears to model and what it actually models**. The consequence system (follow-on events) is largely dead code; the AGM's three vote bars are cosmetic; one balance bug makes director risk flags fire 100% of the time instead of the stated 40–50%; and two of the four companies show another company's content at their AGM. None of these are visible in a casual playthrough — all of them would be found by exactly the audience you're selling to: governance professionals who replay, compare notes, and probe.

The commercial risk is not that the product is bad. It's that the product *invites expert scrutiny* and currently can't fully withstand it. The fixes are tractable, mostly small-to-medium, and listed in priority order in §8.

**Verdict: strong foundation, real moat in the content, 4–6 weeks of focused hardening away from being credibly demo-able to paying institutional clients.**

---

## 2. Content Quality

### 2.1 Narrative writing — the standout asset

The event copy is the best thing in the product. It is literate, wry, specific, and sounds like it was written by someone who has sat in these rooms:

> "The letter arrived jointly signed — LGIM, Aviva, Brunel Pension Partnership, together holding 18% — and it reads like an ultimatum wearing a dinner jacket."

> "A qualified audit opinion — four words that, in German corporate governance, carry roughly the same weight as a vote of no confidence delivered in writing."

Every outcome tier has bespoke narrative text (5 tiers × 15 events × 4 companies ≈ 300 hand-written outcome narratives). Character details persist across events (Priya Sundaram's precision, Blaine's tenure-blindness, Heinrich's grip on the Nomination Committee). This is expensive-to-replicate content and the core of the moat.

### 2.2 Governance accuracy — strong, with one credibility risk

The compliance engine cites real provisions and gets them substantively right:

- **UK:** FRC Code Provision 9 (chair independence on appointment), ≥50% board independence excluding the chair, SID requirement, 9-year tenure flag (Provision 10).
- **Germany:** AktG §107(4) (audit committee financial expertise), GCGC D.3 (SB Chair cannot chair audit), GCGC C.7 cooling-off (flagged on Strasser, a former CFO), MitbestG co-determination with five fixed worker-rep seats correctly excluded from independence math.
- **US:** NYSE §303A.01/.04/.05 (majority independence, committee independence), SEC Rule 10A-3 (audit financial expert), LID requirement with a combined Chair/CEO.
- **Charity:** CIO 3-trustee minimum, Charity Governance Code 5-trustee recommendation and 9-year chair tenure, trustee personal liability, founder-conflict dynamics.

**Credibility risk:** game-invented heuristics are presented in the same voice and same UI as real code requirements. "Board Chair requires Strategy & Markets ≥ 60" sits next to "(FRC Code Provision 9)" with no visual distinction. A governance professional will know the FRC Code says nothing about a strategy score of 60, and once they catch one conflation they will doubt the real citations too. This is cheap to fix (label game heuristics as "BoardCraft requirement" vs. shield-icon "Code requirement") and important to fix before professional demos.

### 2.3 Director pool design

Excellent. The 80+ directors across four companies have:
- Deliberate trade-offs (Wren is the elite audit chair but her ESG of 29 will be scrutinised; Brennan is forensically strong but lacks the stakeholder voice to chair).
- Risk flags with narrative texture (Bracewell's former employer under FCA investigation; Al-Fassih's sanctions-adjacent advisory history).
- Inherited baggage (Crane's 12-year tenure forces a real retain-or-refresh decision, which then plays out at the AGM).
- Scarcity tiers, jurisdiction familiarity scores, and pairwise dynamics (synergies and feuds) that reward thoughtful deployment.

### 2.4 Naming collision

"Meridian" is three different entities: Meridian Governance (the proxy adviser in Harwick), Meridian Capital (the activist in Rheinfeld), and Meridian Foundation (the playable charity). Within a single company it's fine; across the product it reads as an oversight. Rename two of them.

---

## 3. Game Mechanics — What Works

- **Resolution model** (`src/engine/resolution.ts`) is coherent and well-shaped: weighted domain match × energy modifier × jurisdiction-familiarity penalty → strategy multiplier (gated by competency thresholds with explicit fallbacks) → committee bonus (only if active *and* chaired *and* the chair is qualified) → difficulty-scaled randomness (±12% at tier 1 up to ±35% at tier 4) → 8% wildcard tier shift. The "Do Nothing floor" (inaction on tier-1 events can't be catastrophic) is a smart touch.
- **Energy/stamina** creates a real deployment economy: tier-2 events cost 25–35 energy, bench players regen 30/quarter, everyone gets +20 after the AGM. You cannot ride your three best directors all year. This teaches bench depth — arguably the most transferable lesson in the game.
- **Board construction trade-off space** is genuinely tight: budget vs. skill coverage vs. independence vs. committee completeness, with role fee premiums (chair +60%, audit +33%) that mirror reality.
- **Governance health breakdown** (independence / committee completeness / chair-CEO separation / ESG governance / skill matrix) is a defensible simplification of how proxy advisers actually score boards, and it drives AGM votes and the proxy rating — consequences flow from structure, which is the right lesson.

---

## 4. Game Mechanics — What's Broken or Hollow

These are ordered by how badly they undermine the product's promise.

### 4.1 The follow-on consequence system is dead code ⚠️

`GameState.eventQueue` is populated by `applyResolution()` when events resolve badly — and **never read**. `getFollowOnEvents()` in `gameStateManager.ts` has zero callers. Worse, Harwick's event data references **nine follow-on events that don't exist anywhere**: `event_cfo_departure`, `event_hse_investigation`, `event_licence_revocation`, `event_agm_pay_flag`, `event_agm_rem_flag`, `event_media_leak`, `event_hostile_bid_public`, `event_post_agm_crisis`, `event_regulatory_investigation_ncsc`.

What actually works: three Harwick events (event_10 Greenvale Escalation, event_12, event_15 Proxy Battle) fire through the separate *scheduled-slot + condition* mechanism, and the other companies' conditional chains (Vantage Apex, Rheinfeld Meridian Capital, Meridian FSS) use the same pattern correctly.

**Impact:** fail the CFO retention event and… nothing happens. The safety incident's promised HSE investigation never comes. The licence revocation threatened in West Africa never materialises. The game's design promises "your failures compound" — its strongest educational claim — and for most of Harwick that promise is hollow. Either author the nine missing events (high content value) or remove the dangling references and route consequences through the conditional system that works.

### 4.2 Risk flags fire 100% of the time, on any event ⚠️

In `forcedChanges.ts`, `checkMisconduct()` rolls `seededRandom(...)` (range 0–1) and compares it to `activationProbability`, which is stored as **40 or 50** (percent). `0.83 < 40` is always true, so **a flagged director triggers a misconduct crisis the first time they are deployed, every game**. Two further problems: the seed is `randomSeed + dirId.length * 31`, so same-length IDs share rolls; and `riskFlag.triggerCategories` (the design that flags only fire on related event domains) is never checked — `checkMisconduct` is called on every resolution regardless of event domain.

**Impact:** Bracewell and Al-Fassih — two of Harwick's best specialists — are de facto unplayable, and players learn "never touch a flagged director," which is the opposite of the real-world lesson (risk-manage, don't blanket-avoid). Three-line fix (`roll * 100 < probability`, gate on `event.riskFlagTriggerCategories`), big behavioral payoff.

### 4.3 The AGM's three vote bars are cosmetic

`AgmScreen` shows three resolutions with per-resolution vote estimates built from real game history (Crane's tenure penalty on re-elections, event_06 outcome on say-on-pay, ET committee on the ESG resolution). The display is excellent. But pass/fail (`handleResolveAgm` in `play/page.tsx`) derives all three results from **one** `resolveEvent()` outcome tier: SUCCESS passes everything, PARTIAL passes resolution 1 (and 3 if the ETC exists). The carefully-computed per-resolution adjustments shown to the player never touch the actual results.

**Impact:** a player who skipped the ETC but sees a 71% "For" bar on the ESG resolution can watch it fail because the *unrelated* aggregate roll came in PARTIAL. Experts will reverse-engineer this in two playthroughs. Make each resolution resolve against its own displayed threshold — the data is already computed.

### 4.4 Vantage and Rheinfeld get Harwick's AGM ⚠️

`AgmScreen.tsx` has bespoke strategies and resolutions only for Harwick (default) and Meridian. A Vantage or Rheinfeld player reaches their AGM and is offered "Negotiate with **Greenvale** on their shareholder resolution" and a say-on-pay vote on "**Marcus Blaine's £4.1m package**" — Harwick's activist and Harwick's CEO. For a German two-tier supervisory board, an AGM about UK-style annual director re-elections is also conceptually wrong (Aufsichtsrat members serve multi-year terms).

**Impact:** this is the single most embarrassing thing a prospective licensing client could hit in a demo. Two of your four products are broken at their climax.

### 4.5 Smaller mechanical issues

- **No mid-game persistence.** A refresh, tab close, or mobile browser eviction loses the entire game. localStorage is already used for hints/career — serialize `gameState` per turn. Critical for 30–60 minute sessions and fatal in workshop settings if unfixed.
- **AGM soft-lock edge case:** AGM deployment requires ≥1 director with energy > 0; an aggressively-deployed board could arrive with everyone exhausted and be unable to proceed.
- **Governance Capital's "no proxy concerns" bonus** checks *current* GH, not GH at the AGM (the `agmEvent` lookup is dead code beside it).
- **Skipped events** (event_08-style report cards) are recorded as PARTIAL_SUCCESS, slightly polluting outcome statistics used elsewhere.
- **Replayability:** event schedules are fixed per company; randomness perturbs outcomes but never *which* events fire. Two playthroughs differ only by dice. Fine for first-play education, weak for retention and useless for "run it again with a different board strategy" training exercises — the conditional-event scaffolding could support event pools/variants cheaply.

---

## 5. Educational Value

**What it genuinely teaches** (and teaches well):
1. Board composition is portfolio construction — skill coverage, independence ratios, succession depth, and budget are competing constraints. The compliance panel makes the trade-offs legible.
2. Committee structure matters — bonuses only flow from active, qualified-chaired committees; the ETC formation decision (cost now vs. resilience later) is a real capital-allocation-for-governance lesson.
3. Jurisdictions differ structurally, not cosmetically — two-tier boards, co-determination, combined Chair/CEO mitigation via LID, charity trustee liability. No textbook exercise puts these side by side this concretely.
4. Proxy advisers and structure-driven voting — GH drives the rating drives the votes.
5. Bench management — the energy system is "key person risk" made mechanical.

**What it gamifies away** (acceptable simplifications, worth a line in a facilitator guide): executives barely exist (the board acts alone); committee *membership* is reduced to chairs; stakeholders beyond shareholders/proxy advisers are thin; one-year horizon hides slow-burn governance failure.

**The big missed opportunity: no debrief.** The year-end screen scores the player but never connects decisions back to governance principles. The single highest-value B2B feature you could build is an auto-generated **Governance Debrief report**: "You retained Crane past the 9-year independence threshold → FRC Provision 10 → it cost you 8 points of re-election support at the AGM. Here is what a Nomination Committee would have done." That artifact is what a facilitator photocopies, what an L&D buyer forwards, and what justifies a per-seat licence. The data to generate it already exists in `resolvedEvents` + compliance history.

---

## 6. Technical Debt & Scaling Risks

For context: the codebase is in better shape than most solo MVPs — clean component boundaries, a pure resolution engine, typed throughout, recently shipped responsive mobile support. The issues below are about where it's going, not where it is.

1. **Content is code — the #1 blocker to a licensing business.** A new company requires hand-editing TypeScript in 6+ files, adding company-specific fields to the shared `GameState` (`heinrichConflictRevealed`, `founderSyndromeScore`, `apexStatus`…), hardcoding director IDs into the compliance engine (`rdir_strasser`, `WORKER_REP_IDS`), and adding bespoke branches to `AgmScreen`. Today, "we'd like a scenario based on our own company" — the most obvious licensing product — is a developer engagement, not a content engagement. The path: externalize events/directors/companies to schema-validated JSON; replace typed company-specific state with a generic `flags: Record<string, number|boolean>` + data-driven preconditions (the `conditionConfig` pattern already points the way); make the AGM data-driven like everything else.
2. **No backend.** Career stats and the leaderboard live in localStorage — per-device, wipeable. A licensing buyer needs accounts, cohort dashboards, completion tracking, and facilitator views. None exist. (Right-sized fix: Supabase or similar, not a platform rebuild.)
3. **The test suite has never run.** `vitest` test files exist for the two most important modules (resolution, compliance) but there's no vitest config (path aliases unresolved, globals off) and no `npm test` script — both files fail at import time. The misconduct probability bug (§4.2) is precisely the class of bug a working suite catches. One hour of setup.
4. **Dead code:** `GameContext.tsx` (186 lines, zero imports), `getFollowOnEvents`, the unused `agmEvent` lookup, CommonJS `require()` calls inside functions in an ESM Next 16 app.
5. **Accessibility unaudited:** 9px seat labels, color-only state signals, no keyboard alternative to drag-and-drop (tap-to-assign partially covers this), untested with screen readers. Institutional buyers (universities, regulated firms) increasingly require WCAG conformance.

---

## 7. UX Observations

- Board construction is the strongest screen on both desktop and mobile; the recent mobile overlay system (pool/compliance tabs, touch drag-and-drop, full-screen profiles) is well executed.
- The hint system (sequential + contextual + committee hints, localStorage-tracked) is a solid onboarding spine.
- Event pacing: auto-advance through empty turns is smooth; the outcome → narrative → next-event rhythm holds attention.
- Friction points: no way to review a past event's full text after resolving it (the SV dashboard lists outcomes only); no confirmation on "Do Nothing" (one mis-tap on mobile resolves a tier-2 event); the news ticker overlaps the footer on short viewports; "Stamina" vs "Energy" terminology drifts between screens.

---

## 8. Prioritized Roadmap

Ordered by commercial impact for the licensing/B2B education use case. Effort: **S** ≤ 1 day · **M** = 2–5 days · **L** = 1–3 weeks.

### P0 — Demo credibility (do before showing anyone who might pay)
| # | Fix | Effort | Why first |
|---|-----|--------|-----------|
| 1 | Bespoke AGM content for Vantage & Rheinfeld (§4.4) | **M** | Two of four products are broken at their climax; Harwick names leaking into a client demo is disqualifying. |
| 2 | Fix risk-flag probability + gate on trigger categories (§4.2) | **S** | Three lines; removes a degenerate dominant strategy. |
| 3 | Mid-game persistence (serialize gameState per turn) | **S/M** | A refreshed tab mid-demo currently means starting over. |
| 4 | Distinguish real code citations from game heuristics in the compliance UI (§2.2) | **S** | Protects the accuracy claim that the whole product stands on. |
| 5 | Remove or stub the nine phantom follow-on references (§4.1) | **S** | Stops queueing events that can never fire; honest interim state while #7 is built. |
| 6 | Working test config + `npm test` + CI on push | **S** | The suite exists; make it run. Protects every demo thereafter. |

### P1 — Product depth (the next month)
| # | Fix | Effort | Why |
|---|-----|--------|-----|
| 7 | Author the missing consequence events and wire the queue (or fold fully into the conditional system) (§4.1) | **L** | Restores the game's strongest educational promise: failures compound. |
| 8 | Make the three AGM resolutions resolve independently, using the adjustments already displayed (§4.3) | **M** | Aligns mechanics with the displayed model; experts won't catch a fake. |
| 9 | **Year-end Governance Debrief report** mapping the player's decisions to code provisions and outcomes (§5) | **M** | The single most valuable B2B feature; the artifact a buyer forwards. |
| 10 | AGM exhaustion soft-lock guard; "Do Nothing" confirmation; post-resolution event log | **S** | Quality-of-life batch. |
| 11 | Rename two of the three "Meridians" (§2.4) | **S** | Polish that experts notice. |

### P2 — Scale for licensing (the next quarter)
| # | Fix | Effort | Why |
|---|-----|--------|-----|
| 12 | Externalize content: schema-validated JSON for companies/directors/events; generic flag-based state; data-driven AGM (§6.1) | **L** | Converts "new scenario" from developer work to authoring work — the licensing business depends on this. |
| 13 | Backend accounts + cohort/facilitator dashboard (Supabase-class) (§6.2) | **L** | What institutional buyers actually pay for: visibility into learner completion and decisions. |
| 14 | Scenario authoring kit (docs + validation + a fifth company built *only* through the new pipeline as proof) | **L** | The proof point that custom client scenarios are a product, not a promise. |
| 15 | Event pools/variants per slot for replayability (§4.5) | **M/L** | Retention for consumers; "run it again differently" for cohorts. |
| 16 | Accessibility pass to WCAG AA (§6.5) | **M** | Procurement requirement for the institutional segment. |

### Sequencing note
P0 is ~2 weeks of focused work and transforms what a skeptical expert experiences. Item 9 (the debrief) is the bridge from "impressive game" to "training product with a deliverable." Item 12 is the gate between "founder demos a game" and "business sells scenarios" — nothing in P2 matters until it's done, and item 14 is how you prove it.

---

## 9. Bottom Line

The hard things — voice, governance fluency, a coherent simulation model, four genuinely different regulatory worlds — are already built, and they are the things competitors can't copy quickly. What remains is mostly honesty debt: places where the surface promises more than the engine delivers. Close that gap (P0/P1), build the debrief, then invest in the content pipeline that turns BoardCraft from a very good game into a scenario platform someone licenses.
