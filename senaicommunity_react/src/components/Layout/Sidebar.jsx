import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, faCommentDots, faUsers, faBriefcase, 
    faCalendarCheck, faUserPlus, faUserFriends 
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';
import StatsCard from '../StatsCard/StatsCard';

const Sidebar = ({ currentUser, isOpen }) => {

    const userImage = currentUser?.urlFotoPerfil
        ? `http://localhost:8080${currentUser.urlFotoPerfil}`
        : "https://via.placeholder.com/80";

    const userTitle = currentUser?.tipoUsuario === 'ALUNO' ? 'Aluno(a)' : 'Professor(a)';

    return (
        <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
            <Link to="/perfil" className="user-info-link">
                <div className="user-info">
                    {/* 1. A div avatar contém APENAS a imagem e o status */}
                    <div className="avatar">
                        <img src={userImage} alt="Perfil" id="sidebar-user-img" />
                        <div className="status online"></div>
                    </div>

                    <h2 id="sidebar-user-name">{currentUser?.nome || 'Usuário'}</h2>
                    <p className="user-title" id="sidebar-user-title">{userTitle}</p>

                    {/* 2. O StatsCard entra AQUI, substituindo a antiga div 'user-stats' */}
                    {currentUser && (
                        <div className="sidebar-stats-wrapper">
                            <StatsCard userId={currentUser.id} />
                        </div>
                    )}
                </div>
            </Link>

            <nav className="menu">
                <Link to="/principal"><FontAwesomeIcon icon={faHome} /> Feed</Link>
                <Link to="/mensagens"><FontAwesomeIcon icon={faCommentDots} /> Mensagens <span className="badge">3</span></Link>
                <Link to="/projetos"><FontAwesomeIcon icon={faUsers} /> Projetos</Link>
                <Link to="/vagas"><FontAwesomeIcon icon={faBriefcase} /> Vagas</Link>
                <Link to="/eventos"><FontAwesomeIcon icon={faCalendarCheck} /> Eventos</Link>
                <Link to="/encontrar-pessoas"><FontAwesomeIcon icon={faUserPlus} /> Encontrar Pessoas</Link>
                <Link to="/conexoes"><FontAwesomeIcon icon={faUserFriends} /> Minhas Conexões</Link>
            </nav>
        </aside>
    );
};

export default Sidebar;