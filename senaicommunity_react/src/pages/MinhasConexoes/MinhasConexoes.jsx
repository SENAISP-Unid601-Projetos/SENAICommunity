import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; 
import Swal from 'sweetalert2';
import './MinhasConexoes.css'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faPaperPlane, faUserMinus, faClockRotateLeft, faUsers } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom'; 

// --- COMPONENTE ConexaoCard CORRIGIDO (SEM PRAVATAR.CC) ---
const ConexaoCard = ({ item, type, onAction, onGoToChat }) => {
    
    let idUsuario, nome, foto;

    if (type === 'enviado') {
        idUsuario = item.idSolicitado;
        nome = item.nomeSolicitado;
        foto = item.fotoPerfilSolicitado;
    } else if (type === 'recebido') {
        idUsuario = item.idSolicitante; 
        nome = item.nomeSolicitante;
        foto = item.fotoPerfilSolicitante;
    } else { // type === 'amigo'
        idUsuario = item.idUsuario; 
        nome = item.nome;
        foto = item.fotoPerfil; 
    }

    // ✅ CORREÇÃO: Usa a imagem local do seu BackEnd, não site externo
    const fallbackAvatar = "http://localhost:8080/images/default-avatar.png";
    
    let fotoUrl;
    if (!foto) {
        fotoUrl = fallbackAvatar;
    } else if (foto.startsWith('http')) {
        fotoUrl = foto; 
    } else if (foto.startsWith('/api/arquivos/') || foto.startsWith('/images/')) {
        fotoUrl = `http://localhost:8080${foto}`;
    } else {
        fotoUrl = `http://localhost:8080/api/arquivos/${foto}`;
    }

    const handleActionClick = (action) => {
        onAction(item.idAmizade, action);
    };

    return (
        <article className="conexao-card">
             <Link to={`/perfil/${idUsuario}`} className="conexao-card-link">
                <img 
                    src={fotoUrl} 
                    alt={`Foto de ${nome}`} 
                    className="conexao-avatar"
                    // Se der erro, usa o fallback local
                    onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = fallbackAvatar; 
                    }} 
                />
                <h4 className="conexao-nome">{nome}</h4>
            </Link>
            <div className="conexao-actions">
                {type === 'recebido' && <>
                    <button className="btn btn-primary btn-accept" onClick={() => handleActionClick('aceitar')}>
                        <FontAwesomeIcon icon={faCheck} /> Aceitar
                    </button>
                    <button className="btn btn-secondary btn-decline" onClick={() => handleActionClick('recusar')}>
                        <FontAwesomeIcon icon={faTimes} /> Recusar
                    </button>
                </>}
                {type === 'enviado' && <button className="btn btn-secondary btn-cancel" onClick={() => handleActionClick('cancelar')}>
                     <FontAwesomeIcon icon={faClockRotateLeft} /> Cancelar
                </button>}
                {type === 'amigo' && <>
                    <button className="btn btn-secondary btn-message" onClick={() => onGoToChat(idUsuario)}>
                        <FontAwesomeIcon icon={faPaperPlane} /> Mensagem
                    </button>
                    <button className="btn btn-danger btn-remove" onClick={() => handleActionClick('remover')}>
                        <FontAwesomeIcon icon={faUserMinus} /> Remover
                    </button>
                </>}
            </div>
        </article>
    );
};

