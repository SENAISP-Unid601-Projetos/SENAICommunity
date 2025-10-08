import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCommentDots, faUsers, faBriefcase, faCalendarCheck } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    // Estes dados virão da API no futuro
    const currentUser = {
        name: "Vinicius Gallo Santos",
        title: "Estudante de ADS",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        connections: 156,
        projects: 24
    };

    return (
        <aside className="sidebar">
            <div className="user-info">
                <div className="avatar">
                    <img src={currentUser.avatar} alt="Perfil" />
                    <div className="status online"></div>
                </div>
                <h2>{currentUser.name}</h2>
                <p className="user-title">{currentUser.title}</p>
                <div className="user-stats">
                    <div className="stat"><strong>{currentUser.connections}</strong><span>Conexões</span></div>
                    <div className="stat"><strong>{currentUser.projects}</strong><span>Projetos</span></div>
                </div>
            </div>

            <nav className="menu">
                <NavLink to="/principal"><FontAwesomeIcon icon={faHome} /> Feed</NavLink>
                <NavLink to="/mensagens"><FontAwesomeIcon icon={faCommentDots} /> Mensagens <span className="badge">3</span></NavLink>
                <NavLink to="/projetos"><FontAwesomeIcon icon={faUsers} /> Projetos</NavLink>
                <NavLink to="/vagas"><FontAwesomeIcon icon={faBriefcase} /> Vagas</NavLink>
                <NavLink to="/eventos"><FontAwesomeIcon icon={faCalendarCheck} /> Eventos</NavLink>
            </nav>
        </aside>
    );
};

export default Sidebar;