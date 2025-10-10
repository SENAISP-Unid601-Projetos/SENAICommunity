import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCommentDots, faUsers, faBriefcase, faCalendarCheck, faUserPlus, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css'; // Crie este arquivo CSS

const Sidebar = ({ currentUser }) => {


const userImage = currentUser?.urlFotoPerfil 
    ? `http://localhost:8080${currentUser.urlFotoPerfil}` 
    : "https://via.placeholder.com/80";
    const userTitle = currentUser?.tipoUsuario === 'ALUNO' ? 'Aluno(a)' : 'Professor(a)';

    return (
        <aside className="sidebar">
            <a href="#" className="user-info-link">
                <div className="user-info">
                    <div className="avatar">
                        <img src={userImage} alt="Perfil" id="sidebar-user-img" />
                        <div className="status online"></div>
                    </div>
                    <h2 id="sidebar-user-name">{currentUser?.nome || 'Usuário'}</h2>
                    <p className="user-title" id="sidebar-user-title">{userTitle}</p>
                    <div className="user-stats">
                        <div className="stat">
                            <strong id="connections-count">-</strong>
                            <span>Conexões</span>
                        </div>
                        <div className="stat">
                            <strong id="projects-count">-</strong>
                            <span>Projetos</span>
                        </div>
                    </div>
                </div>
            </a>

            <nav className="menu">
                <a href="/principal"><FontAwesomeIcon icon={faHome} /> Feed</a>
                <a href="#"><FontAwesomeIcon icon={faCommentDots} /> Mensagens <span className="badge">3</span></a>
                <a href="#"><FontAwesomeIcon icon={faUsers} /> Projetos</a>
                <a href="#"><FontAwesomeIcon icon={faBriefcase} /> Vagas</a>
                <a href="#"><FontAwesomeIcon icon={faCalendarCheck} /> Eventos</a>
                <a href="#"><FontAwesomeIcon icon={faUserPlus} /> Encontrar Pessoas</a>
                <a href="#"><FontAwesomeIcon icon={faUserFriends} /> Minhas Conexões</a> 
            </nav>
        </aside>
    );
};

export default Sidebar;