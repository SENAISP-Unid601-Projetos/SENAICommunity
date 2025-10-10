document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = "http://localhost:8080";
    const jwtToken = localStorage.getItem("token");
    let stompClient = null;
    let currentUser = null;
    let conversas = []; // Armazenará as conversas (amigos e projetos)
    let selectedConversationId = null; // Guardará o ID da conversa ativa (ex: 'user_42' ou 'project_15')

    // --- ELEMENTOS DO DOM ---
    const elements = {
        conversationsList: document.getElementById('conversations-list'),
        chatHeaderArea: document.getElementById('chat-header-area'),
        chatMessagesArea: document.getElementById('chat-messages-area'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        chatSendBtn: document.getElementById('chat-send-btn'),
    };

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!jwtToken) {
            window.location.href = "login.html";
            return;
        }
        axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

        try {
            // 1. Busca os dados do usuário logado
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;
            
            // 2. Conecta ao WebSocket
            connectWebSocket();

            // 3. Busca as conversas (amigos e projetos)
            await fetchConversations();

            // 4. Verifica se a URL veio com um ID de usuário para abrir a conversa
            const urlParams = new URLSearchParams(window.location.search);
            const userIdToOpen = urlParams.get('withUser');

            if (userIdToOpen) {
                // Se um ID foi passado, seleciona a conversa com esse usuário
                const conversationId = `user_${userIdToOpen}`;
                await selectConversation(conversationId);
            }

            // 5. Configura os event listeners
            setupEventListeners();
        } catch (error) {
            console.error("ERRO CRÍTICO NA INICIALIZAÇÃO DO CHAT:", error);
            // Lógica de erro, como redirecionar para o login
        }
    }

    // --- LÓGICA DO WEBSOCKET ---
    function connectWebSocket() {
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Desativa logs do stomp no console
        const headers = { Authorization: `Bearer ${jwtToken}` };

        stompClient.connect(headers, (frame) => {
            console.log("CONECTADO AO WEBSOCKET DE MENSAGENS");

            // Inscrição para receber mensagens privadas
            stompClient.subscribe(`/user/${currentUser.email}/queue/usuario`, (message) => {
                const novaMensagem = JSON.parse(message.body);
                handleNovaMensagem(novaMensagem, 'private');
            });

            // Inscrição em todos os chats de projeto do usuário
            conversas.filter(c => c.type === 'project').forEach(proj => {
                stompClient.subscribe(`/topic/projeto/${proj.id}`, (message) => {
                    const payload = JSON.parse(message.body);
                    handleNovaMensagem(payload, 'project', proj.id);
                });
            });

        }, (error) => console.error("ERRO WEBSOCKET:", error));
    }

    // --- BUSCA DE DADOS (API) ---
    async function fetchConversations() {
        try {
            // Busca amigos e projetos em paralelo para mais performance
            const [amigosResponse, projetosResponse] = await Promise.all([
                axios.get(`${backendUrl}/api/amizades/`),
                axios.get(`${backendUrl}/projetos/meus`) // Supondo que este endpoint exista
            ]);

            // Mapeia amigos para o formato de conversa
            const conversasAmigos = amigosResponse.data.map(amigo => ({
                id: `user_${amigo.amigoId}`,
                type: 'user',
                displayName: amigo.nome,
                avatarUrl: amigo.fotoPerfil ? `${backendUrl}/api/arquivos/${amigo.fotoPerfil}` : 'caminho/para/avatar/padrao.png',
                targetId: amigo.amigoId, // ID do outro usuário
                messages: [] // Começa vazio, será carregado ao clicar
            }));

            // Mapeia projetos para o formato de conversa
            const conversasProjetos = projetosResponse.data.map(projeto => ({
                id: `project_${projeto.id}`,
                type: 'project',
                displayName: projeto.titulo,
                avatarUrl: projeto.imagemUrl ? `${backendUrl}/projetos/imagens/${projeto.imagemUrl}` : 'caminho/para/avatar/padrao_projeto.png',
                targetId: projeto.id, // ID do projeto
                messages: []
            }));

            conversas = [...conversasAmigos, ...conversasProjetos];
            renderConversationsList();
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO (UI) ---
    function renderConversationsList() {
        elements.conversationsList.innerHTML = '';
        conversas.forEach(convo => {
            const card = document.createElement('div');
            card.className = 'convo-card';
            card.dataset.convoId = convo.id;
            if (convo.id === selectedConversationId) {
                card.classList.add('selected');
            }

            const iconClass = convo.type === 'project' ? 'fa-users' : 'fa-user';

            card.innerHTML = `
                <div class="convo-avatar-wrapper">
                    <img src="${convo.avatarUrl}" class="avatar" alt="Avatar">
                </div>
                <div class="group-info">
                    <div class="group-title">
                        <i class="fas ${iconClass}"></i> ${convo.displayName}
                    </div>
                    <div class="group-last-msg" id="last-msg-${convo.id}">Nenhuma mensagem</div>
                </div>
            `;
            elements.conversationsList.appendChild(card);
        });
    }

    function renderChatHeader() {
        const convo = conversas.find(c => c.id === selectedConversationId);
        if (!convo) {
            elements.chatHeaderArea.innerHTML = '';
            return;
        }
        elements.chatHeaderArea.innerHTML = `
            <div class="chat-group-info">
                <img src="${convo.avatarUrl}" class="chat-group-avatar" alt="Avatar">
                <div>
                    <h3 class="chat-group-title">${convo.displayName}</h3>
                </div>
            </div>
        `;
    }

    function renderChatMessages() {
        const convo = conversas.find(c => c.id === selectedConversationId);
        elements.chatMessagesArea.innerHTML = '';
        if (!convo || convo.messages.length === 0) {
            elements.chatMessagesArea.innerHTML = `<div class="empty-chat">Nenhuma mensagem ainda. Envie a primeira!</div>`;
            return;
        }

        convo.messages.forEach(msg => {
            const messageElement = createMessageElement(msg);
            elements.chatMessagesArea.appendChild(messageElement);
        });
        elements.chatMessagesArea.scrollTop = elements.chatMessagesArea.scrollHeight;
    }

    function createMessageElement(msg) {
        const userIsAuthor = msg.autorId === currentUser.id;
        const sideClass = userIsAuthor ? 'me' : 'outro';

        const messageGroup = document.createElement('div');
        messageGroup.className = `message-group ${sideClass}`;

        const dataFormatada = new Date(msg.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        messageGroup.innerHTML = `
            ${!userIsAuthor ? `<div class="message-avatar"><img src="${msg.urlFotoAutor || 'caminho/padrao'}" alt="${msg.nomeAutor}"></div>` : ''}
            <div class="message-block">
                ${!userIsAuthor ? `
                    <div class="message-author-header">
                        <strong>${msg.nomeAutor.split(" ")[0]}</strong>
                        <span>${dataFormatada}</span>
                    </div>` : ''}
                <div class="message-content">
                    ${msg.conteudo}
                </div>
            </div>
        `;
        return messageGroup;
    }

    // --- FUNÇÕES DE MANIPULAÇÃO DE ESTADO E EVENTOS ---
    async function selectConversation(convoId) {
        if (selectedConversationId === convoId) return;

        selectedConversationId = convoId;
        const convo = conversas.find(c => c.id === convoId);

        if (!convo) return;
        
        // Habilitar a área de input
        elements.chatInput.disabled = false;
        elements.chatSendBtn.disabled = false;

        renderConversationsList();
        renderChatHeader();

        try {
            let historyResponse;
            if (convo.type === 'user') {
                // Endpoint para buscar histórico de chat privado
                historyResponse = await axios.get(`${backendUrl}/api/chat/privado/${currentUser.id}/${convo.targetId}`);
            } else { // project
                // Endpoint para buscar histórico de chat de projeto
                historyResponse = await axios.get(`${backendUrl}/projetos/${convo.targetId}/chat/mensagens`);
            }
            convo.messages = historyResponse.data;
            renderChatMessages();
            elements.chatInput.focus();
        } catch (error) {
            console.error(`Erro ao buscar histórico da conversa ${convoId}:`, error);
            elements.chatMessagesArea.innerHTML = `<div class="empty-chat">Erro ao carregar mensagens.</div>`;
        }
    }

    function handleNovaMensagem(mensagemPayload, type, projectId = null) {
        let convoId;
        if (type === 'private') {
            // Se a mensagem veio de outro usuário para mim, o ID do remetente é o alvo.
            // Se fui eu que enviei, o ID do destinatário é o alvo.
            const otherUserId = mensagemPayload.remetenteId === currentUser.id ? mensagemPayload.destinatarioId : mensagemPayload.remetenteId;
            convoId = `user_${otherUserId}`;
        } else { // project
            convoId = `project_${projectId}`;
        }

        const convo = conversas.find(c => c.id === convoId);
        if (convo) {
            convo.messages.push(mensagemPayload);
            // Se a conversa da nova mensagem estiver selecionada, renderiza o chat.
            if (convo.id === selectedConversationId) {
                renderChatMessages();
            }
            // Atualiza a prévia da última mensagem na lista de conversas
            const lastMsgEl = document.getElementById(`last-msg-${convo.id}`);
            if(lastMsgEl) lastMsgEl.textContent = mensagemPayload.conteudo;
        }
    }

    async function sendMessage() {
        const content = elements.chatInput.value.trim();
        if (!content || !selectedConversationId) return;

        const convo = conversas.find(c => c.id === selectedConversationId);
        if (!convo) return;

        if (convo.type === 'user') {
            // Lógica para enviar mensagem privada via WebSocket
            const destination = `/app/privado/${convo.targetId}`;
            stompClient.send(destination, {}, JSON.stringify({ conteudo: content }));
        } else { // project
            // Lógica para enviar mensagem de projeto via REST (pois aceita arquivos)
            const formData = new FormData();
            formData.append('conteudo', new Blob([JSON.stringify({conteudo: content})], { type: 'application/json' }));
            // Aqui você poderia adicionar lógica para anexar arquivos se quisesse
            
            try {
                // O backend já envia a mensagem via WebSocket após salvar
                await axios.post(`${backendUrl}/projetos/${convo.targetId}/chat/mensagens`, formData);
            } catch (error) {
                console.error("Erro ao enviar mensagem de projeto:", error);
            }
        }

        elements.chatInput.value = '';
        elements.chatInput.focus();
    }

    function setupEventListeners() {
        elements.conversationsList.addEventListener('click', (e) => {
            const card = e.target.closest('.convo-card');
            if (card) {
                selectConversation(card.dataset.convoId);
            }
        });

        elements.chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    // --- INÍCIO DA EXECUÇÃO ---
    init();
});