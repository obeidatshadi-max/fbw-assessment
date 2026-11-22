// Role-based scenario sets for Part 1 of the assessment.
//
// SCHEMA (enforced by assertBalancedScenarios, called for every set below):
//   each set is an array of 15 scenarios, each shaped like:
//     { s: {en,ar}, opts: [ {t:{en,ar}, d:"F"}, {t:{...}, d:"B"}, {t:{...}, d:"W"} ] }
//   `opts` must have exactly 3 entries, one per dimension (F, B, W) — order
//   inside the array does not matter, but the SET of dimensions must be
//   exactly {F, B, W}. A non-developer editing this file just needs to keep
//   that one rule; assertBalancedScenarios() (run at import time below, and
//   in src/data/scenarioSets.test.js) will throw/fail loudly if it's broken.
//
// DRAFT_ROLE_IDS marks which sets are first-pass pharma scenario drafts that
// still need Shadi's review/rewrite (he is the domain owner — see CLAUDE.md
// and the standing rule in memory). Roles not listed in SCENARIO_SETS fall
// back to the generic ("general") set via getScenariosForRole().
//
// REVIEW: Arabic text below is a first-pass translation draft, same
// status as translations.js — needs language review before ship.

import { SCENARIOS as GENERIC_SCENARIOS } from './scenarios.js';

export function assertBalancedScenarios(scenarios, setName = 'scenario set') {
  if (scenarios.length !== 15) {
    throw new Error(`${setName}: expected 15 scenarios, got ${scenarios.length}`);
  }
  scenarios.forEach((sc, i) => {
    if (!sc.opts || sc.opts.length !== 3) {
      throw new Error(`${setName}: scenario ${i} must have exactly 3 options`);
    }
    const dims = sc.opts.map(o => o.d).sort().join('');
    if (dims !== 'BFW') {
      throw new Error(`${setName}: scenario ${i} must have exactly one F, one B, one W option (got ${dims})`);
    }
  });
  return true;
}

