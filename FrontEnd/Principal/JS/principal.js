// =================================================================
// BLOCO DE CONTROLE DE TEMA (Executa primeiro em todas as páginas)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
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
  setInitialTheme();
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }
});



// =================================================================
// LÓGICA GLOBAL (Executa em TODAS as páginas)
// =================================================================
const backendUrl = "http://localhost:8080";
const jwtToken = localStorage.getItem("token");
const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
const messageBadgeElement = document.getElementById("message-badge");

// Variáveis globais para que outros scripts (como mensagem.js) possam acessá-las
let stompClient = null;
let currentUser = null;
let userFriends = [];
let friendsLoaded = false;
let latestOnlineEmails = [];

// Variáveis globais para o carrossel
let currentMediaIndex = 0;
let currentMediaItems = [];

// Torna as variáveis e funções essenciais acessíveis globalmente
window.stompClient = stompClient;
window.currentUser = currentUser;
window.jwtToken = jwtToken;
window.backendUrl = backendUrl;
window.getAvatarUrl = function(fotoPerfil) {
    if (!fotoPerfil) {
        return window.defaultAvatarUrl || 'https://via.placeholder.com/150'; 
    }
    if (fotoPerfil.startsWith('http')) {
        return fotoPerfil;
    }
    return `${window.backendUrl}/api/arquivos/${fotoPerfil}`;
}
window.defaultAvatarUrl = defaultAvatarUrl;
window.showNotification = showNotification;
window.axios = axios; // Assume que Axios está carregado globalmente

// --- SELEÇÃO DE ELEMENTOS GLOBAIS ---
// (Presentes em principal.html e mensagem.html)
const globalElements = {
  userDropdownTrigger: document.querySelector(".user-dropdown .user"),
  logoutBtn: document.getElementById("logout-btn"),
  notificationCenter: document.querySelector(".notification-center"),
  notificationsIcon: document.getElementById("notifications-icon"),
  notificationsPanel: document.getElementById("notifications-panel"),
  notificationsList: document.getElementById("notifications-list"),
  notificationsBadge: document.getElementById("notifications-badge"),
  onlineFriendsList: document.getElementById("online-friends-list"),
  connectionsCount: document.getElementById("connections-count"),
  topbarUserName: document.getElementById("topbar-user-name"),
  sidebarUserName: document.getElementById("sidebar-user-name"),
  sidebarUserTitle: document.getElementById("sidebar-user-title"),
  topbarUserImg: document.getElementById("topbar-user-img"),
  sidebarUserImg: document.getElementById("sidebar-user-img"),

  // Modais de Perfil
  editProfileBtn: document.getElementById("edit-profile-btn"),
  deleteAccountBtn: document.getElementById("delete-account-btn"),
  editProfileModal: document.getElementById("edit-profile-modal"),
  // Adicionando os elementos do modal de perfil que faltavam (baseado no principal.js original)
  editProfileForm: document.getElementById("edit-profile-form"),
  cancelEditProfileBtn: document.getElementById("cancel-edit-profile-btn"),
  editProfilePicInput: document.getElementById("edit-profile-pic-input"),
  editProfilePicPreview: document.getElementById("edit-profile-pic-preview"),
  editProfileName: document.getElementById("edit-profile-name"),
  editProfileBio: document.getElementById("edit-profile-bio"),
  editProfileDob: document.getElementById("edit-profile-dob"),
  editProfilePassword: document.getElementById("edit-profile-password"),
  editProfilePasswordConfirm: document.getElementById(
    "edit-profile-password-confirm"
  ),
  deleteAccountModal: document.getElementById("delete-account-modal"),
  deleteAccountForm: document.getElementById("delete-account-form"),
  cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
  deleteConfirmPassword: document.getElementById("delete-confirm-password"),
};

/**
 * Função de inicialização global. Carrega usuário, conecta WS, busca amigos e notificações.
 */
