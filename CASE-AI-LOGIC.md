# MyLabourRights — Case-Handling AI Logic (Reference)

This is the **case-based intelligence** — the conversational attorney, the
evidence handling, the CCMA logic, deadlines, success scoring, and the
case-building tools. All of it lives in **`index.html`** (it runs in the
browser so the app works even with no API keys). When live AI keys are set,
this same logic frames and supports the model; with no keys, it *is* the AI.

Everything below is the real code, grouped by what it does. Edit it in
`index.html` — search for the `const` or `function` name shown.

> Not covered here (see `LLM-SCRIPTS.md` instead): the raw Gemini/Claude API
> calls and the routing/prompts in `netlify/functions/ai.js`.

---

## A. The conversational AI — `CaseEngine`

This is the back-and-forth attorney. It classifies each message, gives an
opinion, asks the next forensic question, suggests evidence, scores the case,
and flags matters that need a human lawyer.

### A1. Topic classification (what is the user talking about?)

```javascript
const TOPIC = {
  dismissal: ['fired', 'dismiss', 'retrench', 'terminat', 'let go', 'afgedank'],
  pay:       ['salary', 'wage', 'pay', 'overtime', 'uif', 'bonus', 'salaris', 'loon'],
  contract:  ['contract', 'kontrak', 'agreement', 'sign', 'probation'],
  harass:    ['harass', 'bully', 'discriminat', 'unfair', 'victimi', 'teister'],
  process:   ['ccma', 'hearing', 'case number', 'referral', 'con-arb', 'verhoor'],
};
// off-topic = nothing labour related at all
const OFFTOPIC = ['divorce', 'criminal', 'traffic fine', 'rent', 'landlord',
  'will and testament', 'car accident', 'tax return', 'visa', 'immigration'];

function classify(text) {
  const low = text.toLowerCase();
  if (OFFTOPIC.some(w => low.includes(w))) return 'offtopic';
  for (const [topic, words] of Object.entries(TOPIC))
    if (words.some(w => low.includes(w))) return topic;
  return 'general';
}
```

### A2. The forensic follow-up questions (one per turn, per topic)

```javascript
const FOLLOWUPS = {
  dismissal: [
    'Were you given written notice, and did it state a reason for the dismissal?',
    'Did your employer hold a disciplinary hearing before dismissing you? If so, were you allowed to state your side?',
    'How long had you been employed there — and was anything said about your performance before this?',
  ],
  pay: [
    'Do you have payslips for the period in question? Even one or two would help me see the pattern.',
    'Was the amount agreed in writing, or only verbally?',
    'When did you last raise this with your employer, and what was their exact response?',
  ],
  contract: [
    'Do you still have a copy of the signed contract? A photo of every page would be valuable.',
    'Was anything promised verbally that differs from what the contract says?',
    'Were you given time to read the contract before signing, or asked to sign on the spot?',
  ],
  harass: [
    'Can you describe one specific incident with a date, who was present, and exactly what was said?',
    'Did you report this internally? If so, to whom, and what happened afterwards?',
    'Has this affected only you, or have colleagues experienced something similar?',
  ],
  process: [
    'Do you have a CCMA case number yet, or are we still at the referral stage?',
    'What is the date of your next CCMA appearance, if one has been set?',
    'Have you received any documents from the CCMA or from your employer’s representative?',
  ],
  general: [
    'Walk me through what happened, in the order it happened — start from the first thing that felt wrong.',
    'When did this start, and who else was involved or witnessed it?',
    'What outcome are you hoping for — your job back, compensation, or simply a fair process?',
  ],
};
```

### A3. The opinion openers (rotated so they never repeat)

