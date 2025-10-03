import React from 'react'; // Importações mais explícitas
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Importa o arquivo CSS que define as cores e fontes globais
import './styles/global.css'; 

// Importa o CSS padrão do Vite (pode manter)
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);