async function initGlobal() {
  if (!jwtToken) {
    window.location.href = "login.html";
    return;
  }
  axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

  try {
    // 1. Carrega o usuário
    const response = await axios.get(`${backendUrl}/usuarios/me`);
    currentUser = response.data;
    window.currentUser = currentUser; // Atualiza a global

    // 2. Atualiza a UI (sidebar/topbar)
    updateUIWithUserData(currentUser);

    // 3. Buscar contagem de projetos do usuário
    await fetchUserProjectsCount();

    // 4. Conecta ao WebSocket
    connectWebSocket(); // Define window.stompClient

    // 5. Busca dados da sidebar (Amigos/Notificações)
    await fetchFriends();
    await fetchInitialOnlineFriends();
    atualizarStatusDeAmigosNaUI();
    fetchNotifications();

    setupGlobalEventListeners();
  } catch (error) {
    console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
}

// --- FUNÇÕES GLOBAIS (Auth, UI, WebSocket, Notificações) ---

// NOVA FUNÇÃO: Buscar contagem de projetos do usuário
async function fetchUserProjectsCount() {
  try {
    const response = await axios.get(`${backendUrl}/projetos`);
    const allProjects = response.data;
    
    // Filtra os projetos em que o usuário atual é membro
    const myProjects = allProjects.filter(proj => 
      proj.membros && proj.membros.some(membro => membro.usuarioId === currentUser.id)
    );
    
    if (globalElements.projectsCount) {
      globalElements.projectsCount.textContent = myProjects.length;
    }
  } catch (error) {
    console.error("Erro ao buscar projetos do usuário:", error);
    if (globalElements.projectsCount) {
      globalElements.projectsCount.textContent = "0";
    }
  }
}

function updateUIWithUserData(user) {
  if (!user) return;
  const userImage =
    user.urlFotoPerfil && user.urlFotoPerfil.startsWith("http")
      ? user.urlFotoPerfil
      : `${window.backendUrl}${
          user.urlFotoPerfil || "/images/default-avatar.jpg"
        }`;

  const topbarUser = document.querySelector(".user-dropdown .user");
  if (topbarUser) {
    topbarUser.innerHTML = `
            <div class="profile-pic"><img src="${userImage}" alt="Perfil"></div>
            <span>${user.nome}</span>
            <i class="fas fa-chevron-down"></i>
        `;
  }

  // Atualiza a Sidebar (se existir na página)
  if (globalElements.sidebarUserName)
    globalElements.sidebarUserName.textContent = user.nome;
  if (globalElements.sidebarUserTitle)
    globalElements.sidebarUserTitle.textContent =
      user.tipoUsuario || "Membro da Comunidade";
  if (globalElements.sidebarUserImg)
    globalElements.sidebarUserImg.src = userImage;

  // Atualiza a imagem do criador de post (se existir na página)
  const postCreatorImg = document.getElementById("post-creator-img");
  if (postCreatorImg) postCreatorImg.src = userImage;
}

function connectWebSocket() {
  const socket = new SockJS(`${backendUrl}/ws`);
  stompClient = Stomp.over(socket);
  stompClient.debug = null;
  const headers = { Authorization: `Bearer ${jwtToken}` };

  stompClient.connect(
    headers,
    (frame) => {
      window.stompClient = stompClient;

      // INSCRIÇÃO GLOBAL: Notificações
      stompClient.subscribe(`/user/queue/notifications`, (message) => {
        console.log("NOTIFICAÇÃO RECEBIDA!", message.body);
        const newNotification = JSON.parse(message.body);
        showNotification(
          `Nova notificação: ${newNotification.mensagem}`,
          "info"
        );
        if (globalElements.notificationsList) {
          const emptyState =
            globalElements.notificationsList.querySelector(".empty-state");
          if (emptyState) emptyState.remove();
          const newItem = createNotificationElement(newNotification); //
          globalElements.notificationsList.prepend(newItem);
        }
        if (globalElements.notificationsBadge) {
          const currentCount =
            parseInt(globalElements.notificationsBadge.textContent) || 0;
          const newCount = currentCount + 1;
          globalElements.notificationsBadge.textContent = newCount;
          globalElements.notificationsBadge.style.display = "flex";
        }
      });

      stompClient.subscribe('/user/queue/errors', (message) => {
            const errorMessage = message.body; 
            window.showNotification(errorMessage, 'error');
        });

      // INSCRIÇÃO GLOBAL: Status Online
      stompClient.subscribe("/topic/status", (message) => {
        latestOnlineEmails = JSON.parse(message.body); //
        atualizarStatusDeAmigosNaUI();
        document.dispatchEvent(new CustomEvent("onlineStatusUpdated"));
      });

      document.dispatchEvent(
        new CustomEvent("globalScriptsLoaded", {
          detail: { stompClient: window.stompClient, currentUser },
        })
      );

      // Dispara evento para que scripts de página (feed, chat) façam suas inscrições
      document.dispatchEvent(
        new CustomEvent("webSocketConnected", {
          detail: { stompClient },
        })
      );

      stompClient.subscribe(`/user/queue/amizades`, (message) => {
        fetchFriends().then(() => {
          atualizarStatusDeAmigosNaUI();
          document.dispatchEvent(new CustomEvent("friendsListUpdated"));
        });
      });

      // INSCRIÇÃO GLOBAL: Contagem de Mensagens
      stompClient.subscribe(`/user/queue/contagem`, (message) => {
        const count = JSON.parse(message.body);
        updateMessageBadge(count);
      });
      fetchAndUpdateUnreadCount();
    },
    (error) => console.error("ERRO WEBSOCKET:", error)
  );
}

async function fetchAndUpdateUnreadCount() {
  if (!messageBadgeElement) return; // Só executa se o badge existir na página
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
  if (messageBadgeElement) {
    messageBadgeElement.textContent = count;
    messageBadgeElement.style.display = count > 0 ? "flex" : "none";
  }
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  if (globalElements.notificationCenter)
    globalElements.notificationCenter.appendChild(notification);
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

// --- Funções Globais: Amigos e Notificações ---

async function fetchFriends() {
  try {
    const response = await axios.get(`${backendUrl}/api/amizades/`); //
    userFriends = response.data;
    window.userFriends = userFriends; // Torna global
    if (globalElements.connectionsCount) {
      globalElements.connectionsCount.textContent = userFriends.length; //
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
    const response = await axios.get(`${backendUrl}/api/amizades/online`); //
    const amigosOnlineDTOs = response.data;
    latestOnlineEmails = amigosOnlineDTOs.map((amigo) => amigo.email); //
    document.dispatchEvent(new CustomEvent("onlineStatusUpdated"));
  } catch (error) {
    console.error("Erro ao buscar status inicial de amigos online:", error);
    latestOnlineEmails = [];
  }
}

function atualizarStatusDeAmigosNaUI() {
    if (!globalElements.onlineFriendsList) return;
    if (!friendsLoaded) {
        globalElements.onlineFriendsList.innerHTML = '<p class="empty-state">Carregando...</p>';
        return;
    }
    const onlineFriends = userFriends.filter(friend => latestOnlineEmails.includes(friend.email)); //
    globalElements.onlineFriendsList.innerHTML = '';
    if (onlineFriends.length === 0) {
        globalElements.onlineFriendsList.innerHTML = '<p class="empty-state">Nenhum amigo online.</p>';
    } else {
        onlineFriends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            
            const friendAvatar = friend.fotoPerfil 
                ? (friend.fotoPerfil.startsWith('http') 
                    ? friend.fotoPerfil 
                    : `${backendUrl}/api/arquivos/${friend.fotoPerfil}`) 
                : defaultAvatarUrl;
            
            const friendId = friend.idUsuario; 

            friendElement.innerHTML = `
                <a href="perfil.html?id=${friendId}" class="friend-item-link">
                    <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}" onerror="this.src='${defaultAvatarUrl}';"></div>
                    <span class="friend-name">${friend.nome}</span>
                </a>
                <div class="status online"></div>
            `;
            globalElements.onlineFriendsList.appendChild(friendElement);
        });
    }
}

async function fetchNotifications() {
  try {
    const response = await axios.get(`${backendUrl}/api/notificacoes`);
    renderNotifications(response.data); //
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
  }
}

function renderNotifications(notifications) {
  if (!globalElements.notificationsList) return;
  globalElements.notificationsList.innerHTML = "";
  const unreadCount = notifications.filter((n) => !n.lida).length; //
  if (globalElements.notificationsBadge) {
    globalElements.notificationsBadge.style.display =
      unreadCount > 0 ? "flex" : "none"; //
    globalElements.notificationsBadge.textContent = unreadCount;
  }
  if (notifications.length === 0) {
    globalElements.notificationsList.innerHTML =
      '<p class="empty-state">Nenhuma notificação.</p>';
    return;
  }
  notifications.forEach((notification) => {
    const item = createNotificationElement(notification); //
    globalElements.notificationsList.appendChild(item);
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
        let notificationLink = '#'; // Link padrão

        // IDs vindos do Backend
        const postId = notification.idReferencia;
        const commentId = notification.idReferenciaSecundaria; 

        if (notification.tipo === 'PEDIDO_AMIZADE') {
            iconClass = 'fa-user-plus';
            notificationLink = 'amizades.html'; // Link para amizades
            if (!notification.lida) {
                 actionButtonsHtml = `
                  <div class="notification-actions">
                     <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                     <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
                  </div>`;
            }
        } else if (notification.tipo === 'NOVO_COMENTARIO' || notification.tipo === 'CURTIDA_POST' || notification.tipo === 'CURTIDA_COMENTARIO') {
            
            if (notification.tipo.startsWith('CURTIDA')) {
                iconClass = 'fa-heart';
            } else {
                iconClass = 'fa-comment';
            }

            // Constrói o link para o post
            // (Assumindo que a página de perfil também pode mostrar o post)
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
    
        const actionsWrapper = item.querySelector('.notification-actions-wrapper');
        if (actionsWrapper) {
            actionsWrapper.addEventListener('click', e => e.stopPropagation());
        }
        return item;
    }
    async function checkAndHighlightComment() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('postId');
        const hash = window.location.hash; // Pega o #comment-123

        // Só continua se tiver um postId na URL
        if (!postId) return; 

        let commentId = null;
        if (hash && hash.startsWith('#comment-')) {
            commentId = hash.substring(1); // "comment-123"
        }

        // 1. Encontrar o Post
        let postElement = document.getElementById(`post-${postId}`);
        let attempts = 0;

        // Tenta encontrar o post por até 5 segundos (esperando o fetch das postagens)
        while (!postElement && attempts < 25) {
            await new Promise(resolve => setTimeout(resolve, 200));
            postElement = document.getElementById(`post-${postId}`);
            attempts++;
        }

        if (!postElement) {
            console.warn(`Post ${postId} não encontrado para destacar.`);
            return;
        }

        // 2. Rolar até o Post e Abrir os Comentários
        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const commentsSection = postElement.querySelector('.comments-section');
        if (commentsSection && commentsSection.style.display === 'none') {
            // Clica no botão de comentários (usando a função global)
            window.toggleComments(postId);
            // Espera a UI atualizar
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 3. Se houver um commentId, encontrar e destacar o comentário
        if (commentId) {
            const commentElement = document.getElementById(commentId);
            if (commentElement) {
                // Rola até o comentário
                commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Adiciona a classe de "flash"
                commentElement.classList.add('highlight-flash');
                
                // Remove a classe após a animação
                setTimeout(() => {
                    commentElement.classList.remove('highlight-flash');
                }, 2000); // 2 segundos
            } else {
                console.warn(`Comentário ${commentId} não encontrado no post ${postId}.`);
            }
        }
    }
    // Função para mostrar/ocultar respostas aninhadas
window.toggleReplies = (buttonElement, commentId) => {
    const repliesContainer = document.getElementById(`replies-for-${commentId}`);
    if (!repliesContainer) return;

    if (repliesContainer.style.display === 'none') {
        // Mostrar respostas
        repliesContainer.style.display = 'flex'; // Usamos 'flex' pois .comment-replies é flex
        buttonElement.innerHTML = `<i class="fas fa-minus-circle"></i> Ocultar respostas`;
    } else {
        // Ocultar respostas
        repliesContainer.style.display = 'none';
        // Re-calcula o número de respostas para o texto do botão
        const replyCount = repliesContainer.children.length;
        const plural = replyCount > 1 ? 'respostas' : 'resposta';
        buttonElement.innerHTML = `<i class="fas fa-comment-dots"></i> Ver ${replyCount} ${plural}`;
    }
};

async function markAllNotificationsAsRead() {
  //
  const unreadCount = parseInt(
    globalElements.notificationsBadge.textContent,
    10
  );
  if (isNaN(unreadCount) || unreadCount === 0) return;
  try {
    await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
    if (globalElements.notificationsBadge) {
      globalElements.notificationsBadge.style.display = "none";
      globalElements.notificationsBadge.textContent = "0";
    }
    if (globalElements.notificationsList) {
      globalElements.notificationsList
        .querySelectorAll(".notification-item.unread")
        .forEach((item) => item.classList.remove("unread"));
    }
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
  }
}

window.aceitarSolicitacao = async (amizadeId, notificationId) => {
  //
  try {
    await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`); //
    handleFriendRequestFeedback(notificationId, "Pedido aceito!", "success");
    fetchFriends();
  } catch (error) {
    handleFriendRequestFeedback(notificationId, "Erro ao aceitar.", "error");
  }
};

window.recusarSolicitacao = async (amizadeId, notificationId) => {
  //
  try {
    await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`); //
    handleFriendRequestFeedback(notificationId, "Pedido recusado.", "info");
  } catch (error) {
    handleFriendRequestFeedback(notificationId, "Erro ao recusar.", "error");
  }
};

function handleFriendRequestFeedback(notificationId, message, type = "info") {
  //
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
          globalElements.notificationsList &&
          globalElements.notificationsList.children.length === 0
        ) {
          globalElements.notificationsList.innerHTML =
            '<p class="empty-state">Nenhuma notificação.</p>';
        }
      }, 500);
    }, 2500);
  }
  fetchNotifications();
}

