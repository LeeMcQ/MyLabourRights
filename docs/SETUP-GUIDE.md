# MyLabourRights — Step-by-Step Setup Guide

This is everything **you** do by hand to take MyLabourRights from these files to a
live website. Follow it top to bottom. Nothing here needs coding — it is all
clicking, copying and pasting.

**Time needed:** about 30 minutes for a live site, plus ~15 minutes per
service you switch on later.

**Important:** the site works at every stage. Deploy it empty (no keys) and it
runs on the built-in simulation. Add keys later, one at a time, whenever you
are ready. You are never blocked.

---

## PART A — Get the site live (do this first, ~20 min)

### Step 1 — Create a GitHub account and repository
1. Go to **github.com** and sign in (or sign up — free).
2. Click the **+** top-right → **New repository**.
3. Name it `mylabourlaws`. Leave it **Public**. Click **Create repository**.

### Step 2 — Upload the site files
1. On the new repo page, click **uploading an existing file**.
2. From the `site/` folder, drag in **everything**:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `netlify.toml`
   - `package.json`
   - the whole `icons/` folder
   - the whole `admin/` folder
   - the whole `netlify/` folder
3. Scroll down, click **Commit changes**.

> Tip: if drag-and-drop won't take folders, create the folder by typing
> `icons/icon-192.png` as the filename when uploading — GitHub makes the
> folder automatically. Easiest is to install GitHub Desktop and drag the
> whole `site` folder in at once.

### Step 3 — Deploy on Netlify
1. Go to **netlify.com** → **Sign up** → choose **Sign up with GitHub**.
2. On your Netlify dashboard click **Add new site** → **Import an existing
   project** → **Deploy with GitHub**.
3. Authorise Netlify, then pick your `mylabourlaws` repository.
4. Leave all build settings as they are (the `netlify.toml` handles it).
   Click **Deploy**.
5. Wait about a minute. Netlify gives you a live URL like
   `https://shiny-name-12345.netlify.app`.

### Step 4 — Check it works
1. Open your new URL on a phone and on a computer.
2. You should see the MyLabourRights landing page.
3. Sign up, click through the 4 onboarding tips, create a case, chat with the
   AI. **It all works right now** — using the built-in simulation.

### Step 5 — (Optional) Give it a nicer name
1. In Netlify: **Site configuration** → **Change site name**.
2. Pick something like `mylabourlaws` → URL becomes
   `https://mylabourlaws.netlify.app`.
3. Later, to use your own domain (e.g. `mylabourlaws.co.za`): **Domain
   management** → **Add a domain** and follow the instructions.

**At this point you have a live, working website.** Everything below is
upgrading it from simulation to real services.

---

## PART B — Switch on the real AI (~15 min, free)

The AI works as a simulation until you add a key. To make it a real
Gemini-powered attorney:

### Step 6 — Get a free Gemini key
1. Go to **aistudio.google.com/apikey** and sign in with a Google account.
2. Click **Create API key** → **Create API key in new project**.
3. Copy the key (a long string starting with `AIza...`).

### Step 7 — Add the key to Netlify
1. Netlify dashboard → your site → **Site configuration** → **Environment
   variables**.
2. Click **Add a variable** → **Add a single variable**.
3. Key: `GEMINI_API_KEY`  — Value: paste your key. Click **Create variable**.
4. Go to **Deploys** → **Trigger deploy** → **Deploy site**.

### Step 8 — Test the real AI
1. Open your site, start a case, send a message in the AI chat.
2. Responses now come from real Gemini. (If a key is ever wrong or the
   service is down, it silently falls back to the simulation — the site never
   breaks.)

### Step 9 — (Optional) Add Claude for the dual-engine opinion
Your spec calls for Gemini **and** Claude combined. Claude is paid (very
cheap per message, but it needs a card).
1. Go to **console.anthropic.com**, sign up, add a payment method.
2. **API Keys** → **Create Key** → copy it.
3. In Netlify, add another variable: `CLAUDE_API_KEY` = your key.
4. Trigger a deploy. The backend now calls both and merges the opinions.

> Skip this if you want to stay free — Gemini alone runs the AI fine.

