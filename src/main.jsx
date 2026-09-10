import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { supabaseAuthAdapter } from './lib/authAdapter.js';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './styles/global.css';

// App (the default "/" route) stays a static import — it's what nearly every
// visitor loads, so it should never wait on a network round-trip. Every
// other route is a small, rarely-hit slice (facilitator/admin/legal/reset)
// that a self-assessment taker never needs — lazy-loading them off the main
// bundle was the fix for Vite's own "chunk > 500kB" build warning, without
// touching App's own load time at all.
const RaterApp = lazy(() => import('./RaterApp.jsx'));
const ManagerApp = lazy(() => import('./ManagerApp.jsx'));
const AdminApp = lazy(() => import('./AdminApp.jsx'));
const ResetPasswordApp = lazy(() => import('./ResetPasswordApp.jsx'));
const LegalScreen = lazy(() => import('./components/LegalScreen.jsx'));

const raterMatch = window.location.pathname.match(/^\/rate\/([0-9a-f-]{36})$/i);
const isManagerRoute = window.location.pathname === '/manager';
const isAdminRoute = window.location.pathname === '/admin';
const isResetPasswordRoute = window.location.pathname === '/reset-password';
const isPrivacyRoute = window.location.pathname === '/privacy';
const isTermsRoute = window.location.pathname === '/terms';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <Suspense fallback={null}>
        {raterMatch
          ? <RaterApp linkId={raterMatch[1]} authAdapter={supabaseAuthAdapter} />
          : isManagerRoute
          ? <ManagerApp authAdapter={supabaseAuthAdapter} />
          : isAdminRoute
          ? <AdminApp authAdapter={supabaseAuthAdapter} />
          : isResetPasswordRoute
          ? <ResetPasswordApp authAdapter={supabaseAuthAdapter} />
          : isPrivacyRoute
          ? <LegalScreen page="privacy" />
          : isTermsRoute
          ? <LegalScreen page="terms" />
          : <App authAdapter={supabaseAuthAdapter} />}
      </Suspense>
    </LanguageProvider>
  </React.StrictMode>
);
