import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { WebSocketProvider } from './contexts/WebSocketContext.jsx';

// Importa o arquivo CSS que define as cores e fontes globais (Correto!)
import './styles/global.css';

// Importa o CSS padrão do Vite (Correto!)
import './index.css';

// ✅ CORREÇÃO: Removido o operador '!' para resolver o erro de Unexpected token no Babel/JSX.
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </React.StrictMode>
);