# MyLabourRights — Complete Website Package

**Start here.** This folder contains your entire website. Everything needed to
run it is in this `caseguide-site` folder. This README explains what each file
is; **`SETUP-GUIDE.md` tells you exactly what to click to go live.**

---

## The 60-second version

1. The whole website is the files in this folder.
2. It **already works** with zero setup — it runs on a built-in simulation.
3. To make it a real, live website you do three external things, in order:
   **(A)** put the files online (GitHub + Netlify, free),
   **(B)** add a free AI key, **(C)** add payments.
4. **Open `SETUP-GUIDE.md` and follow it top to bottom.** It is plain-English,
   no coding, about 30 minutes for a live site.

---

## What you need to set up externally (the short list)

You will create free accounts on these. The setup guide walks through each one
with the exact buttons to press. You do **not** need all of them to launch —
the site works at every stage and you can add them one at a time.

| # | Service | What it's for | Cost | Needed to launch? |
|---|---------|---------------|------|-------------------|
| 1 | **GitHub** | Stores your website files online | Free | **Yes** |
| 2 | **Netlify** | Publishes the site to the internet, runs the secure functions | Free tier is plenty | **Yes** |
| 3 | **Google Gemini** | The free AI engine (easy/medium questions) | Free | Recommended |
| 4 | **Anthropic Claude** | The capable AI engine (hard legal questions) | Pay-per-use | Optional |
| 5 | **PayFast** | Takes real payments in Rand | Free account; ~2–4% per transaction | Only when charging |
| 6 | **Resend** | Sends the blog-approval emails | Free tier | Only for the blog workflow |
| 7 | **Facebook / LinkedIn** | Auto-posts approved blog articles | Free | Optional |
| 8 | **Google sign-in** | "Sign in with Google" button | Free | Optional / advanced |

**Minimum to be live and useful:** #1, #2, and #3 (GitHub + Netlify + Gemini).
That's free and takes about 35 minutes total.

---

## Every file in this package

### The website itself
| File | What it is |
|------|------------|
| `index.html` | **The entire app** — landing page, sign-up, the AI attorney, all 9 tabs (Dashboard, AI Attorney, Case Notes, Documents, Timeline, Case Builder, AI Actions, Law Firms, Resources). One self-contained file. |
| `admin/index.html` | The **blog admin panel** — where you approve AI-drafted articles before they publish. |
| `manifest.json` | Makes the site installable as a phone app (PWA). |
| `sw.js` | The "service worker" — lets the app load offline and feel app-like. |
| `icons/` | The app icons (scales-of-justice) for phone home screens and browser tabs. |

### The secure back-end (Netlify Functions)
These run on Netlify's servers, not in the browser, so your secret keys stay
hidden. You don't edit these — you just add keys in the Netlify dashboard.
| File | What it does |
|------|--------------|
| `netlify/functions/ai.js` | The **smart AI router** — sends easy questions to free Gemini, hard ones to Claude, with security hardening. |
| `netlify/functions/pay.js` | Starts a **PayFast** payment. |
| `netlify/functions/pay-notify.js` | Confirms a payment came through (PayFast notification handler). |
| `netlify/functions/blog.js` | The **blog pipeline** — AI drafts an article, emails you to approve, auto-posts to social. |

### Configuration files (already set up — don't usually touch)
| File | What it is |
|------|------------|
| `netlify.toml` | Tells Netlify how to build and where the functions live, plus security headers. |
| `_redirects` | Routing rules so the app's pages work correctly. |
| `package.json` | Lists the project's name and any dependencies. |
| `.env.example` | A **template** showing which keys exist. You copy these names into Netlify's dashboard (never put real keys in a file). |

### The guides (read these)
| File | Read it for |
|------|-------------|
| **`SETUP-GUIDE.md`** | **The main event.** Step-by-step, click-by-click, to take the site live and switch on each service. |
| `ROUTING-AND-SECURITY.md` | How the AI routing saves you money, what security is built in, and the honest limits of this stack. |
| `README.md` | This file. |

---

## The recommended order

```
1. Read this README (you're here)            ✓
2. Open SETUP-GUIDE.md
3. Do PART A  → site is live on the internet  (free, ~20 min)
4. Do PART B  → real AI switched on           (free, ~15 min)
5. Try it, share it, get feedback
6. Do PART C  → payments, when you're ready    (~20 min)
7. Do PARTS D–F → blog, social, Google login   (optional, later)
```

You can stop after step 3 and have a real, shareable website. Everything after
that is making it more capable, one piece at a time.

---

## Two honest things to know before you start

1. **The site is a front-end prototype with browser-based storage.** Each
   user's cases live in *their own browser*, and there is no server login yet.
   That's perfect for launching, testing, and getting real users — but before
   you handle sensitive documents at scale or make strong privacy promises,
   you'll want a proper back-end (real accounts + encrypted server storage).
   `ROUTING-AND-SECURITY.md` explains exactly where that line is. I'd rather
   you know this now than discover it later.

2. **The legal logic is a strong preparation aid, not legal advice.** The
   deadline calculator, classifier and AI opinions are built to be accurate and
   genuinely useful, but they're designed to get a person *ready* — the
   built-in escalation flags exist precisely to push genuinely complex matters
   to a human attorney. Keep the "not a law firm" framing that's already on the
   site; it's both ethically right and legally safer for you.

---

## If you get stuck

`SETUP-GUIDE.md` has an **"If something goes wrong"** section at the end with
the most common issues and fixes. Work through it there first — most problems
are a missing key or a typo in the Netlify dashboard.