---

## PART C — Switch on real payments (~20 min)

Until you do this, the "Unlock" button instantly unlocks the case (simulated).
To take real R199 / R99 / R100 payments:

### Step 10 — Create a PayFast account
1. Go to **payfast.co.za** → **Sign up** → choose a **Merchant** account.
2. Complete the registration (they verify your bank details — this can take
   a day or two).

### Step 11 — Get your PayFast credentials
1. In PayFast: **Settings** → **Integration**.
2. Copy your **Merchant ID** and **Merchant Key**.
3. Set a **Passphrase** (any strong phrase) and save it. Copy that too.

### Step 12 — Add payment keys to Netlify
Add these four environment variables (same way as Step 7):
- `PAYFAST_MERCHANT_ID` = your merchant ID
- `PAYFAST_MERCHANT_KEY` = your merchant key
- `PAYFAST_PASSPHRASE` = your passphrase
- `PAYFAST_MODE` = `sandbox`  (keep it sandbox until you've tested)

Trigger a deploy.

### Step 13 — Test in sandbox
1. PayFast has a **sandbox** for fake test payments — see their sandbox docs
   for the test card details.
2. On your site, let a trial expire (or use a fresh case), click **Unlock**.
3. You should be redirected to PayFast, complete the test payment, land back
   on your site with the case unlocked.

### Step 14 — Go live
1. When the test works, change `PAYFAST_MODE` to `live` in Netlify.
2. Trigger a deploy. You are now taking real payments.

> One thing to update: open `netlify/functions/pay.js` and change the
> `your-site.netlify.app` placeholder URLs to your real site URL, commit the
> change. (Two lines, near the `return_url` / `notify_url` fields.)

---

## PART D — Switch on the blog workflow (~15 min)

This runs the spec workflow: AI writes a draft → emails it to you → you
approve/edit → publish → auto-post to social media.

### Step 15 — Get a free email-sending key
1. Go to **resend.com** → sign up (free tier is plenty).
2. **API Keys** → **Create API Key** → copy it.

### Step 16 — Add blog variables to Netlify
- `RESEND_API_KEY` = your Resend key
- `APPROVAL_EMAIL` = your own email address (where drafts get sent)

(`GEMINI_API_KEY` from Step 7 is reused for writing the drafts.)
Trigger a deploy.

### Step 17 — Use the admin panel
1. Go to `https://your-site.netlify.app/admin`.
2. **Step 1:** type a topic, click **Generate draft**. The AI writes it and
   emails it to you.
3. **Step 2:** review the draft in the form, edit anything, click
   **Publish & share**.
4. **Step 3:** click **Copy as data.js entry**.

### Step 18 — Make the article permanent
The backend is stateless, so a published article must be saved into the site:
1. In your GitHub repo, the article content lives in the `BLOG_POSTS` list.
   (It is inside `index.html` — search for `window.BLOG_POSTS`.)
2. Paste the copied entry into that list, just after the `[`.
3. Commit. Netlify redeploys automatically. The article is now live for
   everyone.

### Step 19 — (Optional) Social auto-posting
To auto-post published articles to Facebook:
1. You need a Facebook **Page** and a **Page access token** (via
   developers.facebook.com — this is the fiddliest step; their docs walk
   through it).
2. Add `FACEBOOK_PAGE_TOKEN` and `FACEBOOK_PAGE_ID` to Netlify.
3. LinkedIn works similarly with `LINKEDIN_TOKEN` (LinkedIn's developer
   approval takes longer — do this last).

> Until these are set, publishing still works — it just doesn't auto-post.
> You can always share the link manually.

---

## PART E — Google sign-in (advanced, optional)

The "Continue with Google" button currently creates a demo account. Real
Google verification needs an OAuth client from **console.cloud.google.com**
(APIs & Services → Credentials → OAuth client ID). This is the most technical
step — consider leaving it until the site is established, or have a developer
do this one part. Email signup works fully without it.

---

## PART F — Voice mode (already built — nothing to set up)

The AI attorney can be **spoken to** and **speaks back**, and it takes notes
from the conversation. This is already working — there is **no key and no
setup needed**. A few things to know:

- It uses the phone or computer's built-in speech, so it is **free** and
  works in **English and Afrikaans**.
- The microphone only works on a **secure (HTTPS) address**. Netlify gives
  every site HTTPS automatically, so once deployed it just works. (It will
  *not* work if you open the file directly from your computer — that is
  normal.)
- The first time a user taps the microphone, the browser asks permission to
  use the mic. They must tap **Allow**.
- There are two modes, both built in: **Push to talk** (tap, speak, tap to
  stop) and **Hands-free call** (the AI listens, replies aloud, then listens
  again — like a phone call).
- After a voice conversation, the AI pulls out the important facts into the
  **Case Notes** tab — missing warnings, verbal promises, witnesses, dates —
  which the user reviews and confirms.
- Browser speech recognition is good but not perfect, and Afrikaans is a
  little weaker than English. If you later want higher accuracy, a paid
  speech API can be added the same way the AI keys are — but it is not
  needed to launch.

---

## PART G — Legal-precision features (already built — nothing to set up)

These work the moment the site is live, with no keys and no external setup.
They run on the user's device.

- **Deadline calculator & dispute classifier** (Dashboard): the user picks
  what happened and the incident date; the site shows the correct CCMA
  referral deadline with a live countdown, flags missed deadlines, and
  explains condonation.
- **Forum router** (Dashboard): a visual map of where the matter goes next
  (CCMA conciliation → arbitration or Labour Court).
- **Outcome capture** (Dashboard): asks what the user actually wants
  (reinstatement, compensation, etc.) and tailors the AI's guidance.
- **Case Builder tab**: an issue matrix (best / worst / disputed facts), a
  settlement-prep checklist, and a live case-file readiness score.
- **Mock cross-examination** (AI Actions): an interactive drill of the hostile
  questions the other side will ask, with gentler pacing for sensitive
  (harassment / discrimination) matters.
- **Citation layer**: the combined legal opinion shows the law relied on, how
  your documents ground it, and an honest confidence flag.
- **Escalation flags**: when a matter needs a human lawyer (discrimination,
  harassment, retirement-age dismissal, reviews, Labour Court), the AI says so
  in the chat.

**One thing worth doing when you go live with real AI:** these features store
useful facts on each case (dispute type, deadline, desired outcome). If you
want the live AI to *use* them in its answers, that wiring is noted in
`ROUTING-AND-SECURITY.md` under "passing case context to the model."

---

## Ongoing — how to update the site

Any time you want to change something:
1. Edit the file in your GitHub repo (click the file → pencil icon → edit).
2. Commit the change.
3. Netlify redeploys automatically within a minute.

To expand content (more blog posts, law firms, guides) **without writing
code**, edit the data file or use the admin panel for blog posts (Part D).

---

## Quick reference — what each service costs

| Service | Cost | Needed for |
|---|---|---|
| GitHub | Free | Storing the code |
| Netlify | Free tier | Hosting + backend |
| Gemini API | Free | The AI attorney |
| Claude API | Paid (cheap per use) | Dual-engine opinion (optional) |
| PayFast | Free account, ~2-3% per transaction | Taking real payments |
| Resend | Free tier | Emailing blog drafts to you |
| Facebook/LinkedIn | Free | Auto-posting (optional) |

You can run a fully working site on **only the free services**. Claude and
PayFast are the only paid items, and PayFast only costs you when you actually
earn money.

---

## If something goes wrong

- **Site won't deploy on Netlify** — check all files from `site/` were
  uploaded, especially `netlify.toml`.
- **AI gives generic answers** — that is the simulation; means `GEMINI_API_KEY`
  isn't set or the deploy didn't pick it up. Re-check Step 7 and trigger a
  fresh deploy.
- **Payment button just unlocks instantly** — PayFast keys aren't set; that is
  the safe fallback. Re-check Part C.
- **Admin panel says "backend unreachable"** — the site must be the live
  Netlify URL, not a file opened from your computer.
- **Changes not showing** — Netlify caches; do a hard refresh (Ctrl+Shift+R)
  or check the **Deploys** tab finished.
