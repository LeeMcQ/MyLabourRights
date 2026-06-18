/**
 * MyLabourRights — CLIENT-SIDE ENGINE PATCH
 * ═══════════════════════════════════════════════════════════════════════
 * Apply to index.html. Each section below replaces a matching block.
 * Search for the function/const name to find the exact replacement point.
 *
 * BUGS FIXED:
 *   1. Backend.ai() — not passing deadlineMissed, urgentDeadline, daysLeft,
 *      subType, settlementFlagged, caseContext to the server
 *   2. respond() — off-topic filter using old OFFTOPIC array (no soft/hard split)
 *   3. respond() — successRate engagement fallback still in respond() even
 *      after ai.js was patched
 *   4. renderChat() — urgency alert same colour for 3 days vs 20 days
 *   5. Deadline.compute() — not flagging urgentDeadline separately from missed
 *   6. classifyDispute() — subType not being stored on caseObj
 *   7. Forum classifier completely absent
 *   8. COIDA detection absent
 *   9. Sector determination detection absent
 *   10. s187 detection regex (refused_illegal) word-boundary bug
 *
 * LLM OPTIMISATIONS:
 *   A. caseContext summary built client-side and sent to server
 *   B. Only non-null/non-empty fields sent in the API payload
 *   C. History trimmed client-side to match server-side limit
 *   D. Urgency flags derived from deadline calculator and sent with every message
 * ═══════════════════════════════════════════════════════════════════════
 */


/* ─────────────────────────────────────────────────────────────
   FIX 7 + 8 + 9: FORUM CLASSIFIER + SECTOR DETECTOR + COIDA FLAG
   Add these constants and functions near the top of the <script> block,
   after TOPIC and OFFTOPIC_HARD/SOFT definitions.
   ───────────────────────────────────────────────────────────── */

/**
 * Forum classifier — identifies the correct bargaining council or
 * tribunal based on the employer type described by the user.
 * Returns null if the CCMA is the correct default forum.
 */
const FORUM_PATTERNS = [
  {
    re: /\b(security guard|psira|armed response|patrol|private security|securit(y|as))\b/i,
    forum: 'SSSBC',
    label: 'Security, Safety and Stability Bargaining Council',
    url: 'www.sssbc.org.za',
    note: 'Security industry employees must file at the SSSBC, not the CCMA. Check if your employer is SSSBC-registered first.',
  },
  {
    re: /\b(municipality|metro|ward|local government|ekurhuleni|tshwane|eThekwini|cape town municipality|johannesburg municipality)\b/i,
    forum: 'SALGBC',
    label: 'South African Local Government Bargaining Council',
    url: 'www.salgbc.org.za',
    note: 'Municipal employees must file at the SALGBC. Filing at the CCMA will be declined for lack of jurisdiction.',
  },
  {
    re: /\b(mine|mining|platinum|gold mine|coal mine|shaft|underground|miner)\b/i,
    forum: 'MEIBC',
    label: 'Metal and Engineering Industries Bargaining Council',
    url: 'www.meibc.co.za',
    note: 'Mining sector employees may fall under MEIBC. Also check COIDA if the claim relates to a workplace accident or occupational disease.',
  },
  {
    re: /\b(school|teacher|educator|principal|education department|sace|university|college|tvet)\b/i,
    forum: 'ELRC',
    label: 'Education Labour Relations Council',
    url: 'www.elrc.org.za',
    note: 'Education sector employees must file at the ELRC. For public schools this is almost always the correct forum.',
  },
  {
    re: /\b(government department|public service|civil servant|department of|home affairs|saps|police|army|defence force|gpssbc|pscbc)\b/i,
    forum: 'GPSSBC',
    label: 'General Public Service Sectoral Bargaining Council',
    url: 'www.gpssbc.org.za',
    note: 'Public servants (national and provincial government employees) must file at the GPSSBC or PSCBC depending on the department.',
  },
  // B3 Batch 2: EPWP / CWP workers (government programmes)
  {
    re: /\b(epwp|expanded public works|cwp|community.*health worker|stipend.*gov|government.*programme)\b/i,
    forum: 'GPSSBC',
    label: 'General Public Service Sectoral Bargaining Council (EPWP)',
    url: 'www.gpssbc.org.za',
    note: 'EPWP and CWP workers employed by government departments must file at the GPSSBC, not the CCMA. Workers employed by municipalities file at the SALGBC. EPWP Regulations 2014 require 5 days notice per year of service.',
  },
  // B13 Batch 2: Gig economy / platform workers
  {
    re: /\b(uber|bolt|takealot delivery|platform worker|gig worker|deactivat)\b/i,
    forum: 'CCMA',
    label: 'CCMA (gig worker — employment status must be determined first)',
    url: 'www.ccma.org.za',
    note: 'Platform/gig workers must file at the CCMA. The CCMA will first hold a jurisdictional hearing to determine employment status under s200A LRA. File as BOTH unfair dismissal AND unfair labour practice to protect both the 30-day and 90-day deadlines.',
  },
];

