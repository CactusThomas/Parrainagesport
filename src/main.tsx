// src/main.tsx
import './global'; // exécute le side-effect qui met window.supabase
// ... le reste inchangé

import './global'; // optionnel debug
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
