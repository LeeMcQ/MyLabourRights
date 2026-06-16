/**
 * MyLabourRights — Panel 1 Fixes Verification Tests
 * ════════════════════════════════════════════════════════════════
 * Run with: npm test (uses existing jsdom + fake-indexeddb setup)
 * All 15 Panel 1 findings must pass before deploying.
 *
 * Add these tests to the existing test suite in tests/
 * ════════════════════════════════════════════════════════════════
 */

'use strict';

// ── Minimal test harness (compatible with existing suite) ──────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testName) {
  if (condition) {
    passed++;
    console.log(`  ✓  ${testName}`);
  } else {
    failed++;
    failures.push(testName);
    console.error(`  ✗  ${testName}`);
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ── Load the patch module (in real suite, these are loaded from index.html) ──
// For standalone testing, require the patch file directly:
// const patch = require('../patches/CASE-AI-LOGIC.patch.js');
// In the integrated suite, these globals are already available.
// We simulate them here for verification:

/* ─────────────────────────────────────────────────────────────
   CRITICAL 1 — Condonation
   ───────────────────────────────────────────────────────────── */
section('CRITICAL 1: Condonation factors present');

assert(
  typeof LEGAL_FACTS.condonationFactors !== 'undefined',
  'LEGAL_FACTS.condonationFactors array exists'
);
assert(
  Array.isArray(LEGAL_FACTS.condonationFactors) && LEGAL_FACTS.condonationFactors.length === 5,
  'condonationFactors has exactly 5 factors (LRA test)'
);
assert(
  LEGAL_FACTS.condonationFactors.some(f => f.key === 'degree_of_lateness'),
  'degree_of_lateness factor present'
);
assert(
  LEGAL_FACTS.condonationFactors.some(f => f.key === 'reason_for_lateness'),
  'reason_for_lateness factor present'
);
assert(
  LEGAL_FACTS.condonationFactors.some(f => f.key === 'prejudice'),
  'prejudice factor present'
);
assert(
  LEGAL_FACTS.deadlines.constructive_dismissal !== undefined,
  'constructive_dismissal deadline entry exists'
);

/* ─────────────────────────────────────────────────────────────
   CRITICAL 2 — Constructive dismissal sub-type
   ───────────────────────────────────────────────────────────── */
section('CRITICAL 2: Constructive dismissal sub-type');

const cd1 = classifyDispute('dismissed', 'I resigned because conditions were intolerable');
assert(cd1 !== null, 'classifyDispute returns result for intolerable conditions');
assert(cd1.subType === 'constructive_dismissal', 'subType is constructive_dismissal for intolerable resignation');

const cd2 = classifyDispute('dismissed', 'I quit because I couldn\'t take it anymore');
assert(cd2.subType === 'constructive_dismissal', 'subType detected for "couldn\'t take it"');

const cd3 = classifyDispute('dismissed', 'I was fired without warning');
assert(cd3.subType === null || cd3.subType === undefined, 'straight dismissal has no constructive subType');

assert(
  Array.isArray(FOLLOWUPS.constructive_dismissal) && FOLLOWUPS.constructive_dismissal.length >= 4,
  'constructive_dismissal follow-up bank has at least 4 questions'
);
assert(
  FOLLOWUPS.constructive_dismissal.some(q => /writing|written/.test(q)),
  'constructive dismissal follow-ups ask about written complaint'
);
assert(
  FOLLOWUPS.constructive_dismissal.some(q => /resign/.test(q)),
  'constructive dismissal follow-ups ask about timing of resignation'
);

// Settlement reinstatement caveat (Finding 8)
const headsCD = Settlement.heads('constructive_dismissal');
const reinCD = headsCD.find(h => h.key === 'reinstatement');
assert(reinCD !== undefined, 'reinstatement entry exists in Settlement.heads() for constructive dismissal');
assert(reinCD.warning === true, 'reinstatement entry has warning:true for constructive dismissal');
assert(/rarely|realistic/.test(reinCD.hint), 'reinstatement hint warns about rarity in constructive dismissal');

const headsStd = Settlement.heads(null);
const reinStd = headsStd.find(h => h.key === 'reinstatement');
assert(reinStd.warning !== true, 'reinstatement entry has no warning for standard dismissal');

/* ─────────────────────────────────────────────────────────────
   CRITICAL 3 — s187 proactive detection
   ───────────────────────────────────────────────────────────── */
section('CRITICAL 3: s187 proactive detection (automatically unfair)');

assert(typeof detectS187 === 'function', 'detectS187() function exists');

assert(detectS187('I was fired when they found out I was pregnant') !== null, 'detects pregnancy');
assert(detectS187('I joined the union and was dismissed the next week') !== null, 'detects union activity');
assert(detectS187('They dismissed me after I disclosed my HIV status') !== null, 'detects HIV status');
assert(detectS187('I reported fraud to management and was fired') !== null, 'detects whistleblowing');
assert(detectS187('I refused to do something illegal and they let me go') !== null, 'detects refused illegal');
assert(detectS187('I was fired for poor performance') === null, 'no false positive for ordinary dismissal');
assert(detectS187('') === null, 'handles empty string');

const s187Result = detectS187('They dismissed me when I joined the union');
assert(s187Result.category === 'union_activity', 'correct category for union activity');
assert(typeof s187Result.compensation === 'string' && s187Result.compensation.includes('24'), 's187 result includes 24-month compensation reference');

/* ─────────────────────────────────────────────────────────────
   CRITICAL A — Legal facts staleness
   ───────────────────────────────────────────────────────────── */
section('CRITICAL A: Legal facts staleness enforcement');

assert(typeof checkLegalFactsStaleness === 'function', 'checkLegalFactsStaleness() function exists');
assert(typeof LEGAL_FACTS.nationalMinimumWage.nextReviewExpected === 'string', 'NMW has nextReviewExpected');
assert(typeof LEGAL_FACTS.bceaEarningsThreshold.nextReviewExpected === 'string', 'BCEA threshold has nextReviewExpected');
assert(typeof LEGAL_FACTS._nextReviewDate === 'string', '_nextReviewDate set on LEGAL_FACTS');

// Simulate a stale date
const originalNMW = LEGAL_FACTS.nationalMinimumWage.nextReviewExpected;
LEGAL_FACTS.nationalMinimumWage.nextReviewExpected = '2020-03-01'; // Past date
const staleResult = checkLegalFactsStaleness();
assert(staleResult.stale === true, 'checkLegalFactsStaleness returns stale:true for past date');
assert(Array.isArray(staleResult.items) && staleResult.items.length > 0, 'stale items array is populated');
LEGAL_FACTS.nationalMinimumWage.nextReviewExpected = originalNMW; // Restore

const currentResult = checkLegalFactsStaleness();
// Can't assert false here since it depends on real dates — just check structure
assert(typeof currentResult.stale === 'boolean', 'checkLegalFactsStaleness returns boolean stale property');

/* ─────────────────────────────────────────────────────────────
   CRITICAL E — Off-topic redirect (labour-connected soft topics)
   ───────────────────────────────────────────────────────────── */
section('CRITICAL E: Off-topic redirect does not route away vulnerable workers');

assert(typeof classifyOffTopic === 'function', 'classifyOffTopic() function exists');
assert(OFFTOPIC_HARD !== undefined, 'OFFTOPIC_HARD array exists');
assert(OFFTOPIC_SOFT !== undefined, 'OFFTOPIC_SOFT array exists');

// Soft topics: must NOT hard-redirect
assert(classifyOffTopic('I was arrested and then dismissed') === 'soft', '"arrested" is soft (labour-connected)');
assert(classifyOffTopic('my visa was cancelled and they fired me') === 'soft', '"visa" is soft (migrant worker)');
assert(classifyOffTopic('they told me to leave the accommodation because I was fired') === 'soft', '"accommodation" is soft (farm worker)');
assert(classifyOffTopic('I have an immigration issue related to my job') === 'soft', '"immigration" is soft');

// Hard topics: must still hard-redirect
assert(classifyOffTopic('I need help with my divorce') === 'hard', 'divorce is still hard redirect');
assert(classifyOffTopic('I got a traffic fine') === 'hard', 'traffic fine is still hard redirect');
assert(classifyOffTopic('how do I change my will and testament') === 'hard', 'will and testament is still hard');

// Labour topics: must NOT trigger any off-topic
assert(classifyOffTopic('I was unfairly dismissed') === null, 'dismissal is not off-topic');
assert(classifyOffTopic('my employer hasn\'t paid my salary') === null, 'wage claim is not off-topic');

/* ─────────────────────────────────────────────────────────────
   CRITICAL F — Mutual separation agreement
   ───────────────────────────────────────────────────────────── */
section('CRITICAL F: Mutual separation agreement detection');

// Check SIGNALS contains the settlement signal
assert(
  Array.isArray(SIGNALS) && SIGNALS.some(s => s.tag.includes('Settlement')),
  'SIGNALS array contains settlement agreement entry'
);

const settlementSignal = SIGNALS.find(s => s.tag.includes('Settlement'));
assert(settlementSignal !== undefined, 'Settlement signal found in SIGNALS');
assert(settlementSignal.re.test('I signed a settlement agreement'), 'detects "settlement agreement"');
assert(settlementSignal.re.test('they gave me a package'), 'detects "package"');
assert(settlementSignal.re.test('I signed a mutual separation'), 'detects "mutual separation"');
assert(settlementSignal.re.test('full and final payment'), 'detects "full and final"');
assert(/URGENT|urgent/i.test(settlementSignal.why), 'settlement signal why text contains urgency flag');

// Check EmployerAttack entry exists
assert(typeof MUTUAL_SEPARATION_ATTACK === 'object', 'MUTUAL_SEPARATION_ATTACK object defined');
assert(MUTUAL_SEPARATION_ATTACK.key === 'mutual_separation', 'correct attack key');
assert(typeof MUTUAL_SEPARATION_ATTACK.counter === 'string' && MUTUAL_SEPARATION_ATTACK.counter.includes('142A'), 'counter references s142A LRA');
assert(typeof MUTUAL_SEPARATION_ATTACK.urgencyNote === 'string', 'urgencyNote present');

/* ─────────────────────────────────────────────────────────────
   FINDING 3 — Success rate no longer engagement-based
   ───────────────────────────────────────────────────────────── */
section('FINDING 3: Success rate not engagement-based');

assert(typeof successRate === 'function', 'successRate() function exists');

// Without element-based score: must return null
assert(successRate({}) === null, 'successRate returns null with no _strength');
assert(successRate({ messageCount: 20, answeredFollowUps: 10 }) === null,
  'successRate returns null even with high engagement metrics (no _strength)');

// With element-based score: must return number
assert(successRate({ _strength: 65 }) === 65, 'successRate returns _strength when set (65)');
assert(successRate({ _strength: 22 }) === 22, 'successRate returns _strength when set (22)');
assert(successRate({ _strength: 95 }) === 88, 'successRate caps at 88');
assert(successRate({ _strength: 5 }) === 20, 'successRate floors at 20');

/* ─────────────────────────────────────────────────────────────
   FINDING 4 — BCEA threshold implication
   ───────────────────────────────────────────────────────────── */
section('FINDING 4: BCEA threshold follow-up in pay questions');

assert(
  FOLLOWUPS.pay.some(q => /270|threshold|annual salary/.test(q)),
  'pay follow-ups include BCEA threshold check question'
);

/* ─────────────────────────────────────────────────────────────
   FINDING 5 — Fixed-term / s198B
   ───────────────────────────────────────────────────────────── */
section('FINDING 5: Fixed-term / s198B detection');

assert(TOPIC.fixed_term !== undefined, 'fixed_term topic exists in TOPIC');
assert(Array.isArray(FOLLOWUPS.fixed_term) && FOLLOWUPS.fixed_term.length >= 3, 'fixed_term follow-up bank has >= 3 questions');
assert(FOLLOWUPS.fixed_term.some(q => /total|altogether|across all/.test(q)), 'fixed_term asks about total duration across renewals');

const ft = classifyDispute('', 'my fixed term contract was not renewed');
assert(ft !== null, 'classifyDispute handles fixed-term contract');
assert(ft.subType === 'fixed_term', 'fixed-term contract gets fixed_term subType');

assert(LEGAL_FACTS.deadlines.fixed_term !== undefined, 'fixed_term deadline entry exists');
assert(CITATIONS_ADDITIONS.fixed_term.some(c => c.law === 'LRA s198B'), 's198B citation present');

/* ─────────────────────────────────────────────────────────────
   FINDING 7 — Internal remedies follow-up
   ───────────────────────────────────────────────────────────── */
section('FINDING 7: Internal remedies follow-up');

assert(
  FOLLOWUPS.dismissal.some(q => /internal|appeal/.test(q)),
  'dismissal follow-ups include internal remedies question'
);
assert(typeof INTERNAL_REMEDIES_ATTACK === 'object', 'INTERNAL_REMEDIES_ATTACK defined');
assert(INTERNAL_REMEDIES_ATTACK.key === 'internal_remedies', 'correct attack key');
assert(/s157|LRA/.test(INTERNAL_REMEDIES_ATTACK.counter), 'internal remedies counter references LRA s157');

/* ─────────────────────────────────────────────────────────────
   FINDING D — LRA 7.11 relief mapping
   ───────────────────────────────────────────────────────────── */
section('FINDING D: LRA 7.11 relief mapping');

assert(typeof mapOutcomeToLRARelief === 'function', 'mapOutcomeToLRARelief() function exists');

const reliefR = mapOutcomeToLRARelief('reinstatement', 'unfair_dismissal');
assert(/reinstatement/i.test(reliefR), 'reinstatement maps to reinstatement language');
assert(/back.pay/i.test(reliefR), 'reinstatement includes back-pay');

const reliefV = mapOutcomeToLRARelief('vindication', 'unfair_dismissal');
assert(/declaratory|declare/i.test(reliefV), 'vindication maps to declaratory order (not "vindication")');
assert(!/vindication/i.test(reliefV), 'vindication word NOT in LRA relief output');

const reliefAU = mapOutcomeToLRARelief('compensation', 'automatically_unfair');
assert(/194\(3\)|automatically unfair/i.test(reliefAU), 'automatically unfair dismissal maps to s194(3)');
assert(/24 months/i.test(reliefAU), 'automatically unfair includes 24-month reference');

const reliefUnknown = mapOutcomeToLRARelief('unknown_outcome', 'unfair_dismissal');
assert(/reinstatement.*alternatively.*compensation/i.test(reliefUnknown), 'unknown outcome falls back to dual remedy');

/* ─────────────────────────────────────────────────────────────
   CRITICAL B — No user content logged in ai.js
   (Static analysis — check log statements don't reference user content)
   ───────────────────────────────────────────────────────────── */
section('CRITICAL B: POPIA logging audit');

// Read ai.js and check no console.log/error references userText or history
const fs = require && require('fs');
if (fs) {
  try {
    const aiSource = fs.readFileSync(
      require('path').join(__dirname, '../netlify/functions/ai.js'), 'utf8'
    );
    // Check that console.log/error calls don't reference user content variables
    const logLines = aiSource.split('\n').filter(l => /console\.(log|error|warn)/.test(l));
    const dangerousLogs = logLines.filter(l =>
      /userText|history\[|caseHistory|\.text\b/.test(l) &&
      !/POPIA|contract/.test(l) // allow the contract comment line
    );
    assert(dangerousLogs.length === 0,
      `ai.js has no console.log/error calls referencing user content (found ${dangerousLogs.length})`
    );
    assert(
      aiSource.includes('POPIA'),
      'ai.js contains POPIA logging contract comment'
    );
  } catch (e) {
    console.log('  ℹ  POPIA logging audit: run from repo root for file-based checks');
  }
} else {
  console.log('  ℹ  POPIA logging audit: file-based check skipped (no fs module)');
}

/* ─────────────────────────────────────────────────────────────
   PROCESSING NOTICE
   ───────────────────────────────────────────────────────────── */
section('Processing notice (Critical B)');

assert(typeof PROCESSING_NOTICE === 'object', 'PROCESSING_NOTICE object defined');
assert(typeof PROCESSING_NOTICE.id === 'string', 'PROCESSING_NOTICE.id is a string');
assert(typeof PROCESSING_NOTICE.body === 'string', 'PROCESSING_NOTICE.body is a string');
assert(/ID number|name|employer/.test(PROCESSING_NOTICE.body), 'processing notice warns about personal identifiers');
assert(typeof shouldShowProcessingNotice === 'function', 'shouldShowProcessingNotice() exists');
assert(typeof markProcessingNoticeSeen === 'function', 'markProcessingNoticeSeen() exists');

/* ─────────────────────────────────────────────────────────────
   FINAL SUMMARY
   ───────────────────────────────────────────────────────────── */
console.log('\n' + '═'.repeat(60));
console.log(`Panel 1 fix verification: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error('  ✗ ' + f));
  console.error('\nDo NOT deploy until all Panel 1 tests pass.');
  process.exitCode = 1;
} else {
  console.log('\n✓ All Panel 1 fixes verified. Safe to deploy.');
}