// --- First-line Manager — DRAFT, needs Shadi's review/rewrite ---
const SCENARIOS_FIRST_LINE_MANAGER = [
  { s: { en: 'Your team is behind quarterly target with two weeks left.', ar: 'فريقك متأخر عن الهدف الفصلي ويبقى أسبوعان فقط.' }, opts: [
      { t: { en: 'I study the call and coverage data to find where the gap really is.', ar: 'أُحلل بيانات الزيارات والتغطية لأحدد أين الفجوة فعلاً.' }, d: 'F' },
      { t: { en: 'I get in the field with reps to understand what they are facing.', ar: 'أرافق المندوبين ميدانياً لأفهم ما يواجهونه.' }, d: 'B' },
      { t: { en: 'I motivate the team for the final push we need.', ar: 'أُحفّز الفريق للاندفاعة الأخيرة المطلوبة.' }, d: 'W' } ] },
  { s: { en: 'A strong rep asks to change territory in a way that hurts coverage.', ar: 'مندوب متميز يطلب تغيير منطقته بشكل يُضعف التغطية.' }, opts: [
      { t: { en: 'I calculate the effect on coverage before deciding anything.', ar: 'أُحدد أثر القرار على التغطية بالأرقام قبل أي تغيير.' }, d: 'F' },
      { t: { en: 'I sit with them to understand what is really driving the request.', ar: 'أجلس معه لأفهم السبب الحقيقي وراء الطلب.' }, d: 'B' },
      { t: { en: 'I make the call that protects the district, even if unpopular.', ar: 'أتخذ القرار الذي يحمي المنطقة، حتى لو لم يُرضِ الجميع.' }, d: 'W' } ] },
  { s: { en: 'A government tender for a key product is due, and the terms would badly hurt your profit margin.', ar: 'يقترب موعد مناقصة حكومية لمنتج رئيسي، لكن شروطها ستُرهق هامش ربحك بشدة.' }, opts: [
      { t: { en: 'I rework the bid numbers until the margin really works.', ar: 'أُعيد بناء الحسابات المالية للعطاء حتى يصبح الهامش منطقياً فعلاً.' }, d: 'F' },
      { t: { en: 'I get input from finance and the field before deciding whether to bid.', ar: 'أستشير المالية والفريق الميداني قبل أن أُقرر المشاركة في العطاء.' }, d: 'B' },
      { t: { en: 'I decide that walking away is better than winning at a loss, and I stick to that.', ar: 'أُقرر أن الانسحاب أفضل من الفوز بخسارة، وأتمسك بهذا الموقف.' }, d: 'W' } ] },
  { s: { en: 'A new product launch needs your team trained fast before a KOL event.', ar: 'إطلاق منتج جديد يتطلب تدريب فريقك بسرعة قبل فعالية لقادة رأي طبي.' }, opts: [
      { t: { en: 'I build a tight training plan that covers the essentials fast.', ar: 'أضع خطة تدريب مكثفة تُغطي الأساسيات بسرعة.' }, d: 'F' },
      { t: { en: 'I check who is anxious about the event and coach them directly.', ar: 'أتحقق ممن يشعر بالقلق تجاه الفعالية وأُوجّهه مباشرة.' }, d: 'B' },
      { t: { en: 'I remind the team why this launch matters and set high standards.', ar: 'أُذكّر الفريق بأهمية هذا الإطلاق وأرفع سقف التوقعات.' }, d: 'W' } ] },
  { s: { en: 'One rep works hard, but their territory results are still behind.', ar: 'مندوب يعمل بجد لكن نتائج منطقته ما زالت متأخرة.' }, opts: [
      { t: { en: 'I check their call plan and account targeting for gaps.', ar: 'أُراجع خطة زياراته واستهداف حساباته بحثاً عن الفجوات.' }, d: 'F' },
      { t: { en: 'I ask how they are doing beyond the numbers, honestly.', ar: 'أسأله بصدق كيف حاله فعلاً بعيداً عن الأرقام.' }, d: 'B' },
      { t: { en: 'I agree a clear 30-day plan with them and make sure we stick to it.', ar: 'أضع معه خطة واضحة لثلاثين يوماً وألتزم بمتابعتها بحزم.' }, d: 'W' } ] },
  { s: { en: "Your exclusive distributor's contract is up for renewal, and their performance has been mixed.", ar: 'عقد موزّعك الحصري على وشك التجديد، وأداؤه كان متبايناً.' }, opts: [
      { t: { en: 'I review their coverage and payment-term data carefully before renewing.', ar: 'أُراجع بدقة بيانات تغطيتهم وشروط الدفع قبل التجديد.' }, d: 'F' },
      { t: { en: 'I sit down with them and talk honestly about where the partnership has become weaker.', ar: 'أجلس معهم بصراحة لأناقش أين تراجعت الشراكة.' }, d: 'B' },
      { t: { en: 'I decide whether to renew or switch, and take responsibility for the disruption either way.', ar: 'أُقرر التجديد أو التغيير، وأتحمل تبعات القرار في الحالتين.' }, d: 'W' } ] },
  { s: { en: 'A rep quietly tells you they are completely exhausted (burned out).', ar: 'يُخبرك مندوب بهدوء أنه مُنهك.' }, opts: [
      { t: { en: 'I help them rebuild a realistic weekly plan.', ar: 'أُساعده على بناء خطة أسبوعية واقعية من جديد.' }, d: 'F' },
      { t: { en: 'I make space for them to talk and just listen first.', ar: 'أُفسح له المجال ليتحدث وأستمع أولاً.' }, d: 'B' },
      { t: { en: 'I protect their workload for a few weeks, even if it costs coverage.', ar: 'أُخفف عبء عمله لبضعة أسابيع، حتى لو أثّر ذلك على التغطية.' }, d: 'W' } ] },
  { s: { en: 'Your regional director wants a forecast tomorrow, but half your data is missing.', ar: 'مدير المنطقة يطلب توقعات غداً ونصف بياناتك غير مكتمل.' }, opts: [
      { t: { en: 'I build the best model I can from what data exists.', ar: 'أبني أفضل نموذج ممكن من البيانات المتوفرة.' }, d: 'F' },
      { t: { en: "I call reps directly to fill the gaps from what they're seeing.", ar: 'أتصل بالمندوبين مباشرة لسد الفجوات بما يرونه ميدانياً.' }, d: 'B' },
      { t: { en: 'I send it clearly marked as an estimate, instead of guessing without saying so.', ar: 'أُرسله بوضوح كتوقع أولي بدل التخمين الصامت.' }, d: 'W' } ] },
  { s: { en: 'Two reps in your district compete in an unhealthy way for the same KOL.', ar: 'مندوبان في منطقتك يتنافسان بشكل غير صحي على نفس قائد الرأي الطبي.' }, opts: [
      { t: { en: 'I set a clear account-ownership rule so it cannot happen again.', ar: 'أضع قاعدة واضحة لملكية الحسابات لمنع تكرار الأمر.' }, d: 'F' },
      { t: { en: 'I bring both of them together to talk it through honestly.', ar: 'أجمع الاثنين معاً للحديث بصراحة.' }, d: 'B' },
      { t: { en: 'I say clearly the behavior is unacceptable and end it firmly.', ar: 'أُسمّي هذا السلوك بأنه غير مقبول وأحسمه بحزم.' }, d: 'W' } ] },
  { s: { en: 'A budget cut forces fewer field visits this quarter.', ar: 'خفض في الميزانية يفرض تقليل الزيارات الميدانية هذا الفصل.' }, opts: [
      { t: { en: 'I rank accounts by potential to protect the most valuable calls.', ar: 'أُعيد ترتيب أولوية الحسابات حسب الإمكانات لحماية الزيارات الأعلى قيمة.' }, d: 'F' },
      { t: { en: "I explain the change to the team honestly, not just as a policy memo.", ar: 'أشرح التغيير للفريق بصدق، لا كمجرد تعميم إداري.' }, d: 'B' },
      { t: { en: 'I decide the new coverage plan myself and take responsibility for what we give up.', ar: 'أتخذ قرار خطة التغطية الجديدة بنفسي وأتحمل مسؤولية المفاضلات.' }, d: 'W' } ] },
  { s: { en: 'Head office asks you to shift budget from your country to a struggling neighboring market.', ar: 'يطلب منك المكتب الرئيسي تحويل جزء من ميزانية بلدك إلى سوق مجاور يُعاني.' }, opts: [
      { t: { en: 'I model the exact impact on my own numbers before agreeing to anything.', ar: 'أُحدد بدقة الأثر على أرقامي الخاصة قبل الموافقة على أي شيء.' }, d: 'F' },
      { t: { en: 'I talk to the manager of that market to understand what they are facing.', ar: 'أتحدث مع نظيري الإقليمي لأفهم ما يواجهه فعلاً.' }, d: 'B' },
      { t: { en: 'I decide what is best for the region, even if my own numbers suffer.', ar: 'أتخذ القرار الذي يخدم المنطقة ككل، حتى لو تأثرت أرقامي الخاصة.' }, d: 'W' } ] },
  { s: { en: 'After a strong quarter, you reflect on what actually mattered most.', ar: 'بعد فصل قوي، تتأمل فيما كان له الأثر الأكبر فعلاً.' }, opts: [
      { t: { en: 'I credit better account targeting and disciplined call planning.', ar: 'أعزو الفضل إلى استهداف الحسابات الأدق والانضباط في الزيارات.' }, d: 'F' },
      { t: { en: 'I credit the trust I built with a team that felt safe to speak up.', ar: 'أعزو الفضل إلى الثقة التي بنيتها مع فريق شعر بالأمان للتحدث بصراحة.' }, d: 'B' },
      { t: { en: 'I credit holding the team to a clear, ambitious goal all quarter.', ar: 'أعزو الفضل إلى تمسكي بهدف واضح وطموح طوال الفصل.' }, d: 'W' } ] },
  { s: { en: 'A batch of your product is flagged for a possible quality issue in your market.', ar: 'تُرصد دفعة من منتجك بسبب مشكلة جودة محتملة في سوقك.' }, opts: [
      { t: { en: 'I pull every relevant lot and distribution record within the hour.', ar: 'أستخرج كل سجلات الدفعة والتوزيع ذات الصلة خلال ساعة.' }, d: 'F' },
      { t: { en: 'I speak honestly with pharmacies and key doctors early, before rumors spread.', ar: 'أُبادر بصراحة لإبلاغ الصيدليات والأطباء الرئيسيين قبل انتشار الشائعات.' }, d: 'B' },
      { t: { en: 'I decide on the recall myself, fast, even before head office fully approves.', ar: 'أتخذ قرار السحب بنفسي وبسرعة، حتى قبل موافقة المكتب الرئيسي الكاملة.' }, d: 'W' } ] },
  { s: { en: 'A distributor delay threatens your coverage target this month.', ar: 'تأخير من الموزّع يُهدد هدف التغطية هذا الشهر.' }, opts: [
      { t: { en: 'I track the exact delivery gap and move stock where I can.', ar: 'أُتابع فجوة التسليم بدقة وأُعيد توزيع المخزون حيثما أمكن.' }, d: 'F' },
      { t: { en: 'I keep pharmacies and reps informed so no one is surprised.', ar: 'أُبقي الصيدليات والمندوبين على اطلاع حتى لا يُفاجأ أحد.' }, d: 'B' },
      { t: { en: 'I push the distributor hard until it is fixed.', ar: 'أُصعّد الأمر بحزم مع الموزّع حتى يُحل.' }, d: 'W' } ] },
  { s: { en: 'You were promoted from rep to manager, and now you lead people who were your colleagues.', ar: 'رُقّيت من مندوب إلى مدير وتقود الآن زملاءك السابقين.' }, opts: [
      { t: { en: 'I focus first on learning the coaching and reporting side of the role.', ar: 'أُركّز أولاً على تعلّم جانب التدريب والتقارير في الدور الجديد.' }, d: 'F' },
      { t: { en: 'I have honest one-on-ones about how the relationship changes now.', ar: 'أُجري لقاءات فردية صادقة عن كيفية تغيّر العلاقة الآن.' }, d: 'B' },
      { t: { en: 'I make it clear early that fairness comes before old friendships.', ar: 'أُرسّخ منذ البداية أن العدالة تسبق الصداقات القديمة.' }, d: 'W' } ] },
];

