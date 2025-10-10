// src/pages/Projetos/Projetos.jsx (INTEGRADO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Projetos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

// Componente para o Card de Projeto
const ProjetoCard = ({ projeto }) => {
    // O backend retorna apenas o nome do arquivo, então construímos a URL completa
    const imageUrl = projeto.imagemUrl
        ? `http://localhost:8080/projetos/imagens/${projeto.imagemUrl}`
        : 'https://placehold.co/600x400/161b22/ffffff?text=Projeto';

    return (
        <div className="projeto-card">
            <div className="projeto-imagem" style={{ backgroundImage: `url('${imageUrl}')` }}></div>
            <div className="projeto-conteudo">
                <h3>{projeto.titulo}</h3>
                <p>{projeto.descricao}</p>
                <div className="projeto-membros">
                    {projeto.membros?.slice(0, 5).map(membro => (
                        <img key={membro.usuarioId} className="membro-avatar" src={`https://i.pravatar.cc/40?u=${membro.usuarioId}`} title={membro.usuarioNome} alt={membro.usuarioNome} />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Componente para o Modal de Novo Projeto
const NovoProjetoModal = ({ isOpen, onClose, onProjectCreated }) => {
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [foto, setFoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Busca o usuário logado para obter o ID do autor
    useEffect(() => {
        if (isOpen) {
            const fetchCurrentUser = async () => {
                const token = localStorage.getItem('authToken');
                try {
                    const response = await axios.get('http://localhost:8080/usuarios/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setCurrentUser(response.data);
                } catch (error) {
                    console.error("Erro ao buscar usuário atual:", error);
                }
            };
            fetchCurrentUser();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            Swal.fire('Erro', 'Não foi possível identificar o autor. Tente novamente.', 'error');
            return;
        }
        setLoading(true);

        // O backend espera FormData por causa da imagem
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
        formData.append('autorId', currentUser.id);
        // Valores padrão, já que o formulário não tem esses campos
        formData.append('maxMembros', 50);
        formData.append('grupoPrivado', false);
        // Listas vazias, pois não temos seletor de membros no formulário
        formData.append('professorIds', []);
        formData.append('alunoIds', []);

        if (foto) {
            formData.append('foto', foto);
        }

        try {
            const token = localStorage.getItem('authToken');
            await axios.post('http://localhost:8080/projetos', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            Swal.fire('Sucesso!', 'Projeto publicado com sucesso.', 'success');
            onProjectCreated(); // Informa ao componente pai que um projeto foi criado
            onClose(); // Fecha o modal
        } catch (error) {
            console.error("Erro ao criar projeto:", error);
            Swal.fire('Erro', 'Não foi possível publicar o projeto.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay visible" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Cadastrar Novo Projeto</h2>
                    <button className="close-modal-btn" onClick={onClose}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label htmlFor="proj-titulo">Título do Projeto</label>
                            <input type="text" id="proj-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="proj-descricao">Descrição</label>
                            <textarea id="proj-descricao" rows="4" value={descricao} onChange={e => setDescricao(e.target.value)} required></textarea>
                        </div>
                        <div className="form-group">
                            <label htmlFor="proj-foto">Foto de Capa (Opcional)</label>
                            <input type="file" id="proj-foto" accept="image/*" onChange={e => setFoto(e.target.files[0])} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="submit" className="btn-publish" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente Principal da Página
const Projetos = ({ onLogout }) => {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchProjetos = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const response = await axios.get('http://localhost:8080/projetos', {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            setProjetos(response.data);
        } catch (error) {
            console.error("Erro ao buscar projetos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Senai Community | Projetos';
        fetchProjetos();
    }, []);

    const filteredProjetos = useMemo(() => {
        return projetos.filter(proj => 
            proj.titulo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [projetos, searchTerm]);

    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container">
                <Sidebar />
                <main className="main-content">
                    <div className="projetos-header">
                        <div className="header-text">
                            <h1>Explore os Projetos da Comunidade</h1>
                            <p>Inspire-se, colabore e compartilhe suas criações.</p>
                        </div>
                        <button className="btn-new-project" onClick={() => setIsModalOpen(true)}>
                            <FontAwesomeIcon icon={faPlus} /> Publicar Projeto
                        </button>
                    </div>
                    <div className="projetos-filters">
                        <div className="search-projetos">
                            <FontAwesomeIcon icon={faSearch} />
                            <input type="text" placeholder="Buscar por nome..." onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="projetos-grid">
                        {loading ? <p>Carregando projetos...</p> :
                            filteredProjetos.length > 0 ? (
                                filteredProjetos.map(proj => <ProjetoCard key={proj.id} projeto={proj} />)
                            ) : (
                                <p className="empty-state">Nenhum projeto encontrado.</p>
                            )
                        }
                    </div>
                </main>
            </div>
            <NovoProjetoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onProjectCreated={fetchProjetos} />
        </div>
    );
};

export default Projetos;