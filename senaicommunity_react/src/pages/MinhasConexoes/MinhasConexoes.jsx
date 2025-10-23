// src/pages/MinhasConexoes/MinhasConexoes.jsx (NOVO DESIGN - CORRIGIDO NOVAMENTE)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import RightSidebar from '../../pages/Principal/RightSidebar'; // Layout consistente
import Swal from 'sweetalert2';
import './MinhasConexoes.css'; // Carrega o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faPaperPlane, faUserMinus, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom'; // Para linkar para perfil

// --- COMPONENTE ConexaoCard MELHORADO ---
const ConexaoCard = ({ item, type, onAction }) => {
    // Determina qual nome/foto usar baseado no tipo de lista
    const idUsuario = type === 'enviado' ? item.idSolicitado : item.idSolicitantee; // Ajuste AQUI se o campo for diferente
    const nome = type === 'enviado' ? item.nomeSolicitado : item.nomeSolicitante;
    const foto = type === 'enviado' ? item.fotoPerfilSolicitado : item.fotoPerfilSolicitante;

    // ✅ INTEGRAÇÃO: Constrói URL da foto corretamente
    const fotoUrl = foto
        ? `http://localhost:8080${foto}` // Assume que o backend retorna o caminho relativo
        : `https://i.pravatar.cc/80?u=${idUsuario || item.idAmizade}`; // Fallback com ID

    const handleActionClick = (action) => {
        onAction(item.idAmizade, action);
    };

    return (
        <article className="conexao-card">
             {/* Link para o perfil (necessita ID do usuário) */}
             {/* Ajuste o ID usado no link se necessário */}
             <Link to={`/perfil/${idUsuario}`} className="conexao-card-link">
                <img src={fotoUrl} alt={`Foto de ${nome}`} className="conexao-avatar" />
                <h4 className="conexao-nome">{nome}</h4>
                {/* Adicionar curso/tipo se a API retornar */}
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
                     {/* Link para chat futuro */}
                    <button className="btn btn-secondary btn-message">
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

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const MinhasConexoes = ({ onLogout }) => {
    const [recebidos, setRecebidos] = useState([]);
    const [enviados, setEnviados] = useState([]);
    const [amigos, setAmigos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null); // ✅ INTEGRAÇÃO

    // ✅ INTEGRAÇÃO: Função refatorada para buscar tudo
    const fetchData = async () => {
        // Removido setLoading(true) daqui para evitar piscar a tela em updates
        const token = localStorage.getItem('authToken');
        if (!token) {
            onLogout();
            return;
        }
        // ✅ CORREÇÃO AQUI: Linha removida -> const headers = { 'Authorization': `Bearer ${token}` };
        try {
             axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Define header padrão
            const [userRes, resRecebidos, resEnviados, resAmigos] = await Promise.all([
                 axios.get('http://localhost:8080/usuarios/me'),
                axios.get('http://localhost:8080/api/amizades/pendentes'),
                axios.get('http://localhost:8080/api/amizades/enviadas'),
                // A API de amigos (/api/amizades/) precisa retornar o ID do amigo também
                axios.get('http://localhost:8080/api/amizades/')
            ]);
            setCurrentUser(userRes.data);
            setRecebidos(resRecebidos.data);
            setEnviados(resEnviados.data);
            // Mapeia amigos para incluir idSolicitante (necessário para o link do perfil no card)
             setAmigos(resAmigos.data.map(amigo => ({
                ...amigo,
                // Ajuste AQUI se o campo do ID do amigo for diferente em /api/amizades/
                idSolicitante: amigo.idUsuarioAmigo || amigo.idUsuario // Tenta 'idUsuarioAmigo' ou 'idUsuario'
            })));
        } catch (error) {
            console.error("Erro ao buscar conexões:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                 onLogout(); // Logout se token inválido
            }
        } finally {
            setLoading(false); // Define loading como false só após tudo carregar
        }
    };

    useEffect(() => {
        document.title = 'Senai Community | Conexões';
        setLoading(true); // Define loading true ao montar o componente
        fetchData();
    }, [onLogout]);

    // ✅ INTEGRAÇÃO: Função para aceitar/recusar/cancelar/remover
    const handleAction = async (amizadeId, action) => {
        // Token já está nos headers padrão do axios
        let url = '';
        let method = 'post'; // Default

        try {
            switch(action) {
                case 'aceitar':
                    url = `http://localhost:8080/api/amizades/aceitar/${amizadeId}`;
                    method = 'post';
                    break;
                case 'recusar':
                case 'cancelar':
                case 'remover':
                     url = `http://localhost:8080/api/amizades/recusar/${amizadeId}`; // API para recusar/cancelar/remover
                     method = 'delete';
                     break;
                default:
                    return; // Ação desconhecida
            }

            await axios({ method, url });

            // Otimização: Atualiza o estado localmente antes de refazer o fetch
            if (action === 'aceitar') {
                 const aceito = recebidos.find(r => r.idAmizade === amizadeId);
                 if (aceito) {
                     // Adiciona aos amigos, garantindo o ID correto
                     setAmigos(prev => [...prev, { ...aceito, idUsuarioAmigo: aceito.idSolicitante }]);
                     setRecebidos(prev => prev.filter(r => r.idAmizade !== amizadeId)); // Remove dos recebidos
                 }
            } else if (action === 'recusar') {
                 setRecebidos(prev => prev.filter(r => r.idAmizade !== amizadeId));
            } else if (action === 'cancelar') {
                 setEnviados(prev => prev.filter(e => e.idAmizade !== amizadeId));
            } else if (action === 'remover') {
                 setAmigos(prev => prev.filter(a => a.idAmizade !== amizadeId));
            }

            // Opcional: Refazer fetch para garantir consistência total, mas pode causar 'piscada'
            // fetchData();

        } catch (error) {
            console.error(`Erro ao ${action} amizade:`, error);
            // Agora o Swal está importado e funciona
            Swal.fire('Erro', `Não foi possível executar a ação '${action}'. Tente novamente.`, 'error');
            // Poderia reverter a mudança visual aqui se desejado
        }
    };

    return (
        <div>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    <section className="widget-card connections-page-card">
                        <h2 className="widget-title">Gerenciar Conexões</h2>

                        {/* --- Seção Pedidos Recebidos --- */}
                        <div className="connections-section">
                            <h3>Pedidos Recebidos ({loading ? '...' : recebidos.length})</h3>
                             {loading ? <p className="loading-state">Carregando...</p> : recebidos.length > 0 ? (
                                <div className="conexao-grid">
                                    {recebidos.map(item => <ConexaoCard key={item.idAmizade} item={item} type="recebido" onAction={handleAction} />)}
                                </div>
                            ) : <p className="empty-state">Nenhum pedido de conexão pendente.</p>}
                        </div>

                        {/* --- Seção Pedidos Enviados --- */}
                        <div className="connections-section">
                            <h3>Pedidos Enviados ({loading ? '...' : enviados.length})</h3>
                             {loading ? <p className="loading-state">Carregando...</p> : enviados.length > 0 ? (
                                 <div className="conexao-grid">
                                    {enviados.map(item => <ConexaoCard key={item.idAmizade} item={item} type="enviado" onAction={handleAction} />)}
                                 </div>
                            ) : <p className="empty-state">Você não enviou nenhum pedido recentemente.</p>}
                        </div>

                        {/* --- Seção Meus Amigos --- */}
                        <div className="connections-section">
                            <h3>Minhas Conexões ({loading ? '...' : amigos.length})</h3>
                             {loading ? <p className="loading-state">Carregando...</p> : amigos.length > 0 ? (
                                <div className="conexao-grid">
                                    {/* Mapeia amigos, garantindo que idSolicitante exista para o card */}
                                    {amigos.map(item => <ConexaoCard key={item.idAmizade} item={item} type="amigo" onAction={handleAction} />)}
                                </div>
                            ) : <p className="empty-state">Você ainda não tem conexões. Que tal <Link to="/encontrar-pessoas">encontrar pessoas</Link>?</p>}
                        </div>
                    </section>
                </main>
                 <RightSidebar /> {/* ✅ DESIGN: Adicionado para layout de 3 colunas */}
            </div>
        </div>
    );
};

export default MinhasConexoes;