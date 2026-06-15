# MyLabourRights — Build Team Briefs
### How we split a single-file app across eight specialists without collisions

**To the team:** This is a working South African labour-law case-management PWA.
It is **one `index.html`** (~6,000 lines: ~1,220 lines of CSS, then the app
script) plus Netlify serverless functions. It already works end-to-end on a
built-in simulation, with optional live AI. Our job is not to rebuild it — it
is to take it from "genuinely good" to **world-class**.

Read this whole document before touching anything. Each brief says: what you
own, what already exists, what "great" looks like, the exact code to work in,
and — critically — **the seams you must not cross** so we don't trip over each
other.

**Three rules for everyone:**
1. **The app must work at every commit.** It ships on the simulation with no
   keys. Never make a change that requires the live AI to function.
2. **Additive, not destructive.** The engines (`CaseStrength`, `Deadline`,
   `Chase`, `BundleOrganiser`, `EmployerAttack`, `CCMAForms`, etc.) are load-
   bearing. Extend them; don't rewrite their contracts.
3. **Honesty is a feature.** This product tells stressed people the truth about
   their legal position. No dark patterns, no fake certainty, no inflated
   scores. The success estimate is capped at 88% on purpose.

---

## The architecture, in one screen

```
index.html  (single file)
├── <style>            ~1,220 lines — design tokens + every component   → DESIGNER 1, 2
├── ENGINES (pure JS, no DOM):                                          → DESIGNER 5 (logic), 8 (perf)
│   Deadline · classifyDispute · IssueMatrix · CrossExam · Settlement
│   · Bundle · Citation · CCMAForms · BundleOrganiser · EmployerAttack
│   · CaseStrength · Chase · CaseEngine (simulation) · NoteExtractor · Voice
├── DB (IndexedDB: users, cases, documents, messages, timeline, notes, meta) → DESIGNER 6
├── VIEWS / TABS (dashboard, chat, notes, docs, timeline, builder,
│   actions, firms, resources) + Modal system                          → DESIGNER 3 (flows), 4 (chat/voice)
└── Backend connector → /.netlify/functions/ai.js                      → DESIGNER 5, 7

netlify/functions/  ai.js · blog.js · pay.js · pay-notify.js · tenders*  → DESIGNER 7
```

Everyone shares two things, so coordinate through the leads named:
- **The CSS design tokens** (`:root` variables) — **Designer 1 owns these.**
- **The `State` object + `render()` loop** — **Designer 3 owns this contract.**

---

## DESIGNER 1 — Design System & Visual Language *(the foundation; others build on you)*

**You own:** the `:root` design tokens, typography scale, colour system,
spacing, radius, shadow, and the "brand feel." Everyone else consumes your
tokens — so you go first and you set the contract.

**What exists:** a four-colour system (Forest Green `#166534`, Rich Gold
`#EAB308`, Warm Sand `#FAFAF9`, Very Dark Grey `#1C1917`), Fraunces (serif
display) + Outfit (sans), hand-coded SVG heritage icons, ~1,220 lines of CSS.
Contrast was checked for WCAG AA on key tokens.

**What "world-class" looks like:**
- A **token system documented in one place** at the top of `<style>`: every
  colour, every type size, every space step as a CSS custom property, named by
  role (`--text-mute`, `--paper-2`) not by value. No raw hex anywhere below
  `:root`. Audit and fix the violations.
- A **type scale** with real rhythm (e.g. 1.25 modular scale) and line-heights
  tuned for the long legal prose this app shows under stress.
- **Dark mode** via `prefers-color-scheme` + a manual toggle, built entirely on
  token swaps so nothing else has to change.
- **Motion tokens** (durations, easings) that respect `prefers-reduced-motion`
  (already partially done — own it fully).
- A one-page **living style guide** rendered from the tokens (can be a hidden
  `#styleguide` route) so the rest of the team has a reference.

**Hard boundary:** you change `:root` and global element styling only. You do
**not** restyle individual components — you give Designers 2/3/4 the tokens and
they apply them. If a token rename would break others, announce it.

---

## DESIGNER 2 — Marketing Site & First-Impression *(the front door)*

**You own:** the public landing page, pricing, the trust block, the "what this
is / isn't" section, and the first-run onboarding (the 4-step `onbNext` flow).
This is what decides whether a frightened, non-technical worker trusts us.

