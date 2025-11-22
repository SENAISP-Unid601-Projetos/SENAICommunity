import React from 'react';
import './InfoSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUsers, faFileAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

const InfoSidebar = ({ conversa, onClose }) => {
    const isGrupo = conversa.tipo === 'grupo';

    const renderMembros = () => (
        <div className="sidebar-section">
            <h4><FontAwesomeIcon icon={faUsers} /> Membros do Grupo</h4>
            <ul className="member-list">
                {conversa.membros?.map(membro => (
                    <li key={membro.id} className="member-item">
                        <img
                            src={membro.fotoPerfil || 'http://localhost:8080/images/default-avatar.png'}
                            alt={membro.nome}
                            className="member-avatar"
                        />
                        <span>{membro.nome}</span>
                    </li>
                ))}
            </ul>
        </div>
    );

    const renderArquivos = () => (
        <div className="sidebar-section">
            <h4><FontAwesomeIcon icon={faFileAlt} /> Arquivos Compartilhados</h4>
            <p className="empty-state-sidebar">Nenhum arquivo recente.</p>
            {/* Lógica para listar arquivos viria aqui */}
        </div>
    );

    return (
        <aside className="info-sidebar">
            <header className="info-sidebar-header">
                <h3>Detalhes da Conversa</h3>
                <button onClick={onClose} className="close-sidebar-btn">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </header>
            <div className="info-sidebar-body">
                <div className="convo-details">
                    <img
                        src={conversa.avatar}
                        alt={conversa.nome}
                        className="convo-avatar-large"
                    />
                    <h4>{conversa.nome}</h4>
                    {isGrupo && <p>{conversa.descricao || 'Sem descrição.'}</p>}
                </div>
                {isGrupo && renderMembros()}
                {renderArquivos()}
            </div>
            <footer className="info-sidebar-footer">
                <button className="sidebar-action-btn danger">
                    <FontAwesomeIcon icon={faSignOutAlt} />
                    {isGrupo ? 'Sair do Grupo' : 'Bloquear Contato'}
                </button>
            </footer>
        </aside>
    );
};

export default InfoSidebar;
