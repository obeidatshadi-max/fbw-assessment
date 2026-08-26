import { useEffect, useState } from 'react';
import RaterScreen from './components/RaterScreen.jsx';
import { RATER_ITEMS } from './data/raterItems.js';
import { scoreRaterResponse } from './lib/raterScoring.js';
import { noopAuthAdapter } from './lib/authAdapter.js';
import { useLanguage } from './i18n/LanguageContext.jsx';

export default function RaterApp({ linkId, authAdapter = noopAuthAdapter }) {
  const { t } = useLanguage();
  const [status, setStatus] = useState('loading');
  const [answers, setAnswers] = useState(() => RATER_ITEMS.map(() => null));
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authAdapter.validateRaterLink({ linkId }).then(result => {
      if (cancelled) return;
      setStatus(result.valid ? 'form' : 'invalid');
    });
    return () => { cancelled = true; };
  }, [authAdapter, linkId]);

  function handleSelect(index, value) {
    setAnswers(prev => prev.map((v, i) => (i === index ? value : v)));
  }

  async function handleSubmit() {
    setStatus('submitting');
    setError(null);
    const scores = scoreRaterResponse(answers, RATER_ITEMS);
    const result = await authAdapter.submitRaterResponse({ linkId, scores });
    if (result.success) {
      setStatus('done');
    } else {
      setStatus('form');
      setError(result.error || t('rate.submitError'));
    }
  }

  return (
    <main>
      <div className="wrap">
        <RaterScreen status={status} answers={answers} onSelect={handleSelect} onSubmit={handleSubmit} error={error} />
      </div>
    </main>
  );
}
