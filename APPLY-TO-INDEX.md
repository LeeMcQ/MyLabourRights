# MyLabourRights — APPLY TO INDEX.HTML
## Complete merge guide for all accumulated fixes

This document tells you exactly which file maps to which location in `index.html`.
Apply these changes **in the order shown** — they build on each other.

---

## Files that REPLACE existing repo files directly

| Output file | Repo destination | Action |
|-------------|-----------------|--------|
| `netlify/functions/ai.js` | `netlify/functions/ai.js` | **REPLACE** existing file entirely |
| `netlify/functions/blog.js` | `netlify/functions/blog.js` | **REPLACE** existing file entirely |
| `.github/workflows/legal-review-reminder.yml` | `.github/workflows/legal-review-reminder.yml` | **NEW FILE** (create directory if needed) |
| `ccma-articles.js` | `ccma-articles.js` | **NEW FILE** in repo root |
| `tests/verify-all-fixes.js` | `tests/verify-all-fixes.js` | **NEW FILE** (create `tests/` directory) |

---

## Files that PATCH `index.html`

Apply each patch by searching for the named function or constant in `index.html`
and replacing it with the version from the patch file.

### PATCH ORDER (apply in this sequence):

---

### 1. `patches/CASE-AI-LOGIC.patch.js` → `index.html` script block

Find each constant/function by name and replace the entire declaration:

| Search for | Replace entire declaration with section from patch |
|------------|--------------------------------------------------|
| `const TOPIC =` | Section 1 — TOPIC CLASSIFICATION |
| `const OFFTOPIC` or `const OFFTOPIC_HARD` | Section 1 — OFFTOPIC_HARD / OFFTOPIC_SOFT |
| `function classifyOffTopic` | Section 1 — classifyOffTopic() |
| `const FOLLOWUPS =` | Section 2 — FOLLOWUPS |
| `const LEGAL_FACTS =` | Section 3 — LEGAL_FACTS |
| `function checkLegalFactsStaleness` | Section 3 — checkLegalFactsStaleness() |
| `function classifyDispute` | Section 4 — classifyDispute() |
| `const S187_PATTERNS =` | Section 5 — S187_PATTERNS |
| `function detectS187` | Section 5 — detectS187() |
| `const ESCALATION_RULES =` | Section 5 — ESCALATION_RULES |
| `function detectEscalation` | Section 5 — detectEscalation() |
| `const SIGNALS =` | Section 6 — SIGNALS |
| `function successRate` | Section 10 — successRate() |
| `const CITATIONS` | Section 11 — CITATIONS additions |
| `const PROCESSING_NOTICE =` | Section 12 — PROCESSING_NOTICE |

Add **new** functions (not replacements — just insert near related code):
- `MUTUAL_SEPARATION_ATTACK` object → add to existing `EmployerAttack.ATTACKS` array
- `INTERNAL_REMEDIES_ATTACK` object → add to existing `EmployerAttack.ATTACKS` array
- `function mapOutcomeToLRARelief` → add after Settlement object
- `function shouldShowProcessingNotice` → add after PROCESSING_NOTICE
- `function markProcessingNoticeSeen` → add after shouldShowProcessingNotice

---

### 2. `patches/index-engine.patch.js` → `index.html` script block

Find each constant/function by name and replace, OR add new items:

| Search for | Action |
|------------|--------|
| `const FORUM_PATTERNS =` | **REPLACE** with updated version (includes EPWP + gig economy) |
| `const SECTOR_PATTERNS =` | **REPLACE** with updated version (includes taxi + gig + EPWP) |
| `function detectForum` | **REPLACE** |
| `function detectSector` | **REPLACE** |
| `function detectCOIDA` | **REPLACE** (or ADD if not yet present) |
| `const Deadline =` or `const DEADLINE_DAYS =` | **REPLACE** with updated version (adds `urgentDeadline` flag) |
| `function classifyDispute` | **REPLACE** with updated version |
| `const Backend =` | **REPLACE** `Backend.ai()` method with updated version (passes all flags) |
| `function successRate` | **REPLACE** (no engagement fallback) |
| `function renderDeadlineAlert` | **REPLACE** with 3-level version (warning / critical / emergency) |

