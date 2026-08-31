import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import RaterApp from './RaterApp.jsx';
import ManagerApp from './ManagerApp.jsx';
import ResetPasswordApp from './ResetPasswordApp.jsx';
import LegalScreen from './components/LegalScreen.jsx';
import { supabaseAuthAdapter } from './lib/authAdapter.js';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './styles/global.css';

const raterMatch = window.location.pathname.match(/^\/rate\/([0-9a-f-]{36})$/i);
const isManagerRoute = window.location.pathname === '/manager';
const isResetPasswordRoute = window.location.pathname === '/reset-password';
const isPrivacyRoute = window.location.pathname === '/privacy';
const isTermsRoute = window.location.pathname === '/terms';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      {raterMatch
        ? <RaterApp linkId={raterMatch[1]} authAdapter={supabaseAuthAdapter} />
        : isManagerRoute
        ? <ManagerApp authAdapter={supabaseAuthAdapter} />
        : isResetPasswordRoute
        ? <ResetPasswordApp authAdapter={supabaseAuthAdapter} />
        : isPrivacyRoute
        ? <LegalScreen page="privacy" />
        : isTermsRoute
        ? <LegalScreen page="terms" />
        : <App authAdapter={supabaseAuthAdapter} />}
    </LanguageProvider>
  </React.StrictMode>
);
