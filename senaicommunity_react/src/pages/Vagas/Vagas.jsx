// src/pages/Vagas/Vagas.jsx (COMPLETO E CORRIGIDO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Vagas.css'; // Vamos carregar o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faBookmark, faSearch, faBuilding, faClock, 
    // ✅ CORREÇÃO: Ícones adicionados para o Modal
    faTag, faMapMarkerAlt, faSuitcase, faUserShield, 
    faInfoCircle, faTimes
} from '@fortawesome/free-solid-svg-icons'; // Importei ícones adicionais

// --- COMPONENTE VagaDetalheModal (Agora com todos os ícones definidos) ---
const VagaDetalheModal = ({ vaga, onClose }) => {
    if (!vaga) return null;

    // Transforma os enums em texto legível para o modal
    const nivelMap = { 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };
    const localMap = { 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
    const tipoMap = { 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };
    
    // URL de logo de exemplo (mantenha a lógica de fallback)
    const logoUrl = vaga.logoUrl || `https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa.substring(0, 2)}`;

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
                    
                    {/* Informações Rápidas em Grid */}
                    <div className="detalhe-info-grid">
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faBuilding} />
                            <div>
                                <strong>Empresa</strong>
                                <p>{vaga.empresa}</p>
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faSuitcase} />
                            <div>
                                <strong>Nível / Tipo</strong>
                                <p>{nivelMap[vaga.nivel]} / {tipoMap[vaga.tipoContratacao]}</p>
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <div>
                                <strong>Localização</strong>
                                <p>{localMap[vaga.localizacao]}</p>
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faClock} />
                            <div>
                                <strong>Publicado em</strong>
                                <p>{new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Descrição Completa */}
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faInfoCircle} /> Descrição da Vaga</h3>
                    <p className="vaga-descricao-completa">{vaga.descricao}</p>

                    {/* Autor da Vaga (opcional) */}
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faUserShield} /> Publicado por</h3>
                    <p className="vaga-autor-info">{vaga.autorNome || 'Administrador Senai Community'}</p>

                    {/* Tags */}
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faTag} /> Tags</h3>
                    <div className="vaga-tags-modal">
                        {nivelMap[vaga.nivel] && <span className="tag">{nivelMap[vaga.nivel]}</span>}
                        {localMap[vaga.localizacao] && <span className="tag">{localMap[vaga.localizacao]}</span>}
                        {tipoMap[vaga.tipoContratacao] && <span className="tag">{tipoMap[vaga.tipoContratacao]}</span>}
                    </div>

                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Fechar</button>
                    {/* Botão de candidatar (deve ser um link externo na aplicação real) */}
                    <a href="#" target="_blank" rel="noopener noreferrer" className="btn-publish vaga-candidatar-btn-modal">
                        Candidatar-se
                    </a>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE VagaCard MELHORADO (Adicionado onClick para o modal) ---
const VagaCard = ({ vaga, onVerDetalhes }) => {
    const nivelMap = { 'JUNIOR': 'Júnior', 'PLENO': 'Pleno', 'SENIOR': 'Sênior' };
    const localMap = { 'REMOTO': 'Remoto', 'HIBRIDO': 'Híbrido', 'PRESENCIAL': 'Presencial' };
    const tipoMap = { 'TEMPO_INTEGRAL': 'Tempo Integral', 'MEIO_PERIODO': 'Meio Período', 'ESTAGIO': 'Estágio', 'TRAINEE': 'Trainee' };

    const tags = [
        localMap[vaga.localizacao] || vaga.localizacao,
        nivelMap[vaga.nivel] || vaga.nivel,
        tipoMap[vaga.tipoContratacao] || vaga.tipoContratacao
    ];

    const shortDesc = vaga.descricao.length > 100 
        ? vaga.descricao.substring(0, 100) + '...' 
        : vaga.descricao;

    return (
        <article className="vaga-card">
            <header className="vaga-card-header">
                <div className="vaga-empresa-logo">
                    {/* Logica da URL para logo não está no backend. Usando logo genérico. */}
                    <img src={`https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa.substring(0, 2)}`} alt={`Logo da ${vaga.empresa}`} />
                </div>
                <div className="vaga-info-principal">
                    <h2 className="vaga-titulo">{vaga.titulo}</h2>
                    <p className="vaga-empresa">
                        <FontAwesomeIcon icon={faBuilding} /> {vaga.empresa}
                    </p>
                </div>
                <button className="save-vaga-btn" title="Salvar vaga">
                    <FontAwesomeIcon icon={faBookmark} />
                </button>
            </header>
            
            <p className="vaga-descricao">{shortDesc}</p>

            <div className="vaga-tags">
                {tags.map((tag, index) => tag && <span key={index} className="tag">{tag}</span>)}
            </div>
            
            <footer className="vaga-card-footer">
                <span className="vaga-publicado">
                    <FontAwesomeIcon icon={faClock} /> 
                    {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}
                </span>
                {/* ✅ CHAMADA PARA ABRIR O MODAL */}
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
    // ✅ NOVO ESTADO: Controla o modal de detalhes
    const [vagaSelecionada, setVagaSelecionada] = useState(null); 
    const [filters, setFilters] = useState({
        busca: '',
        tipo: 'todos',
        local: 'todos',
        nivel: 'todos'
    });

    useEffect(() => {
        document.title = 'Senai Community | Vagas';
        const token = localStorage.getItem('authToken');
        
        const fetchData = async () => {
            try {
                const [userRes, vagasRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:8080/api/vagas', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
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

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredVagas = useMemo(() => {
        return vagas.filter(vaga => {
            const { busca, tipo, local, nivel } = filters;
            const searchLower = busca.toLowerCase();

            const searchMatch = !busca ||
                vaga.titulo.toLowerCase().includes(searchLower) ||
                vaga.empresa.toLowerCase().includes(searchLower);
                
            const tipoMatch = tipo === 'todos' || vaga.tipoContratacao === tipo;
            const localMatch = local === 'todos' || vaga.localizacao === local;
            const nivelMatch = nivel === 'todos' || vaga.nivel === nivel;

            return searchMatch && tipoMatch && localMatch && nivelMatch;
        });
    }, [vagas, filters]);

    return (
        <div>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    
                    <header className="vagas-header">
                        <h1>Encontre sua Próxima Oportunidade</h1>
                        <p>Explore vagas de estágio e emprego em empresas de tecnologia parceiras do SENAI.</p>
                    </header>
                    
                    <section className="filters-container">
                        <div className="search-vaga">
                            <FontAwesomeIcon icon={faSearch} />
                            <input 
                                type="text" 
                                name="busca" 
                                placeholder="Cargo, empresa ou palavra-chave" 
                                onChange={handleFilterChange} 
                                value={filters.busca}
                            />
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
                                filteredVagas.map(vaga => 
                                    <VagaCard 
                                        key={vaga.id} 
                                        vaga={vaga} 
                                        onVerDetalhes={setVagaSelecionada} // ✅ PASSA A FUNÇÃO
                                    />
                                )
                            ) : (
                                <div className="sem-vagas">
                                    <h3>Nenhuma vaga encontrada</h3>
                                    <p>Tente ajustar seus filtros para encontrar mais oportunidades.</p>
                                </div>
                            )
                        }
                    </section>
                </main>
            </div>
            {/* ✅ NOVO MODAL DE DETALHES */}
            <VagaDetalheModal
                vaga={vagaSelecionada}
                onClose={() => setVagaSelecionada(null)}
            />
        </div>
    );
};

export default Vagas;