const MinhasConexoes = ({ onLogout }) => {
    const [recebidos, setRecebidos] = useState([]);
    const [enviados, setEnviados] = useState([]);
    const [amigos, setAmigos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                onLogout();
                return;
            }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const [userRes, resRecebidos, resEnviados, resAmigos] = await Promise.all([
                    axios.get('http://localhost:8080/usuarios/me'),
                    axios.get('http://localhost:8080/api/amizades/pendentes'),
                    axios.get('http://localhost:8080/api/amizades/enviadas'),
                    axios.get('http://localhost:8080/api/amizades/') 
                ]);
                setCurrentUser(userRes.data);
                setRecebidos(resRecebidos.data); 
                setEnviados(resEnviados.data); 
                setAmigos(resAmigos.data); 
            } catch (error) {
                console.error("Erro ao buscar conexões:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    onLogout(); 
                }
            } finally {
                setLoading(false); 
            }
        };

        document.title = 'Senai Community | Conexões';
        setLoading(true); 
        fetchData();
    }, [onLogout]);

    const handleAction = async (amizadeId, action) => {
        let url = '';
        let method = 'post';

        switch(action) {
            case 'aceitar':
                url = `http://localhost:8080/api/amizades/aceitar/${amizadeId}`;
                method = 'post';
                break;
            case 'recusar':
            case 'cancelar':
            case 'remover': 
                 url = `http://localhost:8080/api/amizades/recusar/${amizadeId}`; 
                 method = 'delete';
                 break;
            default: return; 
        }

        if (action === 'remover') {
            Swal.fire({
                title: 'Você tem certeza?',
                text: "A amizade será desfeita e você não poderá reverter isso!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33', 
                cancelButtonColor: 'var(--bg-quaternary)', 
                confirmButtonText: 'Sim, remover!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await axios({ method, url });
                        setAmigos(prev => prev.filter(a => a.idAmizade !== amizadeId));
                        Swal.fire('Removido!', 'A conexão foi desfeita.', 'success');
                    } catch (error) {
                        console.error(`Erro ao ${action} amizade:`, error);
                        Swal.fire('Erro', `Não foi possível executar a ação '${action}'. Tente novamente.`, 'error');
                    }
                }
            });
        } else {
            try {
                await axios({ method, url });
                if (action === 'aceitar') {
                     const aceito = recebidos.find(r => r.idAmizade === amizadeId);
                     if (aceito) {
                         const novoAmigo = {
                             idAmizade: aceito.idAmizade,
                             idUsuario: aceito.idSolicitante,
                             nome: aceito.nomeSolicitante,
                             fotoPerfil: aceito.fotoPerfilSolicitante,
                             email: '...', 
                             online: true 
                         };
                         setAmigos(prev => [...prev, novoAmigo]);
                         setRecebidos(prev => prev.filter(r => r.idAmizade !== amizadeId));
                     }
                } else if (action === 'recusar') {
                     setRecebidos(prev => prev.filter(r => r.idAmizade !== amizadeId));
                } else if (action === 'cancelar') {
                     setEnviados(prev => prev.filter(e => e.idAmizade !== amizadeId));
                }
            } catch (error) {
                console.error(`Erro ao ${action} amizade:`, error);
                Swal.fire('Erro', `Não foi possível executar a ação '${action}'. Tente novamente.`, 'error');
            }
        }
    };

    const handleGoToChat = (userId) => {
        navigate(`/mensagens?dm=${userId}`);
    };

    // ✅ LÓGICA DO LIMITE DE 3 AMIGOS
    const amigosExibidos = amigos.slice(0, 3);
    const temMaisAmigos = amigos.length > 3;

    return (
        <div>
            <Topbar 
                onLogout={onLogout} 
                currentUser={currentUser} 
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            <div className="container">
                <Sidebar currentUser={currentUser} isOpen={isSidebarOpen} />
                <main className="main-content">
                    <section className="widget-card connections-page-card">
                        <h2 className="widget-title">Gerenciar Conexões</h2>

                        {/* Pedidos Recebidos */}
                        <div className="connections-section">
                            <h3>Pedidos Recebidos ({loading ? '...' : recebidos.length})</h3>
                             {loading ? <p className="loading-state">Carregando...</p> : recebidos.length > 0 ? (
                                <div className="conexao-grid">
                                    {recebidos.map(item => 
                                        <ConexaoCard key={item.idAmizade} item={item} type="recebido" onAction={handleAction} onGoToChat={handleGoToChat} />
                                    )}
                                </div>
                            ) : <p className="empty-state">Nenhum pedido de conexão pendente.</p>}
                        </div>

                        {/* Pedidos Enviados */}
                        <div className="connections-section">
                            <h3>Pedidos Enviados ({loading ? '...' : enviados.length})</h3>
                             {loading ? <p className="loading-state">Carregando...</p> : enviados.length > 0 ? (
                                 <div className="conexao-grid">
                                    {enviados.map(item => 
                                        <ConexaoCard key={item.idAmizade} item={item} type="enviado" onAction={handleAction} onGoToChat={handleGoToChat} />
                                    )}
                                 </div>
                            ) : <p className="empty-state">Você não enviou nenhum pedido recentemente.</p>}
                        </div>

                        {/* ✅ SEÇÃO MEUS AMIGOS (COM LIMITE E BOTÃO VER TODOS) */}
                        <div className="connections-section">
                            <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                                <h3>Minhas Conexões ({loading ? '...' : amigos.length})</h3>
                                {temMaisAmigos && (
                                    <Link to="/amizades" className="btn-ver-todos-link" style={{color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600'}}>
                                        Ver lista completa <FontAwesomeIcon icon={faUsers} />
                                    </Link>
                                )}
                            </div>

                             {loading ? <p className="loading-state">Carregando...</p> : amigos.length > 0 ? (
                                <>
                                    <div className="conexao-grid">
                                        {amigosExibidos.map(item => 
                                            <ConexaoCard key={item.idAmizade} item={item} type="amigo" onAction={handleAction} onGoToChat={handleGoToChat} />
                                        )}
                                    </div>
                                    
                                    {/* Botão extra no final da lista se preferir */}
                                    {temMaisAmigos && (
                                        <div style={{textAlign: 'center', marginTop: '20px'}}>
                                            <Link to="/amizades" className="btn btn-secondary">
                                                Mostrar mais {amigos.length - 3} conexões
                                            </Link>
                                        </div>
                                    )}
                                </>
                            ) : <p className="empty-state">Você ainda não tem conexões. Que tal <Link to="/encontrar-pessoas">encontrar pessoas</Link>?</p>}
                        </div>
                    </section>
                </main>
                 <RightSidebar />
            </div>
        </div>
    );
};

export default MinhasConexoes;