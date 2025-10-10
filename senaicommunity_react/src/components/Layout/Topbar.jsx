import React, { useState, useEffect } from 'react'; // ✅ Hooks do React para estado e efeitos
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ Ícones necessários, incluindo SOL e LUA
import { faHome, faCommentDots, faBell, faMoon, faSun, faChevronDown, faUserEdit, faUserSlash, faSignOutAlt, faSearch } from '@fortawesome/free-solid-svg-icons';
import './Topbar.css';

const Topbar = ({ onLogout, currentUser }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // ✅ Estado para controlar o tema atual, lendo do localStorage ou usando 'dark' como padrão
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

    // ✅ Efeito que aplica o tema na página inteira (no <html>) e salva a escolha
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]); // Roda sempre que o 'theme' mudar

    const handleToggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // ✅ Função que é chamada ao clicar no ícone para trocar o tema
    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };
    
    const userImage = currentUser?.urlFotoPerfil 
        ? `http://localhost:8080${currentUser.urlFotoPerfil}` 
        : "https://via.placeholder.com/40";

    return (
        <header className="topbar">
            {/* ... outras partes do seu header ... */}
            <div className="header-left">
                <h1 className="logo"><span className="highlight">SENAI </span>Community</h1>
            </div>

            <div className="search">
                <FontAwesomeIcon icon={faSearch} />
                <input type="text" id="search-input" placeholder="Pesquisar..." />
            </div>

            <nav className="nav-icons">
                <a href="/principal" className="nav-icon" data-tooltip="Início">
                    <FontAwesomeIcon icon={faHome} />
                </a>
                <div className="nav-icon" data-tooltip="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span>
                </div>
                <div className="nav-icon" data-tooltip="Notificações" id="notifications-icon">
                    <FontAwesomeIcon icon={faBell} />
                    {/* Badge de notificações virá de um estado no futuro */}
                </div>

                {/* ✅ JSX DO BOTÃO QUE CHAMA A FUNÇÃO E MUDA O ÍCONE */}
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
                        <a href="/perfil"><FontAwesomeIcon icon={faUserEdit} /> Meu Perfil</a>
                        <a href="#" className="danger"><FontAwesomeIcon icon={faUserSlash} /> Excluir Conta</a>
                        <a href="#" onClick={onLogout}><FontAwesomeIcon icon={faSignOutAlt} /> Sair</a>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Topbar;