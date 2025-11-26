/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// --- FUNÇÃO GLOBAL PARA O BOTÃO "LER MAIS" ---
window.toggleMessageReadMore = function(btn) {
  const textSpan = btn.previousElementSibling;
  
  if (textSpan && textSpan.classList.contains('text-clamped')) {
      // EXPANDIR
      textSpan.classList.remove('text-clamped');
      btn.textContent = 'Ler menos';
  } else if (textSpan) {
      // RECOLHER
      textSpan.classList.add('text-clamped');
      btn.textContent = 'Ler mais';
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DO DOM ---
  const elements = {
    // Containers
    chatContainer: document.getElementById("chat-container"),
    conversationsList: document.getElementById("conversations-list"),
    chatHeader: document.getElementById("chat-header-area"),
    chatHeaderContent: document.getElementById("chat-header-content"), 
    chatMessagesContainer: document.getElementById("chat-messages-area"),
    
    // Inputs
    messageInput: document.getElementById("chat-input"),
    chatForm: document.getElementById("chat-form"),
    chatSendBtn: document.getElementById("chat-send-btn"),
    recordAudioBtn: document.getElementById("record-audio-btn"),
    conversationSearch: document.getElementById("convo-search"),
    
    // Modais
    addGroupBtn: document.querySelector(".add-convo-btn"),
    addConvoModal: document.getElementById("add-convo-modal"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    newConvoUserList: document.getElementById("new-convo-user-list"),
    userSearchInput: document.getElementById("user-search-input"),
    
    // Responsividade
    sidebar: document.getElementById('sidebar'),
    mobileMenuToggle: document.getElementById('mobile-menu-toggle'),
    sidebarClose: document.getElementById('sidebar-close'),
    mobileOverlay: document.getElementById('mobile-overlay'),
    backToListBtn: document.getElementById('back-to-list-btn')
  };

  // --- CORREÇÃO DO BOTÃO "EDITAR PERFIL" ---
  // Substitui o botão original (que quebra o JS do principal.js) por um novo que redireciona
  const editProfileBtnOld = document.getElementById("edit-profile-btn");
  if (editProfileBtnOld) {
      // Clona o botão para remover todos os EventListeners antigos (incluindo o que causa erro)
      const editProfileBtnNew = editProfileBtnOld.cloneNode(true);
      editProfileBtnOld.parentNode.replaceChild(editProfileBtnNew, editProfileBtnOld);
      
      // Adiciona o novo comportamento seguro: Redirecionar para o perfil
      editProfileBtnNew.addEventListener("click", (e) => {
          e.preventDefault();
          window.location.href = "perfil.html"; // Leva para a página onde a edição funciona
      });
  }

  // --- ESTADO ---
  let conversas = [];
  let userFriends = [];
  let activeConversation = { usuarioId: null, nome: null, avatar: null };
  let chatMessages = new Map();
  let unreadMessagesCount = new Map();

  // Áudio
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let timerInterval;
  let startTime;

  // Globais
  let currentUser;
  let stompClient;
  let backendUrl;
  let defaultAvatarUrl;

  /**
   * INICIALIZAÇÃO
   */
  async function initChatPage(detail) {
    currentUser = detail.currentUser;
    stompClient = detail.stompClient;
    userFriends = window.userFriends || [];
    backendUrl = window.backendUrl;
    defaultAvatarUrl = window.defaultAvatarUrl;

    updateSidebarUserInfo();
    setupResponsiveListeners();
    setupChatEventListeners();

    // WebSocket Listeners
    stompClient.subscribe(`/user/queue/usuario`, onMessageReceived);
    stompClient.subscribe(`/user/queue/contagem`, (message) => {
      const count = JSON.parse(message.body);
      updateMessageBadge(count);
    });

    // Carrega conversas e depois verifica URL
    await fetchConversations();
    checkStartChatParam();
  }

  document.addEventListener("globalScriptsLoaded", (e) => {
    initChatPage(e.detail);
    document.addEventListener("friendsListUpdated", () => {
      userFriends = window.userFriends;
      if (elements.addConvoModal.style.display === "flex") renderAvailableUsers();
    });
  });

  // --- HELPER: FORMATAÇÃO DE TEXTO (LER MAIS) ---
  function escapeHtml(text) {
      if (!text) return "";
      return text.replace(/[&<>"']/g, function(m) { 
          return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; 
      });
  }

function formatMessageContent(text) {
    const LIMITE_CARACTERES = 350; 
    
    if (!text) return "";
    
    // Escapa HTML para segurança e troca quebra de linha por <br>
    let safeText = escapeHtml(text).replace(/\n/g, '<br>');

    // Se for curto, retorna normal
    if (text.length <= LIMITE_CARACTERES) {
        return safeText;
    }

    // Se for longo, retorna com a classe de corte e botão INLINE
    return `
    <div class="message-text-body text-clamped">${safeText}</div>
    <button class="read-more-btn" onclick="toggleMessageReadMore(this)">Ler mais</button>
`;
}

  // --- RESPONSIVIDADE ---
  function setupResponsiveListeners() {
    function toggleSidebar() {
      if(elements.sidebar) {
          elements.sidebar.classList.toggle('active');
          if(elements.mobileOverlay) elements.mobileOverlay.classList.toggle('active');
          document.body.style.overflow = elements.sidebar.classList.contains('active') ? 'hidden' : '';
      }
    }

    if(elements.mobileMenuToggle) elements.mobileMenuToggle.addEventListener('click', toggleSidebar);
    if(elements.sidebarClose) elements.sidebarClose.addEventListener('click', toggleSidebar);
    if(elements.mobileOverlay) elements.mobileOverlay.addEventListener('click', toggleSidebar);

    // Botão Voltar (Mobile)
    if(elements.backToListBtn) {
      elements.backToListBtn.addEventListener('click', () => {
        if(elements.chatContainer) elements.chatContainer.classList.remove('chat-open');
        activeConversation = { usuarioId: null, nome: null, avatar: null };
        document.querySelectorAll(".convo-card").forEach(c => c.classList.remove("selected"));
      });
    }
  }

  function updateMessageBadge(count) {
    const b1 = document.getElementById("message-badge");
    const b2 = document.getElementById("message-badge-sidebar");
    if(b1) { b1.textContent = count; b1.style.display = count > 0 ? "flex" : "none"; }
    if(b2) { b2.textContent = count; b2.style.display = count > 0 ? "flex" : "none"; }
  }

  // --- API & DADOS ---
  async function fetchConversations() {
    try {
      if(elements.conversationsList) elements.conversationsList.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div></div>`;
      
      const response = await axios.get(`${backendUrl}/api/chat/privado/minhas-conversas`);
      
      conversas = response.data.map((c) => ({
        ...c,
        avatarUrl: c.fotoPerfilOutroUsuario && c.fotoPerfilOutroUsuario.startsWith("http")
            ? c.fotoPerfilOutroUsuario
            : `${window.backendUrl}${c.fotoPerfilOutroUsuario || "/images/default-avatar.jpg"}`,
        unreadCount: unreadMessagesCount.get(c.outroUsuarioId) || 0
      }));

      sortConversations();
      renderConversationsList();
    } catch (error) {
      console.error("Erro conversas:", error);
      if(elements.conversationsList) {
          elements.conversationsList.innerHTML = `<div class="error-state"><p>Erro ao carregar conversas</p><button class="retry-btn" data-action="retry-conversations">Tentar novamente</button></div>`;
      }
    }
  }

  function sortConversations() {
    conversas.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return new Date(b.dataEnvioUltimaMensagem) - new Date(a.dataEnvioUltimaMensagem);
    });
  }

  // --- LÓGICA DE CHAT ---
  async function checkStartChatParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const startChatUserId = urlParams.get('start_chat');
    
    if (startChatUserId) {
      const userId = parseInt(startChatUserId, 10);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      await selectConversation(userId);
    }
  }

  async function selectConversation(otherUserId) {
    if (!otherUserId) return;
    otherUserId = parseInt(otherUserId, 10);

    let convoData = conversas.find((c) => c.outroUsuarioId === otherUserId);

    if (!convoData) {
      let targetUser = userFriends.find((f) => f.idUsuario === otherUserId);
      if (!targetUser) {
        try {
            const res = await axios.get(`${backendUrl}/usuarios/${otherUserId}`);
            const u = res.data;
            targetUser = { idUsuario: u.id, nome: u.nome, fotoPerfil: u.urlFotoPerfil || u.fotoPerfil };
        } catch (err) { console.error(err); return; }
      }

      const avatar = targetUser.fotoPerfil && targetUser.fotoPerfil.startsWith("http")
          ? targetUser.fotoPerfil
          : `${window.backendUrl}${targetUser.fotoPerfil || "/images/default-avatar.jpg"}`;

      convoData = {
        outroUsuarioId: targetUser.idUsuario,
        nomeOutroUsuario: targetUser.nome,
        avatarUrl: avatar,
        conteudoUltimaMensagem: null,
        dataEnvioUltimaMensagem: new Date().toISOString(),
        remetenteUltimaMensagemId: null,
        unreadCount: 0
      };
      conversas.unshift(convoData);
      renderConversationsList();
    }

    activeConversation = {
      usuarioId: otherUserId,
      nome: convoData.nomeOutroUsuario || convoData.nome,
      avatar: convoData.avatarUrl || defaultAvatarUrl,
    };

    if(elements.chatContainer) elements.chatContainer.classList.add('chat-open');

    renderChatHeader();
    document.querySelectorAll(".convo-card").forEach(c => c.classList.remove("selected"));
    const card = document.querySelector(`.convo-card[data-user-id="${otherUserId}"]`);
    if (card) card.classList.add("selected");

    try {
      if (unreadMessagesCount.get(otherUserId) > 0) {
        unreadMessagesCount.set(otherUserId, 0);
        updateConversationUnreadCount(otherUserId, 0);
      }
      await axios.post(`${backendUrl}/api/chat/privado/marcar-lida/${otherUserId}`);
    } catch (e) { console.error(e); }

    showMessagesLoading();
    await fetchMessages(otherUserId);
    
    elements.messageInput.disabled = false;
    elements.chatSendBtn.disabled = false;
    if(elements.recordAudioBtn) elements.recordAudioBtn.disabled = false;
    elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;
    elements.messageInput.focus();
  }

  // --- MENSAGENS ---
  function getCacheKey(otherUserId) {
    if (!currentUser) return null;
    return [currentUser.id, otherUserId].sort((a, b) => a - b).join("-");
  }

  async function fetchMessages(otherUserId) {
    const cacheKey = getCacheKey(otherUserId);
    if (!cacheKey) return;

    if (chatMessages.has(cacheKey)) {
      renderMessages(chatMessages.get(cacheKey));
      return;
    }

    try {
      const response = await axios.get(`${backendUrl}/api/chat/privado/historico/${otherUserId}`);
      chatMessages.set(cacheKey, response.data);
      renderMessages(response.data);
    } catch (error) {
      console.error(error);
      if(elements.chatMessagesContainer) elements.chatMessagesContainer.innerHTML = `<div class="error-state"><p>Erro ao carregar mensagens</p></div>`;
    }
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const content = elements.messageInput.value.trim();
    if (!content || !activeConversation.usuarioId || !stompClient?.connected) return;
    
    stompClient.send(`/app/privado/${activeConversation.usuarioId}`, {}, JSON.stringify({
        conteudo: content, destinatarioId: activeConversation.usuarioId
    }));
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }

  // --- FUNÇÃO AUXILIAR: Preencher Sidebar do Usuário ---
function updateSidebarUserInfo() {
    const userInfoContainer = document.querySelector('.user-info');

    if (window.currentUser) {
        const sidebarName = document.getElementById('sidebar-user-name');
        const sidebarTitle = document.getElementById('sidebar-user-title');
        const sidebarImg = document.getElementById('sidebar-user-img');
        const connectionsCount = document.getElementById('connections-count');
        const projectsCount = document.getElementById('projects-count');
        
        if(sidebarName) sidebarName.textContent = window.currentUser.nome;
        if(sidebarTitle) sidebarTitle.textContent = window.currentUser.cargo || 'Membro'; 
        
        if(sidebarImg && window.currentUser.fotoPerfil) {
             if(typeof window.getAvatarUrl === 'function') {
                 sidebarImg.src = window.getAvatarUrl(window.currentUser.fotoPerfil);
             } else {
                 sidebarImg.src = window.currentUser.fotoPerfil;
             }
        }
        
        // Atualiza stats se disponíveis (opcional, se tiver lógica para isso)
        if(connectionsCount && window.userFriends) {
            connectionsCount.textContent = window.userFriends.length;
        }

        // Remove a classe de loading para mostrar o perfil
        if (userInfoContainer) {
            userInfoContainer.classList.add('loaded');
        }
    }
}

  // --- WEBSOCKET RECEIVER ---
  function onMessageReceived(payload) {
    const msg = JSON.parse(payload.body);

    if (msg.tipo === "remocao") {
        handleMessageRemoval(msg);
        return;
    }

    const otherUserId = msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
    const cacheKey = getCacheKey(otherUserId);

    if (!chatMessages.has(cacheKey)) chatMessages.set(cacheKey, []);
    const messages = chatMessages.get(cacheKey);

    // VERIFICA SE É EDIÇÃO
    const existingIndex = messages.findIndex(m => m.id === msg.id);
    if (existingIndex !== -1) {
        messages[existingIndex] = msg; // Atualiza
    } else {
        messages.push(msg); // Adiciona novo
    }

    // Atualiza conversa lateral
    let convoIdx = conversas.findIndex(c => c.outroUsuarioId === otherUserId);
    let convo;
    if (convoIdx > -1) {
        convo = conversas.splice(convoIdx, 1)[0];
        convo.conteudoUltimaMensagem = msg.conteudo;
        convo.dataEnvioUltimaMensagem = msg.dataEnvio;
        convo.remetenteUltimaMensagemId = msg.remetenteId;
        
        if (msg.destinatarioId === currentUser.id && activeConversation.usuarioId !== otherUserId) {
            convo.unreadCount = (convo.unreadCount || 0) + 1;
            unreadMessagesCount.set(otherUserId, convo.unreadCount);
        }
    } else {
        fetchConversations(); 
        return; 
    }
    conversas.unshift(convo);
    renderConversationsList();

    // Se chat aberto, re-renderiza
    if (activeConversation.usuarioId === otherUserId) {
        renderMessages(messages);
    }
  }

  function handleMessageRemoval(msg) {
      const el = document.querySelector(`[data-message-id="${msg.id}"]`);
      if (el) el.remove();
      
      const otherUserId = msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
      const key = getCacheKey(otherUserId);
      if (chatMessages.has(key)) {
          const list = chatMessages.get(key).filter(m => m.id !== msg.id);
          chatMessages.set(key, list);
      }
  }

  // --- RENDERIZAÇÃO ---
  function renderConversationsList() {
    if (!elements.conversationsList) return;
    elements.conversationsList.innerHTML = "";
    if (conversas.length === 0) {
      elements.conversationsList.innerHTML = `<div class="empty-state"><p>Nenhuma conversa</p></div>`;
      return;
    }
    conversas.forEach(c => elements.conversationsList.appendChild(createConversationCardElement(c)));
  }

  function createConversationCardElement(convo) {
    const isActive = convo.outroUsuarioId === activeConversation.usuarioId;
    const card = document.createElement("div");
    card.className = `convo-card ${isActive ? "selected" : ""} ${convo.unreadCount > 0 ? "unread" : ""}`;
    card.dataset.userId = convo.outroUsuarioId;
    card.dataset.userName = convo.nomeOutroUsuario;

    let lastMsg = "Inicie a conversa...";
    let author = "";
    if (convo.conteudoUltimaMensagem) {
      author = convo.remetenteUltimaMensagemId === currentUser.id ? "<strong>Você:</strong> " : "";
      lastMsg = isAudioUrl(convo.conteudoUltimaMensagem) ? '<i class="fas fa-microphone audio-icon"></i> Áudio' : convo.conteudoUltimaMensagem;
    }

    card.innerHTML = `
        <div class="convo-avatar-wrapper">
            <img src="${convo.avatarUrl}" class="avatar" alt="${convo.nomeOutroUsuario}">
            ${convo.unreadCount > 0 ? `<div class="unread-badge">${convo.unreadCount}</div>` : ''}
        </div>
        <div class="group-info">
            <div class="group-title">${convo.nomeOutroUsuario}</div>
            <div class="group-last-msg">${author}${lastMsg}</div>
        </div>
    `;
    card.addEventListener("click", () => selectConversation(convo.outroUsuarioId));
    return card;
  }

  function renderChatHeader() {
    const content = activeConversation.usuarioId ? `
        <img src="${activeConversation.avatar}" class="chat-group-avatar" alt="${activeConversation.nome}">
        <div><h3 class="chat-group-title">${activeConversation.nome}</h3></div>
    ` : `<h3 class="chat-group-title">Selecione uma Conversa</h3>`;

    if (elements.chatHeaderContent) elements.chatHeaderContent.innerHTML = content;
    else elements.chatHeader.innerHTML = content;
  }

  function renderMessages(messages) {
    if (!elements.chatMessagesContainer) return;
    if (!messages || messages.length === 0) {
      elements.chatMessagesContainer.innerHTML = `<div class="empty-chat"><i class="fas fa-comments"></i><p>Nenhuma mensagem ainda</p></div>`;
      return;
    }

    elements.chatMessagesContainer.innerHTML = messages.map(msg => {
      const isMe = msg.remetenteId === currentUser.id;
      const time = new Date(msg.dataEnvio).toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"});
      
      // LOGICA ALTERADA: Usar formatMessageContent para textos longos
      let contentHtml = isAudioUrl(msg.conteudo) 
          ? `<div class="audio-message"><audio controls src="${msg.conteudo}"></audio></div>`
          : formatMessageContent(msg.conteudo);

      // Botões (FORA DA BOLHA)
      const actionsHtml = isMe ? `
        <div class="message-actions">
            <button class="btn-action btn-edit-msg" data-message-id="${msg.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
            <button class="btn-action btn-delete-msg" data-message-id="${msg.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
        </div>
      ` : '';

      return `
        <div class="message-group ${isMe ? 'me' : 'outro'}" data-message-id="${msg.id}">
            ${!isMe ? `<div class="message-avatar"><img src="${activeConversation.avatar}" alt=""></div>` : ''}
            <div class="message-block">
                <div class="message-author-header"><strong>${isMe ? 'Você' : msg.nomeRemetente}</strong> <span>${time}</span></div>
                <div class="message-content-wrapper">
                    ${isMe ? actionsHtml : ''} 
                    <div class="message-content">${contentHtml}</div>
                </div>
            </div>
        </div>
      `;
    }).join("");
    elements.chatMessagesContainer.scrollTop = elements.chatMessagesContainer.scrollHeight;
  }

  function showMessagesLoading() {
    if(elements.chatMessagesContainer) elements.chatMessagesContainer.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>Carregando...</p></div>`;
  }

  function updateConversationUnreadCount(userId, count) {
    const idx = conversas.findIndex(c => c.outroUsuarioId === userId);
    if (idx !== -1) {
        conversas[idx].unreadCount = count;
        sortConversations();
        renderConversationsList();
    }
  }

  function isAudioUrl(url) {
    if (typeof url !== 'string') return false;
    return (url.startsWith('http') || url.startsWith('/')) && /\.(mp3|wav|ogg|webm|opus)$/i.test(url);
  }

  // --- AUDIO ---
  function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2,'0');
    const sec = String(elapsed % 60).padStart(2,'0');
    const t = elements.recordAudioBtn.querySelector('.audio-timer');
    if(t) t.textContent = `${min}:${sec}`;
  }

  async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = uploadAudio;
        mediaRecorder.start();
        isRecording = true;
        startTime = Date.now();
        elements.recordAudioBtn.classList.add('recording');
        elements.recordAudioBtn.innerHTML = `<i class="fas fa-stop"></i> <span class="audio-timer">00:00</span>`;
        timerInterval = setInterval(updateTimer, 1000);
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Gravando...";
    } catch (e) { alert("Erro microfone"); }
  }

  async function uploadAudio() {
    isRecording = false;
    clearInterval(timerInterval);
    if(mediaRecorder) mediaRecorder.stream.getTracks().forEach(t => t.stop());
    
    elements.recordAudioBtn.classList.remove('recording');
    elements.recordAudioBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
    elements.messageInput.disabled = false;
    elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;

    const blob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
    if(blob.size < 1000) return;

    const formData = new FormData();
    formData.append('file', blob, `audio-${Date.now()}.webm`);

    try {
        const res = await axios.post(`${backendUrl}/api/chat/privado/upload`, formData);
        stompClient.send(`/app/privado/${activeConversation.usuarioId}`, {}, JSON.stringify({
            conteudo: res.data.url, destinatarioId: activeConversation.usuarioId
        }));
    } catch (e) { alert("Erro envio áudio"); }
  }

  // --- EVENT LISTENERS ---
  function setupChatEventListeners() {
    if (elements.chatForm) elements.chatForm.addEventListener("submit", handleSendMessage);
    
    if (elements.recordAudioBtn) {
        elements.recordAudioBtn.addEventListener('click', () => {
            if (!activeConversation.usuarioId) return alert("Selecione uma conversa.");
            if (isRecording) mediaRecorder.stop(); else startRecording();
        });
    }

    // --- REDIRECIONAMENTO PERFIL AO CLICAR NO NOME NA SIDEBAR ---
    const sidebarHeader = document.querySelector('.sidebar-header');
    if (sidebarHeader) {
        sidebarHeader.style.cursor = 'pointer';
        sidebarHeader.addEventListener('click', (e) => {
            // Se clicar no botão de "add conversa", não redireciona
            if (e.target.closest('button') || e.target.closest('.add-convo-btn')) return;
            window.location.href = 'perfil.html';
        });
    }

    // CLIQUE NAS MENSAGENS (Toggle Ações + Handlers)
    if (elements.chatMessagesContainer) {
        elements.chatMessagesContainer.addEventListener("click", (e) => {
            // Botões de Ação
            const editBtn = e.target.closest(".btn-edit-msg");
            if (editBtn) { handleEditMessage(editBtn.dataset.messageId); return; }
            
            const delBtn = e.target.closest(".btn-delete-msg");
            if (delBtn) { handleDeleteMessage(delBtn.dataset.messageId); return; }

            // Clique na Bolha (Toggle)
            const bubble = e.target.closest(".message-content");
            if (bubble) {
                // Se clicar em um link ou no botão 'Ler mais', não faz o toggle das ações
                if(e.target.tagName === 'A' || e.target.classList.contains('read-more-btn')) return;

                const group = bubble.closest(".message-group");
                if (group && group.classList.contains("me")) {
                    // Fecha outros
                    document.querySelectorAll('.message-group.active-actions').forEach(el => {
                        if(el !== group) el.classList.remove('active-actions');
                    });
                    group.classList.toggle("active-actions");
                }
            } else {
                // Clique fora fecha tudo
                document.querySelectorAll('.message-group.active-actions').forEach(el => el.classList.remove('active-actions'));
            }
        });
    }

    if (elements.conversationSearch) {
        elements.conversationSearch.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll(".convo-card").forEach(c => {
                c.style.display = c.dataset.userName.toLowerCase().includes(q) ? "flex" : "none";
            });
        });
    }

    if (elements.addGroupBtn) elements.addGroupBtn.addEventListener("click", () => {
        renderAvailableUsers();
        elements.addConvoModal.style.display = "flex";
    });
    if (elements.closeModalBtn) elements.closeModalBtn.addEventListener("click", () => elements.addConvoModal.style.display = "none");
    if (elements.newConvoUserList) {
        elements.newConvoUserList.addEventListener("click", (e) => {
            const item = e.target.closest(".user-card");
            if (item) {
                elements.addConvoModal.style.display = "none";
                selectConversation(item.dataset.usuarioId);
            }
        });
    }
    if (elements.userSearchInput) {
        elements.userSearchInput.addEventListener("input", (e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll(".user-list-item").forEach(i => {
                i.style.display = i.dataset.userName.toLowerCase().includes(q) ? "flex" : "none";
            });
        });
    }
    
    document.addEventListener('click', (e) => {
        if(e.target.classList.contains('retry-btn')) {
            const action = e.target.dataset.action;
            if(action === 'retry-conversations') fetchConversations();
            if(action === 'retry-messages' && activeConversation.usuarioId) fetchMessages(activeConversation.usuarioId);
        }
    });
  }

  function renderAvailableUsers() {
    const existing = conversas.map(c => c.outroUsuarioId);
    const available = userFriends.filter(f => !existing.includes(f.idUsuario || f.usuarioId));
    elements.newConvoUserList.innerHTML = available.map(f => {
        const avatar = f.fotoPerfil && f.fotoPerfil.startsWith("http") ? f.fotoPerfil : `${backendUrl}${f.fotoPerfil || "/images/default-avatar.jpg"}`;
        return `<div class="user-list-item user-card" data-usuario-id="${f.idUsuario || f.usuarioId}" data-user-name="${f.nome}">
            <img src="${avatar}" alt="${f.nome}"><span>${f.nome}</span></div>`;
    }).join("");
  }

  async function handleEditMessage(id) {
    const el = document.querySelector(`[data-message-id="${id}"] .message-content`);
    if(!el) return;
    const oldTxt = el.textContent.replace('Ler mais', '').replace('Ler menos', '').trim(); // Limpa o texto do botão
    const newTxt = prompt("Editar mensagem:", oldTxt);
    if(newTxt && newTxt !== oldTxt) {
        try {
            await axios.put(`${backendUrl}/api/chat/privado/${id}`, newTxt, {headers:{"Content-Type":"text/plain"}});
        } catch(e) { alert("Erro ao editar"); }
    }
  }

  async function handleDeleteMessage(id) {
    if(confirm("Excluir mensagem?")) {
        try { await axios.delete(`${backendUrl}/api/chat/privado/${id}`); } catch(e) { alert("Erro ao excluir"); }
    }
  }
});