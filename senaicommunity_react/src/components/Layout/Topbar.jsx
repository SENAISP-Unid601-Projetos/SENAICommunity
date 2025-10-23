// src/components/Layout/Topbar.jsx (COM THEME TOGGLE INTEGRADO)

import React, { useState, useEffect } from 'react'; // Hooks já estavam aqui
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// Ícone do Sol/Lua já está importado de ThemeToggle, mas podemos precisar deles aqui
import { faHome, faCommentDots, faBell, faChevronDown, faUserEdit, faUserSlash, faSignOutAlt, faSearch, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
// ✅ 1. Importa o componente ThemeToggle que criamos
// import ThemeToggle from '../Auth/ThemeToggle'; // Não precisa mais importar separado se a lógica está aqui
import './Topbar.css'; // Carrega o CSS atualizado

const Topbar = ({ onLogout, currentUser }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ✅ 2. Lógica do Tema MOVIDA para cá
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };
    // Fim da lógica do Tema

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const userImage = currentUser?.urlFotoPerfil
        ? `http://localhost:8080${currentUser.urlFotoPerfil}`
        : "https://via.placeholder.com/40";

    return (
        <header className="topbar">
            <div className="header-left">
                {/* Link para a página principal */}
                <Link to="/principal" className="logo-link"> 
                    <h1 className="logo"><span className="highlight">SENAI </span>Community</h1>
                </Link>
            </div>

            <div className="search">
                <FontAwesomeIcon icon={faSearch} />
                <input type="text" id="search-input" placeholder="Pesquisar..." />
            </div>

            <nav className="nav-icons">
                <Link to="/principal" className="nav-icon" data-tooltip="Início">
                    <FontAwesomeIcon icon={faHome} />
                </Link>
                <Link to="/mensagens" className="nav-icon" data-tooltip="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span> {/* Manter ou buscar dinamicamente */}
                </Link>
                <div className="nav-icon" data-tooltip="Notificações" id="notifications-icon">
                    <FontAwesomeIcon icon={faBell} />
                    {/* Badge de notificações */}
                </div>

                {/* ✅ 3. Botão ThemeToggle ADICIONADO AQUI DENTRO */}
                {/* Usamos um 'div' com 'onClick' e estilizamos como os outros nav-icon */}
                <div className="nav-icon theme-toggle-button" data-tooltip="Alternar tema" onClick={handleThemeToggle}>
                    <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
                </div>
            </nav>

            <div className="user-dropdown">
                <div className="user" onClick={handleToggleMenu}>
                    <div className="profile-pic">
                        <img src={userImage} alt="Perfil" />
                    </div>
                    {/* Ocultar nome em telas pequenas se necessário */}
                    <span className="username-display">{currentUser?.nome || 'Usuário'}</span> 
                    <FontAwesomeIcon icon={faChevronDown} className={`dropdown-arrow ${isMenuOpen ? 'open' : ''}`} />
                </div>
                
                {isMenuOpen && (
                    <div className="dropdown-menu show" /* Usar classe 'show' */> 
                        <Link to="/perfil" onClick={() => setIsMenuOpen(false)}><FontAwesomeIcon icon={faUserEdit} /> Meu Perfil</Link>
                        {/* <a href="#" className="danger"><FontAwesomeIcon icon={faUserSlash} /> Excluir Conta</a> */}
                        <a href="#" onClick={() => { onLogout(); setIsMenuOpen(false); }}><FontAwesomeIcon icon={faSignOutAlt} /> Sair</a>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;