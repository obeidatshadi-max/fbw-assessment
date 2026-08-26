import { useLanguage } from '../i18n/LanguageContext.jsx';

export default function Navbar({ visible, canGoBack, canGoNext, nextLabel, onBack, onNext }) {
  const { t } = useLanguage();
  if (!visible) return null;
  return (
    <nav className="navbar no-print">
      <div className="navbar-inner">
        <button
          className="btn ghost back"
          onClick={onBack}
          style={{ visibility: canGoBack ? 'visible' : 'hidden' }}
        >
          {t('nav.back')}
        </button>
        <button className="btn" onClick={onNext} disabled={!canGoNext}>
          {nextLabel}
        </button>
      </div>
    </nav>
  );
}