```javascript
const INTROS = {
  dismissal: [
    'From what you’ve told me, this looks like it could be an **unfair dismissal**. Under the LRA a dismissal has to be fair in two ways: there must be a good reason for it, and the right process must have been followed.',
    'What you’re describing raises a real question of fairness. The law doesn’t just ask *whether* you were dismissed — it asks whether there was a proper reason and whether you were treated fairly along the way.',
    'This has the makings of an unfair-dismissal matter. The two things that will decide it are the reason your employer gave and whether they followed a fair procedure before letting you go.',
    'Let me be straight with you about where this sits. An employer can’t simply dismiss someone — they need a valid reason *and* a fair process, and from what you’ve said, at least one of those may be missing.',
  ],
  pay: [
    'What you’ve described sounds like money being withheld that you’re owed. An employer generally can’t cut or hold back pay you’ve already earned without your agreement.',
    'This points to a possible underpayment. The starting position in law is simple: work done is pay owed, and your employer can’t unilaterally change that.',
    'On the face of it, this is about money you’re entitled to. Employers have very limited room to deduct or reduce agreed pay.',
  ],
  contract: [
    'Contracts matter, but here’s the key thing people don’t realise: a contract can’t take away rights the law gives you, even if you signed it.',
    'Let’s look at the contract carefully — but bear in mind that no clause can drop you below the legal minimum the BCEA guarantees, signature or not.',
    'The contract is the starting point, not the final word. If a term strips out a protected right, that term simply doesn’t hold up, however it was worded.',
  ],
  harass: [
    'I’m sorry you’ve had to deal with this. Treatment like that can amount to an unfair labour practice — and if it’s tied to who you are, it may cross into discrimination under the Employment Equity Act.',
    'That shouldn’t have happened to you. Sustained mistreatment of this kind is something the law takes seriously, and there may be more than one route to address it.',
    'Thank you for telling me — I know that’s not easy. What you’re describing can ground a claim, and if it’s linked to a personal characteristic, the protections are even stronger.',
  ],
  process: [
    'Let’s make sure the process side is solid, because that’s where good cases quietly fall apart. The timing of your CCMA referral is the thing to watch most closely.',
    'Procedure is where I want us to be careful. An unfair-dismissal dispute usually has to reach the CCMA within 30 days — miss that without a good reason and even a strong case can stall.',
    'The mechanics here matter as much as the merits. Getting the referral in on time, to the right forum, is half the battle won.',
  ],
  general: [ /* three general openers — see index.html */ ],
};

function buildOpinion(topic, caseObj) {
  const bank = INTROS[topic] || INTROS.general;
  const i = (caseObj.answeredFollowUps || 1) - 1;
  let out = bank[i % bank.length];          // rotate — no repeats
  // tailor to the outcome the user said they want (only on the first turn)
  if ((caseObj.answeredFollowUps || 0) <= 1) {
    const oc = {
      reinstatement: ' And since getting your job back is what matters to you, I’ll keep us pointed at that — it changes what we ask for.',
      compensation:  ' Your goal is compensation, so we’ll focus on proving your losses clearly.',
      vindication:   ' You’ve said being heard and clearing your name matters most — that shapes how we approach this.',
      reference:     ' With a clean exit and a fair reference as the goal, a smart settlement may serve you better than a long fight.',
    }[caseObj.desiredOutcome];
    if (oc) out += oc;
  }
  return out;
}
```

### A4. The main response loop (`respond`) — incl. off-topic / case-scope enforcement

