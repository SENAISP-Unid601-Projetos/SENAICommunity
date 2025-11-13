/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DO DOM (Específicos do Chat) ---
  const elements = {
    conversationsList: document.getElementById("conversations-list"),
    chatHeader: document.getElementById("chat-header-area"), // ID do HTML
    chatMessagesContainer: document.getElementById("chat-messages-area"), // ID do HTML
    messageInput: document.getElementById("chat-input"), // ID do HTML
    chatForm: document.getElementById("chat-form"), // ID do HTML
    chatSendBtn: document.getElementById("chat-send-btn"), // ID do HTML
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

  document.addEventListener("globalScriptsLoaded", (e) =>
    initChatPage(e.detail)
  );

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
        // Notifica o usuário que o contato não foi encontrado
        window.showNotification(
          "Não foi possível encontrar os dados deste contato.",
          "error"
        );
        return; // Impede a continuação se os dados do amigo não existem
      }

      // Usa os dados do amigo para criar um objeto temporário similar ao ConversaResumoDTO
      convoData = {
        outroUsuarioId: friendData.idUsuario,
        nomeOutroUsuario: friendData.nome,
        // Constrói a URL do avatar a partir do AmigoDTO
        avatarUrl: friendAvatar,
        // Valores padrão para uma nova conversa
        conteudoUltimaMensagem: null, // Será "Inicie a conversa..." no card
        dataEnvioUltimaMensagem: new Date().toISOString(), // Data atual
        remetenteUltimaMensagemId: null,
      };
      isNewConversation = true;
    }

    // Define a conversa ativa globalmente
    activeConversation = {
      usuarioId: otherUserId,
      nome: convoData.nomeOutroUsuario || convoData.nome, // Garante que pegue o nome correto
      avatar: convoData.avatarUrl || defaultAvatarUrl, // Garante que pegue o avatar correto
    };

    if (isNewConversation) {
      // Verifica se um card para este usuário JÁ existe na lista (evita duplicatas)
      const existingCard = document.querySelector(
        `.convo-card[data-user-id="${otherUserId}"]`
      );
      if (!existingCard) {
        // Cria e adiciona o card NOVO na lista da interface
        const tempCard = createConversationCardElement(convoData);
        elements.conversationsList.prepend(tempCard); // Adiciona no topo
      }
      // Adiciona a "conversa" temporária ao array 'conversas' para consistência da UI
      // A próxima chamada a fetchConversations trará os dados reais se mensagens forem enviadas.
      if (!conversas.some((c) => c.outroUsuarioId === otherUserId)) {
        conversas.unshift(convoData);
      }
    }

    // Atualiza a UI: Cabeçalho e destaque do card
    renderChatHeader();
    document
      .querySelectorAll(".convo-card")
      .forEach((card) => card.classList.remove("selected"));
    // Agora o seletor DEVE encontrar o card (existente ou o recém-criado)
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
      // Chama o novo endpoint POST que criamos no ChatRestController
      await axios.post(
        `${backendUrl}/api/chat/privado/marcar-lida/${otherUserId}`
      );

      if (typeof fetchAndUpdateUnreadCount === "function") {
        fetchAndUpdateUnreadCount();
      }
    } catch (error) {
      console.error("Erro ao marcar conversa como lida:", error);
      // Continua mesmo se falhar em marcar como lida, para o usuário ver as mensagens
    }

    elements.chatMessagesContainer.innerHTML =
      '<div class="empty-chat">Carregando histórico...</div>';

    // Busca e renderiza as mensagens (buscará lista vazia para nova conversa)
    await fetchMessages(otherUserId); //

    // Atualiza a contagem de mensagens não lidas (global)
    if (typeof fetchAndUpdateUnreadCount === "function") {
      fetchAndUpdateUnreadCount();
    }

    // Habilita a área de input
    elements.messageInput.disabled = false;
    elements.chatSendBtn.disabled = false;
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
      // USA O NOVO ENDPOINT DO BACKEND (ChatRestController)
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
   * Envia uma mensagem.
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

    stompClient.send(
      `/app/privado/${activeConversation.usuarioId}`,
      {},
      JSON.stringify(messageData)
    );
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }

  // --- INÍCIO DAS NOVAS FUNÇÕES (EDITAR/EXCLUIR) ---

  /**
   * Dispara a edição de uma mensagem.
   */
  async function handleEditMessage(messageId) {
    // 1. Encontra o conteúdo atual da mensagem no DOM
    const msgElement = document.querySelector(
      `.message-group[data-message-id="${messageId}"]`
    );
    const contentElement = msgElement
      ? msgElement.querySelector(".message-content")
      : null;

    if (!contentElement) return;
    const oldContent = contentElement.innerText; // Pega o texto atual

    // 2. Pede o novo conteúdo ao usuário
    const newContent = prompt(
      "Digite o novo conteúdo da mensagem:",
      oldContent
    );

    // 3. Verifica se o usuário cancelou ou não alterou o conteúdo
    if (
      newContent === null ||
      newContent.trim() === "" ||
      newContent === oldContent
    ) {
      return;
    }

    // 4. Envia a requisição PUT para o backend
    try {
      // O backend já está esperando uma String simples no @RequestBody
      await axios.put(
        `${backendUrl}/api/chat/privado/${messageId}`,
        newContent,
        {
          headers: { "Content-Type": "text/plain" }, // Importante para o backend ler como String
        }
      );
      // Não precisamos atualizar o DOM manualmente.
      // O backend enviará a atualização via WebSocket, e o onMessageReceived cuidará disso.
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

  // --- FIM DAS NOVAS FUNÇÕES ---

  /**
   * Recebe uma mensagem (do WebSocket).
   */
  function onMessageReceived(payload) {
    const msg = JSON.parse(payload.body);

    // --- INÍCIO DA MODIFICAÇÃO (Lógica de Remoção) ---
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
          // Filtra a lista, mantendo todas, exceto a que foi removida
          messageList = messageList.filter((m) => m.id !== msg.id);
          chatMessages.set(cacheKey, messageList);
        }
      }
      return;
    }
    // --- FIM DA MODIFICAÇÃO (Lógica de Remoção) ---

    const otherUserId =
      msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
    const cacheKey = getCacheKey(otherUserId);

    if (!chatMessages.has(cacheKey)) chatMessages.set(cacheKey, []);

    // --- INÍCIO DA MODIFICAÇÃO (Lógica de Edição/Nova) ---
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
                            <div class="message-content">${msg.conteudo}</div>
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

  // --- SETUP DE EVENT LISTENERS (Específicos do Chat) ---
  function setupChatEventListeners() {
    if (elements.chatForm) {
      elements.chatForm.addEventListener("submit", handleSendMessage);
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
