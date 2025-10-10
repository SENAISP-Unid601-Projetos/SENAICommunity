// src/pages/Eventos/Eventos.jsx (CORRIGIDO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Eventos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// ✅ CORREÇÃO APLICADA AQUI: O nome do ícone foi alterado para camelCase.
import { faCalendarPlus, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';

const EventoCard = ({ evento }) => {
    // A data vem do backend como um array (ex: [2025, 10, 17]), então criamos o objeto Date corretamente.
    const data = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
    const dia = data.getDate();
    const mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

    return (
        <div className="evento-card">
            <div className="evento-imagem" style={{ backgroundImage: `url(${evento.imagemCapaUrl || 'https://placehold.co/600x400/161b22/ffffff?text=Evento'})` }}>
                <div className="evento-data">
                    <span>{dia}</span>
                    <span>{mes}</span>
                </div>
            </div>
            <div className="evento-conteudo">
                <span className="evento-categoria">{evento.categoria}</span>
                <h2 className="evento-titulo">{evento.nome}</h2>
                <div className="evento-detalhe">
                    {/* ✅ CORREÇÃO APLICADA AQUI */}
                    <FontAwesomeIcon icon={faClock} /> {data.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </div>
                <div className="evento-detalhe">
                    {/* ✅ CORREÇÃO APLICADA AQUI */}
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {evento.local} ({evento.formato})
                </div>
                <button className="rsvp-btn">
                    <FontAwesomeIcon icon={faCalendarPlus} /> Confirmar Presença
                </button>
            </div>
        </div>
    );
};

const Eventos = ({ onLogout }) => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        periodo: 'proximos',
        formato: 'todos',
        categoria: 'todos'
    });

    useEffect(() => {
        document.title = 'Senai Community | Eventos';
        const fetchEventos = async () => {
            const token = localStorage.getItem('authToken');
            try {
                const response = await axios.get('http://localhost:8080/api/eventos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setEventos(response.data);
            } catch (error) {
                console.error("Erro ao buscar eventos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEventos();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

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

        // Ordena os eventos
        filtered.sort((a, b) => {
            const dateA = new Date(a.data[0], a.data[1] - 1, a.data[2]);
            const dateB = new Date(b.data[0], b.data[1] - 1, b.data[2]);
            return filters.periodo === 'proximos' ? dateA - dateB : dateB - dateA;
        });

        return filtered;
    }, [eventos, filters]);


    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container">
                <Sidebar />
                <main className="main-content">
                    <div className="eventos-header">
                        <h1>Conecte-se, Aprenda e Inove</h1>
                        <p>Participe de workshops, palestras e competições para acelerar sua carreira.</p>
                    </div>
                    <div className="filters-container">
                        <select name="periodo" onChange={handleFilterChange}>
                            <option value="proximos">Próximos Eventos</option>
                            <option value="passados">Eventos Passados</option>
                        </select>
                        <select name="formato" onChange={handleFilterChange}>
                            <option value="todos">Todos os Formatos</option>
                            <option value="PRESENCIAL">Presencial</option>
                            <option value="ONLINE">Online</option>
                            <option value="HIBRIDO">Híbrido</option>
                        </select>
                        <select name="categoria" onChange={handleFilterChange}>
                            <option value="todos">Todas as Categorias</option>
                            <option value="TECNOLOGIA">Tecnologia</option>
                            <option value="CARREIRA">Carreira</option>
                            <option value="INOVACAO">Inovação</option>
                            <option value="COMPETICAO">Competição</option>
                        </select>
                    </div>
                    <div className="eventos-grid">
                        {loading ? <p>Carregando eventos...</p> : 
                            filteredEventos.length > 0 ? (
                                filteredEventos.map(evento => <EventoCard key={evento.id} evento={evento} />)
                            ) : (
                                <p className="sem-eventos">Nenhum evento encontrado para os filtros selecionados.</p>
                            )
                        }
                    </div>
                </main>
                <aside className="right-sidebar">
                    {/* Widgets da sidebar direita podem ser adicionados aqui */}
                </aside>
            </div>
        </div>
    );
};

export default Eventos;