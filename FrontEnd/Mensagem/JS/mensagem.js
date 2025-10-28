/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

document.addEventListener("DOMContentLoaded", () => {
    
    // --- ELEMENTOS DO DOM (Específicos do Chat) ---
    const elements = {
        conversationsList: document.getElementById('conversations-list'),
        chatHeader: document.getElementById('chat-header-area'), // ID do HTML
        chatMessagesContainer: document.getElementById('chat-messages-area'), // ID do HTML
        messageInput: document.getElementById('chat-input'), // ID do HTML
        chatForm: document.getElementById('chat-form'), // ID do HTML
        chatSendBtn: document.getElementById('chat-send-btn'), // ID do HTML
        conversationSearch: document.getElementById('convo-search'),
        addGroupBtn: document.querySelector('.add-convo-btn'),
        addConvoModal: document.getElementById('add-convo-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        newConvoUserList: document.getElementById('new-convo-user-list'),
        userSearchInput: document.getElementById('user-search-input'),
    };

    // --- VARIÁVEIS DE ESTADO DO CHAT ---
    let conversas = []; 
    let userFriends = []; // Será preenchido pela variável global
    let activeConversation = { usuarioId: null, nome: null, avatar: null };
    let chatMessages = new Map();
    
    // --- VARIÁVEIS GLOBAIS (Definidas pelo principal.js) ---
    let currentUser;
    let stompClient;
    let backendUrl;
    let defaultAvatarUrl;

    /**
     * Esta é a função principal. Ela espera o 'principal.js' carregar
     * o usuário e o WebSocket antes de executar qualquer lógica de chat.
     */
    function initChatPage(detail) {
        // Pega as variáveis globais carregadas pelo principal.js
        currentUser = detail.currentUser;
        stompClient = detail.stompClient;
        userFriends = window.userFriends; // Pega a lista de amigos já carregada
        backendUrl = window.backendUrl;
        defaultAvatarUrl = window.defaultAvatarUrl;
        
        // Agora que o WS está conectado, inscreve-se no tópico de mensagens privadas
        stompClient.subscribe(`/user/queue/usuario`, onMessageReceived);

        // Carrega os dados do chat
        fetchConversations();
        
        // Configura os listeners específicos do chat
        setupChatEventListeners();
    }
    
    // Aguarda o evento personalizado 'globalScriptsLoaded' disparado pelo principal.js
    document.addEventListener('globalScriptsLoaded', (e) => initChatPage(e.detail));

    
    /**
     * Busca apenas as conversas existentes.
     */
    async function fetchConversations() {
        try {
            // Busca conversas existentes
            const convosResponse = await axios.get(`${backendUrl}/api/chat/privado/minhas-conversas`);
            conversas = convosResponse.data.map(c => ({
                ...c,
                avatarUrl: c.fotoPerfilOutroUsuario ? `${backendUrl}${c.fotoPerfilOutroUsuario}` : defaultAvatarUrl,
            }));
            
            renderConversationsList();
        } catch (error) {
            console.error('Erro ao carregar conversas:', error);
        }
    }
    
    /**
     * Encontra a chave de cache (user1-user2)
     */
    function getCacheKey(otherUserId) {
        if (!currentUser) return null;
        return [currentUser.id, otherUserId].sort((a, b) => a - b).join('-');
    }

    /**
     * Seleciona uma conversa e carrega o histórico.
     */
    async function selectConversation(otherUserId) {
        if (!otherUserId) return;
        otherUserId = parseInt(otherUserId, 10);

        // 1. Encontra os dados do usuário (na lista de conversas ou de amigos)
        const convoData = conversas.find(c => c.outroUsuarioId === otherUserId) || 
                          userFriends.find(f => f.usuarioId === otherUserId);
        
        if (!convoData) {
            console.error("Usuário não encontrado:", otherUserId);
            // Tenta buscar no DTO de Amigo (caso não tenha conversa)
             const friendData = userFriends.find(f => f.usuarioId === otherUserId);
             if(!friendData) {
                 console.error("Amigo não encontrado:", otherUserId);
                 return;
             }
             // Usa os dados do amigo para iniciar uma nova conversa
             activeConversation = {
                usuarioId: friendData.usuarioId,
                nome: friendData.nome,
                avatar: friendData.fotoPerfil ? `${backendUrl}/api/arquivos/${friendData.fotoPerfil}` : defaultAvatarUrl
             };
        } else {
            // 2. Define a conversa ativa
            activeConversation = {
                usuarioId: otherUserId, 
                nome: convoData.nomeOutroUsuario || convoData.nome,
                avatar: convoData.avatarUrl || (convoData.fotoPerfil ? `${backendUrl}/api/arquivos/${convoData.fotoPerfil}` : defaultAvatarUrl),
            };
        }
        
        // 3. Atualiza a UI
        renderChatHeader();
        document.querySelectorAll('.convo-card').forEach(card => card.classList.remove('selected'));
        const selectedCard = document.querySelector(`.convo-card[data-user-id="${otherUserId}"]`);
        if (selectedCard) selectedCard.classList.add('selected');

        elements.chatMessagesContainer.innerHTML = '<div class="empty-chat">Carregando histórico...</div>';
        
        // 4. Busca e renderiza as mensagens
        await fetchMessages(otherUserId);

        elements.messageInput.disabled = false;
        elements.chatSendBtn.disabled = false;
        elements.messageInput.focus();
    }
    
    /**
     * Busca o histórico de mensagens.
     */
    async function fetchMessages(otherUserId) {
        const cacheKey = getCacheKey(otherUserId);
        if (!cacheKey) return;
        
        if (chatMessages.has(cacheKey)) {
            renderMessages(chatMessages.get(cacheKey));
            return;
        }

        try {
            // USA O NOVO ENDPOINT DO BACKEND (ChatRestController)
            const response = await axios.get(`${backendUrl}/api/chat/privado/historico/${otherUserId}`);
            const messages = response.data;
            
            chatMessages.set(cacheKey, messages);
            renderMessages(messages);
        } catch (error) {
            console.error('Erro ao carregar mensagens:', error);
            elements.chatMessagesContainer.innerHTML = `<div class="empty-chat">Erro ao carregar histórico.</div>`;
            chatMessages.set(cacheKey, []);
        }
    }

    /**
     * Envia uma mensagem.
     */
    function handleSendMessage(e) {
        e.preventDefault();
        const content = elements.messageInput.value.trim();
        if (!content || !activeConversation.usuarioId || !stompClient?.connected) return;

        const messageData = {
            conteudo: content,
            destinatarioId: activeConversation.usuarioId
        };

        stompClient.send(`/app/privado/${activeConversation.usuarioId}`, {}, JSON.stringify(messageData));
        elements.messageInput.value = '';
        elements.messageInput.focus();
    }

    /**
     * Recebe uma mensagem (do WebSocket).
     */
    function onMessageReceived(payload) {
        const msg = JSON.parse(payload.body); // MensagemPrivadaSaidaDTO

        if (msg.tipo === 'remocao') {
            const msgElement = document.querySelector(`[data-message-id="${msg.id}"]`);
            if(msgElement) msgElement.remove();
            return;
        }
        
        const otherUserId = msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
        const cacheKey = getCacheKey(otherUserId);

        if (!chatMessages.has(cacheKey)) chatMessages.set(cacheKey, []);
        chatMessages.get(cacheKey).push(msg);

        // Atualiza a lista lateral (move para o topo)
        let convoIndex = conversas.findIndex(c => c.outroUsuarioId === otherUserId);
        let convoToMove;
        
        if (convoIndex > -1) {
            // Conversa existente
            convoToMove = conversas.splice(convoIndex, 1)[0];
            convoToMove.conteudoUltimaMensagem = msg.conteudo;
            convoToMove.dataEnvioUltimaMensagem = msg.dataEnvio;
            convoToMove.remetenteUltimaMensagemId = msg.remetenteId;
        } else {
            // Conversa nova
            convoToMove = {
                outroUsuarioId: otherUserId,
                nomeOutroUsuario: msg.nomeRemetente,
                fotoPerfilOutroUsuario: null, // TODO: Precisaria buscar a foto do remetente
                conteudoUltimaMensagem: msg.conteudo,
                dataEnvioUltimaMensagem: msg.dataEnvio,
                remetenteUltimaMensagemId: msg.remetenteId,
                avatarUrl: defaultAvatarUrl // TODO: Buscar avatar real
            };
            // Se for uma conversa nova, o avatar do remetente pode não estar disponível
            // Vamos tentar pegar do DTO de amigos, se ele existir
            const friendData = userFriends.find(f => f.usuarioId === otherUserId);
            if(friendData) {
                convoToMove.avatarUrl = friendData.avatarUrl || defaultAvatarUrl;
            }
        }
        
        conversas.unshift(convoToMove);
        renderConversationsList();

        // Renderiza na tela se for a conversa ativa
        if (activeConversation.usuarioId === otherUserId) {
            renderMessages(chatMessages.get(cacheKey));
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO (UI do Chat) ---
    
    function renderMessages(messages) {
        if (!elements.chatMessagesContainer) return;
        
        elements.chatMessagesContainer.innerHTML = messages.map(msg => {
            const isMyMessage = msg.remetenteId === currentUser.id;
            const messageClass = isMyMessage ? 'message-group me' : 'message-group outro';
            
            let avatarUrl = defaultAvatarUrl;
            if (isMyMessage && currentUser.urlFotoPerfil) {
                avatarUrl = `${backendUrl}${currentUser.urlFotoPerfil}`;
            } else if (!isMyMessage) {
                // Tenta pegar o avatar da conversa ativa, senão, da mensagem (se tiver)
                avatarUrl = activeConversation.avatar || defaultAvatarUrl; 
            }

            const nome = isMyMessage ? "Você" : msg.nomeRemetente;
            const time = new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

            return `
                <div class="message-group ${messageClass}" data-message-id="${msg.id}">
                    ${!isMyMessage ? `<div class="message-avatar"><img src="${avatarUrl}" alt="${nome}"></div>` : ''}
                    <div class="message-block">
                        <div class="message-author-header">
                            <strong>${nome}</strong>
                            <span>${time}</span>
                        </div>
                        <div class="message-content">${msg.conteudo}</div>
                    </div>
                </div>
            `;
        }).join('');

        elements.chatMessagesContainer.scrollTop = elements.chatMessagesContainer.scrollHeight;
    }

    function renderConversationsList() {
        if (!elements.conversationsList) return;
        elements.conversationsList.innerHTML = '';
        if (conversas.length === 0) {
            elements.conversationsList.innerHTML = '<p class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Nenhuma conversa.</p>';
            return;
        }

        conversas.forEach(convo => {
            const convoCard = document.createElement('div');
            convoCard.className = `convo-card ${convo.outroUsuarioId == activeConversation.usuarioId ? 'selected' : ''}`;
            convoCard.dataset.userId = convo.outroUsuarioId;
            convoCard.dataset.userName = convo.nomeOutroUsuario;
            
            const ultimoAutor = convo.remetenteUltimaMensagemId === currentUser.id ? "<strong>Você:</strong> " : "";
            
            convoCard.innerHTML = `
                <div class="convo-avatar-wrapper">
                    <img src="${convo.avatarUrl}" class="avatar" alt="${convo.nomeOutroUsuario}">
                </div>
                <div class="group-info">
                    <div class="group-title">${convo.nomeOutroUsuario}</div>
                    <div class="group-last-msg">
                        ${ultimoAutor}${convo.conteudoUltimaMensagem || "Nenhuma mensagem"}
                    </div>
                </div>
            `;
            convoCard.addEventListener('click', () => selectConversation(convo.outroUsuarioId));
            elements.conversationsList.appendChild(convoCard);
        });
    }

    function renderChatHeader() {
        if (activeConversation.usuarioId) {
            elements.chatHeader.innerHTML = `
                <img src="${activeConversation.avatar}" class="chat-group-avatar" alt="${activeConversation.nome}">
                <div>
                    <h3 class="chat-group-title">${activeConversation.nome}</h3>
                </div>`;
        } else {
            elements.chatHeader.innerHTML = `<h3 class="chat-group-title">Selecione uma Conversa</h3>`;
        }
    }
    
    function renderAvailableUsers() {
        // Usa a variável global userFriends carregada pelo principal.js
        elements.newConvoUserList.innerHTML = userFriends
            .filter(f => !conversas.some(c => c.outroUsuarioId === f.usuarioId)) // Filtra quem já está na lista de conversas
            .map(friend => {
                // 'friend' aqui é o AmigoDTO do AmizadeService
                const avatarUrl = friend.fotoPerfil ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` : defaultAvatarUrl;
                return `
                    <div class="user-list-item user-card" 
                         data-usuario-id="${friend.usuarioId}" 
                         data-user-name="${friend.nome}" >
                        <img src="${avatarUrl}" alt="${friend.nome}">
                        <span>${friend.nome}</span>
                    </div>
                `;
            }).join('');
    }
    
    function openNewConversationModal() {
        renderAvailableUsers();
        elements.addConvoModal.style.display = 'flex';
    }

    // --- SETUP DE EVENT LISTENERS (Específicos do Chat) ---
    function setupChatEventListeners() {
        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', handleSendMessage);
        }
        
        if (elements.conversationSearch) {
            elements.conversationSearch.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('.convo-card').forEach(card => {
                    const name = card.dataset.userName.toLowerCase();
                    card.style.display = name.includes(query) ? 'flex' : 'none';
                });
            });
        }
        
        // Modal de Nova Conversa
        if (elements.addGroupBtn) {
            elements.addGroupBtn.addEventListener('click', openNewConversationModal);
        }
        if (elements.closeModalBtn) {
            elements.closeModalBtn.addEventListener('click', () => elements.addConvoModal.style.display = 'none');
        }
        if (elements.newConvoUserList) {
            elements.newConvoUserList.addEventListener('click', (e) => {
                const userCard = e.target.closest('.user-card');
                if (userCard) {
                    const userId = parseInt(userCard.dataset.usuarioId, 10);
                    elements.addConvoModal.style.display = 'none';
                    selectConversation(userId);
                }
            });
        }
        if (elements.userSearchInput) {
            elements.userSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('.user-list-item').forEach(item => {
                    const name = item.dataset.userName.toLowerCase();
                    item.style.display = name.includes(query) ? 'flex' : 'none';
                });
            });
        }
    }
});