/**
 * MyLabourRights — CASE-AI-LOGIC PANEL 1 PATCH
 * ═══════════════════════════════════════════════════════════════
 * Apply this file's contents into index.html, replacing the
 * matching const/function declarations section by section.
 *
 * Fixes implemented (see Panel1 reports for full rationale):
 *   CRITICAL 1  — Condonation explanation + condonationFactors
 *   CRITICAL 2  — Constructive dismissal sub-type in classifyDispute()
 *   CRITICAL 3  — s187 proactive detection (detectS187)
 *   CRITICAL A  — LEGAL_FACTS staleness: nextReviewExpected + checkLegalFactsStaleness()
 *   CRITICAL B  — Processing notice flag (firstAiUse) + POPIA honest fields
 *   CRITICAL E  — Off-topic redirect: OFFTOPIC_HARD / OFFTOPIC_SOFT split
 *   CRITICAL F  — Mutual separation agreement detection in SIGNALS + EmployerAttack
 *   FINDING 3   — successRate() never uses engagement fallback
 *   FINDING 4   — BCEA threshold implication warning
 *   FINDING 5   — Fixed-term / s198B topic + follow-ups + citations
 *   FINDING 7   — Internal remedies follow-up in dismissal bank
 *   FINDING 8   — Reinstatement caveat in Settlement.heads()
 *   FINDING D   — LRA 7.11 relief mapping via mapOutcomeToLRARelief()
 *   FINDING 6   — s187 patterns (already covered by CRITICAL 3 — cross-reference)
 * ═══════════════════════════════════════════════════════════════
 */

/* ─────────────────────────────────────────────────────────────
   SECTION 1 — TOPIC CLASSIFICATION
   Replace existing TOPIC and OFFTOPIC constants.
   ───────────────────────────────────────────────────────────── */

const TOPIC = {
  dismissal:   ['fired', 'dismiss', 'retrench', 'terminat', 'let go', 'afgedank'],
  pay:         ['salary', 'wage', 'pay', 'overtime', 'uif', 'bonus', 'salaris', 'loon'],
  contract:    ['contract', 'kontrak', 'agreement', 'sign', 'probation'],
  harass:      ['harass', 'bully', 'discriminat', 'unfair', 'victimi', 'teister'],
  process:     ['ccma', 'hearing', 'case number', 'referral', 'con-arb', 'verhoor'],
  // FINDING 5: fixed-term contract / s198B deeming
  fixed_term:  ['fixed term', 'contract expires', 'temp', 'temporary', 'contract end',
                '3 month', 'six month', 'renewable', 'expired', 'not renewed'],
};

// CRITICAL E FIX: split into hard (genuinely off-topic) and soft (may be labour-connected)
// Hard list: route away immediately — no labour law connection possible
const OFFTOPIC_HARD = [
  'divorce', 'traffic fine', 'will and testament', 'car accident',
  'tax return', 'inheritance', 'property transfer',
];

// Soft list: ask a clarifying question before redirecting
// These can all connect to labour law (criminal charge → dismissal;
// immigration → migrant worker rights; rent/landlord → farm worker / tied accommodation)
const OFFTOPIC_SOFT = [
  'criminal', 'arrested', 'visa', 'immigration', 'work permit',
  'rent', 'landlord', 'eviction', 'accommodation',
];

// Backwards-compatible helper used in respond()
function classifyOffTopic(text) {
  const low = text.toLowerCase();
  if (OFFTOPIC_HARD.some(w => low.includes(w))) return 'hard';
  if (OFFTOPIC_SOFT.some(w => low.includes(w))) return 'soft';
  return null;
}


/* ─────────────────────────────────────────────────────────────
   SECTION 2 — FOLLOW-UP QUESTIONS
   Replace existing FOLLOWUPS constant — adds constructive dismissal
   bank, fixed-term bank, internal remedies question, and
   settlement-agreement detection question.
   ───────────────────────────────────────────────────────────── */