```javascript
async function respond(caseObj, userText) {
  const topic = classify(userText);
  caseObj.messageCount = (caseObj.messageCount || 0) + 1;

  // OFF-TOPIC: keep each case scoped; after 2 strikes, offer a new case
  if (topic === 'offtopic') {
    caseObj.offTopicStrikes = (caseObj.offTopicStrikes || 0) + 1;
    await DB.put('cases', caseObj);
    if (caseObj.offTopicStrikes >= 2) {
      return { kind: 'redirect', offTopic: true,
        text: `That question falls outside your current case … open it as a new case: a **7-day free trial**, then a once-off **R100** for 6 months. Shall I set that up?`,
        followUp: null, evidence: [], successRate: null };
    }
    return { kind: 'redirect', offTopic: false,
      text: `I want to keep us focused on your current labour matter … is there anything more on the matter we’re building?`,
      followUp: null, evidence: [], successRate: null };
  }

  // ON-TOPIC: opinion + next forensic question + evidence + score
  caseObj.answeredFollowUps = (caseObj.answeredFollowUps || 0) + 1;
  const opinion  = buildOpinion(topic, caseObj);
  const fuBank   = FOLLOWUPS[topic] || FOLLOWUPS.general;
  const fu       = fuBank[(caseObj.answeredFollowUps - 1) % fuBank.length];
  const evidence = EVIDENCE[topic] || EVIDENCE.general;
  const rate     = successRate(caseObj);

  // a warm check-in every 4th turn (kept infrequent so it isn't robotic)
  const useRapport = caseObj.messageCount > 1 && caseObj.messageCount % 4 === 0;
  const rapport    = RAPPORT[(caseObj.messageCount / 4 | 0) % RAPPORT.length];

  let text = '';
  if (useRapport) text += rapport + '\n\n';
  text += opinion;     // the follow-up renders as its own highlighted block

  // for personal/CCMA cases, add a case-law validity note after a couple of turns
  let validity = null;
  if ((CASE_TYPES[caseObj.caseType] || {}).ccmaValidity && caseObj.answeredFollowUps >= 2)
    validity = 'Opinion cross-checked against SAFLII case law and current public CCMA commentary.';

  const escalate = detectEscalation(userText, caseObj);   // needs-a-lawyer flag
  await DB.put('cases', caseObj);
  return { kind: useRapport ? 'rapport' : 'opinion', offTopic: false,
    text, followUp: fu, evidence, successRate: rate, validity, escalate };
}
```

### A5. Success-rate scoring (the live estimate)

```javascript
function successRate(caseObj) {
  let score = 38;
  score += Math.min(30, (caseObj.docCount || 0) * 8);          // documents on file
  score += Math.min(22, (caseObj.answeredFollowUps || 0) * 6); // engagement / detail
  if ((caseObj.messageCount || 0) > 8) score += 6;
  return Math.max(20, Math.min(88, Math.round(score)));        // capped 20–88, never 100
}
```

### A6. Escalation — when to send the user to a human lawyer

```javascript
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
```

---

## B. Putting the evidence together

### B1. Evidence suggestions by topic (the strengthen-your-case loop)

```javascript
const EVIDENCE = {
  dismissal: [
    { label: 'Dismissal / termination letter', why: 'Establishes the employer’s stated reason and date.' },
    { label: 'Notice of disciplinary hearing', why: 'Shows whether a fair procedure was followed.' },
    { label: 'Your last 3 payslips', why: 'Confirms length of service and remuneration for compensation.' },
  ],
  pay: [
    { label: 'Payslips for the disputed months', why: 'Directly proves the shortfall.' },
    { label: 'Employment contract or offer letter', why: 'Confirms the agreed rate.' },
    { label: 'Bank statements showing deposits', why: 'Corroborates what was actually paid.' },
  ],
  contract: [
    { label: 'Signed employment contract (all pages)', why: 'The core document of the dispute.' },
    { label: 'WhatsApp or email about the terms', why: 'Captures verbal promises that differ from the contract.' },
  ],
  harass: [
    { label: 'A dated written account of each incident', why: 'A contemporaneous record carries real evidentiary weight.' },
    { label: 'Your internal complaint / grievance', why: 'Proves you reported it and gave the employer a chance to act.' },
    { label: 'Witness names or statements', why: 'Independent corroboration strengthens credibility.' },
  ],
  process: [
    { label: 'CCMA referral form (LRA 7.11)', why: 'Confirms the matter is properly before the CCMA.' },
    { label: 'Any correspondence from the CCMA', why: 'Sets out dates and the commissioner’s directions.' },
  ],
  general: [ /* contract, payslips, written comms — see index.html */ ],
};
```

### B2. Document auto-prioritisation (keyword-weighted importance)

When a user uploads a file, this scores how important it likely is, so the
document desk can rank the most decisive evidence to the top.

