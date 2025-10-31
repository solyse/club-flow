import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css';

const root = ReactDOM.createRoot(
  document.getElementById('bcClubFlow') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
