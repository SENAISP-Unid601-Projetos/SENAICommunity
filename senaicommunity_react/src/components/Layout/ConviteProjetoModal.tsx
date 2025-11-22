// src/components/Layout/ConviteProjetoModal.tsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faSpinner, faUserPlus, faEnvelopeOpen } from '@fortawesome/free-solid-svg-icons';
import './ConviteProjetoModal.css'; // O CSS que melhora o design

// --- DEFINIÇÃO DE TIPOS CORRIGIDA ---
interface Convite {
    id: any; 
    conviteId: any;
    mensagem: string;
    remetenteNome?: string;
    remetenteFotoUrl?: string; // O backend deve enviar o caminho relativo!
    // ✅ PROPRIEDADES ADICIONADAS PARA RESOLVER OS ERROS:
    tipo?: string; 
    remetenteId?: any; 
}

interface ConviteProjetoModalProps {
    convite: Convite;
    onClose: () => void;
    onAccept: (conviteId: any) => Promise<void>; 
    onDecline: (conviteId: any) => Promise<void>; 
}
// --- FIM DA CORREÇÃO DE TIPOS ---

const ConviteProjetoModal: React.FC<ConviteProjetoModalProps> = ({ convite, onClose, onAccept, onDecline }) => {
    const [isLoadingAccept, setIsLoadingAccept] = useState(false);
    const [isLoadingDecline, setIsLoadingDecline] = useState(false);
    const [error, setError] = useState('');
    const [projetoNome, setProjetoNome] = useState('este projeto');

    // Extrai o nome do projeto (para exibir o título grande)
    useEffect(() => {
        const match = convite.mensagem.match(/projeto '(.*?)'/);
        if (match && match[1]) {
            setProjetoNome(match[1]);
        } else if (convite.tipo === 'CONVITE_PROJETO') {
            setProjetoNome("um Projeto");
        }
    }, [convite.mensagem, convite.tipo]);

    // Lógica para obter a URL da foto do remetente
    const fotoRemetenteUrl = convite.remetenteFotoUrl
        ? `http://localhost:8080${convite.remetenteFotoUrl}`
        : `https://i.pravatar.cc/80?u=${convite.remetenteId || 'sistema'}`; // ✅ remetenteId é usado aqui!

    const handleAcceptClick = async () => {
        setIsLoadingAccept(true);
        setError('');
        try {
            await onAccept(convite.conviteId); 
        } catch (err: any) {
            console.error("Erro ao aceitar convite (Modal):", err);
            const errorMsg = err.response?.data?.message || 'Não foi possível aceitar o convite. Projeto cheio?';
            Swal.fire('Erro', errorMsg, 'error');
            setIsLoadingAccept(false);
        }
    };

    const handleDeclineClick = async () => {
        setIsLoadingDecline(true);
        setError('');
        try {
            await onDecline(convite.conviteId);
        } catch (err: any) {
            console.error("Erro ao recusar convite (Modal):", err);
            const errorMsg = err.response?.data?.message || 'Não foi possível recusar o convite.';
            Swal.fire('Erro', errorMsg, 'error');
            setIsLoadingDecline(false);
        }
    };

    return (
        <div className="modal-overlay convite-modal-overlay visible" onClick={onClose}>
            <div className="convite-modal-content" onClick={e => e.stopPropagation()}>
                
                <button className="convite-modal-close-btn" onClick={onClose} aria-label="Fechar modal">
                    <FontAwesomeIcon icon={faTimes} />
                </button>

                <div className="convite-modal-header">
                    <img 
                        src={fotoRemetenteUrl} 
                        alt={`Foto de ${convite.remetenteNome || 'Usuário'}`} 
                        className="convite-remetente-foto"
                    />
                    <h2 className="convite-title">
                        {convite.remetenteNome ? (
                            <>
                                <span className="highlight-text">{convite.remetenteNome}</span> convidou você!
                            </>
                        ) : (
                             <>
                                <span className="highlight-text">Convite Recebido</span>
                            </>
                        )}
                    </h2>
                </div>

                <div className="convite-modal-body">
                    <div className="icon-container">
                        <FontAwesomeIcon icon={faEnvelopeOpen} />
                    </div>
                    <p>
                        Você foi convidado(a) para fazer parte do projeto:
                    </p>
                    <h3 className="convite-projeto-nome">
                         {projetoNome}
                    </h3>
                    
                    {error && <p className="convite-error">{error}</p>}
                </div>

                <div className="convite-modal-actions">
                    <button
                        className="btn-convite btn-recusar"
                        onClick={handleDeclineClick}
                        disabled={isLoadingAccept || isLoadingDecline}
                    >
                        {isLoadingDecline ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTimes} />}
                        Recusar
                    </button>
                    <button
                        className="btn-convite btn-aceitar"
                        onClick={handleAcceptClick}
                        disabled={isLoadingAccept || isLoadingDecline}
                    >
                        {isLoadingAccept ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                        Aceitar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConviteProjetoModal;