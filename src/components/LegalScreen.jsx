import { useLanguage } from '../i18n/LanguageContext.jsx';

const CONTACT_EMAIL = 'obeidatshadi@gmail.com';
const LAST_UPDATED = '2026-08-31';

function PrivacyBody({ t, tf }) {
  return (
    <>
      <p className="lead">{t('legal.privacyIntro')}</p>

      <h3>{t('legal.privacyCollectHeading')}</h3>
      <ul className="clean">
        <li>{t('legal.privacyCollect1')}</li>
        <li>{t('legal.privacyCollect2')}</li>
        <li>{t('legal.privacyCollect3')}</li>
        <li>{t('legal.privacyCollect4')}</li>
        <li>{t('legal.privacyCollect5')}</li>
      </ul>

      <h3>{t('legal.privacyNotCollectHeading')}</h3>
      <ul className="clean">
        <li>{t('legal.privacyNotCollect1')}</li>
        <li>{t('legal.privacyNotCollect2')}</li>
      </ul>

      <h3>{t('legal.privacyStorageHeading')}</h3>
      <p>{t('legal.privacyStorageBody')}</p>

      <h3>{t('legal.privacyRightsHeading')}</h3>
      <ul className="clean">
        <li>{t('legal.privacyRights1')}</li>
        <li>{t('legal.privacyRights2')}</li>
        <li>{t('legal.privacyRights3')}</li>
        <li>{t('legal.privacyRights4')}</li>
      </ul>

      <h3>{t('legal.privacyChildrenHeading')}</h3>
      <p>{t('legal.privacyChildrenBody')}</p>

      <h3>{t('legal.privacyChangesHeading')}</h3>
      <p>{t('legal.privacyChangesBody')}</p>

      <h3>{t('legal.privacyContactHeading')}</h3>
      <p>{tf('legal.privacyContactBody', { email: CONTACT_EMAIL })}</p>
    </>
  );
}

function TermsBody({ t, tf }) {
  return (
    <>
      <p className="lead">{t('legal.termsIntro')}</p>

      <h3>{t('legal.termsNatureHeading')}</h3>
      <p>{t('legal.termsNatureBody')}</p>

      <h3>{t('legal.termsUseHeading')}</h3>
      <ul className="clean">
        <li>{t('legal.termsUse1')}</li>
        <li>{t('legal.termsUse2')}</li>
        <li>{t('legal.termsUse3')}</li>
      </ul>

      <h3>{t('legal.termsAccountHeading')}</h3>
      <p>{t('legal.termsAccountBody')}</p>

      <h3>{t('legal.termsAvailabilityHeading')}</h3>
      <p>{t('legal.termsAvailabilityBody')}</p>

      <h3>{t('legal.termsLiabilityHeading')}</h3>
      <p>{t('legal.termsLiabilityBody')}</p>

      <h3>{t('legal.termsChangesHeading')}</h3>
      <p>{t('legal.termsChangesBody')}</p>

      <h3>{t('legal.termsContactHeading')}</h3>
      <p>{tf('legal.termsContactBody', { email: CONTACT_EMAIL })}</p>
    </>
  );
}

// Static, unauthenticated route (see src/main.jsx: /privacy, /terms) — no
// AuthPanel, no data fetch, just the notice text. `page` picks which one.
export default function LegalScreen({ page }) {
  const { t, tf } = useLanguage();
  const isPrivacy = page === 'privacy';

  return (
    <main>
      <div className="wrap">
        <section className="screen active">
          <div className="hero-brand">
            <div className="hero-brand-kicker">{t('brand.kicker')}</div>
            <div className="hero-brand-name">{t('brand.name')}</div>
            <div className="hero-brand-bar" />
          </div>

          <div className="note" style={{ marginBottom: 20 }}>
            {tf('legal.draftNotice', { email: CONTACT_EMAIL })}
          </div>

          <div className="hero">
            <h1>{t(isPrivacy ? 'legal.privacyTitle' : 'legal.termsTitle')}</h1>
            <p className="lead" style={{ marginTop: 4 }}>
              {tf(isPrivacy ? 'legal.privacyUpdated' : 'legal.termsUpdated', { date: LAST_UPDATED })}
            </p>
          </div>

          {isPrivacy ? <PrivacyBody t={t} tf={tf} /> : <TermsBody t={t} tf={tf} />}

          <div className="footer-signature">
            <a href="/">{t('legal.backLink')}</a>
          </div>
        </section>
      </div>
    </main>
  );
}
