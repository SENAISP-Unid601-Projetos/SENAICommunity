import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login/Login.jsx';
import Cadastro from './pages/Cadastro/Cadastro.jsx';
import Home from './pages/Principal/Home.jsx';

// Componente para proteger rotas
const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('authToken');
    return token ? children : <Navigate to="/login" />;
};

function App() {
    const [token, setToken] = useState(localStorage.getItem('authToken'));

    const handleLogin = (newToken) => {
        setToken(newToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        setToken(null);
    };

    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login onLogin={handleLogin} />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route 
                    path="/home" 
                    element={
                        <PrivateRoute>
                            <Home onLogout={handleLogout} />
                        </PrivateRoute>
                    } 
                />
                {/* Se o usuário estiver logado, a rota raiz leva para /home, senão para /login */}
                <Route path="/" element={<Navigate to={token ? "/home" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;