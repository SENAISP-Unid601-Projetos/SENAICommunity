import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useWebSocket } from './contexts/WebSocketContext.jsx';

// Importe as páginas de autenticação
import Login from './pages/Login/Login.jsx';
import Cadastro from './pages/Cadastro/Cadastro.jsx';

// ✅ IMPORTANDO TODAS AS SUAS PÁGINAS
import Principal from './pages/Principal/Principal.jsx';
import Perfil from './pages/Perfil/Perfil.jsx';
import Projetos from './pages/Projetos/Projetos.jsx';
import Vagas from './pages/Vagas/Vagas.jsx';
import Eventos from './pages/Eventos/Eventos.jsx';
import Mensagens from './pages/Mensagens/Mensagens.jsx';
import EncontrarPessoas from './pages/EncontrarPessoas/EncontrarPessoas.jsx';
import MinhasConexoes from './pages/MinhasConexoes/MinhasConexoes.jsx';
import Configuracoes from './pages/Configuracoes/Configuracoes.jsx';

// ✅ 1. ADICIONE A IMPORTAÇÃO DA PÁGINA AMIZADES AQUI
import Amizades from './pages/Amizades/Amizades.jsx'; 

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const { connect, disconnect } = useWebSocket();

    useEffect(() => {
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
            connect(currentToken);
        }
    }, [connect]);

    const handleLogin = (newToken) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        connect(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
        disconnect();
    };

    return (
        <Router>
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/cadastro" element={<Cadastro />} />

                {/* Rotas Privadas */}
                <Route
                    path="/principal"
                    element={
                        <PrivateRoute>
                            <Principal onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/perfil"
                    element={
                        <PrivateRoute>
                            <Perfil onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/perfil/:userId"
                    element={
                        <PrivateRoute>
                            <Perfil onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/projetos"
                    element={
                        <PrivateRoute>
                            <Projetos onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/vagas"
                    element={
                        <PrivateRoute>
                            <Vagas onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/eventos"
                    element={
                        <PrivateRoute>
                            <Eventos onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/mensagens"
                    element={
                        <PrivateRoute>
                            <Mensagens onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/encontrar-pessoas"
                    element={
                        <PrivateRoute>
                            <EncontrarPessoas onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/conexoes"
                    element={
                        <PrivateRoute>
                            <MinhasConexoes onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/configuracoes"
                    element={
                        <PrivateRoute>
                            <Configuracoes onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />

                {/* ✅ 2. ADICIONE A ROTA PARA /amizades AQUI */}
                <Route
                    path="/amizades"
                    element={
                        <PrivateRoute>
                            <Amizades onLogout={handleLogout} />
                        </PrivateRoute>
                    }
                />

                {/* Rota Padrão */}
                <Route path="/" element={<Navigate to={token ? "/principal" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;