// --- Product Manager — DRAFT, needs Shadi's review/rewrite ---
const SCENARIOS_PRODUCT_MANAGER = [
  { s: { en: 'A competitor launches ahead of you with a strong message.', ar: 'ينطلق منافس قبلك برسالة قوية.' }, opts: [
      { t: { en: 'I re-run the competitive analysis and adjust the plan fast.', ar: 'أُعيد تحليل المنافسة وأُعدّل الخطة بسرعة.' }, d: 'F' },
      { t: { en: 'I check in with the field team on how reps are feeling about it.', ar: 'أتحقق من فريق الميدان وكيف يشعر المندوبون تجاه الأمر.' }, d: 'B' },
      { t: { en: 'I choose what makes us different and get the team committed to it.', ar: 'أحسم زاويتنا التمايزية وألتزم بها مع الفريق.' }, d: 'W' } ] },
  { s: { en: 'Medical, regulatory, and sales disagree on the core brand message.', ar: 'يختلف القسم الطبي والتنظيمي والمبيعات حول الرسالة الأساسية للعلامة.' }, opts: [
      { t: { en: 'I show each department\'s limits clearly, side by side.', ar: 'أُعرض قيود كل قسم بوضوح جنباً إلى جنب.' }, d: 'F' },
      { t: { en: 'I get the three of them in a room to actually hear each other.', ar: 'أجمع الأطراف الثلاثة في غرفة واحدة ليستمع بعضهم لبعض فعلاً.' }, d: 'B' },
      { t: { en: 'I make the final call myself once input is in, and stand by it.', ar: 'أتخذ القرار النهائي بنفسي بعد جمع المدخلات وأقف خلفه.' }, d: 'W' } ] },
  { s: { en: 'Early launch metrics are below plan after month one.', ar: 'مؤشرات الإطلاق الأولى دون الخطة بعد الشهر الأول.' }, opts: [
      { t: { en: 'I check each step of the sales funnel to find exactly where we are losing.', ar: 'أُحلل مسار المبيعات لأحدد بدقة أين يحدث التسرب.' }, d: 'F' },
      { t: { en: 'I call a few reps directly to hear what is happening in the field.', ar: 'أتصل ببعض المندوبين مباشرة لأسمع ما يحدث فعلاً على الأرض.' }, d: 'B' },
      { t: { en: 'I tell leadership clearly that we are behind, and I take charge of a recovery plan.', ar: 'أُبلغ الإدارة بصراحة أننا متأخرون وأتحمل مسؤولية خطة التعافي.' }, d: 'W' } ] },
  { s: { en: 'A key opinion leader gives feedback that contradicts your brand plan.', ar: 'يُقدّم قائد رأي طبي رئيسي ملاحظات تتعارض مع خطة العلامة.' }, opts: [
      { t: { en: 'I test the feedback against the actual data before reacting.', ar: 'أختبر الملاحظة مقابل البيانات الفعلية قبل أي رد فعل.' }, d: 'F' },
      { t: { en: 'I go back to them to understand the concern behind the comment.', ar: 'أعود إليه لأفهم القلق الكامن وراء ملاحظته.' }, d: 'B' },
      { t: { en: 'I decide whether to change the plan and then act, instead of waiting.', ar: 'أُقرر إن كنت سأُعدّل الخطة وأمضي قدماً، بدل التوقف.' }, d: 'W' } ] },
  { s: { en: 'Your budget is cut mid-year, right before a planned campaign.', ar: 'تُقتطع ميزانيتك في منتصف العام، قبيل حملة مخطط لها.' }, opts: [
      { t: { en: 'I recheck the return (ROI) of every activity and cut the weakest first.', ar: 'أُعيد حساب العائد على كل نشاط وأُلغي الأضعف أولاً.' }, d: 'F' },
      { t: { en: 'I talk to the agency and field team before making any cuts.', ar: 'أتحدث مع الوكالة والفريق الميداني قبل أي تخفيض.' }, d: 'B' },
      { t: { en: "I protect the one activity I believe matters most, and defend it with senior management.", ar: 'أحمي النشاط الوحيد الذي أعتقد أنه الأهم، وأُدافع عنه أمام الإدارة.' }, d: 'W' } ] },
  { s: { en: 'A rep warns that the messages used in the field have moved off-label.', ar: 'يُنبّه مندوب إلى أن الرسائل الميدانية انحرفت عن الاستخدام المعتمد.' }, opts: [
      { t: { en: 'I take the approved claims and send out the exact wording again immediately.', ar: 'أستخرج الادعاءات المعتمدة وأُعيد إصدار الصياغة الدقيقة فوراً.' }, d: 'F' },
      { t: { en: 'I thank the rep directly for raising it instead of staying quiet.', ar: 'أشكر المندوب مباشرة على إثارة الأمر بدل الصمت.' }, d: 'B' },
      { t: { en: 'I report it to the compliance team immediately, even if it slows the launch.', ar: 'أُصعّد الأمر فوراً إلى قسم الامتثال، حتى لو أبطأ ذلك الإطلاق.' }, d: 'W' } ] },
  { s: { en: 'Two senior colleagues disagree openly in a leadership meeting.', ar: 'يختلف طرفان داخليان علناً في اجتماع قيادي.' }, opts: [
      { t: { en: 'I bring the data that settles the factual part of the disagreement.', ar: 'أطرح البيانات التي تحسم الجانب الواقعي من الخلاف.' }, d: 'F' },
      { t: { en: 'I follow up with each of them privately afterward.', ar: 'أُتابع مع كل منهما على انفراد لاحقاً.' }, d: 'B' },
      { t: { en: 'I say openly that there is tension and ask for a decision, not more debate.', ar: 'أُسمّي التوتر في القاعة وأطلب قراراً لا مزيداً من الجدل.' }, d: 'W' } ] },
  { s: { en: 'Market access pushes back hard on your pricing assumption.', ar: 'يعترض قسم الوصول إلى السوق بشدة على افتراض التسعير.' }, opts: [
      { t: { en: 'I rebuild the pricing model with their input fully included.', ar: 'أُعيد بناء نموذج التسعير مع دمج مدخلاتهم بشكل صحيح.' }, d: 'F' },
      { t: { en: 'I sit down with them to understand the situation with payers as they see it.', ar: 'أجلس معهم لأفهم واقع الجهات الدافعة كما يرونه.' }, d: 'B' },
      { t: { en: 'I decide the position we take to the pricing committee and get the team behind it.', ar: 'أُحدد الموقف الذي سنطرحه في لجنة التسعير وأُوحّد الفريق حوله.' }, d: 'W' } ] },
  { s: { en: "You have very little market data, and a launch decision is due this week.", ar: 'بيانات الرؤى محدودة وقرار الإطلاق مطلوب هذا الأسبوع.' }, opts: [
      { t: { en: 'I combine the data we have with data from similar markets to fill the gaps.', ar: 'أُقارن البيانات المتاحة بأسواق مشابهة لسد الفجوات.' }, d: 'F' },
      { t: { en: 'I call three people I trust in the field for a quick opinion.', ar: 'أتصل بثلاثة أصوات ميدانية موثوقة لتقييم سريع.' }, d: 'B' },
      { t: { en: 'I make the call with the data I have rather than delay further.', ar: 'أتخذ القرار بالبيانات المتوفرة بدل التأجيل أكثر.' }, d: 'W' } ] },
  { s: { en: 'Your agency delivers designs that are far from the brand brief.', ar: 'تُقدّم الوكالة تصميماً إبداعياً بعيداً كلياً عن ملخص العلامة.' }, opts: [
      { t: { en: 'I rewrite the brief with sharper, more specific direction.', ar: 'أُعيد كتابة الملخص بتوجيهات أدق وأكثر تحديداً.' }, d: 'F' },
      { t: { en: 'I get on a call with them to understand where the brief was unclear.', ar: 'أتصل بهم لأفهم أين كان الملخص غير واضح.' }, d: 'B' },
      { t: { en: 'I reject it completely and keep the deadline instead of accepting less.', ar: 'أرفضه تماماً وأتمسك بالموعد النهائي بدل القبول بأقل مما يجب.' }, d: 'W' } ] },
  { s: { en: 'You have three days to plan a booth at a medical congress.', ar: 'جناح في مؤتمر طبي يحتاج خطة خلال ثلاثة أيام فقط.' }, opts: [
      { t: { en: 'I assemble the checklist and vendor list from what worked last time.', ar: 'أُجهّز قائمة المهام والموردين اعتماداً على ما نجح سابقاً.' }, d: 'F' },
      { t: { en: 'I check who on the team can actually take this on without burning out.', ar: 'أتحقق من قدرة الفريق على تحمل هذا دون إرهاق.' }, d: 'B' },
      { t: { en: 'I decide what is possible to do and clearly drop the rest.', ar: 'أُحدد النطاق القابل للتحقيق وأُلغي الباقي دون تردد.' }, d: 'W' } ] },
  { s: { en: 'Sales leadership blames the brand plan for a weak quarter.', ar: 'تُحمّل قيادة المبيعات خطة العلامة مسؤولية فصل ضعيف.' }, opts: [
      { t: { en: 'I bring the execution data to show where the plan was and wasn\'t followed.', ar: 'أطرح بيانات التنفيذ لأُظهر أين اتُّبعت الخطة وأين لم تُتّبع.' }, d: 'F' },
      { t: { en: 'I ask sales leaders directly what is really getting in the way.', ar: 'أسأل قادة المبيعات مباشرة عما يُعيقهم فعلاً.' }, d: 'B' },
      { t: { en: 'I own my part of it publicly, then push for what needs to change.', ar: 'أتحمل مسؤوليتي علناً، ثم أُطالب بما يجب أن يتغير.' }, d: 'W' } ] },
  { s: { en: 'A brand plan you are proud of is quietly moved down the priority list.', ar: 'تُهمَّش بهدوء خطة علامة كنت فخوراً بها.' }, opts: [
      { t: { en: 'I ask for the specific data or reasoning behind the decision.', ar: 'أطلب البيانات أو المنطق المحدد وراء القرار.' }, d: 'F' },
      { t: { en: 'I talk honestly to my manager about how this feels for me.', ar: 'أتحدث مع مديري بصدق عن تأثير هذا الأمر عليّ.' }, d: 'B' },
      { t: { en: 'I accept it and put my energy into what matters now.', ar: 'أتصالح مع الأمر وأُعيد توجيه طاقتي إلى ما يهم الآن.' }, d: 'W' } ] },
  { s: { en: 'You must choose between two KOL partners. The budget is not enough for both.', ar: 'عليك الاختيار بين شريكين من قادة الرأي الطبي والميزانية لا تكفي لكليهما.' }, opts: [
      { t: { en: "I score both against clear, pre-set criteria before deciding.", ar: 'أُقيّم كليهما وفق معايير واضحة مُحددة مسبقاً قبل القرار.' }, d: 'F' },
      { t: { en: 'I consider which relationship has been most genuine over time.', ar: 'أعتبر أي علاقة كانت الأصدق على مدى الوقت.' }, d: 'B' },
      { t: { en: 'I make the harder choice and communicate it to both directly, myself.', ar: 'أتخذ الخيار الأصعب وأُبلغهما به مباشرة بنفسي.' }, d: 'W' } ] },
  { s: { en: 'You get to reflect on your best launch to date — what made it work?', ar: 'تتأمل في أفضل إطلاق قمت به حتى الآن — ما الذي جعله ناجحاً؟' }, opts: [
      { t: { en: 'The plan and the message were unusually well-built.', ar: 'كانت الخطة والرسالة مبنيتين بشكل استثنائي.' }, d: 'F' },
      { t: { en: 'The trust between medical, sales, and access made it run smoothly.', ar: 'كانت الثقة بين الأقسام الطبية والمبيعات والوصول هي ما جعله سلساً.' }, d: 'B' },
      { t: { en: 'I believed strongly in the strategy and did not change course.', ar: 'تمسكت بقناعة واضحة تجاه الاستراتيجية ولم أتراجع عنها.' }, d: 'W' } ] },
];

