
// src/pages/Eventos/Eventos.jsx (NOVO DESIGN - Assumindo Subdiretório 'eventoPictures')


import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';

import RightSidebar from '../../pages/Principal/RightSidebar';
import './Eventos.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faClock, faMapMarkerAlt, faArrowRight, faUsers } from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE EventoCard CORRIGIDO (Assumindo Subdiretório) ---

import RightSidebar from '../../pages/Principal/RightSidebar'; // ✅ REVERTIDO (Importado)
import './Eventos.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTag, faClock, faMapMarkerAlt, faArrowRight, faUsers } from '@fortawesome/free-solid-svg-icons';

// ... (código dos componentes EventoCard e Eventos) ...
// (O conteúdo interno dos componentes permanece o mesmo)
// --- COMPONENTE EventoCard MELHORADO ---

const EventoCard = ({ evento }) => {
    // Lógica da data (mantida)
    const data = new Date(evento.data + 'T00:00:00');
    const dia = data.getUTCDate();
    const mes = data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');

    // --- CORREÇÃO URL IMAGEM v4 (Assumindo Subdiretório) ---
    let imageUrl = 'https://placehold.co/600x400/21262d/8b949e?text=Evento'; // Placeholder padrão
    const backendUrlPath = evento.imagemCapaUrl;

    if (backendUrlPath) {
        try {
            // Extrai apenas o nome do ficheiro da URL/path recebido
            const fileName = backendUrlPath
                .substring(backendUrlPath.lastIndexOf('/') + 1); // Pega apenas a parte após a última '/'

            if (fileName) {
                // Monta a URL correta apontando para o ArquivoController,
                // INSERINDO o subdiretório 'eventoPictures' manualmente
                imageUrl = `http://localhost:8080/api/arquivos/eventoPictures/${fileName}`; // <<< ALTERAÇÃO AQUI
            }
        } catch (e) {
            console.error("Erro ao processar URL da imagem:", backendUrlPath, e);
            // Mantém o placeholder em caso de erro
        }
    }
     console.log(`[Evento ID ${evento.id}] URL Final (com subdiretório):`, imageUrl); // Log para verificar
    // --- FIM DA CORREÇÃO ---


    return (
        <article className="evento-card">
            <div className="evento-imagem" style={{ backgroundImage: `url('${imageUrl}')` }}>
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

// --- COMPONENTE PRINCIPAL DA PÁGINA (sem alterações) ---
// (O restante do código do componente Eventos continua igual à versão anterior)
// ... (código omitido para brevidade) ...
const Eventos = ({ onLogout }) => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [filters, setFilters] = useState({
        periodo: 'proximos',
        formato: 'todos',
        categoria: 'todos'
    });

    useEffect(() => {
        document.title = 'Senai Community | Eventos';
        const token = localStorage.getItem('authToken');

        const fetchData = async () => {
            if (!token) {
                onLogout();
                return;
            }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const [userRes, eventosRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me'),
                    axios.get('http://localhost:8080/api/eventos')
                ]);
                setCurrentUser(userRes.data);
                setEventos(eventosRes.data);
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    onLogout();
                }
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

    const filteredEventos = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (!Array.isArray(eventos)) {
            return [];
        }

        let filtered = eventos.filter(evento => {
            if (!evento.data || typeof evento.data !== 'string') {
                 return false;
            }
            const eventoDate = new Date(evento.data + 'T00:00:00');
            const periodoMatch = filters.periodo === 'proximos' ? eventoDate >= hoje : eventoDate < hoje;
            const formatoMatch = filters.formato === 'todos' || evento.formato === filters.formato;
            const categoriaMatch = filters.categoria === 'todos' || evento.categoria === filters.categoria;
            return periodoMatch && formatoMatch && categoriaMatch;
        });

        filtered.sort((a, b) => {
             const dateA = new Date(a.data + 'T00:00:00');
             const dateB = new Date(b.data + 'T00:00:00');
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
                    {/* ... (código do header e filtros) ... */}
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

                <RightSidebar />
                <RightSidebar /> {/* ✅ REVERTIDO (Renderizado) */}

            </div>
        </div>
    );
};

export default Eventos;