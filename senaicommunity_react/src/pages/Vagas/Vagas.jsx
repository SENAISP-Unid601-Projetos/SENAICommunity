// src/pages/Vagas/Vagas.jsx (COMPLETO COM CRIAÇÃO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Vagas.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBookmark, faSearch, faBuilding, faClock,
    faTag, faMapMarkerAlt, faSuitcase, faUserShield,
    faInfoCircle, faTimes, faPlus // ✅ Adicionado faPlus
} from '@fortawesome/free-solid-svg-icons';
import RightSidebar from '../Principal/RightSidebar';

// --- COMPONENTE VagaDetalheModal (Mantido Original) ---
const VagaDetalheModal = ({ vaga, onClose }) => {
    if (!vaga) return null;

    const nivelMap = { 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };
    const localMap = { 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
    const tipoMap = { 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };

    const logoUrl = vaga.logoUrl || `https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa ? vaga.empresa.substring(0, 2) : 'VG'}`;

    return (
        <div className="modal-overlay visible" onClick={onClose}>
            <div className="modal-content modal-detalhe-vaga" onClick={e => e.stopPropagation()}>
                <div className="modal-header detalhe-header-vaga">
                    <div className="vaga-header-info">
                        <div className="vaga-logo-modal">
                            <img src={logoUrl} alt={`Logo da ${vaga.empresa}`} />
                        </div>
                        <h2>{vaga.titulo}</h2>
                    </div>
                    <button className="close-modal-btn" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                </div>
                <div className="modal-body detalhe-body">
                    <div className="detalhe-info-grid">
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faBuilding} />
                            <div><strong>Empresa</strong><p>{vaga.empresa}</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faSuitcase} />
                            <div><strong>Nível / Tipo</strong><p>{nivelMap[vaga.nivel]} / {tipoMap[vaga.tipoContratacao]}</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <div><strong>Localização</strong><p>{localMap[vaga.localizacao]}</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faClock} />
                            <div><strong>Publicado em</strong><p>{new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}</p></div>
                        </div>
                    </div>
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faInfoCircle} /> Descrição da Vaga</h3>
                    <p className="vaga-descricao-completa">{vaga.descricao}</p>
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faUserShield} /> Publicado por</h3>
                    <p className="vaga-autor-info">{vaga.autorNome || 'Administrador Senai Community'}</p>
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faTag} /> Tags</h3>
                    <div className="vaga-tags-modal">
                        {nivelMap[vaga.nivel] && <span className="tag">{nivelMap[vaga.nivel]}</span>}
                        {localMap[vaga.localizacao] && <span className="tag">{localMap[vaga.localizacao]}</span>}
                        {tipoMap[vaga.tipoContratacao] && <span className="tag">{tipoMap[vaga.tipoContratacao]}</span>}
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Fechar</button>
                    <a href="#" className="btn-publish vaga-candidatar-btn-modal">Candidatar-se</a>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE VagaCard (Mantido Original) ---
