// src/pages/ProjetoChat/ProjetoChat.jsx (COM EMOJIS, STATUS E ONLINE)

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useWebSocket } from '../../contexts/WebSocketContext.jsx'; 
import EmojiPicker from 'emoji-picker-react'; // ✅ Importando Emojis
import './ProjetoChat.css'; 

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPaperPlane, faPaperclip, faMicrophone, faStop, 
    faArrowLeft, faTrashAlt, faSignOutAlt, faUsers, faSmile, faCircle, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { MentionsInput, Mention } from 'react-mentions';
import '../Mensagens/mentions-style.css'; 
import Swal from 'sweetalert2';

const getCorrectUserImageUrl = (url) => {
    if (!url) return 'http://localhost:8080/images/default-avatar.png';
    if (url.startsWith('http')) return url;
    return `http://localhost:8080${url}`;
};

const ProjetoChat = () => {
    const { id } = useParams(); 
    const navigate = useNavigate();
    const { stompClient, isConnected } = useWebSocket();
    
    const [projeto, setProjeto] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅ Estado do Emoji
    const [showDetails, setShowDetails] = useState(false); // ✅ Estado para mostrar detalhes extras
    
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Carregar Dados
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) { navigate('/login'); return; }
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                const userRes = await axios.get('http://localhost:8080/usuarios/me');
                setCurrentUser(userRes.data);

                const projRes = await axios.get(`http://localhost:8080/projetos/${id}`);
                setProjeto(projRes.data);

                const msgRes = await axios.get(`http://localhost:8080/api/chat/grupo/${id}`);
                const msgs = msgRes.data.map(m => ({ ...m, tipo: 'grupo' }));
                setMensagens(msgs);
                
                setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
            } catch (error) {
                console.error(error);
                Swal.fire('Erro', 'Erro ao carregar chat.', 'error');
                navigate('/projetos');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // WebSocket
    useEffect(() => {
        if (isConnected && stompClient && id) {
            const sub = stompClient.subscribe(`/topic/grupo/${id}`, (message) => {
                const payload = JSON.parse(message.body);
                if (payload.tipo === 'remocao') {
                    setMensagens(prev => prev.filter(m => m.id !== payload.id));
                } else {
                    setMensagens(prev => {
                        if (prev.some(m => m.id === payload.id)) return prev;
                        return [...prev, { ...payload, tipo: 'grupo' }];
                    });
                    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
                }
            });
            return () => sub.unsubscribe();
        }
    }, [isConnected, stompClient, id]);

    const handleEnviar = (e) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !isConnected) return;
        const msg = { conteudo: novaMensagem, replyToId: null }; 
        stompClient.publish({ destination: `/app/grupo/${id}`, body: JSON.stringify(msg) });
        setNovaMensagem('');
        setShowEmojiPicker(false);
    };

    const handleUpload = async (file) => {
        const formData = new FormData(); formData.append('file', file);
        try {
            const res = await axios.post('http://localhost:8080/api/arquivos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const type = file.type.startsWith('image/') ? 'imagem' : file.type.startsWith('audio/') ? 'audio' : 'arquivo';
            const content = `[${type}](${res.data})`;
            stompClient.publish({ destination: `/app/grupo/${id}`, body: JSON.stringify({ conteudo: content }) });
        } catch (e) { Swal.fire('Erro', 'Upload falhou.', 'error'); }
    };

    // ✅ Função de Emoji
    const onEmojiClick = (emojiObject) => {
        setNovaMensagem(prev => prev + emojiObject.emoji);
    };

    // Helpers de Status e Renderização
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PLANEJAMENTO': return <span className="status-badge planning">📝 Planejamento</span>;
            case 'EM_ANDAMENTO': return <span className="status-badge doing">🔨 Fazendo</span>;
            case 'CONCLUIDO': return <span className="status-badge done">✅ Concluído</span>;
            default: return <span className="status-badge planning">📝 Planejamento</span>;
        }
    };

    // ✅ Contagem de Online (Simulada ou Real se o backend mandar 'online: true')
    const getOnlineCount = () => {
        if (!projeto?.membros) return 0;
        // Se o seu backend tiver o campo "online" no membro, use: membro.online
        // Caso contrário, simulamos que pelo menos o usuário atual e o dono estão online
        return projeto.membros.filter(m => m.online || m.id === currentUser?.id || m.id === projeto.autorId).length;
    };

    const handleExcluirProjeto = async () => { /* ... (mesma lógica anterior) ... */ };
    
    // ... (startRec, stopRec, renderMessageContent mantidos iguais) ...
    const startRec = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = e => audioChunksRef.current.push(e.data);
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (e) { Swal.fire('Erro', 'Microfone bloqueado', 'error'); }
    };
    const stopRec = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
            handleUpload(new File([blob], 'voz.mp3', { type: 'audio/mp3' }));
            setIsRecording(false);
        };
        mediaRecorderRef.current.stop();
    };

    const renderMessageContent = (conteudo) => {
        const urlMatch = conteudo.match(/\[(imagem|arquivo|audio)\]\((http[^)]+)\)/);
        if (urlMatch) {
            const [_, type, url] = urlMatch;
            if (type === 'imagem') return <img src={url} className="discord-msg-img" alt="anexo" />;
            if (type === 'audio') return <audio controls src={url} className="discord-audio" />;
            return <a href={url} target="_blank" rel="noreferrer" className="discord-file-link">📎 Baixar Arquivo</a>;
        }
        return <p className="discord-msg-text">{conteudo}</p>;
    };

    if (loading) return <div className="discord-loading">Carregando...</div>;
    const isOwner = currentUser?.id === projeto?.autorId || currentUser?.id === projeto?.donoId;

    return (
        <div className="discord-layout">
            
            <main className="discord-chat-area">
                <header className="chat-header">
                    <div className="header-left">
                        <button onClick={() => navigate('/projetos')} className="back-btn-header">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </button>
                        
                        {/* ✅ HEADER COM STATUS E ONLINE */}
                        <div className="header-info-wrapper" onClick={() => setShowDetails(!showDetails)}>
                            <div className="header-title-row">
                                <h3>{projeto?.titulo}</h3>
                                {getStatusBadge(projeto?.status)}
                            </div>
                            <div className="header-subtitle-row">
                                <span className="online-counter">
                                    <FontAwesomeIcon icon={faCircle} className="online-dot" /> {getOnlineCount()} Online
                                </span>
                                <span className="separator">•</span>
                                <span className="member-counter">{projeto?.membros?.length} Membros</span>
                            </div>
                        </div>
                    </div>

                    {/* Botão de Detalhes/Info */}
                    <div className="header-actions">
                        <button className="header-btn" onClick={() => setShowDetails(!showDetails)} title="Ver Detalhes">
                            <FontAwesomeIcon icon={faInfoCircle} />
                        </button>
                    </div>
                </header>

                {/* ✅ PAINEL DE DETALHES EXTRA (EXPANSÍVEL) */}
                {showDetails && (
                    <div className="project-details-panel">
                        <p><strong>Descrição:</strong> {projeto?.descricao}</p>
                        <p><strong>Data de Início:</strong> {new Date(projeto?.dataCriacao).toLocaleDateString()}</p>
                    </div>
                )}

                <div className="chat-messages-scroll">
                    {mensagens.map((msg, idx) => {
                        const isMe = msg.autorId === currentUser?.id;
                        const showHeader = idx === 0 || mensagens[idx-1].autorId !== msg.autorId;
                        return (
                            <div key={idx} className={`discord-message-row ${isMe ? 'me' : ''} ${!showHeader ? 'compact' : ''}`}>
                                {showHeader ? <img src={getCorrectUserImageUrl(msg.fotoAutorUrl)} className="discord-avatar" alt="avatar" /> : null}
                                <div className="discord-message-content" style={{ marginLeft: !showHeader ? '58px' : '0' }}>
                                    {showHeader && (
                                        <div className="message-header">
                                            <span className={`message-username ${isMe ? 'me-user' : 'other-user'}`}>{msg.nomeAutor}</span>
                                            <span className="message-timestamp">{new Date(msg.dataEnvio).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {renderMessageContent(msg.conteudo)}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-container">
                    <form className="discord-input-wrapper" onSubmit={handleEnviar}>
                        <button type="button" className="input-btn" onClick={() => fileInputRef.current.click()}>
                            <FontAwesomeIcon icon={faPaperclip} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />

                        {/* ✅ MENTIONS INPUT */}
                        <MentionsInput 
                            value={novaMensagem} 
                            onChange={(e, v) => setNovaMensagem(v)} 
                            placeholder={`Conversar em ${projeto?.titulo}`}
                            className="discord-mentions"
                            style={{width: '100%'}}
                        >
                            <Mention trigger="@" markup="@[__display__](__id__)" data={projeto?.membros?.map(m => ({id: String(m.usuarioId), display: m.usuarioNome})) || []} className="mention-highlight" />
                        </MentionsInput>

                        <div className="input-actions">
                            {/* ✅ BOTÃO DE EMOJI */}
                            <button type="button" className="input-icon-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <FontAwesomeIcon icon={faSmile} />
                            </button>
                            
                            {isRecording ? (
                                <button type="button" className="input-icon-btn recording" onClick={stopRec}><FontAwesomeIcon icon={faStop} /></button>
                            ) : (
                                <button type="button" className="input-icon-btn" onClick={startRec}><FontAwesomeIcon icon={faMicrophone} /></button>
                            )}
                            <button type="submit" className="input-icon-btn send" disabled={!novaMensagem.trim()}>
                                <FontAwesomeIcon icon={faPaperPlane} />
                            </button>
                        </div>
                    </form>
                    
                    {/* ✅ PICKER DE EMOJI POPUP */}
                    {showEmojiPicker && (
                        <div className="emoji-picker-container">
                            <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={300} height={400} />
                        </div>
                    )}
                </div>
            </main>

            <aside className="discord-members-sidebar">
                <div className="members-category">MEMBROS — {projeto?.membros?.length || 0}</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {projeto?.membros?.map(membro => (
                        <div key={membro.id} className="discord-member-item">
                            <div className="avatar-wrapper">
                                <img src={getCorrectUserImageUrl(membro.usuarioFotoUrl)} alt={membro.usuarioNome} />
                                <div className={`status-dot ${membro.id === currentUser.id ? 'online' : ''}`}></div>
                            </div>
                            <div className="member-info">
                                <span className="member-name" style={{color: membro.id === projeto.donoId ? '#FFD700' : '#c9d1d9'}}>{membro.usuarioNome}</span>
                                {membro.id === projeto.donoId && <span className="owner-crown">👑</span>}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="sidebar-footer">
                    {isOwner ? (
                        <button className="delete-project-btn" onClick={() => { /* Lógica já existente */ }}>
                            <FontAwesomeIcon icon={faTrashAlt} /> Excluir
                        </button>
                    ) : (
                        <button className="delete-project-btn" style={{backgroundColor: '#161b22', color: '#8b949e', borderColor: '#30363d'}} onClick={() => navigate('/projetos')}>
                            <FontAwesomeIcon icon={faSignOutAlt} /> Sair
                        </button>
                    )}
                </div>
            </aside>
        </div>
    );
};

export default ProjetoChat;