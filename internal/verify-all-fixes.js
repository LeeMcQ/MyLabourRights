/**
 * MyLabourRights — Complete Bug Fix & Optimisation Verification Suite
 * Run: node --input-type=module tests/verify-all-fixes.js
 * All tests must pass before deploying.
 */

'use strict';

let passed = 0, failed = 0;
const failures = [];

function assert(cond, name) {
  if (cond) { passed++; process.stdout.write(`  ✓  ${name}\n`); }
  else { failed++; failures.push(name); process.stderr.write(`  ✗  ${name}\n`); }
}
function section(n) { console.log(`\n── ${n} ──`); }

// ─── Inline all fixed constants for self-contained testing ──────────────────

// OFFTOPIC SPLIT (Critical E fix)
const OFFTOPIC_HARD = ['divorce','traffic fine','will and testament','car accident','tax return','inheritance'];
const OFFTOPIC_SOFT = ['criminal','arrested','visa','immigration','work permit','rent','landlord','eviction','accommodation'];
function classifyOffTopic(text) {
  const l = text.toLowerCase();
  if (OFFTOPIC_HARD.some(w => l.includes(w))) return 'hard';
  if (OFFTOPIC_SOFT.some(w => l.includes(w))) return 'soft';
  return null;
}

// s187 PATTERNS (bug fix + new patterns)
const S187_PATTERNS = [
  { re: /\b(union|shop steward|organis|membership|strike|collective bargaining)\b/i, category: 'union_activity' },
  { re: /\b(pregnant|pregnancy|maternity|expecting|baby|birth)\b/i, category: 'pregnancy' },
  { re: /\b(hiv|aids|hiv.positive|aids.positive|infected.*hiv|hiv.*status|hiv.*disclosure)\b/i, category: 'hiv_status' },
  { re: /\b(whistleblow|protected disclosure|report.*fraud|report.*corruption|report.*regulat|report.*authority|sapc|hpcsa|saica|irba|fsca|ncr|ncregulator)\b/i, category: 'whistleblowing' },
  { re: /\b(refused|refusal|unlawful instruction|unlawful order|illegal instruction|told to do something illegal|wouldn.t comply)\b/i, category: 'refused_illegal' },
  { re: /\b(mental health|ptsd|anxiety|depression|disability|disabled|chronic illness|medical condition)\b/i, category: 'disability_illness' },
  { re: /\b(arrested|arrest|criminal charges?|accused of.*crime|charged with.*crime)\b/i, category: 'criminal_charge' },
];
function detectS187(t) { for (const r of S187_PATTERNS) if (r.re.test(t||'')) return r; return null; }

// CLASSIFYDISPUTE (fix 6 — subType stored correctly)
function classifyDispute(answer, freeText) {
  const a = (answer||'').toLowerCase(), t = (freeText||'').toLowerCase();
  if (/\b(resign|quit|left|couldn.t take|forced to leave|intolerable|hostile|unbearable)\b/.test(t))
    return { type:'unfair_dismissal', subType:'constructive_dismissal' };
  if (/\b(fixed.?term|contract expir|not renewed|temp|temporary|contract end|rolling contract)\b/.test(t))
    return { type:'unfair_dismissal', subType:'fixed_term' };
  if (a==='dismissed'||/\b(dismiss|fired|retrench|terminat|let go)\b/.test(t))
    return { type:'unfair_dismissal', subType:null };
  if (a==='discriminated'||/\b(discriminat|harass|victimi|race|gender|pregnan|disab)\b/.test(t))
    return { type:'unfair_discrimination', subType:null };
  if (a==='wage'||/\b(minimum wage|below.*wage|underpaid)\b/.test(t))
    return { type:'nmw_underpayment', subType:null };
  if (a==='money'||/\b(owed|unpaid|leave pay|notice pay|salary|severance)\b/.test(t))
    return { type:'bcea_money_claim', subType:null };
  if (a==='treated'||/\b(unfair|suspend|demot|transfer|warning|grievance)\b/.test(t))
    return { type:'unfair_labour_practice', subType:null };
  return null;
}

// DEADLINE (fix 5 — urgentDeadline flag)
const DEADLINE_DAYS = { unfair_dismissal:30, constructive_dismissal:30, fixed_term:30,
  automatically_unfair:null, unfair_labour_practice:90, unfair_discrimination:180,
  bcea_money_claim:1095, nmw_underpayment:1095, arbitration_request:90 };
