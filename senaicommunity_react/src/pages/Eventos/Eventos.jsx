// src/pages/Eventos/Eventos.jsx (NOVO DESIGN)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; // Importado para consistência de layout
import './Eventos.css'; // Carrega o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faClock, faMapMarkerAlt, faArrowRight, faUsers } from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE EventoCard MELHORADO ---
const EventoCard = ({ evento }) => {
    // A data vem do backend como um array (ex: [2025, 10, 17])
    const data = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
    const dia = data.getDate();
    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

    // ✅ INTEGRAÇÃO: Constrói a URL da imagem corretamente
    const imageUrl = evento.imagemCapaUrl 
        ? `http://localhost:8080${evento.imagemCapaUrl}` 
        : 'https://placehold.co/600x400/21262d/8b949e?text=Evento';

    return (
        <article className="evento-card">
            <div className="evento-imagem" style={{ backgroundImage: `url(${imageUrl})` }}>
                <div className="evento-data">
                    <span>{dia}</span>
                    <span>{mes.toUpperCase()}</span>
                </div>
                <div className="evento-categoria">
                    <FontAwesomeIcon icon={faTag} /> {evento.categoria}
                </div>
            </div>
            <div className="evento-conteudo">
                <h2 className="evento-titulo">{evento.nome}</h2>
                <div className="evento-detalhe">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {evento.local} ({evento.formato})
                </div>
                <div className="evento-detalhe">
                    <FontAwesomeIcon icon={faClock} /> {data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </div>
            </div>
            <footer className="evento-footer">
                <span className="evento-confirmados">
                    <FontAwesomeIcon icon={faUsers} /> 32 confirmados
                </span>
                <button className="rsvp-btn">
                    Ver Mais <FontAwesomeIcon icon={faArrowRight} />
                </button>
            </footer>
        </article>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Eventos = ({ onLogout }) => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // ✅ INTEGRAÇÃO
    const [filters, setFilters] = useState({
        periodo: 'proximos',
        formato: 'todos',
        categoria: 'todos'
    });

    // ✅ INTEGRAÇÃO: Busca usuário e eventos
    useEffect(() => {
        document.title = 'Senai Community | Eventos';
        const token = localStorage.getItem('authToken');
        
        const fetchData = async () => {
            try {
                const [userRes, eventosRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    axios.get('http://localhost:8080/api/eventos', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);
                setCurrentUser(userRes.data);
                setEventos(eventosRes.data);
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

    // Lógica de filtro (mantida do seu arquivo original)
    const filteredEventos = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        let filtered = eventos.filter(evento => {
            const eventoDate = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
            const periodoMatch = filters.periodo === 'proximos' ? eventoDate >= hoje : eventoDate < hoje;
            const formatoMatch = filters.formato === 'todos' || evento.formato === filters.formato;
            const categoriaMatch = filters.categoria === 'todos' || evento.categoria === filters.categoria;
            return periodoMatch && formatoMatch && categoriaMatch;
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.data[0], a.data[1] - 1, a.data[2]);
            const dateB = new Date(b.data[0], b.data[1] - 1, b.data[2]);
            return filters.periodo === 'proximos' ? dateA - dateB : dateB - dateA;
        });

        return filtered;
    }, [eventos, filters]);


    return (
        <div>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    <header className="eventos-header">
                        <h1>Conecte-se, Aprenda e Inove</h1>
                        <p>Participe de workshops, palestras e competições para acelerar sua carreira.</p>
                    </header>
                    <section className="filters-container">
                        <select name="periodo" onChange={handleFilterChange} value={filters.periodo}>
                            <option value="proximos">Próximos Eventos</option>
                            <option value="passados">Eventos Passados</option>
                        </select>
                        <select name="formato" onChange={handleFilterChange} value={filters.formato}>
                            <option value="todos">Todos os Formatos</option>
                            <option value="PRESENCIAL">Presencial</option>
                            <option value="ONLINE">Online</option>
                            <option value="HIBRIDO">Híbrido</option>
                        </select>
                        <select name="categoria" onChange={handleFilterChange} value={filters.categoria}>
                            <option value="todos">Todas as Categorias</option>
                            <option value="TECNOLOGIA">Tecnologia</option>
                            <option value="CARREIRA">Carreira</option>
                            <option value="INOVACAO">Inovação</option>
                            <option value="COMPETICAO">Competição</option>
                        </select>
                    </section>
                    <section className="eventos-grid">
                        {loading ? <p className="loading-state">Carregando eventos...</p> : 
                            filteredEventos.length > 0 ? (
                                filteredEventos.map(evento => <EventoCard key={evento.id} evento={evento} />)
                            ) : (
                                <div className="sem-eventos">
                                    <h3>Nenhum evento encontrado</h3>
                                    <p>Tente ajustar seus filtros de busca.</p>
                                </div>
                            )
                        }
                    </section>
                </main>
                <RightSidebar /> {/* ✅ DESIGN: Adicionado para layout de 3 colunas */}
            </div>
        </div>
    );
};

export default Eventos;