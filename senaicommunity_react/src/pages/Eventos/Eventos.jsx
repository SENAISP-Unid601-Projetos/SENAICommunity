// src/pages/Eventos/Eventos.jsx (COMPLETO COM CRIAÇÃO)

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar';
import './Eventos.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faTag, faClock, faMapMarkerAlt, faArrowRight, faUsers,
    faCalendarAlt, faInfoCircle, faUserCheck, faTimes, faPlus // ✅ Adicionado faPlus
} from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE EventoDetalheModal (Mantido Original) ---
const EventoDetalheModal = ({ evento, onClose }) => {
    if (!evento) return null;

    let dataFormatada = 'Data inválida';
    let horaEvento = 'Horário não informado';

    if (evento.data && typeof evento.data === 'string') {
        try {
            const dataObj = new Date(evento.data + 'T00:00:00');
            if (!isNaN(dataObj.getTime())) {
                dataFormatada = dataObj.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            }
        } catch (e) { }
    } else if (Array.isArray(evento.data) && evento.data.length >= 3) {
        const dataArray = new Date(evento.data[0], evento.data[1] - 1, evento.data[2]);
        if (!isNaN(dataArray.getTime())) {
            dataFormatada = dataArray.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        }
    }

    const imageUrl = evento.imagemCapaUrl
        ? `http://localhost:8080${evento.imagemCapaUrl}`
        : 'https://source.unsplash.com/random/700x200?technology,event';

    return (
        <div className="modal-overlay visible" onClick={onClose}>
            <div className="modal-content modal-detalhe-evento" onClick={e => e.stopPropagation()}>
                <div className="modal-header detalhe-header" style={{ backgroundImage: `url('${imageUrl}')` }}>
                    <div className="header-overlay">
                        <h2>{evento.nome}</h2>
                        <button className="close-modal-btn" onClick={onClose}><FontAwesomeIcon icon={faTimes} /></button>
                    </div>
                </div>
                <div className="modal-body detalhe-body">
                    <div className="detalhe-info-grid">
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faCalendarAlt} />
                            <div><strong>Data</strong><p>{dataFormatada}</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faClock} />
                            <div><strong>Horário</strong><p>{horaEvento}</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                            <div><strong>Local / Formato</strong><p>{evento.local} ({evento.formato})</p></div>
                        </div>
                        <div className="detalhe-info-item">
                            <FontAwesomeIcon icon={faTag} />
                            <div><strong>Categoria</strong><p>{evento.categoria}</p></div>
                        </div>
                    </div>
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faInfoCircle} /> Sobre o Evento</h3>
                    <p className="evento-descricao-completa">{evento.descricao}</p>
                    <h3 className="detalhe-section-title"><FontAwesomeIcon icon={faUserCheck} /> Participação</h3>
                    <p>Cerca de **--** pessoas confirmaram presença.</p>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn-cancel" onClick={onClose}>Fechar</button>
                    <button type="button" className="rsvp-btn-modal">Confirmar Presença (RSVP)</button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE EventoCard (Mantido Original) ---
