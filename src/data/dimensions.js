// REVIEW: Arabic translations below are a first draft — Shadi is the
// domain/language owner for this framework and should review before ship,
// especially strength/watch/develop copy which drives the report's tone.

export const DIM = {
  F: { key: "F", label: { en: "Function", ar: "الوظيفة" },
      tag: {
        en: "You lead through skill, competence, and getting things done.",
        ar: "تقود من خلال المهارة والكفاءة وإنجاز الأمور.",
      },
      color: "var(--fn)", cls: "pf", band: "bf",
      strength: [
        { en: "You are reliable — people trust you to deliver.", ar: "أنت موثوق — يثق بك الناس لتحقيق النتائج." },
        { en: "You think clearly and solve problems well.", ar: "تفكر بوضوح وتحل المشكلات بكفاءة." },
        { en: "You build systems, order, and high standards.", ar: "تبني أنظمة ونظاماً ومعايير عالية." },
        { en: "You turn ideas into real, finished results.", ar: "تحوّل الأفكار إلى نتائج حقيقية ومكتملة." }],
      watch: [
        { en: "You may focus on the task and forget the people.", ar: "قد تركز على المهمة وتنسى الأشخاص." },
        { en: "You can hold on too tightly and control the details.", ar: "قد تتمسك بالتفاصيل بإحكام مفرط وتحاول التحكم بها." },
        { en: "You may tie your value to your output, and feel empty without it.", ar: "قد تربط قيمتك بإنتاجيتك، وتشعر بالفراغ من دونها." },
        { en: "You can miss the emotional side of a situation.", ar: "قد يفوتك الجانب العاطفي في الموقف." }],
      develop: [
        { en: "Before acting, ask \"who\" is affected, not only \"what\" must be done.", ar: "قبل أن تتصرف، اسأل \"من\" سيتأثر، لا \"ماذا\" يجب فعله فقط." },
        { en: "Trust others to do the work their own way.", ar: "ثِق بالآخرين لينجزوا العمل بطريقتهم الخاصة." },
        { en: "Make time to connect with people and to reflect on purpose.", ar: "خصص وقتاً للتواصل مع الناس والتأمل في الهدف." },
        { en: "Let people see you when you do not have all the answers.", ar: "دع الناس يرونك حين لا تملك كل الإجابات." }] },
  B: { key: "B", label: { en: "Being", ar: "الكينونة" },
      tag: {
        en: "You lead through presence, character, and honest relationships.",
        ar: "تقود من خلال الحضور والشخصية والعلاقات الصادقة.",
      },
      color: "var(--be)", cls: "pb", band: "bb",
      strength: [
        { en: "You build trust and make people feel safe.", ar: "تبني الثقة وتجعل الناس يشعرون بالأمان." },
        { en: "You stay calm and grounded under pressure.", ar: "تبقى هادئاً ومتزناً تحت الضغط." },
        { en: "You know yourself and lead by example.", ar: "تعرف نفسك جيداً وتقود بالقدوة." },
        { en: "People feel seen and respected around you.", ar: "يشعر من حولك بأنهم مرئيون ومحترمون." }],
      watch: [
        { en: "You may avoid the hard action to keep the peace.", ar: "قد تتجنب الإجراء الصعب حفاظاً على السلام." },
        { en: "You can put harmony above needed results.", ar: "قد تُقدّم الانسجام على النتائج المطلوبة." },
        { en: "You may hesitate on tough decisions.", ar: "قد تتردد في اتخاذ القرارات الصعبة." },
        { en: "You can carry other people's stress as your own.", ar: "قد تحمل توتر الآخرين وكأنه توترك أنت." }],
      develop: [
        { en: "Practice saying the hard thing, kindly and clearly.", ar: "تدرّب على قول الأمر الصعب، بلطف ووضوح." },
        { en: "Set clear goals and hold people to them.", ar: "ضع أهدافاً واضحة وحاسِب الناس عليها." },
        { en: "Balance care with accountability — both are respect.", ar: "وازن بين الاهتمام والمساءلة — كلاهما احترام." },
        { en: "Act sooner; not every decision needs full comfort first.", ar: "تصرّف أبكر؛ ليس كل قرار يحتاج إلى راحة تامة أولاً." }] },
  W: { key: "W", label: { en: "Will", ar: "الإرادة" },
      tag: {
        en: "You lead through purpose, drive, and courage.",
        ar: "تقود من خلال الهدف والدافع والشجاعة.",
      },
      color: "var(--wl)", cls: "pw", band: "bw",
      strength: [
        { en: "You give people a clear direction and reason.", ar: "تمنح الناس اتجاهاً وسبباً واضحين." },
        { en: "You keep going through difficulty and setbacks.", ar: "تستمر رغم الصعوبات والانتكاسات." },
        { en: "You have the courage to act and to decide.", ar: "لديك الشجاعة للتصرف واتخاذ القرار." },
        { en: "You move things forward and inspire momentum.", ar: "تدفع الأمور إلى الأمام وتلهم الزخم." }],
      watch: [
        { en: "You may push too hard and wear people out.", ar: "قد تدفع بقوة مفرطة وتُنهك من حولك." },
        { en: "You can overlook people's real limits.", ar: "قد تتجاهل الحدود الحقيقية للآخرين." },
        { en: "You may act before building skill or trust.", ar: "قد تتصرف قبل بناء المهارة أو الثقة." },
        { en: "You risk burning out yourself and others.", ar: "تخاطر بإرهاق نفسك ومن حولك." }],
      develop: [
        { en: "Slow down to build the skills (Function) the goal needs.", ar: "تمهّل لبناء المهارات (الوظيفة) التي يحتاجها الهدف." },
        { en: "Bring people with you (Being), not just ahead of them.", ar: "خذ الناس معك (الكينونة)، لا أن تتقدمهم فقط." },
        { en: "Check that your drive leaves room for others' pace.", ar: "تأكد أن دافعك يترك مجالاً لوتيرة الآخرين." },
        { en: "Rest on purpose — commitment lasts only if you do.", ar: "استرح عن قصد — الالتزام لا يدوم إلا إذا دام صاحبه." }] },
};
