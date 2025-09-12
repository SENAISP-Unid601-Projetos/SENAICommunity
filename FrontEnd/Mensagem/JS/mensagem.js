const ChatApp = {
    state: {
        currentUser: { id: 1, nome: "Usuário", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
        allUsers: [
            { id: 1, nome: "Usuário", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
            { id: 2, nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
            { id: 3, nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
            { id: 4, nome: "Matheus B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
            { id: 5, nome: "Yuri Bragança", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
            { id: 6, nome: "Julia Costa", avatar: "https://randomuser.me/api/portraits/women/48.jpg" },
            { id: 7, nome: "Ricardo Neves", avatar: "https://randomuser.me/api/portraits/men/78.jpg" },
            { id: 8, nome: "Beatriz Lima", avatar: "https://randomuser.me/api/portraits/women/88.jpg" }
        ],
        conversations: [
            {
                id: 'g1', type: 'group', nome: "Projeto IoT", avatar: "./img/unnamed.png",
                membros: [{ id: 1, nome: "Usuário", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }, { id: 2, nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }, { id: 3, nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }],
                mensagens: [
                    { autor: 2, texto: "Oi pessoal, novidades do projeto?", hora: "19:01" },
                    { autor: 1, texto: "Ainda não, mas terminei o layout!", hora: "19:02" },
                    { autor: 1, texto: "Vejam o que acham e me deem um feedback depois.", hora: "19:02" },
                    { autor: 3, texto: "Ficou ótimo, Parabéns!", hora: "19:05" },
                    { autor: 3, texto: "Posso revisar o código depois.", hora: "19:05" }
                ]
            },
            {
                id: 'g2', type: 'group', nome: "PrecisionCraft", avatar: "./img/cnc.png",
                membros: [{ id: 1, nome: "Usuário", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },  { id: 2, nome: "Julia", avatar: "https://randomuser.me/api/portraits/women/48.jpg" }, 
                    { id: 8, nome: "Carlos", avatar: "https://randomuser.me/api/portraits/men/51.jpg" }, { id: 9, nome: "Laura", avatar: "https://randomuser.me/api/portraits/women/55.jpg" }
                ],
                mensagens: [ { autor: 6, texto: "Olá Pessoal!", hora: "11:22" } ]
            },
            {
                id: 'dm1', type: 'dm',
                otherUser: { id: 4, nome: "Eliezer B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg", online: true },
                membros: [{ id: 1, nome: "Usuário", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }, { id: 4, nome: "Eliezer B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" }],
                mensagens: [
                    { autor: 4, texto: "E aí,Tudo certo?", hora: "14:50"},
                    { autor: 1, texto: "Opa, tudo joia e você?", hora: "14:51"}
                ]
            }
        ],
        selectedConversationId: null,
        filteredConversations: []
    },
    elements: {
        chatContainer: document.querySelector('.chat-container'),
        conversationsList: document.getElementById('conversations-list'),
        conversationSearch: document.getElementById('convo-search'),
        chatHeaderArea: document.getElementById('chat-header-area'),
        chatHeaderDynamicContent: document.getElementById('chat-header-dynamic-content'),
        chatMessagesArea: document.getElementById('chat-messages-area'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatSendBtn: document.getElementById('chat-send-btn'),
        addGroupBtn: document.querySelector('.add-convo-btn'),
        addConvoModal: document.getElementById('add-convo-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        userSearchInput: document.getElementById('user-search-input'),
        newConvoUserList: document.getElementById('new-convo-user-list')
    },
    render: {
        conversationsList() {
            const { conversationsList } = ChatApp.elements;
            const { filteredConversations, selectedConversationId } = ChatApp.state;
            if (!conversationsList) return;
            conversationsList.innerHTML = '';
            filteredConversations.forEach(convo => {
                const convoCard = document.createElement('div');
                convoCard.className = 'convo-card';
                if (selectedConversationId === convo.id) convoCard.classList.add('selected');
                convoCard.dataset.convoId = convo.id;
                const lastMsg = convo.mensagens.length ? convo.mensagens[convo.mensagens.length - 1] : null;
                let cardHTML = '';
                if (convo.type === 'group') {
                    cardHTML = `<div class="convo-avatar-wrapper"><img src="${convo.avatar}" class="avatar" alt="Grupo"></div><div class="group-info"><div class="group-title">${convo.nome}</div><div class="group-last-msg">${lastMsg ? `<strong>${ChatApp.utils.getUser(convo, lastMsg.autor).nome.split(' ')[0]}:</strong> ${lastMsg.texto}` : "Nenhuma mensagem"}</div></div>`;
                } else {
                    cardHTML = `<div class="convo-avatar-wrapper"><img src="${convo.otherUser.avatar}" class="avatar" alt="Usuário">${convo.otherUser.online ? '<div class="status-dot"></div>' : ''}</div><div class="group-info"><div class="group-title">${convo.otherUser.nome}</div><div class="group-last-msg">${lastMsg ? `${lastMsg.autor === ChatApp.state.currentUser.id ? "Você: " : ""}${lastMsg.texto}` : "Nenhuma mensagem"}</div></div>`;
                }
                convoCard.innerHTML = cardHTML;
                conversationsList.appendChild(convoCard);
            });
        },
        chatHeader() {
            const { chatHeaderDynamicContent } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!chatHeaderDynamicContent) return;
            chatHeaderDynamicContent.innerHTML = '';
            if (!convo) return;
            const backButtonHTML = `<button class="back-to-list-btn"><i class="fas fa-arrow-left"></i></button>`;
            let convoInfoHTML = '';
            if (convo.type === 'group') {
                convoInfoHTML = `<div class="chat-group-info"><img src="${convo.avatar}" class="chat-group-avatar" alt="Grupo"><div><h3 class="chat-group-title">${convo.nome}</h3><div class="chat-members-list">${convo.membros.map(m => m.nome.split(" ")[0]).join(", ")}</div></div></div>`;
            } else {
                convoInfoHTML = `<div class="chat-group-info"><img src="${convo.otherUser.avatar}" class="chat-group-avatar" alt="Usuário"><div><h3 class="chat-group-title">${convo.otherUser.nome}</h3>${convo.otherUser.online ? `<div class="chat-user-status">Online</div>` : ''}</div></div>`;
            }
            chatHeaderDynamicContent.innerHTML = backButtonHTML + convoInfoHTML;
            const backBtn = chatHeaderDynamicContent.querySelector('.back-to-list-btn');
            if (backBtn) {
                backBtn.addEventListener('click', ChatApp.handlers.goBackToList);
            }
        },
        chatMessages() {
            const { chatMessagesArea } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!chatMessagesArea || !convo) { 
                if(chatMessagesArea) chatMessagesArea.innerHTML = `<div class="empty-chat">Selecione uma conversa para começar.</div>`;
                return; 
            }
            chatMessagesArea.innerHTML = '';
            let lastAuthorId = null;
            let currentMessageBlock = null;

            // **INÍCIO DA LÓGICA CORRIGIDA**
            // O loop `forEach` garante que CADA objeto de mensagem no array se torne UM balão.
            convo.mensagens.forEach(msg => {
                const user = ChatApp.utils.getUser(convo, msg.autor);
                const sideClass = msg.autor === ChatApp.state.currentUser.id ? 'me' : 'outro';
                if (msg.autor !== lastAuthorId) {
                    const currentMessageGroup = document.createElement('div');
                    currentMessageGroup.className = `message-group ${sideClass}`;
                    const avatarHTML = (sideClass === 'outro') ? `<div class="message-avatar"><img src="${user.avatar}" alt="${user.nome}"></div>` : '';
                    currentMessageBlock = document.createElement('div');
                    currentMessageBlock.className = 'message-block';
                    if (sideClass === 'outro') {
                        const header = document.createElement('div');
                        header.className = 'message-author-header';
                        header.innerHTML = `<strong>${user.nome.split(" ")[0]}</strong><span>${msg.hora}</span>`;
                        currentMessageBlock.appendChild(header);
                    }
                    if (avatarHTML) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = avatarHTML;
                        currentMessageGroup.appendChild(tempDiv.firstChild);
                    }
                    currentMessageGroup.appendChild(currentMessageBlock);
                    chatMessagesArea.appendChild(currentMessageGroup);
                }
                const messageContent = document.createElement('div');
                messageContent.className = 'message-content';
                // A linha abaixo pega o texto da mensagem (msg.texto) e o insere no balão.
                // Ela NÃO divide o texto por espaços.
                messageContent.innerHTML = msg.texto.replace(/\n/g, '<br>');
                if (currentMessageBlock) {
                    currentMessageBlock.appendChild(messageContent);
                }
                lastAuthorId = msg.autor;
            });
            // **FIM DA LÓGICA CORRIGIDA**
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        }
    },
    handlers: {
        selectConversation(convoId) {
            ChatApp.state.selectedConversationId = convoId;
            const { chatInput, chatSendBtn, chatContainer } = ChatApp.elements;
            ChatApp.render.conversationsList();
            ChatApp.render.chatHeader();
            ChatApp.render.chatMessages();
            if (chatInput) chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;
            if (chatInput) chatInput.focus();
            if (chatContainer) {
                chatContainer.classList.add('mobile-chat-active');
            }
        },
        goBackToList() {
            const { chatContainer } = ChatApp.elements;
            if (chatContainer) {
                chatContainer.classList.remove('mobile-chat-active');
            }
            ChatApp.state.selectedConversationId = null; 
            ChatApp.render.conversationsList();
        },
        sendMessage(e) {
            e.preventDefault();
            const { chatInput } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!convo || !chatInput) return;
            const texto = chatInput.value.trim();
            if (!texto) return;

            // **INÍCIO DA LÓGICA CORRIGIDA**
            // A linha abaixo pega o VALOR COMPLETO do campo de texto e o adiciona
            // como um ÚNICO objeto no array de mensagens. Não há divisão do texto aqui.
            convo.mensagens.push({
                autor: ChatApp.state.currentUser.id,
                texto: texto,
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
            // **FIM DA LÓGICA CORRIGIDA**
            
            chatInput.value = '';
            chatInput.focus();
            ChatApp.render.chatMessages();
            ChatApp.render.conversationsList();
        },
        filterConversations(e) {
            const query = e.target.value.toLowerCase();
            ChatApp.state.filteredConversations = ChatApp.state.conversations.filter(c => {
                const nameToSearch = c.type === 'group' ? c.nome : c.otherUser.nome;
                return nameToSearch.toLowerCase().includes(query);
            });
            ChatApp.render.conversationsList();
        },
        openNewConversationModal() {
            const { newConvoUserList, addConvoModal, userSearchInput } = ChatApp.elements;
            if (!newConvoUserList || !addConvoModal) return;
            const existingDmUserIds = ChatApp.state.conversations
                .filter(c => c.type === 'dm')
                .map(c => c.otherUser.id);
            const availableUsers = ChatApp.state.allUsers.filter(user => 
                user.id !== ChatApp.state.currentUser.id && !existingDmUserIds.includes(user.id)
            );
            newConvoUserList.innerHTML = ''; 
            if (availableUsers.length === 0) {
                newConvoUserList.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">Não há novos usuários para conversar.</p>`;
            } else {
                availableUsers.forEach(user => {
                    const userItem = document.createElement('div');
                    userItem.className = 'user-list-item';
                    userItem.dataset.userId = user.id;
                    userItem.innerHTML = `<img src="${user.avatar}" alt="${user.nome}"><span>${user.nome}</span>`;
                    newConvoUserList.appendChild(userItem);
                });
            }
            userSearchInput.value = '';
            addConvoModal.style.display = 'flex';
            userSearchInput.focus();
        },
        closeNewConversationModal() {
            const { addConvoModal } = ChatApp.elements;
            if (addConvoModal) {
                addConvoModal.style.display = 'none';
            }
        },
        startNewDmConversation(e) {
            const userItem = e.target.closest('.user-list-item');
            if (!userItem) return;
            const targetUserId = parseInt(userItem.dataset.userId, 10);
            const targetUser = ChatApp.state.allUsers.find(u => u.id === targetUserId);
            const currentUser = ChatApp.state.currentUser;
            if (!targetUser) return;
            const newConvoId = `dm_${currentUser.id}-${targetUser.id}`;
            const newConversation = {
                id: newConvoId,
                type: 'dm',
                otherUser: { id: targetUser.id, nome: targetUser.nome, avatar: targetUser.avatar, online: false },
                membros: [currentUser, targetUser],
                mensagens: []
            };
            ChatApp.state.conversations.unshift(newConversation);
            ChatApp.state.filteredConversations = [...ChatApp.state.conversations];
            ChatApp.handlers.closeNewConversationModal();
            ChatApp.render.conversationsList();
            ChatApp.handlers.selectConversation(newConvoId);
        },
        filterAvailableUsers(e) {
            const query = e.target.value.toLowerCase();
            const allItems = ChatApp.elements.newConvoUserList.querySelectorAll('.user-list-item');
            allItems.forEach(item => {
                const userName = item.querySelector('span').textContent.toLowerCase();
                if (userName.includes(query)) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });
        }
    },
    utils: {
        getSelectedConversation() {
            return ChatApp.state.conversations.find(c => c.id === ChatApp.state.selectedConversationId);
        },
        getUser(convo, userId) {
            let user = convo.membros.find(m => m.id === userId);
            if (!user) {
                user = ChatApp.state.allUsers.find(u => u.id === userId);
            }
            return user || { nome: 'Desconhecido', avatar: '' };
        }
    },
    init() {
        this.state.filteredConversations = [...this.state.conversations];
        const { conversationsList, conversationSearch, chatForm, addGroupBtn, closeModalBtn, addConvoModal, newConvoUserList, userSearchInput } = this.elements;
        if (conversationsList) {
            conversationsList.addEventListener('click', (e) => {
                const card = e.target.closest('.convo-card');
                if (card) this.handlers.selectConversation(card.dataset.convoId);
            });
        }
        if (conversationSearch) {
            conversationSearch.addEventListener('input', (e) => this.handlers.filterConversations(e));
        }
        if (chatForm) {
            chatForm.addEventListener('submit', (e) => this.handlers.sendMessage(e));
        }
        if (addGroupBtn) {
            addGroupBtn.addEventListener('click', () => this.handlers.openNewConversationModal());
        }
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.handlers.closeNewConversationModal());
        }
        if (addConvoModal) {
            addConvoModal.addEventListener('click', (e) => {
                if (e.target === addConvoModal) {
                    this.handlers.closeNewConversationModal();
                }
            });
        }
        if (newConvoUserList) {
            newConvoUserList.addEventListener('click', (e) => this.handlers.startNewDmConversation(e));
        }
        if(userSearchInput) {
            userSearchInput.addEventListener('input', (e) => this.handlers.filterAvailableUsers(e));
        }
        const collapseBtn = document.getElementById('collapse-sidebar-btn');
        const expandBtn = document.getElementById('expand-sidebar-btn');
        const chatContainer = document.querySelector('.chat-container');
        if (collapseBtn && expandBtn && chatContainer) {
            collapseBtn.addEventListener('click', () => {
                chatContainer.classList.add('sidebar-collapsed');
            });
            expandBtn.addEventListener('click', () => {
                chatContainer.classList.remove('sidebar-collapsed');
            });
        }
        this.render.conversationsList();
        this.render.chatHeader();
        this.render.chatMessages();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (typeof ChatApp !== 'undefined') {
        ChatApp.init();
    }
});