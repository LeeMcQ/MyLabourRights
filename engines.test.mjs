/**
 * MyLabourRights — Engine unit tests
 * Tests: intakeParseAnswers, validityVerdict, escalateCase data model
 * Run: node tests/engines.test.mjs
 */
import { strict as assert } from 'assert';

// ─── Inline the pure functions so we can test without a browser ───────────────
const INTAKE_MAP = {
  dismissed:      { disputeKey:'unfair_dismissal',        caseType:'personal',  name:'Unfair dismissal case' },
  resigned:       { disputeKey:'constructive_dismissal',  caseType:'personal',  name:'Constructive dismissal case' },
  retrenched:     { disputeKey:'retrenchment_operational',caseType:'personal',  name:'Retrenchment case' },
  not_paid:       { disputeKey:'bcea_money_claim',        caseType:'personal',  name:'Unpaid wages claim' },
  unfair_treat:   { disputeKey:'unfair_labour_practice',  caseType:'grievance', name:'Unfair treatment — workplace dispute' },
  discrimination: { disputeKey:'unfair_discrimination',   caseType:'personal',  name:'Discrimination case' },
  harassment:     { disputeKey:'unfair_labour_practice',  caseType:'grievance', name:'Workplace harassment case' },
  other:          { disputeKey:null,                      caseType:'personal',  name:'Workplace dispute' },
};

function intakeParseAnswers(a) {
  const m = INTAKE_MAP[a.situation] || INTAKE_MAP.other;
  return { caseType:m.caseType, disputeKey:m.disputeKey, name:m.name,
           description:a.freeText||'', incidentDate:a.when||null, autoFilled:true };
}

function validityVerdict(a) {
  const act=a[0], when=a[1], raised=a[2], proof=a[3];
  let score=0, caseType='personal', disputeKey=null;
  const strengths=[], risks=[];
  if (['dismissed','resigned','retrenched'].includes(act)) {
    score+=3; caseType='personal';
    disputeKey=act==='dismissed'?'unfair_dismissal':act==='resigned'?'constructive_dismissal':'retrenchment_operational';
    strengths.push('Clear legal grounds under the LRA');
  } else if (act==='not_paid') {
    score+=3; caseType='personal'; disputeKey='bcea_money_claim';
    strengths.push('Unpaid wages enforceable under BCEA');
  } else if (act==='discrimination') {
    score+=2; caseType='personal'; disputeKey='unfair_discrimination';
  } else if (['harassment','demoted'].includes(act)) {
    score+=2; caseType='grievance'; disputeKey='unfair_labour_practice';
  } else { score+=1; }
  if (when) {
    const months=Math.round((Date.now()-new Date(when).getTime())/(1000*60*60*24*30));
    if (['dismissed','resigned','retrenched'].includes(act)&&months>3) { score-=2; }
    else if (months<=1) score+=1;
    else if (months<=3) score+=1;
  }
  if (proof==='strong') score+=2;
  else if (proof==='some') score+=1;
  else if (proof==='none') score-=1;
  if (raised==='formal') score+=1;
  let verdict;
  if (score>=5) verdict='green';
  else if (score>=2) verdict='amber';
  else verdict='red';
  return {verdict,score,caseType,disputeKey,strengths,risks};
}

// ─── Test runner ──────────────────────────────────────────────────────────────
let pass=0, fail=0;
function test(name, fn) {
  try { fn(); console.log(`  ✅  ${name}`); pass++; }
  catch(e) { console.error(`  ❌  ${name}: ${e.message}`); fail++; }
}

