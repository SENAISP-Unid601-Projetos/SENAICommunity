/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// --- FUNÇÃO GLOBAL PARA O BOTÃO "LER MAIS" ---
window.toggleMessageReadMore = function (btn) {
  const textSpan = btn.previousElementSibling;
  if (textSpan && textSpan.classList.contains("text-clamped")) {
    textSpan.classList.remove("text-clamped");
    btn.textContent = "Ler menos";
  } else if (textSpan) {
    textSpan.classList.add("text-clamped");
    btn.textContent = "Ler mais";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DO DOM ---
  const elements = {
    chatOptionsBtn: document.getElementById("chat-options-btn"),
    chatOptionsMenu: document.getElementById("chat-options-menu"),
    optBlockUser: document.getElementById("opt-block-user"),
    optDeleteChat: document.getElementById("opt-delete-chat"),

    modalDeleteChat: document.getElementById("custom-delete-chat-modal"),
    btnCancelChatDelete: document.getElementById("btn-cancel-chat-delete"),
    btnConfirmChatDelete: document.getElementById("btn-confirm-chat-delete"),

    chatInputArea: document.querySelector(".chat-input-area"),

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

    // Modais Antigos
    addGroupBtn: document.querySelector(".add-convo-btn"),
    addConvoModal: document.getElementById("add-convo-modal"),
    closeModalBtn: document.getElementById("close-modal-btn"),
    newConvoUserList: document.getElementById("new-convo-user-list"),
    userSearchInput: document.getElementById("user-search-input"),

    // Novos Modais (Modernos)
    modalEdit: document.getElementById("custom-edit-modal"),
    modalDelete: document.getElementById("custom-delete-modal"),
    inputEdit: document.getElementById("custom-edit-input"),
    btnCancelEdit: document.getElementById("btn-cancel-edit"),
    btnConfirmEdit: document.getElementById("btn-confirm-edit"),
    btnCancelDelete: document.getElementById("btn-cancel-delete"),
    btnConfirmDelete: document.getElementById("btn-confirm-delete"),

    // Botão de Voltar (Mobile)
    backToListBtn: document.getElementById("back-to-list-btn"),
  };

  // Variáveis temporárias para os modais
  let currentMessageIdToEdit = null;
  let currentMessageIdToDelete = null;

  // --- CORREÇÃO DO BOTÃO "EDITAR PERFIL" ---
  const editProfileBtnOld = document.getElementById("edit-profile-btn");
  if (editProfileBtnOld) {
    const editProfileBtnNew = editProfileBtnOld.cloneNode(true);
    editProfileBtnOld.parentNode.replaceChild(
      editProfileBtnNew,
      editProfileBtnOld
    );
    editProfileBtnNew.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "perfil.html";
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
  let isUserBlocked = false;

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
    setupModalListeners(); // Inicializa os ouvintes dos novos modais

    // WebSocket Listeners
    if (stompClient) {
      stompClient.subscribe(`/user/queue/usuario`, onMessageReceived);
      stompClient.subscribe(`/user/queue/contagem`, (message) => {
        const count = JSON.parse(message.body);
        updateMessageBadge(count);
      });
    }

    await fetchConversations();
    checkStartChatParam();
  }

  document.addEventListener("globalScriptsLoaded", (e) => {
    initChatPage(e.detail);
    document.addEventListener("friendsListUpdated", () => {
      userFriends = window.userFriends;
      if (elements.addConvoModal.style.display === "flex")
        renderAvailableUsers();
    });

    // 1. Abrir/Fechar Menu do Card
    window.toggleConvoMenu = function (event, userId, userName) {
      event.stopPropagation(); // Impede abrir a conversa
      event.preventDefault();

      // Fecha todos os outros menus abertos
      document.querySelectorAll(".convo-dropdown-menu").forEach((menu) => {
        if (menu.id !== `convo-menu-${userId}`) menu.classList.remove("active");
      });

      const menu = document.getElementById(`convo-menu-${userId}`);
      if (menu) {
        menu.classList.toggle("active");
      }
    };

    // Fechar menus ao clicar fora
    document.addEventListener("click", () => {
      document
        .querySelectorAll(".convo-dropdown-menu")
        .forEach((menu) => menu.classList.remove("active"));
    });

    // 2. Lógica de Bloquear Usuário
    window.handleBlockUser = async function (event, userId) {
      event.stopPropagation();
      if (
        !confirm(
          "Tem certeza que deseja bloquear este usuário? Vocês não poderão mais trocar mensagens."
        )
      )
        return;

      try {
        // Ajuste a URL conforme seu BackEnd (Ex: /api/bloqueios ou /api/amizades/bloquear)
        await axios.post(`${window.backendUrl}/usuarios/bloquear/${userId}`);

        showNotification("Usuário bloqueado.", "success");
        // Remove a conversa da lista visualmente
        const card = document.querySelector(
          `.convo-card[data-user-id="${userId}"]`
        );
        if (card) card.remove();

        // Se a conversa estava aberta, limpa a tela
        if (activeConversation.usuarioId === userId) {
          document.getElementById("chat-messages-area").innerHTML = "";
          document.getElementById("chat-header-content").innerHTML =
            "<h3>Selecione uma Conversa</h3>";
          activeConversation = {};
        }
      } catch (error) {
        console.error(error);
        showNotification("Erro ao bloquear usuário.", "error");
      }
    };

    // 3. Lógica de Apagar Conversa (Opcional, já que coloquei no menu)
    window.handleDeleteConversation = async function (event, userId) {
      event.stopPropagation();
      if (!confirm("Apagar todo o histórico desta conversa?")) return;

      try {
        await axios.delete(
          `${window.backendUrl}/api/chat/privado/conversa/${userId}`
        );
        showNotification("Conversa apagada.", "success");
        fetchConversations(); // Recarrega a lista
      } catch (error) {
        showNotification("Erro ao apagar conversa.", "error");
      }
    };

    // 4. Lógica do Modal de Bloqueados
    const blockedModal = document.getElementById("blocked-users-modal");
    const openBlockedBtn = document.getElementById("open-blocked-modal-btn");
    const closeBlockedBtn = document.getElementById("close-blocked-modal-btn");
    const blockedList = document.getElementById("blocked-users-list");

    if (openBlockedBtn) {
      openBlockedBtn.addEventListener("click", () => {
        fetchBlockedUsers();
        blockedModal.style.display = "flex";
      });
    }

    if (closeBlockedBtn) {
      closeBlockedBtn.addEventListener("click", () => {
        blockedModal.style.display = "none";
      });
    }

    async function fetchBlockedUsers() {
      blockedList.innerHTML = '<div class="loading-spinner"></div>';
      try {
        // Ajuste a URL conforme seu BackEnd
        const response = await axios.get(
          `${window.backendUrl}/usuarios/bloqueados`
        );
        renderBlockedUsers(response.data);
      } catch (error) {
        console.error(error);
        blockedList.innerHTML =
          '<p class="error-text">Erro ao carregar bloqueados.</p>';
      }
    }

    function renderBlockedUsers(users) {
      const blockedList = document.getElementById("blocked-users-list");
      if (!blockedList) return;

      blockedList.innerHTML = "";

      if (!users || users.length === 0) {
        blockedList.innerHTML = `
                <div style="text-align:center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success); margin-bottom: 1rem;"></i>
                    <p style="color:var(--text-secondary);">Sua lista de bloqueios está vazia.</p>
                </div>`;
        return;
      }

      users.forEach((user) => {
        const item = document.createElement("div");
        item.className = "user-list-item"; // Classe do CSS novo

        // Tratamento de imagem robusto
        const avatarUrl = user.fotoPerfil
          ? user.fotoPerfil.startsWith("http")
            ? user.fotoPerfil
            : `${window.backendUrl}${user.fotoPerfil}`
          : window.defaultAvatarUrl;

        item.innerHTML = `
                <div class="user-info-area">
                    <img src="${avatarUrl}" alt="${user.nome}" onerror="this.src='${window.defaultAvatarUrl}'">
                    <span>${user.nome}</span>
                </div>
                
                <div class="user-actions-area">
                    <button class="btn-view" title="Ver Conversa Antiga" onclick="window.viewBlockedChat(${user.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    
                    <button class="btn-unblock" onclick="window.handleUnblockUser(${user.id})">
                        Desbloquear
                    </button>
                </div>
            `;
        blockedList.appendChild(item);
      });
    }

    window.viewBlockedChat = function (userId) {
      // 1. Fecha o modal de bloqueados
      const blockedModal = document.getElementById("blocked-users-modal");
      if (blockedModal) blockedModal.style.display = "none";

      // 2. Abre a conversa
      // A função selectConversation já tem inteligência para buscar os dados do usuário
      // se ele não estiver na lista lateral (que é o caso aqui).
      selectConversation(userId);
    };

    window.handleUnblockUser = async function (userId) {
      try {
        // Ajuste a URL conforme seu BackEnd
        await axios.delete(`${window.backendUrl}/usuarios/bloquear/${userId}`); // Ou POST /desbloquear
        showNotification("Usuário desbloqueado.", "success");
        fetchBlockedUsers(); // Recarrega a lista do modal
        fetchConversations(); // Recarrega a lista de conversas (caso ele reapareça)
      } catch (error) {
        showNotification("Erro ao desbloquear.", "error");
      }
    };
  });

  // --- HELPER: FORMATAÇÃO DE TEXTO ---
  function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/[&<>"']/g, function (m) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[m];
    });
  }

  function formatMessageContent(text) {
    const LIMITE_CARACTERES = 350;
    if (!text) return "";
    let safeText = escapeHtml(text).replace(/\n/g, "<br>");
    if (text.length <= LIMITE_CARACTERES) {
      return safeText;
    }
    return `
            <div class="message-text-body text-clamped">${safeText}</div>
            <button class="read-more-btn" onclick="toggleMessageReadMore(this)">Ler mais</button>
        `;
  }

  // --- RESPONSIVIDADE ---
  function setupResponsiveListeners() {
    const btnMenu = document.getElementById("mobile-menu-toggle");
    const btnClose = document.getElementById("sidebar-close");
    let overlay = document.getElementById("mobile-overlay");
    const sidebar = document.getElementById("sidebar");

    function toggleSidebar(e) {
      if (e && e.preventDefault) e.preventDefault();
      if (sidebar && overlay) {
        const isActive = sidebar.classList.contains("active");
        if (isActive) {
          sidebar.classList.remove("active");
          overlay.classList.remove("active");
          document.body.style.overflow = "";
        } else {
          sidebar.classList.add("active");
          overlay.classList.add("active");
          document.body.style.overflow = "hidden";
        }
      }
    }

    if (btnMenu) {
      const newBtn = btnMenu.cloneNode(true);
      btnMenu.parentNode.replaceChild(newBtn, btnMenu);
      newBtn.addEventListener("click", toggleSidebar);
    }
    if (btnClose) {
      const newClose = btnClose.cloneNode(true);
      btnClose.parentNode.replaceChild(newClose, btnClose);
      newClose.addEventListener("click", toggleSidebar);
    }
    if (overlay) {
      const newOverlay = overlay.cloneNode(true);
      overlay.parentNode.replaceChild(newOverlay, overlay);
      overlay = newOverlay;
      overlay.addEventListener("click", toggleSidebar);
    }

    const menuLinks = document.querySelectorAll(".sidebar-menu .menu-item");
    menuLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 1024) setTimeout(() => toggleSidebar(), 150);
      });
    });
  }

  function updateMessageBadge(count) {
    const b1 = document.getElementById("message-badge");
    const b2 = document.getElementById("message-badge-sidebar");
    if (b1) {
      b1.textContent = count;
      b1.style.display = count > 0 ? "flex" : "none";
    }
    if (b2) {
      b2.textContent = count;
      b2.style.display = count > 0 ? "flex" : "none";
    }
  }

  // --- API & DADOS ---
  async function fetchConversations() {
    try {
      if (elements.conversationsList)
        elements.conversationsList.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div></div>`;
      const response = await axios.get(
        `${backendUrl}/api/chat/privado/minhas-conversas`
      );
      conversas = response.data.map((c) => ({
        ...c,
        avatarUrl:
          c.fotoPerfilOutroUsuario &&
          c.fotoPerfilOutroUsuario.startsWith("http")
            ? c.fotoPerfilOutroUsuario
            : `${window.backendUrl}${
                c.fotoPerfilOutroUsuario || "/images/default-avatar.jpg"
              }`,
        unreadCount: unreadMessagesCount.get(c.outroUsuarioId) || 0,
      }));
      sortConversations();
      renderConversationsList();
    } catch (error) {
      console.error("Erro conversas:", error);
      if (elements.conversationsList)
        elements.conversationsList.innerHTML = `<div class="error-state"><p>Erro ao carregar conversas</p><button class="retry-btn" data-action="retry-conversations">Tentar novamente</button></div>`;
    }
  }

  function sortConversations() {
    conversas.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return (
        new Date(b.dataEnvioUltimaMensagem) -
        new Date(a.dataEnvioUltimaMensagem)
      );
    });
  }

  // --- LÓGICA DE CHAT ---
  async function checkStartChatParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const startChatUserId = urlParams.get("start_chat");
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
          targetUser = {
            idUsuario: u.id,
            nome: u.nome,
            fotoPerfil: u.urlFotoPerfil || u.fotoPerfil,
          };
        } catch (err) {
          console.error(err);
          return;
        }
      }
      const avatar =
        targetUser.fotoPerfil && targetUser.fotoPerfil.startsWith("http")
          ? targetUser.fotoPerfil
          : `${window.backendUrl}${
              targetUser.fotoPerfil || "/images/default-avatar.jpg"
            }`;
      convoData = {
        outroUsuarioId: targetUser.idUsuario,
        nomeOutroUsuario: targetUser.nome,
        avatarUrl: avatar,
        conteudoUltimaMensagem: null,
        dataEnvioUltimaMensagem: new Date().toISOString(),
        remetenteUltimaMensagemId: null,
        unreadCount: 0,
      };
      conversas.unshift(convoData);
      renderConversationsList();
    }

    activeConversation = {
      usuarioId: otherUserId,
      nome: convoData.nomeOutroUsuario || convoData.nome,
      avatar: convoData.avatarUrl || defaultAvatarUrl,
    };

    await checkBlockStatus(otherUserId);

    // Adiciona classe para mostrar o chat no mobile
    if (elements.chatContainer)
      elements.chatContainer.classList.add("chat-open");

    renderChatHeader();
    document
      .querySelectorAll(".convo-card")
      .forEach((c) => c.classList.remove("selected"));
    const card = document.querySelector(
      `.convo-card[data-user-id="${otherUserId}"]`
    );
    if (card) card.classList.add("selected");

    try {
      if (unreadMessagesCount.get(otherUserId) > 0) {
        unreadMessagesCount.set(otherUserId, 0);
        updateConversationUnreadCount(otherUserId, 0);
      }
      await axios.post(
        `${backendUrl}/api/chat/privado/marcar-lida/${otherUserId}`
      );
    } catch (e) {
      console.error(e);
    }

    showMessagesLoading();
    await fetchMessages(otherUserId);

    elements.messageInput.disabled = false;
    elements.chatSendBtn.disabled = false;
    if (elements.recordAudioBtn) elements.recordAudioBtn.disabled = false;
    elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;
    elements.messageInput.focus();
  }

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
      const response = await axios.get(
        `${backendUrl}/api/chat/privado/historico/${otherUserId}`
      );
      chatMessages.set(cacheKey, response.data);
      renderMessages(response.data);
    } catch (error) {
      console.error(error);
      if (elements.chatMessagesContainer)
        elements.chatMessagesContainer.innerHTML = `<div class="error-state"><p>Erro ao carregar mensagens</p></div>`;
    }
  }

  function handleSendMessage(e) {
    e.preventDefault();
    const content = elements.messageInput.value.trim();
    if (!content || !activeConversation.usuarioId || !stompClient?.connected)
      return;

    stompClient.send(
      `/app/privado/${activeConversation.usuarioId}`,
      {},
      JSON.stringify({
        conteudo: content,
        destinatarioId: activeConversation.usuarioId,
      })
    );
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }

  function updateSidebarUserInfo() {
    const userInfoContainer = document.querySelector(".user-info");
    const user = currentUser || window.currentUser;
    if (user) {
      const sidebarName = document.getElementById("sidebar-user-name");
      const sidebarTitle = document.getElementById("sidebar-user-title");
      const sidebarImg = document.getElementById("sidebar-user-img");
      const connectionsCount = document.getElementById("connections-count");

      if (sidebarName) sidebarName.textContent = user.nome;
      if (sidebarTitle) {
        let userRole = user.tipoUsuario || "Membro";
        if (userRole && typeof userRole === "string") {
          userRole = userRole.replace("ROLE_", "").toLowerCase();
          userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1);
        }
        sidebarTitle.textContent = userRole;
      }
      if (sidebarImg && user.fotoPerfil) {
        if (typeof window.getAvatarUrl === "function") {
          sidebarImg.src = window.getAvatarUrl(user.fotoPerfil);
        } else {
          sidebarImg.src = user.fotoPerfil;
        }
      }
      if (connectionsCount && window.userFriends)
        connectionsCount.textContent = window.userFriends.length;
      if (userInfoContainer) userInfoContainer.classList.add("loaded");
    }
  }

  function onMessageReceived(payload) {
    const msg = JSON.parse(payload.body);
    if (msg.tipo === "remocao") {
      handleMessageRemoval(msg);
      return;
    }

    const otherUserId =
      msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
    const cacheKey = getCacheKey(otherUserId);

    if (!chatMessages.has(cacheKey)) chatMessages.set(cacheKey, []);
    const messages = chatMessages.get(cacheKey);

    const existingIndex = messages.findIndex((m) => m.id === msg.id);
    if (existingIndex !== -1) {
      messages[existingIndex] = msg;
    } else {
      messages.push(msg);
    }

    let convoIdx = conversas.findIndex((c) => c.outroUsuarioId === otherUserId);
    let convo;
    if (convoIdx > -1) {
      convo = conversas.splice(convoIdx, 1)[0];
      convo.conteudoUltimaMensagem = msg.conteudo;
      convo.dataEnvioUltimaMensagem = msg.dataEnvio;
      convo.remetenteUltimaMensagemId = msg.remetenteId;

      if (
        msg.destinatarioId === currentUser.id &&
        activeConversation.usuarioId !== otherUserId
      ) {
        convo.unreadCount = (convo.unreadCount || 0) + 1;
        unreadMessagesCount.set(otherUserId, convo.unreadCount);
      }
    } else {
      fetchConversations();
      return;
    }
    conversas.unshift(convo);
    renderConversationsList();

    if (activeConversation.usuarioId === otherUserId) {
      renderMessages(messages);
    }
  }

  function handleMessageRemoval(msg) {
    const el = document.querySelector(`[data-message-id="${msg.id}"]`);
    if (el) el.remove();
    const otherUserId =
      msg.remetenteId === currentUser.id ? msg.destinatarioId : msg.remetenteId;
    const key = getCacheKey(otherUserId);
    if (chatMessages.has(key)) {
      const list = chatMessages.get(key).filter((m) => m.id !== msg.id);
      chatMessages.set(key, list);
    }
  }

  function renderConversationsList() {
    if (!elements.conversationsList) return;
    elements.conversationsList.innerHTML = "";
    if (conversas.length === 0) {
      elements.conversationsList.innerHTML = `<div class="empty-state"><p>Nenhuma conversa</p></div>`;
      return;
    }
    conversas.forEach((c) =>
      elements.conversationsList.appendChild(createConversationCardElement(c))
    );
  }

  /* Substitua a função createConversationCardElement existente por esta: */
  function createConversationCardElement(convo) {
    const isActive =
      activeConversation &&
      convo.outroUsuarioId === activeConversation.usuarioId;
    const card = document.createElement("div");
    card.className = `convo-card ${isActive ? "selected" : ""} ${
      convo.unreadCount > 0 ? "unread" : ""
    }`;
    card.dataset.userId = convo.outroUsuarioId;
    card.dataset.userName = convo.nomeOutroUsuario;

    // Garante posição relativa para o dropdown funcionar
    card.style.position = "relative";

    let lastMsg = "Inicie a conversa...";
    let author = "";
    if (convo.conteudoUltimaMensagem) {
      author =
        convo.remetenteUltimaMensagemId === currentUser.id
          ? "<strong>Você:</strong> "
          : "";
      lastMsg = isAudioUrl(convo.conteudoUltimaMensagem)
        ? '<i class="fas fa-microphone audio-icon"></i> Áudio'
        : convo.conteudoUltimaMensagem;
    }

    card.innerHTML = `
            <div class="convo-avatar-wrapper">
                <img src="${convo.avatarUrl}" class="avatar" alt="${
      convo.nomeOutroUsuario
    }">
                ${
                  convo.unreadCount > 0
                    ? `<div class="unread-badge">${convo.unreadCount}</div>`
                    : ""
                }
            </div>
            <div class="group-info">
                <div class="group-title">${convo.nomeOutroUsuario}</div>
                <div class="group-last-msg">${author}${lastMsg}</div>
            </div>
            
            <button class="convo-options-btn" onclick="window.toggleConvoMenu(event, ${
              convo.outroUsuarioId
            }, '${convo.nomeOutroUsuario}')">
                <i class="fas fa-ellipsis-v"></i>
            </button>
            
            <div class="convo-dropdown-menu" id="convo-menu-${
              convo.outroUsuarioId
            }">
                <button onclick="window.handleBlockUser(event, ${
                  convo.outroUsuarioId
                })">
                    <i class="fas fa-ban"></i> Bloquear
                </button>
                <button class="danger" onclick="window.handleDeleteConversation(event, ${
                  convo.outroUsuarioId
                })">
                    <i class="fas fa-trash"></i> Apagar Conversa
                </button>
            </div>
        `;

    // Clique no card abre a conversa (exceto se clicar no botão de opções)
    card.addEventListener("click", (e) => {
      if (
        !e.target.closest(".convo-options-btn") &&
        !e.target.closest(".convo-dropdown-menu")
      ) {
        selectConversation(convo.outroUsuarioId);
      }
    });

    return card;
  }

  function renderChatHeader() {
    const content = activeConversation.usuarioId
      ? `
            <div class="chat-header-profile-link" 
                 style="display: flex; align-items: center; gap: 1rem; cursor: pointer;" 
                 onclick="window.location.href='perfil.html?id=${activeConversation.usuarioId}'" 
                 title="Ver perfil">
                <img src="${activeConversation.avatar}" class="chat-group-avatar" alt="${activeConversation.nome}">
                <div><h3 class="chat-group-title">${activeConversation.nome}</h3></div>
            </div>
        `
      : `<h3 class="chat-group-title">Selecione uma Conversa</h3>`;

    if (elements.chatHeaderContent)
      elements.chatHeaderContent.innerHTML = content;
    else elements.chatHeader.innerHTML = content;
  }

  function renderMessages(messages) {
    if (!elements.chatMessagesContainer) return;
    if (!messages || messages.length === 0) {
      elements.chatMessagesContainer.innerHTML = `<div class="empty-chat"><i class="fas fa-comments"></i></div>`;
      return;
    }

    elements.chatMessagesContainer.innerHTML = messages
      .map((msg) => {
        const isMe = msg.remetenteId === currentUser.id;
        const time = new Date(msg.dataEnvio).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        let contentHtml = isAudioUrl(msg.conteudo)
          ? `<div class="audio-message"><audio controls src="${msg.conteudo}"></audio></div>`
          : formatMessageContent(msg.conteudo);

        const actionsHtml = isMe
          ? `
                <div class="message-actions">
                    <button class="btn-action btn-edit-msg" data-message-id="${msg.id}" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-action btn-delete-msg" data-message-id="${msg.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </div>
            `
          : "";

        return `
                <div class="message-group ${
                  isMe ? "me" : "outro"
                }" data-message-id="${msg.id}">
                    ${
                      !isMe
                        ? `<div class="message-avatar"><img src="${activeConversation.avatar}" alt=""></div>`
                        : ""
                    }
                    <div class="message-block">
                        <div class="message-author-header"><strong>${
                          isMe ? "Você" : msg.nomeRemetente
                        }</strong> <span>${time}</span></div>
                        <div class="message-content-wrapper">
                            ${isMe ? actionsHtml : ""} 
                            <div class="message-content">${contentHtml}</div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
    elements.chatMessagesContainer.scrollTop =
      elements.chatMessagesContainer.scrollHeight;
  }

  function showMessagesLoading() {
    if (elements.chatMessagesContainer)
      elements.chatMessagesContainer.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p>Carregando...</p></div>`;
  }

  function updateConversationUnreadCount(userId, count) {
    const idx = conversas.findIndex((c) => c.outroUsuarioId === userId);
    if (idx !== -1) {
      conversas[idx].unreadCount = count;
      sortConversations();
      renderConversationsList();
    }
  }

  function isAudioUrl(url) {
    if (typeof url !== "string") return false;
    return (
      (url.startsWith("http") || url.startsWith("/")) &&
      /\.(mp3|wav|ogg|webm|opus)$/i.test(url)
    );
  }

  // --- AUDIO ---
  function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const min = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const sec = String(elapsed % 60).padStart(2, "0");
    const t = elements.recordAudioBtn.querySelector(".audio-timer");
    if (t) t.textContent = `${min}:${sec}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
      mediaRecorder.onstop = uploadAudio;
      mediaRecorder.start();
      isRecording = true;
      startTime = Date.now();
      elements.recordAudioBtn.classList.add("recording");
      elements.recordAudioBtn.innerHTML = `<i class="fas fa-stop"></i> <span class="audio-timer">00:00</span>`;
      timerInterval = setInterval(updateTimer, 1000);
      elements.messageInput.disabled = true;
      elements.messageInput.placeholder = "Gravando...";
    } catch (e) {
      alert("Erro microfone");
    }
  }

  async function uploadAudio() {
    isRecording = false;
    clearInterval(timerInterval);
    if (mediaRecorder)
      mediaRecorder.stream.getTracks().forEach((t) => t.stop());
    elements.recordAudioBtn.classList.remove("recording");
    elements.recordAudioBtn.innerHTML = `<i class="fas fa-microphone"></i>`;
    elements.messageInput.disabled = false;
    elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;
    const blob = new Blob(audioChunks, { type: "audio/webm;codecs=opus" });
    if (blob.size < 1000) return;
    const formData = new FormData();
    formData.append("file", blob, `audio-${Date.now()}.webm`);
    try {
      const res = await axios.post(
        `${backendUrl}/api/chat/privado/upload`,
        formData
      );
      stompClient.send(
        `/app/privado/${activeConversation.usuarioId}`,
        {},
        JSON.stringify({
          conteudo: res.data.url,
          destinatarioId: activeConversation.usuarioId,
        })
      );
    } catch (e) {
      alert("Erro envio áudio");
    }
  }

  // --- SETUP LISTENERS E MODAIS ---
  function setupChatEventListeners() {
    if (elements.chatForm)
      elements.chatForm.addEventListener("submit", handleSendMessage);

    // Toggle Menu Dropdown
    if (elements.chatOptionsBtn) {
      elements.chatOptionsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        elements.chatOptionsMenu.classList.toggle("show");
      });
    }
    // Adicione isso dentro de setupChatEventListeners()
    if (elements.messageInput) {
      // Quando o teclado abrir (foco no input)
      elements.messageInput.addEventListener("focus", () => {
        // Espera 300ms para o teclado subir totalmente
        setTimeout(() => {
          if (elements.chatMessagesContainer) {
            // Rola para a última mensagem
            elements.chatMessagesContainer.scrollTop =
              elements.chatMessagesContainer.scrollHeight;
          }
          // Garante que o input esteja visível
          elements.messageInput.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 300);
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", (e) => {
      if (
        elements.chatOptionsMenu &&
        !elements.chatOptionsMenu.contains(e.target) &&
        e.target !== elements.chatOptionsBtn
      ) {
        elements.chatOptionsMenu.classList.remove("show");
      }
    });

    // Ação de Bloquear/Desbloquear
    if (elements.optBlockUser) {
      elements.optBlockUser.addEventListener("click", (e) => {
        e.preventDefault();
        toggleBlockUser();
      });
    }

    // Ação de Excluir Conversa (Abre Modal)
    if (elements.optDeleteChat) {
      elements.optDeleteChat.addEventListener("click", (e) => {
        e.preventDefault();
        elements.chatOptionsMenu.classList.remove("show");
        elements.modalDeleteChat.classList.add("active");
      });
    }

    // Confirmar Exclusão de Conversa
    if (elements.btnConfirmChatDelete) {
      elements.btnConfirmChatDelete.addEventListener(
        "click",
        deleteFullConversation
      );
    }

    // Cancelar Exclusão de Conversa
    if (elements.btnCancelChatDelete) {
      elements.btnCancelChatDelete.addEventListener("click", () => {
        elements.modalDeleteChat.classList.remove("active");
      });
    }

    if (elements.recordAudioBtn) {
      elements.recordAudioBtn.addEventListener("click", () => {
        if (!activeConversation.usuarioId)
          return alert("Selecione uma conversa.");
        if (isRecording) mediaRecorder.stop();
        else startRecording();
      });
    }

    // =========================================================
    // CORREÇÃO: BOTÃO DE VOLTAR NO MOBILE
    // =========================================================
    if (elements.backToListBtn) {
      elements.backToListBtn.addEventListener("click", () => {
        if (elements.chatContainer) {
          elements.chatContainer.classList.remove("chat-open");
        }
      });
    }

    const sidebarHeader = document.querySelector(".sidebar-header");
    if (sidebarHeader) {
      sidebarHeader.style.cursor = "pointer";
      sidebarHeader.addEventListener("click", (e) => {
        if (e.target.closest("button") || e.target.closest(".add-convo-btn"))
          return;
        window.location.href = "perfil.html";
      });
    }

    // Cliques nas mensagens (Editar/Excluir)
    if (elements.chatMessagesContainer) {
      elements.chatMessagesContainer.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-edit-msg");
        if (editBtn) {
          openEditModal(editBtn.dataset.messageId);
          return;
        }

        const delBtn = e.target.closest(".btn-delete-msg");
        if (delBtn) {
          openDeleteModal(delBtn.dataset.messageId);
          return;
        }

        const bubble = e.target.closest(".message-content");
        if (bubble) {
          if (
            e.target.tagName === "A" ||
            e.target.classList.contains("read-more-btn")
          )
            return;
          const group = bubble.closest(".message-group");
          if (group && group.classList.contains("me")) {
            document
              .querySelectorAll(".message-group.active-actions")
              .forEach((el) => {
                if (el !== group) el.classList.remove("active-actions");
              });
            group.classList.toggle("active-actions");
          }
        } else {
          document
            .querySelectorAll(".message-group.active-actions")
            .forEach((el) => el.classList.remove("active-actions"));
        }
      });
    }

    if (elements.conversationSearch) {
      elements.conversationSearch.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll(".convo-card").forEach((c) => {
          c.style.display = c.dataset.userName.toLowerCase().includes(q)
            ? "flex"
            : "none";
        });
      });
    }

    if (elements.addGroupBtn)
      elements.addGroupBtn.addEventListener("click", () => {
        renderAvailableUsers();
        elements.addConvoModal.style.display = "flex";
      });
    if (elements.closeModalBtn)
      elements.closeModalBtn.addEventListener(
        "click",
        () => (elements.addConvoModal.style.display = "none")
      );

    if (elements.newConvoUserList) {
      elements.newConvoUserList.addEventListener("click", (e) => {
        const item = e.target.closest(".user-list-item");
        if (item) {
          const id = item.dataset.usuarioId || item.dataset.userId;
          if (id) {
            elements.addConvoModal.style.display = "none";
            selectConversation(id);
          }
        }
      });
    }

    if (elements.userSearchInput) {
      elements.userSearchInput.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll(".user-list-item").forEach((i) => {
          const name = i.querySelector(".user-list-name")
            ? i.querySelector(".user-list-name").textContent
            : i.textContent;
          i.style.display = name.toLowerCase().includes(q) ? "flex" : "none";
        });
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("retry-btn")) {
        const action = e.target.dataset.action;
        if (action === "retry-conversations") fetchConversations();
      }
    });
  }

  function renderAvailableUsers() {
    const existing = conversas.map((c) => c.outroUsuarioId);
    const available = userFriends.filter(
      (f) => !existing.includes(f.idUsuario || f.usuarioId)
    );
    if (available.length === 0) {
      elements.newConvoUserList.innerHTML = `<p style="padding:1rem; text-align:center; color:var(--text-secondary)">Nenhum novo contato disponível.</p>`;
      return;
    }
    elements.newConvoUserList.innerHTML = available
      .map((f) => {
        const avatar =
          f.fotoPerfil && f.fotoPerfil.startsWith("http")
            ? f.fotoPerfil
            : `${backendUrl}${f.fotoPerfil || "/images/default-avatar.jpg"}`;
        return `
            <div class="user-list-item" data-usuario-id="${
              f.idUsuario || f.usuarioId
            }">
                <img src="${avatar}" alt="${f.nome}">
                <div class="user-list-info">
                    <span class="user-list-name">${f.nome}</span>
                </div>
            </div>`;
      })
      .join("");
  }

  // =========================================================
  // LÓGICA DOS NOVOS MODAIS (SUBSTITUINDO PROMPT/CONFIRM)
  // =========================================================

  function setupModalListeners() {
    // Cancelar Edição
    if (elements.btnCancelEdit) {
      elements.btnCancelEdit.addEventListener("click", () => {
        elements.modalEdit.classList.remove("active");
        currentMessageIdToEdit = null;
      });
    }
    // Confirmar Edição
    if (elements.btnConfirmEdit) {
      elements.btnConfirmEdit.addEventListener("click", async () => {
        const newTxt = elements.inputEdit.value.trim();
        if (currentMessageIdToEdit && newTxt) {
          try {
            await axios.put(
              `${backendUrl}/api/chat/privado/${currentMessageIdToEdit}`,
              newTxt,
              { headers: { "Content-Type": "text/plain" } }
            );
            elements.modalEdit.classList.remove("active");
          } catch (e) {
            alert("Erro ao editar");
          }
        }
      });
    }

    // Cancelar Exclusão
    if (elements.btnCancelDelete) {
      elements.btnCancelDelete.addEventListener("click", () => {
        elements.modalDelete.classList.remove("active");
        currentMessageIdToDelete = null;
      });
    }
    // Confirmar Exclusão
    if (elements.btnConfirmDelete) {
      elements.btnConfirmDelete.addEventListener("click", async () => {
        if (currentMessageIdToDelete) {
          try {
            await axios.delete(
              `${backendUrl}/api/chat/privado/${currentMessageIdToDelete}`
            );
            elements.modalDelete.classList.remove("active");
          } catch (e) {
            alert("Erro ao excluir");
          }
        }
      });
    }

    // Fechar ao clicar fora (Backdrop)
    [elements.modalEdit, elements.modalDelete].forEach((modal) => {
      if (modal) {
        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            modal.classList.remove("active");
          }
        });
      }
    });
  }

  function openEditModal(id) {
    const el = document.querySelector(
      `[data-message-id="${id}"] .message-content`
    );
    if (!el) return;

    // Pega texto limpo (sem "Ler mais")
    const oldTxt = el.textContent
      .replace("Ler mais", "")
      .replace("Ler menos", "")
      .trim();

    currentMessageIdToEdit = id;
    elements.inputEdit.value = oldTxt;
    elements.modalEdit.classList.add("active");

    // Foca no final do texto
    setTimeout(() => elements.inputEdit.focus(), 100);
  }

  function openDeleteModal(id) {
    currentMessageIdToDelete = id;
    elements.modalDelete.classList.add("active");
  }

  async function checkBlockStatus(userId) {
    try {
      const res = await axios.get(
        `${backendUrl}/usuarios/status-bloqueio/${userId}`
      );
      const { euBloqueei, fuiBloqueado } = res.data;

      isUserBlocked = euBloqueei; // Atualiza estado global
      updateBlockUI(euBloqueei, fuiBloqueado);
    } catch (e) {
      console.error("Erro ao verificar bloqueio", e);
    }
  }

  function updateBlockUI(euBloqueei, fuiBloqueado) {
    const blockText = elements.optBlockUser.querySelector("span");
    const blockIcon = elements.optBlockUser.querySelector("i");

    if (euBloqueei) {
      blockText.textContent = "Desbloquear Usuário";
      blockIcon.className = "fas fa-check-circle";
    } else {
      blockText.textContent = "Bloquear Usuário";
      blockIcon.className = "fas fa-ban";
    }

    if (euBloqueei || fuiBloqueado) {
      elements.chatInputArea.classList.add("blocked");
      elements.messageInput.disabled = true;
      elements.chatSendBtn.disabled = true;
      elements.messageInput.placeholder = euBloqueei
        ? "Você bloqueou este usuário."
        : "Você foi bloqueado por este usuário.";
    } else {
      elements.chatInputArea.classList.remove("blocked");
      elements.messageInput.disabled = false;
      elements.chatSendBtn.disabled = false;
      elements.messageInput.placeholder = `Escreva para ${activeConversation.nome}...`;
    }
  }

  async function toggleBlockUser() {
    if (!activeConversation.usuarioId) return;

    const action = isUserBlocked ? "bloquear" : "bloquear"; // O endpoint de delete é o mesmo path base
    // Se isUserBlocked é true, vamos chamar o DELETE (desbloquear)
    // Se isUserBlocked é false, vamos chamar o POST (bloquear)

    try {
      if (isUserBlocked) {
        // Desbloquear
        await axios.delete(
          `${backendUrl}/api/chat/privado/bloquear/${activeConversation.usuarioId}`
        );
      } else {
        // Bloquear
        await axios.post(
          `${backendUrl}/api/chat/privado/bloquear/${activeConversation.usuarioId}`
        );
      }
      // Recarrega status
      await checkBlockStatus(activeConversation.usuarioId);
      elements.chatOptionsMenu.classList.remove("show"); // Fecha menu
    } catch (e) {
      alert("Erro ao alterar bloqueio.");
    }
  }

  async function deleteFullConversation() {
    if (!activeConversation.usuarioId) return;
    try {
      await axios.delete(
        `${backendUrl}/api/chat/privado/conversa/${activeConversation.usuarioId}`
      );
      elements.modalDeleteChat.classList.remove("active");

      // Remove da lista visualmente e limpa a tela
      conversas = conversas.filter(
        (c) => c.outroUsuarioId !== activeConversation.usuarioId
      );
      renderConversationsList();

      // Volta para estado vazio ou fecha chat mobile
      if (window.innerWidth <= 1024) {
        elements.chatContainer.classList.remove("chat-open");
      }
      elements.chatMessagesContainer.innerHTML = `<div class="empty-chat">Conversa excluída.</div>`;
      activeConversation = { usuarioId: null };
      renderChatHeader();
    } catch (e) {
      alert("Erro ao excluir conversa.");
    }
  }
});