Add **new** functions (insert near related code):
- `detectProgressiveDisciplineAbuse()` → add after `detectS187()`
- `buildEEAParallelAdvisory()` → add after `detectS187()`
- New `FOLLOWUPS` banks (foreign_national, progressive_discipline, ulp_warning, garnishee, gig_economy) → add inside existing FOLLOWUPS object
- New `SIGNALS` entries (maternity/BCEA s26, garnishee/EAO, progressive discipline, gig deactivation) → add to SIGNALS array

Also apply **respond() patch notes** from Section 13 of the patch:
- Replace OFFTOPIC check with classifyOffTopic() split
- Add forum alert injection after AI response
- Add sector detection on first message
- Add COIDA detection
- Store subType on caseObj
- Add s187 local defence-in-depth check

---

### 3. `patches/UI-PATCHES.html` → `index.html`

| What | Where in index.html |
|------|---------------------|
| POPIA privacy notice text | Find existing privacy notice section → replace inner HTML with template from patch |
| Staleness banner HTML | Add immediately after `<div id="app">` opens |
| Processing notice modal | Add before `</body>` |
| Init script | Add before `</body>`, after all other scripts |

Also add the **urgency alert CSS** from the CSS comment block in this file into the existing `<style>` block.

---

### 4. `prepare-tab-fix.html` → `index.html`

| What | Where |
|------|-------|
| CSS block (marked `<style id="prepare-tab-styles">`) | Add to existing `<style>` block |
| REPLACE BLOCK (`<div id="tab-prepare">`) | Find `<div id="tab-prepare" class="tabview">` and replace the ENTIRE div |
| JS block (`<script id="prepare-tab-js">`) | Add inside existing `<script>` tag near other render functions |

---

### 5. `site-patch-v3.js` → `index.html`

#### 5a — "Lee" → "Adv. Lee" (do this with Find & Replace in your editor)

Use **Find All → Replace All** for each:

| Find | Replace |
|------|---------|
| `Chat with Lee` | `Chat with Adv. Lee` |
| `Talk to Lee` | `Talk to Adv. Lee` |
| `Ask Lee` | `Ask Adv. Lee` |
| `Lee can help` | `Adv. Lee can help` |
| `>Lee<` | `>Adv. Lee<` |
| `placeholder="Ask Lee` | `placeholder="Ask Adv. Lee` |
| `aria-label="Lee"` | `aria-label="Adv. Lee"` |
| `You are Lee` | `You are Adv. Lee` |
| `our AI labour-law advisor` | `our AI labour law advocate` |

**Do NOT replace** `LeeMcQ`, `mcquir4l`, any URL, or the word `feel`.

Also update the `og:description` meta tag to say `Adv. Lee`.

#### 5b — Remove "Step 1 of 3" wizard

Search for and DELETE these patterns anywhere they appear:
- `Step 1 of` (and surrounding container)
- `intake-wizard`
- `intake-options`
- `Wat het by die werk gebeur`

Add to your `<style>` block (copy from `WIZARD_HIDE_CSS` in the patch):
```css
.intake-wizard,
#intake-wizard,
[class*="step-indicator"],
[class*="intake-options"],
.step-counter {
  display: none !important;
  visibility: hidden !important;
}
```

Add as the **FIRST script in `<head>`** (prevents flash before CSS loads):
```html
<script>
(function(){
  var style = document.createElement('style');
  style.textContent = '.intake-wizard,#intake-wizard,[class*="step-indicator"],[class*="intake-options"],.step-counter{display:none!important}';
  document.head.appendChild(style);
})();
</script>
```

Replace the wizard container in the DOM with:
```html
<div id="intake-entry" class="intake-entry">
  <!-- renderIntakeEntry() writes here -->
</div>
```

Add `renderIntakeEntry()` function to the script block (copy from site-patch-v3.js).

#### 5c — i18n (full front-page translation)

1. Find the existing `const STRINGS = {` object in `index.html`
2. **Merge** (add missing keys) from the `STRINGS` object in `site-patch-v3.js`
3. If no `STRINGS` object exists yet, add the entire object from the patch
4. Add `applyLang()` function (copy from patch) alongside the existing `setLang()` function
5. Add `applyLang(lang)` call inside `setLang()` / `switchLang()` after the existing logic
6. Add `data-i18n` attributes to HTML elements as documented in the patch