```javascript
function scoreDoc(name) {
  const n = name.toLowerCase();
  const weights = [
    [/(dismiss|terminat|retrench|afdank)/, 100],
    [/(contract|kontrak|agreement|appointment)/, 90],
    [/(warning|hearing|disciplin|verhoor)/, 85],
    [/(ccma|referral|lra)/, 80],
    [/(payslip|salary|wage|loon|salaris)/, 75],
    [/(email|whatsapp|letter|brief)/, 60],
    [/(statement|bank)/, 55],
  ];
  for (const [re, w] of weights) if (re.test(n)) return w;
  return 35;                              // unknown document — modest default
}
// each uploaded doc also nudges the success estimate up a little:
//   if (c.successRate) c.successRate = Math.min(88, c.successRate + 4);
```

### B3. The issue matrix (best / worst / disputed facts) — S8

```javascript
const IssueMatrix = {
  blankRow() { return { id: uid('iss'), allegation: '', support: '', witness: '', weakness: '' }; },
  // seed suggested allegations from the dispute type, so it isn't a blank page
  seed(disputeKey) {
    const seeds = {
      unfair_dismissal: ['No valid reason was given for my dismissal', 'I was not given a fair hearing'],
      unfair_labour_practice: ['I was treated less favourably than colleagues', 'A benefit was withdrawn without consultation'],
      unfair_discrimination: ['I was treated differently because of a personal characteristic'],
      bcea_money_claim: ['I was not paid money I am owed'],
      nmw_underpayment: ['I was paid below the minimum wage'],
    };
    return (seeds[disputeKey] || ['Describe what you say happened'])
      .map(a => ({ id: uid('iss'), allegation: a, support: '', witness: '', weakness: '' }));
  },
};
```

### B4. Voice-note fact extraction — `NoteExtractor`

When the user speaks, this pulls structured facts out of the transcript into
tagged case notes, and suggests a clarifying question.

```javascript
const SIGNALS = [
  { re: /\b(no|never|didn[' ]?t|did not|wasn[' ]?t|was not)\b.{0,40}\b(warning|hearing|notice|contract|payslip|reason|chance)\b/i,
    tag: 'Procedural', why: 'A missing step often makes a dismissal procedurally unfair.' },
  { re: /\b(verbal|verbally|told me|said to me|promised|over the phone)\b/i,
    tag: 'Verbal account', why: 'Verbal statements need corroboration — flag for follow-up evidence.' },
  { re: /\b(witness|saw it|colleague|someone else|in front of)\b/i,
    tag: 'Witness', why: 'A potential witness — get their name and a statement.' },
  { re: /\b(date|on the|last week|last month|january|…|december|\d{1,2}\s*(st|nd|rd|th)?)\b/i,
    tag: 'Timeline', why: 'A date or sequence point — confirm and add to the timeline.' },
  { re: /\b(signed|sign|i signed|made me sign|asked to sign)\b/i,
    tag: 'Document signed', why: 'Signing under pressure can waive rights — clarify the circumstances.' },
  { re: /\b(money|salary|wage|owed|unpaid|deduct|short paid|overtime|bonus)\b/i,
    tag: 'Financial', why: 'A money issue — payslips and bank statements will support this.' },
  { re: /\b(suspended|suspension|sent home|told to stay)\b/i,
    tag: 'Suspension', why: 'Suspension terms matter — was it with or without pay?' },
];
// extract(transcript) splits into sentences, tags each against SIGNALS,
// dedupes, and returns up to 12 notes. clarifier(notes) then suggests the
// single most useful follow-up question. Full code in index.html.
```

---

## C. CCMA logic

### C1. Versioned legal facts + referral deadlines — `LEGAL_FACTS` (S4)