const FOLLOWUPS = {
  dismissal: [
    'Were you given written notice, and did it state a reason for the dismissal?',
    'Did your employer hold a disciplinary hearing before dismissing you? If so, were you allowed to state your side?',
    'How long had you been employed there — and was anything said about your performance before this?',
    // FINDING 7: internal remedies
    'Did your employer have an internal appeal process, and did you use it before coming to the CCMA? If not, what was your reason for not doing so?',
    // CRITICAL F: settlement agreement detection
    'When you left, were you asked to sign any document — even something described as a "settlement," "package," or "mutual separation"? If so, did you keep a copy?',
  ],

  // CRITICAL 2: constructive dismissal gets its own bank
  constructive_dismissal: [
    'When exactly did the conditions become intolerable — was there one incident that was the last straw, or did things build up over time?',
    'Did you tell your employer in writing that the conditions were unacceptable before you resigned? Even a WhatsApp message counts.',
    'How long after the conditions became intolerable did you resign? If it was more than a few weeks without formally complaining, we need to address that.',
    'Is there anyone who witnessed what you were subjected to, or a colleague who experienced similar treatment?',
    'Did you see a doctor or take any leave related to stress or the working conditions? Medical records can corroborate your account.',
  ],

  pay: [
    'Do you have payslips for the period in question? Even one or two would help me see the pattern.',
    'Was the amount agreed in writing, or only verbally?',
    'When did you last raise this with your employer, and what was their exact response?',
    // FINDING 4: BCEA threshold check
    'Roughly what is your annual salary — above or below R270,000 per year? This affects which BCEA protections apply to you.',
  ],

  contract: [
    'Do you still have a copy of the signed contract? A photo of every page would be valuable.',
    'Was anything promised verbally that differs from what the contract says?',
    'Were you given time to read the contract before signing, or asked to sign on the spot?',
  ],

  // FINDING 5: fixed-term contracts
  fixed_term: [
    'How long have you been on fixed-term contracts with this employer, in total — across all renewals?',
    'Has the contract been renewed before, and if so, how many times?',
    'When your contract was renewed, did your employer give you a written reason for keeping it fixed-term rather than making you permanent?',
    'Was there ever a gap of more than a month between contracts? Even a short gap can affect your deeming rights.',
  ],

  harass: [
    'Can you describe one specific incident with a date, who was present, and exactly what was said?',
    'Did you report this internally? If so, to whom, and what happened afterwards?',
    'Has this affected only you, or have colleagues experienced something similar?',
  ],

  process: [
    'Do you have a CCMA case number yet, or are we still at the referral stage?',
    'What is the date of your next CCMA appearance, if one has been set?',
    'Have you received any documents from the CCMA or from your employer\'s representative?',
  ],

  general: [
    'Walk me through what happened, in the order it happened — start from the first thing that felt wrong.',
    'When did this start, and who else was involved or witnessed it?',
    'What outcome are you hoping for — your job back, compensation, or simply a fair process?',
  ],
};


/* ─────────────────────────────────────────────────────────────
   SECTION 3 — LEGAL FACTS (versioned with staleness enforcement)
   Replace existing LEGAL_FACTS constant.
   CRITICAL A FIX: nextReviewExpected + checkLegalFactsStaleness()
   ───────────────────────────────────────────────────────────── */

