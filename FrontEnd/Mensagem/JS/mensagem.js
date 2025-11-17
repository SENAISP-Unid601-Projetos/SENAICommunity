/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DO DOM (Específicos do Chat) ---
  const elements = {
    conversationsList: document.getElementById("conversations-list"),
    chatHeader: document.getElementById("chat-header-area"),
    chatMessagesContainer: document.getElementById("chat-messages-area"),
    messageInput: document.getElementById("chat-input"),
    chatForm: document.getElementById("chat-form"),
    chatSendBtn: document.getElementById("chat-send-btn"),
    recordAudioBtn: document.getElementById("record-audio-btn"), // Botão de gravar
    conversationSearch: document.getElementById("convo-search"),
    addGroupBtn: document.querySelector(".add-convo-btn"),
    addConvoModal: document.getElementById("add-convo-modal"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    newConvoUserList: document.getElementById("new-convo-user-list"),
    userSearchInput: document.getElementById("user-search-input"),
  };

  // --- VARIÁVEIS DE ESTADO DO CHAT ---
  let conversas = [];
  let userFriends = []; // Será preenchido pela variável global
  let activeConversation = { usuarioId: null, nome: null, avatar: null };
  let chatMessages = new Map();

  // --- Variáveis de Estado de Gravação ---
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;
  let timerInterval; 
  let startTime;   

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
    currentUser = detail.currentUser;
    stompClient = detail.stompClient;
    userFriends = window.userFriends;
    backendUrl = window.backendUrl;
    defaultAvatarUrl = window.defaultAvatarUrl;

    stompClient.subscribe(`/user/queue/usuario`, onMessageReceived);
    fetchConversations();
    setupChatEventListeners();
  }