const EventoCard = ({ evento, onVerDetalhes }) => {
    let dia = '??', mes = '???', dataFormatada = 'Data inválida', dataValida = false;

    // Lógica de Data (mantida robusta)
    const processDate = (dateInput) => {
         if (dateInput && typeof dateInput === 'string') {
             return new Date(dateInput + 'T00:00:00');
         } else if (Array.isArray(dateInput) && dateInput.length >= 3) {
             return new Date(dateInput[0], dateInput[1] - 1, dateInput[2]);
         }
         return null;
    }
    
    try {
        const data = processDate(evento.data);
        if (data && !isNaN(data.getTime())) {
             dia = data.getUTCDate ? data.getUTCDate() : data.getDate();
             // Ajuste para garantir que array date exiba certo
             if(Array.isArray(evento.data)) dia = data.getDate();

             mes = data.toLocaleString('pt-BR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
             dataFormatada = data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
             dataValida = true;
        }
    } catch(e) {}

    const imageUrl = evento.imagemCapaUrl
        ? `http://localhost:8080${evento.imagemCapaUrl}`
        : 'https://source.unsplash.com/random/600x400?event,technology';

    return (
        <article className="evento-card">
            <div className="evento-imagem" style={{ backgroundImage: `url('${imageUrl}')` }}>
                {dataValida && (
                    <div className="evento-data">
                        <span>{dia}</span>
                        <span>{mes.toUpperCase()}</span>
                    </div>
                )}
                <div className="evento-categoria"><FontAwesomeIcon icon={faTag} /> {evento.categoria || 'Geral'}</div>
            </div>
            <div className="evento-conteudo">
                <h2 className="evento-titulo">{evento.nome || 'Evento sem nome'}</h2>
                <div className="evento-detalhe"><FontAwesomeIcon icon={faMapMarkerAlt} /> {evento.local || 'Local não informado'} ({evento.formato})</div>
                <div className="evento-detalhe"><FontAwesomeIcon icon={faClock} /> {dataFormatada}</div>
            </div>
            <footer className="evento-footer">
                <span className="evento-confirmados"><FontAwesomeIcon icon={faUsers} /> -- confirmados</span>
                <button className="rsvp-btn" onClick={() => onVerDetalhes(evento)}>Ver Mais <FontAwesomeIcon icon={faArrowRight} /></button>
            </footer>
        </article>
    );
};

// --- COMPONENTE PRINCIPAL ---
const Eventos = ({ onLogout }) => {
    const [eventos, setEventos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [eventoSelecionado, setEventoSelecionado] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [filters, setFilters] = useState({ periodo: 'proximos', formato: 'todos', categoria: 'todos' });

    // ✅ NOVOS ESTADOS PARA CRIAÇÃO
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [novoEvento, setNovoEvento] = useState({
        nome: "", descricao: "", dataHora: "", local: "", categoria: "ACADEMICO", formato: "PRESENCIAL"
    });
    const [imagem, setImagem] = useState(null);

    useEffect(() => {
        document.title = 'Senai Community | Eventos';
        const token = localStorage.getItem('authToken');
        const fetchData = async () => {
             if (!token) { onLogout(); return; }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const [userRes, eventosRes] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me'),
                    axios.get('http://localhost:8080/api/eventos')
                ]);
                setCurrentUser(userRes.data);
                setEventos(Array.isArray(eventosRes.data) ? eventosRes.data : []);
            } catch (error) {
                console.error("Erro:", error);
                if (error.response?.status === 401) onLogout();
                setEventos([]);
            } finally { setLoading(false); }
        };
        fetchData();
    }, [onLogout]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // ✅ Lógica do Formulário de Eventos
    const handleCreateInputChange = (e) => {
        const { name, value } = e.target;
        setNovoEvento(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) setImagem(e.target.files[0]);
    };

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('authToken');
        const formData = new FormData();
        
        // Converter o objeto para JSON e adicionar como Blob (necessário para Spring Boot @RequestPart)
        const eventoBlob = new Blob([JSON.stringify(novoEvento)], { type: 'application/json' });
        formData.append("evento", eventoBlob);
        
        if (imagem) formData.append("imagem", imagem);

        try {
            await axios.post("http://localhost:8080/api/eventos", formData, {
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "multipart/form-data" // Importante para envio de arquivos
                },
            });
            
            setShowCreateModal(false);
            setNovoEvento({ nome: "", descricao: "", dataHora: "", local: "", categoria: "ACADEMICO", formato: "PRESENCIAL" });
            setImagem(null);
            
            // Atualizar lista
            const res = await axios.get('http://localhost:8080/api/eventos');
            setEventos(res.data);
            alert("Evento criado com sucesso!");
        } catch (error) {
            console.error("Erro ao criar evento:", error);
            alert("Erro ao criar evento. Verifique permissões.");
        }
    };

    const filteredEventos = useMemo(() => {
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        if (!Array.isArray(eventos)) return [];

        let filtered = eventos.filter(evento => {
            if (!evento.data) return false;
            // Lógica simplificada de filtro (assumindo que os dados vêm corretos da API ou processados)
            // Para robustez, re-executa parsing de data
            let eventoDate = null;
             if (typeof evento.data === 'string') eventoDate = new Date(evento.data);
             else if (Array.isArray(evento.data)) eventoDate = new Date(evento.data[0], evento.data[1]-1, evento.data[2]);
            
             if(!eventoDate) return false;

            const periodoMatch = filters.periodo === 'proximos' ? eventoDate >= hoje : eventoDate < hoje;
            const formatoMatch = filters.formato === 'todos' || evento.formato === filters.formato;
            const categoriaMatch = filters.categoria === 'todos' || evento.categoria === filters.categoria;
            return periodoMatch && formatoMatch && categoriaMatch;
        });
        return filtered;
    }, [eventos, filters]);

    // ✅ Permissão
    const podeCriarEvento = currentUser && (
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
                    <header className="eventos-header">
                        <div className="header-text">
                             <h1>Conecte-se, Aprenda e Inove</h1>
                             <p>Workshops, palestras e competições.</p>
                        </div>
                        {/* ✅ Botão Criar Evento */}
                        {podeCriarEvento && (
                            <button className="btn-create-action" onClick={() => setShowCreateModal(true)}>
                                <FontAwesomeIcon icon={faPlus} /> Criar Evento
                            </button>
                        )}
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
                            <option value="ACADEMICO">Acadêmico</option>
                            <option value="CULTURAL">Cultural</option>
                            <option value="ESPORTIVO">Esportivo</option>
                        </select>
                    </section>
                    <section className="eventos-grid">
                        {loading ? <p className="loading-state">Carregando eventos...</p> :
                            filteredEventos.length > 0 ? (
                                filteredEventos.map(evento => <EventoCard key={evento.id} evento={evento} onVerDetalhes={setEventoSelecionado} />)
                            ) : <div className="sem-eventos"><h3>Nenhum evento encontrado</h3></div>
                        }
                    </section>
                </main>
                <RightSidebar />
            </div>
            <EventoDetalheModal evento={eventoSelecionado} onClose={() => setEventoSelecionado(null)} />

            {/* ✅ MODAL DE CRIAÇÃO DE EVENTO */}
            {showCreateModal && (
                <div className="modal-overlay visible" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content modal-create-form" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Novo Evento</h2>
                            <button className="close-modal-btn" onClick={() => setShowCreateModal(false)}><FontAwesomeIcon icon={faTimes} /></button>
                        </div>
                        <form onSubmit={handleCreateSubmit} className="create-form-body">
                            <div className="form-group">
                                <label>Nome do Evento</label>
                                <input type="text" name="nome" value={novoEvento.nome} onChange={handleCreateInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Data e Hora</label>
                                <input type="datetime-local" name="dataHora" value={novoEvento.dataHora} onChange={handleCreateInputChange} required />
                            </div>
                            <div className="form-group">
                                <label>Local</label>
                                <input type="text" name="local" value={novoEvento.local} onChange={handleCreateInputChange} required placeholder="Ex: Auditório A ou Link Zoom"/>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select name="categoria" value={novoEvento.categoria} onChange={handleCreateInputChange}>
                                        <option value="ACADEMICO">Acadêmico</option>
                                        <option value="TECNOLOGIA">Tecnologia</option>
                                        <option value="ESPORTIVO">Esportivo</option>
                                        <option value="CULTURAL">Cultural</option>
                                        <option value="CARREIRA">Carreira</option>
                                        <option value="INOVACAO">Inovação</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Formato</label>
                                    <select name="formato" value={novoEvento.formato} onChange={handleCreateInputChange}>
                                        <option value="PRESENCIAL">Presencial</option>
                                        <option value="ONLINE">Online</option>
                                        <option value="HIBRIDO">Híbrido</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Banner do Evento</label>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea name="descricao" value={novoEvento.descricao} onChange={handleCreateInputChange} required rows="4"></textarea>
                            </div>
                            <button type="submit" className="btn-submit-create">Criar Evento</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Eventos;