const closeAllMenus = () => {
  document
    .querySelectorAll(".options-menu, .dropdown-menu")
    .forEach((m) => (m.style.display = "none"));
};

function openEditProfileModal() {
  //
  const elements = globalElements; // usa os elementos globais
  if (!currentUser || !elements.editProfileModal) return;
  elements.editProfilePicPreview.src =
    currentUser.urlFotoPerfil && currentUser.urlFotoPerfil.startsWith("http")
      ? currentUser.urlFotoPerfil
      : `${window.backendUrl}${
          currentUser.urlFotoPerfil || "/images/default-avatar.jpg"
        }`;
  elements.editProfileName.value = currentUser.nome;
  elements.editProfileBio.value = currentUser.bio || "";
  if (currentUser.dataNascimento) {
    elements.editProfileDob.value = currentUser.dataNascimento.split("T")[0];
  }
  elements.editProfilePassword.value = "";
  elements.editProfilePasswordConfirm.value = "";
  elements.editProfileModal.style.display = "flex";
}

function openDeleteAccountModal() {
  //
  const elements = globalElements; // usa os elementos globais
  if (elements.deleteConfirmPassword) elements.deleteConfirmPassword.value = "";
  if (elements.deleteAccountModal)
    elements.deleteAccountModal.style.display = "flex";
}

