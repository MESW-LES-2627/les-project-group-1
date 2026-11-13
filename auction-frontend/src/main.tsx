import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
// import './dashboard/index.css';

import App from './App';

/**
 * Application Entry Point
 * 
 * Mounts the React application to the DOM by creating a root and rendering the App component within a StrictMode wrapper.
 * This help to highlight potential side effects and development issues in the application during development.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
