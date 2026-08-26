// Role-based scenario sets for Part 1 of the assessment.
//
// SCHEMA (enforced by assertBalancedScenarios, called for every set below):
//   each set is an array of 15 scenarios, each shaped like:
//     { s: {en,ar,fr}, opts: [ {t:{en,ar,fr}, d:"F"}, {t:{...}, d:"B"}, {t:{...}, d:"W"} ] }
//   `opts` must have exactly 3 entries, one per dimension (F, B, W) — order
//   inside the array does not matter, but the SET of dimensions must be
//   exactly {F, B, W}. A non-developer editing this file just needs to keep
//   that one rule; assertBalancedScenarios() (run at import time below, and
//   in src/data/scenarioSets.test.js) will throw/fail loudly if it's broken.
//
// DRAFT_ROLE_IDS marks which sets are first-pass pharma scenario drafts that
// still need Shadi's review/rewrite (he is the domain owner — see CLAUDE.md
// and the standing rule in memory). Roles not listed in SCENARIO_SETS fall
// back to the generic set via getScenariosForRole().
//
// REVIEW: Arabic/French text below is a first-pass translation draft, same
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
  { s: { en: 'Your team is behind quarterly target with two weeks left.', ar: 'فريقك متأخر عن الهدف الفصلي وتبقى أسبوعان فقط.', fr: "Votre équipe est en retard sur l'objectif trimestriel, à deux semaines de la fin." }, opts: [
      { t: { en: 'I dig into the call/coverage data to find where the gap really is.', ar: 'أُحلل بيانات الزيارات والتغطية لأحدد أين الفجوة فعلاً.', fr: "J'analyse les données de visites et de couverture pour localiser l'écart réel." }, d: 'F' },
      { t: { en: 'I get in the field with reps to understand what they are facing.', ar: 'أرافق المندوبين ميدانياً لأفهم ما يواجهونه.', fr: "Je vais sur le terrain avec les délégués pour comprendre ce qu'ils vivent." }, d: 'B' },
      { t: { en: 'I rally the team on the push we need for the final stretch.', ar: 'أُحفّز الفريق للاندفاعة الأخيرة المطلوبة.', fr: "Je mobilise l'équipe pour le dernier effort nécessaire." }, d: 'W' } ] },
  { s: { en: 'A strong rep asks to change territory in a way that hurts coverage.', ar: 'مندوب متميز يطلب تغيير منطقته بشكل يُضعف التغطية.', fr: "Un délégué performant demande un changement de secteur qui nuirait à la couverture." }, opts: [
      { t: { en: 'I model out the coverage impact before deciding anything.', ar: 'أُحدد أثر القرار على التغطية بالأرقام قبل أي تغيير.', fr: "Je chiffre l'impact sur la couverture avant toute décision." }, d: 'F' },
      { t: { en: 'I sit with them to understand what is really driving the request.', ar: 'أجلس معه لأفهم السبب الحقيقي وراء الطلب.', fr: "Je m'assois avec lui pour comprendre ce qui motive vraiment cette demande." }, d: 'B' },
      { t: { en: 'I make the call that protects the district, even if unpopular.', ar: 'أتخذ القرار الذي يحمي المنطقة، حتى لو لم يُرضِ الجميع.', fr: "Je prends la décision qui protège le secteur, même si elle est impopulaire." }, d: 'W' } ] },
  { s: { en: 'A field visit shows a rep skipping required call documentation.', ar: 'زيارة ميدانية تكشف أن مندوباً يتجاهل توثيق الزيارات المطلوب.', fr: "Une visite terrain révèle qu'un délégué néglige la documentation obligatoire des visites." }, opts: [
      { t: { en: 'I walk them through the process again, step by step.', ar: 'أُراجع معه الإجراء خطوة بخطوة من جديد.', fr: "Je reprends la procédure avec lui, étape par étape." }, d: 'F' },
      { t: { en: 'I ask what is making the documentation feel hard to keep up with.', ar: 'أسأله ما الذي يجعل التوثيق صعباً بالنسبة له.', fr: "Je lui demande ce qui rend cette documentation difficile à suivre." }, d: 'B' },
      { t: { en: 'I name it clearly as non-negotiable and follow up until it changes.', ar: 'أُوضح بصراحة أن هذا الأمر غير قابل للتفاوض وأُتابعه حتى يتغير.', fr: "Je pose clairement que ce n'est pas négociable et je fais un suivi jusqu'au changement." }, d: 'W' } ] },
  { s: { en: 'A new product launch needs your team trained fast before a KOL event.', ar: 'إطلاق منتج جديد يتطلب تدريب فريقك بسرعة قبل فعالية لقادة رأي طبي.', fr: "Un lancement de produit exige de former vite l'équipe avant un événement avec des leaders d'opinion." }, opts: [
      { t: { en: 'I build a tight training plan that covers the essentials fast.', ar: 'أضع خطة تدريب مكثفة تُغطي الأساسيات بسرعة.', fr: "Je construis un plan de formation resserré qui couvre l'essentiel rapidement." }, d: 'F' },
      { t: { en: 'I check who is anxious about the event and coach them directly.', ar: 'أتحقق ممن يشعر بالقلق تجاه الفعالية وأُوجّهه مباشرة.', fr: "J'identifie qui est anxieux à propos de l'événement et je le coache directement." }, d: 'B' },
      { t: { en: 'I remind the team why this launch matters and set the bar high.', ar: 'أُذكّر الفريق بأهمية هذا الإطلاق وأرفع سقف التوقعات.', fr: "Je rappelle à l'équipe pourquoi ce lancement compte et je place la barre haut." }, d: 'W' } ] },
  { s: { en: 'One rep works hard but their territory results still lag.', ar: 'مندوب يعمل بجد لكن نتائج منطقته ما زالت متأخرة.', fr: "Un délégué travaille dur mais les résultats de son secteur restent faibles." }, opts: [
      { t: { en: 'I audit their call plan and account targeting for gaps.', ar: 'أُراجع خطة زياراته واستهداف حساباته بحثاً عن الفجوات.', fr: "J'audite son plan de visites et son ciblage de comptes pour trouver les failles." }, d: 'F' },
      { t: { en: 'I ask how they are doing beyond the numbers, honestly.', ar: 'أسأله بصدق كيف حاله فعلاً بعيداً عن الأرقام.', fr: "Je lui demande sincèrement comment il va, au-delà des chiffres." }, d: 'B' },
      { t: { en: 'I set a clear 30-day plan with them and hold the line on it.', ar: 'أضع معه خطة واضحة لثلاثين يوماً وألتزم بمتابعتها بحزم.', fr: "Je fixe avec lui un plan clair sur 30 jours et je le tiens fermement." }, d: 'W' } ] },
  { s: { en: 'Marketing pushes a campaign your team is not ready to run.', ar: 'قسم التسويق يدفع بحملة والفريق غير جاهز لتنفيذها.', fr: "Le marketing pousse une campagne que l'équipe n'est pas prête à exécuter." }, opts: [
      { t: { en: 'I flag the readiness gap with specifics and propose a fix.', ar: 'أُبلغ بفجوة الجاهزية بتفاصيل دقيقة وأقترح حلاً.', fr: "Je signale précisément l'écart de préparation et je propose une solution." }, d: 'F' },
      { t: { en: 'I check in with reps first on how the pressure is landing on them.', ar: 'أتحقق أولاً من كيفية تأثير هذا الضغط على المندوبين.', fr: "Je m'assure d'abord de l'effet de cette pression sur les délégués." }, d: 'B' },
      { t: { en: 'I push back on the timeline directly, even to my own director.', ar: 'أعترض مباشرة على الجدول الزمني، حتى أمام مديري.', fr: "Je conteste directement le calendrier, même auprès de mon propre directeur." }, d: 'W' } ] },
  { s: { en: 'A rep quietly tells you they are burned out.', ar: 'يُخبرك مندوب بهدوء أنه مُنهك.', fr: "Un délégué vous confie discrètement qu'il est épuisé." }, opts: [
      { t: { en: 'I help them rebuild a realistic weekly plan.', ar: 'أُساعده على بناء خطة أسبوعية واقعية من جديد.', fr: "Je l'aide à reconstruire un planning hebdomadaire réaliste." }, d: 'F' },
      { t: { en: 'I make space for them to talk and just listen first.', ar: 'أُفسح له المجال ليتحدث وأستمع أولاً.', fr: "Je lui laisse de l'espace pour parler et j'écoute d'abord." }, d: 'B' },
      { t: { en: 'I protect their workload for a few weeks, even if it costs coverage.', ar: 'أُخفف عبء عمله لبضعة أسابيع، حتى لو أثّر ذلك على التغطية.', fr: "Je protège sa charge de travail pendant quelques semaines, même au prix de la couverture." }, d: 'W' } ] },
  { s: { en: 'Regional director wants a forecast tomorrow with half your data missing.', ar: 'مدير المنطقة يطلب توقعات غداً ونصف بياناتك غير مكتمل.', fr: "Le directeur régional veut une prévision demain alors que la moitié de vos données manquent." }, opts: [
      { t: { en: 'I build the best model I can from what data exists.', ar: 'أبني أفضل نموذج ممكن من البيانات المتوفرة.', fr: "Je construis le meilleur modèle possible avec les données disponibles." }, d: 'F' },
      { t: { en: "I call reps directly to fill the gaps from what they're seeing.", ar: 'أتصل بالمندوبين مباشرة لسد الفجوات بما يرونه ميدانياً.', fr: "J'appelle directement les délégués pour combler les manques avec le terrain." }, d: 'B' },
      { t: { en: 'I submit it clearly labeled as provisional rather than guess silently.', ar: 'أُرسله بوضوح كتوقع أولي بدل التخمين الصامت.', fr: "Je le soumets clairement étiqueté comme provisoire plutôt que de deviner en silence." }, d: 'W' } ] },
  { s: { en: 'Two reps in your district compete unhealthily for the same KOL.', ar: 'مندوبان في منطقتك يتنافسان بشكل غير صحي على نفس قائد الرأي الطبي.', fr: "Deux délégués de votre secteur se disputent sans mesure le même leader d'opinion." }, opts: [
      { t: { en: 'I set a clear account-ownership rule so it cannot happen again.', ar: 'أضع قاعدة واضحة لملكية الحسابات لمنع تكرار الأمر.', fr: "J'établis une règle claire de propriété du compte pour éviter que cela se reproduise." }, d: 'F' },
      { t: { en: 'I bring both of them together to talk it through honestly.', ar: 'أجمع الاثنين معاً للحديث بصراحة.', fr: "Je les réunis tous les deux pour en parler honnêtement." }, d: 'B' },
      { t: { en: 'I name the behavior as unacceptable and settle it decisively.', ar: 'أُسمّي هذا السلوك بأنه غير مقبول وأحسمه بحزم.', fr: "Je nomme ce comportement comme inacceptable et je tranche fermement." }, d: 'W' } ] },
  { s: { en: 'A budget cut forces fewer field visits this quarter.', ar: 'خفض في الميزانية يفرض تقليل الزيارات الميدانية هذا الفصل.', fr: "Une coupe budgétaire impose moins de visites terrain ce trimestre." }, opts: [
      { t: { en: 'I re-prioritize accounts by potential to protect the highest-value calls.', ar: 'أُعيد ترتيب أولوية الحسابات حسب الإمكانات لحماية الزيارات الأعلى قيمة.', fr: "Je reprioritise les comptes par potentiel pour protéger les visites les plus stratégiques." }, d: 'F' },
      { t: { en: "I explain the change to the team honestly, not just as a policy memo.", ar: 'أشرح التغيير للفريق بصدق، لا كمجرد تعميم إداري.', fr: "J'explique le changement à l'équipe honnêtement, pas comme une simple note administrative." }, d: 'B' },
      { t: { en: 'I decide the new coverage plan myself and own the trade-offs.', ar: 'أتخذ قرار خطة التغطية الجديدة بنفسي وأتحمل مسؤولية المفاضلات.', fr: "Je décide moi-même du nouveau plan de couverture et j'assume les compromis." }, d: 'W' } ] },
  { s: { en: 'A rep asks you to bend an expense rule "just this once."', ar: 'يطلب منك مندوب التساهل في قاعدة مصاريف "لمرة واحدة فقط".', fr: "Un délégué vous demande d'assouplir une règle de notes de frais « juste cette fois »." }, opts: [
      { t: { en: 'I explain exactly what the policy requires and why.', ar: 'أشرح بدقة ما تتطلبه السياسة ولماذا.', fr: "J'explique précisément ce qu'exige la politique et pourquoi." }, d: 'F' },
      { t: { en: 'I ask what pressure led them to ask, without judging.', ar: 'أسأل عن الضغط الذي دفعه لهذا الطلب، دون إصدار حكم.', fr: "Je demande quelle pression l'a poussé à demander cela, sans jugement." }, d: 'B' },
      { t: { en: 'I say no clearly, even though it is an uncomfortable conversation.', ar: 'أرفض بوضوح، حتى لو كانت محادثة غير مريحة.', fr: "Je refuse clairement, même si la conversation est inconfortable." }, d: 'W' } ] },
  { s: { en: 'After a strong quarter, you reflect on what actually mattered most.', ar: 'بعد فصل قوي، تتأمل فيما كان له الأثر الأكبر فعلاً.', fr: "Après un bon trimestre, vous réfléchissez à ce qui a vraiment compté." }, opts: [
      { t: { en: 'I credit the sharper account targeting and call discipline.', ar: 'أعزو الفضل إلى استهداف الحسابات الأدق والانضباط في الزيارات.', fr: "J'attribue le mérite au ciblage plus précis des comptes et à la discipline des visites." }, d: 'F' },
      { t: { en: 'I credit the trust I built with a team that felt safe to speak up.', ar: 'أعزو الفضل إلى الثقة التي بنيتها مع فريق شعر بالأمان للتحدث بصراحة.', fr: "J'attribue le mérite à la confiance bâtie avec une équipe qui se sentait libre de s'exprimer." }, d: 'B' },
      { t: { en: 'I credit holding the team to a clear, ambitious goal all quarter.', ar: 'أعزو الفضل إلى تمسكي بهدف واضح وطموح طوال الفصل.', fr: "J'attribue le mérite au maintien d'un objectif clair et ambitieux tout le trimestre." }, d: 'W' } ] },
  { s: { en: 'A new CRM rollout disrupts your team\'s field routine.', ar: 'إطلاق نظام إدارة علاقات العملاء الجديد يُربك الروتين الميداني لفريقك.', fr: "Le déploiement d'un nouveau CRM perturbe la routine terrain de l'équipe." }, opts: [
      { t: { en: 'I build a simple cheat-sheet so the team adapts fast.', ar: 'أُعدّ دليلاً مبسطاً ليتكيف الفريق بسرعة.', fr: "Je prépare un aide-mémoire simple pour que l'équipe s'adapte vite." }, d: 'F' },
      { t: { en: 'I ride along with the most frustrated rep first.', ar: 'أُرافق أكثر مندوب متضايق من التغيير أولاً.', fr: "J'accompagne d'abord le délégué le plus frustré par le changement." }, d: 'B' },
      { t: { en: "I set a firm adoption deadline and don't let it slide.", ar: 'أضع موعداً نهائياً حازماً للتبني ولا أسمح بتأجيله.', fr: "Je fixe une échéance ferme d'adoption et je ne la laisse pas glisser." }, d: 'W' } ] },
  { s: { en: 'A distributor delay threatens your coverage target this month.', ar: 'تأخير من الموزّع يُهدد هدف التغطية هذا الشهر.', fr: "Un retard du distributeur menace l'objectif de couverture ce mois-ci." }, opts: [
      { t: { en: 'I track the exact delivery gap and reroute stock where I can.', ar: 'أُتابع فجوة التسليم بدقة وأُعيد توزيع المخزون حيثما أمكن.', fr: "Je suis précisément l'écart de livraison et je réoriente le stock quand c'est possible." }, d: 'F' },
      { t: { en: 'I keep pharmacies and reps informed so no one is caught off guard.', ar: 'أُبقي الصيدليات والمندوبين على اطلاع حتى لا يُفاجأ أحد.', fr: "Je tiens pharmacies et délégués informés pour que personne ne soit pris au dépourvu." }, d: 'B' },
      { t: { en: 'I escalate hard with the distributor until it is fixed.', ar: 'أُصعّد الأمر بحزم مع الموزّع حتى يُحل.', fr: "J'escalade fermement auprès du distributeur jusqu'à résolution." }, d: 'W' } ] },
  { s: { en: 'You were promoted from rep to manager and now lead former peers.', ar: 'رُقّيت من مندوب إلى مدير وتقود الآن زملاءك السابقين.', fr: "Vous venez d'être promu délégué à manager et dirigez d'anciens collègues." }, opts: [
      { t: { en: 'I focus first on learning the coaching and reporting side of the role.', ar: 'أُركّز أولاً على تعلّم جانب التدريب والتقارير في الدور الجديد.', fr: "Je me concentre d'abord sur l'apprentissage du volet coaching et reporting du rôle." }, d: 'F' },
      { t: { en: 'I have honest one-on-ones about how the relationship changes now.', ar: 'أُجري لقاءات فردية صادقة عن كيفية تغيّر العلاقة الآن.', fr: "Je mène des entretiens individuels honnêtes sur la façon dont la relation change." }, d: 'B' },
      { t: { en: 'I set the tone early that fairness comes before old friendships.', ar: 'أُرسّخ منذ البداية أن العدالة تسبق الصداقات القديمة.', fr: "J'installe tôt le principe que l'équité prime sur les anciennes amitiés." }, d: 'W' } ] },
];