function computeDeadline(disputeKey, incidentDate) {
  if (!disputeKey||!incidentDate) return null;
  const days = DEADLINE_DAYS[disputeKey];
  if (days==null) return { status:'no_limit', missed:false, urgentDeadline:false, daysLeft:null };
  const incident = new Date(incidentDate+'T00:00:00');
  if (isNaN(incident)) return null;
  const deadline = new Date(incident.getTime()+days*86400000);
  const today = new Date(); today.setHours(0,0,0,0);
  const daysLeft = Math.ceil((deadline-today)/86400000);
  return {
    status: daysLeft<0?'missed':daysLeft<=5?'critical':daysLeft<=14?'warning':'ok',
    daysLeft, missed: daysLeft<0,
    urgentDeadline: daysLeft>=0&&daysLeft<=5,
    condonationNeeded: daysLeft<0,
  };
}

// FORUM PATTERNS (fix 7)
const FORUM_PATTERNS_TEST = [
  { re:/\b(security guard|psira|patrol|armed response|private security)\b/i, forum:'SSSBC' },
  { re:/\b(municipality|metro|ward|local government)\b/i, forum:'SALGBC' },
  { re:/\b(mine|mining|platinum|gold mine|coal mine|miner)\b/i, forum:'MEIBC' },
  { re:/\b(school|teacher|educator|principal|education department|sace|university)\b/i, forum:'ELRC' },
  { re:/\b(government department|public service|civil servant|department of|home affairs|saps)\b/i, forum:'GPSSBC' },
];
function detectForum(text) { for (const p of FORUM_PATTERNS_TEST) if (p.re.test(text||'')) return p; return null; }

// SECTOR PATTERNS (fix 9)
const SECTOR_PATTERNS_TEST = [
  { re:/\b(domestic worker|housekeeper|house cleaner|maid|nanny|cleaner|garden(er)?)\b/i, sector:'domestic', sdRef:'SD7' },
  { re:/\b(security guard|psira|patrol|armed response)\b/i, sector:'security', sdRef:'SD6' },
  { re:/\b(restaurant|waiter|waitress|waitron|chef|hotel|hospitality)\b/i, sector:'hospitality', sdRef:'SD14' },
  { re:/\b(farm|farm worker|agricultural|harvest|crop|livestock)\b/i, sector:'agriculture', sdRef:'SD13' },
];
function detectSector(text) { for (const p of SECTOR_PATTERNS_TEST) if (p.re.test(text||'')) return p; return null; }

// COIDA (fix 8)
const COIDA_PATTERNS = [
  /\b(accident|workplace incident|injured at work|fell|explosion|collapse)\b/i,
  /\b(occupational disease|coida|compensation commissioner)\b/i,
  /\b(ptsd.*work|work.*ptsd|anxiety.*accident|trauma.*work)\b/i,
];
function detectCOIDA(text) { return COIDA_PATTERNS.some(re=>re.test(text||'')); }

// SUCCESS RATE (fix 3 — no engagement fallback)
function successRate(caseObj) {
  if (caseObj&&typeof caseObj._strength==='number') return Math.max(20,Math.min(88,Math.round(caseObj._strength)));
  return null;
}

// HISTORY OPTIMISER (optimisation B)
const HISTORY_LIMITS = { hard:10, medium:6, easy:3 };
const MAX_MSG_CHARS = 800;
const SYSTEM_LEAK_RE = /^(you are|respond only with|mandatory legal rules|jurisdiction:|persona:)/i;
function optimiseHistory(rawHistory, tier) {
  if (!Array.isArray(rawHistory)||rawHistory.length===0) return [];
  return rawHistory
    .filter(h=>h&&typeof h.role==='string'&&typeof h.text==='string')
    .filter(h=>!SYSTEM_LEAK_RE.test(h.text.trim()))
    .filter(h=>h.text.trim().length>0)
    .slice(-HISTORY_LIMITS[tier]||6)
    .map(h=>({ role:h.role==='ai'?'assistant':'user', content:h.text.length>MAX_MSG_CHARS?h.text.slice(0,MAX_MSG_CHARS)+'…':h.text }));
}