const LEGAL_FACTS = {
  // When ALL facts must be manually verified by a legal reviewer:
  _nextReviewDate: '2027-03-01',

  bceaEarningsThreshold: {
    value: 269900.90,
    unit: 'per year',
    effectiveDate: '2026-05-01',
    nextReviewExpected: '2026-11-01', // Minister gazettes in Q4 most years
    label: 'BCEA earnings threshold',
  },
  nationalMinimumWage: {
    value: 30.23,
    unit: 'per ordinary hour',
    effectiveDate: '2026-03-01',
    nextReviewExpected: '2027-03-01', // Always 1 March annually
    label: 'National minimum wage',
  },

  deadlines: {
    unfair_dismissal:       { days: 30,   label: 'Unfair dismissal',          basis: 'LRA s191 — refer within 30 days of dismissal' },
    constructive_dismissal: { days: 30,   label: 'Constructive dismissal',    basis: 'LRA s191 — 30 days from date of resignation; subType of unfair dismissal' },
    unfair_labour_practice: { days: 90,   label: 'Unfair labour practice',    basis: 'LRA s191 — refer within 90 days of the act/omission or awareness' },
    unfair_discrimination:  { days: 180,  label: 'Unfair discrimination',     basis: 'EEA — refer to conciliation within 6 months' },
    automatically_unfair:   { days: null, label: 'Automatically unfair dismissal', basis: 'LRA s187 — no prescribed referral period; refer as soon as possible' },
    bcea_money_claim:       { days: 1095, label: 'BCEA money claim',          basis: 'BCEA s73A — generally within 3 years' },
    nmw_underpayment:       { days: 1095, label: 'Minimum-wage underpayment', basis: 'NMWA / BCEA — generally within 3 years' },
    fixed_term:             { days: 30,   label: 'Fixed-term / deemed permanent', basis: 'LRA s198B — deeming operates automatically; challenge dismissal within 30 days' },
    arbitration_request:    { days: 90,   label: 'Arbitration request after conciliation', basis: 'LRA — within 90 days of the certificate' },
  },

  // CRITICAL 1: condonation factors (for when deadline is missed)
  condonationFactors: [
    { key: 'degree_of_lateness',   label: 'How late are you?',
      question: 'How many days past the deadline are you referring?' },
    { key: 'reason_for_lateness',  label: 'Why were you late?',
      question: 'What stopped you from referring in time? (illness, not knowing the deadline, trying to resolve with employer, etc.)' },
    { key: 'prospects',            label: 'Is your case strong enough to be worth the CCMA\'s time?',
      question: 'Assessed from your case strength score.' },
    { key: 'prejudice',            label: 'Is your employer harmed by the delay?',
      question: 'Has your employer destroyed records, paid out severance, or hired a permanent replacement since your dismissal?' },
    { key: 'importance',           label: 'Does the case raise an important issue?',
      question: 'Assessed from dispute type — automatically unfair / discrimination cases carry weight.' },
  ],
};

/**
 * CRITICAL A: runtime staleness check.
 * Call on app load and before any NMW/BCEA calculation.
 * Returns true if any fact is past its review date.
 */
function checkLegalFactsStaleness() {
  const today = new Date().toISOString().slice(0, 10);
  const staleItems = [];
  for (const [key, fact] of Object.entries(LEGAL_FACTS)) {
    if (fact && fact.nextReviewExpected && fact.nextReviewExpected <= today) {
      staleItems.push(fact.label || key);
    }
  }
  if (staleItems.length > 0) {
    // Render a dismissible banner — see UI section below
    console.warn('[legal-facts] Stale items detected:', staleItems);
    return { stale: true, items: staleItems };
  }
  return { stale: false, items: [] };
}

// Call on app startup — wire to a UI banner in the app shell
// Example: const stalenessCheck = checkLegalFactsStaleness();
// if (stalenessCheck.stale) showStaleBanner(stalenessCheck.items);


/* ─────────────────────────────────────────────────────────────
   SECTION 4 — DISPUTE CLASSIFIER
   Replace existing classifyDispute().
   CRITICAL 2 FIX: returns subType for constructive dismissal.
   FINDING 5 FIX: fixed_term type added.
   ───────────────────────────────────────────────────────────── */

