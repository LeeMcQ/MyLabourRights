# MyLabourRights — Research-Backed Upgrade (LLM Routing, UX, Security)

This documents what was researched (current 2025–2026 best practice), what was
built, and what remains. Priority order, as requested: **(1) LLM routing,
(2) UX, (3) security.**

---

## 1. LLM Routing — built and tested

### What the research said
- **Rule-based classification first.** A simple difficulty classifier "covers
  ~70% of routing wins for ~5% of the engineering effort" — do this before any
  ML router. (BuilderWorld, Morph, TianPan, Jan–Apr 2026.)
- **Cascade with escalation.** Try the cheap model; if its answer fails a
  quality check, escalate to the capable model. Typical result: **50–85% cost
  reduction with under ~2% quality loss on hard tasks.**
- **Don't trust self-reported confidence.** Models sound confident while wrong;
  use *heuristic* output checks instead. (TianPan, Maxim.)
- **Beware "routing collapse."** Routers that always default to the expensive
  model waste the whole point (arXiv 2602.03478). Our classifier must justify
  every escalation.

### What was built (`netlify/functions/ai.js`, v2)
A three-tier router with a cascade and a collapse guard:

| Tier | Routed to | Example questions |
|---|---|---|
| **easy** | Gemini Flash (free), light prompt | "Hi", "What is the CCMA?", "How do I upload?" |
| **medium** | Gemini Flash (free), full prompt | "My boss has been unfair, what are my options?" |
| **hard** | Claude (capable, paid) | "Was I unfairly dismissed? My chances at the CCMA?" |