document.addEventListener("globalScriptsLoaded", (e) => {
  initChatPage(e.detail);
  document.addEventListener("friendsListUpdated", () => {
    userFriends = window.userFriends;
    if (elements.addConvoModal.style.display === "flex") {
      renderAvailableUsers();
    }
  });
});

  /**
   * Busca apenas as conversas existentes.
   */
  async function fetchConversations() {
    try {
      // Busca conversas existentes
      const convosResponse = await axios.get(
        `${backendUrl}/api/chat/privado/minhas-conversas`
      );
      conversas = convosResponse.data.map((c) => ({
        ...c,
        avatarUrl:
          c.fotoPerfilOutroUsuario &&
          c.fotoPerfilOutroUsuario.startsWith("http")
            ? c.fotoPerfilOutroUsuario
            : `${window.backendUrl}${
                c.fotoPerfilOutroUsuario || "/images/default-avatar.jpg"
              }`,
      }));

      renderConversationsList();
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  }

  /**
   * Encontra a chave de cache (user1-user2)
   */
  function getCacheKey(otherUserId) {
    if (!currentUser) return null;
    return [currentUser.id, otherUserId].sort((a, b) => a - b).join("-");
  }

  /**
   * Seleciona uma conversa e carrega o histórico.
   */
  function createConversationCardElement(convoData) {
    const convoCard = document.createElement("div");
    convoCard.className = `convo-card ${
      convoData.outroUsuarioId == activeConversation.usuarioId ? "selected" : ""
    }`;
    convoCard.dataset.userId = convoData.outroUsuarioId;
    convoCard.dataset.userName = convoData.nomeOutroUsuario;

    const ultimoAutor =
      convoData.remetenteUltimaMensagemId === currentUser.id
        ? "<strong>Você:</strong> "
        : "";
    const ultimaMsg =
      convoData.conteudoUltimaMensagem || "Inicie a conversa..."; // Mensagem padrão para novas

    convoCard.innerHTML = `
            <div class="convo-avatar-wrapper">
                <img src="${convoData.avatarUrl}" class="avatar" alt="${convoData.nomeOutroUsuario}">
            </div>
            <div class="group-info">
                <div class="group-title">${convoData.nomeOutroUsuario}</div>
                <div class="group-last-msg">
                    ${ultimoAutor}${ultimaMsg}
                </div>
            </div>
        `;
    convoCard.addEventListener("click", () =>
      selectConversation(convoData.outroUsuarioId)
    );
    return convoCard;
  }

  /**
   * Seleciona uma conversa (existente ou nova) e carrega o histórico.
   */
  async function selectConversation(otherUserId) {
    if (!otherUserId) return;
    otherUserId = parseInt(otherUserId, 10);

    let convoData = conversas.find((c) => c.outroUsuarioId === otherUserId);
    let isNewConversation = false; // Flag para rastrear se é nova

    if (!convoData) {
      const friendData = userFriends.find((f) => f.idUsuario === otherUserId);
      const friendAvatar =
        friendData.fotoPerfil && friendData.fotoPerfil.startsWith("http")
          ? friendData.fotoPerfil
          : `${window.backendUrl}${
              friendData.fotoPerfil || "/images/default-avatar.jpg"
            }`;
      if (!friendData) {
        console.error(
          "Amigo não encontrado para iniciar conversa:",
          otherUserId
        );
        window.showNotification(
          "Não foi possível encontrar os dados deste contato.",
          "error"
        );
        return; 
      }

      convoData = {
        outroUsuarioId: friendData.idUsuario,
        nomeOutroUsuario: friendData.nome,
        avatarUrl: friendAvatar,
        conteudoUltimaMensagem: null, 
        dataEnvioUltimaMensagem: new Date().toISOString(), 
        remetenteUltimaMensagemId: null,
      };
      isNewConversation = true;
    }

    activeConversation = {
      usuarioId: otherUserId,
      nome: convoData.nomeOutroUsuario || convoData.nome, 
      avatar: convoData.avatarUrl || defaultAvatarUrl,
    };

    if (isNewConversation) {
      const existingCard = document.querySelector(
        `.convo-card[data-user-id="${otherUserId}"]`
      );
      if (!existingCard) {
        const tempCard = createConversationCardElement(convoData);
        elements.conversationsList.prepend(tempCard); // Adiciona no topo
      }
      if (!conversas.some((c) => c.outroUsuarioId === otherUserId)) {
        conversas.unshift(convoData);
      }
    }

    renderChatHeader();
    document
      .querySelectorAll(".convo-card")
      .forEach((card) => card.classList.remove("selected"));
    const selectedCard = document.querySelector(
      `.convo-card[data-user-id="${otherUserId}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add("selected");
    } else {
      console.warn(
        "Card da conversa não encontrado para destacar:",
        otherUserId
      );
    }
    try {
      await axios.post(
        `${backendUrl}/api/chat/privado/marcar-lida/${otherUserId}`
      );

      if (typeof fetchAndUpdateUnreadCount === "function") {
        fetchAndUpdateUnreadCount();
      }
    } catch (error) {
      console.error("Erro ao marcar conversa como lida:", error);
    }

    elements.chatMessagesContainer.innerHTML =
      '<div class="empty-chat">Carregando histórico...</div>';

    await fetchMessages(otherUserId); //

    if (typeof fetchAndUpdateUnreadCount === "function") {
      fetchAndUpdateUnreadCount();
    }

    elements.messageInput.disabled = false;
    elements.chatSendBtn.disabled = false;
    elements.recordAudioBtn.disabled = false; // Habilita o botão de gravar
    elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`; // Placeholder dinâmico
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
      const response = await axios.get(
        `${backendUrl}/api/chat/privado/historico/${otherUserId}`
      );
      const messages = response.data;

      chatMessages.set(cacheKey, messages);
      renderMessages(messages);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      elements.chatMessagesContainer.innerHTML = `<div class="empty-chat">Erro ao carregar histórico.</div>`;
      chatMessages.set(cacheKey, []);
    }
  }

  /**
   * Envia uma mensagem DE TEXTO.
   */
  function handleSendMessage(e) {
    e.preventDefault();
    const content = elements.messageInput.value.trim();
    if (!content || !activeConversation.usuarioId || !stompClient?.connected)
      return;

    const messageData = {
      conteudo: content,
      destinatarioId: activeConversation.usuarioId,
    };

    sendPrivateMessage(messageData); // Usa a função centralizada
    
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }

  /**
   * Função centralizada para enviar ao WebSocket
   */
  function sendPrivateMessage(messageData) {
     if (!messageData.conteudo || !messageData.destinatarioId || !stompClient?.connected) {
         console.error("Dados da mensagem inválidos ou WebSocket desconectado.");
         return;
     }
     
     stompClient.send(
      `/app/privado/${messageData.destinatarioId}`,
      {},
      JSON.stringify(messageData)
    );
  }

  // --- FUNÇÕES DE EDITAR/EXCLUIR ---

  /**
   * Dispara a edição de uma mensagem.
   */
  async function handleEditMessage(messageId) {
    const msgElement = document.querySelector(
      `.message-group[data-message-id="${messageId}"]`
    );
    const contentElement = msgElement
      ? msgElement.querySelector(".message-content")
      : null;

    if (!contentElement) return;
    
    // Não permite editar áudio
    if (contentElement.querySelector('audio')) {
        window.showNotification("Não é possível editar mensagens de áudio.", "error");
        return;
    }
    
    const oldContent = contentElement.innerText; 

    const newContent = prompt(
      "Digite o novo conteúdo da mensagem:",
      oldContent
    );

    if (
      newContent === null ||
      newContent.trim() === "" ||
      newContent === oldContent
    ) {
      return;
    }

    try {
      await axios.put(
        `${backendUrl}/api/chat/privado/${messageId}`,
        newContent,
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
    } catch (error) {
      console.error("Erro ao editar mensagem:", error);
      window.showNotification("Não foi possível editar a mensagem.", "error");
    }
  }

  /**
   * Dispara a exclusão de uma mensagem.
   */
  async function handleDeleteMessage(messageId) {
    if (!confirm("Tem certeza de que deseja excluir esta mensagem?")) {
      return;
    }
    try {
      await axios.delete(`${backendUrl}/api/chat/privado/${messageId}`);
    } catch (error) {
      console.error("Erro ao excluir mensagem:", error);
      window.showNotification("Não foi possível excluir a mensagem.", "error");
    }
  }

  // --- FIM DAS FUNÇÕES DE EDITAR/EXCLUIR ---

  /**
   * Recebe uma mensagem (do WebSocket).
   */
  function onMessageReceived(payload) {
    const msg = JSON.parse(payload.body);

    if (msg.tipo === "remocao") {
      const msgElement = document.querySelector(
        `[data-message-id="${msg.id}"]`
      );
      if (msgElement) msgElement.remove();

      if (msg.remetenteId && msg.destinatarioId) {
        const otherUserId =
          msg.remetenteId === currentUser.id
            ? msg.destinatarioId
            : msg.remetenteId;
        const cacheKey = getCacheKey(otherUserId);

        if (chatMessages.has(cacheKey)) {
          let messageList = chatMessages.get(cacheKey);
          messageList = messageList.filter((m) => m.id !== msg.id);
          chatMessages.set(cacheKey, messageList);
        }
      }
      return;
    }

    const otherUserId =
      msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
    const cacheKey = getCacheKey(otherUserId);

    if (!chatMessages.has(cacheKey)) chatMessages.set(cacheKey, []);

    const messageList = chatMessages.get(cacheKey);
    const existingMsgIndex = messageList.findIndex((m) => m.id === msg.id);

    if (existingMsgIndex > -1) {
      messageList[existingMsgIndex] = msg;
    } else {
      messageList.push(msg);
    }

    let convoIndex = conversas.findIndex(
      (c) => c.outroUsuarioId === otherUserId
    );
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
        fotoPerfilOutroUsuario: null,
        conteudoUltimaMensagem: msg.conteudo,
        dataEnvioUltimaMensagem: msg.dataEnvio,
        remetenteUltimaMensagemId: msg.remetenteId,
        avatarUrl: defaultAvatarUrl,
      };

      const friendData = userFriends.find((f) => f.usuarioId === otherUserId);
      if (friendData) {
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

  /**
   * Helper para checar se é URL de áudio
   */
  function isAudioUrl(url) {
      if (typeof url !== 'string') return false;
      // Checa se é uma URL (simplificado) e se termina com extensão de áudio
      return (url.startsWith('http://') || url.startsWith('https://')) &&
             /\.(mp3|wav|ogg|aac|flac|m4a|webm|opus)$/i.test(url);
  }

  function renderMessages(messages) {
    if (!elements.chatMessagesContainer) return;

    elements.chatMessagesContainer.innerHTML = messages
      .map((msg) => {
        const isMyMessage = msg.remetenteId === currentUser.id;
        const messageClass = isMyMessage
          ? "message-group me"
          : "message-group outro";

        let avatarUrl = defaultAvatarUrl;
        if (isMyMessage && currentUser.urlFotoPerfil) {
          avatarUrl =
            currentUser.urlFotoPerfil &&
            currentUser.urlFotoPerfil.startsWith("http")
              ? currentUser.urlFotoPerfil
              : `${window.backendUrl}${currentUser.urlFotoPerfil}`;
        } else if (!isMyMessage) {
          avatarUrl = activeConversation.avatar || defaultAvatarUrl;
        }

        const nome = isMyMessage ? "Você" : msg.nomeRemetente;
        const time = new Date(msg.dataEnvio).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const messageActions = isMyMessage
          ? `
                <div class="message-actions">
                    <button class="btn-action btn-edit-msg" data-message-id="${msg.id}" title="Editar">
                        <i class="fas fa-pencil-alt"></i> 
                    </button>
                    <button class="btn-action btn-delete-msg" data-message-id="${msg.id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `
          : "";
          
        let messageContentHtml = '';
        if (isAudioUrl(msg.conteudo)) {
            // É uma URL de áudio
            messageContentHtml = `<audio controls src="${msg.conteudo}"></audio>`;
        } else {
            // É texto, vamos escapar para evitar XSS
            const textNode = document.createTextNode(msg.conteudo);
            const p = document.createElement('p');
            p.appendChild(textNode);
            messageContentHtml = p.innerHTML;
        }

        return `
                <div class="message-group ${messageClass}" data-message-id="${
          msg.id
        }">
                    ${
                      !isMyMessage
                        ? `<div class="message-avatar"><img src="${avatarUrl}" alt="${nome}"></div>`
                        : ""
                    }
                    
                    <div class="message-content-wrapper">
                        ${messageActions} <div class="message-block">
                            <div class="message-author-header">
                                <strong>${nome}</strong>
                                <span>${time}</span>
                            </div>
                            <div class="message-content">${messageContentHtml}</div>
                        </div>
                    </div>
                    </div>
            `;
      })
      .join("");

    elements.chatMessagesContainer.scrollTop =
      elements.chatMessagesContainer.scrollHeight;
  }

  function renderConversationsList() {
    if (!elements.conversationsList) return;
    elements.conversationsList.innerHTML = "";
    if (conversas.length === 0) {
      elements.conversationsList.innerHTML =
        '<p class="empty-state" style="padding: 1rem; text-align: center; color: var(--text-secondary);">Nenhuma conversa.</p>';
      return;
    }

    conversas.forEach((convo) => {
      const convoCard = createConversationCardElement(convo);
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
    elements.newConvoUserList.innerHTML = userFriends
      .filter((f) => !conversas.some((c) => c.outroUsuarioId === f.usuarioId))
      .map((friend) => {
        const avatarUrl =
          friend.fotoPerfil && friend.fotoPerfil.startsWith("http")
            ? friend.fotoPerfil
            : `${window.backendUrl}${
                friend.fotoPerfil || "/images/default-avatar.jpg"
              }`;
        return `
                    <div class="user-list-item user-card" 
                         data-usuario-id="${friend.idUsuario}" 
                         data-user-name="${friend.nome}" >
                        <img src="${avatarUrl}" alt="${friend.nome}">
                        <span>${friend.nome}</span>
                    </div>
                `;
      })
      .join("");
  }

  function openNewConversationModal() {
    renderAvailableUsers();
    elements.addConvoModal.style.display = "flex";
  }

  // --- Funções de Gravação de Áudio ---
  
  function updateTimerDisplay() {
      const elapsed = Date.now() - startTime;
      const totalSeconds = Math.floor(elapsed / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
      const seconds = String(totalSeconds % 60).padStart(2, '0');
      
      const timerElement = elements.recordAudioBtn.querySelector('.audio-timer');
      if (timerElement) {
          timerElement.textContent = `${minutes}:${seconds}`;
      } else {
          // Se o elemento não existir, cria e insere
          elements.recordAudioBtn.innerHTML = `
              <i class="fas fa-stop"></i>
              <span class="audio-timer">00:00</span>
          `;
      }
  }

  /**
   * Inicia a gravação do áudio
   */
  async function startRecording() {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          audioChunks = [];
          
          mediaRecorder.ondataavailable = event => {
              audioChunks.push(event.data);
          };
          
          mediaRecorder.onstop = stopAndUploadAudio;
          
          mediaRecorder.start();
          isRecording = true;
          
          startTime = Date.now();
          updateTimerDisplay(); 
          timerInterval = setInterval(updateTimerDisplay, 1000);
          
          elements.recordAudioBtn.classList.add('recording');
          elements.messageInput.disabled = true;
          elements.messageInput.placeholder = "Gravando áudio...";
          
      } catch (error) {
          console.error("Erro ao acessar o microfone:", error);
          window.showNotification("Não foi possível acessar seu microfone.", "error");
      }
  }

  /**
   * Para a gravação, processa o blob, e faz o upload.
   */
  async function stopAndUploadAudio() {
      isRecording = false;
      
      clearInterval(timerInterval); 
      
      if (mediaRecorder) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop()); 
      }
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
      
      elements.recordAudioBtn.innerHTML = `<i class="fas fa-microphone"></i>`; 
      
      elements.recordAudioBtn.classList.remove('recording');
      elements.messageInput.disabled = false;
      elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;
      
      if (audioBlob.size < 1000) {
          console.log("Gravação muito curta, descartada.");
          return;
      }
      
      window.showNotification("Enviando áudio...", "info");

      const formData = new FormData();
      const uploadUrl = new URL('/api/chat/privado/upload', backendUrl).href;
      
      formData.append('file', audioBlob, `audio-message-${Date.now()}.webm`); 
      
      try {
          const response = await axios.post(uploadUrl, formData);
          const audioUrl = response.data.url;
          
          if (!audioUrl) {
              throw new Error("URL do áudio não recebida do servidor.");
          }

          const messageData = {
              conteudo: audioUrl,
              destinatarioId: activeConversation.usuarioId,
          };
          
          sendPrivateMessage(messageData);

      } catch (error) {
          console.error("Erro ao fazer upload do áudio:", error);
          let errorMsg = "Falha ao enviar o áudio.";
          if (error.response && error.response.data && error.response.data.error) {
              errorMsg = error.response.data.error;
          }
          window.showNotification(errorMsg, "error");
      }
  }


  // --- SETUP DE EVENT LISTENERS (Específicos do Chat) ---
  function setupChatEventListeners() {
    if (elements.chatForm) {
      elements.chatForm.addEventListener("submit", handleSendMessage);
    }

    // Listener do Botão de Gravação
    if (elements.recordAudioBtn) {
        elements.recordAudioBtn.addEventListener('click', () => {
            if (!activeConversation.usuarioId) {
                window.showNotification("Selecione uma conversa primeiro.", "error");
                return;
            }

            if (isRecording) {
                mediaRecorder.stop(); // Isso vai triggar o 'onstop' (stopAndUploadAudio)
            } else {
                startRecording();
            }
        });
    }

    if (elements.conversationSearch) {
      elements.conversationSearch.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll(".convo-card").forEach((card) => {
          const name = card.dataset.userName.toLowerCase();
          card.style.display = name.includes(query) ? "flex" : "none";
        });
      });
    }

    // Modal de Nova Conversa
    if (elements.addGroupBtn) {
      elements.addGroupBtn.addEventListener("click", openNewConversationModal);
    }
    if (elements.closeModalBtn) {
      elements.closeModalBtn.addEventListener(
        "click",
        () => (elements.addConvoModal.style.display = "none")
      );
    }
    if (elements.newConvoUserList) {
      elements.newConvoUserList.addEventListener("click", (e) => {
        const userCard = e.target.closest(".user-card");
        if (userCard) {
          const userId = parseInt(userCard.dataset.usuarioId, 10);
          elements.addConvoModal.style.display = "none";
          selectConversation(userId);
        }
      });
    }
    if (elements.userSearchInput) {
      elements.userSearchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        document.querySelectorAll(".user-list-item").forEach((item) => {
          const name = item.dataset.userName.toLowerCase();
          item.style.display = name.includes(query) ? "flex" : "none";
        });
      });
    }

    // Listeners para Editar/Excluir
    if (elements.chatMessagesContainer) {
      elements.chatMessagesContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-msg");
        if (editBtn) {
          const messageId = editBtn.dataset.messageId;
          handleEditMessage(messageId);
          return;
        }

        const deleteBtn = e.target.closest(".btn-delete-msg");
        if (deleteBtn) {
          const messageId = deleteBtn.dataset.messageId;
          handleDeleteMessage(messageId);
          return;
        }
      });
    }
  }
});