import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importe as novas páginas
import Login from './pages/Login/Login.jsx';
import Cadastro from './pages/Cadastro/Cadastro.jsx';
import Principal from './pages/Principal/Principal.jsx';
import Perfil from './pages/Perfil/Perfil.jsx';
import Amizades from './pages/Amizades/Amizades.jsx';
import BuscarAmigos from './pages/BuscarAmigos/BuscarAmigos.jsx';

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
                    path="/amizades"
                    element={
                        <PrivateRoute>
                            <Amizades onLogout={handleLogout} />
                        </PrivateRoute>
                    } 
                />
                 <Route 
                    path="/buscar-amigos"
                    element={
                        <PrivateRoute>
                            <BuscarAmigos onLogout={handleLogout} />
                        </PrivateRoute>
                    } 
                />

                <Route path="/" element={<Navigate to={token ? "/principal" : "/login"} />} />
            </Routes>
        </Router>
    );
}

export default App;