// --- SETUP DE EVENT LISTENERS GLOBAIS ---
function setupGlobalEventListeners() {
  document.body.addEventListener("click", (e) => {
    if (
      globalElements.notificationsPanel &&
      !globalElements.notificationsPanel.contains(e.target) &&
      !globalElements.notificationsIcon.contains(e.target)
    ) {
      globalElements.notificationsPanel.style.display = "none";
    }
    closeAllMenus();
  });

  if (globalElements.notificationsIcon) {
    globalElements.notificationsIcon.addEventListener("click", (event) => {
      event.stopPropagation();
      const panel = globalElements.notificationsPanel;
      const isVisible = panel.style.display === "block";
      panel.style.display = isVisible ? "none" : "block";
      if (!isVisible) markAllNotificationsAsRead(); //
    });
  }

  if (globalElements.userDropdownTrigger) {
    globalElements.userDropdownTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      const menu = globalElements.userDropdownTrigger.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        const isVisible = menu.style.display === "block";
        closeAllMenus();
        if (!isVisible) menu.style.display = "block";
      }
    });
  }

  if (globalElements.logoutBtn) {
    globalElements.logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });
  }

  // --- Listeners de Modais de Perfil ---
  //
  if (globalElements.editProfileBtn)
    globalElements.editProfileBtn.addEventListener(
      "click",
      openEditProfileModal
    );
  if (globalElements.deleteAccountBtn)
    globalElements.deleteAccountBtn.addEventListener(
      "click",
      openDeleteAccountModal
    );
  if (globalElements.cancelEditProfileBtn)
    globalElements.cancelEditProfileBtn.addEventListener(
      "click",
      () => (globalElements.editProfileModal.style.display = "none")
    );
  if (globalElements.editProfilePicInput)
    globalElements.editProfilePicInput.addEventListener("change", () => {
      const file = globalElements.editProfilePicInput.files[0];
      if (file)
        globalElements.editProfilePicPreview.src = URL.createObjectURL(file);
    });
  if (globalElements.editProfileForm)
    globalElements.editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Lógica de update de foto
      if (globalElements.editProfilePicInput.files[0]) {
        const formData = new FormData();
        formData.append("foto", globalElements.editProfilePicInput.files[0]);
        try {
          const response = await axios.put(
            `${backendUrl}/usuarios/me/foto`,
            formData
          );
          currentUser = response.data;
          updateUIWithUserData(currentUser);
          showNotification("Foto de perfil atualizada!", "success");
        } catch (error) {
          let errorMessage = "Erro ao atualizar a foto.";
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            }
            showNotification(errorMessage, "error");
        }
      }
      // Lógica de update de dados
      const password = globalElements.editProfilePassword.value;
      if (
        password &&
        password !== globalElements.editProfilePasswordConfirm.value
      ) {
        showNotification("As novas senhas não coincidem.", "error");
        return;
      }
      const updateData = {
        nome: globalElements.editProfileName.value,
        bio: globalElements.editProfileBio.value,
        dataNascimento: globalElements.editProfileDob.value
          ? new Date(globalElements.editProfileDob.value).toISOString()
          : null,
        senha: password || null,
      };
      try {
        const response = await axios.put(
          `${backendUrl}/usuarios/me`,
          updateData
        );
        currentUser = response.data;
        updateUIWithUserData(currentUser);
        showNotification("Perfil atualizado com sucesso!", "success");
        globalElements.editProfileModal.style.display = "none";
      } catch (error) {
        showNotification("Erro ao atualizar o perfil.", "error");
      }
    });

  // Deletar conta
  if (globalElements.cancelDeleteAccountBtn)
    globalElements.cancelDeleteAccountBtn.addEventListener(
      "click",
      () => (globalElements.deleteAccountModal.style.display = "none")
    );
  if (globalElements.deleteAccountForm)
    globalElements.deleteAccountForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = globalElements.deleteConfirmPassword.value;
      if (!password) {
        showNotification(
          "Por favor, digite sua senha para confirmar.",
          "error"
        );
        return;
      }
      try {
        await axios.post(`${backendUrl}/autenticacao/login`, {
          email: currentUser.email,
          senha: password,
        });
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
      }
    });
}

// =================================================================
// INICIALIZAÇÃO GLOBAL
// =================================================================
// Inicia a lógica global em TODAS as páginas
document.addEventListener("DOMContentLoaded", initGlobal);

