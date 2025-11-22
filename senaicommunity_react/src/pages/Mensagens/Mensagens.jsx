// src/pages/Mensagens/Mensagens.jsx (VERSÃO FINAL: SÓ DMs + ÁUDIO)

import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import axios from 'axios';
import Topbar from '../../components/Layout/Topbar.jsx'; 
import Sidebar from '../../components/Layout/Sidebar.jsx';
import Swal from 'sweetalert2';
import './Mensagens.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPaperPlane, faEllipsisV, faSearch, faSpinner, 
    faArrowLeft, faTrash, faPen, faTimes, faPaperclip, faReply, 
    faCopy, faCheckCircle, faPoll, faCalendarAlt, faMicrophone, faStop
} from '@fortawesome/free-solid-svg-icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { useLocation, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx'; 
import { MentionsInput, Mention } from 'react-mentions';
import './mentions-style.css';

import EditarMensagemModal from './EditarMensagemModal.jsx';
import InfoSidebar from './InfoSidebar.jsx';
import PollModal from './PollModal.jsx';
import ScheduleMeetingModal from './ScheduleMeetingModal.jsx';
import IaConversationDisplay from './IaConversationDisplay.jsx';

const getCorrectUserImageUrl = (url) => {
    const defaultAvatar = 'http://localhost:8080/images/default-avatar.png';
    if (!url) return defaultAvatar; 
    if (url.startsWith('http')) return url;
    if (url.startsWith('/api/arquivos/') || url.startsWith('/images/')) return `http://localhost:8080${url}`;
    return `http://localhost:8080/api/arquivos/${url}`;
};

// --- COMPONENTE ITEM DA LISTA ---
const ConversationListItem = ({ conversa, ativa, onClick }) => (
    <div className={`convo-list-item ${ativa ? 'selected' : ''}`} onClick={onClick}>
        <div className="avatar-container">
            <img
                src={conversa.avatar}
                className="avatar"
                alt="avatar"
                onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'http://localhost:8080/images/default-avatar.png';
                }}
            />
            {conversa.online && <span className="online-indicator"></span>}
        </div>
        <div className="convo-info">
            <div className="convo-title">{conversa.nome}</div>
            <div className="convo-snippet">{conversa.ultimaMensagem || 'Conversa privada'}</div>
        </div>
    </div>
);

// --- COMPONENTE BOLHA DE MENSAGEM ---
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

    const handleReact = (emoji) => { onReactClick(mensagem, emoji); setMenuOpen(false); };

    const renderContent = () => {
        // Code Block
        const codeBlockRegex = /```(\w+)\n([\s\S]+)```/;
        const codeMatch = mensagem.conteudo.match(codeBlockRegex);
        if (codeMatch) {
            return (
                <div className="code-snippet">
                    <button onClick={() => navigator.clipboard.writeText(codeMatch[2])} className="copy-code-btn"><FontAwesomeIcon icon={faCopy} /> Copiar</button>
                    <SyntaxHighlighter language={codeMatch[1]} style={coldarkDark} showLineNumbers>{codeMatch[2]}</SyntaxHighlighter>
                </div>
            );
        }

        // Midia (Imagem/Audio/Arquivo)
        const urlRegex = /\[(imagem|arquivo|audio)\]\((http[^)]+)\)/;
        const urlMatch = mensagem.conteudo.match(urlRegex);

        if (urlMatch) {
            const type = urlMatch[1];
            const url = urlMatch[2];
            if (type === 'imagem') return <img src={url} alt="Imagem enviada" className="message-image" />;
            if (type === 'audio') return <audio controls src={url} className="message-audio" />;
            const fileName = url.substring(url.lastIndexOf('/') + 1);
            return <a href={url} target="_blank" rel="noopener noreferrer" className="message-file-link">Baixar Arquivo: {fileName}</a>;
        }
        
        // Poll / Meeting / IA
        const pollRegex = /\[poll\](.+)/;
        const pollMatch = mensagem.conteudo.match(pollRegex);
        if (pollMatch) {
            try { return <PollDisplay pollData={JSON.parse(pollMatch[1])} onVote={(idx) => onVote(mensagem, idx)} />; } catch (e) { return <p>Erro Poll</p>; }
        }
        const meetingRegex = /\[meeting\](.+)/;
        const meetingMatch = mensagem.conteudo.match(meetingRegex);
        if (meetingMatch) {
            try { return <MeetingDisplay meetingData={JSON.parse(meetingMatch[1])} onConfirm={() => onConfirm(mensagem, currentUser.nome)} onDecline={() => onDecline(mensagem, currentUser.nome)} />; } catch (e) { return <p>Erro Meeting</p>; }
        }
        const iaConversationRegex = /\[ia-conversation\](.+)/;
        const iaMatch = mensagem.conteudo.match(iaConversationRegex);
        if (iaMatch) {
            try { return <IaConversationDisplay conversationData={JSON.parse(iaMatch[1])} authorName={mensagem.nomeAutor} />; } catch (e) { return <p>Erro IA</p>; }
        }

        return <p className="message-text">{mensagem.conteudo}</p>;
    };

    return (
     <div className={`message-bubble-wrapper ${isMe ? 'me' : 'other'} dm ${mensagem.isSolution ? 'solution' : ''}`}>
        <div className="message-bubble">
            <div className="message-menu-trigger" onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }}><FontAwesomeIcon icon={faEllipsisV} /></div>
            {menuOpen && (
                <div className="message-menu-dropdown" ref={menuRef}>
                    {isMe && (
                        <>
                            <button onClick={() => { onEditClick(mensagem); setMenuOpen(false); }}><FontAwesomeIcon icon={faPen} /> Editar</button>
                            <button className="danger" onClick={() => { onDeleteClick(mensagem); setMenuOpen(false); }}><FontAwesomeIcon icon={faTrash} /> Excluir</button>
                        </>
                    )}
                    <button onClick={() => { onReplyClick(mensagem); setMenuOpen(false); }}><FontAwesomeIcon icon={faReply} /> Responder</button>
                    {!isMe && (
                        <>
                            <button onClick={() => { onMarkAsSolution(mensagem); setMenuOpen(false); }}><FontAwesomeIcon icon={faCheckCircle} /> Solução</button>
                            <div className="emoji-react-list">{emojis.map(emoji => (<span key={emoji} className="emoji-react-item" onClick={() => handleReact(emoji)}>{emoji}</span>))}</div>
                        </>
                    )}
                </div>
            )}
            {mensagem.replyToMessage && <ReplyPreviewBubble message={mensagem.replyToMessage} />}
            {renderContent()}
            <span className="message-time">
                {hasBeenEdited && <span className="edited-indicator">(editado) </span>}
                {new Date(mensagem.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
        {aggregatedReactions.length > 0 && <div className="message-reactions">{aggregatedReactions.map(r => (<span key={r.emoji} className="reaction-pill">{r.emoji} {r.count > 1 && <span className="reaction-count">{r.count}</span>}</span>))}</div>}
     </div>
    );
};

const MeetingDisplay = ({ meetingData, onConfirm, onDecline }) => (
    <div className="meeting-display">
        <h4>{meetingData.title}</h4>
        <p>{new Date(meetingData.dateTime).toLocaleString('pt-BR')}</p>
        <div className="meeting-actions"><button onClick={onConfirm}>Confirmar</button><button onClick={onDecline}>Recusar</button></div>
        <div className="attendees"><strong>Participantes:</strong><ul>{meetingData.attendees.map((a, i) => <li key={i}>{a}</li>)}</ul></div>
    </div>
);

const PollDisplay = ({ pollData, onVote }) => {
    const totalVotes = pollData.options.reduce((acc, opt) => acc + opt.votes, 0);
    return (
        <div className="poll-display">
            <h4>{pollData.question}</h4>
            <div className="poll-options">
                {pollData.options.map((opt, i) => {
                    const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
                    return (
                        <button key={i} onClick={() => onVote(i)} className="poll-option-btn">
                            <div className="poll-option-info"><span>{opt.option}</span><span>{Math.round(pct)}%</span></div>
                            <div className="progress-bar" style={{ width: `${pct}%` }}></div>
                        </button>
                    );
                })}
            </div>
            <span className="total-votes">{totalVotes} votos</span>
        </div>
    );
};

