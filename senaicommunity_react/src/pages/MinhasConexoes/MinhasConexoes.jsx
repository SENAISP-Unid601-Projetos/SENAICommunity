// src/pages/MinhasConexoes/MinhasConexoes.jsx (CORRIGIDO)

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './MinhasConexoes.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUserMinus } from '@fortawesome/free-solid-svg-icons';

const ConexaoCard = ({ item, type, onAction }) => {
    // ✅ CORREÇÃO APLICADA AQUI: A URL da foto agora é construída corretamente.
    const fotoUrl = item.fotoPerfil 
        ? `http://localhost:8080/api/arquivos/${item.fotoPerfil}` 
        : `https://i.pravatar.cc/80?u=${item.idUsuario}`;

    const nome = item.nome;

    const handleAction = (action) => {
        onAction(item.idAmizade, action);
    };
    
    return (
        <div className="request-card">
            <img src={fotoUrl} alt={`Foto de ${nome}`} />
            <h4>{nome}</h4>
            <div className="request-card-actions">
                {type === 'recebido' && <>
                    <button className="btn btn-primary" onClick={() => handleAction('aceitar')}>Aceitar</button>
                    <button className="btn btn-secondary" onClick={() => handleAction('recusar')}>Recusar</button>
                </>}
                {type === 'enviado' && <button className="btn btn-danger" onClick={() => handleAction('cancelar')}>Cancelar Pedido</button>}
                {type === 'amigo' && <>
                    <button className="btn btn-primary"><FontAwesomeIcon icon={faPaperPlane} /> Mensagem</button>
                    <button className="btn btn-danger" onClick={() => handleAction('remover')}><FontAwesomeIcon icon={faUserMinus} /> Remover</button>
                </>}
            </div>
        </div>
    );
};

const MinhasConexoes = ({ onLogout }) => {
    const [recebidos, setRecebidos] = useState([]);
    const [enviados, setEnviados] = useState([]);
    const [amigos, setAmigos] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const [resRecebidos, resEnviados, resAmigos] = await Promise.all([
                axios.get('http://localhost:8080/api/amizades/pendentes', { headers }),
                axios.get('http://localhost:8080/api/amizades/enviadas', { headers }),
                axios.get('http://localhost:8080/api/amizades/', { headers })
            ]);
            setRecebidos(resRecebidos.data);
            setEnviados(resEnviados.data);
            setAmigos(resAmigos.data);
        } catch (error) {
            console.error("Erro ao buscar conexões:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        document.title = 'Senai Community | Conexões';
        fetchData();
    }, []);

    const handleAction = async (amizadeId, action) => {
        const token = localStorage.getItem('authToken');
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            switch(action) {
                case 'aceitar':
                    await axios.post(`http://localhost:8080/api/amizades/aceitar/${amizadeId}`, {}, { headers });
                    break;
                case 'recusar':
                case 'cancelar':
                case 'remover':
                     await axios.delete(`http://localhost:8080/api/amizades/recusar/${amizadeId}`, { headers });
                     break;
                default:
                    break;
            }
            fetchData(); // Recarrega os dados após a ação
        } catch (error) {
            console.error(`Erro ao ${action} amizade:`, error);
            alert(`Não foi possível executar a ação. Tente novamente.`);
        }
    };

    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container">
                <Sidebar />
                <main className="main-content">
                    <div className="widget-card">
                        <h2 className="widget-title">Gerenciar Conexões</h2>
                        
                        <div className="connections-section">
                            <h3>Pedidos de Amizade Recebidos</h3>
                            <div className="request-list">
                                {loading ? <p className="empty-state">Carregando...</p> : recebidos.length > 0 ? (
                                    recebidos.map(item => <ConexaoCard key={item.idAmizade} item={{...item, idUsuario: item.idSolicitante, nome: item.nomeSolicitante, fotoPerfil: item.fotoPerfilSolicitante}} type="recebido" onAction={handleAction} />)
                                ) : <p className="empty-state">Nenhum pedido recebido.</p>}
                            </div>
                        </div>

                        <div className="connections-section">
                            <h3>Pedidos de Amizade Enviados</h3>
                            <div className="request-list">
                                 {loading ? <p className="empty-state">Carregando...</p> : enviados.length > 0 ? (
                                    enviados.map(item => <ConexaoCard key={item.idAmizade} item={{...item, idUsuario: item.idSolicitado, nome: item.nomeSolicitado, fotoPerfil: item.fotoPerfilSolicitado}} type="enviado" onAction={handleAction} />)
                                ) : <p className="empty-state">Nenhum pedido enviado.</p>}
                            </div>
                        </div>

                        <div className="connections-section">
                            <h3>Meus Amigos</h3>
                            <div className="request-list">
                                {loading ? <p className="empty-state">Carregando...</p> : amigos.length > 0 ? (
                                    amigos.map(item => <ConexaoCard key={item.idAmizade} item={item} type="amigo" onAction={handleAction} />)
                                ) : <p className="empty-state">Você ainda não tem amigos.</p>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MinhasConexoes;