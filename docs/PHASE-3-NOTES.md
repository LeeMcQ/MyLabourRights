# Phase 3 — What was built, and the two deliberate exceptions

This records the Phase 3 work so you (or anyone who picks this up later) knows
exactly what's done, what's intentionally *not* here, and what still depends on
the future backend project.

---

## Built and working (tested: 47/47)

| Item | What it does | Where to find it |
|------|--------------|------------------|
| **S15 · CCMA form pre-fill** | Drafts LRA 7.11 (referral), 7.13 (arbitration), 7.18 (certification) and a condonation application from the case data. Editable, with copy + download. | AI Actions → "CCMA forms (pre-filled)" |
| **S18 · Consent-safe marketing** | Email / SMS / WhatsApp consent toggles, nothing pre-ticked, saved with a timestamp (POPIA s69). | Sidebar → Privacy & settings |
| **S17 · Privacy / POPIA (client half)** | Download-my-data and delete-my-local-data controls; retention period shown. | Sidebar → Privacy & settings |
| **S19 · WCAG 2.2 AA pass** | Keyboard focus rings, reduced-motion support, dialog roles + focus management + Escape on all modals, `aria-live` on chat and voice status, labels on icon buttons. | Throughout |
| **S20 · Legal-update changelog** | A dated record of legal changes, paired with the versioned legal facts (S4). | Sidebar → Privacy & settings |

---

## Exception 1 — S16 (employer-side product): deliberately NOT built here

**Decision: this should be a separate product, not a feature of this app.**

The strategy document is explicit that you should **serve one side per product**
to avoid conflicts of interest, and recommends **employees first**. Bolting
employer/HR features onto the employee app is the exact thing it warns against:

- A single platform that advises *both* an employee and their employer on the
  same kind of dispute has an inherent conflict — the advice that helps one
  side can hurt the other.
- The messaging, tone, intake questions, and even the legal framing differ by
  side. Mixing them confuses users and weakens trust on both sides.
- It muddies the "who carries professional responsibility" line that the LPC
  ethics position depends on.

**The right way to do S16 when you're ready:** fork this codebase into a
second project (e.g. `MyLabourRights-Employer`). It can reuse the same engine
modules (deadline calculator, classifier, document desk, routing) but with:
employer-oriented intake, disciplinary-process tools, compliance checklists
(EEA sector targets, etc.), and its own branding and disclaimers. Keep the two
products visibly separate so a user always knows which side the tool serves.

I did not build a "stub" for this on purpose — a half-employer feature inside
the employee app would be worse than nothing, because it creates exactly the
conflict the document tells you to avoid.

---

## Exception 2 — S17 backend half: needs the future backend project

The **client half** of S17 is built (the buttons, the consent records, the
local export/delete, the retention notice). The **server half cannot be done
on the current stack** because the app stores data in the browser (IndexedDB)
with no server login. When you build the real backend, wire these up:

- **Real deletion:** the "Delete my data" button currently clears *this
  device*. Server-side, it must also erase the user's records from the
  database. The code has a marked `NOTE:` at the deletion handler.
- **Consent proof:** consent is saved locally with a timestamp. POPIA wants a
  durable, server-side record of when and how consent was given. The consent
  handler has a marked `NOTE:` to POST the record server-side.
- **Retention enforcement:** the "6 months after subscription ends" policy is
  shown to users but must be *enforced* by a scheduled server job that actually
  deletes expired data.
- **Operator contracts & breach notification:** these are organisational/legal
  processes (contracts with any service that processes data for you, and a
  notify-the-Regulator workflow). They live outside the code entirely.

None of these are quick toggles — they're the backend project. Everything that
*can* be honestly done client-side, is done.

---

## A note on S15's legal accuracy

The CCMA form drafts are structured to match the real forms and are pre-filled
from the case data — genuinely useful as a starting point. But:

- The **official current forms** must be confirmed on `ccma.org.za` before
  lodging (form layouts change; each draft says this).
- The drafts leave **bracketed fields** for things only the user knows
  (employer address, case numbers, the explanation for a late referral).
- A **person should check** every draft before it's filed. The drafts are a
  preparation aid, not a substitute for that check — consistent with the
  escalation-flag approach used elsewhere in the app.
