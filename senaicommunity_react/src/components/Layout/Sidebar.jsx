import React from 'react';
import { Link } from 'react-router-dom'; // ✅ CORREÇÃO: Importa o Link
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faCommentDots, faUsers, faBriefcase, faCalendarCheck, faUserPlus, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = ({ currentUser }) => {

    // ✅ MELHORIA: A URL da foto é construída corretamente
    const userImage = currentUser?.urlFotoPerfil 
        ? `http://localhost:8080${currentUser.urlFotoPerfil}` 
        : "https://via.placeholder.com/80";

    const userTitle = currentUser?.tipoUsuario === 'ALUNO' ? 'Aluno(a)' : 'Professor(a)';

    return (
        <aside className="sidebar">
            {/* ✅ CORREÇÃO: O link do perfil agora usa <Link> */}
            <Link to="/perfil" className="user-info-link">
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
            </Link>

            {/* ✅ CORREÇÃO: Todo o menu de navegação foi trocado de <a> para <Link> */}
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