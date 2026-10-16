import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ApplicationRoot } from './ApplicationRoot';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApplicationRoot />
  </StrictMode>,
);