#### 5d — CCMA Rules corrections (apply to any content blocks in index.html)

Search for these patterns and fix:
- `"14 days"` in arbitration context → `"21 days"` (only for arbitration, not conciliation)
- Con-arb objection text → add "7 days written notice" requirement
- Condonation text → add "at the same time as your referral"
- Postponement text → add "7 days before the hearing" threshold
- CCMA hours → "08:30 to 16:30" and "documents may be faxed at any time"
- Update CCMA office addresses with `CCMA_OFFICES` array from the patch

#### 5e — Update `netlify/functions/blog.js`

Already done — the updated `blog.js` in this package is the latest version.

---

## New files added to the repo

### `ccma-articles.js` (repo root)

8 articles sourced directly from the official CCMA Rules document. To publish them:

**Option A — Browser console** (fastest):
```js
// On the live site, open F12 → Console, paste:
const script = document.createElement('script');
script.src = '/ccma-articles.js';
document.head.appendChild(script);
// Then after it loads:
importCCMAArticles();
```

**Option B — Admin panel import**:
If your admin panel has a JSON import field, paste the `CCMA_ARTICLES` array.

**Option C — Direct IndexedDB** (if no admin panel):
```js
// In browser console on live site:
for (const a of CCMA_ARTICLES) {
  await DB.put('articles', { ...a, status: 'published', _manual: true });
}
```

### `tests/verify-all-fixes.js`

Run with `node tests/verify-all-fixes.js` before every deploy.
Expected result: `129 tests — 129 passed, 0 failed`.

### `.github/workflows/legal-review-reminder.yml`

Automatically opens a GitHub Issue every 1 March (NMW update) and 1 November
(BCEA threshold window) reminding you to verify legal figures before deploying.
No configuration needed — it uses your existing repo permissions.

---

## Quick checklist before committing

- [ ] `netlify/functions/ai.js` replaced
- [ ] `netlify/functions/blog.js` replaced  
- [ ] `index.html` — CASE-AI-LOGIC patch applied (Section 1–12)
- [ ] `index.html` — Engine patch applied (Forum, Sector, Deadline, Backend.ai)
- [ ] `index.html` — UI patches applied (staleness banner, processing notice, POPIA)
- [ ] `index.html` — Prepare tab fixed (no more blank Prepare tab)
- [ ] `index.html` — "Lee" → "Adv. Lee" (Find & Replace complete)
- [ ] `index.html` — "Step 1 of 3" wizard removed / hidden
- [ ] `index.html` — `data-i18n` attributes added, `STRINGS` merged
- [ ] `index.html` — CCMA Rules corrections applied (14→21 days, 7-day con-arb, etc.)
- [ ] `ccma-articles.js` added to repo root
- [ ] `.github/workflows/legal-review-reminder.yml` added
- [ ] `tests/verify-all-fixes.js` added
- [ ] Run `node tests/verify-all-fixes.js` → 129/129 pass
- [ ] Test on mobile (Android Chrome) — check i18n switch, Prepare tab, chat placeholder

---

## Commit message (suggested)

```
feat: Panel 1 legal fixes, Batch 1+2 bug fixes, LLM optimisation, CCMA articles

- Panel 1 (Adv. Dlamini SC): 15 legal accuracy fixes incl. s187 proactive
  detection, constructive dismissal sub-type, condonation, settlement agreement
  detection, POPIA compliance, staleness enforcement
- Batch 2 bug fixes: garnishee/NCA, EPWP, gig/s200A, foreign nationals,
  progressive discipline, EEA parallel deadlines, maternity BCEA s26
- 129 automated tests, all passing
- Rename AI advisor: Lee → Adv. Lee throughout
- Remove broken Step 1 of 3 intake wizard
- Add full i18n for front page (EN/AF/ZU)
- Fix CCMA Rules alignment: 21-day arbitration notice, 7-day con-arb objection,
  simultaneous condonation filing, service-before-filing requirement
- Add 8 CCMA Rules articles (sourced from official document)
- Annual legal review GitHub Actions workflow
```
