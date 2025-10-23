import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importe as páginas de autenticação
import Login from './pages/Login/Login.jsx';
import Cadastro from './pages/Cadastro/Cadastro.jsx';

// ✅ IMPORTANDO TODAS AS SUAS PÁGINAS NOVAS
import Principal from './pages/Principal/Principal.jsx';
import Perfil from './pages/Perfil/Perfil.jsx';
import Projetos from './pages/Projetos/Projetos.jsx';
import Vagas from './pages/Vagas/Vagas.jsx';
import Eventos from './pages/Eventos/Eventos.jsx';
import Mensagens from './pages/Mensagens/Mensagens.jsx';
import EncontrarPessoas from './pages/EncontrarPessoas/EncontrarPessoas.jsx'; // Usando o componente mais novo
import MinhasConexoes from './pages/MinhasConexoes/MinhasConexoes.jsx'; // Usando o componente mais novo

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    const handleLogin = (newToken) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
    };

    return (
        <Router>
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/cadastro" element={<Cadastro />} />
                
                {/* Rotas Privadas (dentro do PrivateRoute) */}
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
                
                {/* ✅ NOVAS ROTAS ADICIONADAS */}
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
                {/* ✅ FIM DAS NOVAS ROTAS */}

                {/* Rota Padrão: Redireciona para /principal se logado, senão para /login */}
                <Route path="/" element={<Navigate to={token ? "/principal" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;