- **Classifier:** keyword signals (LRA/BCEA/CCMA, "unfair dismissal", "my
  chances", "legal grounds"…) + length + a CCMA-case bias. Definitional
  questions ("what is X") stay *easy* even when they name a legal body; the
  same words about *your own matter* ("my chances at the CCMA") go *hard*.
- **Cascade:** an easy/medium answer that looks weak (too short, "I'm not
  sure", "consult a lawyer", admits inability) is automatically re-asked to
  Claude. Heuristic check — not self-reported confidence.
- **Collapse guard:** hard tier is only chosen when hard signals actually
  fire; everything else starts cheap.
- **Graceful degradation:** Gemini-only, Claude-only, both, or neither (built
  in simulation) all work.
- **Transparency:** the response carries `tier` and `provider` so the UI can
  honestly reflect which model answered (research: trust cues should match
  *actual* reliability).

**Tested:** 15/15 classifier cases, 13/13 security+cascade unit tests, 9/9
handler tests (validation, rate-limit, routing, fallback), 13/13 app
regression. All green.

### Expected savings
On a realistic mix where most messages are greetings, status checks and
medium questions, the bulk of traffic stays on **free Gemini**, and only
genuine legal-analysis turns hit paid Claude — in line with the 50–80%
reduction the research reports.

---

## 2. UX — research applied

### What the research said (legal-tech + low-digital-literacy, 2025)
- **Plain language, no jargon.** Users scan under stress; minimalist = trust.
- **Progressive disclosure.** Ask only essential fields; explain *why* each is
  needed; defer the rest.
- **Trust cues must match real reliability.** Don't over-claim AI certainty;
  allow human override; be transparent when unsure.
- **Be kind in errors.** Never shame; forgiving, clearly-worded messages.

### What was applied
- The public site was already simplified (lean hero, one-line trust strip,
  minimal feature list, plain FAQ) in the previous step — consistent with the
  "minimalist = trustworthy" finding.
- **AI honesty built into the system prompt:** "Use plain language a
  non-lawyer understands… If you are unsure, say so plainly rather than
  guessing." This operationalises the "doubt it when unsure" trust guideline.
- **Kind rate-limit message** instead of a hard error: "You're sending
  messages very quickly — please wait a moment," rather than a 429 surfaced
  raw to the user.
- **Routing transparency** so the interface can reflect which model answered
  rather than implying uniform certainty.

### Recommended next (not yet built — would need your go-ahead)
- Surface a small, honest "answered by" line on AI messages when Claude vs
  Gemini handled it (the data is already returned).
- A first-question example-chips row ("I was dismissed", "My pay is short",
  "Bad contract") to lower the blank-input barrier for low-literacy users.
- Inline "why we ask" microcopy on the case-creation fields.

---

## 3. Security — what was hardened, and the honest ceiling

### What the research said (OWASP LLM Top-10 2025)
- **Prompt injection (LLM01)** is the #1 risk and unsolved — layer defences:
  input validation, context isolation, output validation, least privilege.
- **Sensitive-info disclosure (LLM02)** rose to #2.
- Treat AI endpoints like public endpoints: **auth, strict input validation,
  token/behavioural rate limiting.**
- Security headers (Helmet-style), length caps, pattern filtering.

### What was built into `ai.js`
- **Input validation:** type check, 4 000-char cap, history capped to 12 turns
  and shape-filtered.
- **Prompt-injection screening:** known jailbreak patterns are flagged; a
  flagged message is forced to at least the hardened "medium" prompt rather
  than the light one.
- **Context isolation (LLM01 defence-in-depth):** user text is fenced in
  `<user_input>` tags with an instruction to treat it as *data, never
  commands* — even if it asks the model to change role.
- **Output sanitisation:** strips any leaked system-prompt text before
  returning.
- **Rate limiting:** per-IP, 15 calls/minute (best-effort, in-memory).
- **Least privilege / secret hygiene:** keys are only ever read from env and
  never echoed; `X-Content-Type-Options: nosniff` set.
- Existing security headers in `netlify.toml` (X-Frame-Options, Referrer-
  Policy, Permissions-Policy) remain.

### The honest ceiling — what this stack *cannot* be yet
The app is a frontend prototype with **IndexedDB (local, per-device)** storage
and **no real user authentication**. So, truthfully:
- There is **no server-side auth** — anyone with the URL uses it as a guest.
  "Bank-grade" access control needs a real auth provider (e.g. Supabase Auth,
  Auth0) and a server database.
- The **rate limit is best-effort** (resets when the serverless instance cools)
  — for hard guarantees use a shared store (Upstash Redis / Netlify Blobs).
- **Documents live in the browser**, not encrypted server storage. Real
  confidentiality for uploaded evidence needs server-side encrypted storage.
- **POPIA compliance** is partially addressed (data minimisation, local
  storage, disclaimers) but full compliance needs the above backend plus a
  privacy policy, consent records and a data-deletion path.

These are not quick toggles — they are a backend project. Everything that
*can* be hardened on the current stack, has been.

---

## What changed in this update

| File | Change |
|---|---|
| `netlify/functions/ai.js` | **Rewritten** — routing engine, cascade, full security hardening |
| `index.html` (app) | Connector now carries `tier`/`provider`, handles rate-limit gracefully |
| `.env.example` | Documents the routing behaviour and key combinations |

Nothing else was touched. The public site, admin panel, other functions, PWA
files and the app's existing functionality are unchanged and still pass their
tests.

---

## Passing case context to the model (optional, for when you go live)

The Phase 1 & 2 features store useful structured facts on each case:
`disputeKey`, `incidentDate`, `desiredOutcome`, `settlementFloor`,
`issueRows`, and `settlementPicked`. The built-in simulation already uses
these. When you switch on the live AI (Gemini/Claude), you can let the real
model use them too, for sharper answers.

**Where:** in `index.html`, find the `Backend.ai` connector (search for
`ccmaValidity`). It already sends `persona`, `history` and `userText`. To pass
the case context, add a short summary line to the payload, for example:

```js
caseContext:
  `Dispute type: ${caseObj.disputeKey || 'unclassified'}. ` +
  `Incident date: ${caseObj.incidentDate || 'unknown'}. ` +
  `Desired outcome: ${caseObj.desiredOutcome || 'unstated'}.`
```

Then in `netlify/functions/ai.js`, append that `caseContext` to the system
prompt before the call. This is optional — the app works without it — but it
makes the live model's guidance match what the user told the deadline and
outcome tools. Keep it to non-identifying facts (no names/ID numbers) to stay
aligned with the privacy posture above.
