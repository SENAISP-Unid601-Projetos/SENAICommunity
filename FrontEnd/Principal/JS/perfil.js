document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
  const backendUrl = "http://localhost:8080";
  const jwtToken = localStorage.getItem("token");
  const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
  let stompClient = null;
  let currentUser = null; // O usuário que está LOGADO
  let profileUser = null; // O usuário do perfil que está sendo VISTO

  // Variáveis globais para Amigos e Notificações (transportadas de principal.js)
  let userFriends = [];
  let friendsLoaded = false;
  let latestOnlineEmails = [];

  // Variáveis globais para Posts (transportadas de principal.js)
  let selectedFilesForEdit = [];
  let urlsParaRemover = [];

  // --- FUNÇÕES DE CONTROLE DE TEMA ---
  function setInitialTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const themeToggleIcon = document.querySelector(".theme-toggle i");
    if (themeToggleIcon) {
      if (theme === "dark") {
        themeToggleIcon.classList.remove("fa-sun");
        themeToggleIcon.classList.add("fa-moon");
      } else {
        themeToggleIcon.classList.remove("fa-moon");
        themeToggleIcon.classList.add("fa-sun");
      }
    }
  }

  // --- ELEMENTOS DO DOM (ATUALIZADOS) ---
  const elements = {
    // Elementos da página de perfil
    profileName: document.getElementById("profile-name"),
    profileTitle: document.getElementById("profile-title"),
    profilePicImg: document.getElementById("profile-pic-img"),
    profileBio: document.getElementById("profile-bio"),
    profileEmail: document.getElementById("profile-email"),
    profileDob: document.getElementById("profile-dob"),
    editProfileBtnPage: document.getElementById("edit-profile-btn-page"),
    notificationCenter: document.querySelector(".notification-center"),

    // Elementos da UI geral (reutilizados)
    topbarUserName: document.getElementById("topbar-user-name"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserTitle: document.getElementById("sidebar-user-title"),
    topbarUserImg: document.getElementById("topbar-user-img"),
    sidebarUserImg: document.getElementById("sidebar-user-img"),
    logoutBtn: document.getElementById("logout-btn"),
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    connectionsCount: document.getElementById("connections-count"),
    messageBadge: document.getElementById("message-badge"),
    messageBadgeMenu: document.getElementById("message-badge-menu"),

    // Modais de Conta de Usuário
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
    deleteAccountModal: document.getElementById("delete-account-modal"),
    deleteAccountForm: document.getElementById("delete-account-form"),
    cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
    deleteConfirmPassword: document.getElementById("delete-confirm-password"),

    // Elementos de Notificações e Amigos (NOVOS)
    notificationsIcon: document.getElementById("notifications-icon"),
    notificationsPanel: document.getElementById("notifications-panel"),
    notificationsList: document.getElementById("notifications-list"),
    notificationsBadge: document.getElementById("notifications-badge"),
    onlineFriendsList: document.getElementById("online-friends-list"),

    // Elementos de Post (NOVOS)
    postsContainer: document.querySelector(".posts-container"),
    editPostModal: document.getElementById("edit-post-modal"),
    editPostForm: document.getElementById("edit-post-form"),
    editPostIdInput: document.getElementById("edit-post-id"),
    editPostTextarea: document.getElementById("edit-post-textarea"),
    cancelEditPostBtn: document.getElementById("cancel-edit-post-btn"),
    editPostFileInput: document.getElementById("edit-post-files"),
    editFilePreviewContainer: document.getElementById(
      "edit-file-preview-container"
    ),
    editExistingMediaContainer: document.getElementById(
      "edit-existing-media-container"
    ), // NOVO
    editCommentModal: document.getElementById("edit-comment-modal"),
    editCommentForm: document.getElementById("edit-comment-form"),
    editCommentIdInput: document.getElementById("edit-comment-id"),
    editCommentTextarea: document.getElementById("edit-comment-textarea"),
    cancelEditCommentBtn: document.getElementById("cancel-edit-comment-btn"),
  };

  // --- FUNÇÕES DE UI (Geral) ---

  // Preenche os dados da página de perfil
  function populateProfileData(user) {
    if (!user) return;
    
    // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
    // Esta lógica robusta lida com URLs externas (http) e internas (/api/arquivos)
    const userImage =
      user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http")
        ? user.urlFotoPerfil
        : `${backendUrl}${
            user.urlFotoPerfil || defaultAvatarUrl
          }`;
    // ▲▲▲ FIM DA CORREÇÃO ▲▲▲

    const userDob = user.dataNascimento
      ? new Date(user.dataNascimento).toLocaleDateString("pt-BR", {
          timeZone: "UTC",
        })
      : "Não informado";

    if (elements.profileName) elements.profileName.textContent = user.nome;
    if (elements.profileTitle)
      elements.profileTitle.textContent = user.titulo || "Membro da Comunidade";
    if (elements.profilePicImg) elements.profilePicImg.src = userImage;
    if (elements.profileBio)
      elements.profileBio.textContent = user.bio || "Nenhuma bio informada.";
    if (elements.profileEmail) elements.profileEmail.textContent = user.email;
    if (elements.profileDob) elements.profileDob.textContent = userDob;
  }

  // Preenche os dados do header e sidebar
  function updateUIWithUserData(user) {
    if (!user) return;
    
    // ▼▼▼ CORREÇÃO APLICADA AQUI ▼▼▼
    const userImage =
      user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http")
        ? user.urlFotoPerfil
        : `${backendUrl}${
            user.urlFotoPerfil || defaultAvatarUrl
          }`;
    // ▲▲▲ FIM DA CORREÇÃO ▲▲▲
    
    if (elements.topbarUserName)
      elements.topbarUserName.textContent = user.nome;
    if (elements.sidebarUserName)
      elements.sidebarUserName.textContent = user.nome;
    if (elements.sidebarUserTitle)
      elements.sidebarUserTitle.textContent =
        user.titulo || "Membro da Comunidade";
    if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
    if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
  }
  
  // --- INICIALIZAÇÃO (ATUALIZADA) ---
  async function init() {
    if (!jwtToken) {
      window.location.href = "login.html";
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

    try {
      // 1. Pega o ID da URL
      const urlParams = new URLSearchParams(window.location.search);
      const profileUserId = urlParams.get("id");

      // 2. Carrega o USUÁRIO LOGADO (para saber quem "eu" sou)
      // Essencial para WebSocket, notificações e saber se o perfil é meu.
      const meResponse = await axios.get(`${backendUrl}/usuarios/me`);
      currentUser = meResponse.data;
      window.currentUser = currentUser; // Expor globalmente

      // 3. Decide qual perfil carregar
      let fetchUrl;
      let isMyProfile;

      if (profileUserId && profileUserId != currentUser.id) {
        // Vendo o perfil de OUTRA pessoa
        fetchUrl = `${backendUrl}/usuarios/${profileUserId}`;
        isMyProfile = false;
      } else {
        // Vendo o MEU perfil (seja por /perfil.html ou /perfil.html?id=meuId)
        fetchUrl = `${backendUrl}/usuarios/me`;
        isMyProfile = true;
      }

      // 4. Busca os dados do perfil
      const profileResponse = await axios.get(fetchUrl);
      profileUser = profileResponse.data; // Dados do perfil sendo exibido

      // 5. Atualiza a UI
      updateUIWithUserData(currentUser); // Header/Sidebar é sempre do *usuário logado*
      populateProfileData(profileUser); // Conteúdo principal é do *usuário do perfil*

      // 6. Conecta ao WebSocket (sempre como usuário logado)
      connectWebSocket(); // Conecta ao WebSocket

      // 7. Funções carregadas na inicialização (transportadas de principal.js)
      await fetchFriends();
      await fetchInitialOnlineFriends();
      atualizarStatusDeAmigosNaUI();
      fetchNotifications();
      fetchAndUpdateUnreadCount(); // NOVO

      // 8. Função específica da página de perfil
      fetchUserPosts(profileUser.id); // NOVO

      // 9. Configura botões de Ação
      configureProfileActions(isMyProfile, profileUser.id); // NOVO

      // 10. Listeners e Tema
      setupEventListeners();
      setInitialTheme();

    } catch (error) {
      console.error("ERRO CRÍTICO NA INICIALIZAÇÃO DO PERFIL:", error);
      if (error.response && error.response.status === 404) {
          document.querySelector('.main-content').innerHTML = '<h1 style="text-align: center; margin-top: 2rem;">Usuário não encontrado</h1>';
      } else if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
      }
    }
  }

  // --- NOVA FUNÇÃO ---
  function configureProfileActions(isMyProfile, profileUserId) {
    const editButtonPage = elements.editProfileBtnPage;
    const editButtonDropdown = elements.editProfileBtn;
    const deleteButtonDropdown = elements.deleteAccountBtn;

    if (isMyProfile) {
      // Mostra todos os botões de edição/exclusão
      if (editButtonPage) editButtonPage.style.display = "flex";
      if (editButtonDropdown) editButtonDropdown.style.display = "flex";
      if (deleteButtonDropdown) deleteButtonDropdown.style.display = "flex";
    } else {
      // Esconde os botões de edição/exclusão
      if (editButtonPage) editButtonPage.style.display = "none";
      if (editButtonDropdown) editButtonDropdown.style.display = "none";
      if (deleteButtonDropdown) deleteButtonDropdown.style.display = "none";

      // Lógica futura para Adicionar/Remover Amigo
      // (Você pode implementar isso depois, usando os dados de `userFriends`)
    }
  }

  // --- FUNÇÕES DE CONEXÃO E AMIGOS (Transportadas de principal.js) ---
  async function fetchUserConnections() {
    if (!elements.connectionsCount) return;
    try {
      // Este endpoint já existia em perfil.js, mantido
      const response = await axios.get(`${backendUrl}/api/amizades/`);
      elements.connectionsCount.textContent = response.data.length;
    } catch (error) {
      console.error("Erro ao buscar conexões:", error);
      elements.connectionsCount.textContent = "0";
    }
  }

  async function fetchFriends() {
    try {
      const response = await axios.get(`${backendUrl}/api/amizades/`);
      userFriends = response.data;
      window.userFriends = userFriends;
      if (elements.connectionsCount) {
        elements.connectionsCount.textContent = userFriends.length;
      }
    } catch (error) {
      console.error("Erro ao buscar lista de amigos:", error);
      userFriends = [];
    } finally {
      friendsLoaded = true;
    }
  }

  async function fetchInitialOnlineFriends() {
    try {
      const response = await axios.get(`${backendUrl}/api/amizades/online`);
      const amigosOnlineDTOs = response.data;
      latestOnlineEmails = amigosOnlineDTOs.map((amigo) => amigo.email);
    } catch (error) {
      console.error("Erro ao buscar status inicial de amigos online:", error);
      latestOnlineEmails = [];
    }
  }

  function atualizarStatusDeAmigosNaUI() {
    if (!elements.onlineFriendsList) return;
    if (!friendsLoaded) {
      elements.onlineFriendsList.innerHTML =
        '<p class="empty-state">Carregando...</p>';
      return;
    }
    const onlineFriends = userFriends.filter((friend) =>
      latestOnlineEmails.includes(friend.email)
    );
    elements.onlineFriendsList.innerHTML = "";
    if (onlineFriends.length === 0) {
      elements.onlineFriendsList.innerHTML =
        '<p class="empty-state">Nenhum amigo online.</p>';
    } else {
      onlineFriends.forEach((friend) => {
        const friendElement = document.createElement("div");
        friendElement.className = "friend-item";
        
        // CORREÇÃO: Pega o ID do usuário (amigo) do DTO
        const friendId = friend.idUsuario;
        // CORREÇÃO: O seu AmigoDTO usa 'fotoPerfil'
        // e o seu ArquivoController serve de '/api/arquivos/'
        const friendAvatar = friend.fotoPerfil ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` : defaultAvatarUrl;
        
        // CORREÇÃO: Adiciona a tag <a> em volta do avatar e nome
        friendElement.innerHTML = `
                <a href="perfil.html?id=${friendId}" class="friend-item-link">
                    <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}" onerror="this.src='${defaultAvatarUrl}';"></div>
                    <span class="friend-name">${friend.nome}</span>
                </a>
                <div class="status online"></div>
            `;
        elements.onlineFriendsList.appendChild(friendElement);
      });
    }
  }

  // --- FUNÇÕES DE NOTIFICAÇÃO (Transportadas e adaptadas de principal.js) ---

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
    elements.notificationsList.innerHTML = "";
    const unreadCount = notifications.filter((n) => !n.lida).length;

    if (elements.notificationsBadge) {
      elements.notificationsBadge.style.display = unreadCount > 0 ? "flex" : "none";
      elements.notificationsBadge.textContent = unreadCount;
    }

    if (notifications.length === 0) {
      elements.notificationsList.innerHTML =
        '<p class="empty-state">Nenhuma notificação.</p>';
      return;
    }

    notifications.forEach((notification) => {
      const item = createNotificationElement(notification);
      elements.notificationsList.appendChild(item);
    });
  }

  function createNotificationElement(notification) {
    const item = document.createElement("div");
    item.className = "notification-item";
    item.id = `notification-item-${notification.id}`;
    if (!notification.lida) item.classList.add("unread");

    const data = new Date(notification.dataCriacao).toLocaleString("pt-BR");
    let actionButtonsHtml = "";
    let iconClass = "fa-info-circle";
    let notificationLink = "#"; // Link padrão

    // IDs vindos do Backend
    const postId = notification.idReferencia;
    const commentId = notification.idReferenciaSecundaria;

    if (notification.tipo === "PEDIDO_AMIZADE") {
      iconClass = "fa-user-plus";
      notificationLink = "amizades.html"; // Link para amizades
      if (!notification.lida) {
        actionButtonsHtml = `
              <div class="notification-actions">
                 <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                 <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
              </div>`;
      }
    } else if (
      notification.tipo === "NOVO_COMENTARIO" ||
      notification.tipo === "CURTIDA_POST" ||
      notification.tipo === "CURTIDA_COMENTARIO"
    ) {
      if (notification.tipo.startsWith("CURTIDA")) {
        iconClass = "fa-heart";
      } else {
        iconClass = "fa-comment";
      }
      
      // Constrói o link para o post
      notificationLink = `principal.html?postId=${postId}`;

      // Se for sobre um comentário, adiciona o hash
      if (commentId) {
        notificationLink += `#comment-${commentId}`;
      }
    }

    item.innerHTML = `
        <a href="${notificationLink}" class="notification-link" onclick="window.markNotificationAsRead(event, ${notification.id})">
            <div class="notification-icon-wrapper"><i class="fas ${iconClass}"></i></div>
            <div class="notification-content">
                <p>${notification.mensagem}</p>
                <span class="timestamp">${data}</span>
            </div>
        </a>
        <div class="notification-actions-wrapper">${actionButtonsHtml}</div>
    `;

    const actionsWrapper = item.querySelector(".notification-actions-wrapper");
    if (actionsWrapper) {
      actionsWrapper.addEventListener("click", (e) => e.stopPropagation());
    }
    return item;
  }

  // Expor globalmente para o HTML
  window.markNotificationAsRead = async (event, notificationId) => {
    if (event) event.preventDefault();
    const item = document.getElementById(`notification-item-${notificationId}`);
    const targetHref = event.currentTarget.href;

    // Se já está lida, apenas navegue
    if (!item || !item.classList.contains("unread")) {
      if (targetHref && !targetHref.endsWith("#"))
        window.location.href = targetHref;
      return;
    }

    item.classList.remove("unread");
    try {
      await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
      fetchNotifications(); // Re-renderiza para atualizar a contagem
    } catch (error) {
      item.classList.add("unread"); // Reverte se falhar
    } finally {
      if (targetHref && !targetHref.endsWith("#"))
        window.location.href = targetHref;
    }
  };

  async function markAllNotificationsAsRead() {
    const unreadCount = parseInt(elements.notificationsBadge.textContent, 10);
    if (isNaN(unreadCount) || unreadCount === 0) return;
    try {
      await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
      if (elements.notificationsBadge) {
        elements.notificationsBadge.style.display = "none";
        elements.notificationsBadge.textContent = "0";
      }
      if (elements.notificationsList) {
        elements.notificationsList
          .querySelectorAll(".notification-item.unread")
          .forEach((item) => item.classList.remove("unread"));
      }
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }

  window.aceitarSolicitacao = async (amizadeId, notificationId) => {
    try {
      await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
      handleFriendRequestFeedback(notificationId, "Pedido aceito!", "success");
      fetchFriends(); // Atualiza a contagem de amigos
    } catch (error) {
      handleFriendRequestFeedback(notificationId, "Erro ao aceitar.", "error");
    }
  };

  window.recusarSolicitacao = async (amizadeId, notificationId) => {
    try {
      await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
      handleFriendRequestFeedback(notificationId, "Pedido recusado.", "info");
    } catch (error) {
      handleFriendRequestFeedback(notificationId, "Erro ao recusar.", "error");
    }
  };

  function handleFriendRequestFeedback(
    notificationId,
    message,
    type = "info"
  ) {
    const item = document.getElementById(`notification-item-${notificationId}`);
    if (item) {
      const actionsDiv = item.querySelector(".notification-actions-wrapper");
      if (actionsDiv)
        actionsDiv.innerHTML = `<p class="feedback-text ${
          type === "success" ? "success" : ""
        }">${message}</p>`;
      setTimeout(() => {
        item.classList.add("removing");
        setTimeout(() => {
          item.remove();
          if (
            elements.notificationsList &&
            elements.notificationsList.children.length === 0
          ) {
            elements.notificationsList.innerHTML =
              '<p class="empty-state">Nenhuma notificação.</p>';
          }
        }, 500);
      }, 2500);
    }
    fetchNotifications(); // Re-busca para garantir
  }

  async function fetchAndUpdateUnreadCount() {
    if (!elements.messageBadge && !elements.messageBadgeMenu) return;
    try {
      const response = await axios.get(
        `${backendUrl}/api/chat/privado/nao-lidas/contagem`
      );
      const count = response.data;
      updateMessageBadge(count);
    } catch (error) {
      console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    }
  }

  function updateMessageBadge(count) {
    if (elements.messageBadge) {
      elements.messageBadge.textContent = count;
      elements.messageBadge.style.display = count > 0 ? "flex" : "none";
    }
    if (elements.messageBadgeMenu) {
      elements.messageBadgeMenu.textContent = count;
      elements.messageBadgeMenu.style.display = count > 0 ? "flex" : "none";
    }
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    if (elements.notificationCenter)
      elements.notificationCenter.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }
  window.showNotification = showNotification; // Expor globalmente

  /**
   * NOVO: Verifica a URL por postId e commentId.
   * Rola até o post, abre os comentários e destaca o comentário.
   */
  async function checkAndHighlightComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get("postId");
    const hash = window.location.hash; // Pega o #comment-123

    // Só continua se tiver um postId na URL
    if (!postId) return;

    let commentId = null;
    if (hash && hash.startsWith("#comment-")) {
      commentId = hash.substring(1); // "comment-123"
    }

    // 1. Encontrar o Post
    let postElement = document.getElementById(`post-${postId}`);
    let attempts = 0;

    // Tenta encontrar o post por até 5 segundos (esperando o fetch das postagens)
    while (!postElement && attempts < 25) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      postElement = document.getElementById(`post-${postId}`);
      attempts++;
    }

    if (!postElement) {
      console.warn(`Post ${postId} não encontrado para destacar.`);
      return;
    }

    // 2. Rolar até o Post e Abrir os Comentários
    postElement.scrollIntoView({ behavior: "smooth", block: "center" });

    const commentsSection = postElement.querySelector(".comments-section");
    if (commentsSection && commentsSection.style.display === "none") {
      // Clica no botão de comentários (usando a função global)
      window.toggleComments(postId);
      // Espera a UI atualizar
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // 3. Se houver um commentId, encontrar e destacar o comentário
    if (commentId) {
      const commentElement = document.getElementById(commentId);
      if (commentElement) {
        // Rola até o comentário
        commentElement.scrollIntoView({ behavior: "smooth", block: "center" });

        // Adiciona a classe de "flash"
        commentElement.classList.add("highlight-flash");

        // Remove a classe após a animação
        setTimeout(() => {
          commentElement.classList.remove("highlight-flash");
        }, 2000); // 2 segundos
      } else {
        console.warn(
          `Comentário ${commentId} não encontrado no post ${postId}.`
        );
      }
    }
  }
  // --- WEBSOCKET (ATUALIZADO) ---
  function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };

    stompClient.connect(
      headers,
      () => {
        console.log("CONECTADO AO WEBSOCKET (Perfil)");
        window.stompClient = stompClient; // Expor globalmente

        // Inscrição em Notificações
        stompClient.subscribe(
          `/user/${currentUser.email}/queue/notifications`,
          (message) => {
            const newNotification = JSON.parse(message.body);
            showNotification(
              `Nova notificação: ${newNotification.mensagem}`,
              "info"
            );
            if (elements.notificationsList) {
              const emptyState =
                elements.notificationsList.querySelector(".empty-state");
              if (emptyState) emptyState.remove();
              const newItem = createNotificationElement(newNotification);
              elements.notificationsList.prepend(newItem);
            }
            if (elements.notificationsBadge) {
              const currentCount =
                parseInt(elements.notificationsBadge.textContent) || 0;
              const newCount = currentCount + 1;
              elements.notificationsBadge.textContent = newCount;
              elements.notificationsBadge.style.display = "flex";
            }
          }
        );

        // Inscrição em Status Online
        stompClient.subscribe("/topic/status", (message) => {
          latestOnlineEmails = JSON.parse(message.body);
          atualizarStatusDeAmigosNaUI();
        });

        // Inscrição em Contagem de Mensagens
        stompClient.subscribe(
          `/user/${currentUser.email}/queue/contagem`,
          (message) => {
            const count = JSON.parse(message.body);
            updateMessageBadge(count);
          }
        );

        // Inscrição em Posts Públicos (para atualização em tempo real)
        stompClient.subscribe("/topic/publico", (message) => {
          // Apenas atualiza o post se ele estiver na tela (se for do usuário)
          handlePublicFeedUpdate(JSON.parse(message.body));
        });
        
        // Dispara o evento personalizado DEPOIS que as inscrições estiverem prontas
        document.dispatchEvent(
          new CustomEvent("webSocketConnected", {
            detail: { stompClient: window.stompClient, currentUser },
          })
        );
      },
      (error) => {
        console.error("ERRO WEBSOCKET (Perfil):", error);
      }
    );
  }

  // --- LÓGICA DOS MODAIS E MENUS ---

  const closeAllMenus = () => {
    document
      .querySelectorAll(".options-menu, .dropdown-menu, .notifications-panel")
      .forEach((m) => (m.style.display = "none"));
  };

  function openEditProfileModal() {
    if (!profileUser || !elements.editProfileModal) return; // MUDANÇA: usa profileUser
    elements.editProfilePicPreview.src = profileUser.urlFotoPerfil
      ? `${backendUrl}${profileUser.urlFotoPerfil}` // CORREÇÃO DE URL
      : defaultAvatarUrl;
    elements.editProfileName.value = profileUser.nome;
    elements.editProfileBio.value = profileUser.bio || "";
    if (profileUser.dataNascimento) {
      elements.editProfileDob.value = profileUser.dataNascimento.split("T")[0];
    }
    elements.editProfileModal.style.display = "flex";
  }

  function openDeleteAccountModal() {
    if (elements.deleteConfirmPassword)
      elements.deleteConfirmPassword.value = "";
    if (elements.deleteAccountModal)
      elements.deleteAccountModal.style.display = "flex";
  }

  // --- LÓGICA DE POSTAGENS (NOVA - Transportada de principal.js) ---

  // 1. Função para buscar Apenas os posts do usuário
  async function fetchUserPosts(userId) {
    if (!elements.postsContainer) return;
    try {
      // CORREÇÃO: Buscamos TODOS os posts, já que o endpoint /postagem/usuario/{id} deu 404.
      const response = await axios.get(`${backendUrl}/api/chat/publico`);

      elements.postsContainer.innerHTML = "";

      // FILTRO: Filtramos os posts no frontend para mostrar apenas os do usuário atual
      const allPosts = response.data;
      const userPosts = allPosts.filter((post) => post.autorId === userId);

      // Verificamos se a lista FILTRADA está vazia
      if (userPosts.length === 0) {
        elements.postsContainer.innerHTML =
          "<p class='empty-state' style='text-align: center; padding: 2rem; color: var(--text-secondary);'>Este usuário ainda não fez nenhuma postagem.</p>";
        return;
      }

      // Ordenamos e exibimos apenas os posts FILTRADOS
      const sortedPosts = userPosts.sort(
        (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
      );
      sortedPosts.forEach((post) => showPost(post));
    } catch (error) {
      console.error("Erro ao buscar postagens do usuário:", error);
      elements.postsContainer.innerHTML =
        "<p class='empty-state' style='text-align: center; padding: 2rem; color: var(--text-secondary);'>Não foi possível carregar as postagens.</p>";
    }
  }

  // 2. Funções de renderização de Post/Comentário
  function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.id = `post-${post.id}`;
    const autorNome = post.nomeAutor || "Usuário Desconhecido";
    const autorIdDoPost = post.autorId;
    const fotoAutorPath = post.urlFotoAutor;

    // Correção no path do avatar
    const autorAvatar = post.urlFotoAutor
      ? post.urlFotoAutor.startsWith("http")
        ? post.urlFotoAutor
        : `${backendUrl}${post.urlFotoAutor}`
      : defaultAvatarUrl;

    // --- LÓGICA DE DATA (Estilo X.com) ---
    const dataPost = new Date(post.dataCriacao);
    const agora = new Date();
    const diffMs = agora - dataPost;
    const diffMin = Math.round(diffMs / 60000);
    const diffHoras = Math.round(diffMin / 60);
    const diffDias = Math.round(diffHoras / 24);

    let dataFormatadaSimples;
    if (diffMin < 1) {
      dataFormatadaSimples = "Agora";
    } else if (diffMin < 60) {
      dataFormatadaSimples = `${diffMin}m`;
    } else if (diffHoras < 24) {
      dataFormatadaSimples = `${diffHoras}h`;
    } else if (diffDias < 7) {
      dataFormatadaSimples = `${diffDias}d`;
    } else {
      // Formato "28 de out."
      dataFormatadaSimples = dataPost.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
      });
    }
    // --- FIM DA LÓGICA DE DATA ---

    const isAuthor = currentUser && autorIdDoPost === currentUser.id;

    let mediaHtml = "";
    if (post.urlsMidia && post.urlsMidia.length > 0) {
      mediaHtml = `<div class="post-media">${post.urlsMidia
        .map((url) => {
          const fullMediaUrl = url.startsWith("http")
            ? url
            : `${backendUrl}${url}`;
          if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i))
            return `<img src="${fullMediaUrl}" alt="Mídia da postagem">`;
          if (url.match(/\.(mp4|webm|ogg)$/i))
            return `<video controls src="${fullMediaUrl}"></video>`;
          return "";
        })
        .join("")}</div>`;
    }

    const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
    let commentsHtml = rootComments
      .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao))
      .map((comment) =>
        renderCommentWithReplies(comment, post.comentarios, post)
      )
      .join("");

    let optionsMenu = "";
    if (isAuthor) {
      optionsMenu = `
                <div class="post-options">
                    <button class="post-options-btn" onclick="event.stopPropagation(); window.openPostMenu(${post.id})"><i class="fas fa-ellipsis-h"></i></button>
                    <div class="options-menu" id="post-menu-${post.id}" onclick="event.stopPropagation();">
                        <button onclick="window.openEditPostModal(${post.id})"><i class="fas fa-pen"></i> Editar</button>
                        <button class="danger" onclick="window.deletePost(${post.id})"><i class="fas fa-trash"></i> Excluir</button>
                    </div>
                </div>`;
    }

    postElement.innerHTML = `
            <div class="post-header">
                <a href="perfil.html?id=${autorIdDoPost}" class="post-author-details-link">
                    <div class="post-author-details">
                        <div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}" onerror="this.src='${defaultAvatarUrl}';"></div>
                        <div class="post-author-info">
                            <strong>${autorNome}</strong>
                            <span class="timestamp">· ${dataFormatadaSimples}</span>
                        </div>
                    </div>
                </a>
                ${optionsMenu}
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            
            <div class="post-actions x-style">
                <button class="action-btn action-like ${
                  post.curtidoPeloUsuario ? "liked" : ""
                }" onclick="window.toggleLike(event, ${post.id}, null)">
                    <i class="${
                      post.curtidoPeloUsuario ? "fas fa-heart" : "far fa-heart"
                    }"></i> 
                    <span id="like-count-post-${post.id}">${
      post.totalCurtidas || 0
    }</span>
                </button>
                <button class="action-btn action-comment" onclick="window.toggleComments(${post.id})">
                    <i class="far fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-section-${
              post.id
            }" style="display: none;">
                <div class="comments-list">${commentsHtml}</div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${
                      post.id
                    }" placeholder="Adicione um comentário..."><button onclick="window.sendComment(${
      post.id
    }, null)"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>`;
    return postElement;
  }

  /**
   * CORRIGIDO (V3): Cria o HTML para um comentário.
   * Adiciona uma tag @username que linka para O PERFIL do usuário
   * se for uma resposta a outra resposta (Nível 2+).
   */
  function createCommentElement(comment, post, allComments) {
    //
    const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
    const commentAuthorAvatar = comment.urlFotoAutor
      ? comment.urlFotoAutor.startsWith("http")
        ? comment.urlFotoAutor
        : `${backendUrl}${comment.urlFotoAutor}`
      : defaultAvatarUrl;
    const autorIdDoComentario = comment.autor?.id || comment.autorId;
    const autorIdDoPost = post.autor?.id || post.autorId;
    const isAuthor = currentUser && autorIdDoComentario == currentUser.id;
    const isPostOwner = currentUser && autorIdDoPost == currentUser.id;
    let optionsMenu = "";

    if (isAuthor || isPostOwner) {
      optionsMenu = `
                    <button class="comment-options-btn" onclick="event.stopPropagation(); window.openCommentMenu(${comment.id})">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div class="options-menu" id="comment-menu-${comment.id}" onclick="event.stopPropagation();">
                        ${
                          isAuthor
                            ? `<button onclick="window.openEditCommentModal(${
                                comment.id
                              }, '${comment.conteudo.replace(
                                /'/g,
                                "\\'"
                              )}')"><i class="fas fa-pen"></i> Editar</button>`
                            : ""
                        }
                        ${
                          isAuthor || isPostOwner
                            ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>`
                            : ""
                        }
                        ${
                          isPostOwner
                            ? `<button onclick="window.highlightComment(${
                                comment.id
                              })"><i class="fas fa-star"></i> ${
                                comment.destacado
                                  ? "Remover Destaque"
                                  : "Destacar"
                              }</button>`
                            : ""
                        }
                    </div>`;
    }

    // --- ▼▼▼ LÓGICA DA TAG @USERNAME ATUALIZADA ▼▼▼ ---
    let tagHtml = "";
    // 1. Verificamos se é uma resposta (tem parentId) e se temos a lista de comentários
    if (comment.parentId && allComments) {
      // 2. Encontramos o comentário "pai"
      const parentComment = allComments.find(
        (c) => c.id === comment.parentId
      );

      // 3. Verificamos se o "pai" TAMBÉM é uma resposta (Nível 2+)
      //    Se parentComment.parentId existir, significa que não é uma resposta ao comentário principal.
      if (parentComment && parentComment.parentId) {
        // 4. Pegamos o ID DO AUTOR do comentário pai (do DTO do comentário pai)
        const parentAuthorId = parentComment.autorId;

        // 5. Criamos o link para o PERFIL desse autor
        tagHtml = `<a href="perfil.html?id=${parentAuthorId}" class="reply-tag">@${comment.replyingToName}</a>`;
      }
    }
    // --- ▲▲▲ FIM DA LÓGICA ATUALIZADA ▲▲▲ ---

    return `
                <div class="comment-container">
                    <div class="comment ${
                      comment.destacado ? "destacado" : ""
                    }" id="comment-${comment.id}">
                        <a href="perfil.html?id=${autorIdDoComentario}" class="comment-author-link">
                            <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                        </a>
                        <div class="comment-body">
                            <a href="perfil.html?id=${autorIdDoComentario}" class="comment-author-link">
                                <span class="comment-author">${commentAuthorName}</span>
                            </a>
                            <p class="comment-content">${tagHtml} ${
      comment.conteudo
    }</p>
                        </div>
                        ${optionsMenu}
                    </div>
                    <div class="comment-actions-footer">
                        <button class="action-btn-like ${
                          comment.curtidoPeloUsuario ? "liked" : ""
                        }" onclick="window.toggleLike(event, ${post.id}, ${
      comment.id
    })">Curtir</button>
                        <button class="action-btn-reply" onclick="window.toggleReplyForm(${
                          comment.id
                        })">Responder</button>
                        <span class="like-count" id="like-count-comment-${
                          comment.id
                        }"><i class="fas fa-heart"></i> ${
      comment.totalCurtidas || 0
    }</span>
                    </div>
                    <div class="reply-form" id="reply-form-${comment.id}">
                        <input type="text" id="reply-input-${
                          comment.id
                        }" placeholder="Escreva sua resposta..."><button onclick="window.sendComment(${
      post.id
    }, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>`;
  }

  /**
   * CORRIGIDO: Renderiza um comentário e suas respostas.
   * Agora usa o parâmetro 'isAlreadyInReplyThread' para garantir
   * que apenas o primeiro nível de respostas seja recuado.
   */
  function renderCommentWithReplies(
    comment,
    allComments,
    post,
    isAlreadyInReplyThread = false
  ) {
    // 1. Cria o HTML para o comentário atual
    let commentHtml = createCommentElement(comment, post, allComments); // Passa allComments

    // 2. Encontra todas as respostas diretas a este comentário
    const replies = allComments
      .filter((reply) => reply.parentId === comment.id)
      .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    // 3. Se houver respostas...
    if (replies.length > 0) {
      // 4. SÓ cria o contêiner de recuo se NÃO estivermos já em um.
      if (!isAlreadyInReplyThread) {
        commentHtml += `<div class="comment-replies">`;
      }

      // 5. Adiciona as respostas
      replies.forEach((reply) => {
        // Chama a si mesmo para as respostas, mas agora passa 'true',
        // dizendo: "você já está em um bloco de resposta, não crie outro".
        commentHtml += renderCommentWithReplies(
          reply,
          allComments,
          post,
          true
        );
      });

      // 6. SÓ fecha o contêiner de recuo se o abrimos neste nível.
      if (!isAlreadyInReplyThread) {
        commentHtml += `</div>`;
      }
    }

    return commentHtml;
  }

  // Renomeado de showPublicPost para showPost
  function showPost(post, prepend = false) {
    const postElement = createPostElement(post);
    if (prepend) {
      elements.postsContainer.prepend(postElement);
    } else {
      elements.postsContainer.appendChild(postElement);
    }
  }

  async function fetchAndReplacePost(postId) {
    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const oldPostElement = document.getElementById(`post-${postId}`);

      // Verifica se o post ainda é do usuário atual antes de recolocar
      if (response.data.autorId !== currentUser.id) {
        if (oldPostElement) oldPostElement.remove(); // Remove se não for mais do usuário
        return;
      }

      if (oldPostElement) {
        const wasCommentsVisible =
          oldPostElement.querySelector(".comments-section").style.display ===
          "block";
        const newPostElement = createPostElement(response.data);
        if (wasCommentsVisible)
          newPostElement.querySelector(".comments-section").style.display =
            "block";
        oldPostElement.replaceWith(newPostElement);
      } else {
        // Post não existia, mas agora é deste usuário (ex: editou e mudou algo?)
        // Adiciona ao feed
        showPost(response.data, true);
      }
    } catch (error) {
      // Post pode ter sido excluído
      const oldPostElement = document.getElementById(`post-${postId}`);
      if (oldPostElement) oldPostElement.remove();
      console.error(`Falha ao recarregar post ${postId}:`, error);
    }
  }

  function handlePublicFeedUpdate(payload) {
    // Ignora ações do próprio usuário
    if (payload.autorAcaoId && currentUser && payload.autorAcaoId == currentUser.id)
      return;

    const postId = payload.postagem?.id || payload.id || payload.postagemId;

    if (payload.tipo === "remocao" && payload.postagemId) {
      const postElement = document.getElementById(`post-${payload.postagemId}`);
      if (postElement) postElement.remove();
    } else if (postId) {
      // Se for uma atualização (comentário, curtida, edição),
      // busca o post e verifica se ele pertence a este perfil
      fetchAndReplacePost(postId);
    }
  }

  // 3. Funções de Ação (Janelas)
  window.openPostMenu = (postId) => {
    closeAllMenus();
    document.getElementById(`post-menu-${postId}`).style.display = "block";
  };
  window.openCommentMenu = (commentId) => {
    closeAllMenus();
    document.getElementById(`comment-menu-${commentId}`).style.display = "block";
  };
  window.toggleComments = (postId) => {
    const cs = document.getElementById(`comments-section-${postId}`);
    cs.style.display = cs.style.display === "block" ? "none" : "block";
  };
  window.toggleReplyForm = (commentId) => {
    const form = document.getElementById(`reply-form-${commentId}`);
    form.style.display = form.style.display === "flex" ? "none" : "flex";
  };
  window.sendComment = (postId, parentId = null) => {
    const inputId = parentId
      ? `reply-input-${parentId}`
      : `comment-input-${postId}`;
    const input = document.getElementById(inputId);
    const content = input.value.trim();
    if (stompClient?.connected && content) {
      stompClient.send(
        `/app/postagem/${postId}/comentar`,
        {},
        JSON.stringify({ conteudo: content, parentId: parentId })
      );
      input.value = "";
      if (parentId)
        document.getElementById(`reply-form-${parentId}`).style.display = "none";
    }
  };
  window.toggleLike = async (event, postagemId, comentarioId = null) => {
    const btn = event.currentTarget;
    const isPost = comentarioId === null;
    const countId = isPost
      ? `like-count-post-${postagemId}`
      : `like-count-comment-${comentarioId}`;
    const countSpan = document.getElementById(countId);
    let count = parseInt(
      countSpan.innerText.trim().replace(/<[^>]*>/g, ""),
      10
    );
    if (isNaN(count)) count = 0;

    btn.classList.toggle("liked");
    const isLiked = btn.classList.contains("liked");
    const newCount = isLiked ? count + 1 : count - 1;

    // --- ATUALIZAÇÃO DA UI (Novo) ---
    if (isPost) {
      const icon = btn.querySelector("i");
      if (icon) {
        // Verifica se o ícone existe
        if (isLiked) {
          icon.classList.remove("far"); // Remove contorno
          icon.classList.add("fas"); // Adiciona sólido
        } else {
          icon.classList.remove("fas"); // Remove sólido
          icon.classList.add("far"); // Adiciona contorno
        }
      }
      countSpan.textContent = newCount; // Atualiza contagem do post
    } else {
      // Lógica antiga para curtida de comentário (que não tem ícone)
      countSpan.innerHTML = `<i class="fas fa-heart"></i> ${newCount}`;
    }

    // --- CHAMADA API ---
    try {
      await axios.post(`${backendUrl}/curtidas/toggle`, {
        postagemId,
        comentarioId,
      });
    } catch (error) {
      // --- REVERTE UI EM CASO DE ERRO ---
      showNotification("Erro ao processar curtida.", "error");
      btn.classList.toggle("liked"); // Reverte o "liked"

      if (isPost) {
        const icon = btn.querySelector("i");
        if (icon) {
          if (!isLiked) {
            // Reverte para "não curtido"
            icon.classList.remove("fas");
            icon.classList.add("far");
          } else {
            // Reverte para "curtido"
            icon.classList.remove("far");
            icon.classList.add("fas");
          }
        }
        countSpan.textContent = count; // Reverte contagem do post
      } else {
        countSpan.innerHTML = `<i class="fas fa-heart"></i> ${count}`; // Reverte contagem do comentário
      }
    }
  };
  window.deletePost = async (postId) => {
    if (confirm("Tem certeza que deseja excluir esta postagem?")) {
      try {
        await axios.delete(`${backendUrl}/postagem/${postId}`);
        showNotification("Postagem excluída.", "success");
        // A atualização via WS deve remover o post
      } catch (error) {
        showNotification("Erro ao excluir postagem.", "error");
      }
    }
  };
  window.deleteComment = async (commentId) => {
    if (confirm("Tem certeza que deseja excluir este comentário?")) {
      try {
        await axios.delete(`${backendUrl}/comentarios/${commentId}`);
        showNotification("Comentário excluído.", "success");
        // A atualização via WS deve recarregar o post
      } catch (error) {
        showNotification("Erro ao excluir comentário.", "error");
      }
    }
  };
  window.highlightComment = async (commentId) => {
    try {
      await axios.put(`${backendUrl}/comentarios/${commentId}/destacar`);
      // A atualização via WS deve recarregar o post
    } catch (error) {
      showNotification("Erro ao destacar.", "error");
    }
  };

  // 4. Funções de Modal (Edição)
  window.openEditPostModal = async (postId) => {
    if (
      !elements.editPostModal ||
      !elements.editExistingMediaContainer
    )
      return;
    selectedFilesForEdit = [];
    urlsParaRemover = [];
    updateEditFilePreview();
    elements.editExistingMediaContainer.innerHTML = "";

    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const post = response.data;
      elements.editPostIdInput.value = post.id;
      elements.editPostTextarea.value = post.conteudo;

      (post.urlsMidia || []).forEach((url) => {
        const item = document.createElement("div");
        item.className = "existing-media-item";

        const preview = document.createElement("img");
        preview.src = `${url}`; // URL já é completa vinda do Cloudinary
        preview.onerror = () =>
          (preview.src = "https://via.placeholder.com/80?text=Error");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "remove-existing-media-checkbox";
        checkbox.onchange = (e) => {
          if (e.target.checked) {
            urlsParaRemover.push(url);
            item.style.opacity = "0.5";
          } else {
            urlsParaRemover = urlsParaRemover.filter((u) => u !== url);
            item.style.opacity = "1";
          }
        };
        item.appendChild(preview);
        item.appendChild(checkbox);
        elements.editExistingMediaContainer.appendChild(item);
      });
      elements.editPostModal.style.display = "flex";
    } catch (error) {
      showNotification("Erro ao carregar postagem para edição.", "error");
    }
  };

  window.openEditCommentModal = (commentId, content) => {
    elements.editCommentIdInput.value = commentId;
    elements.editCommentTextarea.value = content;
    elements.editCommentModal.style.display = "flex";
  };

  function closeAndResetEditCommentModal() {
    elements.editCommentModal.style.display = "none";
    elements.editCommentIdInput.value = "";
    elements.editCommentTextarea.value = "";
  }

  function updateEditFilePreview() {
    if (!elements.editFilePreviewContainer) return;
    elements.editFilePreviewContainer.innerHTML = "";
    selectedFilesForEdit.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-preview-item";
      const previewElement = document.createElement("img");
      previewElement.src = URL.createObjectURL(file);
      item.appendChild(previewElement);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-file-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        selectedFilesForEdit.splice(index, 1);
        updateEditFilePreview();
      };
      item.appendChild(removeBtn);
      elements.editFilePreviewContainer.appendChild(item);
    });
  }

  // --- SETUP DOS EVENT LISTENERS (ATUALIZADO) ---
  function setupEventListeners() {
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", toggleTheme);
    }

    document.body.addEventListener("click", (e) => {
      // Fechar painel de notificação se clicar fora
      if (
        elements.notificationsPanel &&
        !elements.notificationsPanel.contains(e.target) &&
        !elements.notificationsIcon.contains(e.target)
      ) {
        elements.notificationsPanel.style.display = "none";
      }
      // Fechar outros menus
      if (
        !e.target.closest(
          ".post-options, .user-dropdown, .notifications-panel"
        )
      ) {
        closeAllMenus();
      }
    });

    // Listener do Ícone de Notificações (NOVO)
    if (elements.notificationsIcon) {
      elements.notificationsIcon.addEventListener("click", (event) => {
        event.stopPropagation();
        const panel = elements.notificationsPanel;
        const isVisible = panel.style.display === "block";
        closeAllMenus(); // Fecha outros menus
        panel.style.display = isVisible ? "none" : "block";
        if (!isVisible) {
          markAllNotificationsAsRead(); // Marca como lido ao abrir
        }
      });
    }

    // Listener para abrir o dropdown do usuário
    if (elements.userDropdownTrigger) {
      elements.userDropdownTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = elements.userDropdownTrigger.nextElementSibling;
        if (menu && menu.classList.contains("dropdown-menu")) {
          const isVisible = menu.style.display === "block";
          closeAllMenus();
          if (!isVisible) {
            menu.style.display = "block";
          }
        }
      });
    }

    // Listener para os botões do dropdown e da página
    if (elements.logoutBtn)
      elements.logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
      });
    if (elements.editProfileBtn)
      elements.editProfileBtn.addEventListener("click", openEditProfileModal);
    if (elements.editProfileBtnPage)
      elements.editProfileBtnPage.addEventListener(
        "click",
        openEditProfileModal
      ); // Botão da página
    if (elements.deleteAccountBtn)
      elements.deleteAccountBtn.addEventListener(
        "click",
        openDeleteAccountModal
      );

    // Listeners do Modal de Edição de Perfil (Existentes)
    if (elements.cancelEditProfileBtn)
      elements.cancelEditProfileBtn.addEventListener(
        "click",
        () => (elements.editProfileModal.style.display = "none")
      );
    if (elements.editProfilePicInput)
      elements.editProfilePicInput.addEventListener("change", () => {
        const file = elements.editProfilePicInput.files[0];
        if (file && elements.editProfilePicPreview) {
          elements.editProfilePicPreview.src = URL.createObjectURL(file);
        }
      });

    if (elements.editProfileForm)
      elements.editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        let userUpdated = false;
        // 1. Atualiza a foto
        if (elements.editProfilePicInput.files[0]) {
          const formData = new FormData();
          formData.append("foto", elements.editProfilePicInput.files[0]);
          try {
            // MUDANÇA: usa profileUser
            const response = await axios.put(
              `${backendUrl}/usuarios/me/foto`,
              formData
            ); 
            profileUser = response.data;
            userUpdated = true;
            showNotification("Foto de perfil atualizada!", "success");
            // Se o perfil for o do usuário logado, atualiza o currentUser também
            if (currentUser.id === profileUser.id) {
                currentUser = response.data;
            }
          } catch (error) {
            showNotification("Erro ao atualizar a foto.", "error");
          }
        }
        // 2. Atualiza os dados de texto
        const updateData = {
          nome: elements.editProfileName.value,
          bio: elements.editProfileBio.value,
          dataNascimento: elements.editProfileDob.value
            ? new Date(elements.editProfileDob.value).toISOString()
            : null,
        };

        try {
          const response = await axios.put(
            `${backendUrl}/usuarios/me`,
            updateData
          ); // A API só permite editar /me
          profileUser = response.data;
          // Se o perfil for o do usuário logado, atualiza o currentUser também
          if (currentUser.id === profileUser.id) {
            currentUser = response.data;
          }
          userUpdated = true;
        } catch (error) {
          showNotification("Erro ao atualizar o perfil.", "error");
        }
        // 3. Atualiza UI
        if (userUpdated) {
          updateUIWithUserData(currentUser); // Atualiza sidebar/topbar com currentUser
          populateProfileData(profileUser); // Atualiza o perfil com profileUser
          showNotification("Perfil atualizado com sucesso!", "success");
          elements.editProfileModal.style.display = "none";
        }
      });

    // Listeners do Modal de Exclusão de Conta (Existentes)
    if (elements.cancelDeleteAccountBtn)
      elements.cancelDeleteAccountBtn.addEventListener(
        "click",
        () => (elements.deleteAccountModal.style.display = "none")
      );
    if (elements.deleteAccountForm)
      elements.deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = elements.deleteConfirmPassword.value;
        if (!password) {
          showNotification("Por favor, digite sua senha para confirmar.", "error");
          return;
        }
        try {
          // Passo 1: Verifica a senha tentando fazer login
          await axios.post(`${backendUrl}/autenticacao/login`, {
            email: currentUser.email,
            senha: password,
          });

          // Passo 2: Se o login deu certo, a senha está correta
          if (
            confirm("Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita.")
          ) {
            await axios.delete(`${backendUrl}/usuarios/me`);
            alert("Sua conta foi excluída com sucesso.");
            localStorage.clear();
            window.location.href = "login.html";
          }
        } catch (error) {
          showNotification("Senha incorreta. A conta não foi excluída.", "error");
          console.error("Erro na confirmação de senha:", error);
        }
      });

    // --- Listeners de Modais de Postagem (NOVOS) ---
    if (elements.editPostFileInput)
      elements.editPostFileInput.addEventListener("change", (event) => {
        Array.from(event.target.files).forEach((file) =>
          selectedFilesForEdit.push(file)
        );
        updateEditFilePreview();
      });

    if (elements.editPostForm)
      elements.editPostForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]'); // Seleciona o botão de submit do formulário
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        try {
          const postId = elements.editPostIdInput.value;
          const postagemDTO = {
            conteudo: elements.editPostTextarea.value,
            urlsParaRemover: urlsParaRemover, // Envia a lista de URLs a remover
          };
          const formData = new FormData();
          formData.append(
            "postagem",
            new Blob([JSON.stringify(postagemDTO)], {
              type: "application/json",
            })
          );

          selectedFilesForEdit.forEach((file) =>
            formData.append("arquivos", file)
          );

          await axios.put(`${backendUrl}/postagem/${postId}`, formData);

          elements.editPostModal.style.display = "none";
          showNotification("Postagem editada com sucesso.", "success");
          // A atualização via WS cuidará de recarregar o post
        } catch (error) {
          showNotification("Não foi possível salvar a edição.", "error");
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        }
      });

    if (elements.cancelEditPostBtn)
      elements.cancelEditPostBtn.addEventListener(
        "click",
        () => (elements.editPostModal.style.display = "none")
      );

    if (elements.editCommentForm)
      elements.editCommentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const commentId = elements.editCommentIdInput.value;
        const content = elements.editCommentTextarea.value;
        try {
          await axios.put(
            `${backendUrl}/comentarios/${commentId}`,
            { conteudo: content },
            { headers: { "Content-Type": "application/json" } }
          );
          showNotification("Comentário editado.", "success");
          closeAndResetEditCommentModal();
          // A atualização via WS cuidará de recarregar o post
        } catch (error) {
          showNotification("Não foi possível salvar o comentário.", "error");
        }
      });

    if (elements.cancelEditCommentBtn)
      elements.cancelEditCommentBtn.addEventListener(
        "click",
        closeAndResetEditCommentModal
      );
  }

  // Ponto de entrada da aplicação
  init();
});