/**
 * Sector detector — identifies special-case sectors that need
 * different legal treatment (SD rates, COIDA, forum).
 */
const SECTOR_PATTERNS = [
  {
    re: /\b(domestic worker|housekeeper|house cleaner|cleaner|maid|nanny|au pair|garden(er)?|domestic)\b/i,
    sector: 'domestic',
    label: 'Domestic worker — Sectoral Determination 7 applies',
    sdRef: 'SD7',
    notes: ['21 consecutive days leave per year', 'Specific notice periods above BCEA minimums', 'Employer legally required to register worker for UIF since 2003'],
  },
  {
    re: /\b(security guard|psira|patrol|armed response)\b/i,
    sector: 'security',
    label: 'Security sector — Sectoral Determination 6 applies',
    sdRef: 'SD6',
    notes: ['Rates set above NMW', 'PSIRA registration required', 'Check SSSBC forum'],
  },
  {
    re: /\b(restaurant|waiter|waitress|waitron|chef|kitchen|hotel|hospitality|accommodation|lodge|guesthouse)\b/i,
    sector: 'hospitality',
    label: 'Hospitality sector — Sectoral Determination 14 applies',
    sdRef: 'SD14',
    notes: ['Specific overtime rates', 'Anonymous DoEL complaint route available for employed workers'],
  },
  {
    re: /\b(farm|farm worker|agricultural|harvest|crop|orchard|livestock|farmer)\b/i,
    sector: 'agriculture',
    label: 'Agricultural sector — Sectoral Determination 13 + ESTA applies',
    sdRef: 'SD13',
    notes: ['ESTA governs eviction from farm accommodation linked to employment', 'Specific wage and leave provisions'],
  },
  // B12 Batch 2: Taxi / route marshal / cash collector
  {
    re: /\b(taxi|route marshal|cash collector|rank marshal|minibus|taxi association|metered taxi)\b/i,
    sector: 'taxi',
    label: 'Road transport sector — Road Passenger Sectoral Determination applies',
    sdRef: 'Road Passenger SD',
    notes: ['Training fee deductions from existing employees are prohibited', 'Check NBCRFLI or Road Passenger SD for minimum wages', 'Employer may dispute being an LRA employer — check s83A deeming for informal sector'],
  },
  // B12 Batch 2: Gig / platform / independent contractor
  {
    re: /\b(uber|bolt|takealot delivery|platform worker|gig worker|independent contractor)\b/i,
    sector: 'gig_economy',
    label: 'Gig economy worker — s200A rebuttable presumption applies',
    sdRef: 'LRA s200A',
    notes: ['s200A: if worker earns below threshold and platform controls method of work, employer must prove contractor status', 'File as BOTH unfair dismissal (30 days) AND ULP (90 days) simultaneously', 'CCMA will hold jurisdictional ruling on employment status first'],
  },
  // B3 Batch 2: EPWP workers
  {
    re: /\b(epwp|expanded public works|cwp|community health worker|stipend.*gov)\b/i,
    sector: 'epwp',
    label: 'EPWP/CWP worker — EPWP Regulations 2014 + dominant impression test',
    sdRef: 'EPWP Regs 2014',
    notes: ['5 days notice per year of service required by EPWP Regs 2014', 'Dominant impression test may establish employment in substance (SASSA v CCMA [2020])', 'Forum: GPSSBC (government dept) or SALGBC (municipality)'],
  },
];

/** COIDA detector — workplace accident / occupational disease parallel claim */
const COIDA_PATTERNS = [
  /\b(accident|workplace incident|injured at work|work.related injury|fell|explosion|collapse)\b/i,
  /\b(occupational disease|occupational illness|work.related illness|coida|compensation commissioner)\b/i,
  /\b(ptsd.*work|work.*ptsd|anxiety.*accident|trauma.*work)\b/i,
];

function detectForum(userText, caseObj) {
  const t = userText || '';
  const desc = (caseObj && caseObj.description) || '';
  const combined = t + ' ' + desc;
  for (const p of FORUM_PATTERNS) {
    if (p.re.test(combined)) return p;
  }
  return null;
}

function detectSector(userText, caseObj) {
  const t = userText || '';
  const desc = (caseObj && caseObj.description) || '';
  const combined = t + ' ' + desc;
  for (const p of SECTOR_PATTERNS) {
    if (p.re.test(combined)) return p;
  }
  return null;
}

function detectCOIDA(userText) {
  return COIDA_PATTERNS.some(re => re.test(userText || ''));
}


/* ─────────────────────────────────────────────────────────────
   FIX 10: CORRECTED s187 DETECTION
   Replace existing S187_PATTERNS with this version.
   Key changes:
   - refused_illegal: fixed word-boundary bug (\brefus → \brefused)
   - Added mental_health/disability pattern (catches PTSD, anxiety)
   - Added arrest/criminal_charge pattern
   ───────────────────────────────────────────────────────────── */

