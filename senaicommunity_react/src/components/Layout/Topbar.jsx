import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCommentDots, faBell, faMoon, faBars, faSearch, faChevronDown, faUser, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import './Topbar.css';

// Notification Menu Component
const NotificationMenu = () => (
    <div id="notification-menu" className="notification-menu">
        <div className="notification-header"><h4>Notificações</h4></div>
        <div className="notification-section">
            <h5>Solicitações para Seguir</h5>
            <div className="notification-item follow-request">
                <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Avatar"/>
                <div className="notification-text"><p><strong>João Pedro</strong> quer seguir você.</p></div>
                <div className="notification-actions">
                    <button className="btn-accept">✓</button>
                    <button className="btn-decline">×</button>
                </div>
            </div>
        </div>
        <div className="notification-section">
            <h5>Curtidas e Comentários</h5>
            <div className="notification-item">
                <img src="https://randomuser.me/api/portraits/women/33.jpg" alt="Avatar"/>
                <div className="notification-text">
                    <p><strong>Ana Silva</strong> curtiu sua publicação.</p>
                    <span className="notification-time">há 5 minutos</span>
                </div>
            </div>
        </div>
        <div className="notification-footer"><a href="#">Ver todas</a></div>
    </div>
);

const Topbar = ({ onLogout }) => {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    
    // ... (resto do seu componente Topbar)

    return (
        <header className="topbar">
            {/* ... (código do header-left e search) ... */}
            <div className="header-left">
                <div className="menu-toggle"><FontAwesomeIcon icon={faBars} /></div>
                <h1 className="logo"><span className="highlight">SENAI </span>Community</h1>
            </div>
            <div className="search">
                <FontAwesomeIcon icon={faSearch} />
                <input type="text" placeholder="Pesquisar..." />
            </div>
            
            <nav className="nav-icons">
                <Link to="/principal" className="nav-icon" title="Início"><FontAwesomeIcon icon={faHome} /></Link>
                <Link to="/mensagens" className="nav-icon" title="Mensagens">
                    <FontAwesomeIcon icon={faCommentDots} />
                    <span className="badge">3</span>
                </Link>
                <div className="nav-icon" title="Notificações" onClick={() => setNotificationsOpen(!notificationsOpen)}>
                    <FontAwesomeIcon icon={faBell} />
                    <span className="badge">5</span>
                    {notificationsOpen && <NotificationMenu />}
                </div>
                {/* ... (código do theme-toggle e user-dropdown) ... */}
            </nav>

            <div className="user-dropdown">
                {/* ... (código do user-dropdown) ... */}
            </div>
        </header>
    );
};

export default Topbar;