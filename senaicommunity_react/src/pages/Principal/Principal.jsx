import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Componentes do Layout
import Topbar from '../../components/Layout/Topbar.jsx';
import Sidebar from '../../components/Layout/Sidebar.jsx';
import MainContent from './MainContent.jsx';
import RightSidebar from './RightSidebar.jsx';

// CSS
import './Principal.css';

const Principal = ({ onLogout }) => { 
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = 'Senai Community | Principal';

        const fetchCurrentUser = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                handleLogout(); // Se não tem token, faz logout
                return;
            }
            
            try {
                // Configura o header do Axios para todas as requisições futuras
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                
                const response = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(response.data);
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
                handleLogout(); // Se o token for inválido, faz logout
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentUser();
    }, []);

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    if (isLoading) {
        return <div>Carregando...</div>; // Ou um componente de spinner/loading
    }

    return (
        <div>
            <Topbar onLogout={handleLogout} currentUser={currentUser} /> 
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <MainContent currentUser={currentUser} />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Principal;