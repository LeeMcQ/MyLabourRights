# MyLabourRights — How to Implement & Deploy

This is the finished build covering your whole approved pick-list (A–H).
Everything is in this folder; the deployable copy is `MyLabourRights-github.zip`
one level up.

---

## 1. What you're deploying

A mobile-first Progressive Web App (one `index.html` + service worker + manifest)
with a set of Netlify serverless functions for AI, payments and content. It runs
fully on a built-in simulation with **no keys at all** — keys just upgrade it to
live AI and payments.

```
caseguide-site/
├── index.html              the whole app
├── sw.js                   service worker (offline + auto-update)
├── manifest.json           PWA install metadata
├── netlify.toml, _redirects
├── package.json            (npm test, deps)
├── netlify/functions/      ai.js, pay.js, pay-notify.js, blog.js, tenders*
├── icons/                  app icons
├── tests/                  committed test suite (engines + flow)
└── reviews/                the 8 expert reports, pick-list, progress, checklists
```

---

## 2. Fastest path to live (Netlify)

1. Unzip `MyLabourRights-github.zip` and push it to a GitHub repo.
2. In Netlify: **Add new site → Import from Git**, pick the repo.
   - Build command: *(leave blank)* · Publish directory: `.`
   - Functions directory: `netlify/functions` (netlify.toml already sets this).
3. Deploy. It works immediately on the simulation.
4. Add environment variables (Site config → Environment variables) to go live:

| Variable | What it does | Needed for |
|---|---|---|
| `GEMINI_API_KEY` | cheap-tier model | live AI |
| `CLAUDE_API_KEY` | capable-tier model | live AI |
| `GEMINI_MODEL` | override model name (optional) | tuning |
| `CLAUDE_MODEL` | override model name (optional) | tuning |
| `DAILY_HARD_CAP` | capable-model calls per user/day (default 40) | cost control |
| PayFast vars (see `pay.js`) | payments | billing |

Netlify Blobs (used for rate-limiting + the daily spend cap) is auto-provisioned
on Netlify — no setup needed; `@netlify/blobs` is already in `package.json`.

---

## 3. Run the tests (do this before every deploy)

```bash
npm install      # installs jsdom + fake-indexeddb (dev only)
npm test         # 54 checks: engines + full user flow
```
**Green tests are the merge gate.** They've already caught real regressions in
this build, so keep them passing.

---

## 4. Turning it into native apps (Android / iOS / Huawei)

It's a clean PWA, so it wraps without a rewrite:

- **Easiest:** use a PWA wrapper / [Capacitor](https://capacitorjs.com). Point it
  at the deployed URL or bundle the static files.
- The app already handles **safe-area insets** (notch / gesture bar), **dark
  mode**, and stores everything in **IndexedDB** (which the WebView persists).
- **Huawei (HMS):** the codebase has **no Google-only SDKs**, so the HMS build
  works. Keep it that way — if you later add push/analytics, choose an
  HMS-compatible provider. (This was your F6 "skip", noted: nothing was added
  that breaks HMS.)
- Provide a dark `theme_color` if you want the native status bar to match dark mode.

---

## 5. What was built (your pick-list A–H)

- **A** Design system: one type scale, dark mode + toggle, 8pt spacing, safe-area.
- **B** First impression: mobile-first hero, ~40% less wording, **deadline clock
  live from sign-up**, one CTA, install hint, tightened trust block.
- **C** Navigation: **9 tabs → 5 groups** (Home/Talk/Evidence/Build/Help) with
  sub-nav memory, "Your next move" card, journey chip, nav polish. *(C2 skipped
  per your choice — dashboard order left as-is.)*
- **D** Chat & voice: one morphing mic/send control, staged reveal, trauma-aware
  banner, warm "see a lawyer" hand-off, safe-area input.
- **E** Legal (**additive only — all 5 prompts proven byte-for-byte unchanged**):
  real models for money/min-wage claims, constructive dismissal + retrenchment,
  wider escalation, honest offline hedge, "why this matters", law-current date.
- **F** Data: persistent storage, fail-loud saves, **in-app image downscale + PDF
  size guard with iLovePDF fallback**, auto-update service worker, printable
  case-file export. *(F6 skipped per your choice.)*
- **G** Backend: shared-store rate limit + **daily AI-spend cap**, case context to
  the live model, model names in env vars. *(G2 streaming + G3 tamper-proof
  payments are documented in `ROUTING-AND-SECURITY.md` for the live-infra step —
  not shipped blind, to avoid breaking the working chat/billing.)*
- **H** Quality: all icon buttons labelled, fast first paint, **committed test
  suite + merge gate**, focus rings + skip-link + tap targets, release checklist.

---

## 6. Two things to do before a public launch

1. **Attorney sign-off (important).** The new legal logic in E — element weights,
   the new dispute types' deadlines, and escalation triggers — should be reviewed
   by a qualified SA labour-law practitioner. The app's value and safety rest on
   being right. Build first, human-check second — never the reverse.
2. **Finish G2/G3 on a live Netlify environment** (streaming + tamper-proof
   paid-unlock) using the spec in `ROUTING-AND-SECURITY.md`, tested against the
   PayFast sandbox.

Full item-by-item status is in `reviews/BUILD-PROGRESS.md`; the pre-release QA
steps are in `reviews/RELEASE-CHECKLIST.md`.
