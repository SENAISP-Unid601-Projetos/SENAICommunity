// src/pages/Eventos/Eventos.jsx (COMPLETO E ATUALIZADO COM MODAL)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; 
import './Eventos.css'; // Carrega o CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTag, faClock, faMapMarkerAlt, faArrowRight, faUsers, 
    faCalendarAlt, faInfoCircle, faUserCheck, faTimes // Importei ícones adicionais
} from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE EventoDetalheModal ---
const EventoDetalheModal = ({ evento, onClose }) => {
    if (!evento) return null;

    let dataFormatada = 'Data inválida';
    let dataCompleta = 'Data inválida';
    let horaEvento = 'Horário não informado';

    // Processa a data (usando a lógica mais robusta do EventoCard)
    if (evento.data && typeof evento.data === 'string') {
        try {
            const dataObj = new Date(evento.data + 'T00:00:00');
            if (!isNaN(dataObj.getTime())) {
                dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                // Se o backend tiver um campo de hora, podemos usá-lo:
                // horaEvento = evento.hora || 'Horário não informado';
            }
        } catch (e) { /* ignorar */ }
    } else if (Array.isArray(evento.data) && evento.data.length >= 3) {
        // Lógica para array de data [ano, mes, dia]
        const dataArray = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
        if (!isNaN(dataArray.getTime())) {
            dataFormatada = dataArray.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }
    }


    // Constrói a URL da imagem (reutiliza lógica do EventoCard)
    const imageUrl = evento.imagemCapaUrl 
        ? `http://localhost:8080${evento.imagemCapaUrl}` 
        : 'https://placehold.co/700x200/21262d/8b949e?text=SENAI+EVENTO';

    return (
        <div className="modal-overlay visible" onClick={onClose}>
            <div className="modal-content modal-detalhe-evento" onClick={e => e.stopPropagation()}>
                
                {/* Cabeçalho com Imagem e Título */}
                <div className="modal-header detalhe-header" style={{ backgroundImage: `url('${imageUrl}')` }}>
                    <div className="header-overlay">
                        <h2>{evento.nome}</h2>
                        <button className="close-modal-btn" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                </div>

                <div className="modal-body detalhe-body">
                    
                    {/* Informações Rápidas em Grid */}
                    <div className="detalhe-info-grid">
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <div>
                                <strong>Data</strong>
                                <p>{dataFormatada}</p>
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faClock} />
                            <div>
                                <strong>Horário</strong>
                                <p>{horaEvento}</p> {/* Placeholder */}
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <div>
                                <strong>Local / Formato</strong>
                                <p>{evento.local} ({evento.formato})</p>
                            </div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faTag} />
                            <div>
                                <strong>Categoria</strong>
                                <p>{evento.categoria}</p>
                            </div>
                        </div>
                    </div>

                    {/* Descrição Completa */}
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faInfoCircle} /> Sobre o Evento</h3>
                    <p className="evento-descricao-completa">{evento.descricao}</p>
                    
                    {/* Contagem de Confirmados (Placeholder) */}
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faUserCheck} /> Participação</h3>
                    <p>Cerca de **--** pessoas confirmaram presença.</p>

                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Fechar</button>
                    {/* Botão de Confirmação (RSVP) */}
                    <button type="button" className="rsvp-btn-modal">
                        Confirmar Presença (RSVP)
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE EventoCard (Adicionado onClick para o modal) ---
const EventoCard = ({ evento, onVerDetalhes }) => {
    let dia = '??';
    let mes = '???';
    let dataFormatada = 'Data inválida';
    let dataValida = false;

    if (evento.data && typeof evento.data === 'string') {
        try {
            const data = new Date(evento.data + 'T00:00:00'); 
            if (!isNaN(data.getTime())) {
                dia = data.getUTCDate(); 
                mes = data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
                dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                dataValida = true;
            }
        } catch (e) { /* ignorar */ }
    } else if (Array.isArray(evento.data) && evento.data.length >= 3) {
        // Lógica para array de data (que o backend pode estar enviando)
        try {
             const data = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
             if (!isNaN(data.getTime())) {
                 dia = data.getDate();
                 mes = data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                 dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                 dataValida = true;
             }
        } catch (e) { /* ignorar */ }
    }


    let imageUrl = 'https://placehold.co/600x400/21262d/8b949e?text=Evento'; 
    const backendUrlPath = evento.imagemCapaUrl;
    if (backendUrlPath) {
        try {
            const fileName = backendUrlPath.substring(backendUrlPath.lastIndexOf('/') + 1);
            if (fileName) {
                // Monta URL completa para o frontend acessar
                imageUrl = `http://localhost:8080/api/arquivos/eventoPictures/${fileName}`; 
            }
        } catch (e) { /* ignorar */ }
    }

    return (
        <article className="evento-card">
            <div className="evento-imagem" style={{ backgroundImage: `url('${imageUrl}')` }}>
                {dataValida && (
                    <div className="evento-data">
                        <span>{dia}</span>
                        <span>{mes.toUpperCase()}</span>
                    </div>
                )}
                <div className="evento-categoria">
                    <FontAwesomeIcon icon={faTag} /> {evento.categoria || 'Geral'}
                </div>
            </div>
            <div className="evento-conteudo">
                <h2 className="evento-titulo">{evento.nome || 'Evento sem nome'}</h2>
                <div className="evento-detalhe">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> {evento.local || 'Local não informado'} ({evento.formato || 'Formato não informado'})
                </div>
                <div className="evento-detalhe">
                    <FontAwesomeIcon icon={faClock} /> {dataFormatada}
                </div>
            </div>
            <footer className="evento-footer">
                <span className="evento-confirmados">
                    <FontAwesomeIcon icon={faUsers} /> -- confirmados
                </span>
                {/* ✅ CHAMADA PARA ABRIR O MODAL */}
                <button className="rsvp-btn" onClick={() => onVerDetalhes(evento)}>
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
    const [currentUser, setCurrentUser] = useState(null);
    // ✅ NOVO ESTADO: Controla o modal de detalhes
    const [eventoSelecionado, setEventoSelecionado] = useState(null); 
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
                setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : []); 
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
                if (error.response?.status === 401 || error.response?.status === 403) { 
                    onLogout();
                }
                 setEventos([]); 
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
            if (!evento.data || (typeof evento.data !== 'string' && !Array.isArray(evento.data))) {
                return false; 
            }
            try {
                // Tenta lidar com a data como string (formato YYYY-MM-DD) ou como array [Y, M, D]
                const dateSource = Array.isArray(evento.data) ? 
                    new Date(evento.data[0], evento.data[1] - 1, evento.data[2]) :
                    new Date(evento.data + 'T00:00:00');
                    
                const eventoDate = new Date(dateSource);

                if (isNaN(eventoDate.getTime())) return false; 

                const periodoMatch = filters.periodo === 'proximos' ? eventoDate >= hoje : eventoDate < hoje;
                const formatoMatch = filters.formato === 'todos' || evento.formato === filters.formato;
                const categoriaMatch = filters.categoria === 'todos' || evento.categoria === filters.categoria;
                return periodoMatch && formatoMatch && categoriaMatch;
            } catch (e) {
                console.error("Erro ao processar data no filtro:", evento.data, e);
                return false; 
            }
        });

        filtered.sort((a, b) => {
            try {
                const dateA = Array.isArray(a.data) ? new Date(a.data[0], a.data[1] - 1, a.data[2]) : new Date(a.data + 'T00:00:00');
                const dateB = Array.isArray(b.data) ? new Date(b.data[0], b.data[1] - 1, b.data[2]) : new Date(b.data + 'T00:00:00');
                
                if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
                return filters.periodo === 'proximos' ? dateA - dateB : dateB - dateA;
            } catch (e) {
                return 0;
            }
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
                                filteredEventos.map(evento => 
                                    <EventoCard 
                                        key={evento.id} 
                                        evento={evento} 
                                        onVerDetalhes={setEventoSelecionado} // ✅ PASSA A FUNÇÃO
                                    />
                                )
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
            </div>
            {/* ✅ NOVO MODAL DE DETALHES */}
            <EventoDetalheModal
                evento={eventoSelecionado}
                onClose={() => setEventoSelecionado(null)}
            />
        </div>
    );
};

export default Eventos;