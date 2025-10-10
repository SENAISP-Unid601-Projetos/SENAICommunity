// Arquivo: /JS/gerenciador-layout.js

document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
  const backendUrl = "http://localhost:8080";
  const jwtToken = localStorage.getItem("token");
  const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
  let stompClient = null;
  let currentUser = null;

  // --- ELEMENTOS DO DOM (Layout Geral e Modais) ---
  const elements = {
    // UI Geral
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    dropdownMenu: document.querySelector(".user-dropdown .dropdown-menu"),
    logoutBtn: document.getElementById("logout-btn"),
    notificationCenter: document.querySelector(".notification-center"),
    topbarUserName: document.getElementById("topbar-user-name"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserTitle: document.getElementById("sidebar-user-title"),
    topbarUserImg: document.getElementById("topbar-user-img"),
    sidebarUserImg: document.getElementById("sidebar-user-img"),
    connectionsCount: document.getElementById('connections-count'),
    themeToggle: document.querySelector('.theme-toggle'),

    // Notificações
    notificationsIcon: document.getElementById('notifications-icon'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsList: document.getElementById('notifications-list'),
    notificationsBadge: document.getElementById('notifications-badge'),

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
    editProfilePassword: document.getElementById("edit-profile-password"),
    editProfilePasswordConfirm: document.getElementById("edit-profile-password-confirm"),
    deleteAccountModal: document.getElementById("delete-account-modal"),
    deleteAccountForm: document.getElementById("delete-account-form"),
    cancelDeleteAccountBtn: document.getElementById("cancel-delete-account-btn"),
    deleteConfirmPassword: document.getElementById("delete-confirm-password"),
  };

  // --- INICIALIZAÇÃO ---
  async function initLayout() {
    if (!jwtToken) {
      // Se não estiver na página de login, redireciona
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = "login.html";
      }
      return;
    }
    axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

    try {
      const response = await axios.get(`${backendUrl}/usuarios/me`);
      currentUser = response.data;
      updateUIWithUserData(currentUser);
      connectWebSocket(); // Passa uma função de callback para inscrições específicas da página
      fetchNotifications();
      // O fetch de amigos/conexões será feito aqui para popular o contador
      const friendsResponse = await axios.get(`${backendUrl}/api/amizades/`);
      if (elements.connectionsCount) {
        elements.connectionsCount.textContent = friendsResponse.data.length;
      }
    } catch (error) {
      console.error("ERRO CRÍTICO NA INICIALIZAÇÃO DO LAYOUT:", error);
      localStorage.removeItem("token");
      if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = "login.html";
      }
    }
  }

  // --- FUNÇÕES DE UI E TEMA ---
  function setInitialTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  }

  function updateThemeIcon(theme) {
    const themeToggleIcon = document.querySelector('.theme-toggle i');
    if (themeToggleIcon) {
      themeToggleIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
  }

  function updateUIWithUserData(user) {
    if (!user) return;
    const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
    if (elements.topbarUserName) elements.topbarUserName.textContent = user.nome;
    if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
    if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.titulo || "Membro da Comunidade";
    if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
    if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
    // Adiciona a foto do usuário também ao criador de post na página principal, se existir
    const postCreatorImg = document.getElementById("post-creator-img");
    if(postCreatorImg) postCreatorImg.src = userImage;
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

  // --- LÓGICA DO WEBSOCKET (CONEXÃO E INSCRIÇÕES GLOBAIS) ---
  function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };

    stompClient.connect(headers, (frame) => {
      console.log("GERENCIADOR DE LAYOUT: CONECTADO AO WEBSOCKET");
      
      // Inscrição GERAL para notificações pessoais
      stompClient.subscribe(`/user/${currentUser.email}/queue/notifications`, (message) => {
        const newNotification = JSON.parse(message.body);
        showNotification(`Nova notificação: ${newNotification.mensagem}`, 'info');
        handleIncomingNotification(newNotification);
      });
      
      // Dispara um evento personalizado para que scripts específicos de página possam se inscrever em seus tópicos
      document.dispatchEvent(new CustomEvent('websocket:connected', { detail: { stompClient } }));

    }, (error) => console.error("ERRO WEBSOCKET:", error));
  }

  // --- LÓGICA DE NOTIFICAÇÕES ---
  async function fetchNotifications() {
    try {
      const response = await axios.get(`${backendUrl}/api/notificacoes`);
      renderNotifications(response.data);
    } catch (error) { console.error("Erro ao buscar notificações:", error); }
  }

  function renderNotifications(notifications) {
    if (!elements.notificationsList) return;
    elements.notificationsList.innerHTML = '';
    const unreadCount = notifications.filter(n => !n.lida).length;

    if (elements.notificationsBadge) {
      elements.notificationsBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
      elements.notificationsBadge.textContent = unreadCount;
    }

    if (notifications.length === 0) {
      elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
      return;
    }
    notifications.forEach(notification => {
      const item = createNotificationElement(notification);
      elements.notificationsList.appendChild(item);
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
    let link = '#'; // Link padrão

    if (notification.tipo === 'PEDIDO_AMIZADE') {
      iconClass = 'fa-user-plus';
      link = 'amizades.html';
      if (!notification.lida) {
        actionButtonsHtml = `
          <div class="notification-actions">
            <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
            <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
          </div>`;
      }
    }
    // Adicionar outros tipos de notificação e seus links
    else if (notification.tipo.includes('PROJETO') || notification.tipo.includes('MENSAGEM')) {
      link = `projeto.html?id=${notification.idReferencia}`; // Exemplo
    } else if (notification.tipo === 'NOVO_EVENTO') {
      link = `evento.html?id=${notification.idReferencia}`; // Exemplo
    } else if (notification.tipo === 'NOVA_VAGA') {
        link = `vaga.html?id=${notification.idReferencia}`; // Exemplo
    }

    item.innerHTML = `
        <a href="${link}" class="notification-link" onclick="window.markNotificationAsRead(event, ${notification.id})">
            <div class="notification-icon-wrapper"><i class="fas ${iconClass}"></i></div>
            <div class="notification-content">
                <p>${notification.mensagem}</p>
                <span class="timestamp">${data}</span>
            </div>
        </a>
        <div class="notification-actions-wrapper">${actionButtonsHtml}</div>`;
    
    item.querySelector('.notification-actions-wrapper')?.addEventListener('click', e => e.stopPropagation());
    return item;
  }

  function handleIncomingNotification(newNotification) {
    if (elements.notificationsList) {
      elements.notificationsList.querySelector('.empty-state')?.remove();
      const newItem = createNotificationElement(newNotification);
      elements.notificationsList.prepend(newItem);
    }
    if (elements.notificationsBadge) {
      const newCount = (parseInt(elements.notificationsBadge.textContent) || 0) + 1;
      elements.notificationsBadge.textContent = newCount;
      elements.notificationsBadge.style.display = 'flex';
    }
  }

  // --- FUNÇÕES GLOBAIS (Acessíveis por `onclick`) ---
  window.markNotificationAsRead = async (event, notificationId) => {
    event.preventDefault();
    const notificationItem = document.getElementById(`notification-item-${notificationId}`);
    const isUnread = notificationItem?.classList.contains('unread');
    
    // Navega para o link se já foi lido
    if (!isUnread) {
        window.location.href = event.currentTarget.href;
        return;
    }

    notificationItem.classList.remove('unread');
    try {
      await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
      fetchNotifications(); // Re-sincroniza o contador
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
      notificationItem.classList.add('unread'); // Reverte em caso de erro
    } finally {
        window.location.href = event.currentTarget.href;
    }
  };

  window.aceitarSolicitacao = async (amizadeId, notificationId) => {
    try {
        await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`);
        showNotification('Amizade aceita!', 'success');
        fetchNotifications();
        // Dispara um evento para que a página de amizades possa recarregar
        document.dispatchEvent(new Event('amizade:aceita'));
    } catch (error) { showNotification('Erro ao aceitar solicitação.', 'error'); }
  };
  
  window.recusarSolicitacao = async (amizadeId, notificationId) => {
      try {
          await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`);
          showNotification('Solicitação recusada.', 'info');
          fetchNotifications();
          // Dispara um evento para que a página de amizades possa recarregar
          document.dispatchEvent(new Event('amizade:recusada'));
      } catch (error) { showNotification('Erro ao recusar solicitação.', 'error'); }
  };

  // --- LÓGICA DE MODAIS E MENUS ---
  function openEditProfileModal() {
    if (!currentUser || !elements.editProfileModal) return;
    elements.editProfilePicPreview.src = currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl;
    elements.editProfileName.value = currentUser.nome;
    elements.editProfileBio.value = currentUser.bio || "";
    if (currentUser.dataNascimento) elements.editProfileDob.value = currentUser.dataNascimento.split("T")[0];
    elements.editProfilePassword.value = "";
    elements.editProfilePasswordConfirm.value = "";
    elements.editProfileModal.style.display = "flex";
  }

  function openDeleteAccountModal() {
    if (elements.deleteConfirmPassword) elements.deleteConfirmPassword.value = "";
    if (elements.deleteAccountModal) elements.deleteAccountModal.style.display = "flex";
  }

  // --- SETUP DOS EVENT LISTENERS GLOBAIS ---
  function setupGlobalEventListeners() {
    setInitialTheme();
    if(elements.themeToggle) elements.themeToggle.addEventListener('click', toggleTheme);

    document.body.addEventListener("click", () => {
      if(elements.notificationsPanel) elements.notificationsPanel.style.display = 'none';
      if(elements.dropdownMenu) elements.dropdownMenu.style.display = "none";
    });

    if (elements.notificationsIcon) {
      elements.notificationsIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        const isVisible = elements.notificationsPanel.style.display === 'block';
        elements.notificationsPanel.style.display = isVisible ? 'none' : 'block';
      });
    }
    if (elements.notificationsPanel) elements.notificationsPanel.addEventListener('click', e => e.stopPropagation());

    if (elements.userDropdownTrigger) {
      elements.userDropdownTrigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const isVisible = elements.dropdownMenu.style.display === "block";
        elements.dropdownMenu.style.display = isVisible ? "none" : "block";
      });
    }

    if (elements.logoutBtn) elements.logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "login.html";
    });

    if (elements.editProfileBtn) elements.editProfileBtn.addEventListener("click", openEditProfileModal);
    if (elements.deleteAccountBtn) elements.deleteAccountBtn.addEventListener("click", openDeleteAccountModal);

    // Listeners dos Modais
    if (elements.cancelEditProfileBtn) elements.cancelEditProfileBtn.addEventListener("click", () => elements.editProfileModal.style.display = "none");
    if (elements.cancelDeleteAccountBtn) elements.cancelDeleteAccountBtn.addEventListener("click", () => elements.deleteAccountModal.style.display = "none");

    if (elements.editProfilePicInput) elements.editProfilePicInput.addEventListener("change", () => {
        const file = elements.editProfilePicInput.files[0];
        if (file) elements.editProfilePicPreview.src = URL.createObjectURL(file);
    });

    if (elements.editProfileForm) elements.editProfileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Lógica de envio do formulário de edição de perfil
      const password = elements.editProfilePassword.value;
      if (password && password !== elements.editProfilePasswordConfirm.value) {
        return showNotification("As novas senhas não coincidem.", "error");
      }
      try {
        if (elements.editProfilePicInput.files[0]) {
            const formData = new FormData();
            formData.append("foto", elements.editProfilePicInput.files[0]);
            await axios.put(`${backendUrl}/usuarios/me/foto`, formData);
        }
        const updateData = {
            nome: elements.editProfileName.value,
            bio: elements.editProfileBio.value,
            dataNascimento: elements.editProfileDob.value ? new Date(elements.editProfileDob.value).toISOString() : null,
            senha: password || null,
        };
        const response = await axios.put(`${backendUrl}/usuarios/me`, updateData);
        currentUser = response.data;
        updateUIWithUserData(currentUser);
        showNotification("Perfil atualizado com sucesso!", "success");
        elements.editProfileModal.style.display = "none";
      } catch (error) {
          showNotification("Erro ao atualizar o perfil.", "error");
      }
    });

    if (elements.deleteAccountForm) elements.deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = elements.deleteConfirmPassword.value;
        if (!password) return showNotification("Digite sua senha para confirmar.", "error");
        try {
            await axios.post(`${backendUrl}/autenticacao/login`, { email: currentUser.email, senha: password });
            if (confirm("Você tem CERTEZA? Esta ação é irreversível.")) {
                await axios.delete(`${backendUrl}/usuarios/me`);
                alert("Sua conta foi excluída.");
                localStorage.clear();
                window.location.href = "login.html";
            }
        } catch (error) {
            showNotification("Senha incorreta.", "error");
        }
    });
  }

  // --- PONTO DE ENTRADA ---
  setupGlobalEventListeners();
  initLayout();
});