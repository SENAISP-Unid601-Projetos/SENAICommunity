// src/pages/Vagas/Vagas.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Vagas.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faBookmark, faSearch } from '@fortawesome/free-solid-svg-icons';

// Componente para o Card de Vaga (Melhora a organização)
const VagaCard = ({ vaga }) => {
    const tags = [vaga.nivel, vaga.tipoContratacao];

    return (
        <div className="vaga-card">
            <div className="vaga-card-header">
                <div className="vaga-empresa-logo">
                    {/* Lógica para mostrar iniciais caso não tenha logo */}
                    <img src={vaga.logoUrl || `https://placehold.co/100x100/161b22/ffffff?text=${vaga.empresa.substring(0, 2)}`} alt={`Logo da ${vaga.empresa}`} />
                </div>
                <div className="vaga-info-principal">
                    <h2 className="vaga-titulo">{vaga.titulo}</h2>
                    <p className="vaga-empresa">{vaga.empresa}</p>
                    <div className="vaga-localidade">
                        <FontAwesomeIcon icon={faMapMarkerAlt} /> {vaga.localizacao}
                    </div>
                </div>
                <button className="save-vaga-btn" title="Salvar vaga"><FontAwesomeIcon icon={faBookmark} /></button>
            </div>
            <div className="vaga-tags">
                {tags.map((tag, index) => tag && <span key={index} className="tag">{tag}</span>)}
            </div>
            <p className="vaga-descricao">{vaga.descricao}</p>
            <div className="vaga-card-footer">
                <span className="vaga-publicado">Publicado em {new Date(vaga.dataPublicacao).toLocaleDateString('pt-BR')}</span>
                <button className="vaga-candidatar-btn">Ver Detalhes</button>
            </div>
        </div>
    );
};

// Componente Principal da Página
const Vagas = ({ onLogout }) => {
    const [vagas, setVagas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        busca: '',
        tipo: 'todos',
        local: 'todos',
        nivel: 'todos'
    });

    useEffect(() => {
        document.title = 'Senai Community | Vagas';
        const fetchVagas = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('http://localhost:8080/api/vagas', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setVagas(response.data);
            } catch (error) {
                console.error("Erro ao buscar vagas:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchVagas();
    }, []);

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
                vaga.empresa.toLowerCase().includes(searchLower) ||
                vaga.descricao.toLowerCase().includes(searchLower);

            // No backend, os enums estão em maiúsculo (ex: "TEMPO_INTEGRAL")
            const tipoMatch = tipo === 'todos' || vaga.tipoContratacao.replace('_', ' ') === tipo;
            const localMatch = local === 'todos' || vaga.localizacao === local;
            const nivelMatch = nivel === 'todos' || vaga.nivel === nivel;

            return searchMatch && tipoMatch && localMatch && nivelMatch;
        });
    }, [vagas, filters]);

    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container">
                <Sidebar />
                <main className="main-content">
                    <div className="vagas-header">
                        <h1>Encontre sua Próxima Oportunidade</h1>
                        <p>Explore vagas de estágio e emprego em empresas de tecnologia parceiras do SENAI.</p>
                    </div>
                    <div className="filters-container">
                        <div className="search-vaga">
                            <FontAwesomeIcon icon={faSearch} />
                            <input type="text" name="busca" placeholder="Cargo, empresa ou palavra-chave" onChange={handleFilterChange} />
                        </div>
                        <div className="filters">
                            <select name="tipo" onChange={handleFilterChange}>
                                <option value="todos">Tipo de Vaga</option>
                                <option value="TEMPO INTEGRAL">Tempo Integral</option>
                                <option value="MEIO PERIODO">Meio Período</option>
                                <option value="ESTAGIO">Estágio</option>
                                <option value="TRAINEE">Trainee</option>
                            </select>
                            <select name="local" onChange={handleFilterChange}>
                                <option value="todos">Localização</option>
                                <option value="REMOTO">Remoto</option>
                                <option value="HIBRIDO">Híbrido</option>
                                <option value="PRESENCIAL">Presencial</option>
                            </select>
                            <select name="nivel" onChange={handleFilterChange}>
                                <option value="todos">Nível</option>
                                <option value="JUNIOR">Júnior</option>
                                <option value="PLENO">Pleno</option>
                                <option value="SENIOR">Sênior</option>
                            </select>
                        </div>
                    </div>

                    <div className="vagas-list">
                        {loading ? <p>Carregando vagas...</p> : 
                            filteredVagas.length > 0 ? (
                                filteredVagas.map(vaga => <VagaCard key={vaga.id} vaga={vaga} />)
                            ) : (
                                <p className="sem-vagas">Nenhuma vaga encontrada com os filtros selecionados.</p>
                            )
                        }
                    </div>
                </main>
                <aside className="right-sidebar">
                    {/* Widgets da sidebar direita podem ser adicionados aqui como componentes */}
                </aside>
            </div>
        </div>
    );
};

export default Vagas;