// --- Product Manager — DRAFT, needs Shadi's review/rewrite ---
const SCENARIOS_PRODUCT_MANAGER = [
  { s: { en: 'A competitor launches ahead of you with a strong message.', ar: 'ينطلق منافس قبلك برسالة قوية.', fr: "Un concurrent se lance avant vous avec un message fort." }, opts: [
      { t: { en: 'I re-run the competitive analysis and adjust the plan fast.', ar: 'أُعيد تحليل المنافسة وأُعدّل الخطة بسرعة.', fr: "Je refais l'analyse concurrentielle et j'ajuste le plan rapidement." }, d: 'F' },
      { t: { en: 'I check in with the field team on how reps are feeling about it.', ar: 'أتحقق من فريق الميدان وكيف يشعر المندوبون تجاه الأمر.', fr: "Je prends le pouls de l'équipe terrain sur son ressenti face à cette annonce." }, d: 'B' },
      { t: { en: 'I decide our differentiated angle and commit the team to it.', ar: 'أحسم زاويتنا التمايزية وألتزم بها مع الفريق.', fr: "Je tranche notre angle de différenciation et j'y engage l'équipe." }, d: 'W' } ] },
  { s: { en: 'Medical, regulatory, and sales disagree on the core brand message.', ar: 'يختلف القسم الطبي والتنظيمي والمبيعات حول الرسالة الأساسية للعلامة.', fr: "Médical, réglementaire et ventes sont en désaccord sur le message central de la marque." }, opts: [
      { t: { en: 'I lay out each function\'s constraint clearly, side by side.', ar: 'أُعرض قيود كل قسم بوضوح جنباً إلى جنب.', fr: "Je pose clairement, côte à côte, la contrainte de chaque fonction." }, d: 'F' },
      { t: { en: 'I get the three of them in a room to actually hear each other.', ar: 'أجمع الأطراف الثلاثة في غرفة واحدة ليستمع بعضهم لبعض فعلاً.', fr: "Je réunis les trois parties pour qu'elles s'écoutent réellement." }, d: 'B' },
      { t: { en: 'I make the final call myself once input is in, and stand by it.', ar: 'أتخذ القرار النهائي بنفسي بعد جمع المدخلات وأقف خلفه.', fr: "Je prends la décision finale moi-même une fois les avis recueillis, et je l'assume." }, d: 'W' } ] },
  { s: { en: 'Early launch metrics are below plan after month one.', ar: 'مؤشرات الإطلاق الأولى دون الخطة بعد الشهر الأول.', fr: "Les indicateurs de lancement sont sous le plan après le premier mois." }, opts: [
      { t: { en: 'I break the funnel down to find exactly where it is leaking.', ar: 'أُحلل مسار المبيعات لأحدد بدقة أين يحدث التسرب.', fr: "Je décompose l'entonnoir pour identifier précisément où ça fuit." }, d: 'F' },
      { t: { en: 'I call a few reps directly to hear what is happening on the ground.', ar: 'أتصل ببعض المندوبين مباشرة لأسمع ما يحدث فعلاً على الأرض.', fr: "J'appelle directement quelques délégués pour entendre ce qui se passe sur le terrain." }, d: 'B' },
      { t: { en: 'I say clearly to leadership that we are behind and own a recovery plan.', ar: 'أُبلغ الإدارة بصراحة أننا متأخرون وأتحمل مسؤولية خطة التعافي.', fr: "Je dis clairement à la direction que nous sommes en retard et j'assume un plan de rattrapage." }, d: 'W' } ] },
  { s: { en: 'A key opinion leader gives feedback that contradicts your brand plan.', ar: 'يُقدّم قائد رأي طبي رئيسي ملاحظات تتعارض مع خطة العلامة.', fr: "Un leader d'opinion clé donne un retour qui contredit le plan de marque." }, opts: [
      { t: { en: 'I test the feedback against the actual data before reacting.', ar: 'أختبر الملاحظة مقابل البيانات الفعلية قبل أي رد فعل.', fr: "Je confronte le retour aux données réelles avant de réagir." }, d: 'F' },
      { t: { en: 'I go back to them to understand the concern behind the comment.', ar: 'أعود إليه لأفهم القلق الكامن وراء ملاحظته.', fr: "Je le recontacte pour comprendre la préoccupation derrière ce commentaire." }, d: 'B' },
      { t: { en: 'I decide whether to adjust the plan and move, rather than stall.', ar: 'أُقرر إن كنت سأُعدّل الخطة وأمضي قدماً، بدل التوقف.', fr: "Je décide s'il faut ajuster le plan et j'avance, plutôt que de rester bloqué." }, d: 'W' } ] },
  { s: { en: 'Your budget is cut mid-year, right before a planned campaign.', ar: 'تُقتطع ميزانيتك في منتصف العام، قبيل حملة مخطط لها.', fr: "Votre budget est réduit en cours d'année, juste avant une campagne prévue." }, opts: [
      { t: { en: 'I re-run the ROI math on every activity and cut the weakest first.', ar: 'أُعيد حساب العائد على كل نشاط وأُلغي الأضعف أولاً.', fr: "Je recalcule le retour sur investissement de chaque activité et je coupe d'abord la plus faible." }, d: 'F' },
      { t: { en: 'I talk to the agency and field team before making any cuts.', ar: 'أتحدث مع الوكالة والفريق الميداني قبل أي تخفيض.', fr: "Je parle à l'agence et à l'équipe terrain avant toute coupe." }, d: 'B' },
      { t: { en: "I protect the one activity I believe matters most, and defend it up the chain.", ar: 'أحمي النشاط الوحيد الذي أعتقد أنه الأهم، وأُدافع عنه أمام الإدارة.', fr: "Je protège l'activité que je juge la plus décisive, et je la défends jusqu'en haut." }, d: 'W' } ] },
  { s: { en: 'A rep flags that field messaging has drifted off-label.', ar: 'يُنبّه مندوب إلى أن الرسائل الميدانية انحرفت عن الاستخدام المعتمد.', fr: "Un délégué signale que le discours terrain a dérivé hors indication." }, opts: [
      { t: { en: 'I pull the approved claims and reissue exact wording immediately.', ar: 'أستخرج الادعاءات المعتمدة وأُعيد إصدار الصياغة الدقيقة فوراً.', fr: "Je ressors les allégations approuvées et je republie le libellé exact immédiatement." }, d: 'F' },
      { t: { en: 'I thank the rep directly for flagging it rather than staying quiet.', ar: 'أشكر المندوب مباشرة على إثارة الأمر بدل الصمت.', fr: "Je remercie directement le délégué d'avoir signalé cela plutôt que de se taire." }, d: 'B' },
      { t: { en: 'I escalate to compliance immediately, even if it slows the launch.', ar: 'أُصعّد الأمر فوراً إلى الالتزام، حتى لو أبطأ ذلك الإطلاق.', fr: "J'escalade immédiatement vers la conformité, même si cela ralentit le lancement." }, d: 'W' } ] },
  { s: { en: 'Two internal stakeholders disagree publicly in a leadership meeting.', ar: 'يختلف طرفان داخليان علناً في اجتماع قيادي.', fr: "Deux parties prenantes internes s'opposent publiquement en réunion de direction." }, opts: [
      { t: { en: 'I bring the data that settles the factual part of the disagreement.', ar: 'أطرح البيانات التي تحسم الجانب الواقعي من الخلاف.', fr: "J'apporte les données qui tranchent la partie factuelle du désaccord." }, d: 'F' },
      { t: { en: 'I follow up with each of them privately afterward.', ar: 'أُتابع مع كل منهما على انفراد لاحقاً.', fr: "Je fais un suivi individuel avec chacun d'eux après coup." }, d: 'B' },
      { t: { en: 'I name the tension in the room and ask for a decision, not more debate.', ar: 'أُسمّي التوتر في القاعة وأطلب قراراً لا مزيداً من الجدل.', fr: "Je nomme la tension dans la salle et je demande une décision, pas plus de débat." }, d: 'W' } ] },
  { s: { en: 'Market access pushes back hard on your pricing assumption.', ar: 'يعترض قسم الوصول إلى السوق بشدة على افتراض التسعير.', fr: "L'accès au marché conteste fortement votre hypothèse de prix." }, opts: [
      { t: { en: 'I rebuild the pricing model with their input properly folded in.', ar: 'أُعيد بناء نموذج التسعير مع دمج مدخلاتهم بشكل صحيح.', fr: "Je reconstruis le modèle de prix en intégrant correctement leurs apports." }, d: 'F' },
      { t: { en: 'I sit down with them to understand the payer reality they see.', ar: 'أجلس معهم لأفهم واقع الجهات الدافعة كما يرونه.', fr: "Je m'assois avec eux pour comprendre la réalité des payeurs qu'ils observent." }, d: 'B' },
      { t: { en: 'I decide the position we take into the pricing committee and align the team.', ar: 'أُحدد الموقف الذي سنطرحه في لجنة التسعير وأُوحّد الفريق حوله.', fr: "Je décide la position que nous porterons devant le comité de prix et j'aligne l'équipe." }, d: 'W' } ] },
  { s: { en: "Insight data is thin and a launch decision is due this week.", ar: 'بيانات الرؤى محدودة وقرار الإطلاق مطلوب هذا الأسبوع.', fr: "Les données d'insight sont maigres et une décision de lancement est due cette semaine." }, opts: [
      { t: { en: 'I triangulate what data exists with market analogs to fill gaps.', ar: 'أُقارن البيانات المتاحة بأسواق مشابهة لسد الفجوات.', fr: "Je croise les données disponibles avec des marchés analogues pour combler les manques." }, d: 'F' },
      { t: { en: 'I call three trusted field voices for a fast gut-check.', ar: 'أتصل بثلاثة أصوات ميدانية موثوقة لتقييم سريع.', fr: "J'appelle trois voix terrain de confiance pour un avis rapide." }, d: 'B' },
      { t: { en: 'I make the call with the data I have rather than delay further.', ar: 'أتخذ القرار بالبيانات المتوفرة بدل التأجيل أكثر.', fr: "Je tranche avec les données que j'ai plutôt que de retarder encore." }, d: 'W' } ] },
  { s: { en: 'Your agency delivers creative that misses the brand brief badly.', ar: 'تُقدّم الوكالة تصميماً إبداعياً بعيداً كلياً عن ملخص العلامة.', fr: "L'agence livre une création qui manque totalement le brief de marque." }, opts: [
      { t: { en: 'I rewrite the brief with sharper, more specific direction.', ar: 'أُعيد كتابة الملخص بتوجيهات أدق وأكثر تحديداً.', fr: "Je réécris le brief avec des consignes plus précises et spécifiques." }, d: 'F' },
      { t: { en: 'I get on a call with them to understand where the brief was unclear.', ar: 'أتصل بهم لأفهم أين كان الملخص غير واضح.', fr: "Je les appelle pour comprendre où le brief manquait de clarté." }, d: 'B' },
      { t: { en: 'I reject it outright and hold the deadline instead of settling.', ar: 'أرفضه تماماً وأتمسك بالموعد النهائي بدل القبول بأقل مما يجب.', fr: "Je le refuse catégoriquement et je maintiens le délai plutôt que de me contenter de moins." }, d: 'W' } ] },
  { s: { en: 'A congress booth needs a plan with three days notice.', ar: 'جناح في مؤتمر طبي يحتاج خطة خلال ثلاثة أيام فقط.', fr: "Un stand de congrès nécessite un plan avec trois jours de préavis." }, opts: [
      { t: { en: 'I assemble the checklist and vendor list from what worked last time.', ar: 'أُجهّز قائمة المهام والموردين اعتماداً على ما نجح سابقاً.', fr: "J'assemble la checklist et la liste des prestataires à partir de ce qui a marché la dernière fois." }, d: 'F' },
      { t: { en: 'I check who on the team can actually take this on without burning out.', ar: 'أتحقق من قدرة الفريق على تحمل هذا دون إرهاق.', fr: "Je vérifie qui dans l'équipe peut assumer cela sans s'épuiser." }, d: 'B' },
      { t: { en: 'I decide the scope that is achievable and cut the rest without apology.', ar: 'أُحدد النطاق القابل للتحقيق وأُلغي الباقي دون تردد.', fr: "Je décide le périmètre réalisable et je coupe le reste sans hésiter." }, d: 'W' } ] },
  { s: { en: 'Sales leadership blames the brand plan for a soft quarter.', ar: 'تُحمّل قيادة المبيعات خطة العلامة مسؤولية فصل ضعيف.', fr: "La direction commerciale attribue un trimestre faible au plan de marque." }, opts: [
      { t: { en: 'I bring the execution data to show where the plan was and wasn\'t followed.', ar: 'أطرح بيانات التنفيذ لأُظهر أين اتُّبعت الخطة وأين لم تُتّبع.', fr: "J'apporte les données d'exécution pour montrer où le plan a été suivi ou non." }, d: 'F' },
      { t: { en: 'I ask sales leaders directly what is really getting in the way.', ar: 'أسأل قادة المبيعات مباشرة عما يُعيقهم فعلاً.', fr: "Je demande directement aux responsables commerciaux ce qui fait réellement obstacle." }, d: 'B' },
      { t: { en: 'I own my part of it publicly, then push for what needs to change.', ar: 'أتحمل مسؤوليتي علناً، ثم أُطالب بما يجب أن يتغير.', fr: "J'assume publiquement ma part de responsabilité, puis je réclame ce qui doit changer." }, d: 'W' } ] },
  { s: { en: 'A brand plan you are proud of gets quietly deprioritized.', ar: 'تُهمَّش بهدوء خطة علامة كنت فخوراً بها.', fr: "Un plan de marque dont vous étiez fier est discrètement déprioritisé." }, opts: [
      { t: { en: 'I ask for the specific data or reasoning behind the decision.', ar: 'أطلب البيانات أو المنطق المحدد وراء القرار.', fr: "Je demande les données ou le raisonnement précis derrière la décision." }, d: 'F' },
      { t: { en: 'I talk to my manager about how this lands for me, honestly.', ar: 'أتحدث مع مديري بصدق عن تأثير هذا الأمر عليّ.', fr: "Je parle à mon manager, honnêtement, de l'effet que cela a sur moi." }, d: 'B' },
      { t: { en: 'I make peace with it and redirect my energy to what matters now.', ar: 'أتصالح مع الأمر وأُعيد توجيه طاقتي إلى ما يهم الآن.', fr: "Je fais la paix avec la situation et je redirige mon énergie vers ce qui compte maintenant." }, d: 'W' } ] },
  { s: { en: 'You must choose between two KOL partners with limited budget for both.', ar: 'عليك الاختيار بين شريكين من قادة الرأي الطبي والميزانية لا تكفي لكليهما.', fr: "Vous devez choisir entre deux partenaires leaders d'opinion, le budget ne couvrant pas les deux." }, opts: [
      { t: { en: "I score both against clear, pre-set criteria before deciding.", ar: 'أُقيّم كليهما وفق معايير واضحة مُحددة مسبقاً قبل القرار.', fr: "J'évalue les deux selon des critères clairs et préétablis avant de trancher." }, d: 'F' },
      { t: { en: 'I consider which relationship has been most genuine over time.', ar: 'أعتبر أي علاقة كانت الأصدق على مدى الوقت.', fr: "Je considère quelle relation a été la plus sincère dans la durée." }, d: 'B' },
      { t: { en: 'I make the harder choice and communicate it to both directly, myself.', ar: 'أتخذ الخيار الأصعب وأُبلغهما به مباشرة بنفسي.', fr: "Je fais le choix le plus difficile et je le communique moi-même, directement, aux deux." }, d: 'W' } ] },
  { s: { en: 'You get to reflect on your best launch to date — what made it work?', ar: 'تتأمل في أفضل إطلاق قمت به حتى الآن — ما الذي جعله ناجحاً؟', fr: "Vous repensez à votre meilleur lancement à ce jour — qu'est-ce qui a fait sa réussite ?" }, opts: [
      { t: { en: 'The plan and the message were unusually well-built.', ar: 'كانت الخطة والرسالة مبنيتين بشكل استثنائي.', fr: "Le plan et le message étaient exceptionnellement bien construits." }, d: 'F' },
      { t: { en: 'The trust across medical, sales, and access made it seamless.', ar: 'كانت الثقة بين الأقسام الطبية والمبيعات والوصول هي ما جعله سلساً.', fr: "La confiance entre médical, ventes et accès a rendu tout fluide." }, d: 'B' },
      { t: { en: 'I held a clear conviction on the strategy and did not waver.', ar: 'تمسكت بقناعة واضحة تجاه الاستراتيجية ولم أتراجع عنها.', fr: "J'ai gardé une conviction claire sur la stratégie et je n'ai pas fléchi." }, d: 'W' } ] },
];

export const DRAFT_ROLE_IDS = ['first_line_manager', 'product_manager'];

assertBalancedScenarios(SCENARIOS_FIRST_LINE_MANAGER, 'first_line_manager scenarios');
assertBalancedScenarios(SCENARIOS_PRODUCT_MANAGER, 'product_manager scenarios');

export const SCENARIO_SETS = {
  medical_rep: GENERIC_SCENARIOS,
  first_line_manager: SCENARIOS_FIRST_LINE_MANAGER,
  product_manager: SCENARIOS_PRODUCT_MANAGER,
};

export function getScenariosForRole(roleId) {
  return SCENARIO_SETS[roleId] || GENERIC_SCENARIOS;
}

export function isDraftRole(roleId) {
  return DRAFT_ROLE_IDS.includes(roleId);
}
