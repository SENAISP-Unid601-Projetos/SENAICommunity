const ChatApp = {
    state: {
        currentUser: { id: 1, nome: "Vinicius Gallo Santos", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
        conversations: [
            {
                id: 'g1', type: 'group', nome: "Projeto IoT", avatar: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80",
                membros: [{ id: 1, nome: "Vinicius Gallo Santos", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }, { id: 2, nome: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg" }, { id: 3, nome: "Ana Silva", avatar: "https://randomuser.me/api/portraits/women/33.jpg" }],
                mensagens: [
                    { autor: 2, texto: "Oi pessoal, novidades do projeto?", hora: "19:01" },
                    { autor: 1, texto: "Ainda não, mas terminei o layout!", hora: "19:02" },
                    { autor: 1, texto: "Vejam o que acham e me deem um feedback depois.", hora: "19:02" },
                    { autor: 3, texto: "Ficou ótimo, Vini! Parabéns!", hora: "19:05" },
                    { autor: 3, texto: "Posso revisar o código depois.", hora: "19:05" }
                ]
            },
            {
                id: 'dm1', type: 'dm',
                otherUser: { id: 4, nome: "Matheus B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg", online: true },
                membros: [{ id: 1, nome: "Vinicius Gallo Santos", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }, { id: 4, nome: "Matheus B.", avatar: "https://randomuser.me/api/portraits/men/45.jpg" }],
                mensagens: [
                    { autor: 4, texto: "E aí, Vinicius! Tudo certo?", hora: "14:50"},
                    { autor: 1, texto: "Opa, tudo joia e você?", hora: "14:51"}
                ]
            },
            {
                id: 'g2', type: 'group', nome: "Trabalho de ADS", avatar: "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=80",
                membros: [{ id: 1, nome: "Vinicius Gallo Santos", avatar: "https://randomuser.me/api/portraits/men/32.jpg" }, { id: 5, nome: "Yuri Bragança", avatar: "https://randomuser.me/api/portraits/men/67.jpg" }],
                mensagens: [{ autor: 5, texto: "Posso entregar o diagrama amanhã.", hora: "18:27" }]
            }
        ],
        selectedConversationId: null,
        filteredConversations: []
    },
    elements: {
        conversationsList: document.getElementById('conversations-list'),
        conversationSearch: document.getElementById('convo-search'),
        chatHeaderArea: document.getElementById('chat-header-area'),
        chatMessagesArea: document.getElementById('chat-messages-area'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatSendBtn: document.getElementById('chat-send-btn'),
        addGroupBtn: document.querySelector('.add-convo-btn')
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
            const { chatHeaderArea } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!chatHeaderArea) return;
            if (!convo) { if(chatHeaderArea) chatHeaderArea.innerHTML = ''; return; }
            let headerHTML = '';
            if (convo.type === 'group') {
                headerHTML = `<div class="chat-group-info"><img src="${convo.avatar}" class="chat-group-avatar" alt="Grupo"><div><h3 class="chat-group-title">${convo.nome}</h3><div class="chat-members-list">${convo.membros.map(m => m.nome.split(" ")[0]).join(", ")}</div></div></div>`;
            } else {
                headerHTML = `<div class="chat-group-info"><img src="${convo.otherUser.avatar}" class="chat-group-avatar" alt="Usuário"><div><h3 class="chat-group-title">${convo.otherUser.nome}</h3>${convo.otherUser.online ? `<div class="chat-user-status">Online</div>` : ''}</div></div>`;
            }
            chatHeaderArea.innerHTML = headerHTML;
        },
        chatMessages() {
            const { chatMessagesArea } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!chatMessagesArea) return;
            if (!convo) { chatMessagesArea.innerHTML = `<div class="empty-chat">Selecione uma conversa para começar.</div>`; return; }

            chatMessagesArea.innerHTML = '';
            let lastAuthorId = null;
            convo.mensagens.forEach(msg => {
                const user = ChatApp.utils.getUser(convo, msg.autor);
                if (msg.autor !== lastAuthorId) {
                    const messageGroup = document.createElement('div');
                    const sideClass = msg.autor === ChatApp.state.currentUser.id ? 'me' : 'outro';
                    messageGroup.className = `message-group ${sideClass}`;
                    let avatarHTML = (sideClass === 'outro') ? `<div class="message-avatar"><img src="${user.avatar}" alt="${user.nome}"></div>` : '';
                    messageGroup.innerHTML = `${avatarHTML}<div class="message-block"><div class="message-author-header"><strong>${user.nome.split(" ")[0]}</strong><span>${msg.hora}</span></div></div>`;
                    chatMessagesArea.appendChild(messageGroup);
                }
                
                // BUG FIX: Seletor corrigido para encontrar o bloco de mensagem correto.
                const lastMessageBlock = chatMessagesArea.querySelector('.message-group:last-child .message-block');

                if(lastMessageBlock) {
                    const messageContent = document.createElement('div');
                    messageContent.className = 'message-content';
                    messageContent.textContent = msg.texto;
                    lastMessageBlock.appendChild(messageContent);
                }
                lastAuthorId = msg.autor;
            });
            chatMessagesArea.scrollTop = chatMessagesArea.scrollHeight;
        }
    },
    handlers: {
        selectConversation(convoId) {
            ChatApp.state.selectedConversationId = convoId;
            const { chatInput, chatSendBtn } = ChatApp.elements;
            ChatApp.render.conversationsList();
            ChatApp.render.chatHeader();
            ChatApp.render.chatMessages();
            if (chatInput) chatInput.disabled = false;
            if (chatSendBtn) chatSendBtn.disabled = false;
            if (chatInput) chatInput.focus();
        },
        sendMessage(e) {
            e.preventDefault();
            const { chatInput } = ChatApp.elements;
            const convo = ChatApp.utils.getSelectedConversation();
            if (!convo || !chatInput) return;
            const texto = chatInput.value.trim();
            if (!texto) return;
            convo.mensagens.push({
                autor: ChatApp.state.currentUser.id,
                texto: texto,
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
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
        }
    },
    utils: {
        getSelectedConversation() {
            return ChatApp.state.conversations.find(c => c.id === ChatApp.state.selectedConversationId);
        },
        getUser(convo, userId) {
            return convo.membros.find(m => m.id === userId) || { nome: 'Desconhecido', avatar: '' };
        }
    },
    init() {
        const { conversationsList, conversationSearch, chatForm, addGroupBtn } = this.elements;
        this.state.filteredConversations = [...this.state.conversations];
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
            addGroupBtn.addEventListener('click', () => alert('Funcionalidade para criar nova conversa em breve!'));
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