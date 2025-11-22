// src/pages/Mensagens/EditarMensagemModal.jsx
// (CRIE ESTE NOVO ARQUIVO)

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSave } from '@fortawesome/free-solid-svg-icons';
import './EditarMensagemModal.css'; // Importa o CSS que você vai criar abaixo

const EditarMensagemModal = ({ mensagem, onSave, onClose }) => {
    const [editedContent, setEditedContent] = useState(mensagem.conteudo);
    const [isSaving, setIsSaving] = useState(false);

    // Foca o textarea assim que o modal abrir
    useEffect(() => {
        const textarea = document.getElementById('edit-message-textarea');
        if (textarea) {
            textarea.focus();
            textarea.select(); // Seleciona o texto
        }
    }, []);

    const handleSaveClick = async () => {
        if (!editedContent.trim() || editedContent.trim() === mensagem.conteudo) {
            onClose(); // Fecha se não houver mudança
            return;
        }

        setIsSaving(true);
        try {
            // A função 'onSave' é a 'handleSaveEdit' do Mensagens.jsx
            // Ela já faz a chamada via STOMP
            await onSave(mensagem, editedContent.trim());
        } catch (error) {
            console.error("Erro ao salvar no modal:", error);
        } finally {
            setIsSaving(false);
            onClose(); // Fecha o modal
        }
    };

    const handleKeyDown = (e) => {
        // Salva com Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSaveClick();
        }
        // Cancela com Escape
        if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content edit-message-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Editar Mensagem</h2>
                    <button className="close-modal-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="modal-body">
                    <textarea
                        id="edit-message-textarea"
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={5}
                    />
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSaveClick}
                        disabled={isSaving || !editedContent.trim() || editedContent.trim() === mensagem.conteudo}
                    >
                        <FontAwesomeIcon icon={faSave} />
                        {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditarMensagemModal;