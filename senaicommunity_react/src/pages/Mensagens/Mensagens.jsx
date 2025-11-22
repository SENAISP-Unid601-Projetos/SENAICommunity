// src/pages/Mensagens/Mensagens.jsx (CORRIGIDO FINAL - V2)

import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar.jsx'; 
import Sidebar from '../../components/Layout/Sidebar.jsx';
import Swal from 'sweetalert2';
import './Mensagens.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPaperPlane, faEllipsisV, faSearch, faSpinner, 
    faArrowLeft, faTrash, faPen, faTimes, faPaperclip, faReply, faCode, faCopy, faCheckCircle, faPoll, faCalendarAlt, faRobot
} from '@fortawesome/free-solid-svg-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx'; 
import { MentionsInput, Mention } from 'react-mentions';
import './mentions-style.css';

import EditarMensagemModal from './EditarMensagemModal.jsx';
import InfoSidebar from './InfoSidebar.jsx';
import CodeSnippetModal from './CodeSnippetModal.jsx';
import PollModal from './PollModal.jsx';
import ScheduleMeetingModal from './ScheduleMeetingModal.jsx';
import SidekickModal from './SidekickModal.jsx';
import IaConversationDisplay from './IaConversationDisplay.jsx';

// Função helper de imagem
const getCorrectUserImageUrl = (url, fallbackId) => {
    const defaultAvatar = 'http://localhost:8080/images/default-avatar.png';
    if (!url) return defaultAvatar; 
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/arquivos/') || url.startsWith('/images/')) return `http://localhost:8080${url}`;
    return `http://localhost:8080/api/arquivos/${url}`;
};

// --- COMPONENTE CONVERSATIONListItem ---
const ConversationListItem = ({ conversa, ativa, onClick }) => (
    <div
        className={`convo-list-item ${ativa ? 'selected' : ''}`}
        onClick={onClick}
    >
        <div className="avatar-container">
            <img
                src={conversa.avatar}
                className="avatar"
                alt="avatar"
                onError={(e) => {
                    e.target.onerror = null; 
                    if (conversa.tipo === 'grupo') {
                        e.target.src = `https://placehold.co/50/30363d/8b949e?text=${conversa.nome.substring(0, 2)}`;
                    } else {
                        e.target.src = 'http://localhost:8080/images/default-avatar.png';
                    }
                }}
            />
            {conversa.online && <span className="online-indicator"></span>}
        </div>
        <div className="convo-info">
            <div className="convo-title">{conversa.nome}</div>
            <div className="convo-snippet">{conversa.ultimaMensagem || 'Nenhuma mensagem ainda'}</div>
        </div>
    </div>
);

