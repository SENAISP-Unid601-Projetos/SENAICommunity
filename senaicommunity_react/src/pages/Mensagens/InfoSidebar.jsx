// src/pages/Mensagens/InfoSidebar.jsx (CORRIGIDO)

import React, { useMemo } from 'react';
import './InfoSidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faUser, faFile, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

const getCorrectUserImageUrl = (url) => {
    const defaultAvatar = 'http://localhost:8080/images/default-avatar.png';
    if (!url) return defaultAvatar;
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
};

const InfoSidebar = ({ conversa, mensagens = [], onClose }) => {
    
    // Filtra apenas mensagens que contêm links de arquivos ou imagens
    const arquivosCompartilhados = useMemo(() => {
        return mensagens.filter(msg => {
            return msg.conteudo.match(/\[(imagem|arquivo|audio)\]\((http[^)]+)\)/);
        }).map(msg => {
            const match = msg.conteudo.match(/\[(imagem|arquivo|audio)\]\((http[^)]+)\)/);
            return {
                id: msg.id,
                tipo: match[1],
                url: match[2],
                nome: match[2].substring(match[2].lastIndexOf('/') + 1),
                data: msg.dataEnvio
            };
        });
    }, [mensagens]);

    const handleSairDoGrupo = () => {
        Swal.fire({
            title: 'Sair do grupo?',
            text: "Você não poderá ver as mensagens antigas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sair'
        }).then((result) => {
            if (result.isConfirmed) {
                // Implementar lógica de sair (geralmente uma chamada API DELETE /membros)
                Swal.fire('Info', 'Funcionalidade em desenvolvimento', 'info');
            }
        });
    };

    return (
        <div className="info-sidebar">
            <div className="info-header">
                <h3>Detalhes</h3>
                <button onClick={onClose} className="close-btn">
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>

            <div className="info-content">
                <div className="info-section">
                    <h4>{conversa.nome}</h4>
                    <p className="info-desc">{conversa.descricao || "Sem descrição"}</p>
                </div>

                {conversa.tipo === 'grupo' && (
                    <div className="info-section">
                        <h5><FontAwesomeIcon icon={faUser} /> Membros ({conversa.membros ? conversa.membros.length : 0})</h5>
                        <ul className="members-list">
                            {conversa.membros && conversa.membros.length > 0 ? (
                                conversa.membros.map(membro => (
                                    <li key={membro.id} className="member-item">
                                        <img 
                                            src={getCorrectUserImageUrl(membro.fotoPerfil)} 
                                            alt={membro.nome} 
                                            className="member-avatar"
                                            onError={(e) => e.target.src = 'http://localhost:8080/images/default-avatar.png'} 
                                        />
                                        <span>{membro.nome}</span>
                                    </li>
                                ))
                            ) : (
                                <p className="empty-text">Nenhum membro encontrado.</p>
                            )}
                        </ul>
                    </div>
                )}

                <div className="info-section">
                    <h5><FontAwesomeIcon icon={faFile} /> Arquivos Compartilhados</h5>
                    <ul className="files-list">
                        {arquivosCompartilhados.length > 0 ? (
                            arquivosCompartilhados.map(arq => (
                                <li key={arq.id} className="file-item">
                                    <a href={arq.url} target="_blank" rel="noopener noreferrer">
                                        <div className="file-icon">
                                            {arq.tipo === 'imagem' ? '🖼️' : arq.tipo === 'audio' ? '🎵' : '📄'}
                                        </div>
                                        <div className="file-info">
                                            <span className="file-name">{arq.nome}</span>
                                            <span className="file-date">{new Date(arq.data).toLocaleDateString()}</span>
                                        </div>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <p className="empty-text">Nenhum arquivo recente.</p>
                        )}
                    </ul>
                </div>
            </div>

            {conversa.tipo === 'grupo' && (
                <div className="info-footer">
                    <button className="leave-group-btn" onClick={handleSairDoGrupo}>
                        <FontAwesomeIcon icon={faSignOutAlt} /> Sair do Grupo
                    </button>
                </div>
            )}
        </div>
    );
};

export default InfoSidebar;