const S187_PATTERNS = [
  {
    re: /\b(union|shop steward|organis|membership|strike|collective bargaining)\b/i,
    category: 'union_activity',
    label: 'Possible s187(1)(a) — dismissal for union activity',
    compensation: 'up to 24 months\' remuneration',
  },
  {
    re: /\b(pregnant|pregnancy|maternity|expecting|baby|birth)\b/i,
    category: 'pregnancy',
    label: 'Possible s187(1)(e) — dismissal related to pregnancy or maternity leave',
    compensation: 'up to 24 months\' remuneration',
  },
  {
    re: /\b(hiv|aids|positive|status|infected|disclosure)\b/i,
    category: 'hiv_status',
    label: 'Possible s187(1)(f) — dismissal on grounds of HIV/AIDS status',
    compensation: 'up to 24 months\' remuneration',
  },
  {
    re: /\b(whistleblow|protected disclosure|report.*fraud|report.*corruption|complaint.*safety|report.*irregularity)\b/i,
    category: 'whistleblowing',
    label: 'Possible s187(1)(h) — dismissal for making a protected disclosure',
    compensation: 'up to 24 months\' remuneration',
  },
  // BUG FIX: was /\brefus/ which does NOT match "refused" — \b before 'refus'
  // ends at 'd' not at 's'. Fixed to use complete word forms.
  {
    re: /\b(refused|refusal|unlawful instruction|unlawful order|illegal instruction|told to do something illegal|wouldn.t comply)\b/i,
    category: 'refused_illegal',
    label: 'Possible s187(1)(c) — dismissal for refusing an unlawful instruction',
    compensation: 'up to 24 months\' remuneration',
  },
  // NEW: mental health / disability (catches PTSD, anxiety, depression)
  {
    re: /\b(mental health|ptsd|anxiety|depression|disability|disabled|chronic illness|medical condition)\b/i,
    category: 'disability_illness',
    label: 'Possible s187(1)(f) — dismissal related to disability or chronic illness',
    compensation: 'up to 24 months\' remuneration',
  },
  // NEW: arrest / criminal charge (not conviction)
  {
    re: /\b(arrested|arrest|criminal charges?|accused of.*crime|charged with.*crime)\b/i,
    category: 'criminal_charge',
    label: 'Possible procedural issue — dismissal during pending criminal charge (not conviction)',
    compensation: 'standard unfair dismissal — up to 12 months (unless other s187 grounds also apply)',
  },
];

function detectS187(userText) {
  for (const rule of S187_PATTERNS) {
    if (rule.re.test(userText || '')) return rule;
  }
  return null;
}


/* ─────────────────────────────────────────────────────────────
   FIX 5: IMPROVED Deadline.compute()
   Add urgentDeadline flag (≤5 days) separate from missed.
   Replace the existing Deadline object.
   ───────────────────────────────────────────────────────────── */

const Deadline = {
  DAYS: {
    unfair_dismissal:       30,
    constructive_dismissal: 30,
    fixed_term:             30,
    automatically_unfair:   null, // no hard limit but refer ASAP
    unfair_labour_practice: 90,
    unfair_discrimination:  180,
    bcea_money_claim:       1095,
    nmw_underpayment:       1095,
    arbitration_request:    90,
  },

  compute(disputeKey, incidentDate) {
    if (!disputeKey || !incidentDate) return null;
    const days = this.DAYS[disputeKey];
    if (days == null) return {
      status: 'no_limit',
      daysLeft: null,
      deadline: null,
      missed: false,
      urgentDeadline: false,
      condonationNeeded: false,
    };

    const incident = new Date(incidentDate + 'T00:00:00');
    if (isNaN(incident)) return null;
    const deadline = new Date(incident.getTime() + days * 86_400_000);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((deadline - today) / 86_400_000);

    return {
      status: daysLeft < 0 ? 'missed' : daysLeft <= 5 ? 'critical' : daysLeft <= 14 ? 'warning' : 'ok',
      daysLeft,
      deadline: deadline.toISOString().slice(0, 10),
      missed: daysLeft < 0,
      // NEW: urgentDeadline flag for ≤5 days remaining (not yet missed)
      urgentDeadline: daysLeft >= 0 && daysLeft <= 5,
      condonationNeeded: daysLeft < 0,
      referralDays: days,
    };
  },
};


/* ─────────────────────────────────────────────────────────────
   FIX 2 + 6: classifyDispute() — stores subType on caseObj
   and uses the corrected patterns.
   Replace existing classifyDispute().
   ───────────────────────────────────────────────────────────── */

