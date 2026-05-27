import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence Firestore connection warning spam which occurs in temporary sandbox environments
const originalError = console.error;
console.error = (...args) => {
  const msg = args.map(arg => {
    try {
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');
  if (msg.includes('@firebase/firestore') || msg.includes('Could not reach Cloud Firestore backend') || msg.includes('unavailable')) {
    // Suppress Firestore connectivity warnings
    return;
  }
  originalError.apply(console, args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args.map(arg => {
    try {
      return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
    } catch {
      return String(arg);
    }
  }).join(' ');
  if (msg.includes('@firebase/firestore') || msg.includes('Could not reach Cloud Firestore backend') || msg.includes('unavailable')) {
    // Suppress Firestore connectivity warnings
    return;
  }
  originalWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