```javascript
const LEGAL_FACTS = {
  bceaEarningsThreshold: { value: 269900.90, unit: 'per year', effectiveDate: '2026-05-01', label: 'BCEA earnings threshold' },
  nationalMinimumWage:   { value: 30.23, unit: 'per ordinary hour', effectiveDate: '2026-03-01', label: 'National minimum wage' },
  deadlines: {
    unfair_dismissal:       { days: 30,   label: 'Unfair dismissal',          basis: 'LRA s191 — refer within 30 days of dismissal' },
    unfair_labour_practice: { days: 90,   label: 'Unfair labour practice',    basis: 'LRA s191 — refer within 90 days of the act/omission or awareness' },
    unfair_discrimination:  { days: 180,  label: 'Unfair discrimination',     basis: 'EEA — refer to conciliation within 6 months' },
    bcea_money_claim:       { days: 1095, label: 'BCEA money claim',          basis: 'BCEA s73A — generally within 3 years' },
    nmw_underpayment:       { days: 1095, label: 'Minimum-wage underpayment', basis: 'NMWA / BCEA — generally within 3 years' },
    arbitration_request:    { days: 90,   label: 'Arbitration request after conciliation', basis: 'LRA — within 90 days of the certificate' },
  },
};
```

### C2. Deadline calculator + forum router — `Deadline` (S1 / S3)

```javascript
const Deadline = {
  compute(disputeKey, incidentDateISO) {
    const d = LEGAL_FACTS.deadlines[disputeKey];
    if (!d || !incidentDateISO) return null;
    const incident = new Date(incidentDateISO + 'T00:00:00');
    const deadline = new Date(incident.getTime() + d.days * 86400000);
    const now = new Date(); now.setHours(0,0,0,0);
    const daysLeft = Math.ceil((deadline - now) / 86400000);
    return {
      disputeKey, label: d.label, basis: d.basis, windowDays: d.days,
      incidentDate: incidentDateISO, deadlineDate: deadline.toISOString().slice(0,10),
      daysLeft,
      status: daysLeft < 0 ? 'missed' : daysLeft <= 5 ? 'urgent' : daysLeft <= 14 ? 'soon' : 'ok',
      condonationNeeded: daysLeft < 0,
    };
  },
  // visual "where your matter goes next" path (CCMA → conciliation → arbitration/Labour Court)
  forumPath(disputeKey) { /* returns ordered steps; see index.html */ },
};
```

### C3. Dispute classifier — `classifyDispute` (S2)

```javascript
function classifyDispute(answer, freeText) {
  const a = (answer || '').toLowerCase();
  const t = (freeText || '').toLowerCase();
  if (a === 'dismissed'     || /\b(dismiss|fired|retrench|terminat|let go|afgedank)/.test(t)) return 'unfair_dismissal';
  if (a === 'discriminated' || /\b(discriminat|harass|victimi|race|gender|pregnan|disab)/.test(t)) return 'unfair_discrimination';
  if (a === 'wage'          || /\b(minimum wage|below.*wage|underpaid|minimumloon)/.test(t)) return 'nmw_underpayment';
  if (a === 'money'         || /\b(owed|unpaid|leave pay|notice pay|salary|severance)/.test(t)) return 'bcea_money_claim';
  if (a === 'treated'       || /\b(unfair|suspend|demot|transfer|warning|grievance)/.test(t)) return 'unfair_labour_practice';
  return null;
}
```

### C4. CCMA form pre-fill — `CCMAForms` (S15)

Drafts LRA 7.11 (referral), 7.13 (arbitration), 7.18 (certification), and a
condonation application from the case data. The full templates are long; this
is the shape:

```javascript
const CCMAForms = {
  catalogue: [
    { id: 'lra711', code: 'LRA 7.11', name: 'Referral of a dispute to conciliation', when: 'Start here.' },
    { id: 'lra713', code: 'LRA 7.13', name: 'Request for arbitration', when: 'After conciliation fails.' },
    { id: 'lra718', code: 'LRA 7.18', name: 'Application for certification of an award', when: 'When the other side won’t comply.' },
    { id: 'condone', code: 'Condonation', name: 'Application for condonation (late referral)', when: 'When you’re past the deadline.' },
  ],
  // fill(formId, caseObj, user) → a pre-filled text draft, pulling in the
  // dispute type, incident date, issue-matrix allegations, and desired remedy,
  // with [bracketed] gaps for the user, and a "confirm on ccma.org.za" notice.
  fill(formId, c, user) { /* full templates in index.html */ },
};
```