function classifyDispute(answer, freeText) {
  const a = (answer || '').toLowerCase();
  const t = (freeText || '').toLowerCase();

  // Constructive dismissal — must be before plain dismissal
  if (/\b(resign|quit|left|couldn.t take|forced to leave|intolerable|hostile|unbearable|made my life hell)\b/.test(t)) {
    return { type: 'unfair_dismissal', subType: 'constructive_dismissal' };
  }

  // Fixed-term / s198B
  if (/\b(fixed.?term|contract expir|not renewed|temp|temporary|contract end|rolling contract)\b/.test(t)) {
    return { type: 'unfair_dismissal', subType: 'fixed_term' };
  }

  // Standard dismissal
  if (a === 'dismissed' || /\b(dismiss|fired|retrench|terminat|let go|afgedank)/.test(t)) {
    return { type: 'unfair_dismissal', subType: null };
  }

  if (a === 'discriminated' || /\b(discriminat|harass|victimi|race|gender|pregnan|disab)/.test(t)) {
    return { type: 'unfair_discrimination', subType: null };
  }

  if (a === 'wage' || /\b(minimum wage|below.*wage|underpaid|minimumloon)/.test(t)) {
    return { type: 'nmw_underpayment', subType: null };
  }

  if (a === 'money' || /\b(owed|unpaid|leave pay|notice pay|salary|severance)/.test(t)) {
    return { type: 'bcea_money_claim', subType: null };
  }

  if (a === 'treated' || /\b(unfair|suspend|demot|transfer|warning|grievance)/.test(t)) {
    return { type: 'unfair_labour_practice', subType: null };
  }

  return null;
}


/* ─────────────────────────────────────────────────────────────
   FIX 1 + C + D: Backend.ai() — passes all required flags
   and builds the caseContext summary.
   Replace existing Backend.ai() function.
   ───────────────────────────────────────────────────────────── */

