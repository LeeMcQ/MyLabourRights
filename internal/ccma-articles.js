/**
 * MyLabourRights — CCMA Rules Articles
 * Source: Rules for the Conduct of Proceedings Before the CCMA
 *         (F241552223_ZAF64967.pdf)
 *
 * HOW TO IMPORT:
 * In the admin panel → Blog → Paste each article object into the
 * "Import JSON" field, or call the blog Netlify function directly:
 *
 *   fetch('/.netlify/functions/blog', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ action: 'import', articles: CCMA_ARTICLES })
 *   });
 *
 * Or paste CCMA_ARTICLES into the browser console on the admin page.
 *
 * All articles are pre-written — no AI generation needed.
 * Each article has been reviewed against the official CCMA Rules document.
 */

const CCMA_ARTICLES = [

  {
    id: 'ccma-rules-001',
    slug: 'how-to-refer-your-dispute-to-the-ccma',
    title: 'How to Refer Your Dispute to the CCMA',
    category: 'CCMA process',
    summary: 'The official steps to file your LRA Form 7.11 referral — what it must contain, how to serve it on your employer, and what happens if you file late.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rule 10',
    publishDate: '2026-06-18',
    body: `<p>When you have a labour dispute, the first formal step is referring it to the Commission for Conciliation, Mediation and Arbitration (CCMA). This is done by completing and filing <strong>LRA Form 7.11</strong> — the official referral document.</p>

<h3>What you must do when filing your 7.11</h3>
<p>The CCMA's Rules are clear: your referral document must meet three requirements before the CCMA will accept it:</p>
<ol>
  <li><strong>You must sign it.</strong> The form must be signed by you personally, or by a person legally entitled to represent you (such as a union official or attorney).</li>
  <li><strong>You must prove you served it on your employer.</strong> You must attach written proof that a copy of the form was delivered to your employer before you filed it with the CCMA. This is called "service." See the section below on how to serve documents.</li>
  <li><strong>If you are filing late, you must attach a condonation application.</strong> If your referral is outside the prescribed time limit (30 days for unfair dismissal), you must simultaneously file an application for condonation explaining why you are late.</li>
</ol>
<p>The CCMA must refuse to accept your referral until all three requirements are met.</p>

<h3>How to serve your 7.11 on your employer</h3>
<p>You can serve the referral form on your employer in any of these ways:</p>
<ul>
  <li>Hand a physical copy to a responsible employee at your workplace, at the employer's registered office, or at their principal place of business;</li>
  <li>Fax it to the employer's fax number;</li>
  <li>Send it by registered post to the employer's last-known address;</li>
  <li>Leave a copy at an address the employer has chosen to receive service.</li>
</ul>
<p>After serving, keep your proof. A fax transmission report, a signed receipt, or a postal tracking confirmation are all acceptable proof of service.</p>

<h3>Where to file your 7.11</h3>
<p>File your referral at the CCMA provincial office in the province where the dispute arose. You can hand it in during office hours (08:30 to 16:30, Monday to Friday, excluding public holidays), or fax it at any time. You can also file online at <a href="https://www.ccma.org.za" target="_blank" rel="noopener">ccma.org.za</a>.</p>

<h3>The time limits that apply</h3>
<ul>
  <li><strong>Unfair dismissal:</strong> 30 days from the date of dismissal</li>
  <li><strong>Unfair labour practice:</strong> 90 days from the date of the act or omission</li>
  <li><strong>Unfair discrimination:</strong> 6 months</li>
  <li><strong>BCEA money claims:</strong> Generally 3 years</li>
</ul>
<p><em>Use the Adv. Lee deadline calculator in this app to confirm your exact deadline before filing.</em></p>`,
  },

  {
    id: 'ccma-rules-002',
    slug: 'what-happens-at-ccma-conciliation',
    title: 'What Actually Happens at CCMA Conciliation',
    category: 'CCMA process',
    summary: 'Conciliation is not a hearing — it is a confidential settlement negotiation. Here is what to expect, what the commissioner\'s role is, and what the certificate means.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rules 11–16',
    publishDate: '2026-06-18',
    body: `<p>Many workers arrive at the CCMA expecting a hearing where they tell their story and a commissioner decides who wins. Conciliation is different. Understanding what it is — and what it is not — is essential preparation.</p>

<h3>Conciliation is a confidential settlement negotiation</h3>
<p>The CCMA Rules state that conciliation proceedings are <strong>private and confidential</strong> and are conducted on a <strong>without prejudice</strong> basis. This means:</p>
<ul>
  <li>Nothing said at conciliation can be used against you in any later proceedings.</li>
  <li>No one — including the commissioner — can be called as a witness in later proceedings to say what was discussed at conciliation.</li>
  <li>The commissioner is not a judge. They are a facilitator trying to help both sides reach an agreement.</li>
</ul>

<h3>How much notice must the CCMA give you?</h3>
<p>The CCMA must give you at least <strong>14 days' written notice</strong> of a conciliation hearing, unless both parties agree to a shorter period. If you receive less than 14 days' notice and do not agree to it, you can raise this at the hearing.</p>

<h3>You must attend in person</h3>
<p>Both you and your employer must attend conciliation in person, even if you are represented by a union official or attorney. If your employer sends a representative but does not attend in person, the commissioner may continue, adjourn, or even dismiss the matter. If you fail to attend, the matter may be dismissed or proceed in your absence.</p>

<h3>What the commissioner can do before conciliation</h3>
<p>The commissioner may contact both parties by phone or other means before the hearing to try to resolve the dispute informally. This is not a disadvantage — it is a sign that the CCMA is trying to save both sides time and cost.</p>

<h3>The certificate of outcome</h3>
<p>At the end of conciliation, the commissioner issues a <strong>certificate in terms of section 135(5)</strong> stating whether the dispute has or has not been resolved. This certificate identifies the nature of the dispute.</p>
<ul>
  <li>If the dispute <strong>is resolved</strong>: the settlement terms are recorded, and the matter ends (unless the employer fails to comply).</li>
  <li>If the dispute is <strong>not resolved</strong>: the certificate opens the door to arbitration or the Labour Court, depending on the type of dispute.</li>
</ul>
<p><strong>Keep your certificate.</strong> Without it, you cannot proceed to the next step.</p>`,
  },

  {
    id: 'ccma-rules-003',
    slug: 'con-arb-what-it-means-and-how-to-object',
    title: 'Con-Arb: What It Means and How to Object',
    category: 'CCMA process',
    summary: 'Con-arb combines conciliation and arbitration in one day. You have a right to object to this in most cases — but you must act within 7 days of the notice.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rule 17; LRA s191(5A)',
    publishDate: '2026-06-18',
    body: `<p>When your matter is scheduled for <strong>con-arb</strong>, this means the CCMA intends to hold both conciliation and arbitration on the same day, back to back. If conciliation fails in the morning, the arbitration starts immediately in the afternoon. You must be prepared for both.</p>

<h3>Why con-arb exists</h3>
<p>Con-arb was introduced to speed up the resolution of labour disputes. Without it, workers often wait months between conciliation and arbitration. For many workers, the faster resolution is a benefit — you do not have to take two separate days off work and return twice.</p>

<h3>How much notice will you receive?</h3>
<p>The CCMA must give you at least <strong>14 days' written notice</strong> that your matter has been scheduled for con-arb.</p>

<h3>Can you object?</h3>
<p>Yes — in most cases you have the right to object to con-arb. If you want to object:</p>
<ul>
  <li>You must deliver a written notice of objection to the CCMA <strong>and</strong> to your employer;</li>
  <li>This must be done at least <strong>7 days before</strong> the scheduled con-arb date;</li>
  <li>If you object in time, the conciliation and arbitration will be held on separate days.</li>
</ul>

<h3>When you cannot object</h3>
<p>The right to object does <strong>not</strong> apply if your dispute concerns dismissal during probation or an unfair labour practice relating to probation. These matters must proceed as con-arb.</p>

<h3>If you fail to appear</h3>
<p>If a party fails to appear at a con-arb, the commissioner must still conduct the conciliation on the scheduled date. Your failure to object does not excuse non-attendance.</p>

<h3>Who can represent you at con-arb?</h3>
<p>At con-arb, you may be represented by:</p>
<ul>
  <li>An attorney or advocate;</li>
  <li>A director or employee of the company (if you are the employer);</li>
  <li>A member, office-bearer, or official of your registered trade union or employers' organisation.</li>
</ul>
<p><strong>Important:</strong> If your dispute is about dismissal for misconduct or incapacity, legal representation by an attorney is only permitted in specific circumstances set out in section 140(1) of the LRA. Check with Adv. Lee before assuming you can bring a lawyer.</p>`,
  },

  {
    id: 'ccma-rules-004',
    slug: 'how-to-request-ccma-arbitration',
    title: 'How to Request CCMA Arbitration',
    category: 'CCMA process',
    summary: 'If conciliation fails, you can request arbitration using LRA Form 7.13. Here are the steps, the deadlines, and what a pre-arbitration conference involves.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rules 18–23',
    publishDate: '2026-06-18',
    body: `<p>If conciliation fails and you receive a certificate stating the dispute was not resolved, your next step in most unfair dismissal cases is to request arbitration. This is the hearing where a commissioner hears evidence from both sides and makes a binding decision called an arbitration award.</p>

<h3>Filing your arbitration request</h3>
<p>You request arbitration by completing and filing <strong>LRA Form 7.13</strong>. The same requirements that applied to your 7.11 apply here:</p>
<ul>
  <li>You must sign the form;</li>
  <li>You must serve a copy on your employer and attach proof of service;</li>
  <li>If you are filing out of time, you must attach a condonation application.</li>
</ul>
<p>The CCMA must give you at least <strong>21 days' written notice</strong> of the arbitration date (compared to 14 days for conciliation).</p>

<h3>The pre-arbitration conference</h3>
<p>Before the arbitration hearing, the CCMA may direct the parties to hold a <strong>pre-arbitration conference</strong>. This is a structured meeting (often by email or phone) where both sides attempt to agree on:</p>
<ul>
  <li>Facts that are not in dispute (agreed facts save hearing time);</li>
  <li>Documents to be used and how they will be presented;</li>
  <li>Which witnesses will testify and whether witness statements will be exchanged;</li>
  <li>The estimated duration of the hearing;</li>
  <li>Whether an interpreter is needed;</li>
  <li>Any preliminary legal points to be decided.</li>
</ul>
<p>The referring party (usually the employee) must send the signed minute of the pre-arbitration conference to the commissioner within <strong>7 days</strong> of the conference.</p>

<h3>Postponing an arbitration</h3>
<p>An arbitration can be postponed in two ways:</p>
<ol>
  <li><strong>By agreement:</strong> If all parties agree in writing and the written agreement reaches the CCMA more than <strong>7 days before</strong> the hearing date, the CCMA will postpone without the parties needing to appear.</li>
  <li><strong>By application:</strong> If the parties cannot agree, any party can apply to postpone by delivering an application to all parties and filing it with the CCMA before the hearing date. The CCMA may decide on the application without a hearing, or may call a hearing to decide it.</li>
</ol>

<h3>What happens at arbitration</h3>
<p>Unlike conciliation, arbitration is a formal hearing. The commissioner listens to evidence, questions witnesses, and ultimately issues a binding arbitration award. You must come prepared with all your documents, witnesses, and a clear account of your case. Adv. Lee can help you build this preparation in the app's Build tab.</p>`,
  },

  {
    id: 'ccma-rules-005',
    slug: 'how-to-serve-documents-on-your-employer',
    title: 'How to Serve CCMA Documents on Your Employer',
    category: 'CCMA process',
    summary: 'You must serve documents on your employer before filing with the CCMA. Here is every valid method, and how to prove service if the employer denies receiving it.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rules 5–6',
    publishDate: '2026-06-18',
    body: `<p>One of the most common reasons the CCMA refuses to accept a referral is that the worker failed to serve the document on the employer first. Service is not optional — it is a condition for filing.</p>

<h3>Valid methods of service</h3>
<p>You may serve a document on your employer by:</p>
<ul>
  <li><strong>Handing a copy in person</strong> to a responsible employee at the workplace, at the employer's registered office, or at their principal place of business;</li>
  <li><strong>Faxing</strong> a copy to the employer's fax number (keep the transmission report);</li>
  <li><strong>Sending by registered post</strong> to the employer's last-known address (keep the tracking receipt);</li>
  <li><strong>Handing to the employer directly</strong> — or to someone who appears to be at least 16 years old and in charge of the premises.</li>
</ul>

<h3>Serving on specific types of employers</h3>
<ul>
  <li><strong>A company:</strong> Hand to a responsible employee at the registered office or main place of business;</li>
  <li><strong>A municipality:</strong> Serve on the municipal manager or a person acting on their behalf;</li>
  <li><strong>A government department:</strong> Hand to a responsible employee at the head office, or to a responsible employee at any office of the State Attorney;</li>
  <li><strong>A trade union:</strong> Hand to a responsible employee at the main union office.</li>
</ul>

<h3>What counts as proof of service?</h3>
<p>You must be able to prove service to the CCMA. Accepted proofs include:</p>
<ul>
  <li>A <strong>signed receipt</strong> from the employer showing their name, designation, and the date, time and place of service;</li>
  <li>A <strong>fax transmission report</strong> showing the document was successfully transmitted;</li>
  <li>A <strong>registered post receipt</strong> (the law presumes the document was received 7 days after posting);</li>
  <li>A <strong>statement by the person</strong> who delivered the document confirming service.</li>
</ul>

<h3>What if no one will accept service?</h3>
<p>If no responsible person at the employer's premises is willing to accept the document, you may affix a copy to the main door of the premises. If the main door is not accessible, you may leave it at a post-box or another place to which the public has access.</p>

<h3>Practical tip</h3>
<p>The safest method is a combination: fax the document, keep the transmission report, and follow up with a WhatsApp message to an HR contact saying "I am faxing the CCMA referral today." Screenshot both. If the employer later denies service, you have the transmission report and the WhatsApp as corroboration.</p>`,
  },

  {
    id: 'ccma-rules-006',
    slug: 'how-to-apply-for-condonation-late-referral',
    title: 'How to Apply for Condonation: Late CCMA Referral',
    category: 'CCMA process',
    summary: 'Missed your 30-day deadline? You can still apply for condonation. The CCMA\'s own rules set out exactly what your application must address.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rule 9; LRA s191(3)',
    publishDate: '2026-06-18',
    body: `<p>Missing the 30-day deadline for an unfair dismissal referral does not automatically end your case. You may apply for condonation — permission from the CCMA to file late. The CCMA's Rules specify exactly what your application must address.</p>

<h3>What condonation is</h3>
<p>Condonation is a legal term meaning "pardon" or "overlooking." When you apply for condonation, you are asking the CCMA to excuse your late filing and allow your case to proceed. A commissioner considers all the circumstances and decides whether to grant it.</p>

<h3>What your condonation application must cover</h3>
<p>The CCMA Rules require your condonation application to include details about five specific factors:</p>
<ol>
  <li><strong>The degree of lateness:</strong> How many days past the deadline are you filing? One week late is very different from three months late. Be precise.</li>
  <li><strong>The reasons for the lateness:</strong> Why did you not file in time? Were you ill? Were you trying to resolve the matter with your employer first? Did you not know the deadline existed? Be honest and specific.</li>
  <li><strong>Your prospects of success:</strong> Is your case strong on the merits? A weak case will rarely be condoned; a strong case with a minor delay and a good reason usually will be. Adv. Lee's case strength assessment helps you address this factor.</li>
  <li><strong>Any prejudice to your employer:</strong> Has your employer been harmed by the delay? Have they destroyed evidence, filled your position permanently, or paid out severance? The less prejudice to the employer, the stronger your condonation application.</li>
  <li><strong>Any other relevant factors:</strong> This is a catch-all. Was the delay short? Is the issue important? Are there multiple employees in the same situation?</li>
</ol>

<h3>How to file the application</h3>
<p>Your condonation application must be filed at the same time as your late referral — not separately afterwards. Attach the condonation application directly to your LRA Form 7.11. The CCMA Rules confirm that the Commission may assist you in complying with this requirement.</p>

<h3>What format must the application take?</h3>
<p>A condonation application is a formal application under Rule 31. It must be supported by a sworn affidavit (a written statement signed before a commissioner of oaths) that clearly and concisely sets out the five factors above in chronological order.</p>

<h3>Important</h3>
<p>Even if you file late, your case may proceed. The key is to be honest, thorough, and to file as soon as you realise you have missed the deadline. Do not wait further. Use the Adv. Lee chat to help you draft your condonation motivation.</p>`,
  },

  {
    id: 'ccma-rules-007',
    slug: 'how-to-postpone-a-ccma-hearing',
    title: 'How to Postpone a CCMA Hearing',
    category: 'CCMA process',
    summary: 'You can postpone a CCMA arbitration by agreement or by formal application. Here are the exact rules, the deadlines, and what happens if you simply do not arrive.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rules 23 and 30',
    publishDate: '2026-06-18',
    body: `<p>Sometimes a CCMA hearing is scheduled for a date you genuinely cannot attend. Knowing the correct procedure to request a postponement can save you from having your case dismissed.</p>

<h3>Method 1: By agreement (the easy way)</h3>
<p>If both you and your employer agree to postpone, the process is straightforward:</p>
<ul>
  <li>Both parties must agree <strong>in writing</strong>;</li>
  <li>The written agreement must reach the CCMA more than <strong>7 days before</strong> the scheduled date;</li>
  <li>If both conditions are met, the CCMA will postpone without anyone needing to appear.</li>
</ul>

<h3>Method 2: By formal application (when you cannot agree)</h3>
<p>If you need a postponement but the other side does not agree, or you have less than 7 days before the hearing:</p>
<ul>
  <li>File a formal application to postpone (Rule 31 application);</li>
  <li>Deliver the application to all other parties <strong>and</strong> file a copy with the CCMA;</li>
  <li>This must be done before the scheduled hearing date;</li>
  <li>The CCMA may decide on paper without convening a hearing, or may call a hearing to decide the postponement.</li>
</ul>

<h3>What happens if you simply do not arrive</h3>
<p>The consequences of failing to appear without following the postponement procedure are serious:</p>
<ul>
  <li><strong>If you referred the case:</strong> The commissioner may dismiss the matter by issuing a written ruling. Your case is ended.</li>
  <li><strong>If you are the respondent (employer):</strong> The commissioner may continue with the proceedings in your absence, or adjourn to a later date.</li>
</ul>
<p>In both cases, the commissioner must be satisfied that the absent party had been properly notified of the date, time, and venue before acting.</p>

<h3>Practical guidance</h3>
<p>If you have a genuine reason not to attend — illness, a family emergency, a conflict with another court date — contact the CCMA as soon as possible. Speak to the employer's representative and try to get written agreement to postpone. If time is short, file a written application immediately and keep proof that you sent it. Do not simply not arrive and hope the matter is postponed — it may be dismissed instead.</p>`,
  },

  {
    id: 'ccma-rules-008',
    slug: 'ccma-arbitration-awards-enforcement',
    title: 'CCMA Arbitration Awards: How to Get Your Money',
    category: 'CCMA process',
    summary: 'Winning an arbitration award means nothing if the employer refuses to pay. Here is how to certify and enforce a CCMA award — including the warrant of execution.',
    author: 'MyLabourRights Legal Team',
    source: 'CCMA Rules for the Conduct of Proceedings, Rule 40; LRA s143',
    publishDate: '2026-06-18',
    body: `<p>You have won at the CCMA. The commissioner issued an arbitration award in your favour. But your employer has not paid. What do you do?</p>

<h3>Step 1: Certify the award</h3>
<p>Before an arbitration award can be enforced, it must be <strong>certified</strong> by the CCMA. This makes it equivalent to a court order.</p>
<p>To have your award certified:</p>
<ul>
  <li>Complete <strong>LRA Form 7.18</strong> (for a CCMA commissioner's award);</li>
  <li>Submit it to the CCMA;</li>
  <li>The CCMA will certify the award in terms of section 143 of the LRA.</li>
</ul>
<p>If your award was made at a bargaining council (not the CCMA directly), use <strong>LRA Form 7.18A</strong> instead.</p>

<h3>Step 2: Execute the award</h3>
<p>Once certified, a money award can be executed (enforced) in two ways:</p>
<ol>
  <li><strong>Using the warrant of execution in LRA Form 7.18 or 7.18A:</strong> This is the CCMA's own warrant, which authorises the Sheriff to attach the employer's assets.</li>
  <li><strong>Using the High Court Rules warrant of execution:</strong> If the CCMA warrant is not effective, you can use the High Court's procedure instead.</li>
</ol>

<h3>What the certified award covers</h3>
<p>A certified arbitration award can include:</p>
<ul>
  <li>The main compensation or reinstatement award;</li>
  <li>Any costs order made by the commissioner in terms of section 138(10) of the LRA;</li>
  <li>A taxed bill of costs (if costs were awarded and taxed);</li>
  <li>Any arbitration fee charged in terms of section 140(2).</li>
</ul>

<h3>Varying or setting aside an award</h3>
<p>Both you and your employer have the right to apply to vary (correct) or rescind (cancel) an award, but only in limited circumstances. An application to vary or rescind must be made within <strong>14 days</strong> of becoming aware of the award or of a mistake common to both parties.</p>

<h3>Challenging an award in the Labour Court (review)</h3>
<p>If you believe the commissioner made an error that goes beyond mere facts — for example, a fundamental legal error or a serious procedural irregularity — you can apply to the Labour Court to review the award. This is a more complex process and usually requires legal representation. The review application must generally be brought within <strong>6 weeks</strong> of the award.</p>

<h3>Practical tip</h3>
<p>As soon as the arbitration award is issued in your favour, apply immediately for certification. Do not wait. Employers sometimes transfer or hide assets between the award and enforcement. The sooner the award is certified, the sooner you can act if the employer does not pay voluntarily.</p>`,
  },

];

// Export for Node.js / bundlers
if (typeof module !== 'undefined') module.exports = { CCMA_ARTICLES };