### C5. Case-law citation layer — `Citation` (S12)

```javascript
const CITATIONS = {
  unfair_dismissal: [
    { law: 'LRA s188', text: 'A dismissal must be both substantively and procedurally fair.' },
    { law: 'LRA s191', text: 'Refer an unfair-dismissal dispute to the CCMA within 30 days.' },
    { law: 'Sidumo v Rustenburg Platinum', text: 'An award stands unless no reasonable commissioner could reach it.' },
  ],
  unfair_labour_practice: [ /* LRA s186(2), s191 */ ],
  unfair_discrimination:  [ /* EEA s6, s10 */ ],
  bcea_money_claim:       [ /* BCEA s73A, s34 */ ],
  nmw_underpayment:       [ /* NMWA s4 */ ],
  general:                [ /* LRA 66/1995, BCEA 75/1997 */ ],
};

const Citation = {
  build(disputeKey, docCount, answered) {
    const law = (CITATIONS[disputeKey] || CITATIONS.general).slice(0, 3);
    let confidence = 'fact-sensitive';
    if ((answered || 0) >= 3 && (docCount || 0) >= 2) confidence = 'reasonably grounded';
    if ((answered || 0) < 1) confidence = 'preliminary — needs more facts';
    return {
      law,                                  // layer 1: the statute / case law
      record: (docCount || 0) > 0           // layer 2: the user's own documents
        ? `${docCount} document(s) in your file support this assessment.`
        : 'No documents uploaded yet — add evidence to strengthen grounding.',
      confidence,                           // layer 3: honest confidence flag
    };
  },
};
```

---

## D. Hearing prep & settlement

### D1. Mock cross-examination — `CrossExam` (S9 / S10)

```javascript
const CrossExam = {
  questions(disputeKey, caseObj) {
    const universal = [
      { q: 'You say this happened on a specific date — what is your proof of that exact date?', attacks: 'date certainty' },
      { q: 'Did you raise this in writing at the time? If not, why not?', attacks: 'contemporaneous record' },
      { q: 'Is there anyone who saw this happen who can confirm your version?', attacks: 'corroboration' },
      { q: 'You’re telling us what you were told by someone else — isn’t that hearsay?', attacks: 'hearsay' },
    ];
    const byType = {
      unfair_dismissal: [
        { q: 'You were given a notice of a hearing, weren’t you? So how was the process unfair?', attacks: 'procedural fairness' },
        { q: 'Had you been warned about this conduct before? Show us the clean record.', attacks: 'prior warnings' },
      ],
      unfair_labour_practice: [{ q: 'Other employees were treated the same way, weren’t they?', attacks: 'comparator' }],
      unfair_discrimination:  [{ q: 'What is your direct evidence that the reason was your personal characteristic, rather than performance?', attacks: 'causation' }],
      bcea_money_claim:       [{ q: 'Your payslips show you were paid — what exactly is outstanding, and how is it calculated?', attacks: 'quantum' }],
    };
    return [...(byType[disputeKey] || []), ...universal];
  },
  // S10: gentler pacing for sensitive matters (discrimination/harassment)
  isSensitive(disputeKey, caseObj) {
    if (disputeKey === 'unfair_discrimination') return true;
    return !!(caseObj && /harass|assault|abuse|victimi|threat|intimidat/i
      .test((caseObj.description || '') + ' ' + (caseObj.name || '')));
  },
};
```

### D2. Settlement / negotiation prep — `Settlement` (S11)

