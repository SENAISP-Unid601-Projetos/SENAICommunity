// src/pages/Vagas/Vagas.jsx (CORRIGIDO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Vagas.css'; // Vamos carregar o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ CORREÇÃO AQUI: Removidos 'faMapMarkerAlt' e 'faBriefcase' que não estavam sendo usados.
import { faBookmark, faSearch, faBuilding, faClock } from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE VagaCard MELHORADO ---
const VagaCard = ({ vaga }) => {
    // Transforma os enums em texto legível
    const nivelMap = {
        'JUNIOR': 'Júnior',
        'PLENO': 'Pleno',
        'SENIOR': 'Sênior'
    };
    const localMap = {
        'REMOTO': 'Remoto',
        'HIBRIDO': 'Híbrido',
        'PRESENCIAL': 'Presencial'
    };
    const tipoMap = {
        'TEMPO_INTEGRAL': 'Tempo Integral',
        'MEIO_PERIODO': 'Meio Período',
        'ESTAGIO': 'Estágio',
        'TRAINEE': 'Trainee'
    };

    const tags = [
        localMap[vaga.localizacao] || vaga.localizacao,
        nivelMap[vaga.nivel] || vaga.nivel,
        tipoMap[vaga.tipoContratacao] || vaga.tipoContratacao
    ];

    // Limita a descrição para um visual limpo
    const shortDesc = vaga.descricao.length > 100 
        ? vaga.descricao.substring(0, 100) + '...' 
        : vaga.descricao;

    return (
        <article className="vaga-card">
            <header className="vaga-card-header">
                <div className="vaga-empresa-logo">
                    <img src={vaga.logoUrl || `https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa.substring(0, 2)}`} alt={`Logo da ${vaga.empresa}`} />
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
                <button className="vaga-candidatar-btn">Ver Detalhes</button>
            </footer>
        </article>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Vagas = ({ onLogout }) => {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // Precisamos do usuário para a sidebar
    const [filters, setFilters] = useState({
        busca: '',
        tipo: 'todos',
        local: 'todos',
        nivel: 'todos'
    });

    // Hook para buscar dados do usuário e das vagas
    useEffect(() => {
        document.title = 'Senai Community | Vagas';
        const token = localStorage.getItem('authToken');
        
        const fetchData = async () => {
            try {
                // Busca usuário e vagas em paralelo
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

    // Filtra as vagas com base no estado dos filtros
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
                                filteredVagas.map(vaga => <VagaCard key={vaga.id} vaga={vaga} />)
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
        </div>
    );
};

export default Vagas;