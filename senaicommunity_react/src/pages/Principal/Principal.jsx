import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes
import Topbar from '../../components/Layout/Topbar.jsx';
import Sidebar from '../../components/Layout/Sidebar.jsx';
import MainContent from './MainContent.jsx';
import RightSidebar from './RightSidebar.jsx';

// CSS
import './Principal.css';

// ✅ CORREÇÃO AQUI: Recebe 'onLogout' e passa para o Topbar
const Principal = ({ onLogout }) => { 
    const navigate = useNavigate();

    useEffect(() => {
        document.title = 'Senai Community | Principal';
    }, []);

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <div>
            {/* O 'onLogout' recebido aqui é repassado para o Topbar */}
            <Topbar onLogout={handleLogout} /> 
            <div className="container">
                <Sidebar />
                <MainContent />
                <RightSidebar />
            </div>
        </div>
    );
};

export default Principal;