**What exists:** a rebranded landing page with hero, feature list, pricing
cards (Personal/CCMA 14-day trial, Company Grievance, Additional Case), a trust
block, and a `hero-micro` line. Mobile-first, three breakpoints.

**What "world-class" looks like:**
- A landing page that earns trust in **5 seconds** for someone who just got
  dismissed and is scared: lead with empathy and clarity, not features.
- **Plain-language everything.** Reading age ~14. No legalese on the public
  page. (Coordinate with Designer 5 on the legal claims so nothing overpromises.)
- A **"how it works" flow** that previews the case-strength loop (Designer 3's
  work) so people see the value before signing up.
- **Social proof done honestly** — if we have no testimonials yet, don't fake
  them; show the methodology and the lawyer-supervised framing instead.
- Onboarding that **captures the dispute type and incident date early** (these
  power the deadline clock) without feeling like a form.
- Bilingual EN/AF parity — every new string in both.

**Hard boundary:** you work in the landing/pricing/onboarding view functions and
their CSS classes. You consume Designer 1's tokens. You do **not** touch the
in-app tabs (that's Designer 3). The "not a law firm" / lawyer-supervised
wording is **locked** — coordinate with Designer 5 before changing any legal
claim.

---

## DESIGNER 3 — Core App Flow & The Case-Strength Loop *(the heart)*

**You own:** the `State` object, the `render()` loop, the tab/nav system, the
dashboard, and the **case-strength experience** (R1–R8) that makes the app feel
like it's actively building the user's case. You are the UX spine; coordinate
with everyone.

**What exists (this is the crown jewel — protect it):**
- `CaseStrength` engine → one element-based score per dispute type, with
  penalties, persisted to `c._strength` and `c.successRate`, snapshotted to
  `c.strengthHist`.
- `Chase` → persistent "evidence to chase" list (`c.chase[]`), auto-ticked when
  a matching document is uploaded.
- The dashboard strength panel (`renderStrengthPanel`): score, sparkline,
  element bars, ranked "next best move" buttons, chase checklist.
- The health strip (`fillHealthStrip`) above every tab.
- Re-run badges on the actions tab; chat→case-file extraction.

**What "world-class" looks like:**
- The loop should feel **alive**: when strength moves, animate the number and
  the sparkline; celebrate genuine progress without being childish.
- The **"next best move"** should feel like a phone call from your lawyer — one
  clear, specific instruction, never a wall of options.
- **Empty states that teach.** A brand-new case should make the path obvious.
- **Cross-tab continuity** — the health strip is the start; make the case state
  feel present everywhere without nagging.
- Tighten the **information hierarchy** on the dashboard: right now several
  panels compete. Decide what a returning user needs to see in the first
  screenful and demote the rest.

**Hard boundary:** the engine *contracts* (`CaseStrength.refresh()`,
`Chase.add/autoMatch`, the shape of `c._strength`) are owned jointly with
Designer 5 — change them only by agreement, because the chat, dashboard, and
analysis tools all read them. You own the *presentation* freely.

---

## DESIGNER 4 — Conversational AI & Voice Experience *(the relationship)*

**You own:** the chat tab, the message rendering, the typing/turn experience,
the voice (TTS + speech-in) experience, and the *felt quality* of talking to
the AI attorney.

**What exists:**
- `CaseEngine` simulation: rotated `INTROS`, `FOLLOWUPS`, `RAPPORT`, off-topic
  redirect, escalation flags rendered in chat.
- `Voice` module: `pickVoice()` prefers natural/neural voices, calmer rate/
  pitch, markdown→speech cleaning, voice preloading.
- `NoteExtractor`: pulls tagged facts from messages into the case file.
- Follow-up questions render as their own highlighted block.

**What "world-class" looks like:**
- Chat that feels like a **calm, expert human** — pacing, one question at a
  time, never a robotic script (we already removed the worst offender; keep
  hunting for repetition).
- **Trauma-informed pacing** as a first-class citizen for harassment/
  discrimination matters (the `isSensitive` flag exists — make the whole chat
  respond to it, not just the cross-exam drill).
- A **voice mode** good enough to use hands-free while pacing the kitchen at
  night: clear turn-taking, interruptibility, a visible "listening / thinking /
  speaking" state.
- Streaming-style reveal of long answers so they don't land as a wall.
- Make the **escalation-to-a-human-lawyer** moment feel caring, not like a
  dead end.

**Hard boundary:** you own everything *presentational* about chat and voice.
The *routing* (which model, cascade, prompts) is Designer 7's `ai.js`. The
*persona text* and legal correctness of replies are Designer 5's. You shape how
it feels; they shape what it says.

---

## DESIGNER 5 — Legal Logic, Persona & Case-Building Intelligence *(the substance)*

**You own:** the correctness and craft of every legal output — the persona, the
element models in `CaseStrength.ELEMENTS`, `Deadline`/`LEGAL_FACTS`,
`classifyDispute`, `CCMAForms`, `BundleOrganiser`, `EmployerAttack`, `Citation`,
`Settlement`, escalation rules, and the AI prompts. You are the resident
"attorney brain."

**What exists:** the 30+ year evidence-driven persona; deadline/forum logic
versioned by date; the bundle organiser (Groups A–E) and employer-attack
matrix; the citation layer; the dispute-specific element models that drive
case strength. Specialist prompts (`PROMPT_BUNDLE`, `PROMPT_ATTACK`) route to
the capable model.

**What "world-class" looks like:**
- **Legal accuracy you'd stake your name on**, current to the LRA/BCEA/EEA, with
  dated facts and a visible changelog (the `LEGAL_CHANGELOG` exists — keep it
  honest and current).
- The element models should reflect **how a real attorney weighs a case** —
  refine weights and coverage rules per dispute type; add dispute types we're
  missing (constructive dismissal, retrenchment/operational requirements).
- Outputs that are **specific, not generic** — every analysis must tie to the
  user's actual facts and documents, and say "unclear / needs confirmation" or
  "no evidence found" honestly.
- The escalation rules must **never under-trigger** on discrimination,
  harassment, or Labour Court matters.
- Keep the **simulation and the live-LLM paths in sync** — when you change the
  persona or a prompt, change both `index.html` and `ai.js`.

**Hard boundary:** you may change engine *internals and outputs* freely, but the
*function signatures* the UI calls are shared with Designer 3 — coordinate on
any contract change. You write copy that is legally safe; Designer 2 can't soften
a legal claim without you. **Child-safety / vulnerable-user duty of care sits
with you:** anything that could harm a frightened user is your stop-the-line.

---

## DESIGNER 6 — Data, Offline & PWA *(the reliability)*

**You own:** the IndexedDB layer (`DB`, stores: `users`, `cases`, `documents`,
`messages`, `timeline`, `notes`, `meta`), the service worker (`sw.js`,
cache `mlr-v1`), the manifest, offline behaviour, data export/delete (S17), and
data integrity across schema versions.

**What exists:** IndexedDB at `mlr-db` v3 with the stores above; a service
worker; install-as-app manifest; client-side export/delete in Privacy &
settings; everything is **device-local with no server account yet** (this is
the honest limitation).

**What "world-class" looks like:**
- **Bulletproof offline.** Someone on a cheap phone with patchy data must be
  able to keep working; queue anything that needs the network and sync later.
- **Migration discipline** — a real `onupgradeneeded` strategy so future schema
  bumps never lose a user's case (their whole legal matter lives here).
- **Storage resilience** — handle quota limits, large document uploads, and
  eviction gracefully; warn before data loss.
- A genuinely installable, fast-launching PWA with a sensible cache strategy
  (app shell cached, content fresh).
- Make the **export** (data portability) produce something a user could hand to
  a real attorney — not just a JSON dump.

**Hard boundary:** you own `DB`, `sw.js`, `manifest.json`. You do **not** change
data *shapes* (`c.chase`, `c._strength`, document/timeline records) without
Designers 3 and 5 — those are read all over. Adding stores/indexes is yours;
renaming fields is a team decision. **Flag loudly:** the real
server-auth + encrypted storage backend is out of scope here and must be its own
project — document the seam, don't fake it.

---

## DESIGNER 7 — Backend, AI Routing & Integrations *(the engine room)*

**You own:** the Netlify functions — `ai.js` (the routing engine + prompts),
`blog.js`, `pay.js`/`pay-notify.js` (PayFast), and the tenders functions —
plus security hardening and cost control.

**What exists:** `ai.js` is a 3-tier router (easy→Gemini light, medium→Gemini,
hard→Claude) with a cascade that escalates weak cheap answers, prompt-injection
screening, `<user_input>` fencing, per-IP rate limiting, output sanitisation,
and `mode:'bundle'|'attack'` specialist routing. Keys live server-side only.

**What "world-class" looks like:**
- **Cost-aware routing** that's measurably right: cheap model for chatter,
  capable model only when the legal stakes justify it; log and tune the split.
- **Streaming responses** to the client so long legal answers feel fast
  (coordinate with Designer 4 on the UI).
- **Security you'd pass an audit on**: keep hardening injection defence, rate
  limits, and output handling; never let a key reach the browser.
- Pass the **case context** (dispute type, deadline, desired outcome) into the
  live model so its answers match the deadline/strength tools — the seam is
  documented in `ROUTING-AND-SECURITY.md`.
- Robust **payment flow** (PayFast) with proper notify-handling and no way to
  unlock a paid case without a confirmed payment.

**Hard boundary:** you own `/netlify/functions/*`. The *persona and prompt
wording* are Designer 5's — you own how prompts are *assembled, routed, and
secured*, not their legal content. The client connector contract (what the
browser POSTs) is shared with Designer 3/4.

---

## DESIGNER 8 — Accessibility, Performance & QA *(the quality gate; ships last, blocks everyone)*

**You own:** WCAG 2.2 AA compliance, performance, the test harness, and the
final quality bar. You have veto power on ship.

**What exists:** focus-visible rings, reduced-motion support, dialog roles +
focus management + Escape on modals, `aria-live` on chat and voice status,
labels on icon buttons. A jsdom + fake-indexeddb test pattern that has caught
real bugs (a syntax error that swallowed an object, a regex word-boundary bug,
a stale-reference test artifact).

**What "world-class" looks like:**
- **Real WCAG 2.2 AA**, verified with a screen reader, not just code review:
  every flow operable by keyboard, every state announced, contrast confirmed,
  target sizes met. This audience includes stressed, low-literacy, and disabled
  users — accessibility is core, not polish.
- **Performance on a cheap Android over 3G**: the single 6,000-line file needs a
  loading strategy; measure and protect first-paint and interaction latency.
- A **growing automated test suite** (extend the jsdom pattern) that runs the
  full case-building loop and every engine, so no one ships a regression. Make
  green tests a merge requirement.
- **Cross-device QA** — this is mobile-first; verify on real low-end hardware.
- Own the **honest-limitations register** — keep the docs (`PHASE-3-NOTES.md`,
  `ROUTING-AND-SECURITY.md`) truthful about what's client-side vs server-side.

**Hard boundary:** you touch any file to fix a11y/perf/test issues, but you
**file the change back to the owning designer** rather than redesigning their
work. You are the gate, not a second author. Your veto is on *quality*, not
*taste*.

---

## How we avoid collisions (the seam map)

| Shared thing | Owner | Everyone else… |
|---|---|---|
| `:root` design tokens | **D1** | consume, never redefine |
| `State` + `render()` | **D3** | call, never restructure |
| Engine function signatures | **D5** (logic) + **D3** (UI) jointly | coordinate before changing |
| Data shapes (`c.chase`, `c._strength`, records) | **D6** custodian | propose field changes to the team |
| Persona / prompt wording | **D5** | D4 styles delivery, D7 routes it |
| `/netlify/functions/*` | **D7** | client contract shared w/ D3/D4 |
| Legal claims & safety | **D5** | nobody softens a legal claim alone |
| Ship gate | **D8** | green tests + a11y required to merge |

## Definition of done (every brief)
1. Works on the simulation with no keys.
2. Bilingual EN/AF for any new user-facing string.
3. Passes Designer 8's a11y + test gate.
4. No raw hex / magic numbers — uses Designer 1's tokens.
5. Honest: no fake certainty, no dark patterns, no hidden data loss.
6. Docs updated (`CASE-AI-LOGIC.md`, `LLM-SCRIPTS.md`, or the relevant note).

**The north star:** a frightened person who was just dismissed opens this on a
cheap phone, and within minutes understands exactly where they stand, what to do
next, and that someone competent has their back — without ever being misled.
That feeling is the product. Build for it.
