import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // ✅ CORREÇÃO: Importa o Link
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCommentDots, faBell, faMoon, faSun, faChevronDown, faUserEdit, faUserSlash, faSignOutAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Topbar.css';

const Topbar = ({ onLogout, currentUser }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]); 

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };
    
    // ✅ MELHORIA: A URL da foto é construída corretamente
    const userImage = currentUser?.urlFotoPerfil 
        ? `http://localhost:8080${currentUser.urlFotoPerfil}` 
        : "https://via.placeholder.com/40";

    return (
        <header className="topbar">
            <div className="header-left">
                <h1 className="logo"><span className="highlight">SENAI </span>Community</h1>
            </div>

            <div className="search">
                <FontAwesomeIcon icon={faSearch} />
                <input type="text" id="search-input" placeholder="Pesquisar..." />
            </div>

            <nav className="nav-icons">
                {/* ✅ CORREÇÃO: Trocado <a> por <Link> */}
                <Link to="/principal" className="nav-icon" data-tooltip="Início">
                    <FontAwesomeIcon icon={faHome} />
                </Link>
                {/* ✅ CORREÇÃO: Trocado <div> por <Link> para levar às mensagens */}
                <Link to="/mensagens" className="nav-icon" data-tooltip="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span>
                </Link>
                <div className="nav-icon" data-tooltip="Notificações" id="notifications-icon">
                    <FontAwesomeIcon icon={faBell} />
                    {/* Badge de notificações virá de um estado no futuro */}
                </div>

                <div className="theme-toggle" data-tooltip="Alternar tema" onClick={handleThemeToggle}>
                    <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
                </div>
            </nav>

            <div className="user-dropdown">
                <div className="user" onClick={handleToggleMenu}>
                    <div className="profile-pic">
                        <img src={userImage} alt="Perfil" />
                    </div>
                    <span>{currentUser?.nome || 'Usuário'}</span>
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
                
                {isMenuOpen && (
                    <div className="dropdown-menu" style={{ display: 'block' }}>
                        {/* ✅ CORREÇÃO: Trocado <a> por <Link> */}
                        <Link to="/perfil"><FontAwesomeIcon icon={faUserEdit} /> Meu Perfil</Link>
                        <a href="#" className="danger"><FontAwesomeIcon icon={faUserSlash} /> Excluir Conta</a>
                        <a href="#" onClick={onLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Sair</a>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;