// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.

export const SCENARIOS = [
  { s: { en: "A project is falling behind schedule.", ar: "مشروع بدأ يتأخر عن الجدول الزمني." }, opts: [
      { t: { en: "I fix the plan and processes to get back on track.", ar: "أصلح الخطة والإجراءات للعودة إلى المسار الصحيح." }, d: "F" },
      { t: { en: "I check how the team feels and rebuild their energy.", ar: "أتحقق من شعور الفريق وأعيد بناء طاقتهم." }, d: "B" },
      { t: { en: "I recommit everyone to the goal and push forward.", ar: "أُعيد التزام الجميع بالهدف وأدفع قدماً." }, d: "W" } ] },
  { s: { en: "You receive hard feedback about yourself.", ar: "تتلقى ملاحظات صعبة عن نفسك." }, opts: [
      { t: { en: "I reflect on what it says about who I am.", ar: "أتأمل فيما تقوله هذه الملاحظات عن هويتي." }, d: "B" },
      { t: { en: "I decide what to change and act on it.", ar: "أقرر ما يجب تغييره وأتصرف بناءً عليه." }, d: "W" },
      { t: { en: "I study which skills I need to improve.", ar: "أدرس المهارات التي أحتاج إلى تحسينها." }, d: "F" } ] },
  { s: { en: "A risky new opportunity appears.", ar: "تظهر فرصة جديدة محفوفة بالمخاطر." }, opts: [
      { t: { en: "I feel the pull of the purpose and want to go for it.", ar: "أشعر بجاذبية الهدف وأريد خوض التجربة." }, d: "W" },
      { t: { en: "I check if we truly have the ability to deliver it.", ar: "أتحقق مما إذا كانت لدينا القدرة الحقيقية على تحقيقها." }, d: "F" },
      { t: { en: "I ask if it fits our values and who we want to be.", ar: "أتساءل إن كانت تتوافق مع قيمنا ومن نريد أن نكون." }, d: "B" } ] },
  { s: { en: "There is tension in an important meeting.", ar: "هناك توتر في اجتماع مهم." }, opts: [
      { t: { en: "I stay calm and hold a steady, safe presence.", ar: "أبقى هادئاً وأحافظ على حضور ثابت وآمن." }, d: "B" },
      { t: { en: "I bring structure and facts to solve the problem.", ar: "أُدخل التنظيم والحقائق لحل المشكلة." }, d: "F" },
      { t: { en: "I name the hard truth, even if it is uncomfortable.", ar: "أُسمّي الحقيقة الصعبة، حتى لو كانت مزعجة." }, d: "W" } ] },
  { s: { en: "You have some free time at work.", ar: "لديك بعض الوقت الحر في العمل." }, opts: [
      { t: { en: "I improve a system or learn a new skill.", ar: "أُحسّن نظاماً أو أتعلم مهارة جديدة." }, d: "F" },
      { t: { en: "I connect with people and check in with them.", ar: "أتواصل مع الناس وأطمئن عليهم." }, d: "B" },
      { t: { en: "I think about the bigger direction and what matters.", ar: "أفكر في الاتجاه الأكبر وما يهم فعلاً." }, d: "W" } ] },
  { s: { en: "A team member keeps underperforming.", ar: "أحد أعضاء الفريق يستمر في ضعف الأداء." }, opts: [
      { t: { en: "I make the tough call about their role if needed.", ar: "أتخذ القرار الصعب بشأن دوره إن لزم الأمر." }, d: "W" },
      { t: { en: "I coach them on the exact skills they are missing.", ar: "أُدرّبه على المهارات الدقيقة التي ينقصها." }, d: "F" },
      { t: { en: "I try to understand what is happening for them.", ar: "أحاول أن أفهم ما الذي يمر به." }, d: "B" } ] },
  { s: { en: "Your organization faces a big change.", ar: "تواجه مؤسستك تغييراً كبيراً." }, opts: [
      { t: { en: "I help people feel secure during the change.", ar: "أساعد الناس على الشعور بالأمان خلال التغيير." }, d: "B" },
      { t: { en: "I plan the steps and manage the details.", ar: "أخطط للخطوات وأدير التفاصيل." }, d: "F" },
      { t: { en: "I hold the vision and keep everyone moving to it.", ar: "أتمسك بالرؤية وأُبقي الجميع يتحرك نحوها." }, d: "W" } ] },
  { s: { en: "You feel stressed and tired.", ar: "تشعر بالتوتر والإرهاق." }, opts: [
      { t: { en: "I remind myself why this matters and keep going.", ar: "أُذكّر نفسي بأهمية الأمر وأستمر." }, d: "W" },
      { t: { en: "I pause to reconnect with myself and recharge.", ar: "أتوقف لأعيد الاتصال بنفسي واستعيد طاقتي." }, d: "B" },
      { t: { en: "I organize my tasks to get back in control.", ar: "أُنظّم مهامي لأستعيد السيطرة." }, d: "F" } ] },
  { s: { en: "Two good options, and no clear answer.", ar: "خياران جيدان، ولا إجابة واضحة." }, opts: [
      { t: { en: "I compare the facts and pick the stronger one.", ar: "أقارن الحقائق وأختار الأقوى." }, d: "F" },
      { t: { en: "I choose the one that feels true to our values.", ar: "أختار ما يتماشى فعلاً مع قيمنا." }, d: "B" },
      { t: { en: "I decide, own it, and move forward.", ar: "أقرر، أتحمل مسؤولية قراري، وأمضي قدماً." }, d: "W" } ] },
  { s: { en: "A colleague breaks an important rule.", ar: "يخالف زميل قاعدة مهمة." }, opts: [
      { t: { en: "I confront the issue directly, whatever the cost.", ar: "أواجه المشكلة مباشرة، مهما كانت التكلفة." }, d: "W" },
      { t: { en: "I point to the process that was broken.", ar: "أُشير إلى الإجراء الذي لم يُتّبع." }, d: "F" },
      { t: { en: "I talk with them honestly, person to person.", ar: "أتحدث معه بصدق، شخصاً لشخص." }, d: "B" } ] },
  { s: { en: "People praise your team's success.", ar: "يُشيد الناس بنجاح فريقك." }, opts: [
      { t: { en: "I credit the trust and relationships we built.", ar: "أعزو الفضل إلى الثقة والعلاقات التي بنيناها." }, d: "B" },
      { t: { en: "I credit our shared purpose and drive.", ar: "أعزو الفضل إلى هدفنا المشترك ودافعنا." }, d: "W" },
      { t: { en: "I credit the strong systems and skills we built.", ar: "أعزو الفضل إلى الأنظمة القوية والمهارات التي بنيناها." }, d: "F" } ] },
  { s: { en: "You are asked to lead something new.", ar: "يُطلب منك قيادة أمر جديد." }, opts: [
      { t: { en: "I first ask if I have the skills to do it well.", ar: "أسأل أولاً إن كانت لدي المهارات لأنجزه جيداً." }, d: "F" },
      { t: { en: "I first ask if it fits who I am.", ar: "أسأل أولاً إن كان يتماشى مع من أنا." }, d: "B" },
      { t: { en: "I first ask if it is worth committing to.", ar: "أسأل أولاً إن كان يستحق الالتزام به." }, d: "W" } ] },
  { s: { en: "A plan fails badly.", ar: "تفشل خطة بشكل ذريع." }, opts: [
      { t: { en: "I take responsibility and choose the next bold step.", ar: "أتحمل المسؤولية وأختار الخطوة الجريئة التالية." }, d: "W" },
      { t: { en: "I review what went wrong and fix the method.", ar: "أُراجع ما حدث خطأ وأُصلح الطريقة." }, d: "F" },
      { t: { en: "I stay grounded and keep the team's spirit up.", ar: "أبقى متزناً وأحافظ على معنويات الفريق." }, d: "B" } ] },
  { s: { en: "Everything is calm and going well.", ar: "كل شيء هادئ ويسير بشكل جيد." }, opts: [
      { t: { en: "I enjoy the connections and the good atmosphere.", ar: "أستمتع بالعلاقات والأجواء الجيدة." }, d: "B" },
      { t: { en: "I set a bigger goal to aim for next.", ar: "أضع هدفاً أكبر أسعى إليه لاحقاً." }, d: "W" },
      { t: { en: "I look for ways to make things run even better.", ar: "أبحث عن طرق لجعل الأمور تسير بشكل أفضل." }, d: "F" } ] },
  { s: { en: "You must make an unpopular decision.", ar: "عليك اتخاذ قرار غير محبوب." }, opts: [
      { t: { en: "I build a clear case with evidence.", ar: "أبني حجة واضحة مدعومة بالأدلة." }, d: "F" },
      { t: { en: "I make the decision and stand behind it.", ar: "أتخذ القرار وأقف خلفه." }, d: "W" },
      { t: { en: "I make sure people feel heard first.", ar: "أتأكد أولاً من أن الناس يشعرون بأنهم مسموعون." }, d: "B" } ] },
];
