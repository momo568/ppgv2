import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import lolBg from './lol-bg.webp';

document.documentElement.style.setProperty('--lol-bg', `url(${lolBg})`);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);