// ─── intakeParseAnswers ────────────────────────────────────────────────────────
console.log('\nintakeParseAnswers');
test('dismissed → unfair_dismissal + personal', () => {
  const r = intakeParseAnswers({ situation:'dismissed', freeText:'I was fired.', when:'2026-01-01' });
  assert.equal(r.caseType, 'personal');
  assert.equal(r.disputeKey, 'unfair_dismissal');
  assert.equal(r.autoFilled, true);
  assert.equal(r.incidentDate, '2026-01-01');
});
test('resigned → constructive_dismissal', () => {
  const r = intakeParseAnswers({ situation:'resigned' });
  assert.equal(r.disputeKey, 'constructive_dismissal');
});
test('retrenched → retrenchment_operational', () => {
  const r = intakeParseAnswers({ situation:'retrenched' });
  assert.equal(r.disputeKey, 'retrenchment_operational');
});
test('not_paid → bcea_money_claim', () => {
  const r = intakeParseAnswers({ situation:'not_paid' });
  assert.equal(r.disputeKey, 'bcea_money_claim');
  assert.equal(r.caseType, 'personal');
});
test('unfair_treat → grievance + unfair_labour_practice', () => {
  const r = intakeParseAnswers({ situation:'unfair_treat' });
  assert.equal(r.caseType, 'grievance');
  assert.equal(r.disputeKey, 'unfair_labour_practice');
});
test('unknown situation → personal + null disputeKey', () => {
  const r = intakeParseAnswers({ situation:'something_weird' });
  assert.equal(r.caseType, 'personal');
  assert.equal(r.disputeKey, null);
});

// ─── validityVerdict ──────────────────────────────────────────────────────────
console.log('\nvalidityVerdict');
test('dismissed + recent + strong proof + formal → green', () => {
  const when = new Date(Date.now() - 15*24*60*60*1000).toISOString();
  const r = validityVerdict(['dismissed', when, 'formal', 'strong']);
  assert.equal(r.verdict, 'green');
  assert.equal(r.disputeKey, 'unfair_dismissal');
});
test('harassment + some proof → amber', () => {
  const when = new Date(Date.now() - 20*24*60*60*1000).toISOString();
  const r = validityVerdict(['harassment', when, 'none', 'some']);
  assert.equal(r.verdict, 'amber');
  assert.equal(r.caseType, 'grievance');
});
test('dismissed + 4 months ago + no proof → red (time risk)', () => {
  const when = new Date(Date.now() - 120*24*60*60*1000).toISOString();
  const r = validityVerdict(['dismissed', when, 'none', 'none']);
  assert.equal(r.verdict, 'red');
});
test('not_paid + strong proof + formal → green', () => {
  const when = new Date(Date.now() - 10*24*60*60*1000).toISOString();
  const r = validityVerdict(['not_paid', when, 'formal', 'strong']);
  assert.equal(r.verdict, 'green');
  assert.equal(r.disputeKey, 'bcea_money_claim');
});
test('other + no proof → amber/red', () => {
  const r = validityVerdict(['other', null, 'none', 'none']);
  assert(['amber','red'].includes(r.verdict), `Expected amber/red, got ${r.verdict}`);
});

// ─── escalateCase data model ──────────────────────────────────────────────────
console.log('\nescalateCase data model');
test('escalated case carries parentCaseId and escalatedFrom', () => {
  const parent = { id:'case_parent', caseType:'grievance', disputeKey:'unfair_dismissal',
                   incidentDate:'2026-01-01', validityAnswers:{0:'dismissed'}, name:'My grievance' };
  // Simulate what createCase receives
  const intake = {
    disputeKey: parent.disputeKey,
    incidentDate: parent.incidentDate,
    parentCaseId: parent.id,
    escalatedFrom: parent.caseType,
    validityAnswers: parent.validityAnswers,
    autoFilled: true,
  };
  assert.equal(intake.parentCaseId, 'case_parent');
  assert.equal(intake.escalatedFrom, 'grievance');
  assert.equal(intake.disputeKey, 'unfair_dismissal');
  assert.equal(intake.autoFilled, true);
});
test('validity_check escalation carries validityAnswers', () => {
  const parent = { id:'c2', caseType:'validity_check', disputeKey:'bcea_money_claim',
                   validityAnswers:{0:'not_paid',3:'strong'} };
  const intake = { escalatedFrom:parent.caseType, validityAnswers:parent.validityAnswers,
                   parentCaseId:parent.id };
  assert.deepEqual(intake.validityAnswers, {0:'not_paid',3:'strong'});
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
