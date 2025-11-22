// senaicommunity_react/src/pages/Perfil/EditarPerfilModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './EditarPerfilModal.css';

const EditarPerfilModal = ({ user, onClose, onSave }) => {
    // Estados do formulário
    const [nome, setNome] = useState(user.nome);
    const [bio, setBio] = useState(user.bio || ''); // (|| '') previne erro de 'uncontrolled input'
    
    // --- Lógica da Foto ---

    const getInitialPreview = () => {
        if (!user.urlFotoPerfil) {
            return "https://via.placeholder.com/150";
        }
        if (user.urlFotoPerfil.startsWith('http') || user.urlFotoPerfil.startsWith('blob:')) {
            return user.urlFotoPerfil;
        }
        return `http://localhost:8080${user.urlFotoPerfil}`;
    };

    const [preview, setPreview] = useState(getInitialPreview());
    const [arquivoFoto, setArquivoFoto] = useState(null); // Para guardar o arquivo real
    const fileInputRef = useRef(null); 

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Chamado quando o usuário seleciona um arquivo
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
            setPreview(URL.createObjectURL(file));
            setArquivoFoto(file);
        }
    };

    // Chamado quando o usuário clica no botão "Procurar..."
    const handleProcurarClick = () => {
        fileInputRef.current.click();
    };
    // --- Fim da Lógica da Foto ---

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            nome: nome,
            bio: bio,
            arquivoFoto: arquivoFoto 
        });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Editar Perfil</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="edit-profile-form">
                        
                        {/* --- CAMPO DE FOTO --- */}
                        <div className="form-group">
                            <label>Foto de Perfil</label>
                            <div className="foto-edit-container">
                                <img 
                                    src={preview} 
                                    alt="Pré-visualização" 
                                    className="modal-preview-img" 
                                />
                                <button 
                                    type="button" 
                                    onClick={handleProcurarClick} 
                                    className="btn btn-secondary"
                                >
                                    Procurar...
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }} 
                                    accept="image/png, image/jpeg, image/gif"
                                />
                            </div>
                        </div>
                        {/* --- FIM DO CAMPO DE FOTO --- */}

                        <div className="form-group">
                            <label htmlFor="edit-name">Nome</label>
                            <input
                                type="text"
                                id="edit-name"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="form-control"
                            />
                        </div>
                        
                         <div className="form-group">
                            <label htmlFor="edit-bio">Bio</label>
                            <textarea
                                id="edit-bio"
                                value={bio}
                                // ✅✅✅ ERRO DE DIGITAÇÃO CORRIGIDO AQUI ✅✅✅
                                onChange={(e) => setBio(e.target.value)}
                                className="form-control"
                                rows="3"
                            ></textarea>
                        </div>
                    </form>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button type="submit" form="edit-profile-form" className="btn btn-primary">
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditarPerfilModal;