document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = "http://localhost:8080";
    const jwtToken = localStorage.getItem("token");
    let stompClient = null;
    let currentUser = null;
    let conversas = []; // Armazena a lista da caixa de entrada
    let userFriends = []; // Armazena a lista de amigos (para iniciar novas conversas)
    let activeConversation = { id: null, email: null, nome: null, avatar: null };
    let chatMessages = new Map(); // Cache para históricos de mensagens
    const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;

    // --- ELEMENTOS DO DOM (Seleção Centralizada) ---
    const elements = {
        // UI Geral (copiado de amizades.js)
        userDropdownTrigger: document.querySelector(".user-dropdown .user"),
        logoutBtn: document.getElementById("logout-btn"),
        notificationCenter: document.querySelector(".notification-center"),
        topbarUserName: document.getElementById("topbar-user-name"),
        sidebarUserName: document.getElementById("sidebar-user-name"),
        sidebarUserTitle: document.getElementById("sidebar-user-title"),
        topbarUserImg: document.getElementById("topbar-user-img"),
        sidebarUserImg: document.getElementById("sidebar-user-img"),
        connectionsCount: document.getElementById('connections-count'),
        themeToggle: document.querySelector('.theme-toggle'),

        // Notificações (copiado de amizades.js)
        notificationsIcon: document.getElementById('notifications-icon'),
        notificationsPanel: document.getElementById('notifications-panel'),
        notificationsList: document.getElementById('notifications-list'),
        notificationsBadge: document.getElementById('notifications-badge'),

        // Modais de Conta (copiado de amizades.js)
        editProfileBtn: document.getElementById("edit-profile-btn"),
        deleteAccountBtn: document.getElementById("delete-account-btn"),
        editProfileModal: document.getElementById("edit-profile-modal"),
        editProfileForm: document.getElementById("edit-profile-form"),
        cancelEditProfileBtn: document.getElementById("cancel-edit-profile-btn"),
        editProfilePicInput: document.getElementById("edit-profile-pic-input"),
        editProfilePicPreview: document.getElementById("edit-profile-pic-preview"),
        editProfileName: document.getElementById("edit-profile-name"),
        editProfileBio: document.getElementById("edit-profile-bio"),
        editProfileDob: document.getElementById("edit-profile-dob"),
        editProfilePassword: document.getElementById("edit-profile-password"),
        editProfilePasswordConfirm: document.getElementById("edit-profile-password-confirm"),
        deleteAccountModal: document.getElementById("delete-account-modal"),
        deleteAccountForm: document.getElementById("delete-account-form"),
        cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
        deleteConfirmPassword: document.getElementById("delete-confirm-password"),

        // Elementos Específicos da Página de Chat
        conversationsList: document.getElementById('conversations-list'),
        conversationSearch: document.getElementById('convo-search'),
        chatHeaderArea: document.getElementById('chat-header-area'),
        chatMessagesArea: document.getElementById('chat-messages-area'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatSendBtn: document.getElementById('chat-send-btn'),
        addGroupBtn: document.querySelector('.add-convo-btn'),
        addConvoModal: document.getElementById('add-convo-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        userSearchInput: document.getElementById('user-search-input'),
        newConvoUserList: document.getElementById('new-convo-user-list')
    };

    // --- FUNÇÕES DE CONTROLE DE TEMA (copiado de amizades.js) ---
    function setInitialTheme() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        if (elements.themeToggle) {
            const themeToggleIcon = elements.themeToggle.querySelector('i');
            if (themeToggleIcon) {
                if (theme === 'dark') {
                    themeToggleIcon.classList.remove('fa-sun');
                    themeToggleIcon.classList.add('fa-moon');
                } else {
                    themeToggleIcon.classList.remove('fa-moon');
                    themeToggleIcon.classList.add('fa-sun');
                }
            }
        }
    }

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!jwtToken) {
            window.location.href = "login.html";
            return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

        try {
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            connectWebSocket();
            
            // Busca conversas e amigos em paralelo
            await Promise.all([
                fetchConversas(),
                fetchFriends(), // Necessário para iniciar novas conversas
                fetchNotifications()
            ]);

            renderConversationsList();
            checkUrlForConversation(); // Verifica se viemos da página de amigos
            
            setupEventListeners();
            setInitialTheme();

        } catch (error) {
            console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
            localStorage.removeItem("token");
            window.location.href = "login.html";
        }
    }

    // --- LÓGICA DE CHAT (NOVA) ---

    async function fetchConversas() {
        try {
            // Este endpoint busca o resumo de todas as conversas
            const response = await axios.get(`${backendUrl}/api/chat/privado/minhas-conversas`);
            conversas = response.data.sort((a, b) => 
                new Date(b.dataEnvioUltimaMensagem) - new Date(a.dataEnvioUltimaMensagem)
            );
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
            showNotification("Não foi possível carregar suas conversas.", "error");
        }
    }

    async function fetchFriends() {
        try {
            // Busca amigos para o modal "Nova Conversa"
            const response = await axios.get(`${backendUrl}/api/amizades/`);
            userFriends = response.data;
            if(elements.connectionsCount) elements.connectionsCount.textContent = userFriends.length;
        } catch (error) {
            console.error("Erro ao buscar amigos:", error);
        }
    }

    function renderConversationsList() {
        if (!elements.conversationsList) return;
        elements.conversationsList.innerHTML = '';

        if (conversas.length === 0) {
            elements.conversationsList.innerHTML = '<p class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Nenhuma conversa encontrada.</p>';
            return;
        }

        conversas.forEach(convo => {
            const convoCard = document.createElement('div');
            convoCard.className = 'convo-card';
            if (activeConversation.id === convo.outroUsuarioId) {
                convoCard.classList.add('selected');
            }
            
            // Armazena todos os dados no card para fácil acesso
            convoCard.dataset.userId = convo.outroUsuarioId;
            convoCard.dataset.userEmail = convo.emailOutroUsuario;
            convoCard.dataset.userName = convo.nomeOutroUsuario;
            convoCard.dataset.userAvatar = convo.fotoPerfilOutroUsuario;

            const avatarUrl = convo.fotoPerfilOutroUsuario ? `${backendUrl}${convo.fotoPerfilOutroUsuario}` : defaultAvatarUrl;
            
            // Determina se a última mensagem foi enviada por "Você"
            const foiVoce = convo.remetenteUltimaMensagemId === currentUser.id;
            const ultimoAutor = foiVoce ? "<strong>Você:</strong> " : "";
            
            const cardHTML = `
                <div class="convo-avatar-wrapper">
                    <img src="${avatarUrl}" class="avatar" alt="${convo.nomeOutroUsuario}">
                    </div>
                <div class="group-info">
                    <div class="group-title">${convo.nomeOutroUsuario}</div>
                    <div class="group-last-msg">
                        ${ultimoAutor}${convo.conteudoUltimaMensagem || "Nenhuma mensagem"}
                    </div>
                </div>
            `;
            convoCard.innerHTML = cardHTML;
            elements.conversationsList.appendChild(convoCard);
        });
    }

    function checkUrlForConversation() {
        const urlParams = new URLSearchParams(window.location.search);
        const userEmailFromParam = urlParams.get('userEmail');

        if (userEmailFromParam) {
            // Tenta encontrar uma conversa existente com este email
            const existingConvo = conversas.find(c => c.emailOutroUsuario === userEmailFromParam);
            
            if (existingConvo) {
                // Conversa encontrada, seleciona ela
                setActiveConversation(
                    existingConvo.outroUsuarioId, 
                    existingConvo.emailOutroUsuario, 
                    existingConvo.nomeOutroUsuario, 
                    existingConvo.fotoPerfilOutroUsuario
                );
            } else {
                // Nenhuma conversa existente. Tenta iniciar uma nova.
                // **NOTA:** Isso depende da sua API de `/api/amizades/` retornar o `usuarioId` do amigo.
                // Assumindo que seu DTO de Amizade (em userFriends) tem 'usuarioId' e 'nome'.
                const friend = userFriends.find(f => f.email === userEmailFromParam);
                if (friend && friend.usuarioId) {
                    const avatar = friend.fotoPerfil ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` : defaultAvatarUrl;
                    setActiveConversation(friend.usuarioId, friend.email, friend.nome, avatar);
                    
                    // Adiciona um card temporário à lista de conversas
                    const tempCard = createTempConvoCard(friend.usuarioId, friend.email, friend.nome, avatar);
                    elements.conversationsList.prepend(tempCard);
                    tempCard.classList.add('selected');

                } else {
                    console.warn(`Não foi possível iniciar uma nova conversa com ${userEmailFromParam}. Amigo não encontrado ou DTO de amizade não possui 'usuarioId'.`);
                    renderEmptyChat();
                }
            }
        } else {
            renderEmptyChat();
        }
    }
    
    function createTempConvoCard(id, email, nome, avatarUrl) {
        const convoCard = document.createElement('div');
        convoCard.className = 'convo-card';
        convoCard.dataset.userId = id;
        convoCard.dataset.userEmail = email;
        convoCard.dataset.userName = nome;
        convoCard.dataset.userAvatar = avatarUrl.replace(backendUrl, ''); // Salva o caminho relativo

        const cardHTML = `
            <div class="convo-avatar-wrapper">
                <img src="${avatarUrl}" class="avatar" alt="${nome}">
            </div>
            <div class="group-info">
                <div class="group-title">${nome}</div>
                <div class="group-last-msg">Inicie a conversa...</div>
            </div>
        `;
        convoCard.innerHTML = cardHTML;
        return convoCard;
    }


    function handleConversationClick(event) {
        const card = event.target.closest('.convo-card');
        if (!card) return;

        // Pega os dados armazenados no card
        const userId = parseInt(card.dataset.userId, 10);
        const userEmail = card.dataset.userEmail;
        const userName = card.dataset.userName;
        const userAvatar = card.dataset.userAvatar; // Este será o caminho relativo

        setActiveConversation(userId, userEmail, userName, userAvatar);
    }

    function setActiveConversation(id, email, nome, avatarPath) {
        activeConversation = { id, email, nome, avatar: avatarPath };

        // Atualiza a UI da lista (destaca o card selecionado)
        document.querySelectorAll('.convo-card').forEach(card => {
            card.classList.remove('selected');
            if (parseInt(card.dataset.userId, 10) === id) {
                card.classList.add('selected');
            }
        });

        renderChatHeader();
        fetchAndRenderMessages(id);

        elements.chatInput.disabled = false;
        elements.chatSendBtn.disabled = false;
        elements.chatInput.focus();
    }
    
    function renderEmptyChat() {
        elements.chatHeaderArea.innerHTML = '';
        elements.chatMessagesArea.innerHTML = `<div class="empty-chat">Selecione uma conversa para começar ou inicie uma nova.</div>`;
        elements.chatInput.disabled = true;
        elements.chatSendBtn.disabled = true;
    }

    function renderChatHeader() {
        if (!activeConversation.id) {
            elements.chatHeaderArea.innerHTML = '';
            return;
        }
        
        const avatarUrl = activeConversation.avatar ? `${backendUrl}${activeConversation.avatar}` : defaultAvatarUrl;

        const headerHTML = `
            <div class="chat-group-info">
                <img src="${avatarUrl}" class="chat-group-avatar" alt="${activeConversation.nome}">
                <div>
                    <h3 class="chat-group-title">${activeConversation.nome}</h3>
                    </div>
            </div>
        `;
        elements.chatHeaderArea.innerHTML = headerHTML;
    }

    async function fetchAndRenderMessages(otherUserId) {
        elements.chatMessagesArea.innerHTML = '<div class="empty-chat">Carregando histórico...</div>';
        
        // Verifica se já temos o histórico em cache
        if (chatMessages.has(otherUserId)) {
            renderMessages(chatMessages.get(otherUserId));
            return;
        }

        try {
            // Busca o histórico de mensagens entre o usuário logado e o outro usuário
            const response = await axios.get(`${backendUrl}/api/chat/privado/${currentUser.id}/${otherUserId}`);
            const messages = response.data.sort((a, b) => new Date(a.dataEnvio) - new Date(b.dataEnvio));
            
            // Salva no cache
            chatMessages.set(otherUserId, messages);
            renderMessages(messages);

        } catch (error) {
            console.error("Erro ao buscar histórico de mensagens:", error);
            elements.chatMessagesArea.innerHTML = `<div class="empty-chat">Não foi possível carregar as mensagens.</div>`;
        }
    }

    function renderMessages(messages) {
        if (!elements.chatMessagesArea) return;
        elements.chatMessagesArea.innerHTML = '';

        if (!messages || messages.length === 0) {
            elements.chatMessagesArea.innerHTML = `<div class="empty-chat">Nenhuma mensagem ainda. Envie a primeira!</div>`;
            return;
        }

        let lastAuthorId = null;
        let currentMessageBlock = null;

        messages.forEach(msg => {
            const user = {
                id: msg.remetenteId,
                nome: msg.nomeRemetente,
                // Assumindo que o DTO de saída não tem o avatar; podemos pegar do activeConversation
                avatar: (msg.remetenteId === currentUser.id) 
                    ? (currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl)
                    : (activeConversation.avatar ? `${backendUrl}${activeConversation.avatar}` : defaultAvatarUrl)
            };
            
            const sideClass = msg.remetenteId === currentUser.id ? 'me' : 'outro';

            if (msg.remetenteId !== lastAuthorId) {
                const currentMessageGroup = document.createElement('div');
                currentMessageGroup.className = `message-group ${sideClass}`;
                
                const avatarHTML = (sideClass === 'outro') ? `<div class="message-avatar"><img src="${user.avatar}" alt="${user.nome}"></div>` : '';
                
                currentMessageBlock = document.createElement('div');
                currentMessageBlock.className = 'message-block';
                
                if (sideClass === 'outro') {
                    const header = document.createElement('div');
                    header.className = 'message-author-header';
                    const dataFormatada = new Date(msg.dataEnvio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    header.innerHTML = `<strong>${user.nome.split(" ")[0]}</strong><span>${dataFormatada}</span>`;
                    currentMessageBlock.appendChild(header);
                }

                if (avatarHTML) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = avatarHTML;
                    currentMessageGroup.appendChild(tempDiv.firstChild);
                }
                currentMessageGroup.appendChild(currentMessageBlock);
                
                elements.chatMessagesArea.appendChild(currentMessageGroup);
            }

            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = msg.conteudo; // Usar textContent para segurança

            if (currentMessageBlock) {
                currentMessageBlock.appendChild(messageContent);
            }
            
            lastAuthorId = msg.remetenteId;
        });

        // Scroll para a última mensagem
        elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
    }

    function handleSendMessage(e) {
        e.preventDefault();
        if (!activeConversation.id || !stompClient) return;

        const content = elements.chatInput.value.trim();
        if (!content) return;

        const messageData = {
            conteudo: content,
            destinatarioId: activeConversation.id
        };
        
        // Envia a mensagem para o endpoint WebSocket do backend
        stompClient.send(`/app/privado/${activeConversation.id}`, {}, JSON.stringify(messageData));

        elements.chatInput.value = '';
        elements.chatInput.focus();
    }

    function onMessageReceived(payload) {
        const message = JSON.parse(payload.body);

        // Determina de qual conversa esta mensagem faz parte
        const eMinha = message.remetenteId === currentUser.id;
        const otherUserId = eMinha ? message.destinatarioId : message.remetenteId;

        // Atualiza a "caixa de entrada" (lista de conversas)
        const convoIndex = conversas.findIndex(c => c.outroUsuarioId === otherUserId);
        if (convoIndex > -1) {
            // Conversa existente, atualiza e move para o topo
            const convo = conversas.splice(convoIndex, 1)[0];
            convo.conteudoUltimaMensagem = message.conteudo;
            convo.dataEnvioUltimaMensagem = message.dataEnvio;
            convo.remetenteUltimaMensagemId = message.remetenteId;
            conversas.unshift(convo);
        } else {
            // Nova conversa, precisamos criar um novo card de resumo
            const newConvoSummary = {
                outroUsuarioId: otherUserId,
                nomeOutroUsuario: message.nomeRemetente,
                emailOutroUsuario: message.remetenteEmail,
                fotoPerfilOutroUsuario: null, // Idealmente, a notificação push teria a foto
                conteudoUltimaMensagem: message.conteudo,
                dataEnvioUltimaMensagem: message.dataEnvio,
                remetenteUltimaMensagemId: message.remetenteId
            };
            conversas.unshift(newConvoSummary);
            
            // Se for uma nova conversa, adiciona ao cache de mensagens
             if (!chatMessages.has(otherUserId)) {
                chatMessages.set(otherUserId, []);
            }
        }
        
        // Adiciona a mensagem ao cache da conversa
        if (chatMessages.has(otherUserId)) {
            chatMessages.get(otherUserId).push(message);
        }

        // Re-renderiza a lista de conversas para mostrar a mais recente no topo
        renderConversationsList();

        // Se a mensagem for da conversa ativa, renderiza na tela
        if (otherUserId === activeConversation.id) {
            renderMessages(chatMessages.get(otherUserId));
        } else {
            // Opcional: mostrar uma notificação de "nova mensagem"
            showNotification(`Nova mensagem de ${message.nomeRemetente}`, 'info');
        }
    }
    
    function openNewConversationModal() {
        if (!elements.newConvoUserList || !elements.addConvoModal) return;

        // Filtra amigos que já estão na lista de conversas
        const existingDmUserIds = conversas.map(c => c.outroUsuarioId);
        
        const availableFriends = userFriends.filter(friend => 
             // **NOTA:** Isso assume que seu DTO de /api/amizades/ (userFriends) tem 'usuarioId'
            friend.usuarioId && !existingDmUserIds.includes(friend.usuarioId)
        );

        elements.newConvoUserList.innerHTML = ''; 

        if (availableFriends.length === 0) {
            elements.newConvoUserList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">Não há novos amigos para conversar.</p>`;
        } else {
            availableFriends.forEach(friend => {
                const userItem = document.createElement('div');
                userItem.className = 'user-list-item';
                // Armazena os dados do amigo
                userItem.dataset.userId = friend.usuarioId;
                userItem.dataset.userName = friend.nome;
                userItem.dataset.userEmail = friend.email;
                userItem.dataset.userAvatar = friend.fotoPerfil || '';

                const avatarUrl = friend.fotoPerfil ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` : defaultAvatarUrl;
                userItem.innerHTML = `<img src="${avatarUrl}" alt="${friend.nome}"><span>${friend.nome}</span>`;
                elements.newConvoUserList.appendChild(userItem);
            });
        }
        
        elements.userSearchInput.value = '';
        elements.addConvoModal.style.display = 'flex';
        elements.userSearchInput.focus();
    }
    
    function startNewDmConversation(e) {
        const userItem = e.target.closest('.user-list-item');
        if (!userItem) return;

        const userId = parseInt(userItem.dataset.userId, 10);
        const userName = userItem.dataset.userName;
        const userEmail = userItem.dataset.userEmail;
        const userAvatar = userItem.dataset.userAvatar; // Caminho relativo

        // Adiciona um card temporário
        const avatarUrl = userAvatar ? `${backendUrl}/api/arquivos/${userAvatar}` : defaultAvatarUrl;
        const tempCard = createTempConvoCard(userId, userEmail, userName, avatarUrl);
        elements.conversationsList.prepend(tempCard);
        
        elements.addConvoModal.style.display = 'none';
        
        // Seleciona a conversa
        setActiveConversation(userId, userEmail, userName, userAvatar);
    }
    
    function filterAvailableUsers(e) {
        const query = e.target.value.toLowerCase();
        const allItems = elements.newConvoUserList.querySelectorAll('.user-list-item');
        allItems.forEach(item => {
            const userName = item.querySelector('span').textContent.toLowerCase();
            item.style.display = userName.includes(query) ? 'flex' : 'none';
        });
    }


    // --- FUNÇÕES DE UI GERAL (copiadas de amizades.js) ---
    function updateUIWithUserData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
        if (elements.topbarUserName) elements.topbarUserName.textContent = user.nome;
        if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
        if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.titulo || "Membro da Comunidade";
        if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
        if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
    }

    function showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `notification ${type}`;
        notification.textContent = message;
        if (elements.notificationCenter) elements.notificationCenter.appendChild(notification);
        setTimeout(() => { notification.classList.add("show"); }, 10);
        setTimeout(() => {
            notification.classList.remove("show");
            setTimeout(() => { notification.remove(); }, 300);
        }, 5000);
    }

    // --- LÓGICA DO WEBSOCKET (Geral) ---
    function connectWebSocket() {
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        const headers = { Authorization: `Bearer ${jwtToken}` };

        stompClient.connect(headers, (frame) => {
            console.log("CONECTADO AO WEBSOCKET");

            // Inscrição para Notificações (Amizades, etc.)
            stompClient.subscribe(`/user/${currentUser.email}/queue/notifications`, (message) => {
                // (Lógica de notificação copiada de amizades.js)
                const newNotification = JSON.parse(message.body);
                showNotification(`Nova notificação: ${newNotification.mensagem}`, 'info');
                if (elements.notificationsList) {
                    const emptyState = elements.notificationsList.querySelector('.empty-state');
                    if (emptyState) emptyState.remove();
                    const newItem = createNotificationElement(newNotification);
                    elements.notificationsList.prepend(newItem);
                }
                if (elements.notificationsBadge) {
                    const currentCount = parseInt(elements.notificationsBadge.textContent) || 0;
                    const newCount = currentCount + 1;
                    elements.notificationsBadge.textContent = newCount;
                    elements.notificationsBadge.style.display = 'flex';
                }
            });

            // Inscrição para Mensagens Privadas
            stompClient.subscribe(`/user/${currentUser.email}/queue/usuario`, onMessageReceived);

            // (Opcional) Inscrição para status online
            stompClient.subscribe("/topic/status", (message) => {
                // Você pode usar isso para atualizar os pontos de status
                // latestOnlineEmails = JSON.parse(message.body);
            });

        }, (error) => console.error("ERRO WEBSOCKET:", error));
    }


    // --- FUNÇÕES DE NOTIFICAÇÃO (copiadas de amizades.js) ---
    async function fetchNotifications() {
        try {
            const response = await axios.get(`${backendUrl}/api/notificacoes`);
            renderNotifications(response.data);
        } catch (error) {
            console.error("Erro ao buscar notificações:", error);
        }
    }

    function renderNotifications(notifications) {
        if (!elements.notificationsList) return;
        elements.notificationsList.innerHTML = '';
        const unreadCount = notifications.filter(n => !n.lida).length;

        if (elements.notificationsBadge) {
            elements.notificationsBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
            elements.notificationsBadge.textContent = unreadCount;
        }
        if (notifications.length === 0) {
            elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
            return;
        }
        notifications.forEach(notification => {
            const item = createNotificationElement(notification);
            elements.notificationsList.appendChild(item);
        });
    }

    function createNotificationElement(notification) {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.id = `notification-item-${notification.id}`;
        if (!notification.lida) item.classList.add('unread');
        const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
        let actionButtonsHtml = '';
        let iconClass = 'fa-info-circle';

        if (notification.tipo === 'PEDIDO_AMIZADE' && !notification.lida) {
            iconClass = 'fa-user-plus';
            actionButtonsHtml = `
              <div class="notification-actions">
                 <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                 <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
              </div>`;
        }
        item.innerHTML = `
         <a href="amizades.html" class="notification-link" onclick="window.markNotificationAsRead(event, ${notification.id})">
                <div class="notification-icon-wrapper"><i class="fas ${iconClass}"></i></div>
                <div class="notification-content">
                    <p>${notification.mensagem}</p>
                    <span class="timestamp">${data}</span>
                </div>
            </a>
            <div class="notification-actions-wrapper">${actionButtonsHtml}</div>`;
        const actionsWrapper = item.querySelector('.notification-actions-wrapper');
        if (actionsWrapper) {
            actionsWrapper.addEventListener('click', e => e.stopPropagation());
        }
        return item;
    }
    
    // (Funções de aceitar/recusar solicitação e marcar como lida - copiadas de amizades.js)
    window.aceitarSolicitacao = async (amizadeId, notificationId) => {
        try {
            await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
            handleFriendRequestFeedback(notificationId, 'Pedido aceito!', 'success');
            fetchFriends(); // Atualiza a lista de amigos
        } catch (error) { console.error('Erro ao aceitar solicitação:', error); }
    };
    window.recusarSolicitacao = async (amizadeId, notificationId) => {
        try {
            await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
            handleFriendRequestFeedback(notificationId, 'Pedido recusado.', 'info');
        } catch (error) { console.error('Erro ao recusar solicitação:', error); }
    };
    function handleFriendRequestFeedback(notificationId, message, type = 'info') {
        const item = document.getElementById(`notification-item-${notificationId}`);
        if(item) {
            const actions = item.querySelector('.notification-actions-wrapper');
            if(actions) actions.innerHTML = `<p class="feedback-text ${type}">${message}</p>`;
            setTimeout(() => item.remove(), 2500);
        }
        fetchNotifications();
    }
    window.markNotificationAsRead = async (event, notificationId) => {
        if (event) event.preventDefault();
        const item = document.getElementById(`notification-item-${notificationId}`);
        if (item && item.classList.contains('unread')) {
            item.classList.remove('unread');
            try {
                await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
                fetchNotifications(); 
            } catch (error) { item.classList.add('unread'); } 
            finally { if (event) window.location.href = event.currentTarget.href; }
        } else { if (event) window.location.href = event.currentTarget.href; }
    };
    async function markAllNotificationsAsRead() {
        const unreadCount = parseInt(elements.notificationsBadge.textContent, 10);
        if (isNaN(unreadCount) || unreadCount === 0) return;
        try {
            await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
            if(elements.notificationsBadge) {
                elements.notificationsBadge.style.display = 'none';
                elements.notificationsBadge.textContent = '0';
            }
            if(elements.notificationsList) {
                elements.notificationsList.querySelectorAll('.notification-item.unread').forEach(item => item.classList.remove('unread'));
            }
        } catch (error){ console.error("Erro ao marcar todas como lidas:", error); }
    }
    

    // --- FUNÇÕES DE MODAIS E MENUS (copiadas de amizades.js) ---
    const closeAllMenus = () => {
        document.querySelectorAll('.options-menu, .dropdown-menu').forEach(m => m.style.display = 'none');
    };
    function openEditProfileModal() {
        if (!currentUser || !elements.editProfileModal) return;
        elements.editProfilePicPreview.src = currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl;
        elements.editProfileName.value = currentUser.nome;
        elements.editProfileBio.value = currentUser.bio || "";
        if (currentUser.dataNascimento) elements.editProfileDob.value = currentUser.dataNascimento.split("T")[0];
        elements.editProfilePassword.value = "";
        elements.editProfilePasswordConfirm.value = "";
        elements.editProfileModal.style.display = "flex";
    }
    function openDeleteAccountModal() {
        if (elements.deleteConfirmPassword) elements.deleteConfirmPassword.value = "";
        if (elements.deleteAccountModal) elements.deleteAccountModal.style.display = "flex";
    }

    // --- SETUP DOS EVENT LISTENERS ---
    function setupEventListeners() {
        // Listener de Tema
        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Listeners Globais
        document.body.addEventListener("click", (e) => {
            if (elements.notificationsPanel && !elements.notificationsPanel.contains(e.target) && !elements.notificationsIcon.contains(e.target)) {
                elements.notificationsPanel.style.display = 'none';
            }
            closeAllMenus();
        });

        // Listeners de Notificações
        if (elements.notificationsIcon) {
            elements.notificationsIcon.addEventListener('click', (event) => {
                event.stopPropagation();
                const panel = elements.notificationsPanel;
                const isVisible = panel.style.display === 'block';
                panel.style.display = isVisible ? 'none' : 'block';
                if (!isVisible) markAllNotificationsAsRead();
            });
        }

        // Listener Dropdown de Usuário
        if (elements.userDropdownTrigger) {
            elements.userDropdownTrigger.addEventListener("click", (event) => {
                event.stopPropagation();
                const menu = elements.userDropdownTrigger.nextElementSibling;
                if (menu && menu.classList.contains("dropdown-menu")) {
                    const isVisible = menu.style.display === "block";
                    closeAllMenus();
                    if (!isVisible) menu.style.display = "block";
                }
            });
        }

        // Listener de Logout
        if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });

        // Listeners de Modais de Perfil
        if (elements.editProfileBtn) elements.editProfileBtn.addEventListener("click", openEditProfileModal);
        if (elements.deleteAccountBtn) elements.deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
        if (elements.cancelEditProfileBtn) elements.cancelEditProfileBtn.addEventListener("click", () => (elements.editProfileModal.style.display = "none"));
        if (elements.cancelDeleteAccountBtn) elements.cancelDeleteAccountBtn.addEventListener("click", () => (elements.deleteAccountModal.style.display = "none"));
        if (elements.editProfilePicInput) elements.editProfilePicInput.addEventListener("change", () => {
            const file = elements.editProfilePicInput.files[0];
            if (file && elements.editProfilePicPreview) elements.editProfilePicPreview.src = URL.createObjectURL(file);
        });
        
        // (Formulários de Modais de Perfil - copiados de amizades.js)
        if (elements.editProfileForm) elements.editProfileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            let userUpdated = false;
            if (elements.editProfilePicInput.files[0]) {
                const formData = new FormData();
                formData.append("foto", elements.editProfilePicInput.files[0]);
                try {
                    const response = await axios.put(`${backendUrl}/usuarios/me/foto`, formData);
                    currentUser = response.data;
                    userUpdated = true;
                } catch (error) { showNotification("Erro ao atualizar a foto.", "error"); }
            }
            const password = elements.editProfilePassword.value;
            if (password && password !== elements.editProfilePasswordConfirm.value) {
                showNotification("As novas senhas não coincidem.", "error"); return;
            }
            try {
                const response = await axios.put(`${backendUrl}/usuarios/me`, {
                    nome: elements.editProfileName.value,
                    bio: elements.editProfileBio.value,
                    dataNascimento: elements.editProfileDob.value ? new Date(elements.editProfileDob.value).toISOString() : null,
                    senha: password || null,
                });
                currentUser = response.data; userUpdated = true;
            } catch (error) { showNotification("Erro ao atualizar o perfil.", "error"); }
            if (userUpdated) {
                updateUIWithUserData(currentUser);
                showNotification('Perfil atualizado!', 'success');
                elements.editProfileModal.style.display = 'none';
            }
        });
        if (elements.deleteAccountForm) elements.deleteAccountForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const password = elements.deleteConfirmPassword.value;
            if (!password) { showNotification("Digite sua senha para confirmar.", "error"); return; }
            try {
                await axios.post(`${backendUrl}/autenticacao/login`, { email: currentUser.email, senha: password });
                if (confirm("TEM CERTEZA? Esta ação não pode ser desfeita.")) {
                    await axios.delete(`${backendUrl}/usuarios/me`);
                    localStorage.clear(); window.location.href = "login.html";
                }
            } catch (error) { showNotification("Senha incorreta.", "error"); }
        });

        // --- LISTENERS ESPECÍFICOS DO CHAT ---

        // Clique na lista de conversas
        if (elements.conversationsList) {
            elements.conversationsList.addEventListener('click', handleConversationClick);
        }
        
        // Envio de mensagem
        if (elements.chatForm) {
            elements.chatForm.addEventListener('submit', handleSendMessage);
        }
        
        // Filtro de conversas
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
        if (elements.addConvoModal) {
            elements.addConvoModal.addEventListener('click', (e) => {
                if (e.target === elements.addConvoModal) elements.addConvoModal.style.display = 'none';
            });
        }
        if (elements.newConvoUserList) {
            elements.newConvoUserList.addEventListener('click', startNewDmConversation);
        }
        if(elements.userSearchInput) {
            elements.userSearchInput.addEventListener('input', filterAvailableUsers);
        }
    }

    // Inicia a aplicação
    init();
});