const ReplyPreviewBubble = ({ message }) => (!message ? null : <div className="reply-preview-bubble"><strong>{message.nomeAutor}</strong><p>{message.conteudo}</p></div>);

const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
        const date = new Date(message.dataEnvio);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        let dayKey = date.toDateString() === today.toDateString() ? 'Hoje' : date.toDateString() === yesterday.toDateString() ? 'Ontem' : date.toLocaleDateString('pt-BR');
        if (!groups[dayKey]) groups[dayKey] = [];
        groups[dayKey].push(message);
    });
    return groups;
};

// --- PÁGINA PRINCIPAL ---
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
    const [mensagensPage, setMensagensPage] = useState(0);
    const [hasMoreMensagens, setHasMoreMensagens] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Gravação de Áudio
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Modais (Removidos: Sidekick, CodeSnippet)
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isScheduleMeetingModalOpen, setIsScheduleMeetingModalOpen] = useState(false);

    const { stompClient, isConnected } = useWebSocket(); 
    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const previousScrollHeightRef = useRef(0);
    const location = useLocation();
    const navigate = useNavigate();

    const filteredMessages = useMemo(() => (!searchTerm ? mensagens : mensagens.filter(msg => msg.conteudo.toLowerCase().includes(searchTerm.toLowerCase()))), [mensagens, searchTerm]);
    const solutionMessage = useMemo(() => mensagens.find(msg => msg.isSolution), [mensagens]);

    // --- BUSCAR APENAS AMIGOS (PRIVADO) ---
    const fetchConversas = useCallback(async () => {
        setLoadingConversas(true);
        try {
            const amigosRes = await axios.get('http://localhost:8080/api/amizades/');
            const validAmigos = amigosRes.data.filter(amigo => amigo && amigo.idUsuario);
            const conversasDMs = validAmigos.map(amigo => ({
                id: amigo.idUsuario, 
                nome: amigo.nome,
                tipo: 'dm',
                avatar: getCorrectUserImageUrl(amigo.fotoPerfil), 
                ultimaMensagem: 'Conversa privada', 
            }));
            setConversas(conversasDMs);
            return conversasDMs; 
        } catch (error) { 
            console.error("Erro ao buscar amigos:", error);
            if (error.response?.status === 401) onLogout(); 
            return []; 
        } finally { setLoadingConversas(false); }
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
            params.set('dm', conversa.id);
            navigate(`/mensagens?${params.toString()}`, { replace: true });
        }
        try {
            const endpoint = `http://localhost:8080/api/chat/privado/${user.id}/${conversa.id}`;
            const mensagensRes = await axios.get(endpoint);
            const msgsFormatadas = mensagensRes.data.map((msg) => ({ ...msg, tipo: 'dm' }));
            setMensagens(msgsFormatadas);
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
        } catch (error) { 
            setConversaAtiva(null); 
            navigate('/mensagens', { replace: true }); 
        } finally { setLoadingMensagens(false); }
    }, [navigate]);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) { onLogout(); return; }
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const fetchInitialData = async () => {
            try {
                const userRes = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(userRes.data); 
                const todasConversas = await fetchConversas(); 
                const params = new URLSearchParams(location.search);
                const dmId = params.get('dm');
                let chatParaAbrir = null;
                if (dmId) chatParaAbrir = todasConversas.find((c) => c.id === parseInt(dmId));
                if (chatParaAbrir) selecionarConversa(chatParaAbrir, userRes.data, false);
            } catch (error) { if (error.response?.status === 401) onLogout(); }
        };
        fetchInitialData();
    }, [onLogout, location.search, fetchConversas, selecionarConversa]);

    const loadMoreMessages = useCallback(async () => {
        if (loadingMensagens || !hasMoreMensagens) return;
        setLoadingMensagens(true);
        const nextPage = mensagensPage + 1;
        if (messagesContainerRef.current) previousScrollHeightRef.current = messagesContainerRef.current.scrollHeight;
        try {
            const endpoint = `http://localhost:8080/api/chat/privado/${currentUser.id}/${conversaAtiva.id}?page=${nextPage}`;
            const res = await axios.get(endpoint);
            const novasMensagens = res.data.map(msg => ({ ...msg, tipo: 'dm' }));
            if (novasMensagens.length === 0) setHasMoreMensagens(false);
            else {
                setMensagens(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const filtered = novasMensagens.filter(m => !existingIds.has(m.id));
                    return filtered.length === 0 ? prev : [...filtered, ...prev];
                });
                setMensagensPage(nextPage);
            }
        } catch (error) { console.error("Erro loadMore", error); } finally { setLoadingMensagens(false); }
    }, [loadingMensagens, hasMoreMensagens, mensagensPage, conversaAtiva, currentUser]);

    useLayoutEffect(() => {
        if (messagesContainerRef.current && previousScrollHeightRef.current > 0 && mensagensPage > 0) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight - previousScrollHeightRef.current;
            previousScrollHeightRef.current = 0;
        }
    }, [mensagens, mensagensPage]);

    useEffect(() => {
        const handleScroll = () => { if (messagesContainerRef.current && messagesContainerRef.current.scrollTop === 0) loadMoreMessages(); };
        const container = messagesContainerRef.current;
        container?.addEventListener('scroll', handleScroll);
        return () => container?.removeEventListener('scroll', handleScroll);
    }, [loadMoreMessages]);

    useEffect(() => {
        if (isConnected && stompClient && conversaAtiva && currentUser) {
            const sub = stompClient.subscribe(`/user/queue/mensagens-privadas`, (msg) => {
                const payload = JSON.parse(msg.body);
                const partnerId = conversaAtiva.id;
                const isDMMessage = (payload.remetenteId === partnerId && payload.destinatarioId === currentUser.id) || (payload.remetenteId === currentUser.id && payload.destinatarioId === partnerId) || payload.tipo === 'remocao';
                
                if (!isDMMessage) return;
                if (payload.tipo === 'remocao') setMensagens((prev) => prev.filter(m => m.id !== payload.id));
                else {
                    setMensagens((prev) => {
                        const exists = prev.findIndex(m => m.id === payload.id);
                        const msgCtx = { ...payload, tipo: 'dm' };
                        return exists > -1 ? prev.map((m, i) => i === exists ? msgCtx : m) : [...prev, msgCtx];
                    });
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                }
            });
            return () => sub.unsubscribe();
        }
    }, [isConnected, stompClient, conversaAtiva, currentUser]);

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Erro ao iniciar gravação:", error);
            Swal.fire('Erro', 'Não foi possível acessar o microfone.', 'error');
        }
    };

    const handleStopRecording = async () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            const audioFile = new File([audioBlob], 'audio_mensagem.mp3', { type: 'audio/mp3' });
            handleUpload(audioFile); 
            setIsRecording(false);
        };
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    };

    const handleEnviarMensagem = async (e) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !conversaAtiva || !currentUser || !stompClient || !isConnected) return;
        const endpoint = `/app/chat/privado/${conversaAtiva.id}`;
        const msg = { conteudo: novaMensagem, replyToId: replyingTo ? replyingTo.id : null, destinatarioId: conversaAtiva.id };
        
        setNovaMensagem(''); setReplyingTo(null);
        try { stompClient.publish({ destination: endpoint, body: JSON.stringify(msg) }); } catch (e) { Swal.fire('Erro', 'Falha ao enviar.', 'error'); }
    };

    const handleDeleteMessage = async (msg) => {
        const res = await Swal.fire({ title: 'Excluir?', showCancelButton: true, confirmButtonText: 'Sim' });
        if (res.isConfirmed) {
            await axios.delete(`http://localhost:8080/api/chat/privado/${msg.id}`);
        }
    };

    const handleUpload = async (file) => {
        const formData = new FormData(); formData.append('file', file);
        try {
            const res = await axios.post('http://localhost:8080/api/arquivos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const type = file.type.startsWith('image/') ? 'imagem' : file.type.startsWith('audio/') ? 'audio' : 'arquivo';
            const content = `[${type}](${res.data})`;
            const endpoint = `/app/chat/privado/${conversaAtiva.id}`;
            const msg = { conteudo: content, destinatarioId: conversaAtiva.id };
            stompClient.publish({ destination: endpoint, body: JSON.stringify(msg) });
        } catch (e) { Swal.fire('Erro', 'Upload falhou.', 'error'); }
    };

    const handleSaveEdit = async (msg, novo) => { await axios.put(`http://localhost:8080/api/chat/privado/${msg.id}`, {conteudo: novo}); };
    
    const handleSendPoll = (q, o) => { 
        const msg = { conteudo: `[poll]${JSON.stringify({question: q, options: o.map(x=>({option:x, votes:0}))})}`, destinatarioId: conversaAtiva.id };
        stompClient.publish({ destination: `/app/chat/privado/${conversaAtiva.id}`, body: JSON.stringify(msg)});
    };
    
    const handleSendMeeting = (t, d) => { 
        const msg = { conteudo: `[meeting]${JSON.stringify({title: t, dateTime: d, attendees:[]})}`, destinatarioId: conversaAtiva.id };
        stompClient.publish({ destination: `/app/chat/privado/${conversaAtiva.id}`, body: JSON.stringify(msg)});
    };
    
    const handleConfirmMeeting = (m, u) => {}; // Implementar update de string se necessário
    const handleDeclineMeeting = (m, u) => {}; 
    const handleVote = async (m, idx) => { await axios.post(`http://localhost:8080/api/chat/mensagens/${m.id}/vote/${idx}`); };
    const handleMarkAsSolution = async (m) => { await axios.post(`http://localhost:8080/api/chat/mensagens/${m.id}/marcar-solucao`); };
    const handleSendReaction = (m, e) => { setMensagens(p => p.map(x => x.id === m.id ? { ...x, reactions: [...(x.reactions || []), e] } : x)); };

    const toggleInfoSidebar = () => setIsInfoSidebarOpen(prev => !prev);

    return (
        <div className="layout-mensagens">
            <Topbar onLogout={onLogout} currentUser={currentUser} />
            <div className={`container container-chat ${isInfoSidebarOpen ? 'sidebar-info-open' : ''}`}>
                <Sidebar currentUser={currentUser}/>
                <aside className={`chat-conversations-sidebar ${conversaAtiva ? 'hidden-mobile' : ''}`}>
                    <div className="conv-sidebar-header"><h2>Mensagens</h2></div>
                    <div className="conv-search"><FontAwesomeIcon icon={faSearch} /><input type="text" placeholder="Pesquisar amigos..." /></div>
                    <div className="conversations-list">
                        {loadingConversas ? <p className="loading-state"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</p> :
                            conversas.length > 0 ? conversas.map(c => <ConversationListItem key={c.id} conversa={c} ativa={conversaAtiva?.id === c.id} onClick={() => selecionarConversa(c, currentUser)} />) : <p className="empty-state">Nenhum amigo encontrado.</p>
                        }
                    </div>
                </aside>
                <main className={`chat-main-area ${!conversaAtiva ? 'hidden-mobile' : ''}`}>
                   {conversaAtiva ? (
                        <div className="chat-active-card">
                            <header className="chat-header-area">
                                <button className="chat-back-btn" onClick={() => { setConversaAtiva(null); navigate('/mensagens', { replace: true }); }}><FontAwesomeIcon icon={faArrowLeft} /></button>
                                <div className="chat-header-info">
                                    <img src={conversaAtiva.avatar} className="avatar" onError={(e) => { e.target.onerror = null; e.target.src = 'http://localhost:8080/images/default-avatar.png'; }} />
                                    <div className="chat-header-details"><h3>{conversaAtiva.nome}</h3>{conversaAtiva.online && <span className="status-indicator online">Online</span>}</div>
                                </div>
                                {solutionMessage && <div className="solution-link-container"><a href={`#message-${solutionMessage.id}`} className="solution-link"><FontAwesomeIcon icon={faCheckCircle} /> Ver Solução</a></div>}
                                <div className="chat-header-actions">
                                    <div className="search-bar">
                                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                        {searchTerm ? <button onClick={() => setSearchTerm('')} className="clear-search-btn"><FontAwesomeIcon icon={faTimes} /></button> : <FontAwesomeIcon icon={faSearch} />}
                                    </div>
                                    <button className="chat-options-btn" onClick={toggleInfoSidebar}><FontAwesomeIcon icon={faEllipsisV} /></button>
                                </div>
                            </header>
                             <div className="chat-messages-area" ref={messagesContainerRef}>
                                {loadingMensagens && mensagens.length === 0 ? <p className="loading-state"><FontAwesomeIcon icon={faSpinner} spin /> Carregando...</p> :
                                    filteredMessages.length > 0 ? Object.entries(groupMessagesByDate(filteredMessages)).map(([date, msgs]) => (
                                            <React.Fragment key={date}>
                                                <div className="date-separator"><span>{date}</span></div>
                                                {msgs.map((msg, i) => <MessageBubble key={msg.id || i} mensagem={msg} isMe={msg.autorId === currentUser?.id || msg.remetenteId === currentUser?.id} currentUser={currentUser} onDeleteClick={handleDeleteMessage} onEditClick={(m) => { setMessageToEdit(m); setIsEditModalOpen(true); }} onReplyClick={(m) => setReplyingTo(m)} onMarkAsSolution={handleMarkAsSolution} onReactClick={handleSendReaction} onVote={handleVote} onConfirm={handleConfirmMeeting} onDecline={handleDeclineMeeting} reactions={msg.reactions || []} />)}
                                            </React.Fragment>
                                        )) : <p className="empty-state">Ainda não há mensagens. Diga olá!</p>
                                }
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="chat-input-wrapper">
                                {replyingTo && <div className="reply-preview"><div className="reply-info"><strong>Respondendo a {replyingTo.nomeAutor}</strong><p>{replyingTo.conteudo}</p></div><button onClick={() => setReplyingTo(null)} className="cancel-reply-btn"><FontAwesomeIcon icon={faTimes} /></button></div>}
                                <form className="chat-input-area" onSubmit={handleEnviarMensagem}>
                                    <input type="file" ref={fileInputRef} onChange={(e) => { if(e.target.files[0]) handleUpload(e.target.files[0]); }} style={{ display: 'none' }} />
                                    <button type="button" className="chat-attach-btn" onClick={() => fileInputRef.current.click()} disabled={!isConnected}><FontAwesomeIcon icon={faPaperclip} /></button>
                                    
                                    <button type="button" className="chat-attach-btn" onClick={() => setIsPollModalOpen(true)} disabled={!isConnected}><FontAwesomeIcon icon={faPoll} /></button>
                                    <button type="button" className="chat-attach-btn" onClick={() => setIsScheduleMeetingModalOpen(true)} disabled={!isConnected}><FontAwesomeIcon icon={faCalendarAlt} /></button>
                                    
                                    {isRecording ? (
                                        <button type="button" className="chat-attach-btn recording-active" onClick={handleStopRecording}><FontAwesomeIcon icon={faStop} spin /></button>
                                    ) : (
                                        <button type="button" className="chat-attach-btn" onClick={handleStartRecording}><FontAwesomeIcon icon={faMicrophone} /></button>
                                    )}

                                    <MentionsInput value={novaMensagem || ''} onChange={(e, v) => setNovaMensagem(v)} placeholder="Digite uma mensagem..." disabled={!isConnected} className="mentions-input">
                                        <Mention trigger="@" markup="@[__display__](__id__)" data={[]} className="mention" />
                                    </MentionsInput>
                                    <button type="submit" disabled={!novaMensagem.trim() || !isConnected}><FontAwesomeIcon icon={faPaperPlane} /></button>
                                 </form>
                            </div>
                        </div>
                   ) : <div className="empty-chat-view"><h3>Selecione um amigo</h3></div>}
                </main>
                
                {isInfoSidebarOpen && conversaAtiva && <InfoSidebar conversa={conversaAtiva} mensagens={mensagens} onClose={toggleInfoSidebar} />}
            </div>

            {isEditModalOpen && messageToEdit && <EditarMensagemModal mensagem={messageToEdit} onSave={handleSaveEdit} onClose={() => { setIsEditModalOpen(false); setMessageToEdit(null); }} />}
            {isPollModalOpen && <PollModal onSave={handleSendPoll} onClose={() => setIsPollModalOpen(false)} />}
            {isScheduleMeetingModalOpen && <ScheduleMeetingModal onSave={handleSendMeeting} onClose={() => setIsScheduleMeetingModalOpen(false)} />}
        </div>
    );
};

export default Mensagens;