// --- Sales / Medical Rep — DRAFT, needs Shadi's review/rewrite ---
const SCENARIOS_SALES = [
  { s: { en: 'Two doctors cancel your morning calls at the last minute.', ar: 'يُلغي طبيبان زيارتيهما الصباحيتين في اللحظة الأخيرة.' }, opts: [
      { t: { en: 'I quickly rework my route to fill the gaps with other accounts.', ar: 'أُعيد ترتيب مسار زياراتي بسرعة لملء الفراغ بحسابات أخرى.' }, d: 'F' },
      { t: { en: "I check with their staff that everything is okay on their end.", ar: 'أتحقق مع طاقم العيادة من أن كل شيء على ما يرام لديهم.' }, d: 'B' },
      { t: { en: 'I decide which one call matters most today and give it my full effort.', ar: 'أُحدد أي زيارة اليوم هي الأهم وأُركّز جهدي عليها بالكامل.' }, d: 'W' } ] },
  { s: { en: "A physician raises a tough objection about your product's side-effect profile.", ar: 'يُثير طبيب اعتراضاً صعباً حول ملف الآثار الجانبية لمنتجك.' }, opts: [
      { t: { en: 'I pull the exact clinical data and answer with the numbers.', ar: 'أستحضر البيانات السريرية الدقيقة وأُجيب بالأرقام.' }, d: 'F' },
      { t: { en: 'I listen fully to the concern before saying anything back.', ar: 'أستمع بالكامل لقلقه قبل أن أرد بأي شيء.' }, d: 'B' },
      { t: { en: "I stand firmly behind the product's real value despite the pushback.", ar: 'أتمسك بثبات بقيمة المنتج الحقيقية رغم الاعتراض.' }, d: 'W' } ] },
  { s: { en: 'You are behind your monthly call-average target with one week left.', ar: 'أنت متأخر عن هدف متوسط زياراتك الشهري ويبقى أسبوع واحد فقط.' }, opts: [
      { t: { en: 'I tighten my daily route to fit in more calls efficiently.', ar: 'أُحكم مسار زياراتي اليومي لأُدرج زيارات أكثر بكفاءة.' }, d: 'F' },
      { t: { en: "I'm honest with my manager about the pressure I'm under.", ar: 'أُصارح مديري بالضغط الذي أشعر به.' }, d: 'B' },
      { t: { en: 'I push myself harder for the final stretch, whatever it takes.', ar: 'أدفع نفسي أكثر في المرحلة الأخيرة، مهما تطلب الأمر.' }, d: 'W' } ] },
  { s: { en: 'A rep from a competing company grows unusually close to your key doctor.', ar: 'يُصبح مندوب من شركة منافسة قريباً بشكل لافت من طبيبك الرئيسي.' }, opts: [
      { t: { en: 'I review my own call notes to see if my coverage has slipped.', ar: 'أُراجع ملاحظات زياراتي لأتحقق إن كانت تغطيتي قد تراجعت.' }, d: 'F' },
      { t: { en: 'I build the relationship through real, honest contact.', ar: 'أستثمر في العلاقة من خلال تواصل صادق وحقيقي.' }, d: 'B' },
      { t: { en: 'I decide to compete harder for the account, not step back.', ar: 'أُقرر التنافس بقوة أكبر على هذا الحساب بدلاً من التراجع.' }, d: 'W' } ] },
  { s: { en: "You notice your samples inventory doesn't match your log.", ar: 'تلاحظ أن مخزون العينات لديك لا يطابق سجلك.' }, opts: [
      { t: { en: 'I recount everything carefully and correct the record.', ar: 'أُعيد الجرد بدقة وأُصحح السجل.' }, d: 'F' },
      { t: { en: "I talk to my supervisor honestly about what happened.", ar: 'أتحدث إلى مشرفي بصدق عمّا حدث.' }, d: 'B' },
      { t: { en: 'I report it accurately, even though it is uncomfortable.', ar: 'أُبلغ عنه بدقة، حتى لو كان ذلك محرجاً.' }, d: 'W' } ] },
  { s: { en: 'A pharmacy asks you to break a rule on promotional materials "just this once."', ar: 'تطلب منك صيدلية التساهل في قاعدة المواد الترويجية "لمرة واحدة فقط".' }, opts: [
      { t: { en: 'I explain exactly what the approved guidelines allow.', ar: 'أشرح بدقة ما تسمح به الإرشادات المعتمدة.' }, d: 'F' },
      { t: { en: 'I try to understand why they are asking, without judging.', ar: 'أُحاول أن أفهم سبب الطلب، دون إصدار حكم.' }, d: 'B' },
      { t: { en: 'I say no clearly, even though it hurts the relationship.', ar: 'أرفض بوضوح، حتى لو أثّر ذلك على العلاقة.' }, d: 'W' } ] },
  { s: { en: 'Your best quarter yet ends and you reflect on what made it work.', ar: 'ينتهي أفضل فصل لك حتى الآن وتتأمل فيما جعله ناجحاً.' }, opts: [
      { t: { en: 'I credit better territory planning and clearer account priorities.', ar: 'أعزو الفضل إلى تخطيط المنطقة الأدق وترتيب أولويات الحسابات.' }, d: 'F' },
      { t: { en: 'I credit the genuine relationships I built with my doctors.', ar: 'أعزو الفضل إلى العلاقات الصادقة التي بنيتها مع أطبائي.' }, d: 'B' },
      { t: { en: 'I credit staying committed to my goals even on the hard days.', ar: 'أعزو الفضل إلى التزامي بأهدافي حتى في الأيام الصعبة.' }, d: 'W' } ] },
  { s: { en: 'A key doctor stops seeing you after years of a strong relationship.', ar: 'يتوقف طبيب رئيسي عن استقبالك بعد سنوات من علاقة قوية.' }, opts: [
      { t: { en: 'I analyze what changed in my call pattern or offering.', ar: 'أُحلل ما الذي تغيّر في نمط زياراتي أو عرضي.' }, d: 'F' },
      { t: { en: 'I reach out personally to understand what happened.', ar: 'أتواصل معه شخصياً لأفهم ما الذي حدث.' }, d: 'B' },
      { t: { en: 'I decide to keep showing up professionally, without taking it personally.', ar: 'أُقرر الاستمرار في الحضور باحترافية، دون أن آخذ الأمر بشكل شخصي.' }, d: 'W' } ] },
  { s: { en: 'Your manager gives you tough feedback about your presentation skills.', ar: 'يُقدّم لك مديرك ملاحظات صعبة حول مهاراتك في العرض.' }, opts: [
      { t: { en: 'I study the exact skills I need to sharpen and practice them.', ar: 'أدرس المهارات الدقيقة التي أحتاج إلى صقلها وأتدرّب عليها.' }, d: 'F' },
      { t: { en: 'I reflect honestly on how the feedback makes me feel.', ar: 'أتأمل بصدق في كيف تُشعرني هذه الملاحظات.' }, d: 'B' },
      { t: { en: 'I decide what to change and commit to doing it.', ar: 'أُقرر ما يجب تغييره وألتزم بتنفيذه.' }, d: 'W' } ] },
  { s: { en: "A colleague on your team seems to be struggling but hasn't said anything.", ar: 'يبدو أن زميلاً في فريقك يُعاني لكنه لم يُصرّح بشيء.' }, opts: [
      { t: { en: 'I check if a heavier workload is the real cause.', ar: 'أتحقق إن كان عبء العمل الزائد هو السبب الحقيقي.' }, d: 'F' },
      { t: { en: 'I reach out privately just to check in on them.', ar: 'أتواصل معه على انفراد للاطمئنان عليه.' }, d: 'B' },
      { t: { en: "I encourage them to be honest about what's really going on.", ar: 'أُشجّعه على أن يكون صادقاً بشأن ما يحدث فعلاً.' }, d: 'W' } ] },
  { s: { en: 'Head office introduces a new CRM system in the middle of the quarter.', ar: 'يُطلق المكتب الرئيسي نظام إدارة علاقات عملاء جديداً في منتصف الفصل.' }, opts: [
      { t: { en: 'I build myself a simple guide to learn it fast.', ar: 'أُعدّ لنفسي دليلاً مبسطاً لتعلّمه بسرعة.' }, d: 'F' },
      { t: { en: 'I help the teammate who is struggling most with it.', ar: 'أُساعد الزميل الأكثر تعثراً في استخدامه.' }, d: 'B' },
      { t: { en: 'I commit to using it fully, even though it slows me down at first.', ar: 'ألتزم باستخدامه بالكامل، حتى لو أبطأني في البداية.' }, d: 'W' } ] },
  { s: { en: 'You land the biggest sale of your career.', ar: 'تُحقق أكبر صفقة في مسيرتك المهنية.' }, opts: [
      { t: { en: 'I document exactly what worked so I can repeat it.', ar: 'أُوثّق بدقة ما نجح لأتمكن من تكراره.' }, d: 'F' },
      { t: { en: 'I thank everyone who helped make it happen.', ar: 'أشكر كل من ساعد في تحقيق ذلك.' }, d: 'B' },
      { t: { en: "I feel very proud that I proved it was possible.", ar: 'أشعر بفخر كبير لإثبات ما هو ممكن.' }, d: 'W' } ] },
  { s: { en: 'A new hire joins you in the field and asks how you handle rejection.', ar: 'يُرافقك موظف جديد ويسألك كيف تتعامل مع الرفض.' }, opts: [
      { t: { en: 'I show them the practical scripts and tools I rely on.', ar: 'أُريه النصوص والأدوات العملية التي أعتمد عليها.' }, d: 'F' },
      { t: { en: 'I share honestly what rejection actually feels like for me.', ar: 'أُشارك بصدق كيف يبدو الرفض فعلاً بالنسبة لي.' }, d: 'B' },
      { t: { en: 'I tell them why I keep showing up despite it.', ar: 'أُخبره لماذا أستمر في الحضور رغم ذلك.' }, d: 'W' } ] },
  { s: { en: 'You discover a formulary restriction that could hurt your numbers this month.', ar: 'تكتشف قيداً في القائمة الدوائية قد يُضرّ بأرقامك هذا الشهر.' }, opts: [
      { t: { en: 'I study the exact rules to find a compliant way to work with it.', ar: 'أتعمّق في التفاصيل الدقيقة لإيجاد مسار متوافق مع القواعد لتجاوزه.' }, d: 'F' },
      { t: { en: 'I ask other reps how they are dealing with it.', ar: 'أسأل زملائي المندوبين كيف يتعاملون معه.' }, d: 'B' },
      { t: { en: 'I push harder on my other accounts instead of worrying about it.', ar: 'أدفع بقوة أكبر على حساباتي الأخرى بدل الانشغال به.' }, d: 'W' } ] },
  { s: { en: "You are offered a challenging extra task: covering a colleague's territory.", ar: 'يُعرض عليك تكليف إضافي بتغطية منطقة زميل لك.' }, opts: [
      { t: { en: 'I ask for the data on that territory before deciding.', ar: 'أطلب بيانات تلك المنطقة قبل اتخاذ القرار.' }, d: 'F' },
      { t: { en: 'I think about how it affects my own team relationships.', ar: 'أُفكّر في تأثير ذلك على علاقاتي مع فريقي.' }, d: 'B' },
      { t: { en: "I say yes because it's a chance to grow and prove myself.", ar: 'أُوافق لأنها فرصة للنمو وإثبات قدراتي.' }, d: 'W' } ] },
];

export const DRAFT_ROLE_IDS = ['sales', 'marketing', 'management'];

assertBalancedScenarios(SCENARIOS_SALES, 'sales scenarios');
assertBalancedScenarios(SCENARIOS_FIRST_LINE_MANAGER, 'management scenarios');
assertBalancedScenarios(SCENARIOS_PRODUCT_MANAGER, 'marketing scenarios');

export const SCENARIO_SETS = {
  sales: SCENARIOS_SALES,
  marketing: SCENARIOS_PRODUCT_MANAGER,
  management: SCENARIOS_FIRST_LINE_MANAGER,
  general: GENERIC_SCENARIOS,
};

export function getScenariosForRole(roleId) {
  return SCENARIO_SETS[roleId] || GENERIC_SCENARIOS;
}

export function isDraftRole(roleId) {
  return DRAFT_ROLE_IDS.includes(roleId);
}