```javascript
const Settlement = {
  heads() {  // the value heads to quantify before conciliation
    return [
      { key: 'notice', label: 'Notice pay', hint: 'Pay in lieu of your notice period.' },
      { key: 'leave', label: 'Outstanding leave', hint: 'Accrued but unpaid annual leave.' },
      { key: 'severance', label: 'Severance', hint: 'Retrenchment — 1 week per completed year (minimum).' },
      { key: 'comp', label: 'Compensation', hint: 'Unfair dismissal: up to 12 months’ pay (24 if automatically unfair).' },
      { key: 'reference', label: 'A written reference', hint: 'Often more valuable than cash for your next job.' },
      { key: 'record', label: 'Record cleared', hint: 'Removal of warnings / a neutral exit reason.' },
      { key: 'reinstatement', label: 'Reinstatement', hint: 'Your job back, with or without back-pay.' },
    ];
  },
  framing(successRate) {  // a BATNA-style steer based on the estimate
    if (successRate == null) return 'Complete your intake so we can weigh a settlement against your likely result at arbitration.';
    if (successRate >= 65)   return 'Your estimated prospects are reasonably strong — you can negotiate from a position of some confidence, but litigation always carries risk and delay.';
    if (successRate >= 45)   return 'Your prospects are finely balanced — a fair settlement now may well beat the uncertainty of arbitration.';
    return 'Your estimated prospects are on the weaker side — a negotiated exit may protect you better than an all-or-nothing hearing.';
  },
};
```

### D3. Case-file readiness — `Bundle` (S13)

```javascript
const Bundle = {
  sections(caseObj) {
    // returns the standard CCMA file parts with done/not-done, based on what
    // the user has built: intake note, deadline note, outcome, issue matrix,
    // chronology, evidence index, settlement brief.
  },
  readiness(caseObj) {
    const s = this.sections(caseObj);
    return Math.round(100 * s.filter(x => x.done).length / s.length);  // % ready
  },
};
```

---

## E. The "AI Actions" output templates

These are the one-tap generated documents (in `index.html`, in the actions
section). They assemble from the case data:

- **`summary`** — a shareable one-page case summary (matter type, scope,
  status, doc count, success estimate, background).
- **`opinion`** — a combined legal opinion, now ending with the **citation
  block** (C5) and a confidence flag.
- **`gaps`** — evidence-gap analysis: what's on file vs what's still
  recommended, and why each item matters.
- **`plan`** — a next-steps action plan with what the employer may do at each
  stage.
- **`email-employer` / `email-lawyer`** — drafted correspondence.

---

## How it fits together (one turn)

```
user types ─▶ classify() topic ─▶ respond():
                                    ├─ buildOpinion()  (rotated, outcome-aware)
                                    ├─ FOLLOWUPS  (next forensic question)
                                    ├─ EVIDENCE   (what to upload next)
                                    ├─ successRate()  (live estimate)
                                    ├─ detectEscalation()  (needs-a-lawyer?)
                                    └─ returns an aiTurn the chat renders
```

When live AI keys are set, the connector sends the **persona** + recent
**history** + **userText** to `netlify/functions/ai.js`, which routes to
Gemini or Claude (see `LLM-SCRIPTS.md`). With no keys, the `CaseEngine` above
produces the turn itself.

---

## One honest caveat

