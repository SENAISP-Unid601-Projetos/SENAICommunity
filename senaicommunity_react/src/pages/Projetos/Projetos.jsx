// src/pages/Projetos/Projetos.jsx (NOVO DESIGN - CORRIGIDO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; // Importado para layout consistente
import './Projetos.css'; // Carrega o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ CORREÇÃO AQUI: Removido 'faUsers' que não estava sendo usado.
import { faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE ProjetoCard MELHORADO ---
const ProjetoCard = ({ projeto }) => {
    // ✅ INTEGRAÇÃO: Constrói a URL completa da imagem do projeto
    const imageUrl = projeto.imagemUrl
        ? `http://localhost:8080/projetos/imagens/${projeto.imagemUrl}`
        // Placeholder mais escuro para combinar com o tema
        : 'https://placehold.co/600x400/161b22/8b949e?text=Projeto';

    return (
        <article className="projeto-card">
            <div className="projeto-imagem" style={{ backgroundImage: `url('${imageUrl}')` }}></div>
            <div className="projeto-conteudo">
                <h3 className="projeto-titulo">{projeto.titulo}</h3>
                <p className="projeto-descricao">{projeto.descricao}</p>
                <div className="projeto-footer">
                    <div className="projeto-membros">
                        {/* Mostra avatares dos membros (máximo 5) */}
                        {projeto.membros?.slice(0, 5).map(membro => (
                            <img 
                                key={membro.usuarioId} 
                                className="membro-avatar" 
                                // ✅ INTEGRAÇÃO: Usa a URL correta da foto do membro, se disponível
                                src={membro.usuarioFotoUrl ? `http://localhost:8080${membro.usuarioFotoUrl}` : `https://i.pravatar.cc/40?u=${membro.usuarioId}`} 
                                title={membro.usuarioNome} 
                                alt={membro.usuarioNome} 
                            />
                        ))}
                        {/* Mostra quantos membros mais existem */}
                        {projeto.membros?.length > 5 && (
                            <div className="membro-avatar more">+{projeto.membros.length - 5}</div>
                        )}
                    </div>
                    {/* Botão para ver detalhes (funcionalidade futura) */}
                    <button className="ver-projeto-btn">Ver Projeto</button>
                </div>
            </div>
        </article>
    );
};

// --- COMPONENTE MODAL DE NOVO PROJETO (Estilizado) ---
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
                    // Opcional: Fechar modal ou mostrar erro se não conseguir pegar o usuário
                }
            };
            fetchCurrentUser();
            // Reseta os campos ao abrir
            setTitulo('');
            setDescricao('');
            setFoto(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            Swal.fire('Erro', 'Não foi possível identificar o autor. Tente novamente.', 'error');
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
        formData.append('autorId', currentUser.id); 
        formData.append('maxMembros', 50); // Valor padrão
        formData.append('grupoPrivado', false); // Valor padrão
        formData.append('professorIds', JSON.stringify([])); // Envia como string JSON vazia
        formData.append('alunoIds', JSON.stringify([])); // Envia como string JSON vazia

        if (foto) {
            formData.append('foto', foto);
        }

        try {
            const token = localStorage.getItem('authToken');
            await axios.post('http://localhost:8080/projetos', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type' é definido automaticamente pelo browser com FormData
                }
            });

            Swal.fire('Sucesso!', 'Projeto publicado com sucesso.', 'success');
            onProjectCreated(); 
            onClose(); 
        } catch (error) {
            console.error("Erro ao criar projeto:", error);
            Swal.fire('Erro', `Não foi possível publicar o projeto. Detalhe: ${error.response?.data?.message || error.message}`, 'error');
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
                            {foto && <span className="file-name-preview">{foto.name}</span>}
                        </div>
                        {/* Adicionar campos para membros, professores, privacidade se necessário */}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-publish" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar Projeto'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Projetos = ({ onLogout }) => {
    const [projetos, setProjetos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // ✅ INTEGRAÇÃO
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ✅ INTEGRAÇÃO: Função refatorada para buscar usuário e projetos
    const fetchAllData = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const [userRes, projetosRes] = await Promise.all([
                 axios.get('http://localhost:8080/usuarios/me', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 }),
                 axios.get('http://localhost:8080/projetos', {
                     headers: { 'Authorization': `Bearer ${token}` }
                 })
            ]);
            setCurrentUser(userRes.data);
            setProjetos(projetosRes.data);
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
             if (error.response?.status === 401) onLogout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Senai Community | Projetos';
        fetchAllData();
    }, [onLogout]); // Adicionado onLogout como dependência

    // Filtra projetos baseado na busca
    const filteredProjetos = useMemo(() => {
        return projetos.filter(proj => 
            proj.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            proj.descricao.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [projetos, searchTerm]);

    return (
        <div>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    <header className="projetos-header">
                        <div className="header-text">
                            <h1>Explore os Projetos da Comunidade</h1>
                            <p>Inspire-se, colabore e compartilhe suas criações.</p>
                        </div>
                        <button className="btn-new-project" onClick={() => setIsModalOpen(true)}>
                            <FontAwesomeIcon icon={faPlus} /> Publicar Projeto
                        </button>
                    </header>
                    
                    <section className="projetos-filters">
                        <div className="search-projetos">
                            <FontAwesomeIcon icon={faSearch} />
                            <input 
                                type="text" 
                                placeholder="Buscar por nome ou descrição..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        {/* Adicionar mais filtros se necessário (ex: por tecnologia, curso) */}
                    </section>
                    
                    <section className="projetos-grid">
                        {loading ? <p className="loading-state">Carregando projetos...</p> :
                            filteredProjetos.length > 0 ? (
                                filteredProjetos.map(proj => <ProjetoCard key={proj.id} projeto={proj} />)
                            ) : (
                                <div className="empty-state">
                                    <h3>Nenhum projeto encontrado</h3>
                                    <p>Seja o primeiro a publicar ou ajuste sua busca!</p>
                                </div>
                            )
                        }
                    </section>
                </main>
                <RightSidebar /> {/* ✅ DESIGN: Adicionado para layout de 3 colunas */}
            </div>
            <NovoProjetoModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onProjectCreated={fetchAllData} // Recarrega os dados após criar um projeto
            />
        </div>
    );
};

export default Projetos;