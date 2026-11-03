# Tender Intelligence Module — Setup & Architecture

The website's next evolution: search, check and build South African government
tenders, powered by a real tender **database** (open + closed/awarded) and an
AI layer running on **DeepSeek + Claude**.

Live at: `https://your-site/tenders/`

---

## What it does

- **Tender database** — open tenders (to bid on) and closed/awarded tenders
  (market intelligence), synced daily from the **official National Treasury
  eTenders OCDS API** (`ocds-api.etenders.gov.za`, OCID prefix `ocds-9t57fa`,
  data from Feb 2017 onward).
- **Search & browse** by keyword, category (goods/services/works) and status.
- **Tender detail** with a standard SA bid-readiness checklist (CSD, SARS tax
  pin, B-BBEE, SBD 1/4/6.1, CIPC, CIDB where relevant).
- **Track tenders** and save **bid drafts** (stored on the user's device —
  IndexedDB `mlr-tenders` — same honest storage model as the labour app).
- **Four AI tools** per tender, grounded in the closed-tender database:
  1. *Summarise & extract requirements* (DeepSeek — cheap tier)
  2. *Bid-readiness check* against the user's company profile (Claude)
  3. *Market benchmark* — award-value stats from closed tenders (DeepSeek)
  4. *Draft bid sections* — cover letter, approach, compliance, with
     [bracketed gaps] for facts only the bidder knows (Claude)
- **Always works**: with no AI keys, every tool runs a rule-based built-in
  simulation (requirement extraction, keyword readiness check, local
  median/min/max benchmark, bid skeleton) — clearly labelled as such.

## The files

| File | Role |
|---|---|
| `tenders/index.html` | The whole module UI (self-contained page) |
| `netlify/functions/tenders-sync.js` | **The database builder** — scheduled daily (`netlify.toml`), pulls a rolling 120-day window from the OCDS API, merges into a capped 8,000-row index in **Netlify Blobs** (store `tenders`, keys `index` + `meta`). Closed/awarded history accumulates across runs. |
| `netlify/functions/tenders.js` | **The query API** — search/filter the index; falls back to a live 45-day OCDS proxy if Blobs isn't active yet, so the feature never dead-ends. Single-release detail is always fetched live. |
| `netlify/functions/tender-ai.js` | **The AI layer** — DeepSeek (`deepseek-chat`) for cheap tasks, Claude (`claude-3-5-haiku`) for drafting/analysis, each mode falling back to the other provider, and to `{fallback:true}` (→ page simulation) with no keys. |

## Database row shape (the index)

```json
{ "ocid": "ocds-9t57fa-…", "title": "", "desc": "", "buyer": "",
  "category": "goods|services|works|unspecified", "province": "",
  "published": "ISO", "closing": "ISO",
  "status": "open|closed|awarded",
  "valueZAR": null, "awardValueZAR": null,
  "awardedTo": null, "awardDate": null }
```

## Setup (3 steps)

1. **Deploy** — the functions ship with the repo; `@netlify/blobs` is in
   `package.json` and the daily schedule is in `netlify.toml`. After the first
   deploy, trigger the first sync once by visiting
   `/.netlify/functions/tenders-sync` (or wait for the daily run).
2. **Keys** (Netlify → Site settings → Environment variables):
   `DEEPSEEK_API_KEY` (platform.deepseek.com — very cheap) and the existing
   `CLAUDE_API_KEY`. Either alone works; both gives the full routing.
3. That's it. No keys → the module runs on simulation; no Blobs → live-proxy
   mode with a shorter window. It degrades honestly, never breaks.

## Honest limits — read these

- **Coverage**: Treasury's own publication policy says this data is *not* a
  complete record of SA procurement — municipalities and SOEs share
  voluntarily. Award values are often missing. Benchmarks are indicative.
- **Verification**: tender conditions, briefing sessions, returnable documents
  and exact closing times **must be verified on etenders.gov.za** before
  bidding. The UI says this everywhere it matters.
- **AI drafts** carry [bracketed gaps] and an explicit human-review
  disclaimer; the system prompt forbids inventing tender facts or prices and
  forbids stating market figures as guarantees.
- **Storage split**: the *market database* is server-side (Netlify Blobs —
  shared, synced); the *user's* tracked tenders and drafts are device-local
  (IndexedDB), consistent with the platform's privacy posture.
- **Netlify Blobs limits**: the free tier comfortably holds the ~8,000-row
  index (a few MB). If you later want the full 2017-onward archive or
  full-text tender documents, that's the trigger to move to a real database
  (Supabase/Neon) — the query function is the only thing that would change.

## Product note (same principle as the employer fork)

Tender Intelligence serves a **different audience** (businesses bidding for
government work) than the labour app (employees in disputes). It's built as a
fully self-contained page + functions precisely so it can be split into its
own brand/product later without surgery — the same discipline applied to S16.
For now it lives at `/tenders/` and shares the Trusted Counsel design system.