Everything in section C (CCMA deadlines, forms, citations) is built to be
accurate to the LRA/BCEA/EEA as at the dates in `LEGAL_FACTS`, but it is
**preparation logic, not legal advice**. The deadline maths are calendar-day
calculations; the citations are a curated set, not live legal research; the
CCMA form drafts must be checked against the official current forms before
filing. The escalation rules (A6) exist precisely to push genuinely complex
matters to a human attorney — keep that line.
```

---

## F. Professional case-prep engines (from the uploaded prompt set)

### F1. `BundleOrganiser` — the documentation-preparation prompt, simulation half
Classifies every uploaded document into **Groups A–E** by filename rules
(first match wins): C procedural (7.11/7.13/7.18, referral, service, set-down,
con-arb, condonation, ccma) → A contract/appointment → A policy → A
refusal/instruction/admission → A dismissal/disciplinary → A grievance/appeal
*outcomes* → B grievance/objection → D financial (payslip, deduction, bank,
invoice, medical-aid) → B witness/statement → **E screenshots (authentication
risk — checked before correspondence)** → B email/whatsapp/letters → E unknown
("Issue needs review").

Then: duplicate detection on normalised name stems (strips `(1)`, `copy`,
`final`, `v2`...; strongest-scored version retained, duplicate → Group E);
strength from the document-desk score (≥85 Strong, ≥60 Moderate, else Weak;
E → Needs review); hearsay/witness risk labels (employer HR/payroll email →
"possible employer admission"; screenshot → authentication risk; witness
statement → author should testify); proposed names
`[Group]-[NN]-[desc]-Date Unknown-[issue].pdf`; `bundleIndex()` in
commissioner story order (sections 1→9, mains only); `missing()` checklist
driven by uncovered categories (contract, payslips, 7.11+service, written
objection, policy, witnesses — each with why/urgency/how-to-get).

**Honesty ceiling (stated in the UI disclaimer):** classification is by file
NAME only — the simulation cannot read document contents, so page-level
selection (the document-minimisation prompt) is only possible on the live-AI
path with content access, and every grouping must be human-verified.

### F2. `EmployerAttack` — the employer-side attack prompt, simulation half
`ATTACKS` bank of 8 (jurisdiction, discretionary benefit, acquiescence, delay,
no-loss, hearsay, internal remedies, operational reasons), each with: the
employer's strongest version, a `defendsWith` regex tested against the user's
actual document names, evidence list + defence strength (Strong if a matching
doc scores ≥85, Moderate if any match, else **"No evidence found"** + High
risk), a short calm response for the employee, and one cross-examination
question for the employer's witness. Plus `COMMISSIONER` likely questions,
`PRESSURE` negotiation tactics with counters, and a readiness rating from the
gap share: 0 gaps + ≥3 strong → **Ready**; ≤25% gaps → **Mostly ready — with
gaps**; ≤60% → **Risky unless missing evidence is obtained**; else **Not
ready**.

Both tools render as structured web panels (AI Actions → "Organise evidence
bundle" / "Employer attack analysis") with copy/download for the bundle index.
On the live-LLM path the same tasks run with full reasoning via
`mode:'bundle'|'attack'` (see LLM-SCRIPTS.md §4).

---

## G. The case-strength loop (R1–R8)

**`CaseStrength` (R1)** — the central element-based model every tool reads.
`ELEMENTS` per dispute type (5 elements, weights sum 100): e.g. unfair
dismissal = dismissal proven / procedural challenged / referral in time /
loss quantified / chronology built. `coverage()` per element: matching doc 1.0;
pleaded issue-row with support 0.65; pleaded only 0.35; deadline element maps
status ok/soon→1, urgent→0.7, missed→0.15. **Penalties:** missed deadline −12;
unanswered employer attacks −2 each (max −8, via EmployerAttack.analyse);
admitted weaknesses without support −3 each (max −9). Score = 20 + 68×weighted
coverage − penalties, clamped 20–88. `refresh(c)` loads docs+timeline,
computes, persists `c._strength` + `c.successRate` (one number everywhere —
chat respond() prefers it over the old engagement formula) and snapshots
`c.strengthHist` (R4, max 40, only on change). Refresh fires on: dashboard
render, every chat turn, every upload, chase ticks, bundle/attack runs.

**`Chase` (R3)** — persistent evidence-to-chase list on the case
(`c.chase[]`): deduped by normalised label, keyword `matchRe` built from the
label; populated by BundleOrganiser.missing(), EmployerAttack gaps (via a
GAP_DOCS key→document map), and manual test adds; `autoMatch(c, docName)`
ticks items when an upload's filename matches — wired into `addDoc` (which
also replaced the old flat +4 nudge with a full refresh).

**R2** next-best-steps: unclosed elements ranked by `weight×(1−coverage)×0.68`
gain + open chase items; top 4 rendered as tap-to-navigate buttons.
**R5** every chat message (typed or spoken) runs NoteExtractor → notes;
Timeline-tagged facts become deduped draft chronology entries (`fromChat`,
"Date to confirm"). **R6** `c.lastBundleRun`/`c.lastAttackRun` stamps; actions
tab badges "not yet run" / "N new docs — re-run" when doc count differs.
**R7** timeline events carry optional `docName` (selector in the edit modal,
chip on the card). **R8** `.health-strip` above every tab: strength %,
deadline countdown, open-chase count; taps navigate to the dashboard.