// =================================================================
// LÓGICA ESPECIALIZADA (Só executa se estiver na página principal)
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Verifica se estamos na página principal para carregar o feed
  const postsContainer = document.querySelector(".posts-container");
  if (!postsContainer) {
    return; // Sai se não for a página de feed (ex: está em mensagem.html)
  }

  // --- SELEÇÃO DE ELEMENTOS (Específicos do Feed) ---
  //
  const feedElements = {
    postsContainer: postsContainer,
    postTextarea: document.getElementById("post-creator-textarea"),
    postFileInput: document.getElementById("post-file-input"),
    filePreviewContainer: document.getElementById("file-preview-container"),
    publishBtn: document.getElementById("publish-post-btn"),
    editPostModal: document.getElementById("edit-post-modal"),
    editPostForm: document.getElementById("edit-post-form"),
    editPostIdInput: document.getElementById("edit-post-id"),
    editPostTextarea: document.getElementById("edit-post-textarea"),
    cancelEditPostBtn: document.getElementById("cancel-edit-post-btn"),
    editPostFileInput: document.getElementById("edit-post-files"),
    editFilePreviewContainer: document.getElementById(
      "edit-file-preview-container"
    ),
    editCommentModal: document.getElementById("edit-comment-modal"),
    editCommentForm: document.getElementById("edit-comment-form"),
    editCommentIdInput: document.getElementById("edit-comment-id"),
    editCommentTextarea: document.getElementById("edit-comment-textarea"),
    cancelEditCommentBtn: document.getElementById("cancel-edit-comment-btn"),
  };

  let selectedFilesForPost = [];
  let selectedFilesForEdit = [];
  let urlsParaRemover = [];
  const searchInput = document.getElementById("search-input");

  // --- FUNÇÕES DE CARROSSEL ---

  // Função para abrir o visualizador de mídias
  window.openMediaViewer = (mediaUrls, startIndex = 0) => {
      const modal = document.getElementById('media-viewer-modal');
      const container = document.getElementById('carousel-container');
      const indicators = document.getElementById('carousel-indicators');
      
      if (!modal || !container) return;
      
      currentMediaItems = mediaUrls;
      currentMediaIndex = startIndex;
      
      // Limpar conteúdo anterior
      container.innerHTML = '';
      indicators.innerHTML = '';
      
      // Adicionar mídias ao carrossel
      mediaUrls.forEach((url, index) => {
          const slide = document.createElement('div');
          slide.className = `carousel-slide ${index === startIndex ? 'active' : ''}`;
          
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          
          if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
              slide.innerHTML = `<video controls autoplay src="${fullMediaUrl}" style="max-width: 100%; max-height: 100%;"></video>`;
          } else {
              slide.innerHTML = `<img src="${fullMediaUrl}" alt="Mídia da postagem" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
          }
          
          container.appendChild(slide);
          
          // Adicionar indicador
          const indicator = document.createElement('span');
          indicator.className = `carousel-indicator ${index === startIndex ? 'active' : ''}`;
          indicator.onclick = () => goToMedia(index);
          indicators.appendChild(indicator);
      });
      
      modal.style.display = 'flex';
      updateCarouselControls();
  };

  // Função para navegar para uma mídia específica
  function goToMedia(index) {
      const slides = document.querySelectorAll('.carousel-slide');
      const indicators = document.querySelectorAll('.carousel-indicator');
      
      if (index < 0 || index >= slides.length) return;
      
      // Remover classe active de todos
      slides.forEach(slide => slide.classList.remove('active'));
      indicators.forEach(indicator => indicator.classList.remove('active'));
      
      // Adicionar classe active ao slide e indicador atual
      slides[index].classList.add('active');
      indicators[index].classList.add('active');
      
      currentMediaIndex = index;
      updateCarouselControls();
  }

  // Função para ir para a próxima mídia
  function nextMedia() {
      goToMedia(currentMediaIndex + 1);
  }

  // Função para ir para a mídia anterior
  function prevMedia() {
      goToMedia(currentMediaIndex - 1);
  }

  // Função para atualizar controles do carrossel
  function updateCarouselControls() {
      const prevBtn = document.getElementById('carousel-prev');
      const nextBtn = document.getElementById('carousel-next');
      
      if (prevBtn) prevBtn.disabled = currentMediaIndex === 0;
      if (nextBtn) nextBtn.disabled = currentMediaIndex === currentMediaItems.length - 1;
  }

  // Fechar visualizador de mídias
  function closeMediaViewer() {
      const modal = document.getElementById('media-viewer-modal');
      if (modal) modal.style.display = 'none';
      
      // Parar vídeos
      document.querySelectorAll('.carousel-slide video').forEach(video => {
          video.pause();
          video.currentTime = 0;
      });
      
      currentMediaItems = [];
      currentMediaIndex = 0;
  }

  // Função para renderizar mídias em grid
  function renderMediaGrid(mediaUrls) {
      if (!mediaUrls || mediaUrls.length === 0) return '';
      
      const count = mediaUrls.length;
      let gridClass = 'single';
      let displayItems = mediaUrls;
      
      if (count === 2) {
          gridClass = 'double';
      } else if (count === 3) {
          gridClass = 'triple';
      } else if (count >= 4) {
          gridClass = 'multiple';
          displayItems = mediaUrls.slice(0, 4);
      }
      
      let mediaHtml = `<div class="post-media-grid ${gridClass}">`;
      
      displayItems.forEach((url, index) => {
          const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
          const isMoreItem = count > 4 && index === 3;
          const moreClass = isMoreItem ? ' more' : '';
          
          mediaHtml += `
              <div class="post-media-item${moreClass}" 
                   onclick="window.openMediaViewer(${JSON.stringify(mediaUrls)}, ${index})">
          `;
          
          if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
              mediaHtml += `<video src="${fullMediaUrl}" style="width: 100%; height: 100%; object-fit: cover;"></video>`;
          } else {
              mediaHtml += `<img src="${fullMediaUrl}" alt="Mídia da postagem" style="width: 100%; height: 100%; object-fit: cover;">`;
          }
          
          if (isMoreItem) {
              mediaHtml += `<div class="more-overlay">+${count - 4}</div>`;
          }
          
          mediaHtml += `</div>`;
      });
      
      mediaHtml += `</div>`;
      return mediaHtml;
  }

  // =================================================================
// NOVAS FUNÇÕES DO CARROSSEL DO FEED
// =================================================================

// Função para rolar o carrossel do feed
window.scrollFeedCarousel = (postId, direction) => {
    const track = document.getElementById(`feed-track-${postId}`);
    if (track) {
        // Rola a largura do container (um slide completo)
        const scrollAmount = track.clientWidth; 
        track.scrollBy({
            left: scrollAmount * direction,
            behavior: 'smooth'
        });
    }
};

// Função que gera o HTML do carrossel para o Feed
function renderFeedCarousel(mediaUrls, postId) {
    let slidesHtml = '';

    mediaUrls.forEach((url, index) => {
        const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
        // Escapa as aspas
        const safeMediaArray = JSON.stringify(mediaUrls).replace(/"/g, '&quot;');
        
        let contentHtml = '';
        if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
            contentHtml = `<video src="${fullMediaUrl}" preload="metadata"></video>`;
        } else {
            contentHtml = `<img src="${fullMediaUrl}" alt="Mídia do post" loading="lazy">`;
        }

        slidesHtml += `
            <div class="feed-carousel-slide" onclick="window.openMediaViewer(${safeMediaArray}, ${index})">
                ${contentHtml}
            </div>
        `;
    });

    // Adicionei IDs específicos para o contador e atributos de dados
    return `
        <div class="feed-carousel-wrapper">
            <button class="feed-carousel-btn prev" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, -1)">
                <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="feed-carousel-track" id="feed-track-${postId}">
                ${slidesHtml}
            </div>
            
            <button class="feed-carousel-btn next" onclick="event.stopPropagation(); window.scrollFeedCarousel(${postId}, 1)">
                <i class="fas fa-chevron-right"></i>
            </button>
            
            <div class="feed-carousel-counter" id="feed-counter-${postId}">1 / ${mediaUrls.length}</div>
        </div>
    `;
}

// Nova função para ativar o listener de scroll do carrossel
function setupCarouselEventListeners(postElement, postId) {
    const track = postElement.querySelector(`#feed-track-${postId}`);
    const counter = postElement.querySelector(`#feed-counter-${postId}`);

    if (track && counter) {
        // Usamos um pequeno debounce para performance, ou chamamos direto no scroll
        track.addEventListener('scroll', () => {
            const trackWidth = track.clientWidth;
            if (trackWidth === 0) return;
            
            // Calcula o índice atual baseado na rolagem horizontal
            const index = Math.round(track.scrollLeft / trackWidth) + 1;
            
            // Pega o total de slides contando os filhos
            const total = track.children.length;
            
            // Atualiza o texto
            counter.textContent = `${index} / ${total}`;
        });
    }
}

  // --- FUNÇÕES (Específicas do Feed) ---

  // NOVA FUNÇÃO: Mostrar estado de carregamento do feed
  function showFeedLoading() {
    feedElements.postsContainer.innerHTML = `
      <div class="post-skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
      <div class="post-skeleton">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line long"></div>
        </div>
      </div>
    `;
  }

  async function fetchPublicPosts() {
    //
    // Mostra estado de carregamento
    showFeedLoading();
    
    try {
      const response = await axios.get(`${backendUrl}/api/chat/publico`);
      feedElements.postsContainer.innerHTML = "";
      const sortedPosts = response.data.sort(
        (a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao)
      );
      sortedPosts.forEach((post) => showPublicPost(post));
    } catch (error) {
      console.error("Erro ao buscar postagens:", error);
      feedElements.postsContainer.innerHTML =
        "<p>Não foi possível carregar o feed.</p>";
    }
  }

 function createPostElement(post) {
    const postElement = document.createElement("div");
    postElement.className = "post";
    postElement.id = `post-${post.id}`;
    
    const autorNome = post.nomeAutor || "Usuário Desconhecido";
    const autorIdDoPost = post.autorId;
    const fotoAutorPath = post.urlFotoAutor;
    const autorAvatar = fotoAutorPath && fotoAutorPath.startsWith("http")
        ? fotoAutorPath
        : `${window.backendUrl}${fotoAutorPath || "/images/default-avatar.jpg"}`;
        
    const dataFormatada = new Date(post.dataCriacao).toLocaleString("pt-BR");
    const isAuthor = currentUser && autorIdDoPost === currentUser.id;
    
    let mediaHtml = "";

    // --- LÓGICA MODIFICADA DE MÍDIA ---
    if (post.urlsMidia && post.urlsMidia.length > 0) {
        if (post.urlsMidia.length > 2) {
            // SE MAIS DE 2 MÍDIAS: Usa o Carrossel Horizontal
            mediaHtml = renderFeedCarousel(post.urlsMidia, post.id);
        } else if (post.urlsMidia.length === 1) {
            // Apenas uma mídia (comportamento original)
            const url = post.urlsMidia[0];
            const fullMediaUrl = url.startsWith("http") ? url : `${window.backendUrl}${url}`;
            const safeMediaArray = JSON.stringify(post.urlsMidia).replace(/"/g, '&quot;');

            if (url.match(/\.(mp4|webm|mov|avi|mkv|flv|wmv|3gp|ogv|m3u8|ts|asf)$/i)) {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)">
                                <video controls src="${fullMediaUrl}" style="max-width: 100%; border-radius: 8px;"></video>
                             </div>`;
            } else {
                mediaHtml = `<div class="post-media" onclick="window.openMediaViewer(${safeMediaArray}, 0)">
                                <img src="${fullMediaUrl}" alt="Mídia da postagem" style="max-width: 100%; border-radius: 8px; cursor: pointer;">
                             </div>`;
            }
        } else {
            // Exatamente 2 mídias: Mantém o Grid (renderMediaGrid existente no seu código)
            mediaHtml = renderMediaGrid(post.urlsMidia);
        }
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
                        <div class="post-author-info"><strong>${autorNome}</strong><span>${dataFormatada}</span></div>
                    </div>
                </a>
                ${optionsMenu}
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${
                  post.curtidoPeloUsuario ? "liked" : ""
                }" onclick="window.toggleLike(event, ${
      post.id
    }, null)"><i class="fas fa-heart"></i> <span id="like-count-post-${
      post.id
    }">${post.totalCurtidas || 0}</span></button>
                <button class="action-btn" onclick="window.toggleComments(${
                  post.id
                })"><i class="fas fa-comment"></i> <span>${
      post.comentarios?.length || 0
    }</span></button>
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

    if (post.urlsMidia && post.urlsMidia.length > 2) {
        setupCarouselEventListeners(postElement, post.id);
    }
    return postElement;
  }

  function createCommentElement(comment, post, allComments) {
        //
        const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
        const commentAuthorAvatar = comment.urlFotoAutor ? (comment.urlFotoAutor.startsWith("http") ? comment.urlFotoAutor : `${backendUrl}${comment.urlFotoAutor}`) : defaultAvatarUrl;
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
                        ${isAuthor ? `<button onclick="window.openEditCommentModal(${comment.id}, '${comment.conteudo.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i> Editar</button>` : ""}
                        ${isAuthor || isPostOwner ? `<button class="danger" onclick="window.deleteComment(${comment.id})"><i class="fas fa-trash"></i> Excluir</button>` : ""}
                        ${isPostOwner ? `<button onclick="window.highlightComment(${comment.id})"><i class="fas fa-star"></i> ${comment.destacado ? "Remover Destaque" : "Destacar"}</button>` : ""}
                    </div>`;
        }

        // --- ▼▼▼ LÓGICA DA TAG @USERNAME ATUALIZADA ▼▼▼ ---
        let tagHtml = '';
        // 1. Verificamos se é uma resposta (tem parentId) e se temos a lista de comentários
        if (comment.parentId && allComments) {
            // 2. Encontramos o comentário "pai"
            const parentComment = allComments.find(c => c.id === comment.parentId);

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
                    <div class="comment ${comment.destacado ? "destacado" : ""}" id="comment-${comment.id}">
                        <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                        <div class="comment-body">
                            <span class="comment-author">${commentAuthorName}</span>
                            <p class="comment-content">${tagHtml} ${comment.conteudo}</p>
                        </div>
                        ${optionsMenu}
                    </div>
                    <div class="comment-actions-footer">
                        <button class="action-btn-like ${comment.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, ${comment.id})">Curtir</button>
                        <button class="action-btn-reply" onclick="window.toggleReplyForm(${comment.id})">Responder</button>
                        <span class="like-count" id="like-count-comment-${comment.id}"><i class="fas fa-heart"></i> ${comment.totalCurtidas || 0}</span>
                    </div>
                    <div class="reply-form" id="reply-form-${comment.id}">
                        <input type="text" id="reply-input-${comment.id}" placeholder="Escreva sua resposta..."><button onclick="window.sendComment(${post.id}, ${comment.id})"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>`;
    }

// SUBSTITUA a função 'renderCommentWithReplies' inteira por esta:
function renderCommentWithReplies(comment, allComments, post, isAlreadyInReplyThread = false) {
    // 1. Cria o HTML para o comentário atual
    let commentHtml = createCommentElement(comment, post, allComments); 

    // 2. Encontra todas as respostas diretas a este comentário
    const replies = allComments
        .filter((reply) => reply.parentId === comment.id)
        .sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));

    // 3. Se este comentário tem respostas E é um comentário "principal" (não uma resposta de nível 2+)
    if (replies.length > 0 && !isAlreadyInReplyThread) {
        
        // A. Adicionar o botão "Ver Respostas"
        const plural = replies.length > 1 ? 'respostas' : 'resposta';
        commentHtml += `
            <div class="view-replies-container">
                <button class="btn-view-replies" onclick="window.toggleReplies(this, ${comment.id})">
                    <i class="fas fa-comment-dots"></i>
                    Ver ${replies.length} ${plural}
                </button>
            </div>
        `;

        // B. Ocultar o contêiner de respostas por padrão
        //    O 'display: flex' será adicionado pelo JS ao clicar
        commentHtml += `<div class="comment-replies" id="replies-for-${comment.id}" style="display: none;">`;
        
        // C. Renderizar as respostas (lógica existente que achata a árvore)
        replies.forEach((reply) => {
            // Passa 'true' para que as sub-respostas sejam aninhadas
            commentHtml += renderCommentWithReplies(reply, allComments, post, true); 
        });
        
        commentHtml += `</div>`; // Fecha o container
    
    } else if (replies.length > 0 && isAlreadyInReplyThread) {
        // 4. Se for uma resposta (Nível 2+) que TAMBÉM tem respostas (Nível 3+),
        //    apenas continue a recursão. A lógica original já achatava isso.
        replies.forEach((reply) => {
            commentHtml += renderCommentWithReplies(reply, allComments, post, true);
        });
    }

    // 5. Se não houver respostas (replies.length === 0), só retorna o commentHtml
    return commentHtml;
}

  function showPublicPost(post, prepend = false) {
    //
    const postElement = createPostElement(post);
    prepend
      ? feedElements.postsContainer.prepend(postElement)
      : feedElements.postsContainer.appendChild(postElement);
  }

 /* SUBSTITUA a função 'fetchAndReplacePost' inteira por esta 
   em CADA arquivo JS que a possua (principal.js, perfil.js)
*/
async function fetchAndReplacePost(postId) {
    const oldPostElement = document.getElementById(`post-${postId}`);
    
    // --- 1. Salvar Estado da UI (Antes do Fetch) ---
    let wasCommentsVisible = false;
    const openReplyContainerIds = new Set(); // Guarda IDs dos containers de resposta abertos

    if (oldPostElement) {
        // Salva se os comentários principais (nível 0) estavam abertos
        const oldCommentsSection = oldPostElement.querySelector(".comments-section");
        if (oldCommentsSection) {
            wasCommentsVisible = oldCommentsSection.style.display === 'block';
        }
        
        // Salva o ID de todos os containers de RESPOSTA (nível 1+) que estavam abertos
        const oldReplyContainers = oldPostElement.querySelectorAll('.comment-replies');
        oldReplyContainers.forEach(container => {
            // Usamos 'flex' porque foi o que definimos no toggleReplies
            if (container.style.display === 'flex') { 
                openReplyContainerIds.add(container.id);
            }
        });
    }

    try {
        // --- 2. Buscar Novos Dados ---
        const response = await axios.get(`${backendUrl}/postagem/${postId}`);
        const newPostElement = createPostElement(response.data); // Cria o novo HTML

        // --- 3. Restaurar Estado da UI (no Novo Elemento) ---
        
        // Restaura o container principal de comentários
        if (wasCommentsVisible) {
            const newCommentsSection = newPostElement.querySelector(".comments-section");
            if (newCommentsSection) newCommentsSection.style.display = 'block';
        }
        
        // Restaura todos os containers de resposta que estavam abertos
        if (openReplyContainerIds.size > 0) {
            openReplyContainerIds.forEach(containerId => {
                const newReplyContainer = newPostElement.querySelector(`#${containerId}`);
                if (newReplyContainer) {
                    // Encontra o botão que controla este container
                    const commentId = containerId.replace('replies-for-', '');
                    const button = newPostElement.querySelector(`button[onclick*="window.toggleReplies(this, ${commentId})"]`);
                    
                    // Aplica o estado "aberto"
                    newReplyContainer.style.display = 'flex';
                    if (button) {
                        button.innerHTML = `<i class="fas fa-minus-circle"></i> Ocultar respostas`;
                    }
                }
            });
        }
        
        // --- 4. Substituir o Elemento na DOM ---
        if (oldPostElement) {
            oldPostElement.replaceWith(newPostElement);
        } else {
            // Lógica de fallback caso o post antigo não exista
            // Garante que o nome da função é o correto para o script
            if (typeof showPublicPost === 'function') {
                showPublicPost(response.data, true); // Para principal.js
            } else if (typeof showPost === 'function') {
                showPost(response.data, true); // Para perfil.js
            }
        }

    } catch (error) {
        console.error(`Falha ao recarregar post ${postId}:`, error);
        // Se o post foi excluído (ex: 404), remove o elemento antigo
        if (error.response && error.response.status === 404) {
             if (oldPostElement) oldPostElement.remove();
        }
    }
}

  function handlePublicFeedUpdate(payload) {
    // NÃO vamos mais ignorar. Precisamos da atualização para atualizar os contadores.
    /*
    if (payload.autorAcaoId && currentUser && payload.autorAcaoId == currentUser.id)
      return; 
    */
    const postId = payload.postagem?.id || payload.id || payload.postagemId;
    if (payload.tipo === "remocao" && payload.postagemId) {
      const postElement = document.getElementById(`post-${payload.postagemId}`);
      if (postElement) postElement.remove();
    } else if (postId) {
      fetchAndReplacePost(postId);
    }
  }

  // Funções de Ação (Janelas)
  window.openPostMenu = (postId) => {
    closeAllMenus();
    document.getElementById(`post-menu-${postId}`).style.display = "block";
  };
  window.openCommentMenu = (commentId) => {
    closeAllMenus();
    document.getElementById(`comment-menu-${commentId}`).style.display =
      "block";
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
        document.getElementById(`reply-form-${parentId}`).style.display =
          "none";
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

    if (isPost) countSpan.textContent = newCount;
    else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${newCount}`;

    try {
      await axios.post(`${backendUrl}/curtidas/toggle`, {
        postagemId,
        comentarioId,
      });
    } catch (error) {
      showNotification("Erro ao processar curtida.", "error");
      btn.classList.toggle("liked");
      if (isPost) countSpan.textContent = count;
      else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
    }
  };
  window.deletePost = async (postId) => {
    if (confirm("Tem certeza?")) {
      try {
        await axios.delete(`${backendUrl}/postagem/${postId}`);
        showNotification("Postagem excluída.", "success");
      } catch (error) {
        showNotification("Erro ao excluir postagem.", "error");
      }
    }
  };
  window.deleteComment = async (commentId) => {
    if (confirm("Tem certeza?")) {
      try {
        await axios.delete(`${backendUrl}/comentarios/${commentId}`);
        showNotification("Comentário excluído.", "success");
      } catch (error) {
        showNotification("Erro ao excluir comentário.", "error");
      }
    }
  };
  window.highlightComment = async (commentId) => {
    try {
      await axios.put(`${backendUrl}/comentarios/${commentId}/destacar`);
    } catch (error) {
      showNotification("Erro ao destacar.", "error");
    }
  };

  // Funções de Modal (Edição)
  window.openEditPostModal = async (postId) => {
    //
    const existingMediaContainer = document.getElementById(
      "edit-existing-media-container"
    );
    if (!feedElements.editPostModal || !existingMediaContainer) return;
    selectedFilesForEdit = [];
    urlsParaRemover = [];
    updateEditFilePreview();
    existingMediaContainer.innerHTML = "";
    try {
      const response = await axios.get(`${backendUrl}/postagem/${postId}`);
      const post = response.data;
      feedElements.editPostIdInput.value = post.id;
      feedElements.editPostTextarea.value = post.conteudo;
      post.urlsMidia.forEach((url) => {
        const item = document.createElement("div");
        item.className = "existing-media-item";
        const preview = document.createElement("img");
        preview.src = url;
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
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
        existingMediaContainer.appendChild(item);
      });
      feedElements.editPostModal.style.display = "flex";
    } catch (error) {
      showNotification("Erro ao carregar postagem.", "error");
    }
  };
  window.openEditCommentModal = (commentId, content) => {
    //
    feedElements.editCommentIdInput.value = commentId;
    feedElements.editCommentTextarea.value = content;
    feedElements.editCommentModal.style.display = "flex";
  };
  function closeAndResetEditCommentModal() {
    //
    feedElements.editCommentModal.style.display = "none";
    feedElements.editCommentIdInput.value = "";
    feedElements.editCommentTextarea.value = "";
  }
  function updateFilePreview() {
    //
    feedElements.filePreviewContainer.innerHTML = "";
    selectedFilesForPost.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "file-preview-item";
      let previewElement = file.type.startsWith("image/")
        ? document.createElement("img")
        : document.createElement("video");
      previewElement.src = URL.createObjectURL(file);
      item.appendChild(previewElement);
      const removeBtn = document.createElement("button");
      removeBtn.className = "remove-file-btn";
      removeBtn.innerHTML = "&times;";
      removeBtn.onclick = () => {
        selectedFilesForPost.splice(index, 1);
        feedElements.postFileInput.value = "";
        updateFilePreview();
      };
      item.appendChild(removeBtn);
      feedElements.filePreviewContainer.appendChild(item);
    });
  }
  function updateEditFilePreview() {
    //
    feedElements.editFilePreviewContainer.innerHTML = "";
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
      feedElements.editFilePreviewContainer.appendChild(item);
    });
  }
  function filterPosts() {
    //
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll(".post").forEach((post) => {
      const author = post
        .querySelector(".post-author-info strong")
        .textContent.toLowerCase();
      const content = post
        .querySelector(".post-content p")
        .textContent.toLowerCase();
      post.style.display =
        author.includes(searchTerm) || content.includes(searchTerm)
          ? "block"
          : "none";
    });
  }

  // --- SETUP DE EVENT LISTENERS (Específicos do Feed) ---
  function setupFeedEventListeners() {
    if (searchInput) searchInput.addEventListener("input", filterPosts);

    // Event listeners para o carrossel de mídias
    const mediaViewerModal = document.getElementById('media-viewer-modal');
    const mediaViewerClose = document.getElementById('media-viewer-close');
    const carouselPrev = document.getElementById('carousel-prev');
    const carouselNext = document.getElementById('carousel-next');
    
    if (mediaViewerClose) {
        mediaViewerClose.addEventListener('click', closeMediaViewer);
    }
    
    if (carouselPrev) {
        carouselPrev.addEventListener('click', prevMedia);
    }
    
    if (carouselNext) {
        carouselNext.addEventListener('click', nextMedia);
    }
    
    // Fechar modal ao clicar fora do conteúdo
    if (mediaViewerModal) {
        mediaViewerModal.addEventListener('click', (e) => {
            if (e.target === mediaViewerModal) {
                closeMediaViewer();
            }
        });
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
        const mediaViewer = document.getElementById('media-viewer-modal');
        if (mediaViewer && mediaViewer.style.display === 'flex') {
            if (e.key === 'Escape') {
                closeMediaViewer();
            } else if (e.key === 'ArrowLeft') {
                prevMedia();
            } else if (e.key === 'ArrowRight') {
                nextMedia();
            }
        }
    });

    //
    if (feedElements.editPostFileInput)
      feedElements.editPostFileInput.addEventListener("change", (event) => {
        Array.from(event.target.files).forEach((file) =>
          selectedFilesForEdit.push(file)
        );
        updateEditFilePreview();
      });
    if (feedElements.editPostForm)
      feedElements.editPostForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = e.submitter;
        btn.disabled = true;
        btn.textContent = "Salvando...";
        try {
          const postId = feedElements.editPostIdInput.value;
          const postagemDTO = {
            conteudo: feedElements.editPostTextarea.value,
            urlsParaRemover: urlsParaRemover,
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
          feedElements.editPostModal.style.display = "none";
          showNotification("Postagem editada.", "success");
        } catch (error) {
         let errorMessage = "Erro ao editar.";
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                showNotification(errorMessage, "error");
        } finally {
          btn.disabled = false;
          btn.textContent = "Salvar";
        }
      });
    if (feedElements.cancelEditPostBtn)
      feedElements.cancelEditPostBtn.addEventListener(
        "click",
        () => (feedElements.editPostModal.style.display = "none")
      );
    if (feedElements.editCommentForm)
      feedElements.editCommentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const commentId = feedElements.editCommentIdInput.value;
        const content = feedElements.editCommentTextarea.value;
        try {
          await axios.put(
            `${backendUrl}/comentarios/${commentId}`,
            { conteudo: content },
            { headers: { "Content-Type": "application/json" } }
          );
          showNotification("Comentário editado.", "success");
          closeAndResetEditCommentModal();
        } catch (error) {
          showNotification("Não foi possível salvar.", "error");
        }
      });
    if (feedElements.cancelEditCommentBtn)
      feedElements.cancelEditCommentBtn.addEventListener(
        "click",
        closeAndResetEditCommentModal
      );
    if (feedElements.postFileInput)
      feedElements.postFileInput.addEventListener("change", (event) => {
        selectedFilesForPost = Array.from(event.target.files);
        updateFilePreview();
      });
    if (feedElements.publishBtn)
      feedElements.publishBtn.addEventListener("click", async () => {
        const content = feedElements.postTextarea.value.trim();
        if (!content && selectedFilesForPost.length === 0) return;
        feedElements.publishBtn.disabled = true;
        feedElements.publishBtn.innerHTML = `<i class="fas fa-spinner"></i> Publicando...`;
        const formData = new FormData();
        formData.append(
          "postagem",
          new Blob([JSON.stringify({ conteudo: content })], {
            type: "application/json",
          })
        );
        selectedFilesForPost.forEach((file) =>
          formData.append("arquivos", file)
        );
        try {
          await axios.post(`${backendUrl}/postagem/upload-mensagem`, formData);
          feedElements.postTextarea.value = "";
          selectedFilesForPost = [];
          feedElements.postFileInput.value = "";
          updateFilePreview();
        } catch (error) {
          let errorMessage = "Erro ao publicar.";
                if (error.response && error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
                showNotification(errorMessage, "error");
        } finally {
          feedElements.publishBtn.disabled = false;
          feedElements.publishBtn.innerHTML = "Publicar";
        }
      });

    // Espera o WebSocket conectar para carregar o feed e se inscrever
    document.addEventListener("webSocketConnected", (e) => {
      const stompClient = e.detail.stompClient;
      fetchPublicPosts();
      checkAndHighlightComment();
      stompClient.subscribe("/topic/publico", (message) => {
        handlePublicFeedUpdate(JSON.parse(message.body));
      });
    });
  }

  // --- INICIA A LÓGICA DO FEED ---
  setupFeedEventListeners();
});