function classifyDispute(answer, freeText) {
  const a = (answer || '').toLowerCase();
  const t = (freeText || '').toLowerCase();

  // Constructive dismissal — must be checked before plain dismissal
  if (/\b(resign|quit|left|couldn.t take|forced to leave|intolerable|hostile|unbearable|made my life)\b/.test(t)) {
    return { type: 'unfair_dismissal', subType: 'constructive_dismissal' };
  }

  // Fixed-term / s198B — check before general dismissal
  if (/\b(fixed.?term|contract expir|not renewed|temp|temporary|contract end)\b/.test(t)) {
    return { type: 'unfair_dismissal', subType: 'fixed_term' };
  }

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
   SECTION 5 — s187 PROACTIVE DETECTION
   CRITICAL 3 FIX: add detectS187() alongside detectEscalation().
   ───────────────────────────────────────────────────────────── */

const S187_PATTERNS = [
  { re: /\b(union|shop steward|organis|membership|strike|collective)\b/i,
    category: 'union_activity',
    label: 'Possible s187(1)(a) LRA — dismissal for union activity',
    compensation: 'up to 24 months\' remuneration' },
  { re: /\b(pregnant|pregnancy|maternity|baby|expecting|birth)\b/i,
    category: 'pregnancy',
    label: 'Possible s187(1)(e) LRA — dismissal related to pregnancy',
    compensation: 'up to 24 months\' remuneration' },
  { re: /\b(hiv|aids|positive|status|disclosure|infected)\b/i,
    category: 'hiv_status',
    label: 'Possible s187(1)(f) LRA — dismissal on grounds of HIV/AIDS status',
    compensation: 'up to 24 months\' remuneration' },
  { re: /\b(whistleblow|report.*fraud|told.*management|complaint.*safety|report.*irregularity|protected disclosure)\b/i,
    category: 'whistleblowing',
    label: 'Possible s187(1)(h) LRA — dismissal for making a protected disclosure',
    compensation: 'up to 24 months\' remuneration' },
  { re: /\b(refused|refusal|won.t|would not|illegal.*instruct|corrupt|bribe|unlawful.*order)\b/i,
    category: 'refused_illegal',
    label: 'Possible s187(1)(c) LRA — dismissed for refusing to do something unlawful',
    compensation: 'up to 24 months\' remuneration' },
];

/**
 * CRITICAL 3: proactive s187 detection.
 * Run on every user message. Returns the matching pattern or null.
 * Does NOT require the user to know the term "automatically unfair."
 */
function detectS187(userText) {
  for (const rule of S187_PATTERNS) {
    if (rule.re.test(userText || '')) return rule;
  }
  return null;
}

// Existing escalation rules — keep unchanged, s187 detection is additive
const ESCALATION_RULES = [
  { re: /\b(discriminat|equal pay|unequal|race|racial|gender|pregnan|disab|religion|ethnic)/i, reason: 'discrimination' },
  { re: /\b(harass|sexual|bully|victimi|intimidat)/i, reason: 'harassment' },
  { re: /\b(retirement age|forced to retire|too old|mandatory retirement)/i, reason: 'retirement-age dismissal' },
  { re: /\b(review|set aside|take.*on review|section 145|s145|rescind|rescission)/i, reason: 'review' },
  { re: /\b(labour court|high court|interdict|urgent application|automatically unfair)/i, reason: 'Labour Court' },
  { re: /\b(strike|lockout|collective|union recognition|organisational rights)/i, reason: 'collective dispute' },
];

function detectEscalation(userText, caseObj) {
  for (const rule of ESCALATION_RULES) if (rule.re.test(userText || '')) return rule.reason;
  if (caseObj && caseObj.disputeKey === 'unfair_discrimination') return 'discrimination';
  return null;
}


/* ─────────────────────────────────────────────────────────────
   SECTION 6 — EVIDENCE SIGNALS (NoteExtractor)
   Add mutual separation agreement signal.
   CRITICAL F FIX.
   ───────────────────────────────────────────────────────────── */

const SIGNALS = [
  { re: /\b(no|never|didn[' ]?t|did not|wasn[' ]?t|was not)\b.{0,40}\b(warning|hearing|notice|contract|payslip|reason|chance)\b/i,
    tag: 'Procedural', why: 'A missing step often makes a dismissal procedurally unfair.' },
  { re: /\b(verbal|verbally|told me|said to me|promised|over the phone)\b/i,
    tag: 'Verbal account', why: 'Verbal statements need corroboration — flag for follow-up evidence.' },
  { re: /\b(witness|saw it|colleague|someone else|in front of)\b/i,
    tag: 'Witness', why: 'A potential witness — get their name and a statement.' },
  { re: /\b(date|on the|last week|last month|january|december|\d{1,2}\s*(st|nd|rd|th)?)\b/i,
    tag: 'Timeline', why: 'A date or sequence point — confirm and add to the timeline.' },
  { re: /\b(signed|sign|i signed|made me sign|asked to sign)\b/i,
    tag: 'Document signed', why: 'Signing under pressure can waive rights — clarify the circumstances.' },
  { re: /\b(money|salary|wage|owed|unpaid|deduct|short paid|overtime|bonus)\b/i,
    tag: 'Financial', why: 'A money issue — payslips and bank statements will support this.' },
  { re: /\b(suspended|suspension|sent home|told to stay)\b/i,
    tag: 'Suspension', why: 'Suspension terms matter — was it with or without pay?' },
  // CRITICAL F: mutual separation agreement — highest-priority signal
  { re: /\b(settlement|package|mutual|separation agreement|exit agreement|termination agreement|they gave me|signed something|full and final)\b/i,
    tag: '⚠️ Settlement agreement',
    why: 'URGENT: A signed settlement or exit agreement may waive your CCMA rights. Do NOT ignore this — address it before anything else. The 30-day deadline is running from your dismissal date, not the date you signed.' },
];


/* ─────────────────────────────────────────────────────────────
   SECTION 7 — EMPLOYER ATTACK: mutual separation entry
   CRITICAL F FIX: add to EmployerAttack.ATTACKS.
   ───────────────────────────────────────────────────────────── */

// Add this entry to the existing EmployerAttack.ATTACKS array:
const MUTUAL_SEPARATION_ATTACK = {
  key: 'mutual_separation',
  label: 'Signed mutual separation / settlement agreement',
  employerVersion: 'The employee signed a full and final settlement agreement waiving all claims. The CCMA has no jurisdiction.',
  defendsWith: /(agreement|settlement|mutual|separation|signed|full.and.final)/i,
  evidenceNeeded: ['Copy of the signed agreement', 'Any WhatsApp or email exchange before signing', 'Proof of circumstances (e.g. medical certificate if you were in distress)'],
  defenceStrengthNote: 'If the worker has a copy of the agreement: review it for s142A LRA compliance. If no copy: request one immediately from the employer.',
  counter: `A signed settlement agreement does not automatically bar a CCMA referral. It can be challenged on these grounds:
(1) It was signed under duress or undue pressure — were you told "sign or get nothing"?
(2) You were not given adequate time to read and understand it.
(3) You were not advised of your rights before signing (especially your right to refer to the CCMA).
(4) The agreement does not comply with section 142A of the LRA, which governs CCMA settlement agreements.
The commissioner will look at the circumstances of signing, not just the document itself.
If you have a copy of the agreement, upload it now so we can review its exact terms.`,
  crossQuestion: 'What steps did you take to ensure the employee understood the rights they were waiving, and was the employee given independent legal advice before signing?',
  urgencyNote: 'The 30-day CCMA deadline runs from the date of dismissal, not the date the agreement was signed. Do not delay.',
};

// Internal remedies attack (FINDING 7 addition):
const INTERNAL_REMEDIES_ATTACK = {
  key: 'internal_remedies',
  label: 'Failure to exhaust internal remedies',
  employerVersion: 'The employee bypassed the internal appeal process and the matter is premature.',
  defendsWith: /(appeal|grievance|internal.*process|disciplinary.*code)/i,
  counter: 'The CCMA has jurisdiction regardless of whether internal processes were followed (LRA s157(1)). However, if the internal process was available, not obviously futile, and you chose not to use it, the commissioner may take that into account. Document your reason for not using it.',
  crossQuestion: 'Can you point to the specific provision of the LRA or any agreement that requires exhaustion of internal remedies as a precondition for CCMA jurisdiction?',
};


/* ─────────────────────────────────────────────────────────────
   SECTION 8 — SETTLEMENT HEADS
   FINDING 8 FIX: constructive dismissal reinstatement caveat.
   Replace Settlement.heads() method.
   ───────────────────────────────────────────────────────────── */

const Settlement = {
  heads(subType) {
    const base = [
      { key: 'notice',        label: 'Notice pay',          hint: 'Pay in lieu of your notice period.' },
      { key: 'leave',         label: 'Outstanding leave',   hint: 'Accrued but unpaid annual leave.' },
      { key: 'severance',     label: 'Severance',           hint: 'Retrenchment — 1 week per completed year (minimum).' },
      { key: 'comp',          label: 'Compensation',        hint: 'Unfair dismissal: up to 12 months\' pay (24 if automatically unfair).' },
      { key: 'reference',     label: 'A written reference', hint: 'Often more valuable than cash for your next job.' },
      { key: 'record',        label: 'Record cleared',      hint: 'Removal of warnings / a neutral exit reason.' },
    ];

    // FINDING 8: reinstatement caveat — different text for constructive dismissal
    const reinstatementEntry = subType === 'constructive_dismissal'
      ? {
          key: 'reinstatement',
          label: 'Reinstatement',
          hint: 'Note: in constructive dismissal cases, reinstatement is rarely granted — the employment relationship has usually broken down. Compensation is the more realistic remedy. Include this only if you genuinely want to return and believe the relationship can be repaired.',
          warning: true,
        }
      : {
          key: 'reinstatement',
          label: 'Reinstatement',
          hint: 'Your job back, with or without back-pay. Primary remedy under s193 LRA.',
        };

    return [...base, reinstatementEntry];
  },

  framing(successRate) {
    if (successRate == null) return 'Complete your intake so we can weigh a settlement against your likely result at arbitration.';
    if (successRate >= 65) return 'Your estimated prospects are reasonably strong — you can negotiate from a position of some confidence, but litigation always carries risk and delay.';
    if (successRate >= 45) return 'Your prospects are finely balanced — a fair settlement now may well beat the uncertainty of arbitration.';
    return 'Your estimated prospects are on the weaker side — a negotiated exit may protect you better than an all-or-nothing hearing.';
  },
};


/* ─────────────────────────────────────────────────────────────
   SECTION 9 — LRA 7.11 RELIEF MAPPING
   FINDING D FIX: mapOutcomeToLRARelief() for CCMAForms.fill()
   ───────────────────────────────────────────────────────────── */

/**
 * Maps the user's desired outcome to recognised LRA relief language.
 * "Vindication" is NOT a recognised CCMA relief — map it to a declaratory order.
 * The fallback covers both remedies when the case outcome is uncertain.
 */
function mapOutcomeToLRARelief(desiredOutcome, disputeKey) {
  // Automatically unfair: higher compensation cap
  if (disputeKey === 'automatically_unfair') {
    return 'Maximum compensation in terms of section 194(3) of the LRA (automatically unfair dismissal — up to 24 months\' remuneration)';
  }
  const map = {
    reinstatement: 'Reinstatement with full back-pay from the date of dismissal, alternatively re-engagement on terms to be determined',
    compensation:  'Maximum compensation in terms of section 194(1) of the LRA',
    vindication:   'A declaratory order that the dismissal was unfair, and compensation to be determined by the commissioner at arbitration',
    reference:     'Compensation in terms of section 194(1) of the LRA, and an agreed written reference',
  };
  return map[desiredOutcome]
    // FINDING D: safe fallback preserves both remedies
    || 'Reinstatement, alternatively re-engagement, alternatively compensation in terms of section 194 of the LRA, as the commissioner may determine';
}


/* ─────────────────────────────────────────────────────────────
   SECTION 10 — SUCCESS RATE
   FINDING 3 FIX: never return engagement-based estimate.
   Replace successRate() function.
   ───────────────────────────────────────────────────────────── */

/**
 * FINDING 3: engagement-based fallback removed entirely.
 * Returns null if CaseStrength has not yet produced a score.
 * The UI must display "Complete your intake to see your case strength."
 * A number based on message count is more misleading than no number.
 */
function successRate(caseObj) {
  // Always prefer the element-based CaseStrength score
  if (caseObj && typeof caseObj._strength === 'number') {
    return Math.max(20, Math.min(88, Math.round(caseObj._strength)));
  }
  // No engagement fallback — return null and let the UI handle it
  return null;
}


/* ─────────────────────────────────────────────────────────────
   SECTION 11 — CITATIONS
   Add s186(1)(e), s187(1), s198B, and condonation references.
   Merge into existing CITATIONS object.
   ───────────────────────────────────────────────────────────── */

// Add these entries to the existing CITATIONS object:
const CITATIONS_ADDITIONS = {
  // Extend unfair_dismissal:
  unfair_dismissal_additions: [
    { law: 'LRA s186(1)(e)', text: 'Constructive dismissal: resignation in circumstances made intolerable by the employer. Requires objective intolerability, employer causation, and that resignation was a last resort.' },
    { law: 'LRA s187(1)', text: 'Automatically unfair dismissal: listed categories (union activity, pregnancy, HIV status, whistleblowing, refusing unlawful instruction) attract up to 24 months\' remuneration.' },
    { law: 'LRA s191(3)', text: 'Condonation: a commissioner may condone a late referral on good cause shown — the applicant must address degree of lateness, reason, prospects, prejudice, and importance.' },
    { law: 'Sidumo v Rustenburg Platinum', text: 'An award stands unless no reasonable commissioner could reach it.' },
  ],
  // New fixed_term type:
  fixed_term: [
    { law: 'LRA s198B', text: 'Fixed-term employees earning below the earnings threshold are deemed permanent after 3 months unless the employer justifies the fixed term in writing.' },
    { law: 'LRA s191', text: 'Challenge a fixed-term non-renewal as dismissal within 30 days.' },
  ],
};


/* ─────────────────────────────────────────────────────────────
   SECTION 12 — PROCESSING NOTICE (CRITICAL B)
   Add firstAiUse flag to trigger one-time disclosure.
   Wire into the chat component's send handler.
   ───────────────────────────────────────────────────────────── */

/**
 * CRITICAL B: show this notice the first time a user sends a message to Lee.
 * Store acknowledgement in localStorage so it only shows once.
 * The notice text is plain English as required by POPIA s18.
 */
const PROCESSING_NOTICE = {
  id: 'ai-processing-notice-v1',
  heading: 'Before you continue',
  body: `Your message will be sent to an AI service to generate a response.
To protect yourself:
• Do not include your full name, ID number, or your employer's full name in your first message.
• Describe your situation in general terms first (e.g. "I was dismissed after 8 years").
• Your case notes are stored on your device only — not on our servers.

You can always add more detail once you are comfortable.`,
  confirmLabel: 'I understand — continue',
};

function shouldShowProcessingNotice() {
  try {
    return !localStorage.getItem(PROCESSING_NOTICE.id);
  } catch { return false; }
}

function markProcessingNoticeSeen() {
  try { localStorage.setItem(PROCESSING_NOTICE.id, '1'); } catch { /* silent */ }
}


/* ─────────────────────────────────────────────────────────────
   SECTION 13 — RESPOND() PATCH NOTES
   The main respond() function needs these specific changes.
   This section documents them for the developer — the full
   function is in index.html and is too large to replace here.
   ───────────────────────────────────────────────────────────── */

/*
  Changes to make inside respond() in index.html:

  1. REPLACE the off-topic check:
     OLD:
       if (OFFTOPIC.some(w => low.includes(w))) { ... offTopicStrikes ... }
     NEW:
       const offTopicType = classifyOffTopic(userText);
       if (offTopicType === 'hard') {
         caseObj.offTopicStrikes = (caseObj.offTopicStrikes || 0) + 1;
         await DB.put('cases', caseObj);
         if (caseObj.offTopicStrikes >= 2) {
           return { kind: 'redirect', offTopic: true,
             text: 'That question falls outside your current labour case...',
             followUp: null, evidence: [], successRate: null };
         }
         return { kind: 'redirect', offTopic: false,
           text: 'I want to keep us focused on your current labour matter...',
           followUp: null, evidence: [], successRate: null };
       }
       if (offTopicType === 'soft') {
         return { kind: 'clarify', offTopic: false,
           text: 'That touches on something that sometimes connects to your workplace rights. Before I redirect you — is this related to your employment? For example, were you dismissed because of a criminal charge, or does your accommodation depend on your job?',
           followUp: null, evidence: [], successRate: null };
       }

  2. ADD s187 detection immediately after classify(userText):
       const s187Match = detectS187(userText);
       if (s187Match && topic === 'dismissal') {
         caseObj.s187Flag = s187Match.category;
         // Prepend s187 alert to the opinion text
       }

  3. USE constructive_dismissal follow-up bank when subType is set:
       const fuBank = caseObj.subType === 'constructive_dismissal'
         ? FOLLOWUPS.constructive_dismissal
         : (FOLLOWUPS[topic] || FOLLOWUPS.general);

  4. PASS deadlineMissed flag in the server call:
       const deadlineInfo = Deadline.compute(caseObj.disputeKey, caseObj.incidentDate);
       body.deadlineMissed = deadlineInfo?.status === 'missed';
       body.subType = caseObj.subType || null;

  5. REPLACE successRate() call:
       OLD: const rate = successRate(caseObj);
       NEW: const rate = successRate(caseObj); // returns null if no element-based score
            // UI must handle null: show "Complete intake to see your score" instead of a number

  6. ADD settlement agreement check at the start of respond():
       const settlementSignal = SIGNALS.find(s =>
         s.tag.includes('Settlement') && s.re.test(userText));
       if (settlementSignal) {
         caseObj.settlementAgreementFlagged = true;
         // Force the settlement follow-up question as the immediate next step
       }
*/

// ── End of patch file ─────────────────────────────────────────
