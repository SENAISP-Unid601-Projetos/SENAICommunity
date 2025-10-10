import React, { useState, useEffect } from 'react'; // ✅ HOOKS IMPORTADOS
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ ÍCONE 'faSun' ADICIONADO
import { faHome, faCommentDots, faBell, faMoon, faSun, faChevronDown, faUserEdit, faUserSlash, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import './Topbar.css';

const Topbar = ({ onLogout, currentUser }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // ✅ ESTADO PARA CONTROLAR O TEMA ATUAL
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const navigate = useNavigate();

    // ✅ EFEITO QUE RODA UMA VEZ PARA APLICAR O TEMA INICIAL
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // ✅ FUNÇÃO PARA ALTERNAR O TEMA
    const handleThemeToggle = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };
    
    const userImage = currentUser?.urlFotoPerfil || "https://via.placeholder.com/40";

    return (
        <header className="topbar">
            <div className="header-left">
                <h1 className="logo"><span className="highlight">SENAI </span>Community</h1>
            </div>

            <div className="search">
                <i className="fas fa-search"></i>
                <input type="text" id="search-input" placeholder="Pesquisar por autor ou conteúdo..." />
            </div>

            <nav className="nav-icons">
                <a href="/principal" className="nav-icon" data-tooltip="Início">
                    <FontAwesomeIcon icon={faHome} />
                </a>
                <div className="nav-icon" data-tooltip="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span>
                </div>
                <div className="nav-icon" data-tooltip="Notificações">
                    <FontAwesomeIcon icon={faBell} />
                </div>
                {/* ✅ ATUALIZAÇÃO DO ÍCONE DE TEMA */}
                <div className="theme-toggle" data-tooltip="Alternar tema" onClick={handleThemeToggle}>
                    <FontAwesomeIcon icon={theme === 'dark' ? faMoon : faSun} />
                </div>
            </nav>

            <div className="user-dropdown">
                <div className="user" onClick={handleToggleMenu}>
                    <div className="profile-pic">
                        <img src={userImage} alt="Perfil" id="topbar-user-img" />
                    </div>
                    <span id="topbar-user-name">{currentUser?.nome || 'Usuário'}</span>
                    <FontAwesomeIcon icon={faChevronDown} />
                </div>
                
                {isMenuOpen && (
                    <div className="dropdown-menu" style={{ display: 'block' }}>
                        <a href="#"><FontAwesomeIcon icon={faUserEdit} /> Editar Perfil</a>
                        <a href="#" className="danger"><FontAwesomeIcon icon={faUserSlash} /> Excluir Conta</a>
                        <a href="#" onClick={onLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Sair</a>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;