const VagaCard = ({ vaga, onVerDetalhes }) => {
    const nivelMap = { 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };
    const localMap = { 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
    const tipoMap = { 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };

    const tags = [
        localMap[vaga.localizacao] || vaga.localizacao,
        nivelMap[vaga.nivel] || vaga.nivel,
        tipoMap[vaga.tipoContratacao] || vaga.tipoContratacao
    ];

    const shortDesc = vaga.descricao && vaga.descricao.length > 100
        ? vaga.descricao.substring(0, 100) + '...'
        : vaga.descricao || '';

    return (
        <article className="vaga-card">
            <header className="vaga-card-header">
                <div className="vaga-empresa-logo">
                    <img src={`https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa ? vaga.empresa.substring(0, 2) : 'VG'}`} alt="Logo" />
                </div>
                <div className="vaga-info-principal">
                    <h2 className="vaga-titulo">{vaga.titulo}</h2>
                    <p className="vaga-empresa"><FontAwesomeIcon icon={faBuilding} /> {vaga.empresa}</p>
                </div>
                <button className="save-vaga-btn" title="Salvar vaga"><FontAwesomeIcon icon={faBookmark} /></button>
            </header>
            <p className="vaga-descricao">{shortDesc}</p>
            <div className="vaga-tags">
                {tags.map((tag, index) => tag && <span key={index} className="tag">{tag}</span>)}
            </div>
            <footer className="vaga-card-footer">
                <span className="vaga-publicado">
                    <FontAwesomeIcon icon={faClock} /> {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}
                </span>
                <button className="vaga-candidatar-btn" onClick={() => onVerDetalhes(vaga)}>Ver Detalhes</button>
            </footer>
        </article>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Vagas = ({ onLogout }) => {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const { stompClient, isConnected } = useWebSocket();
    const [vagaSelecionada, setVagaSelecionada] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    // ✅ NOVOS ESTADOS PARA CRIAÇÃO
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [novaVaga, setNovaVaga] = useState({
        titulo: "",
        descricao: "",
        requisitos: "", // Se seu backend pedir requisitos separados, senão concatena na descrição
        salario: "",
        localizacao: "PRESENCIAL",
        empresa: "",
        nivel: "ESTAGIO",
        tipoContratacao: "ESTAGIO"
    });

    const [filters, setFilters] = useState({
        busca: '', tipo: 'todos', local: 'todos', nivel: 'todos'
    });

    useEffect(() => {
        document.title = 'Senai Community | Vagas';
        const token = localStorage.getItem('authToken');
        const fetchData = async () => {
            try {
                const [userRes, vagasRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me', { headers: { 'Authorization': `Bearer ${token}` } }),
                    axios.get('http://localhost:8080/api/vagas', { headers: { 'Authorization': `Bearer ${token}` } })
                ]);
                setCurrentUser(userRes.data);
                setVagas(vagasRes.data);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                if (error.response?.status === 401) onLogout();
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [onLogout]);

    useEffect(() => {
        if (isConnected && stompClient) {
            const subscription = stompClient.subscribe('/topic/vagas', (message) => {
                const vagaRecebida = JSON.parse(message.body);
                setVagas((prev) => [vagaRecebida, ...prev]);
            });
            return () => subscription.unsubscribe();
        }
    }, [isConnected, stompClient]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // ✅ Lógica do formulário de criação
    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setNovaVaga(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        try {
            await axios.post('http://localhost:8080/api/vagas', novaVaga, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            // Se usar WebSocket, a vaga vem sozinha. Se não, recarregamos ou adicionamos manualmente.
            // Como garantia, vamos buscar de novo ou adicionar se a resposta retornar o objeto
            setShowCreateModal(false);
            setNovaVaga({ titulo: "", descricao: "", requisitos: "", salario: "", localizacao: "PRESENCIAL", empresa: "", nivel: "ESTAGIO", tipoContratacao: "ESTAGIO" });
            
            // Opcional: fetchVagas() novamente se o websocket não pegar instantaneamente
            const res = await axios.get('http://localhost:8080/api/vagas', { headers: { 'Authorization': `Bearer ${token}` } });
            setVagas(res.data);

            alert("Vaga criada com sucesso!");
        } catch (error) {
            console.error("Erro ao criar vaga:", error);
            alert("Erro ao criar vaga.");
        }
    };

    const filteredVagas = useMemo(() => {
        return vagas.filter(vaga => {
            const { busca, tipo, local, nivel } = filters;
            const searchLower = busca.toLowerCase();
            const searchMatch = !busca || vaga.titulo.toLowerCase().includes(searchLower) || vaga.empresa.toLowerCase().includes(searchLower);
            const tipoMatch = tipo === 'todos' || vaga.tipoContratacao === tipo;
            const localMatch = local === 'todos' || vaga.localizacao === local;
            const nivelMatch = nivel === 'todos' || vaga.nivel === nivel;
            return searchMatch && tipoMatch && localMatch && nivelMatch;
        });
    }, [vagas, filters]);

    // ✅ Lógica de Permissão
    const podeCriarVaga = currentUser && (
        ['SUPERVISOR', 'PROFESSOR', 'ADMIN'].includes(currentUser.tipoUsuario) ||
        (currentUser.roles && currentUser.roles.some(r => ['ROLE_SUPERVISOR', 'ROLE_PROFESSOR', 'ROLE_ADMIN'].includes(r.authority || r.nome)))
    );

    return (
        <div>
            <Topbar onLogout={onLogout} currentUser={currentUser} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}/>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

            <div className="container">
                <Sidebar currentUser={currentUser} isOpen={isSidebarOpen}/>
                <main className="main-content">
                    <header className="vagas-header">
                        <div className="header-text">
                            <h1>Encontre sua Próxima Oportunidade</h1>
                            <p>Explore vagas de estágio e emprego em empresas parceiras.</p>
                        </div>
                        {/* ✅ Botão de Criar Vaga */}
                        {podeCriarVaga && (
                            <button className="btn-create-action" onClick={() => setShowCreateModal(true)}>
                                <FontAwesomeIcon icon={faPlus} /> Nova Vaga
                            </button>
                        )}
                    </header>

                    <section className="filters-container">
                        <div className="search-vaga">
                            <FontAwesomeIcon icon={faSearch} />
                            <input type="text" name="busca" placeholder="Cargo, empresa ou palavra-chave" onChange={handleFilterChange} value={filters.busca} />
                        </div>
                        <div className="filters">
                            <select name="tipo" onChange={handleFilterChange} value={filters.tipo}>
                                <option value="todos">Tipo de Vaga</option>
                                <option value="TEMPO_INTEGRAL">Tempo Integral</option>
                                <option value="MEIO_PERIODO">Meio Período</option>
                                <option value="ESTAGIO">Estágio</option>
                                <option value="TRAINEE">Trainee</option>
                            </select>
                            <select name="local" onChange={handleFilterChange} value={filters.local}>
                                <option value="todos">Localização</option>
                                <option value="REMOTO">Remoto</option>
                                <option value="HIBRIDO">Híbrido</option>
                                <option value="PRESENCIAL">Presencial</option>
                            </select>
                            <select name="nivel" onChange={handleFilterChange} value={filters.nivel}>
                                <option value="todos">Nível</option>
                                <option value="JUNIOR">Júnior</option>
                                <option value="PLENO">Pleno</option>
                                <option value="SENIOR">Sênior</option>
                            </select>
                        </div>
                    </section>

                    <section className="vagas-grid">
                        {loading ? <p className="loading-state">Carregando vagas...</p> :
                            filteredVagas.length > 0 ? (
                                filteredVagas.map(vaga => <VagaCard key={vaga.id} vaga={vaga} onVerDetalhes={setVagaSelecionada} />)
                            ) : (
                                <div className="sem-vagas"><h3>Nenhuma vaga encontrada</h3><p>Tente ajustar seus filtros.</p></div>
                            )
                        }
                    </section>
                </main>
                <RightSidebar />
            </div>

            <VagaDetalheModal vaga={vagaSelecionada} onClose={() => setVagaSelecionada(null)} />

            {/* ✅ MODAL DE CRIAÇÃO DE VAGA */}
            {showCreateModal && (
                <div className="modal-overlay visible" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content modal-create-form" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Cadastrar Nova Vaga</h2>
                            <button className="close-modal-btn" onClick={() => setShowCreateModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="create-form-body">
                            <div className="form-group">
                                <label>Título da Vaga</label>
                                <input type="text" name="titulo" value={novaVaga.titulo} onChange={handleCreateInputChange} required placeholder="Ex: Desenvolvedor Java Jr" />
                            </div>
                            <div className="form-group">
                                <label>Empresa</label>
                                <input type="text" name="empresa" value={novaVaga.empresa} onChange={handleCreateInputChange} required placeholder="Nome da empresa contratante" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Nível</label>
                                    <select name="nivel" value={novaVaga.nivel} onChange={handleCreateInputChange}>
                                        <option value="ESTAGIO">Estágio</option>
                                        <option value="JUNIOR">Júnior</option>
                                        <option value="PLENO">Pleno</option>
                                        <option value="SENIOR">Sênior</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Contratação</label>
                                    <select name="tipoContratacao" value={novaVaga.tipoContratacao} onChange={handleCreateInputChange}>
                                        <option value="ESTAGIO">Estágio</option>
                                        <option value="TEMPO_INTEGRAL">CLT / Integral</option>
                                        <option value="MEIO_PERIODO">Meio Período</option>
                                        <option value="TRAINEE">Trainee</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Localização</label>
                                    <select name="localizacao" value={novaVaga.localizacao} onChange={handleCreateInputChange}>
                                        <option value="PRESENCIAL">Presencial</option>
                                        <option value="REMOTO">Remoto</option>
                                        <option value="HIBRIDO">Híbrido</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Salário (Opcional)</label>
                                    <input type="number" name="salario" value={novaVaga.salario} onChange={handleCreateInputChange} placeholder="Ex: 2500" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea name="descricao" value={novaVaga.descricao} onChange={handleCreateInputChange} required rows="4" placeholder="Descreva as atividades..."></textarea>
                            </div>
                             <div className="form-group">
                                <label>Requisitos</label>
                                <textarea name="requisitos" value={novaVaga.requisitos} onChange={handleCreateInputChange} required rows="3" placeholder="Ex: Java, Spring Boot, React..."></textarea>
                            </div>
                            <button type="submit" className="btn-submit-create">Publicar Vaga</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vagas;