import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserFriends } from '@fortawesome/free-solid-svg-icons';
import { useWebSocket } from '../../contexts/WebSocketContext'; 
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Principal.css';

const RightSidebar = () => {
    const [amigos, setAmigos] = useState([]);
    const { stompClient, isConnected } = useWebSocket(); 
    const DEFAULT_AVATAR_URL = "http://localhost:8080/images/default-avatar.png";

    const getProfileImageUrl = (fotoPerfil) => {
        if (!fotoPerfil || fotoPerfil === "") return DEFAULT_AVATAR_URL;
        if (fotoPerfil.startsWith("http")) return fotoPerfil;
        if (fotoPerfil.startsWith("/")) return `http://localhost:8080${fotoPerfil}`;
        return `http://localhost:8080/api/arquivos/${fotoPerfil}`;
    };

    useEffect(() => {
        const fetchAmigos = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if(token){
                     const response = await axios.get('http://localhost:8080/api/amizades/', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    setAmigos(response.data);
                }
            } catch (error) {
                console.error("Erro ao buscar amigos:", error);
            }
        };
        fetchAmigos();
    }, []);

    useEffect(() => {
        if (isConnected && stompClient) {
            const subscription = stompClient.subscribe('/topic/status', (message) => {
                const usuariosOnline = JSON.parse(message.body); 
                setAmigos(prevAmigos => prevAmigos.map(amigo => ({
                    ...amigo,
                    online: usuariosOnline.includes(amigo.email)
                })));
            });
            return () => subscription.unsubscribe();
        }
    }, [isConnected, stompClient]);

    // --- 1. LÓGICA DE ORDENAÇÃO (Online primeiro) ---
    const amigosOrdenados = [...amigos].sort((a, b) => {
        // Se b está online e a não, b vem primeiro (retorna positivo)
        // Se a está online e b não, a vem primeiro (retorna negativo)
        // Se ambos iguais, mantém a ordem (ou poderia ordenar por nome)
        return (b.online === true) - (a.online === true);
    });

    // Exibe os 3 primeiros da lista JÁ ORDENADA
    const amigosParaMostrar = amigosOrdenados.slice(0, 3);
    const temMaisAmigos = amigos.length > 3;

    return (
        <aside className="right-sidebar">
            <div className="widget-card">
                <div className="widget-header">
                    <h3><FontAwesomeIcon icon={faUserFriends} /> Conexões</h3>
                </div>
                
                <ul className="lista-amigos-online">
                    {amigos.length === 0 ? (
                        <p className="no-friends">Nenhum amigo adicionado.</p>
                    ) : (
                        <>
                            {amigosParaMostrar.map((amigo) => (
                                // Removemos a classe 'amigo-item' do li e zeramos o padding dele
                                <li key={amigo.idAmizade || amigo.idUsuario} style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                                    
                                    {/* --- 2. CORREÇÃO DO LINK/PADDING --- */}
                                    {/* A classe 'amigo-item' vai para o Link para manter o layout flexbox correto */}
                                    <Link 
                                        to={`/perfil/${amigo.idUsuario}`} 
                                        className="amigo-item" 
                                        style={{ 
                                            textDecoration: 'none', 
                                            color: 'inherit', 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            width: '100%',
                                            // Se o seu CSS original tinha padding no .amigo-item, ele será aplicado aqui.
                                            // Caso precise forçar um ajuste, descomente abaixo:
                                            // padding: '10px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div className="avatar-wrapper">
                                            <img 
                                                src={getProfileImageUrl(amigo.fotoPerfil)}
                                                alt={amigo.nome} 
                                                className="avatar-mini"
                                                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_AVATAR_URL; }}
                                            />
                                            {amigo.online && <span className="status-dot online"></span>}
                                        </div>
                                        <div className="amigo-info">
                                            <span className="amigo-nome">{amigo.nome}</span>
                                            <span className="amigo-status-texto">
                                                {amigo.online ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                            
                            {/* BOTÃO DE VER MAIS */}
                            {temMaisAmigos && (
                                <li className="ver-mais-container">
                                    <Link to="/amizades" className="btn-ver-todos">
                                        Ver todos ({amigos.length})
                                    </Link>
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </div>
        </aside>
    );
};

export default RightSidebar;