const Backend = {
  /**
   * Builds a compact, non-identifying case context string
   * to give the model useful case state without sending PII.
   */
  buildCaseContext(caseObj) {
    if (!caseObj) return '';
    const parts = [];
    if (caseObj.disputeKey) parts.push(`Dispute: ${caseObj.disputeKey.replace(/_/g,' ')}`);
    if (caseObj.subType)    parts.push(`SubType: ${caseObj.subType}`);
    if (caseObj.incidentDate) {
      const dl = Deadline.compute(caseObj.disputeKey, caseObj.incidentDate);
      if (dl) parts.push(`Deadline: ${dl.daysLeft !== null ? dl.daysLeft + ' days left' : dl.status}`);
    }
    if (caseObj.desiredOutcome) parts.push(`Goal: ${caseObj.desiredOutcome}`);
    if (caseObj.docCount > 0)   parts.push(`Docs: ${caseObj.docCount}`);
    if (typeof caseObj._strength === 'number') parts.push(`Strength: ${caseObj._strength}%`);
    if (caseObj.hadHearing)     parts.push(`Hearing: ${caseObj.hadHearing}`);
    if (caseObj.signedDocument && caseObj.signedDocument !== 'nothing')
      parts.push(`SignedDoc: ${caseObj.signedDocument}`);
    return parts.join('. ').slice(0, 400); // hard cap — no PII
  },

  async ai(caseObj, history, userText, opts = {}) {
    // Compute deadline flags from case object
    let deadlineMissed = false;
    let urgentDeadline = false;
    let daysLeft = null;

    if (caseObj && caseObj.disputeKey && caseObj.incidentDate) {
      const dl = Deadline.compute(caseObj.disputeKey, caseObj.incidentDate);
      if (dl) {
        deadlineMissed = dl.missed;
        urgentDeadline = dl.urgentDeadline;
        daysLeft = dl.daysLeft;
      }
    }

    // Detect settlement from case object
    const settlementFlagged = Boolean(
      caseObj?.settlementAgreementFlagged ||
      caseObj?.signedDocument === 'settlement' ||
      caseObj?.signedDocument === 'mutual'
    );

    // Build non-PII case context
    const caseContext = this.buildCaseContext(caseObj);

    // OPTIMISATION: trim history client-side to avoid sending unnecessary tokens
    // Match the server-side limit for the expected tier
    const tierGuess = opts.tier || 'medium';
    const historyLimit = { hard: 10, medium: 6, easy: 3 }[tierGuess] || 6;
    const trimmedHistory = (history || []).slice(-historyLimit);

    // Build lean payload — only include non-default values
    const payload = {
      userText: userText.trim(),
      history: trimmedHistory,
    };

    // Conditionally add flags (reduces payload size for normal messages)
    if (deadlineMissed)             payload.deadlineMissed = true;
    if (urgentDeadline)             payload.urgentDeadline = true;
    if (daysLeft !== null)          payload.daysLeft = daysLeft;
    if (caseObj?.subType)           payload.subType = caseObj.subType;
    if (settlementFlagged)          payload.settlementFlagged = true;
    if (caseContext)                payload.caseContext = caseContext;
    if (opts.persona)               payload.persona = opts.persona;
    if (opts.forceTier)             payload.forceTier = opts.forceTier;
    // O3: pass pre-detected sector/forum so server doesn't recompute
    if (caseObj?.sectorDetected)    payload.sectorDetected = caseObj.sectorDetected;
    if (caseObj?.forumDetected && caseObj.forumDetected !== 'CCMA')
                                    payload.forumDetected = caseObj.forumDetected;

    try {
      const res = await fetch('/.netlify/functions/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 429) {
        return {
          text: "You're sending messages very quickly — please wait a moment before trying again.",
          followUp: null, evidence: [], successRate: null, validity: null,
          s187Flag: false, constructiveDismissal: false, settlementAgreementFlag: false,
          forumAlert: null, urgencyLevel: 'normal',
        };
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return data;

    } catch (err) {
      console.error('[Backend.ai] fetch error:', err.message);
      return {
        text: 'I could not reach the server just now. Please check your connection and try again.',
        followUp: null, evidence: [], successRate: null, validity: null,
        s187Flag: false, constructiveDismissal: false, settlementAgreementFlag: false,
        forumAlert: null, urgencyLevel: 'normal',
      };
    }
  },
};


/* ─────────────────────────────────────────────────────────────
   FIX 2: respond() off-topic and core loop patches
   These are targeted changes to make inside the existing respond()
   function. Find each marker and apply the change described.
   ───────────────────────────────────────────────────────────── */

/*
  CHANGE 1 — Replace the OFFTOPIC check (search for "OFFTOPIC"):
  
  REMOVE:
    if (OFFTOPIC.some(w => low.includes(w))) { ... }
  
  ADD:
    const offTopicType = classifyOffTopic(userText);
    if (offTopicType === 'hard') {
      caseObj.offTopicStrikes = (caseObj.offTopicStrikes || 0) + 1;
      await DB.put('cases', caseObj);
      if (caseObj.offTopicStrikes >= 2) {
        return { kind: 'redirect', offTopic: true,
          text: "That question falls outside your current labour case. You can start a new case to explore a different matter.",
          followUp: null, evidence: [], successRate: null };
      }
      return { kind: 'note', offTopic: false,
        text: "I'd like to keep us focused on your current labour matter. If you have a separate question, you can start a new case.",
        followUp: null, evidence: [], successRate: null };
    }
    if (offTopicType === 'soft') {
      // May be labour-connected — ask before redirecting
      return { kind: 'clarify', offTopic: false,
        text: "That touches on something that sometimes connects to your workplace rights. Before I redirect you — is this related to your employment? For example, were you dismissed because of a criminal charge, does your accommodation depend on your job, or are you a migrant worker with a visa tied to your employment?",
        followUp: null, evidence: [], successRate: null };
    }

  CHANGE 2 — After the AI response returns, add forum and sector alerts:
  
    // Forum alert — add after: const aiResp = await Backend.ai(...)
    if (aiResp.forumAlert && aiResp.forumAlert !== 'CCMA') {
      const forumInfo = FORUM_PATTERNS.find(p => p.forum === aiResp.forumAlert);
      if (forumInfo && !caseObj.forumAlerted) {
        caseObj.forumAlerted = aiResp.forumAlert;
        await DB.put('cases', caseObj);
        // Prepend forum alert to the response text
        aiResp.text = `⚠️ Important: ${forumInfo.note}\n\n` + aiResp.text;
      }
    }

    // Sector detection — run once on first message
    if (!caseObj.sectorDetected) {
      const sector = detectSector(userText, caseObj);
      if (sector) {
        caseObj.sectorDetected = sector.sector;
        await DB.put('cases', caseObj);
        // Add sector notes to evidence
        aiResp.evidence = aiResp.evidence || [];
        sector.notes.forEach(note => {
          aiResp.evidence.push({ label: `${sector.sdRef} — ${sector.label}`, why: note });
        });
      }
    }

    // COIDA detection
    if (detectCOIDA(userText) && !caseObj.coidaFlagged) {
      caseObj.coidaFlagged = true;
      await DB.put('cases', caseObj);
      aiResp.text += '\n\n💡 Note: If your situation involves a workplace accident or injury, you may also have a separate claim under COIDA (Compensation for Occupational Injuries and Diseases) with the Compensation Commissioner. This is entirely separate from your CCMA case.';
    }

  CHANGE 3 — Store subType on caseObj after classifyDispute:
  
    // After: const classified = classifyDispute(...)
    if (classified && classified.subType) {
      caseObj.subType = classified.subType;
      await DB.put('cases', caseObj);
    }

  CHANGE 4 — s187 auto-flag (if not already done by server):
  
    // After AI response returns, check locally as defence-in-depth
    if (!aiResp.s187Flag) {
      const s187Local = detectS187(userText);
      if (s187Local && !caseObj.s187FlagCategory) {
        caseObj.s187FlagCategory = s187Local.category;
        await DB.put('cases', caseObj);
        aiResp.text = `🔴 This may be an automatically unfair dismissal under section 187 of the LRA (${s187Local.label}). If proven, compensation can be up to 24 months' remuneration — double the standard cap.\n\n` + aiResp.text;
        aiResp.s187Flag = true;
      }
    }
*/


/* ─────────────────────────────────────────────────────────────
   FIX 3: successRate — remove engagement fallback from client
   Replace existing successRate() function.
   ───────────────────────────────────────────────────────────── */

function successRate(caseObj) {
  // Only return a score when the element-based assessment is complete.
  // NEVER estimate from message count or engagement — this is misleading
  // and was flagged as Critical in the Panel 1 review.
  if (caseObj && typeof caseObj._strength === 'number') {
    return Math.max(20, Math.min(88, Math.round(caseObj._strength)));
  }
  return null;
}


/* ─────────────────────────────────────────────────────────────
   FIX 4: URGENCY ALERT RENDERING
   Replace the existing deadline alert section in renderChat()
   or wherever the deadline warning banner is rendered.
   ───────────────────────────────────────────────────────────── */

function renderDeadlineAlert(deadlineResult) {
  if (!deadlineResult) return '';

  const { status, daysLeft, deadline, condonationNeeded } = deadlineResult;

  if (status === 'no_limit') return '';

  if (condonationNeeded || status === 'missed') {
    // RED — full-width, prominent, cannot be missed
    return `<div class="deadline-alert deadline-alert--critical" role="alert" aria-live="assertive">
      <div class="deadline-alert__icon">⏰</div>
      <div class="deadline-alert__body">
        <strong>Your referral deadline has passed (${Math.abs(daysLeft)} days ago)</strong>
        <p>This is not necessarily the end of your case. You can apply for <em>condonation</em> — a late referral. Chat with Lee to build your condonation motivation.</p>
        <a href="https://www.ccma.org.za" target="_blank" rel="noopener" class="deadline-alert__cta">File at ccma.org.za →</a>
      </div>
    </div>`;
  }

  if (status === 'critical' && daysLeft <= 2) {
    // B11 Batch 2: ≤2 days — full-screen EMERGENCY takeover, only filing instruction shown
    return `<div class="deadline-alert deadline-alert--emergency" role="alert" aria-live="assertive"
         style="position:fixed;inset:0;z-index:99999;background:rgba(127,29,29,.97);
                display:flex;flex-direction:column;align-items:center;justify-content:center;
                padding:24px;text-align:center;color:#fff;">
      <div style="font-size:48px;margin-bottom:12px;">🚨</div>
      <div style="font-size:22px;font-weight:800;margin-bottom:8px;">
        ${daysLeft === 0 ? 'LAST DAY' : daysLeft + ' DAY' + (daysLeft === 1 ? '' : 'S')} LEFT
      </div>
      <div style="font-size:14px;max-width:360px;margin-bottom:20px;line-height:1.6;">
        Stop everything. File your LRA 7.11 referral right now at ccma.org.za before this deadline passes.
        You can add more detail after filing — the case number is all that matters today.
      </div>
      <a href="https://www.ccma.org.za" target="_blank" rel="noopener"
         style="display:block;padding:14px 28px;background:#fff;color:#7f1d1d;font-weight:800;
                font-size:16px;border-radius:10px;text-decoration:none;margin-bottom:12px;">
        File at ccma.org.za RIGHT NOW →
      </a>
      <button onclick="document.querySelector('.deadline-alert--emergency').style.display='none'"
              style="background:transparent;border:1px solid rgba(255,255,255,.4);color:rgba(255,255,255,.7);
                     padding:8px 16px;border-radius:6px;font-size:12px;cursor:pointer;">
        Dismiss (I have already filed)
      </button>
    </div>`;
  }

  if (status === 'critical') {
    // CRITICAL (3–5 days) — full-screen override, red, pulsing
    return `<div class="deadline-alert deadline-alert--critical deadline-alert--pulse" role="alert" aria-live="assertive">
      <div class="deadline-alert__icon">🚨</div>
      <div class="deadline-alert__body">
        <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'} left to refer to the CCMA</strong>
        <p>File your LRA 7.11 referral form TODAY at <a href="https://www.ccma.org.za" target="_blank" rel="noopener">ccma.org.za</a>. Do not wait for more information — you can add detail after filing. The case number is what matters now.</p>
        <a href="https://www.ccma.org.za" target="_blank" rel="noopener" class="deadline-alert__cta deadline-alert__cta--urgent">File the 7.11 RIGHT NOW →</a>
      </div>
    </div>`;
  }

  if (status === 'warning') {
    // AMBER — 6–14 days remaining
    return `<div class="deadline-alert deadline-alert--warning" role="alert">
      <div class="deadline-alert__icon">⚠️</div>
      <div class="deadline-alert__body">
        <strong>${daysLeft} days left to refer (deadline: ${deadline})</strong>
        <p>Complete your case file and refer before this deadline passes.</p>
      </div>
    </div>`;
  }

  // OK — no banner needed (more than 14 days)
  return '';
}


/* ─────────────────────────────────────────────────────────────
   URGENCY ALERT CSS — add to existing <style> block
   ───────────────────────────────────────────────────────────── */

/*
  Add to your <style> block:

  .deadline-alert {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: var(--r-md, 10px);
    margin-bottom: 16px;
    font-size: 14px;
    line-height: 1.5;
  }
  .deadline-alert--warning {
    background: #fef3c7;
    border: 1.5px solid #fbbf24;
    color: #78350f;
  }
  .deadline-alert--critical {
    background: #fef2f2;
    border: 2px solid #ef4444;
    color: #7f1d1d;
  }
  .deadline-alert--pulse {
    animation: deadlinePulse 2s ease-in-out infinite;
  }
  @keyframes deadlinePulse {
    0%, 100% { border-color: #ef4444; box-shadow: none; }
    50% { border-color: #dc2626; box-shadow: 0 0 0 3px rgba(239,68,68,.2); }
  }
  .deadline-alert__icon { font-size: 20px; flex-shrink: 0; }
  .deadline-alert__body strong { display: block; font-weight: 700; margin-bottom: 4px; }
  .deadline-alert__body p { margin: 0 0 8px; }
  .deadline-alert__cta {
    display: inline-block;
    padding: 6px 14px;
    background: #dc2626;
    color: #fff;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }
  .deadline-alert__cta--urgent { background: #991b1b; animation: deadlinePulse 1s ease-in-out infinite; }
*/


/* ─────────────────────────────────────────────────────────────
   BATCH 2 ADDITIONS — Merge into index.html script block

   HOW TO APPLY:
   1. Find the FOLLOWUPS constant in index.html and add the new
      banks (foreign_national, progressive_discipline, ulp_warning,
      garnishee, gig_economy) inside the existing FOLLOWUPS object
      before the closing };

   2. Find the SIGNALS array and add the 4 new signal entries
      before the closing ];

   3. Add the VINDICATION_RELIEF_MAP after mapOutcomeToLRARelief()

   4. Add the detectProgressiveDisciplineAbuse() function after
      detectS187() in the script block.
   ───────────────────────────────────────────────────────────── */

/* ── BATCH 2 FOLLOWUP BANKS ──────────────────────────────────
   Add these inside the existing FOLLOWUPS = { ... } object
   ───────────────────────────────────────────────────────────── */

/*
  // B15: Foreign national employer-contribution
  foreign_national: [
    'When did your work visa expire, and did you notify your employer before it expired?',
    'Did you make any written requests to your employer for renewal assistance — do you have copies?',
    'Does your employer have a policy for assisting foreign workers with visa renewals?',
    'Are other foreign workers at your company in the same situation, or were they assisted with renewals?',
    'Have you contacted the Department of Home Affairs about a visa extension or s31 ministerial exemption?',
  ],

  // B16: Progressive discipline abuse
  progressive_discipline: [
    'How many warnings did you receive, and over what period of time?',
    'What was your disciplinary record before these recent warnings — any warnings in the past 3 years?',
    'Did you raise any complaint, report a safety issue, or exercise a workplace right in the weeks before the warnings started?',
    'Were other employees warned for similar conduct around the same time, or only you?',
    'Were you given a proper hearing before each warning was issued, or were they just handed to you?',
  ],

  // B17: ULP warning without hearing — internal appeal check
  ulp_warning: [
    'Does your company\'s disciplinary code include an internal appeal process for warnings?',
    'Did you appeal the warning internally before coming to the CCMA? If not, what was your reason?',
    'What exactly did the warning accuse you of, and did you have any opportunity to respond first?',
    'Do you have documentary evidence (maintenance report, records, witness) showing the allegation is factually wrong?',
    'How many warnings do you now have on file, and what happens if you receive one more?',
  ],

  // B1: Garnishee / unlawful deductions
  garnishee: [
    'Have you received a copy of the court order from your employer? If not, have you asked in writing?',
    'Does your payslip name the debt collection company or law firm receiving the money?',
    'Do you know which Magistrate\'s Court issued the order — is a court name shown on your payslip?',
    'Were you ever served with court papers about this debt, or did the deduction start without any notice?',
    'After the deduction, is your take-home pay still above the National Minimum Wage for your hours worked?',
  ],

  // B4: Gig economy / platform workers
  gig_economy: [
    'How long had you been working for this platform, and approximately how many hours per week?',
    'Does the platform control your route, pricing, customer interactions, or performance rating?',
    'Did the platform deactivate your account without a hearing or written reason?',
    'Do you earn below approximately R270,000 per year from this platform?',
    'Did you sign a contract calling you an "independent contractor"? If so, do you have a copy?',
  ],
*/


/* ── BATCH 2 SIGNALS ─────────────────────────────────────────
   Add these 4 entries inside the existing SIGNALS = [ ... ] array
   ───────────────────────────────────────────────────────────── */

/*
  // B18: BCEA s26 maternity protection
  { re: /\b(maternity leave|on maternity|during maternity|while.*maternity|retrenched.*maternity)\b/i,
    tag: '⚠️ BCEA s26 — Maternity protection',
    why: 'Dismissal during maternity leave for any reason connected to pregnancy is prohibited under BCEA s26 AND LRA s187(1)(e). Two separate statutory violations — cite both in your referral.' },

  // B12: Garnishee / EAO alert
  { re: /\b(garnish(ee)?|emolument attachment|eao|salary.*deduct.*court|deducting.*without consent)\b/i,
    tag: '⚠️ Garnishee/EAO — Possible unlawful deduction',
    why: 'Employer must provide copy of court order on request (NCA s65J). Refusal is a statutory breach. Verify the EAO at the Magistrate\'s Court and lodge DoEL + NCR complaints.' },

  // B16: Progressive discipline abuse
  { re: /\b(three warnings?|warnings? in.{0,20}days?|multiple warnings?|accumulated misconduct)\b/i,
    tag: '⚠️ Progressive discipline abuse',
    why: 'Multiple warnings in rapid succession after a clean record may indicate manufactured misconduct. Check if a complaint or protected disclosure preceded the warnings (s187(1)(h)).' },

  // B4: Gig worker deactivation
  { re: /\b(deactivat|account.*suspend|platform.*banned|uber.*account|bolt.*account)\b/i,
    tag: '⚠️ Gig worker deactivation — possible dismissal',
    why: 'Platform deactivation may constitute dismissal under LRA s200A if employment status is established. File as BOTH unfair dismissal (30 days) AND ULP (90 days) to protect both deadlines.' },
*/


/* ── BATCH 2: detectProgressiveDisciplineAbuse() ────────────
   Add this function after detectS187() in index.html
   ───────────────────────────────────────────────────────────── */

/*
// B16: Progressive discipline abuse detector
// Returns true if user text suggests rapid consecutive warnings
const PROGRESSIVE_DISCIPLINE_PATTERNS = [
  /\b(three warnings?|3 warnings?)\b.*\b(days?|week)\b/i,
  /\bwarnings?\b.{0,30}\b(3|three|4|four|five|5)\b.{0,20}\bdays?\b/i,
  /\baccumulated misconduct\b/i,
  /\bmultiple warnings?\b.{0,30}\b(consecutive|back.to.back|rapid)\b/i,
  /\b(warning|warnings?)\s+(on|the same day|back to back|in a row)\b/i,
];

function detectProgressiveDisciplineAbuse(userText, caseObj) {
  const text = userText || '';
  const desc = (caseObj && caseObj.description) || '';
  const combined = text + ' ' + desc;
  const hit = PROGRESSIVE_DISCIPLINE_PATTERNS.some(re => re.test(combined));
  if (!hit) return false;
  // Extra weight if there's a prior clean record
  const cleanRecord = /\bclean record\b|\byears.*no warnings?\b|\bno prior\b/i.test(combined);
  return { detected: true, cleanRecord };
}
*/


/* ── BATCH 2: VINDICATION RELIEF MAPPING (B9) ───────────────
   Replace the existing mapOutcomeToLRARelief function with this version.
   'vindication' now maps to a declaratory order — the correct CCMA remedy.
   ───────────────────────────────────────────────────────────── */

/*
// REPLACE existing mapOutcomeToLRARelief() with:
function mapOutcomeToLRARelief(desiredOutcome, disputeKey, disputeSubType) {
  // Automatically unfair: higher compensation cap
  if (disputeKey === 'automatically_unfair' || disputeSubType === 'automatically_unfair') {
    return 'Maximum compensation in terms of section 194(3) of the LRA (automatically unfair dismissal — up to 24 months\' remuneration)';
  }

  // ULP disputes: declaratory order is the appropriate remedy
  if (disputeKey === 'unfair_labour_practice') {
    return 'A declaratory order that the unfair labour practice be set aside, and any necessary consequential relief (e.g. removal of warning from personnel file, reinstatement of benefit)';
  }

  const map = {
    reinstatement: 'Reinstatement with full back-pay from the date of dismissal, alternatively re-engagement on terms to be determined',
    compensation:  'Maximum compensation in terms of section 194(1) of the LRA',
    // B9 FIX: 'vindication' is not a recognised CCMA remedy — map to declaratory order
    vindication:   'A declaratory order that the dismissal (or action) was unfair, and compensation to be determined by the commissioner at arbitration',
    reference:     'Compensation in terms of section 194(1) of the LRA, and an agreed written reference',
  };

  return map[desiredOutcome]
    // Safe fallback preserves both remedies
    || 'Reinstatement, alternatively re-engagement, alternatively compensation in terms of section 194 of the LRA, as the commissioner may determine';
}
*/


/* ── BATCH 2: EEA PARALLEL DEADLINE ADVISORY (B8) ──────────
   Add this function and call it in respond() when s187Flag
   indicates pregnancy, disability, or national origin discrimination.
   ───────────────────────────────────────────────────────────── */

/*
const EEA_PARALLEL_CATEGORIES = ['pregnancy', 'disability_illness', 'hiv_status'];

function buildEEAParallelAdvisory(s187Category) {
  if (!EEA_PARALLEL_CATEGORIES.includes(s187Category)) return null;
  return {
    route: 'EEA s6 — Equality Court',
    deadline: '6 months (NOT 30 days)',
    note: 'In addition to your CCMA claim (30-day deadline), you have 6 months to refer a separate discrimination claim to the CCMA for conciliation under the EEA. If conciliation fails, it proceeds to the Equality Court or Labour Court. File the CCMA referral now to protect the 30-day window — you still have time to build the EEA case.',
    action: 'File CCMA s187 referral within 30 days. Simultaneously document the EEA claim separately for the 6-month window.',
  };
}

// In respond() — after s187 detection fires, call:
// const eeaAdvisory = buildEEAParallelAdvisory(caseObj.s187FlagCategory);
// if (eeaAdvisory) { /* append to aiResp.text or aiResp.parallelRoutes */ }
*/
