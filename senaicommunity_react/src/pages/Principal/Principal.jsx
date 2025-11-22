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

    // 1. Adiciona o estado para controlar o menu mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            {/* 2. Passa a função de toggle para o Topbar */}
            <Topbar 
                onLogout={handleLogout} 
                currentUser={currentUser}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* 3. Adiciona o overlay que escurece o fundo (só aparece se o menu estiver aberto) */}
            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            <div className="container">
                {/* 4. Passa o estado 'isOpen' para o Sidebar */}
                <Sidebar 
                    currentUser={currentUser} 
                    isOpen={isSidebarOpen} 
                />
                <MainContent currentUser={currentUser} />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Principal;