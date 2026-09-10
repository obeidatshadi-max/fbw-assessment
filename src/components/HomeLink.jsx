import { useLanguage } from '../i18n/LanguageContext.jsx';

// A small "back to the assessment" link for standalone routes (manager
// dashboard, rater form, reset-password) that render without the main
// app's sticky topbar/Home button.
export default function HomeLink() {
  const { t } = useLanguage();
  return (
    <div className="home-bar no-print">
      <a href="/">{t('legal.backLink')}</a>
    </div>
  );
}