// --- COMPONENTE MessageBubble ---
const MessageBubble = ({ mensagem, isMe, currentUser, onDeleteClick, onEditClick, onReactClick, onReplyClick, onMarkAsSolution, onVote, onConfirm, onDecline, reactions }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);
    
    const hasBeenEdited = mensagem.dataEdicao && new Date(mensagem.dataEnvio).getTime() !== new Date(mensagem.dataEdicao).getTime();
    const aggregatedReactions = (reactions || []).reduce((acc, emoji) => {
        const found = acc.find(r => r.emoji === emoji);
        if (found) { found.count++; } else { acc.push({ emoji, count: 1 }); }
        return acc;
    }, []);

    const handleReact = (emoji) => {
        onReactClick(mensagem, emoji);
        setMenuOpen(false);
    };

    const isGrupo = mensagem.tipo === 'grupo';
    const showAuthorInfo = isGrupo && !isMe; 
    const authorPhoto = showAuthorInfo 
        ? getCorrectUserImageUrl(mensagem.fotoAutorUrl, mensagem.autorId) 
        : null;

    const renderContent = () => {
        const codeBlockRegex = /```(\w+)\n([\s\S]+)```/;
        const codeMatch = mensagem.conteudo.match(codeBlockRegex);

        if (codeMatch) {
            const language = codeMatch[1];
            const code = codeMatch[2];
            return (
                <div className="code-snippet">
                    <button onClick={() => navigator.clipboard.writeText(code)} className="copy-code-btn">
                        <FontAwesomeIcon icon={faCopy} /> Copiar
                    </button>
                    <SyntaxHighlighter language={language} style={coldarkDark} showLineNumbers>
                        {code}
                    </SyntaxHighlighter>
                </div>
            );
        }

        const urlRegex = /\[(imagem|arquivo)\]\((http[^)]+)\)/;
        const urlMatch = mensagem.conteudo.match(urlRegex);

        if (urlMatch) {
            const type = urlMatch[1];
            const url = urlMatch[2];

            if (type === 'imagem') {
                return <img src={url} alt="Imagem enviada" className="message-image" />;
            } else {
                const fileName = url.substring(url.lastIndexOf('/') + 1);
                return (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="message-file-link">
                        Baixar Arquivo: {fileName}
                    </a>
                );
            }
        }
        
        const pollRegex = /\[poll\](.+)/;
        const pollMatch = mensagem.conteudo.match(pollRegex);
        if (pollMatch) {
            try {
                const pollData = JSON.parse(pollMatch[1]);
                return <PollDisplay pollData={pollData} onVote={(optionIndex) => onVote(mensagem, optionIndex)} />;
            } catch (error) { return <p className="message-text">Erro ao exibir enquete.</p>; }
        }

        const meetingRegex = /\[meeting\](.+)/;
        const meetingMatch = mensagem.conteudo.match(meetingRegex);
        if (meetingMatch) {
            try {
                const meetingData = JSON.parse(meetingMatch[1]);
                return <MeetingDisplay meetingData={meetingData} onConfirm={() => onConfirm(mensagem, currentUser.nome)} onDecline={() => onDecline(mensagem, currentUser.nome)} />;
            } catch (error) { return <p className="message-text">Erro ao exibir reunião.</p>; }
        }

        const iaConversationRegex = /\[ia-conversation\](.+)/;
        const iaMatch = mensagem.conteudo.match(iaConversationRegex);
        if (iaMatch) {
            try {
                const conversationData = JSON.parse(iaMatch[1]);
                return <IaConversationDisplay conversationData={conversationData} authorName={mensagem.nomeAutor} />;
            } catch (error) { return <p className="message-text">Erro ao exibir conversa da IA.</p>; }
        }

        return <p className="message-text">{mensagem.conteudo}</p>;
    };

    return (
     <div className={`message-bubble-wrapper ${isMe ? 'me' : 'other'} ${isGrupo ? 'grupo' : 'dm'} ${mensagem.isSolution ? 'solution' : ''}`}>
        {showAuthorInfo && (
            <img 
                src={authorPhoto} 
                alt={mensagem.nomeAutor} 
                className="message-author-avatar" 
                onError={(e) => { 
                    e.target.onerror = null; 
                    e.target.src = 'http://localhost:8080/images/default-avatar.png';
                }}
            />
        )}
        <div className="message-bubble">
            <div className="message-menu-trigger" onClick={(e) => {
                e.stopPropagation(); 
                setMenuOpen(prev => !prev);
            }}>
                <FontAwesomeIcon icon={faEllipsisV} />
            </div>
            {menuOpen && (
                <div className="message-menu-dropdown" ref={menuRef}>
                    {isMe && (
                        <>
                            <button onClick={() => { onEditClick(mensagem); setMenuOpen(false); }}>
                                <FontAwesomeIcon icon={faPen} /> Editar
                            </button>
                            <button className="danger" onClick={() => { onDeleteClick(mensagem); setMenuOpen(false); }}>
                                <FontAwesomeIcon icon={faTrash} /> Excluir
                            </button>
                        </>
                    )}
                    <button onClick={() => { onReplyClick(mensagem); setMenuOpen(false); }}>
                        <FontAwesomeIcon icon={faReply} /> Responder
                    </button>
                    {!isMe && (
                        <>
                            <button onClick={() => { onMarkAsSolution(mensagem); setMenuOpen(false); }}>
                                <FontAwesomeIcon icon={faCheckCircle} /> Marcar como Solução
                            </button>
                            <div className="emoji-react-list">
                                {emojis.map(emoji => (
                                <span key={emoji} className="emoji-react-item" onClick={() => handleReact(emoji)}>
                                    {emoji}
                                </span>
                            ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            {showAuthorInfo && (
                <strong className="message-author">{mensagem.nomeAutor || 'Sistema'}</strong>
            )}
            {mensagem.replyToMessage && <ReplyPreviewBubble message={mensagem.replyToMessage} />}
            {renderContent()}
            <span className="message-time">
                {hasBeenEdited && <span className="edited-indicator">(editado) </span>}
                {new Date(mensagem.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
        {aggregatedReactions.length > 0 && (
            <div className="message-reactions">
                {aggregatedReactions.map(r => (
                    <span key={r.emoji} className="reaction-pill">
                        {r.emoji} {r.count > 1 && <span className="reaction-count">{r.count}</span>}
                    </span>
                ))}
            </div>
        )}
     </div>
    );
};

const MeetingDisplay = ({ meetingData, onConfirm, onDecline }) => {
    return (
        <div className="meeting-display">
            <h4>{meetingData.title}</h4>
            <p>{new Date(meetingData.dateTime).toLocaleString('pt-BR')}</p>
            <div className="meeting-actions">
                <button onClick={onConfirm} className="btn btn-primary">Confirmar Presença</button>
                <button onClick={onDecline} className="btn btn-secondary">Recusar</button>
            </div>
            <div className="attendees">
                <strong>Participantes:</strong>
                <ul>
                    {meetingData.attendees.map((attendee, index) => (
                        <li key={index}>{attendee}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const PollDisplay = ({ pollData, onVote }) => {
    const totalVotes = pollData.options.reduce((acc, opt) => acc + opt.votes, 0);
    return (
        <div className="poll-display">
            <h4>{pollData.question}</h4>
            <div className="poll-options">
                {pollData.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    return (
                        <button key={index} onClick={() => onVote(index)} className="poll-option-btn">
                            <div className="poll-option-info">
                                <span>{option.option}</span>
                                <span>{`${Math.round(percentage)}%`}</span>
                            </div>
                            <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
                        </button>
                    );
                })}
            </div>
            <span className="total-votes">{totalVotes} votos</span>
        </div>
    );
};

const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
        const date = new Date(message.dataEnvio);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        let dayKey;
        if (date.toDateString() === today.toDateString()) { dayKey = 'Hoje'; }
        else if (date.toDateString() === yesterday.toDateString()) { dayKey = 'Ontem'; }
        else { dayKey = date.toLocaleDateString('pt-BR'); }

        if (!groups[dayKey]) { groups[dayKey] = []; }
        groups[dayKey].push(message);
    });
    return groups;
};

const ReplyPreviewBubble = ({ message }) => {
    if (!message) return null;
    return (
        <div className="reply-preview-bubble">
            <strong>{message.nomeAutor}</strong>
            <p>{message.conteudo}</p>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const Mensagens = ({ onLogout }) => {
    const [conversas, setConversas] = useState([]);
    const [conversaAtiva, setConversaAtiva] = useState(null); 
    const [mensagens, setMensagens] = useState([]);
    const [loadingConversas, setLoadingConversas] = useState(true);
    const [loadingMensagens, setLoadingMensagens] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    
    // ✅ NOME CORRETO DA VARIÁVEL DE ESTADO
    const [mensagensPage, setMensagensPage] = useState(0); 
    
    const [hasMoreMensagens, setHasMoreMensagens] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modais
    const [isCodeSnippetModalOpen, setIsCodeSnippetModalOpen] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isScheduleMeetingModalOpen, setIsScheduleMeetingModalOpen] = useState(false);
    const [isSidekickModalOpen, setIsSidekickModalOpen] = useState(false);

    const { stompClient, isConnected } = useWebSocket(); 
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    
    // Referência para controlar o scroll
    const previousScrollHeightRef = useRef(0);

    const location = useLocation();
    const navigate = useNavigate();

    const filteredMessages = useMemo(() => {
        if (!searchTerm) return mensagens;
        return mensagens.filter(msg =>
            msg.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [mensagens, searchTerm]);

    const mentionData = useMemo(() => {
        return conversaAtiva?.membros?.map(membro => ({
            id: String(membro.id), 
            display: membro.nome,
        })) || [];
    }, [conversaAtiva]);

    const solutionMessage = useMemo(() => {
        return mensagens.find(msg => msg.isSolution);
    }, [mensagens]);

    const fetchConversas = useCallback(async () => {
        setLoadingConversas(true);
        try {
            const projetosRes = await axios.get('http://localhost:8080/projetos/meus-projetos');
            const conversasGrupos = projetosRes.data.map(proj => ({
                id: proj.id, 
                nome: proj.titulo,
                tipo: 'grupo',
                avatar: proj.imagemUrl || `https://placehold.co/50/30363d/8b949e?text=${proj.titulo.substring(0, 2)}`,
                ultimaMensagem: 'Chat do projeto', 
            }));
            const amigosRes = await axios.get('http://localhost:8080/api/amizades/');
            const validAmigos = amigosRes.data.filter(amigo => amigo && amigo.idUsuario);
            const conversasDMs = validAmigos.map(amigo => ({
                id: amigo.idUsuario, 
                nome: amigo.nome,
                tipo: 'dm',
                avatar: getCorrectUserImageUrl(amigo.fotoPerfil, amigo.idUsuario), 
                ultimaMensagem: 'Conversa privada', 
            }));
            const todasConversas = [...conversasGrupos, ...conversasDMs];
            setConversas(todasConversas);
            return todasConversas; 
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
            if (error.response?.status === 401) onLogout();
            return [];
        } finally {
            setLoadingConversas(false); 
        }
    }, [onLogout]);

    const selecionarConversa = useCallback(async (conversa, user, atualizarUrl = true) => {
        if (!conversa) return;
        setConversaAtiva(conversa);
        setLoadingMensagens(true);
        setMensagens([]);
        setMensagensPage(0);
        setHasMoreMensagens(true);
        setIsEditModalOpen(false);
        setMessageToEdit(null);
        
        if (atualizarUrl) {
            const params = new URLSearchParams();
            params.set(conversa.tipo === 'grupo' ? 'grupo' : 'dm', conversa.id);
            navigate(`/mensagens?${params.toString()}`, { replace: true });
        }

        try {
            let endpoint = '';
            let conversaAtualizada = { ...conversa };

            if (conversa.tipo === 'grupo') {
                endpoint = `http://localhost:8080/api/chat/grupo/${conversa.id}`;
                try {
                    const projetoRes = await axios.get(`http://localhost:8080/projetos/${conversa.id}`);
                    conversaAtualizada = {
                        ...conversa,
                        descricao: projetoRes.data.descricao,
                        membros: projetoRes.data.membros,
                    };
                    setConversaAtiva(conversaAtualizada);
                } catch (err) { console.error("Erro detalhes grupo:", err); }
            } else {
                endpoint = `http://localhost:8080/api/chat/privado/${user.id}/${conversa.id}`;
            }

            const mensagensRes = await axios.get(endpoint);
            const msgsFormatadas = mensagensRes.data.map((msg) => ({ ...msg, tipo: conversa.tipo }));
            setMensagens(msgsFormatadas);
            
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView();
            }, 100);

        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
            setConversaAtiva(null); 
            navigate('/mensagens', { replace: true });
        } finally {
            setLoadingMensagens(false);
        }
    }, [navigate]);

    useEffect(() => {
        document.title = 'Senai Community | Mensagens';
        const token = localStorage.getItem('authToken');
        if (!token) { onLogout(); return; }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const fetchInitialData = async () => {
            try {
                const userRes = await axios.get('http://localhost:8080/usuarios/me');
                const userData = userRes.data; 
                setCurrentUser(userData); 
                const todasConversas = await fetchConversas(); 
                
                const params = new URLSearchParams(location.search);
                const grupoIdQuery = params.get('grupo');
                const dmIdQuery = params.get('dm');
                let chatParaAbrir = null;

                if (grupoIdQuery && todasConversas.length > 0) {
                    const id = parseInt(grupoIdQuery, 10);
                    chatParaAbrir = todasConversas.find((c) => c.id === id && c.tipo === 'grupo');
                } else if (dmIdQuery && todasConversas.length > 0) {
                    const id = parseInt(dmIdQuery, 10);
                    chatParaAbrir = todasConversas.find((c) => c.id === id && c.tipo === 'dm');
                }

                if (chatParaAbrir) {
                    selecionarConversa(chatParaAbrir, userData, false);
                }
            } catch (error) {
                if (error.response?.status === 401) onLogout();
            }
        };
        fetchInitialData();
    }, [onLogout, location.search, fetchConversas, selecionarConversa]);

    const loadMoreMessages = useCallback(async () => {
        if (loadingMensagens || !hasMoreMensagens) return;

        setLoadingMensagens(true);
        const nextPage = mensagensPage + 1; // ✅ Aqui usa mensagensPage (correto)

        if (messagesContainerRef.current) {
            previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        }

        try {
            let endpoint = '';
            if (conversaAtiva.tipo === 'grupo') {
                endpoint = `http://localhost:8080/api/chat/grupo/${conversaAtiva.id}?page=${nextPage}`;
            } else {
                endpoint = `http://localhost:8080/api/chat/privado/${currentUser.id}/${conversaAtiva.id}?page=${nextPage}`;
            }

            const res = await axios.get(endpoint);
            const novasMensagens = res.data.map(msg => ({ ...msg, tipo: conversaAtiva.tipo }));

            if (novasMensagens.length === 0) {
                setHasMoreMensagens(false);
            } else {
                setMensagens(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const filtered = novasMensagens.filter(m => !existingIds.has(m.id));

                    if (filtered.length === 0) {
                        setHasMoreMensagens(false);
                        return prev;
                    }
                    return [...filtered, ...prev];
                });
                setMensagensPage(nextPage); // ✅ Aqui usa setMensagensPage (correto)
            }
        } catch (error) {
            console.error("Erro ao carregar mais mensagens:", error);
        } finally {
            setLoadingMensagens(false);
        }
    }, [loadingMensagens, hasMoreMensagens, mensagensPage, conversaAtiva, currentUser]);

    // ✅ EFEITO PARA RESTAURAR SCROLL AO SUBIR (CORRIGIDO AGORA)
    useLayoutEffect(() => {
        // ✅ CORREÇÃO: mensagensPage agora está escrito corretamente em todo lugar
        if (messagesContainerRef.current && previousScrollHeightRef.current > 0 && mensagensPage > 0) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            const heightDifference = newScrollHeight - previousScrollHeightRef.current;
            messagesContainerRef.current.scrollTop = heightDifference;
            previousScrollHeightRef.current = 0;
        }
    }, [mensagens, mensagensPage]); 

    useEffect(() => {
        const handleScroll = () => {
            if (messagesContainerRef.current && messagesContainerRef.current.scrollTop === 0) {
                loadMoreMessages();
            }
        };
        const container = messagesContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [loadMoreMessages]);


    useEffect(() => {
        if (isConnected && stompClient && conversaAtiva && currentUser) {
            const topicToSubscribe = conversaAtiva.tipo === 'grupo'
                ? `/topic/grupo/${conversaAtiva.id}` 
                : `/user/queue/mensagens-privadas`; 

            const subscription = stompClient.subscribe(topicToSubscribe, (message) => {
                const payload = JSON.parse(message.body);
                
                const isForActiveChat = (() => {
                    if (conversaAtiva.tipo === 'grupo') {
                        return payload.grupoId === conversaAtiva.id;
                    } else {
                        const partnerId = conversaAtiva.id;
                        const isDMMessage = (payload.remetenteId === partnerId && payload.destinatarioId === currentUser.id) || 
                                            (payload.remetenteId === currentUser.id && payload.destinatarioId === partnerId);
                        return isDMMessage || payload.tipo === 'remocao';
                    }
                })();

                if (payload.tipo === 'notificacao_mencao' && payload.mencionadoId === currentUser.id) {
                     Swal.fire({
                        toast: true, position: 'top-end', icon: 'info',
                        title: `Mencionado em #${payload.nomeGrupo}`,
                        showConfirmButton: false, timer: 5000, timerProgressBar: true,
                    });
                    return;
                }

                if (!isForActiveChat) return;

                if (payload.tipo === 'remocao') {
                    setMensagens((prev) => prev.filter(m => m.id !== payload.id));
                } else {
                    setMensagens((prev) => {
                        const existingIndex = prev.findIndex(m => m.id === payload.id);
                        const messageWithContext = { ...payload, tipo: conversaAtiva.tipo };
                        if (existingIndex > -1) {
                            return prev.map((m, index) => index === existingIndex ? messageWithContext : m);
                        } else {
                            return [...prev, messageWithContext];
                        }
                    });
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [isConnected, stompClient, conversaAtiva, currentUser]);

    const handleEnviarMensagem = async (e) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !conversaAtiva || !currentUser || !stompClient || !isConnected) return;
        
        const endpoint = conversaAtiva.tipo === 'grupo'
            ? `/app/grupo/${conversaAtiva.id}`
            : `/app/chat/privado/${conversaAtiva.id}`;

        const baseMessage = { conteudo: novaMensagem, replyToId: replyingTo ? replyingTo.id : null };
        const mensagemParaEnviar = conversaAtiva.tipo === 'grupo' ? { ...baseMessage } : { ...baseMessage, destinatarioId: conversaAtiva.id };

        setNovaMensagem('');
        setReplyingTo(null);
        
        try {
            stompClient.publish({ destination: endpoint, body: JSON.stringify(mensagemParaEnviar) });
        } catch (error) {
             console.error("Erro WebSocket:", error);
             Swal.fire('Erro', 'Falha ao enviar mensagem.', 'error');
             setNovaMensagem(mensagemParaEnviar.conteudo); 
        }
    };

    const handleDeleteMessage = async (mensagem) => {
        const result = await Swal.fire({
            title: 'Excluir mensagem?', text: "Esta ação não pode ser desfeita.",
            icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sim, excluir!'
        });
        if (result.isConfirmed) {
            if (conversaAtiva.tipo === 'grupo') {
                if (!stompClient || !isConnected) return Swal.fire('Erro', 'Sem conexão.', 'error');
                stompClient.publish({ destination: `/app/grupo/${mensagem.id}/excluir` });
            } else {
                try { await axios.delete(`http://localhost:8080/api/chat/privado/${mensagem.id}`); } 
                catch (error) { Swal.fire('Erro', 'Não foi possível excluir.', 'error'); }
            }
        }
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await axios.post('http://localhost:8080/api/arquivos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const messageType = file.type.startsWith('image/') ? 'imagem' : 'arquivo';
            const messageContent = `[${messageType}](${response.data})`;
            const endpoint = conversaAtiva.tipo === 'grupo' ? `/app/grupo/${conversaAtiva.id}` : `/app/chat/privado/${conversaAtiva.id}`;
            const msg = conversaAtiva.tipo === 'grupo' ? { conteudo: messageContent } : { conteudo: messageContent, destinatarioId: conversaAtiva.id };
            stompClient.publish({ destination: endpoint, body: JSON.stringify(msg) });
        } catch (e) { Swal.fire('Erro', 'Upload falhou.', 'error'); }
    };

    const handleFileSelect = (event) => { if (event.target.files[0]) handleUpload(event.target.files[0]); };
    const handleReplyToMessage = (mensagem) => { setReplyingTo(mensagem); };

    const handleSendMeeting = (title, dateTime) => { 
        const msg = { conteudo: `[meeting]${JSON.stringify({title, dateTime, attendees:[]})}` };
        if(conversaAtiva.tipo !== 'grupo') msg.destinatarioId = conversaAtiva.id;
        const end = conversaAtiva.tipo === 'grupo' ? `/app/grupo/${conversaAtiva.id}` : `/app/chat/privado/${conversaAtiva.id}`;
        stompClient.publish({ destination: end, body: JSON.stringify(msg) });
    };

    const handleConfirmMeeting = (mensagem, userName) => {
        const meetingMatch = mensagem.conteudo.match(/\[meeting\](.+)/);
        if (!meetingMatch) return;
        try {
            const meetingData = JSON.parse(meetingMatch[1]);
            if (!meetingData.attendees.includes(userName)) {
                meetingData.attendees.push(userName);
                const updatedContent = `[meeting]${JSON.stringify(meetingData)}`;
                handleSaveEdit(mensagem, updatedContent);
            }
        } catch (e) { console.error(e); }
    };

    const handleDeclineMeeting = (mensagem, userName) => {
        const meetingMatch = mensagem.conteudo.match(/\[meeting\](.+)/);
        if (!meetingMatch) return;
        try {
            const meetingData = JSON.parse(meetingMatch[1]);
            if (meetingData.attendees.includes(userName)) {
                meetingData.attendees = meetingData.attendees.filter(a => a !== userName);
                const updatedContent = `[meeting]${JSON.stringify(meetingData)}`;
                handleSaveEdit(mensagem, updatedContent);
            }
        } catch (e) { console.error(e); }
    };

    const handleVote = async (mensagem, optionIndex) => { try { await axios.post(`http://localhost:8080/api/chat/mensagens/${mensagem.id}/vote/${optionIndex}`); } catch(e){} };
    
    const handleSendPoll = (question, options) => {
        const msg = { conteudo: `[poll]${JSON.stringify({question, options: options.map(o=>({option:o, votes:0}))})}` };
        if(conversaAtiva.tipo !== 'grupo') msg.destinatarioId = conversaAtiva.id;
        const end = conversaAtiva.tipo === 'grupo' ? `/app/grupo/${conversaAtiva.id}` : `/app/chat/privado/${conversaAtiva.id}`;
        stompClient.publish({ destination: end, body: JSON.stringify(msg) });
    };

    const handleMarkAsSolution = async (mensagem) => {
         try { await axios.post(`http://localhost:8080/api/chat/mensagens/${mensagem.id}/marcar-solucao`); setMensagens(p => p.map(m => m.id === mensagem.id ? { ...m, isSolution: true } : m)); } catch (e) {}
    };

    const handleSendCodeSnippet = (code, language) => {
        const msg = { conteudo: `\`\`\`${language}\n${code}\n\`\`\`` };
        if(conversaAtiva.tipo !== 'grupo') msg.destinatarioId = conversaAtiva.id;
        const end = conversaAtiva.tipo === 'grupo' ? `/app/grupo/${conversaAtiva.id}` : `/app/chat/privado/${conversaAtiva.id}`;
        stompClient.publish({ destination: end, body: JSON.stringify(msg) });
    };

    const handleSendIaConversation = (log) => {
         const msg = { conteudo: `[ia-conversation]${JSON.stringify(log)}` };
         if(conversaAtiva.tipo !== 'grupo') msg.destinatarioId = conversaAtiva.id;
         const end = conversaAtiva.tipo === 'grupo' ? `/app/grupo/${conversaAtiva.id}` : `/app/chat/privado/${conversaAtiva.id}`;
         stompClient.publish({ destination: end, body: JSON.stringify(msg) });
    };

    const handleOpenEditModal = (mensagem) => { setMessageToEdit(mensagem); setIsEditModalOpen(true); };

    const handleSaveEdit = async (mensagem, novoConteudo) => {
        if (conversaAtiva.tipo === 'grupo') {
            try { stompClient.publish({ destination: `/app/grupo/${mensagem.id}/editar`, body: novoConteudo }); } catch (e) { Swal.fire('Erro', 'Falha ao editar.', 'error'); }
        } else {
            try { await axios.put(`http://localhost:8080/api/chat/privado/${mensagem.id}`, { conteudo: novoConteudo }); } catch (e) { Swal.fire('Erro', 'Falha ao editar.', 'error'); }
        }
    };

    const handleSendReaction = (mensagem, emoji) => {
        setMensagens(prev => prev.map(m => m.id === mensagem.id ? { ...m, reactions: [...(m.reactions || []), emoji] } : m));
    };

    const handleVoltarParaLista = () => { setConversaAtiva(null); navigate('/mensagens', { replace: true }); };
    const toggleInfoSidebar = () => { setIsInfoSidebarOpen(prev => !prev); };

    return (
        <div className="layout-mensagens">
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className={`container container-chat ${isInfoSidebarOpen ? 'sidebar-info-open' : ''}`}>
                <Sidebar currentUser={currentUser}/>
                <aside className={`chat-conversations-sidebar ${conversaAtiva ? 'hidden-mobile' : ''}`}>
                    <div className="conv-sidebar-header"><h2>Mensagens</h2></div>
                    <div className="conv-search">
                         <FontAwesomeIcon icon={faSearch} />
                         <input type="text" placeholder="Pesquisar conversas..." />
                    </div>
                    <div className="conversations-list">
                        {loadingConversas ? <p className="loading-state"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</p> :
                            conversas.length > 0 ? conversas.map(c => (
                                <ConversationListItem key={`${c.tipo}-${c.id}`} conversa={c} ativa={conversaAtiva?.id === c.id && conversaAtiva?.tipo === c.tipo} onClick={() => selecionarConversa(c, currentUser)} />
                            )) : <p className="empty-state">Nenhuma conversa encontrada.</p>
                        }
                    </div>
                </aside>
                <main className={`chat-main-area ${!conversaAtiva ? 'hidden-mobile' : ''}`}>
                   {conversaAtiva ? (
                        <div className="chat-active-card">
                            <header className="chat-header-area">
                                <button className="chat-back-btn" onClick={handleVoltarParaLista}><FontAwesomeIcon icon={faArrowLeft} /></button>
                                <div className="chat-header-info">
                                    <img src={conversaAtiva.avatar} className="avatar" alt="avatar" onError={(e) => { e.target.onerror = null; e.target.src = 'http://localhost:8080/images/default-avatar.png'; }} />
                                    <div className="chat-header-details">
                                        <h3>{conversaAtiva.nome}</h3>
                                        {conversaAtiva.online && <span className="status-indicator online">Online</span>}
                                    </div>
                                </div>
                                {solutionMessage && (
                                    <div className="solution-link-container">
                                        <a href={`#message-${solutionMessage.id}`} className="solution-link"><FontAwesomeIcon icon={faCheckCircle} /> Ver Solução</a>
                                    </div>
                                )}
                                <div className="chat-header-actions">
                                    <div className="search-bar">
                                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                        {searchTerm ? <button onClick={() => setSearchTerm('')} className="clear-search-btn"><FontAwesomeIcon icon={faTimes} /></button> : <FontAwesomeIcon icon={faSearch} />}
                                    </div>
                                    <button className="chat-options-btn" onClick={() => setIsSidekickModalOpen(true)}><FontAwesomeIcon icon={faRobot} /></button>
                                    <button className="chat-options-btn" onClick={toggleInfoSidebar}><FontAwesomeIcon icon={faEllipsisV} /></button>
                                </div>
                            </header>
                             <div className="chat-messages-area" ref={messagesContainerRef}>
                                {loadingMensagens && mensagens.length === 0 ? <p className="loading-state"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</p> :
                                    filteredMessages.length > 0 ? (
                                        Object.entries(groupMessagesByDate(filteredMessages)).map(([date, messagesOnDate]) => (
                                            <React.Fragment key={date}>
                                                <div className="date-separator"><span>{date}</span></div>
                                                {messagesOnDate.map((msg, index) => (
                                                    <MessageBubble
                                                        key={msg.id || index}
                                                        mensagem={msg}
                                                        isMe={msg.autorId === currentUser?.id || msg.remetenteId === currentUser?.id}
                                                        currentUser={currentUser}
                                                        onDeleteClick={handleDeleteMessage}
                                                        onEditClick={handleOpenEditModal}
                                                        onReplyClick={handleReplyToMessage}
                                                        onMarkAsSolution={handleMarkAsSolution}
                                                        onReactClick={handleSendReaction}
                                                        onVote={handleVote}
                                                        onConfirm={handleConfirmMeeting}
                                                        onDecline={handleDeclineMeeting}
                                                        reactions={msg.reactions || []}
                                                    />
                                                ))}
                                            </React.Fragment>
                                        ))
                                    ) : <p className="empty-state">Ainda não há mensagens.</p>
                                }
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="chat-input-wrapper">
                                {replyingTo && (
                                    <div className="reply-preview">
                                        <div className="reply-info"><strong>Respondendo a {replyingTo.nomeAutor}</strong><p>{replyingTo.conteudo}</p></div>
                                        <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn"><FontAwesomeIcon icon={faTimes} /></button>
                                    </div>
                                )}
                                <form className="chat-input-area" onSubmit={handleEnviarMensagem}>
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />
                                    <button type="button" className="chat-attach-btn" onClick={() => fileInputRef.current.click()} disabled={!isConnected}><FontAwesomeIcon icon={faPaperclip} /></button>
                                    <button type="button" className="chat-attach-btn" onClick={() => setIsCodeSnippetModalOpen(true)} disabled={!isConnected}><FontAwesomeIcon icon={faCode} /></button>
                                    <button type="button" className="chat-attach-btn" onClick={() => setIsPollModalOpen(true)} disabled={!isConnected}><FontAwesomeIcon icon={faPoll} /></button>
                                    <button type="button" className="chat-attach-btn" onClick={() => setIsScheduleMeetingModalOpen(true)} disabled={!isConnected}><FontAwesomeIcon icon={faCalendarAlt} /></button>
                                    <MentionsInput value={novaMensagem || ''} onChange={(event, newValue) => setNovaMensagem(newValue)} placeholder="Digite uma mensagem..." disabled={!isConnected} className="mentions-input">
                                        <Mention trigger="@" markup="@[__display__](__id__)" data={mentionData} className="mention" />
                                    </MentionsInput>
                                    <button type="submit" disabled={!novaMensagem.trim() || !isConnected}><FontAwesomeIcon icon={faPaperPlane} /></button>
                                 </form>
                            </div>
                        </div>
                   ) : (
                       <div className="empty-chat-view">
                           <h3>Selecione uma conversa</h3>
                       </div>
                   )}
                </main>
                {isInfoSidebarOpen && conversaAtiva && <InfoSidebar conversa={conversaAtiva} onClose={toggleInfoSidebar} />}
            </div>

            {isEditModalOpen && messageToEdit && <EditarMensagemModal mensagem={messageToEdit} onSave={handleSaveEdit} onClose={() => { setIsEditModalOpen(false); setMessageToEdit(null); }} />}
            {isCodeSnippetModalOpen && <CodeSnippetModal onSave={handleSendCodeSnippet} onClose={() => setIsCodeSnippetModalOpen(false)} />}
            {isPollModalOpen && <PollModal onSave={handleSendPoll} onClose={() => setIsPollModalOpen(false)} />}
            {isScheduleMeetingModalOpen && <ScheduleMeetingModal onSave={handleSendMeeting} onClose={() => setIsScheduleMeetingModalOpen(false)} />}
            {isSidekickModalOpen && <SidekickModal onSave={handleSendIaConversation} onClose={() => setIsSidekickModalOpen(false)} />}
        </div>
    );
};

export default Mensagens;