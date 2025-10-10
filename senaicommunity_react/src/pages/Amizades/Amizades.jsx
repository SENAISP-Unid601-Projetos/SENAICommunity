import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentDots, faUserMinus } from '@fortawesome/free-solid-svg-icons';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import '../../pages/Principal/Principal.css';

const Amizades = ({ onLogout }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [friends, setFriends] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const backendUrl = 'http://localhost:8080';

    const fetchData = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            onLogout();
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
            const [userRes, receivedRes, sentRes, friendsRes] = await Promise.all([
                axios.get(`${backendUrl}/usuarios/me`),
                axios.get(`${backendUrl}/api/amizades/pendentes`),
                axios.get(`${backendUrl}/api/amizades/enviadas`),
                axios.get(`${backendUrl}/api/amizades/`)
            ]);
            setCurrentUser(userRes.data);
            setReceivedRequests(receivedRes.data);
            setSentRequests(sentRes.data);
            setFriends(friendsRes.data);
        } catch (error) {
            console.error("Erro ao buscar dados de amizades:", error);
            if (error.response?.status === 401) onLogout();
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        document.title = 'Senai Community | Conexões';
        fetchData();
    }, []);

    const handleAccept = async (amizadeId) => {
        try {
            await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
            fetchData(); // Recarrega todos os dados
        } catch (error) { console.error("Erro ao aceitar pedido:", error); }
    };

    const handleDecline = async (amizadeId) => {
        try {
            await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
            fetchData(); // Recarrega todos os dados
        } catch (error) { console.error("Erro ao recusar pedido:", error); }
    };
    
    if (isLoading) {
        return <div>Carregando...</div>;
    }

    return (
        <>
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className="container">
                <Sidebar currentUser={currentUser} />
                <main className="main-content">
                    <div className="widget-card">
                        <h2 className="widget-title">Gerenciar Conexões</h2>

                        <div className="connections-section">
                            <h3>Pedidos de Amizade Recebidos</h3>
                            <div className="request-list" id="received-requests-list">
                                {receivedRequests.length > 0 ? receivedRequests.map(req => (
                                    <div key={req.idAmizade} className="request-card">
                                        <img src={req.fotoPerfilSolicitante || 'https://via.placeholder.com/80'} alt={`Foto de ${req.nomeSolicitante}`} />
                                        <h4>{req.nomeSolicitante}</h4>
                                        <div className="request-card-actions">
                                            <button className="btn btn-primary" onClick={() => handleAccept(req.idAmizade)}>Aceitar</button>
                                            <button className="btn btn-secondary" onClick={() => handleDecline(req.idAmizade)}>Recusar</button>
                                        </div>
                                    </div>
                                )) : <p className="empty-state">Nenhum pedido recebido.</p>}
                            </div>
                        </div>

                        <div className="connections-section">
                            <h3>Pedidos de Amizade Enviados</h3>
                            <div className="request-list" id="sent-requests-list">
                                {sentRequests.length > 0 ? sentRequests.map(req => (
                                     <div key={req.idAmizade} className="request-card">
                                         <img src={req.fotoPerfilSolicitado || 'https://via.placeholder.com/80'} alt={`Foto de ${req.nomeSolicitado}`} />
                                         <h4>{req.nomeSolicitado}</h4>
                                         <div className="request-card-actions">
                                             <button className="btn btn-danger" onClick={() => handleDecline(req.idAmizade)}>Cancelar Pedido</button>
                                         </div>
                                     </div>
                                )) : <p className="empty-state">Nenhum pedido enviado.</p>}
                            </div>
                        </div>

                        <div className="connections-section">
                            <h3>Meus Amigos</h3>
                            <div className="user-list" id="friends-list">
                                {friends.length > 0 ? friends.map(friend => (
                                    <div key={friend.idAmizade} className="user-card">
                                        <div className="user-card-avatar">
                                            <img src={friend.fotoPerfil || 'https://via.placeholder.com/60'} alt={`Foto de ${friend.nome}`} />
                                            <div className={`status ${friend.online ? 'online' : 'offline'}`}></div>
                                        </div>
                                        <div className="user-card-info">
                                            <h4>{friend.nome}</h4>
                                            <p>{friend.email}</p>
                                        </div>
                                        <div className="user-card-action">
                                             <button className="btn btn-primary"><FontAwesomeIcon icon={faCommentDots} /> Mensagem</button>
                                             <button className="btn btn-danger" onClick={() => handleDecline(friend.idAmizade)}><FontAwesomeIcon icon={faUserMinus} /> Remover</button>
                                        </div>
                                    </div>
                                )) : <p className="empty-state">Você ainda não tem conexões.</p>}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default Amizades;