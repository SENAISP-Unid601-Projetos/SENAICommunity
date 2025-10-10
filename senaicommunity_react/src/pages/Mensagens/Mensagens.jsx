// src/pages/Mensagens/Mensagens.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar';
import './Mensagens.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

const Mensagens = ({ onLogout }) => {
    const [conversas, setConversas] = useState([]);
    const [conversaAtiva, setConversaAtiva] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [loading, setLoading] = useState(true);
    const stompClient = useRef(null);

    useEffect(() => {
        // Lógica para buscar as conversas iniciais (amigos e grupos)
        const fetchConversas = async () => {
            // Aqui você chamaria seu backend para listar os amigos e grupos do usuário
            // Mock por enquanto:
            setConversas([
                { id: 1, nome: 'Projeto IoT', tipo: 'grupo', avatar: 'https://via.placeholder.com/50' },
                { id: 2, nome: 'Eliezer B.', tipo: 'dm', avatar: 'https://i.pravatar.cc/50?u=2' },
            ]);
            setLoading(false);
        };

        fetchConversas();
    }, []);

    const selecionarConversa = async (conversa) => {
        setConversaAtiva(conversa);
        // Lógica para buscar o histórico da conversa
        // Mock por enquanto:
        setMensagens([
            { autorId: 2, texto: "E aí, tudo certo?", hora: "14:50" },
            { autorId: 1, texto: "Opa, tudo joia e você?", hora: "14:51" }
        ]);
    };

    return (
        <div>
            <Topbar onLogout={onLogout} />
            <div className="container-chat">
                <Sidebar />
                <aside className="chat-sidebar">
                    <div className="sidebar-header"><h2>Conversas</h2></div>
                    <div className="conversations-list">
                        {loading ? <p>Carregando...</p> : conversas.map(c => (
                            <div key={c.id} className={`convo-card ${conversaAtiva?.id === c.id ? 'selected' : ''}`} onClick={() => selecionarConversa(c)}>
                                <img src={c.avatar} className="avatar" alt="avatar" />
                                <div className="convo-info">
                                    <div className="convo-title">{c.nome}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="chat-main">
                   {conversaAtiva ? (
                        <div className="chat-card">
                            <div className="chat-header-area"><h3>{conversaAtiva.nome}</h3></div>
                            <div className="chat-messages-area">
                                {mensagens.map((msg, index) => (
                                    <div key={index} className={`message-group ${msg.autorId === 1 ? 'me' : 'other'}`}>
                                        <div className="message-content">{msg.texto}</div>
                                    </div>
                                ))}
                            </div>
                            <form className="chat-input-area">
                                <input type="text" placeholder="Digite uma mensagem..." />
                                <button type="submit"><FontAwesomeIcon icon={faPaperPlane} /></button>
                            </form>
                        </div>
                   ) : (
                       <div className="empty-chat-view">Selecione uma conversa para começar.</div>
                   )}
                </main>
            </div>
        </div>
    );
};

export default Mensagens;