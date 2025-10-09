// CONTEÚDO COMPLETO E FINAL para src/components/Layout/Topbar.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Todos os ícones necessários
import { faHome, faCommentDots, faBell, faMoon, faSun, faSearch, faChevronDown, faUser, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './Topbar.css'; // IMPORTAÇÃO DO CSS DO TOPBAR

const Topbar = ({ onLogout }) => {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const currentUser = { name: "Vinicius G.", avatar: "/img/perfil.png" };

    return (
        <header className="topbar">
            <div className="header-left">
                {/* ✅ Ícone de alternar tema MOVIDO PARA AQUI */}
                <div className="nav-icon theme-toggle" title="Alternar tema" onClick={toggleTheme}>
                    <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
                </div>
                {/* Logo com cores SENAI (vermelho) e Community (azul) */}
                <h1 className="logo"><span className="highlight">SENAI</span> Community</h1>
            </div>
            {/* Campo de busca */}
            <div className="search">
                <FontAwesomeIcon icon={faSearch} />
                <input type="text" placeholder="Pesquisar..." />
            </div>
            {/* Ícones de navegação (sem o theme-toggle agora) */}
            <nav className="nav-icons">
                <Link to="/principal" className="nav-icon" title="Início"><FontAwesomeIcon icon={faHome} /></Link>
                <Link to="/mensagens" className="nav-icon" title="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span>
                </Link>
                <div className="nav-icon" title="Notificações">
                    <FontAwesomeIcon icon={faBell} />
                    <span className="badge">5</span>
                </div>
                {/* O theme-toggle NÃO ESTÁ MAIS AQUI */}
            </nav>
            {/* Dropdown do usuário */}
            <div className="user-dropdown">
                <div className="user">
                    <div className="profile-pic"><img src={currentUser.avatar} alt="Perfil" /></div>
                    <span>{currentUser.name}</span>
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
                <div className="dropdown-menu">
                    <Link to="/perfil"><FontAwesomeIcon icon={faUser} /> Meu Perfil</Link>
                    <Link to="/configuracoes"><FontAwesomeIcon icon={faCog} /> Configurações</Link>
                    <a href="#" onClick={onLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Sair</a>
                </div>
            </div>
        </header>
    );
};

export default Topbar;