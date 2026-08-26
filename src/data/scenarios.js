// REVIEW: Arabic/French translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship.

export const SCENARIOS = [
  { s: { en: "A project is falling behind schedule.", ar: "مشروع بدأ يتأخر عن الجدول الزمني.", fr: "Un projet prend du retard sur le calendrier." }, opts: [
      { t: { en: "I fix the plan and processes to get back on track.", ar: "أصلح الخطة والإجراءات للعودة إلى المسار الصحيح.", fr: "Je corrige le plan et les processus pour revenir sur les rails." }, d: "F" },
      { t: { en: "I check how the team feels and rebuild their energy.", ar: "أتحقق من شعور الفريق وأعيد بناء طاقتهم.", fr: "Je prends la température de l'équipe et je restaure son énergie." }, d: "B" },
      { t: { en: "I recommit everyone to the goal and push forward.", ar: "أُعيد التزام الجميع بالهدف وأدفع قدماً.", fr: "Je remobilise tout le monde autour de l'objectif et je fonce." }, d: "W" } ] },
  { s: { en: "You receive hard feedback about yourself.", ar: "تتلقى ملاحظات صعبة عن نفسك.", fr: "Vous recevez un retour difficile sur vous-même." }, opts: [
      { t: { en: "I reflect on what it says about who I am.", ar: "أتأمل فيما تقوله هذه الملاحظات عن هويتي.", fr: "Je réfléchis à ce que cela dit de qui je suis." }, d: "B" },
      { t: { en: "I decide what to change and act on it.", ar: "أقرر ما يجب تغييره وأتصرف بناءً عليه.", fr: "Je décide ce qu'il faut changer et j'agis." }, d: "W" },
      { t: { en: "I study which skills I need to improve.", ar: "أدرس المهارات التي أحتاج إلى تحسينها.", fr: "J'identifie les compétences que je dois améliorer." }, d: "F" } ] },
  { s: { en: "A risky new opportunity appears.", ar: "تظهر فرصة جديدة محفوفة بالمخاطر.", fr: "Une nouvelle opportunité risquée se présente." }, opts: [
      { t: { en: "I feel the pull of the purpose and want to go for it.", ar: "أشعر بجاذبية الهدف وأريد خوض التجربة.", fr: "Je ressens l'appel du sens et je veux m'y lancer." }, d: "W" },
      { t: { en: "I check if we truly have the ability to deliver it.", ar: "أتحقق مما إذا كانت لدينا القدرة الحقيقية على تحقيقها.", fr: "Je vérifie si nous avons vraiment la capacité de la réaliser." }, d: "F" },
      { t: { en: "I ask if it fits our values and who we want to be.", ar: "أتساءل إن كانت تتوافق مع قيمنا ومن نريد أن نكون.", fr: "Je me demande si cela correspond à nos valeurs et à qui nous voulons être." }, d: "B" } ] },
  { s: { en: "There is tension in an important meeting.", ar: "هناك توتر في اجتماع مهم.", fr: "Il y a de la tension dans une réunion importante." }, opts: [
      { t: { en: "I stay calm and hold a steady, safe presence.", ar: "أبقى هادئاً وأحافظ على حضور ثابت وآمن.", fr: "Je reste calme et je maintiens une présence stable et rassurante." }, d: "B" },
      { t: { en: "I bring structure and facts to solve the problem.", ar: "أُدخل التنظيم والحقائق لحل المشكلة.", fr: "J'apporte structure et faits pour résoudre le problème." }, d: "F" },
      { t: { en: "I name the hard truth, even if it is uncomfortable.", ar: "أُسمّي الحقيقة الصعبة، حتى لو كانت مزعجة.", fr: "Je nomme la vérité difficile, même si elle est inconfortable." }, d: "W" } ] },
  { s: { en: "You have some free time at work.", ar: "لديك بعض الوقت الحر في العمل.", fr: "Vous avez un peu de temps libre au travail." }, opts: [
      { t: { en: "I improve a system or learn a new skill.", ar: "أُحسّن نظاماً أو أتعلم مهارة جديدة.", fr: "J'améliore un système ou j'apprends une nouvelle compétence." }, d: "F" },
      { t: { en: "I connect with people and check in with them.", ar: "أتواصل مع الناس وأطمئن عليهم.", fr: "Je prends contact avec les gens et je prends de leurs nouvelles." }, d: "B" },
      { t: { en: "I think about the bigger direction and what matters.", ar: "أفكر في الاتجاه الأكبر وما يهم فعلاً.", fr: "Je réfléchis à la direction générale et à ce qui compte vraiment." }, d: "W" } ] },
  { s: { en: "A team member keeps underperforming.", ar: "أحد أعضاء الفريق يستمر في ضعف الأداء.", fr: "Un membre de l'équipe continue de sous-performer." }, opts: [
      { t: { en: "I make the tough call about their role if needed.", ar: "أتخذ القرار الصعب بشأن دوره إن لزم الأمر.", fr: "Je prends la décision difficile sur son rôle si nécessaire." }, d: "W" },
      { t: { en: "I coach them on the exact skills they are missing.", ar: "أُدرّبه على المهارات الدقيقة التي ينقصها.", fr: "Je le coache sur les compétences précises qui lui manquent." }, d: "F" },
      { t: { en: "I try to understand what is happening for them.", ar: "أحاول أن أفهم ما الذي يمر به.", fr: "J'essaie de comprendre ce qu'il traverse." }, d: "B" } ] },
  { s: { en: "Your organization faces a big change.", ar: "تواجه مؤسستك تغييراً كبيراً.", fr: "Votre organisation traverse un grand changement." }, opts: [
      { t: { en: "I help people feel secure during the change.", ar: "أساعد الناس على الشعور بالأمان خلال التغيير.", fr: "J'aide les gens à se sentir en sécurité pendant le changement." }, d: "B" },
      { t: { en: "I plan the steps and manage the details.", ar: "أخطط للخطوات وأدير التفاصيل.", fr: "Je planifie les étapes et je gère les détails." }, d: "F" },
      { t: { en: "I hold the vision and keep everyone moving to it.", ar: "أتمسك بالرؤية وأُبقي الجميع يتحرك نحوها.", fr: "Je porte la vision et je garde tout le monde en mouvement vers elle." }, d: "W" } ] },
  { s: { en: "You feel stressed and tired.", ar: "تشعر بالتوتر والإرهاق.", fr: "Vous vous sentez stressé et fatigué." }, opts: [
      { t: { en: "I remind myself why this matters and keep going.", ar: "أُذكّر نفسي بأهمية الأمر وأستمر.", fr: "Je me rappelle pourquoi cela compte et je continue." }, d: "W" },
      { t: { en: "I pause to reconnect with myself and recharge.", ar: "أتوقف لأعيد الاتصال بنفسي واستعيد طاقتي.", fr: "Je fais une pause pour me reconnecter à moi-même et me ressourcer." }, d: "B" },
      { t: { en: "I organize my tasks to get back in control.", ar: "أُنظّم مهامي لأستعيد السيطرة.", fr: "J'organise mes tâches pour reprendre le contrôle." }, d: "F" } ] },
  { s: { en: "Two good options, and no clear answer.", ar: "خياران جيدان، ولا إجابة واضحة.", fr: "Deux bonnes options, et aucune réponse évidente." }, opts: [
      { t: { en: "I compare the facts and pick the stronger one.", ar: "أقارن الحقائق وأختار الأقوى.", fr: "Je compare les faits et je choisis la plus solide." }, d: "F" },
      { t: { en: "I choose the one that feels true to our values.", ar: "أختار ما يتماشى فعلاً مع قيمنا.", fr: "Je choisis celle qui est fidèle à nos valeurs." }, d: "B" },
      { t: { en: "I decide, own it, and move forward.", ar: "أقرر، أتحمل مسؤولية قراري، وأمضي قدماً.", fr: "Je décide, j'assume, et j'avance." }, d: "W" } ] },
  { s: { en: "A colleague breaks an important rule.", ar: "يخالف زميل قاعدة مهمة.", fr: "Un collègue enfreint une règle importante." }, opts: [
      { t: { en: "I confront the issue directly, whatever the cost.", ar: "أواجه المشكلة مباشرة، مهما كانت التكلفة.", fr: "Je confronte le problème directement, quel qu'en soit le coût." }, d: "W" },
      { t: { en: "I point to the process that was broken.", ar: "أُشير إلى الإجراء الذي لم يُتّبع.", fr: "Je pointe le processus qui a été rompu." }, d: "F" },
      { t: { en: "I talk with them honestly, person to person.", ar: "أتحدث معه بصدق، شخصاً لشخص.", fr: "Je lui parle honnêtement, d'une personne à l'autre." }, d: "B" } ] },
  { s: { en: "People praise your team's success.", ar: "يُشيد الناس بنجاح فريقك.", fr: "On félicite le succès de votre équipe." }, opts: [
      { t: { en: "I credit the trust and relationships we built.", ar: "أعزو الفضل إلى الثقة والعلاقات التي بنيناها.", fr: "J'attribue le mérite à la confiance et aux relations que nous avons bâties." }, d: "B" },
      { t: { en: "I credit our shared purpose and drive.", ar: "أعزو الفضل إلى هدفنا المشترك ودافعنا.", fr: "J'attribue le mérite à notre sens partagé et à notre élan." }, d: "W" },
      { t: { en: "I credit the strong systems and skills we built.", ar: "أعزو الفضل إلى الأنظمة القوية والمهارات التي بنيناها.", fr: "J'attribue le mérite aux systèmes solides et aux compétences que nous avons développés." }, d: "F" } ] },
  { s: { en: "You are asked to lead something new.", ar: "يُطلب منك قيادة أمر جديد.", fr: "On vous demande de diriger quelque chose de nouveau." }, opts: [
      { t: { en: "I first ask if I have the skills to do it well.", ar: "أسأل أولاً إن كانت لدي المهارات لأنجزه جيداً.", fr: "Je me demande d'abord si j'ai les compétences pour bien le faire." }, d: "F" },
      { t: { en: "I first ask if it fits who I am.", ar: "أسأل أولاً إن كان يتماشى مع من أنا.", fr: "Je me demande d'abord si cela correspond à qui je suis." }, d: "B" },
      { t: { en: "I first ask if it is worth committing to.", ar: "أسأل أولاً إن كان يستحق الالتزام به.", fr: "Je me demande d'abord si cela vaut la peine de s'y engager." }, d: "W" } ] },
  { s: { en: "A plan fails badly.", ar: "تفشل خطة بشكل ذريع.", fr: "Un plan échoue lourdement." }, opts: [
      { t: { en: "I take responsibility and choose the next bold step.", ar: "أتحمل المسؤولية وأختار الخطوة الجريئة التالية.", fr: "J'assume ma responsabilité et je choisis la prochaine étape audacieuse." }, d: "W" },
      { t: { en: "I review what went wrong and fix the method.", ar: "أُراجع ما حدث خطأ وأُصلح الطريقة.", fr: "Je passe en revue ce qui a mal tourné et je corrige la méthode." }, d: "F" },
      { t: { en: "I stay grounded and keep the team's spirit up.", ar: "أبقى متزناً وأحافظ على معنويات الفريق.", fr: "Je reste ancré et je maintiens le moral de l'équipe." }, d: "B" } ] },
  { s: { en: "Everything is calm and going well.", ar: "كل شيء هادئ ويسير بشكل جيد.", fr: "Tout est calme et se passe bien." }, opts: [
      { t: { en: "I enjoy the connections and the good atmosphere.", ar: "أستمتع بالعلاقات والأجواء الجيدة.", fr: "Je profite des liens et de la bonne ambiance." }, d: "B" },
      { t: { en: "I set a bigger goal to aim for next.", ar: "أضع هدفاً أكبر أسعى إليه لاحقاً.", fr: "Je fixe un objectif plus grand pour la suite." }, d: "W" },
      { t: { en: "I look for ways to make things run even better.", ar: "أبحث عن طرق لجعل الأمور تسير بشكل أفضل.", fr: "Je cherche des moyens de faire encore mieux fonctionner les choses." }, d: "F" } ] },
  { s: { en: "You must make an unpopular decision.", ar: "عليك اتخاذ قرار غير محبوب.", fr: "Vous devez prendre une décision impopulaire." }, opts: [
      { t: { en: "I build a clear case with evidence.", ar: "أبني حجة واضحة مدعومة بالأدلة.", fr: "Je construis un dossier clair et étayé." }, d: "F" },
      { t: { en: "I make the decision and stand behind it.", ar: "أتخذ القرار وأقف خلفه.", fr: "Je prends la décision et je l'assume pleinement." }, d: "W" },
      { t: { en: "I make sure people feel heard first.", ar: "أتأكد أولاً من أن الناس يشعرون بأنهم مسموعون.", fr: "Je m'assure d'abord que chacun se sente entendu." }, d: "B" } ] },
];
