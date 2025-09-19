document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
  const backendUrl = "http://localhost:8080";
  const jwtToken = localStorage.getItem("token");
  let stompClient = null;
  let currentUser = null;
  let userFriends = [];
  let selectedFilesForPost = [];
  let selectedFilesForEdit = [];
  
  // --- ELEMENTOS DO DOM (Seleção Centralizada e Completa) ---
  const elements = {
    // UI Geral
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    logoutBtn: document.getElementById("logout-btn"),
    notificationCenter: document.querySelector(".notification-center"),
    topbarUserName: document.getElementById("topbar-user-name"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserTitle: document.getElementById("sidebar-user-title"),
    topbarUserImg: document.getElementById("topbar-user-img"),
    sidebarUserImg: document.getElementById("sidebar-user-img"),

    // Notificações e Amigos
    notificationsIcon: document.getElementById('notifications-icon'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsList: document.getElementById('notifications-list'),
    notificationsBadge: document.getElementById('notifications-badge'),
    onlineFriendsList: document.getElementById('online-friends-list'),
    connectionsCount: document.getElementById('connections-count'),
    
    // Feed e Posts (mesmo que não exista na página, é bom para evitar erros se o HTML for copiado)
    postsContainer: document.querySelector(".posts-container"),
    searchInput: document.getElementById("search-input"),
    
    // Elementos Específicos da Página de Busca
    userSearchInput: document.getElementById('user-search-input'),
    searchResultsContainer: document.getElementById('search-results-container'),
    
    // Modais de Conta de Usuário (necessários para o menu do header)
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
  };

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
      setupEventListeners();
      fetchFriends();
      fetchNotifications();
    } catch (error) {
      console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }

  // --- FUNÇÕES DE UI ---
  function updateUIWithUserData(user) {
    if (!user) return;
    const userImage = user.urlFotoPerfil
      ? user.urlFotoPerfil.startsWith("http")
        ? user.urlFotoPerfil
        : `${backendUrl}${user.urlFotoPerfil}`
      : `${backendUrl}/images/default-avatar.png`;

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

  // --- LÓGICA DO WEBSOCKET ---
  function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };
    stompClient.connect(headers, (frame) => {
        console.log("CONECTADO AO WEBSOCKET");
        stompClient.subscribe(`/user/${currentUser.email}/queue/notifications`, (message) => {
            const notification = JSON.parse(message.body);
            showNotification(`Nova notificação: ${notification.mensagem}`, 'info');
            fetchNotifications();
        });
        stompClient.subscribe("/topic/status", (message) => {
            const onlineUsersEmails = JSON.parse(message.body);
            updateOnlineFriends(onlineUsersEmails);
        });
      }, (error) => console.error("ERRO WEBSOCKET:", error));
  }
  
  // --- FUNÇÕES DE NOTIFICAÇÕES ---
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
        if (unreadCount > 0) {
            elements.notificationsBadge.textContent = unreadCount;
            elements.notificationsBadge.style.display = 'flex';
        } else {
            elements.notificationsBadge.style.display = 'none';
        }
    }
    if (notifications.length === 0) {
        elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
        return;
    }
    notifications.forEach(notification => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        if (!notification.lida) item.classList.add('unread');
        const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
        item.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <div class="notification-content"><p>${notification.mensagem}</p><span class="timestamp">${data}</span></div>
            ${!notification.lida ? '<button class="mark-as-read-btn" title="Marcar como lida"></button>' : ''}
        `;
        if (!notification.lida) {
            item.querySelector('.mark-as-read-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                markNotificationAsRead(notification.id);
            });
        }
        elements.notificationsList.appendChild(item);
    });
  }
    
  async function markNotificationAsRead(notificationId) {
    try {
        await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
        fetchNotifications();
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        showNotification('Erro ao atualizar notificação.', 'error');
    }
  }

  // --- FUNÇÕES DE AMIGOS E CONEXÕES ---
  async function fetchFriends() {
    try {
        const response = await axios.get(`${backendUrl}/api/amizades/`);
        userFriends = response.data;
        if (elements.connectionsCount) {
            elements.connectionsCount.textContent = userFriends.length;
        }
    } catch (error) {
        console.error("Erro ao buscar lista de amigos:", error);
        if (elements.connectionsCount) {
            elements.connectionsCount.textContent = '0';
        }
    }
  }
    
  function updateOnlineFriends(onlineUsersEmails) {
    if (!elements.onlineFriendsList) return;
    const onlineFriends = userFriends.filter(friend => onlineUsersEmails.includes(friend.email));
    elements.onlineFriendsList.innerHTML = '';
    if (onlineFriends.length === 0) {
        elements.onlineFriendsList.innerHTML = '<p class="empty-state">Nenhum amigo online.</p>';
        return;
    }
    onlineFriends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = 'friend-item';
        const friendAvatar = friend.fotoPerfil ? `${backendUrl}${friend.fotoPerfil}` : `${backendUrl}/images/default-avatar.png`;
        friendElement.innerHTML = `
            <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}"></div>
            <span class="friend-name">${friend.nome}</span>
            <div class="status online"></div>
        `;
        elements.onlineFriendsList.appendChild(friendElement);
    });
  }

  // --- FUNÇÕES PARA BUSCA DE USUÁRIOS ---
  async function buscarUsuarios(nome) {
    if (!elements.searchResultsContainer) return;
    try {
        const response = await axios.get(`${backendUrl}/usuarios/buscar`, {
            params: { nome }
        });
        renderizarResultados(response.data);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        elements.searchResultsContainer.innerHTML = '<p class="empty-state">Erro ao buscar usuários. Tente novamente.</p>';
    }
  }

  function renderizarResultados(usuarios) {
    if (!elements.searchResultsContainer) return;
    elements.searchResultsContainer.innerHTML = '';

    if (usuarios.length === 0) {
        elements.searchResultsContainer.innerHTML = '<p class="empty-state">Nenhum usuário encontrado.</p>';
        return;
    }

    usuarios.forEach(usuario => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';

        const fotoUrl = usuario.fotoPerfil.startsWith('/images') ? `${backendUrl}${usuario.fotoPerfil}` : usuario.fotoPerfil;

        let actionButtonHtml = '';
        switch (usuario.statusAmizade) {
            case 'AMIGOS':
                actionButtonHtml = '<button class="btn btn-secondary" disabled><i class="fas fa-check"></i> Amigos</button>';
                break;
            case 'SOLICITACAO_ENVIADA':
                actionButtonHtml = '<button class="btn btn-secondary" disabled>Pendente</button>';
                break;
            case 'SOLICITACAO_RECEBIDA':
                actionButtonHtml = '<a href="perfil.html" class="btn btn-primary">Responder</a>';
                break;
            case 'NENHUMA':
                actionButtonHtml = `<button class="btn btn-primary" onclick="window.enviarSolicitacao(${usuario.id}, this)"> <i class="fas fa-user-plus"></i> Adicionar</button>`;
                break;
        }

        userCard.innerHTML = `
            <div class="user-card-avatar">
                <img src="${fotoUrl}" alt="Foto de ${usuario.nome}">
            </div>
            <div class="user-card-info">
                <h4>${usuario.nome}</h4>
                <p>${usuario.email}</p>
            </div>
            <div class="user-card-action">
                ${actionButtonHtml}
            </div>
        `;
        elements.searchResultsContainer.appendChild(userCard);
    });
  }
  
  // Tornar a função de enviar solicitação acessível globalmente
  window.enviarSolicitacao = async (idSolicitado, buttonElement) => {
    buttonElement.disabled = true;
    buttonElement.textContent = 'Enviando...';
    try {
        await axios.post(`${backendUrl}/api/amizades/solicitar/${idSolicitado}`);
        buttonElement.textContent = 'Pendente';
        buttonElement.classList.remove('btn-primary');
        buttonElement.classList.add('btn-secondary');
    } catch (error) {
        console.error('Erro ao enviar solicitação:', error);
        alert('Não foi possível enviar a solicitação.');
        buttonElement.disabled = false;
        buttonElement.innerHTML = '<i class="fas fa-user-plus"></i> Adicionar';
    }
  };

  // --- FUNÇÕES DE MODAIS E MENUS ---
  const closeAllMenus = () => {
    document.querySelectorAll('.options-menu, .dropdown-menu').forEach(m => m.style.display = 'none');
  };
  
  function openEditProfileModal() { /* ... implementação do modal ... */ }
  function openDeleteAccountModal() { /* ... implementação do modal ... */ }

  // --- SETUP DOS EVENT LISTENERS ---
  function setupEventListeners() {
    document.body.addEventListener("click", (e) => {
        if (elements.notificationsPanel && !elements.notificationsPanel.contains(e.target) && !elements.notificationsIcon.contains(e.target)) {
            elements.notificationsPanel.style.display = 'none';
        }
        closeAllMenus();
    });

    if (elements.notificationsIcon) {
        elements.notificationsIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const isVisible = elements.notificationsPanel.style.display === 'block';
            elements.notificationsPanel.style.display = isVisible ? 'none' : 'block';
        });
    }

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

    if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
    
    // (Adicione aqui os listeners dos modais, copiados da sua principal.js)
    if (elements.editProfileBtn) elements.editProfileBtn.addEventListener("click", openEditProfileModal);
    if (elements.deleteAccountBtn) elements.deleteAccountBtn.addEventListener("click", openDeleteAccountModal);

    // Listener para o input de busca de usuários
    if (elements.userSearchInput) {
        let searchTimeout;
        elements.userSearchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const searchTerm = elements.userSearchInput.value.trim();
                if (searchTerm.length > 2) {
                    buscarUsuarios(searchTerm);
                } else if (searchTerm.length === 0) {
                    elements.searchResultsContainer.innerHTML = '<p class="empty-state">Comece a digitar para encontrar pessoas.</p>';
                } else {
                    elements.searchResultsContainer.innerHTML = '<p class="empty-state">Digite pelo menos 3 caracteres.</p>';
                }
            }, 300);
        });
    }
    
    // Listener para o input de busca do feed (opcional, pode ser removido se não for usado)
    if (elements.searchInput) {
        elements.searchInput.addEventListener("input", () => {
            // Lógica de filtro do feed, se aplicável nesta página
        });
    }
  }

  // Ponto de entrada da aplicação
  init();
});