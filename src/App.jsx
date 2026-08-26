import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Navbar from './components/Navbar.jsx';
import IntroScreen from './components/IntroScreen.jsx';
import ScenarioScreen from './components/ScenarioScreen.jsx';
import OrgScreen from './components/OrgScreen.jsx';
import ReportScreen from './components/ReportScreen.jsx';
import { ORG_ITEMS } from './data/orgItems.js';
import { DIM } from './data/dimensions.js';
import { DEFAULT_ROLE } from './data/roles.js';
import { getScenariosForRole } from './data/scenarioSets.js';
import { applyChoice } from './lib/answers.js';
import { buildReportData } from './lib/scoring.js';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { useLanguage } from './i18n/LanguageContext.jsx';

export default function App({ authAdapter = noopAuthAdapter }) {
  const { lang, t, tf } = useLanguage();
  const [phase, setPhase] = useState('intro');
  const [role, setRole] = useState(DEFAULT_ROLE);
  const [scenarios, setScenarios] = useState(() => getScenariosForRole(DEFAULT_ROLE));
  const [p1Index, setP1Index] = useState(0);
  const [p1Answers, setP1Answers] = useState(() => scenarios.map(() => ({ most: null, least: null })));
  const [orgAnswers, setOrgAnswers] = useState(() => ORG_ITEMS.map(() => null));
  const [reportData, setReportData] = useState(null);
  const [authState, setAuthState] = useState({ status: 'anon' });

  const doneP1 = p1Answers.filter(a => a.most !== null && a.least !== null).length;
  const doneP2 = orgAnswers.filter(v => v !== null).length;
  const totalSteps = scenarios.length + ORG_ITEMS.length;

  function handleStart(selectedRole) {
    const nextScenarios = getScenariosForRole(selectedRole);
    setRole(selectedRole);
    setScenarios(nextScenarios);
    setP1Answers(nextScenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setPhase('p1');
  }

  function handleChoose(kind, idx) {
    setP1Answers(prev => prev.map((a, i) => (i === p1Index ? applyChoice(a, kind, idx) : a)));
  }

  function handleOrgSelect(itemIndex, value) {
    setOrgAnswers(prev => prev.map((v, i) => (i === itemIndex ? value : v)));
  }

  function handleBack() {
    if (phase === 'p1') {
      if (p1Index > 0) setP1Index(p1Index - 1);
    } else if (phase === 'p2') {
      setPhase('p1');
      setP1Index(scenarios.length - 1);
    }
  }

  function handleNext() {
    if (phase === 'p1') {
      if (p1Index < scenarios.length - 1) {
        setP1Index(p1Index + 1);
      } else {
        setPhase('p2');
      }
    } else if (phase === 'p2') {
      const data = buildReportData(p1Answers, orgAnswers, scenarios, ORG_ITEMS, DIM, lang);
      setReportData(data);
      setPhase('report');
    }
  }

  function handleRestart() {
    setP1Answers(scenarios.map(() => ({ most: null, least: null })));
    setP1Index(0);
    setOrgAnswers(ORG_ITEMS.map(() => null));
    setReportData(null);
    setAuthState({ status: 'anon' });
    setPhase('intro');
  }

  function handlePrint() {
    window.print();
  }

  async function handleSignIn(email) {
    setAuthState({ status: 'sending' });
    const result = await authAdapter.signInWithEmail(email);
    setAuthState(result.success ? { status: 'sent' } : { status: 'error', error: result.error || t('auth.sendError') });
  }

  useEffect(() => {
    const unsubscribe = authAdapter.onAuthStateChange(async (session) => {
      if (session && reportData && authState.status !== 'saved' && authState.status !== 'signedIn') {
        setAuthState({ status: 'signedIn' });
        const result = await authAdapter.saveAssessment({
          p1Answers,
          orgAnswers,
          reportData,
          userId: session.user.id,
        });
        setAuthState(result.success ? { status: 'saved' } : { status: 'error', error: result.error });
      }
    });
    return unsubscribe;
  }, [authAdapter, reportData, authState.status, p1Answers, orgAnswers]);

  const currentAnswer = p1Answers[p1Index];
  const p1Ready = currentAnswer && currentAnswer.most !== null && currentAnswer.least !== null;
  const p2Ready = orgAnswers.every(v => v !== null);

  const stepLabel = useMemo(() => {
    if (phase === 'p1') return tf('header.stepP1', { n: p1Index + 1, total: scenarios.length });
    if (phase === 'p2') return t('header.stepP2');
    return '';
  }, [phase, p1Index, lang]);

  return (
    <>
      <Header stepLabel={stepLabel} done={doneP1 + doneP2} total={totalSteps} final={phase === 'report'} />
      <main>
        <div className="wrap">
          {phase === 'intro' && <IntroScreen onStart={handleStart} />}
          {phase === 'p1' && (
            <ScenarioScreen
              scenario={scenarios[p1Index]}
              index={p1Index}
              total={scenarios.length}
              answer={currentAnswer}
              onChoose={handleChoose}
            />
          )}
          {phase === 'p2' && <OrgScreen items={ORG_ITEMS} answers={orgAnswers} onSelect={handleOrgSelect} />}
          {phase === 'report' && reportData && (
            <ReportScreen
              reportData={reportData}
              dim={DIM}
              authState={authState}
              onRestart={handleRestart}
              onPrint={handlePrint}
              onSignIn={handleSignIn}
            />
          )}
        </div>
      </main>
      <Navbar
        visible={phase === 'p1' || phase === 'p2'}
        canGoBack={phase === 'p2' || (phase === 'p1' && p1Index > 0)}
        canGoNext={phase === 'p1' ? p1Ready : p2Ready}
        nextLabel={phase === 'p1' ? (p1Index === scenarios.length - 1 ? t('nav.continueToWorkplace') : t('nav.next')) : t('nav.seeReport')}
        onBack={handleBack}
        onNext={handleNext}
      />
    </>
  );
}
