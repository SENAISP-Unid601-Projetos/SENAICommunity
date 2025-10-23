// src/pages/Mensagens/Mensagens.jsx (NOVO DESIGN - CORRIGIDO)

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar';
import Sidebar from '../../components/Layout/Sidebar'; // Sidebar principal
import Swal from 'sweetalert2'; // ✅ CORREÇÃO AQUI: Importa o SweetAlert2
import './Mensagens.css'; // Carrega o NOVO CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faEllipsisV, faSearch } from '@fortawesome/free-solid-svg-icons';

// --- COMPONENTE CONVERSATIONListItem ---
const ConversationListItem = ({ conversa, ativa, onClick }) => (
    <div
        className={`convo-list-item ${ativa ? 'selected' : ''}`}
        onClick={onClick}
    >
        <img src={conversa.avatar || `https://i.pravatar.cc/50?u=${conversa.id}`} className="avatar" alt="avatar" />
        <div className="convo-info">
            <div className="convo-title">{conversa.nome}</div>
            <div className="convo-snippet">{conversa.ultimaMensagem || 'Nenhuma mensagem ainda'}</div>
        </div>
        {/* Adicionar timestamp e contador de não lidas futuramente */}
        {/* <div className="convo-meta">
            <span className="timestamp">10:30</span>
            {conversa.naoLidas > 0 && <span className="unread-count">{conversa.naoLidas}</span>}
        </div> */}
    </div>
);

