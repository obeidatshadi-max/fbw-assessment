import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import RaterApp from './RaterApp.jsx';
import { supabaseAuthAdapter } from './lib/authAdapter.js';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import './styles/global.css';

const raterMatch = window.location.pathname.match(/^\/rate\/([0-9a-f-]{36})$/i);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      {raterMatch
        ? <RaterApp linkId={raterMatch[1]} authAdapter={supabaseAuthAdapter} />
        : <App authAdapter={supabaseAuthAdapter} />}
    </LanguageProvider>
  </React.StrictMode>
);
