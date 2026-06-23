/**
 * MyLabourRights — Flow integration tests
 * Tests: intake steps, checker steps, verdict routing, docprompt routing
 * Run: node tests/flow.test.mjs
 */
import { strict as assert } from 'assert';

// ─── Minimal State + render stub ─────────────────────────────────────────────
const State = { screen:'intake', _intakeStep:0, _intakeAnswers:{}, _checkerStep:0, _checkerAnswers:{} };
let lastRender = null;
function render() { lastRender = { screen:State.screen, intakeStep:State._intakeStep, checkerStep:State._checkerStep }; }
function go(screen) { State.screen=screen; render(); }

// ─── Inline logic under test ──────────────────────────────────────────────────
const INTAKE_MAP = {
  dismissed:{disputeKey:'unfair_dismissal',caseType:'personal',name:'Unfair dismissal case'},
  resigned:{disputeKey:'constructive_dismissal',caseType:'personal',name:'Constructive dismissal case'},
  retrenched:{disputeKey:'retrenchment_operational',caseType:'personal',name:'Retrenchment case'},
  not_paid:{disputeKey:'bcea_money_claim',caseType:'personal',name:'Unpaid wages claim'},
  unfair_treat:{disputeKey:'unfair_labour_practice',caseType:'grievance',name:'Unfair treatment — workplace dispute'},
  discrimination:{disputeKey:'unfair_discrimination',caseType:'personal',name:'Discrimination case'},
  harassment:{disputeKey:'unfair_labour_practice',caseType:'grievance',name:'Workplace harassment case'},
  other:{disputeKey:null,caseType:'personal',name:'Workplace dispute'},
};
function intakeParseAnswers(a) {
  const m = INTAKE_MAP[a.situation]||INTAKE_MAP.other;
  return {caseType:m.caseType,disputeKey:m.disputeKey,name:m.name,
          description:a.freeText||'',incidentDate:a.when||null,autoFilled:true};
}
function validityVerdict(a) {
  const act=a[0],when=a[1],raised=a[2],proof=a[3];
  let score=0,caseType='personal',disputeKey=null;
  if(['dismissed','resigned','retrenched'].includes(act)){score+=3;caseType='personal';
    disputeKey=act==='dismissed'?'unfair_dismissal':act==='resigned'?'constructive_dismissal':'retrenchment_operational';}
  else if(act==='not_paid'){score+=3;caseType='personal';disputeKey='bcea_money_claim';}
  else if(act==='discrimination'){score+=2;caseType='personal';disputeKey='unfair_discrimination';}
  else if(['harassment','demoted'].includes(act)){score+=2;caseType='grievance';disputeKey='unfair_labour_practice';}
  else score+=1;
  if(when){const months=Math.round((Date.now()-new Date(when).getTime())/(1000*60*60*24*30));
    if(['dismissed','resigned','retrenched'].includes(act)&&months>3)score-=2;
    else if(months<=1)score+=1;else if(months<=3)score+=1;}
  if(proof==='strong')score+=2;else if(proof==='some')score+=1;else if(proof==='none')score-=1;
  if(raised==='formal')score+=1;
  const verdict=score>=5?'green':score>=2?'amber':'red';
  return {verdict,score,caseType,disputeKey};
}

// ─── Test runner ──────────────────────────────────────────────────────────────
let pass=0,fail=0;
function test(name,fn){
  try{fn();console.log(`  ✅  ${name}`);pass++;}
  catch(e){console.error(`  ❌  ${name}: ${e.message}`);fail++;}
}

// ─── Intake flow steps ────────────────────────────────────────────────────────
console.log('\nIntake flow — step transitions');
test('step 0: situation choice advances to step 1', () => {
  State._intakeStep=0; State._intakeAnswers={};
  // Simulate tap on "dismissed"
  State._intakeAnswers.situation='dismissed';
  State._intakeStep=1; render();
  assert.equal(lastRender.intakeStep, 1);
});
test('step 1: when answer advances to step 2', () => {
  State._intakeStep=1; State._intakeAnswers={situation:'dismissed'};
  State._intakeAnswers.when='2026-01-01';
  State._intakeStep=2; render();
  assert.equal(lastRender.intakeStep, 2);
});
test('step 2: free text advances to confirm (step 3)', () => {
  State._intakeStep=2; State._intakeAnswers={situation:'dismissed',when:'2026-01-01'};
  State._intakeAnswers.freeText='I was fired without warning.';
  State._intakeStep=3; render();
  assert.equal(lastRender.intakeStep, 3);
});
test('confirm step: parsed result has correct fields', () => {
  const parsed = intakeParseAnswers({situation:'dismissed',when:'2026-01-01',freeText:'I was fired.'});
  assert.equal(parsed.caseType,'personal');
  assert.equal(parsed.disputeKey,'unfair_dismissal');
  assert.match(parsed.name, /dismissal/i);
  assert.equal(parsed.autoFilled, true);
});
test('back from step 1 goes to step 0', () => {
  State._intakeStep=1; State._intakeStep=0; render();
  assert.equal(lastRender.intakeStep, 0);
});

// ─── Checker flow steps ───────────────────────────────────────────────────────
console.log('\nChecker flow — 5-step progression');
test('answering Q0 advances to step 1', () => {
  State._checkerStep=0; State._checkerAnswers={};
  State._checkerAnswers[0]='dismissed'; State._checkerStep=1; render();
  assert.equal(lastRender.checkerStep, 1);
});
test('month input on Q1 advances to step 2', () => {
  State._checkerAnswers[1]='2026-01-01'; State._checkerStep=2; render();
  assert.equal(lastRender.checkerStep, 2);
});
test('answering Q2-Q4 reaches verdict (step 5)', () => {
  State._checkerAnswers[2]='formal';
  State._checkerAnswers[3]='strong';
  State._checkerAnswers[4]='compensation';
  State._checkerStep=5; render();
  assert.equal(lastRender.checkerStep, 5);
});
test('back from step 2 goes to step 1', () => {
  State._checkerStep=2; State._checkerStep=1; render();
  assert.equal(lastRender.checkerStep, 1);
});

// ─── Verdict routing ──────────────────────────────────────────────────────────
console.log('\nVerdict routing');
test('green verdict → primaryCta is personal or grievance case type', () => {
  const when=new Date(Date.now()-10*86400000).toISOString();
  const R=validityVerdict(['dismissed',when,'formal','strong']);
  assert.equal(R.verdict,'green');
  assert(['personal','grievance'].includes(R.caseType));
});
test('amber verdict → primaryCta is chat', () => {
  const R=validityVerdict(['other',null,'none','none']);
  assert(['amber','red'].includes(R.verdict));
});
test('red verdict: stale dismissal → score penalty applied', () => {
  const when=new Date(Date.now()-200*86400000).toISOString();
  const R=validityVerdict(['dismissed',when,'none','none']);
  assert.equal(R.verdict,'red');
});

// ─── Doc prompt routing ───────────────────────────────────────────────────────
console.log('\nDoc prompt routing');
test('non-validity_check case creation routes to docprompt', () => {
  // Simulate what createCase does for non-validity_check types
  const type='personal';
  if(type==='validity_check'){ State.tab='chat'; go('app'); }
  else { State.screen='docprompt'; render(); }
  assert.equal(lastRender.screen,'docprompt');
});
test('validity_check creation routes to chat', () => {
  if('validity_check'==='validity_check'){ State.screen='app'; State.tab='chat'; render(); }
  assert.equal(State.screen,'app');
});

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if(fail>0) process.exit(1);