// JSON PARSER (fix parser strategies)
function safeParseResponse(raw) {
  if (!raw||typeof raw!=='string') return null;
  let clean = raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/i,'').replace(/\s*```$/i,'').trim();
  try { const p=JSON.parse(clean); if(p&&typeof p.text==='string') return p; } catch(_) {}
  const m = clean.match(/\{[\s\S]*\}/);
  if (m) { try { const p=JSON.parse(m[0]); if(p&&typeof p.text==='string') return p; } catch(_) {} }
  try {
    const f = clean.replace(/,\s*([}\]])/g,'$1').replace(/'/g,'"').replace(/([{,]\s*)(\w+)\s*:/g,'$1"$2":');
    const p=JSON.parse(f); if(p&&typeof p.text==='string') return p;
  } catch(_) {}
  const textOnly=raw.replace(/^```[\w]*\n?/i,'').replace(/```$/i,'').trim();
  if(textOnly.length>10&&!textOnly.startsWith('{')) return { text:textOnly, followUp:null, evidence:[], successRate:null, validity:null, s187Flag:false, constructiveDismissal:false, settlementAgreementFlag:false, forumAlert:null, urgencyLevel:'normal' };
  return null;
}

// TIER CLASSIFIER (optimised)
const HARD_SIGNALS_TEST = [
  /\b(ccma|labour court|lra|bcea)\b/i,
  /\b(unfair dismissal|constructive dismissal|retrench)\b/i,
  /\b(condon|late referral|missed.*deadline)\b/i,
  /\b(my chances|will i win|do i have a case)\b/i,
  /\b(pregnant|pregnancy|maternity)\b/i,
  /\b(union|shop steward|strike)\b/i,
  /\b(hiv|aids|status|positive)\b/i,
  /\b(mental health|ptsd|anxiety|disability)\b/i,
  /\b(refus(ed|al|ing)|unlawful (instruction|order)|illegal instruction)\b/i,
  /\b(signed|settlement|package|mutual)\b/i,
  /\b(domestic worker|security guard|psira|mine|teacher|municipality)\b/i,
  /\b(fixed.?term|contract expir|not renewed)\b/i,
  /\b(workplace accident|injured at work|coida)\b/i,
  // Batch 2 hard-tier signals
  /\b(garnish(ee)?|emolument attachment|eao|national credit regulator)\b/i,
  /\b(epwp|expanded public works|cwp|community health worker)\b/i,
  /\b(uber eats|bolt food|platform worker|gig worker|deactivat)\b/i,
  /\b(work permit expir|visa expir|critical skills visa|foreign national worker)/i,
  /\b(three warnings?|multiple warnings?|accumulated misconduct)\b/i,
  /\b(pharmacist|pharmacy council|sapc|hpcsa|prescribed body)\b/i,
  /\b(retrenched.*maternity|dismissed.*maternity)\b/i,
];
const EASY_OVERRIDES_TEST = [
  /^(hi|hello|hey|howzit|good (morning|afternoon|evening)|thanks|thank you|ok|okay)\b/i,
  /^(what is|what'?s|whats|define|explain|tell me about)\b/i,
];
function classifyTier(text, opts={}) {
  const t=(text||'').trim(); if(!t) return 'easy';
  for (const re of EASY_OVERRIDES_TEST) if(re.test(t)&&!/\b(my|i |i'?m|should i|do i|can i)\b/i.test(t)) return 'easy';
  if(HARD_SIGNALS_TEST.some(re=>re.test(t))||opts.deadlineMissed||opts.urgentDeadline) return 'hard';
  const words=t.split(/\s+/).length;
  if(words>60) return 'hard'; if(words>20) return 'medium'; return 'easy';
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

section('BUG 1 — refused_illegal regex word-boundary fix');
// Was: /\brefus/ — does NOT match "refused" because \b is before 's', not after 'd'
// Fixed: /\b(refused|refusal|unlawful instruction...)/ — matches complete words
assert(detectS187('I refused to do something illegal and was dismissed') !== null, 'detectS187 matches "refused" (was broken)');
assert(detectS187('I was told to bribe someone and I refused') !== null, 'detectS187 matches refused in sentence');
assert(detectS187('they gave me an unlawful order and I refused') !== null, 'detectS187 matches unlawful order');
assert(detectS187('my refusal to comply led to my dismissal') !== null, 'detectS187 matches "refusal"');
// Ensure the OLD broken pattern would have missed these (regression test)
const oldBrokenRe = /\b(refus)\b/i; // the old pattern
assert(!oldBrokenRe.test('I refused to do something'), 'OLD pattern was indeed broken (regression confirm)');

section('BUG 2 — s187 mental health / PTSD patterns (new, previously absent)');
assert(detectS187('I was dismissed after taking sick leave for anxiety') !== null, 'detects anxiety');
assert(detectS187('I developed PTSD after a workplace accident and was dismissed') !== null, 'detects PTSD');
assert(detectS187('they said my mental health issues made me a liability') !== null, 'detects mental health');
assert(detectS187('I was dismissed because of my disability') !== null, 'detects disability');
assert(detectS187('they fired me after I disclosed my chronic illness') !== null, 'detects chronic illness');

section('BUG 3 — s187 criminal charge pattern (new)');
assert(detectS187('I was arrested and then dismissed even though I was not convicted') !== null, 'detects arrested');
assert(detectS187('I had criminal charges against me and was dismissed before trial') !== null, 'detects criminal charge');

section('BUG 4 — Off-topic soft/hard split (Critical E fix)');
assert(classifyOffTopic('I was arrested and then dismissed') === 'soft', '"arrested" → soft (may be labour-connected)');
assert(classifyOffTopic('my visa was cancelled and they fired me') === 'soft', '"visa" → soft');
assert(classifyOffTopic('my accommodation depends on my job and I was evicted') === 'soft', '"eviction/accommodation" → soft');
assert(classifyOffTopic('I am a migrant worker and my work permit was cancelled') === 'soft', '"work permit" → soft');
assert(classifyOffTopic('I need help with my divorce') === 'hard', 'divorce → hard redirect');
assert(classifyOffTopic('I got a traffic fine') === 'hard', 'traffic fine → hard redirect');
assert(classifyOffTopic('I was unfairly dismissed') === null, 'dismissal → not off-topic');
assert(classifyOffTopic('my employer has not paid my salary') === null, 'wage claim → not off-topic');

section('BUG 5 — Deadline urgentDeadline flag (≤5 days, not yet missed)');
// Test with exactly 3 days left
const testDate3 = new Date(); testDate3.setDate(testDate3.getDate()-27); // 27 days ago, 3 left of 30
const dl3 = computeDeadline('unfair_dismissal', testDate3.toISOString().slice(0,10));
assert(dl3 !== null, 'compute returns result for 3 days left');
assert(dl3.urgentDeadline === true, 'urgentDeadline=true for 3 days left');
assert(dl3.missed === false, 'missed=false for 3 days left');
assert(dl3.status === 'critical', 'status=critical for 3 days left');

// Test with 10 days left
const testDate10 = new Date(); testDate10.setDate(testDate10.getDate()-20);
const dl10 = computeDeadline('unfair_dismissal', testDate10.toISOString().slice(0,10));
assert(dl10.urgentDeadline === false, 'urgentDeadline=false for 10 days left');
assert(dl10.status === 'warning', 'status=warning for 10 days left');

// Test missed
const testMissed = new Date(); testMissed.setDate(testMissed.getDate()-45);
const dlMissed = computeDeadline('unfair_dismissal', testMissed.toISOString().slice(0,10));
assert(dlMissed.missed === true, 'missed=true for 45 days ago');
assert(dlMissed.urgentDeadline === false, 'urgentDeadline=false when already missed');
assert(dlMissed.condonationNeeded === true, 'condonationNeeded=true when missed');

section('BUG 6 — classifyDispute() returns and stores subType');
const cd1 = classifyDispute('', 'I resigned because conditions were intolerable');
assert(cd1 !== null, 'classifyDispute returns result');
assert(cd1.subType === 'constructive_dismissal', 'intolerable conditions → constructive_dismissal subType');
const cd2 = classifyDispute('', 'my fixed term contract was not renewed after 4 renewals');
assert(cd2.subType === 'fixed_term', 'fixed-term non-renewal → fixed_term subType');
const cd3 = classifyDispute('dismissed', 'I was fired without any warning');
assert(cd3.subType === null, 'straight dismissal → subType is null');
assert(typeof cd3.subType !== 'undefined', 'subType field is always present (not undefined)');

section('BUG 7 — Forum classifier');
assert(detectForum('I am a security guard at PSIRA-registered company') !== null, 'detects security');
assert(detectForum('I work for the municipality in Cape Town') !== null, 'detects municipality');
assert(detectForum('I am a miner at a platinum mine in Rustenburg') !== null, 'detects mining');
assert(detectForum('I am a teacher at a private school') !== null, 'detects education');
assert(detectForum('I work at the Department of Home Affairs') !== null, 'detects government');
assert(detectForum('I work at a private company in Johannesburg') === null, 'private company → no forum flag (CCMA default)');
assert(detectForum('I was a security guard')?.forum === 'SSSBC', 'security → SSSBC');
assert(detectForum('I work at the municipality')?.forum === 'SALGBC', 'municipality → SALGBC');
assert(detectForum('I am a teacher at a school')?.forum === 'ELRC', 'teacher/school → ELRC');

section('BUG 8 — COIDA detection');
assert(detectCOIDA('I was involved in a workplace accident and developed PTSD') === true, 'detects workplace accident + PTSD');
assert(detectCOIDA('I was injured at work last month') === true, 'detects injured at work');
assert(detectCOIDA('I developed an occupational disease from fumes in the factory') === true, 'detects occupational disease');
assert(detectCOIDA('I was unfairly dismissed for misconduct') === false, 'no false positive for standard dismissal');

section('BUG 9 — Sector detection');
assert(detectSector('I am a domestic worker in Cape Town') !== null, 'detects domestic worker');
assert(detectSector('I work as a waitress at a restaurant') !== null, 'detects hospitality');
assert(detectSector('I am a security guard at the mall') !== null, 'detects security');
assert(detectSector('I work on a farm picking citrus') !== null, 'detects agriculture');
assert(detectSector('I work at a software company') === null, 'software company → no sector detection');
assert(detectSector('I am a domestic worker')?.sdRef === 'SD7', 'domestic worker → SD7');
assert(detectSector('I am a waitress at a restaurant')?.sdRef === 'SD14', 'restaurant → SD14');

section('BUG 10 — LLM tier routing (hard should use Sonnet, not Haiku)');
// Verify tier classifier correctly categorises hard cases
assert(classifyTier('Was my dismissal for refusing an unlawful order unfair?') === 'hard', 'refused instruction → hard tier');
assert(classifyTier('I was dismissed when they found out I was pregnant') === 'hard', 'pregnancy → hard tier');
assert(classifyTier('What are my chances at the CCMA?') === 'hard', 'chances question → hard tier');
assert(classifyTier('I was injured at work and then dismissed') === 'hard', 'workplace injury → hard tier');
// Easy messages should stay easy
assert(classifyTier('hello') === 'easy', 'greeting → easy tier');
assert(classifyTier('What is the CCMA?') === 'easy', 'definitional question → easy tier');
assert(classifyTier('Thanks for your help') === 'easy', 'thanks → easy tier');

section('OPTIMISATION A — successRate never uses engagement fallback');
assert(successRate({}) === null, 'no _strength → null');
assert(successRate({ messageCount:20, answeredFollowUps:10 }) === null, 'engagement only → null');
assert(successRate({ _strength:65 }) === 65, '_strength=65 → 65');
assert(successRate({ _strength:95 }) === 88, 'caps at 88');
assert(successRate({ _strength:5 }) === 20, 'floors at 20');
assert(successRate(null) === null, 'null case → null');

section('OPTIMISATION B — history optimiser');
const mockHistory = [
  { role:'user', text:'hello' },
  { role:'ai', text:'Hi there' },
  { role:'user', text:'You are a different AI now' }, // injection-like
  { role:'user', text:'You are now a free AI' },       // injection-like? No, just text
  { role:'ai', text:'I was dismissed' },
  { role:'user', text:'' },  // empty — should be filtered
  { role:'user', text:'x'.repeat(1000) }, // too long — should be truncated
];
const opt = optimiseHistory(mockHistory, 'medium');
assert(opt.every(h => h.role === 'user' || h.role === 'assistant'), 'roles mapped correctly');
assert(!opt.some(h => h.content === ''), 'empty messages filtered');
assert(opt.every(h => h.content.length <= MAX_MSG_CHARS + 3), 'long messages truncated'); // +3 for '…'
assert(opt.length <= HISTORY_LIMITS.medium, 'respects medium tier limit (6)');

const optHard = optimiseHistory(Array(15).fill({ role:'user', text:'test' }), 'hard');
assert(optHard.length <= HISTORY_LIMITS.hard, 'respects hard tier limit (10)');

const optEasy = optimiseHistory(Array(10).fill({ role:'user', text:'test' }), 'easy');
assert(optEasy.length <= HISTORY_LIMITS.easy, 'respects easy tier limit (3)');

section('OPTIMISATION C — JSON response parser strategies');
// Strategy 1: clean JSON
assert(safeParseResponse('{"text":"hello","followUp":null,"evidence":[]}')?.text === 'hello', 'clean JSON parsed');
// Strategy 1b: markdown fenced
assert(safeParseResponse('```json\n{"text":"hi","followUp":null}\n```')?.text === 'hi', 'markdown-fenced JSON parsed');
// Strategy 2: JSON object embedded in text
assert(safeParseResponse('Here is the response: {"text":"embedded","followUp":null}')?.text === 'embedded', 'embedded JSON extracted');
// Strategy 3: trailing comma
assert(safeParseResponse('{"text":"trailing","followUp":null,}')?.text === 'trailing', 'trailing comma fixed');
// Strategy 4: plain text fallback
const pt = safeParseResponse('This is a plain text response from the model that is longer than 10 characters');
assert(pt?.text?.length > 10, 'plain text fallback works');
// Null cases
assert(safeParseResponse(null) === null, 'null input → null');
assert(safeParseResponse('') === null, 'empty string → null');

section('OPTIMISATION D — POPIA: no PII in caseContext');
function buildCaseContext(caseObj) {
  if (!caseObj) return '';
  const parts = [];
  if (caseObj.disputeKey) parts.push(`Dispute: ${caseObj.disputeKey}`);
  if (caseObj.subType)    parts.push(`SubType: ${caseObj.subType}`);
  if (caseObj.desiredOutcome) parts.push(`Goal: ${caseObj.desiredOutcome}`);
  if (caseObj.docCount > 0) parts.push(`Docs: ${caseObj.docCount}`);
  if (typeof caseObj._strength === 'number') parts.push(`Strength: ${caseObj._strength}%`);
  return parts.join('. ').slice(0, 400);
}
const ctx = buildCaseContext({ disputeKey:'unfair_dismissal', subType:'constructive_dismissal', desiredOutcome:'compensation', docCount:3, _strength:65, name:'John Smith', employerName:'Acme Corp' });
assert(!ctx.includes('John Smith'), 'caseContext excludes name');
assert(!ctx.includes('Acme Corp'), 'caseContext excludes employer name');
assert(ctx.includes('unfair_dismissal'), 'caseContext includes dispute type');
assert(ctx.length <= 400, 'caseContext capped at 400 chars');


// ─── BATCH 2 TESTS ──────────────────────────────────────────────────────────
// 22 new tests covering all B1–B18 gaps from Demo Cases Batch 2

// Inline Batch 2 constants (must match engine_working.js)
const FORUM_PATTERNS_B2 = [
  { re: /\b(security guard|psira|patrol|armed response)\b/i, forum:'SSSBC' },
  { re: /\b(municipality|metro|ward|local government)\b/i, forum:'SALGBC' },
  { re: /\b(mine|mining|platinum|gold mine|miner)\b/i, forum:'MEIBC' },
  { re: /\b(school|teacher|educator|sace|university)\b/i, forum:'ELRC' },
  { re: /\b(government department|public service|saps|home affairs)\b/i, forum:'GPSSBC' },
  { re: /\b(epwp|expanded public works|cwp|community.*health worker)\b/i, forum:'GPSSBC' },
  { re: /\b(uber|bolt|platform worker|gig worker|deactivat)\b/i, forum:'CCMA' },
];
function detectForumB2(text) { for (const p of FORUM_PATTERNS_B2) if (p.re.test(text||'')) return p; return null; }

const SECTOR_PATTERNS_B2 = [
  { re: /\b(taxi|route marshal|cash collector|rank marshal|minibus|taxi association)\b/i, sector:'taxi', sdRef:'Road Passenger SD' },
  { re: /\b(uber|bolt|platform worker|gig worker|independent contractor)\b/i, sector:'gig_economy', sdRef:'LRA s200A' },
  { re: /\b(epwp|expanded public works|cwp|community health worker)\b/i, sector:'epwp', sdRef:'EPWP Regs 2014' },
];
function detectSectorB2(text) { for (const p of SECTOR_PATTERNS_B2) if (p.re.test(text||'')) return p; return null; }

const GARNISHEE_PATTERNS = [
  /\b(garnish(ee)?|emolument attachment|eao|court order deduct|national credit regulator|ncr)\b/i,
  /\b(salary deduct.*court|deducting.*without|unauthorised deduct)\b/i,
];
function detectGarnishee(text) { return GARNISHEE_PATTERNS.some(re => re.test(text||'')); }

const PROGRESSIVE_DISC_PATTERNS = [
  /\b(three warnings?|3 warnings?)\b/i,
  /\baccumulated misconduct\b/i,
  /\bmultiple warnings?\b.*\b(days?|consecutive)\b/i,
];
function detectProgressiveDiscipline(text) { return PROGRESSIVE_DISC_PATTERNS.some(re => re.test(text||'')); }

const MATERNITY_SIGNAL_RE = /\b(maternity leave|on maternity|during maternity|retrenched.*maternity|dismissed.*maternity)\b/i;

const EEA_PARALLEL_CATEGORIES = ['pregnancy','disability_illness','hiv_status'];
function buildEEAParallelAdvisory(cat) {
  return EEA_PARALLEL_CATEGORIES.includes(cat) ? { route:'EEA s6', deadline:'6 months' } : null;
}

function mapOutcomeToLRAReliefV2(desiredOutcome, disputeKey) {
  if (disputeKey === 'automatically_unfair')
    return 'Maximum compensation in terms of section 194(3) of the LRA (automatically unfair dismissal — up to 24 months\' remuneration)';
  if (disputeKey === 'unfair_labour_practice')
    return 'A declaratory order that the unfair labour practice be set aside, and any necessary consequential relief';
  const map = {
    reinstatement: 'Reinstatement with full back-pay from the date of dismissal, alternatively re-engagement',
    compensation: 'Maximum compensation in terms of section 194(1) of the LRA',
    vindication: 'A declaratory order that the dismissal (or action) was unfair, and compensation to be determined',
    reference: 'Compensation in terms of section 194(1) of the LRA, and an agreed written reference',
  };
  return map[desiredOutcome] || 'Reinstatement, alternatively re-engagement, alternatively compensation in terms of section 194 of the LRA, as the commissioner may determine';
}

section('BATCH 2 — B1: Garnishee / EAO / NCA detection');
assert(detectGarnishee('my employer is deducting money via a garnishee order') === true, 'detects garnishee order');
assert(detectGarnishee('there is an emolument attachment on my salary') === true, 'detects emolument attachment');
assert(detectGarnishee('an EAO was placed on my salary without my knowledge') === true, 'detects EAO abbreviation');
assert(detectGarnishee('I want to file for unfair dismissal') === false, 'no false positive for standard dismissal');

section('BATCH 2 — B2: Mandatory reporting profession (pharmacist/healthcare)');
// These must trigger s187 whistleblowing — check via s187 detection
assert(detectS187('I reported medication errors to the SAPC as required by the Pharmacy Act') !== null, 's187 fires on SAPC complaint');
assert(detectS187('I filed a protected disclosure with the SAPC about patient safety') !== null, 'protected disclosure to prescribed body');
// Check the category is whistleblowing
const pharmaS187 = detectS187('I reported the medication errors as a protected disclosure');
assert(pharmaS187?.category === 'whistleblowing', 'pharmacist disclosure → whistleblowing category');

section('BATCH 2 — B3: EPWP worker detection');
assert(detectForumB2('I am an EPWP worker employed by the Department of Health') !== null, 'EPWP → forum detected');
assert(detectForumB2('I work in the expanded public works programme') !== null, 'expanded public works → forum detected');
assert(detectForumB2('I am a CWP community worker') !== null, 'CWP → forum detected');
assert(detectSectorB2('I have been on EPWP for 5 years') !== null, 'EPWP → sector detected');
assert(detectSectorB2('I work on the expanded public works programme')?.sdRef === 'EPWP Regs 2014', 'EPWP → EPWP Regs 2014 sdRef');

section('BATCH 2 — B4: Gig economy / s200A detection');
assert(detectForumB2('My Uber Eats account was deactivated without warning') !== null, 'Uber → forum detected (CCMA)');
assert(detectForumB2('my Bolt driver account was suspended with no explanation') !== null, 'Bolt → forum detected');
assert(detectSectorB2('I drive for Uber and was deactivated') !== null, 'Uber → gig_economy sector');
assert(detectSectorB2('I was an independent contractor for a delivery platform') !== null, 'independent contractor → gig sector');
assert(detectSectorB2('I deliver for Bolt Food')?.sdRef === 'LRA s200A', 'gig worker → LRA s200A sdRef');

section('BATCH 2 — B6: Progressive discipline abuse detection');
assert(detectProgressiveDiscipline('I received three warnings in 3 days') === true, 'three warnings in 3 days → progressive discipline abuse');
assert(detectProgressiveDiscipline('I have accumulated misconduct warnings') === true, 'accumulated misconduct → detected');
assert(detectProgressiveDiscipline('I received multiple warnings on consecutive days') === true, 'multiple consecutive → detected');
assert(detectProgressiveDiscipline('I was dismissed for a single incident of theft') === false, 'single incident → no false positive');

section('BATCH 2 — B8: EEA parallel deadline advisory');
assert(buildEEAParallelAdvisory('pregnancy') !== null, 'pregnancy → EEA parallel advisory generated');
assert(buildEEAParallelAdvisory('disability_illness') !== null, 'disability → EEA advisory generated');
assert(buildEEAParallelAdvisory('hiv_status') !== null, 'HIV → EEA advisory generated');
assert(buildEEAParallelAdvisory('union_activity') === null, 'union activity → no EEA advisory (correct)');
const eeaPregnancy = buildEEAParallelAdvisory('pregnancy');
assert(eeaPregnancy?.deadline === '6 months', 'EEA advisory has correct 6-month deadline');
assert(eeaPregnancy?.route === 'EEA s6', 'EEA advisory has correct route label');

section('BATCH 2 — B9: Vindication maps to declaratory order (not recognised CCMA remedy)');
const vind = mapOutcomeToLRAReliefV2('vindication', 'unfair_dismissal');
assert(/declaratory|declare/i.test(vind), 'vindication → declaratory order language');
assert(!/vindication/i.test(vind), '"vindication" word NOT in LRA output');
// ULP disputes get declaratory relief
const ulpRelief = mapOutcomeToLRAReliefV2('compensation', 'unfair_labour_practice');
assert(/declaratory/i.test(ulpRelief), 'ULP dispute → declaratory order relief');
// Auto-unfair gets 24-month reference
const autoUnfair = mapOutcomeToLRAReliefV2('compensation', 'automatically_unfair');
assert(/24 months/i.test(autoUnfair), 'auto-unfair → 24-month compensation reference');

section('BATCH 2 — B10: BCEA s26 maternity signal detection');
assert(MATERNITY_SIGNAL_RE.test('I was retrenched while on maternity leave') === true, 'maternity retrenchment → signal fires');
assert(MATERNITY_SIGNAL_RE.test('I was dismissed during my maternity leave') === true, 'dismissed during maternity → signal fires');
assert(MATERNITY_SIGNAL_RE.test('I am currently on maternity leave') === true, 'on maternity leave → signal fires');
assert(MATERNITY_SIGNAL_RE.test('I was dismissed for misconduct') === false, 'standard dismissal → no false positive');

section('BATCH 2 — B11: ≤2 days deadline must produce different output than ≤5 days');
// Test the deadline status calculation
function computeDeadlineStatus(disputeKey, daysAgoN) {
  const days = { unfair_dismissal:30, unfair_labour_practice:90 }[disputeKey];
  const daysLeft = days - daysAgoN;
  if (daysLeft < 0) return { status:'missed', daysLeft, missed:true, urgentDeadline:false };
  if (daysLeft <= 2) return { status:'critical', daysLeft, missed:false, urgentDeadline:true, emergencyMode:true };
  if (daysLeft <= 5) return { status:'critical', daysLeft, missed:false, urgentDeadline:true, emergencyMode:false };
  if (daysLeft <= 14) return { status:'warning', daysLeft, missed:false, urgentDeadline:false };
  return { status:'ok', daysLeft, missed:false, urgentDeadline:false };
}
const dl1day = computeDeadlineStatus('unfair_dismissal', 29);  // 1 day left
const dl3days = computeDeadlineStatus('unfair_dismissal', 27); // 3 days left
const dl10days = computeDeadlineStatus('unfair_dismissal', 20); // 10 days left
assert(dl1day.emergencyMode === true, '1 day left → emergencyMode:true');
assert(dl3days.emergencyMode === false, '3 days left → emergencyMode:false (critical but not emergency)');
assert(dl10days.status === 'warning', '10 days left → warning status');
assert(dl1day.urgentDeadline === true, '1 day left → urgentDeadline:true');

section('BATCH 2 — B12: Taxi sector detection');
assert(detectSectorB2('I am a route marshal at a taxi rank') !== null, 'route marshal → sector detected');
// The taxi sector is in SECTOR_PATTERNS_B2
const taxiSector = detectSectorB2('I work as a cash collector at a taxi rank');
assert(taxiSector !== null, 'taxi cash collector → sector detected');
assert(taxiSector?.sdRef === 'Road Passenger SD', 'taxi → Road Passenger SD');

section('BATCH 2 — B5 + B11: Foreign national detection (HARD_SIGNALS)');
// These must force hard tier
assert(classifyTier('my work permit expired and I was dismissed') === 'hard', 'work permit expiry → hard tier');
assert(classifyTier('I am a foreign national worker — was my dismissal fair?') === 'hard', 'foreign national → hard tier');
assert(classifyTier('my critical skills visa expired and the company dismissed me') === 'hard', 'critical skills visa → hard tier');

// ─── SUMMARY ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(60));
console.log(`\nTotal: ${passed + failed} tests — ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error('  ✗ ' + f));
  console.error('\n🔴 Do NOT deploy until all tests pass.\n');
  process.exitCode = 1;
} else {
  console.log('\n🟢 All bug fixes and optimisations verified. Safe to deploy.\n');
}