// --- COMPONENTE MessageBubble ---
const MessageBubble = ({ mensagem, isMe }) => (
     <div className={`message-bubble-wrapper ${isMe ? 'me' : 'other'}`}>
        <div className="message-bubble">
            <p className="message-text">{mensagem.texto}</p>
            <span className="message-time">{mensagem.hora}</span>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Mensagens = ({ onLogout }) => {
    const [conversas, setConversas] = useState([]);
    const [conversaAtivaId, setConversaAtivaId] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [loadingConversas, setLoadingConversas] = useState(true);
    const [loadingMensagens, setLoadingMensagens] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // ✅ INTEGRAÇÃO
    const [novaMensagem, setNovaMensagem] = useState('');
    // Aviso: 'stompClient' não é usado ainda (normal, pois WebSocket não foi implementado)
    const stompClient = useRef(null); // Para WebSocket futuro
    const messagesEndRef = useRef(null); // Para scroll automático

    // ✅ INTEGRAÇÃO: Busca usuário e conversas iniciais
    useEffect(() => {
        document.title = 'Senai Community | Mensagens';
        const token = localStorage.getItem('authToken');

        const fetchInitialData = async () => {
             if (!token) { // Verifica token antes de chamadas
                onLogout();
                return;
            }
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Define header padrão
                const userRes = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(userRes.data);

                // --- Substituir por chamada real à API de conversas ---
                // const conversasRes = await axios.get('http://localhost:8080/api/conversas');
                // setConversas(conversasRes.data);
                // Mock por enquanto:
                setConversas([
                    { id: 1, nome: 'Projeto IoT - Grupo', tipo: 'grupo', avatar: 'https://placehold.co/50/30363d/8b949e?text=IoT', ultimaMensagem: 'Vamos revisar o código amanhã?' },
                    { id: 2, nome: 'Eliezer B.', tipo: 'dm', avatar: 'https://i.pravatar.cc/50?u=2', ultimaMensagem: 'Opa, tudo joia e você?' },
                    { id: 3, nome: 'Ana Silva', tipo: 'dm', avatar: 'https://i.pravatar.cc/50?u=44', ultimaMensagem: 'Te mandei o link.' },
                ]);
                // --- Fim do Mock ---

            } catch (error) {
                console.error("Erro ao buscar dados iniciais:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                     onLogout(); // Logout se token inválido
                }
            } finally {
                setLoadingConversas(false);
            }
        };

        fetchInitialData();

        // Configurar WebSocket (Stomp) aqui no futuro
        // return () => { stompClient.current?.disconnect(); }
    }, [onLogout]);

    // Efeito para rolar para a última mensagem
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]); // Roda sempre que as mensagens mudarem

    // ✅ INTEGRAÇÃO: Busca mensagens ao selecionar conversa
    const selecionarConversa = async (conversaId) => {
        if (conversaId === conversaAtivaId) return; // Já está ativa

        setConversaAtivaId(conversaId);
        setLoadingMensagens(true);
        setMensagens([]); // Limpa mensagens antigas
        try {
            // --- Substituir por chamada real à API de mensagens da conversa ---
            // const mensagensRes = await axios.get(`http://localhost:8080/api/mensagens/${conversaId}`);
            // setMensagens(mensagensRes.data);
            // Mock por enquanto:
            if (conversaId === 2) {
                 setMensagens([
                    { id: 101, autorId: 2, texto: "E aí, tudo certo?", hora: "14:50" },
                    { id: 102, autorId: currentUser?.id, texto: "Opa, tudo joia e você?", hora: "14:51" }, // Usa ID do usuário logado
                     { id: 103, autorId: 2, texto: "Tranquilo! Viu a última vaga que postaram?", hora: "14:52" },
                     { id: 104, autorId: currentUser?.id, texto: "Vi sim, parece interessante!", hora: "14:53" },
                ]);
            } else {
                 setMensagens([{ id: 201, autorId: 3, texto: "Primeira mensagem nesta conversa.", hora: "Ontem"}]);
            }
             // --- Fim do Mock ---
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
            // Agora o Swal está definido e pode ser usado
            Swal.fire('Erro', 'Não foi possível carregar as mensagens.', 'error');
             if (error.response?.status === 401 || error.response?.status === 403) {
                 onLogout(); // Logout se token inválido
             }
        } finally {
             setLoadingMensagens(false);
        }
    };

    // ✅ INTEGRAÇÃO: Envia nova mensagem (requer API e WebSocket)
    const handleEnviarMensagem = (e) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !conversaAtivaId || !currentUser) return;

        const mensagemParaEnviar = {
            // idConversa: conversaAtivaId, // ou destinatarioId se for DM
            autorId: currentUser.id,
            texto: novaMensagem,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) // Hora local (mock)
        };

        // --- Lógica WebSocket (futura) ---
        // stompClient.current.send(`/app/chat/${conversaAtivaId}`, {}, JSON.stringify(mensagemParaEnviar));

        // --- Atualização otimista da UI (adiciona mensagem localmente) ---
        setMensagens(prev => [...prev, mensagemParaEnviar]);
        setNovaMensagem(''); // Limpa o estado

        // Limpar input visualmente após envio
        e.target.elements.messageInput.value = '';
    };

    const conversaAtiva = conversas.find(c => c.id === conversaAtivaId);

    return (
        <div className="layout-mensagens"> {/* Usa div raiz para layout */}
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            {/* Container principal ajustado */}
            <div className="container container-chat">
                <Sidebar currentUser={currentUser}/>

                {/* --- Sidebar de Conversas --- */}
                <aside className="chat-conversations-sidebar">
                    <div className="conv-sidebar-header">
                        <h2>Mensagens</h2>
                        {/* Adicionar botão de nova conversa futuramente */}
                    </div>
                    <div className="conv-search">
                         <FontAwesomeIcon icon={faSearch} />
                         <input type="text" placeholder="Pesquisar conversas..." />
                    </div>
                    <div className="conversations-list">
                        {loadingConversas ? <p className="loading-state">Carregando...</p> :
                            conversas.length > 0 ? (
                                conversas.map(c => (
                                    <ConversationListItem
                                        key={c.id}
                                        conversa={c}
                                        ativa={conversaAtivaId === c.id}
                                        onClick={() => selecionarConversa(c.id)}
                                    />
                                ))
                            ) : <p className="empty-state">Nenhuma conversa encontrada.</p>
                        }
                    </div>
                </aside>

                {/* --- Área Principal do Chat --- */}
                <main className="chat-main-area">
                   {conversaAtivaId ? (
                        <div className="chat-active-card">
                            {/* Cabeçalho do Chat Ativo */}
                            <header className="chat-header-area">
                                <div className="chat-header-info">
                                    <img src={conversaAtiva?.avatar || `https://i.pravatar.cc/40?u=${conversaAtivaId}`} className="avatar" alt="avatar" />
                                    <h3>{conversaAtiva?.nome || 'Carregando...'}</h3>
                                    {/* Adicionar status online/offline se disponível */}
                                </div>
                                <button className="chat-options-btn">
                                    <FontAwesomeIcon icon={faEllipsisV} />
                                </button>
                            </header>

                            {/* Mensagens */}
                            <div className="chat-messages-area">
                                {loadingMensagens ? <p className="loading-state">Carregando mensagens...</p> :
                                    mensagens.map((msg, index) => (
                                        <MessageBubble
                                            key={msg.id || index} // Usa ID da mensagem se disponível
                                            mensagem={msg}
                                            isMe={msg.autorId === currentUser?.id}
                                        />
                                    ))
                                }
                                {/* Elemento invisível para ajudar no scroll */}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input de Mensagem */}
                            <form className="chat-input-area" onSubmit={handleEnviarMensagem}>
                                <input
                                    type="text"
                                    name="messageInput" // Nome para referenciar no submit
                                    placeholder="Digite uma mensagem..."
                                    value={novaMensagem} // Controlado pelo estado
                                    onChange={(e) => setNovaMensagem(e.target.value)}
                                    autoComplete="off"
                                />
                                <button type="submit" disabled={!novaMensagem.trim()}>
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </button>
                            </form>
                        </div>
                   ) : (
                       <div className="empty-chat-view">
                            {/* Ilustração SVG inline ou importada */}
                            <svg width="150" height="150" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{opacity: 0.3, marginBottom: '1.5rem'}}>
                                <path d="M16.8 13.4147C17.411 13.4147 17.957 13.1417 18.441 12.6577C18.925 12.1737 19.199 11.6277 19.199 11.0157C19.199 10.4037 18.925 9.85873 18.441 9.37373C17.957 8.88973 17.411 8.61573 16.8 8.61573H7.199C6.588 8.61573 6.042 8.88973 5.558 9.37373C5.074 9.85873 4.799 10.4037 4.799 11.0157C4.799 11.6277 5.074 12.1737 5.558 12.6577C6.042 13.1417 6.588 13.4147 7.199 13.4147H16.8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M12 17.0147H7.199C6.588 17.0147 6.042 16.7417 5.558 16.2577C5.074 15.7737 4.799 15.2277 4.799 14.6157C4.799 14.0037 5.074 13.4587 5.558 12.9737C6.042 12.4897 6.588 12.2157 7.199 12.2157H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M21.6 11.0147V16.6147C21.6 18.3117 20.916 19.5097 19.548 20.2087C18.18 20.9077 16.584 21.0147 14.76 20.5287L11.7 19.6417C8.748 18.8417 5.999 18.8417 3 19.6417L1.8 19.9867C1.487 20.0767 1.156 20.0207 0.88 19.8317C0.604 19.6427 0.466 19.3497 0.466 18.9527V6.01473C0.466 4.31773 1.15 3.11973 2.518 2.42073C3.886 1.72173 5.482 1.61473 7.306 2.10073L10.366 2.98773C13.318 3.78773 16.067 3.78773 19.019 2.98773L20.219 2.64273C20.532 2.55273 20.863 2.59973 21.139 2.78873C21.415 2.97773 21.553 3.27073 21.553 3.66773L21.6 11.0147Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                           <h3>Selecione uma conversa</h3>
                           <p>Escolha um amigo ou grupo para começar a conversar.</p>
                       </div>
                   )}
                </main>
            </div>
        </div>
    );
};

export default Mensagens;