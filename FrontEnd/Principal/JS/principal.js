/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// =================================================================
// BLOCO DE CONTROLE DE TEMA (Executa primeiro em todas as páginas)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
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
            if (theme === 'dark') {
                themeToggleIcon.classList.remove('fa-sun');
                themeToggleIcon.classList.add('fa-moon');
            } else {
                themeToggleIcon.classList.remove('fa-moon');
                themeToggleIcon.classList.add('fa-sun');
            }
        }
    }
    setInitialTheme();
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
});

// =================================================================
// LÓGICA GLOBAL (Executa em TODAS as páginas)
// =================================================================
const backendUrl = "http://localhost:8080";
const jwtToken = localStorage.getItem("token");
const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
const messageBadgeElement = document.getElementById('message-badge');


// Variáveis globais para que outros scripts (como mensagem.js) possam acessá-las
let stompClient = null;
let currentUser = null;
let userFriends = [];
let friendsLoaded = false;
let latestOnlineEmails = [];


// Torna as variáveis e funções essenciais acessíveis globalmente
window.stompClient = stompClient;
window.currentUser = currentUser;
window.jwtToken = jwtToken;
window.backendUrl = backendUrl;
window.defaultAvatarUrl = defaultAvatarUrl;
window.showNotification = showNotification;
window.axios = axios; // Assume que Axios está carregado globalmente

// --- SELEÇÃO DE ELEMENTOS GLOBAIS ---
// (Presentes em principal.html e mensagem.html)
const globalElements = {
    userDropdownTrigger: document.querySelector(".user-dropdown .user"),
    logoutBtn: document.getElementById("logout-btn"),
    notificationCenter: document.querySelector(".notification-center"),
    notificationsIcon: document.getElementById('notifications-icon'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsList: document.getElementById('notifications-list'),
    notificationsBadge: document.getElementById('notifications-badge'),
    onlineFriendsList: document.getElementById('online-friends-list'),
    connectionsCount: document.getElementById('connections-count'),
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
    editProfilePasswordConfirm: document.getElementById("edit-profile-password-confirm"),
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
        
        // 3. Conecta ao WebSocket
        connectWebSocket(); // Define window.stompClient

        // 4. Busca dados da sidebar (Amigos/Notificações)
        await fetchFriends();
        await fetchInitialOnlineFriends();
        atualizarStatusDeAmigosNaUI();
        fetchNotifications();
        
        // 5. Configura listeners globais
        setupGlobalEventListeners();

        // 6. Dispara um evento para scripts de página (como mensagem.js) saberem que está pronto
     

    } catch (error) {
        console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
        if (error.response && error.response.status === 401) {
             localStorage.removeItem("token");
             window.location.href = "login.html";
        }
    }
}

// --- FUNÇÕES GLOBAIS (Auth, UI, WebSocket, Notificações) ---

function updateUIWithUserData(user) {
    if (!user) return;
    const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;

    // Atualiza o Topbar
    const topbarUser = document.querySelector(".user-dropdown .user");
    if (topbarUser) {
        //
        topbarUser.innerHTML = `
            <div class="profile-pic"><img src="${userImage}" alt="Perfil"></div>
            <span>${user.nome}</span>
            <i class="fas fa-chevron-down"></i>
        `;
    }
    
    // Atualiza a Sidebar (se existir na página)
    if (globalElements.sidebarUserName) globalElements.sidebarUserName.textContent = user.nome;
    if (globalElements.sidebarUserTitle) globalElements.sidebarUserTitle.textContent = user.tipoUsuario || "Membro da Comunidade";
    if (globalElements.sidebarUserImg) globalElements.sidebarUserImg.src = userImage;
    
    // Atualiza a imagem do criador de post (se existir na página)
    const postCreatorImg = document.getElementById("post-creator-img");
    if (postCreatorImg) postCreatorImg.src = userImage;
}

function connectWebSocket() {
    const socket = new SockJS(`${backendUrl}/ws`);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;
    const headers = { Authorization: `Bearer ${jwtToken}` };
    
    stompClient.connect(headers, (frame) => {
        console.log("CONECTADO AO WEBSOCKET");
        window.stompClient = stompClient; // Expõe o cliente conectado globalmente

        // INSCRIÇÃO GLOBAL: Notificações
        stompClient.subscribe(`/user/${currentUser.email}/queue/notifications`, (message) => {
            const newNotification = JSON.parse(message.body);
            showNotification(`Nova notificação: ${newNotification.mensagem}`, 'info');
            if (globalElements.notificationsList) {
                const emptyState = globalElements.notificationsList.querySelector('.empty-state');
                if (emptyState) emptyState.remove();
                const newItem = createNotificationElement(newNotification); //
                globalElements.notificationsList.prepend(newItem);
            }
            if (globalElements.notificationsBadge) {
                const currentCount = parseInt(globalElements.notificationsBadge.textContent) || 0;
                const newCount = currentCount + 1;
                globalElements.notificationsBadge.textContent = newCount;
                globalElements.notificationsBadge.style.display = 'flex';
            }
        });

        // INSCRIÇÃO GLOBAL: Status Online
        stompClient.subscribe("/topic/status", (message) => {
            latestOnlineEmails = JSON.parse(message.body); //
            atualizarStatusDeAmigosNaUI();
        });

           document.dispatchEvent(new CustomEvent('globalScriptsLoaded', { 
            detail: { stompClient: window.stompClient, currentUser } 
        }));

        stompClient.subscribe(`/user/${currentUser.email}/queue/contagem`, (message) => {
            const count = JSON.parse(message.body);
            updateMessageBadge(count);
        });
        
        // Dispara evento para que scripts de página (feed, chat) façam suas inscrições
        document.dispatchEvent(new CustomEvent('webSocketConnected', { 
            detail: { stompClient } 
        }));

        // Busca a contagem inicial ao conectar
        fetchAndUpdateUnreadCount();
    }, (error) => console.error("ERRO WEBSOCKET:", error));
}

async function fetchAndUpdateUnreadCount() {
    if (!messageBadgeElement) return; // Só executa se o badge existir na página
    try {
        const response = await axios.get(`${backendUrl}/api/chat/privado/nao-lidas/contagem`);
        const count = response.data;
        updateMessageBadge(count);
    } catch (error) {
        console.error("Erro ao buscar contagem de mensagens não lidas:", error);
    }
}

function updateMessageBadge(count) {
    if (messageBadgeElement) {
        messageBadgeElement.textContent = count;
        messageBadgeElement.style.display = count > 0 ? 'flex' : 'none';
    }
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    if (globalElements.notificationCenter) globalElements.notificationCenter.appendChild(notification);
    setTimeout(() => { notification.classList.add("show"); }, 10);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => { notification.remove(); }, 300);
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
        latestOnlineEmails = amigosOnlineDTOs.map(amigo => amigo.email); //
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
            const friendAvatar = friend.fotoPerfil ? `${backendUrl}/api/arquivos/${friend.fotoPerfil}` : defaultAvatarUrl;
            friendElement.innerHTML = `
                <div class="avatar"><img src="${friendAvatar}" alt="Avatar de ${friend.nome}"></div>
                <span class="friend-name">${friend.nome}</span>
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
    globalElements.notificationsList.innerHTML = '';
    const unreadCount = notifications.filter(n => !n.lida).length; //
    if (globalElements.notificationsBadge) {
        globalElements.notificationsBadge.style.display = unreadCount > 0 ? 'flex' : 'none'; //
        globalElements.notificationsBadge.textContent = unreadCount;
    }
    if (notifications.length === 0) {
        globalElements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
        return;
    }
    notifications.forEach(notification => {
        const item = createNotificationElement(notification); //
        globalElements.notificationsList.appendChild(item);
    });
}

function createNotificationElement(notification) {
    //
    const item = document.createElement('div');
    item.className = 'notification-item';
    item.id = `notification-item-${notification.id}`;
    if (!notification.lida) item.classList.add('unread');
    const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
    let actionButtonsHtml = '';
    let iconClass = 'fa-info-circle';

    if (notification.tipo === 'PEDIDO_AMIZADE' && !notification.lida) {
        iconClass = 'fa-user-plus';
        actionButtonsHtml = `
          <div class="notification-actions">
             <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
             <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
          </div>`;
    }
    item.innerHTML = `
        <a href="amizades.html" class="notification-link" onclick="window.markNotificationAsRead(event, ${notification.id})">
            <div class="notification-icon-wrapper"><i class="fas ${iconClass}"></i></div>
            <div class="notification-content">
                <p>${notification.mensagem}</p>
                <span class="timestamp">${data}</span>
            </div>
        </a>
        <div class="notification-actions-wrapper">${actionButtonsHtml}</div>`;
    const actionsWrapper = item.querySelector('.notification-actions-wrapper');
    if (actionsWrapper) {
        actionsWrapper.addEventListener('click', e => e.stopPropagation());
    }
    return item;
}

window.markNotificationAsRead = async (event, notificationId) => {
    //
    if (event) event.preventDefault();
    const item = document.getElementById(`notification-item-${notificationId}`);
    if (item && item.classList.contains('unread')) {
        item.classList.remove('unread');
        try {
            await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
            fetchNotifications(); 
        } catch (error) {
            item.classList.add('unread'); 
        } finally {
            if (event) window.location.href = event.currentTarget.href;
        }
    } else {
        if (event) window.location.href = event.currentTarget.href;
    }
};

async function markAllNotificationsAsRead() {
    //
    const unreadCount = parseInt(globalElements.notificationsBadge.textContent, 10);
    if (isNaN(unreadCount) || unreadCount === 0) return;
    try {
        await axios.post(`${backendUrl}/api/notificacoes/ler-todas`);
        if (globalElements.notificationsBadge) {
            globalElements.notificationsBadge.style.display = 'none';
            globalElements.notificationsBadge.textContent = '0';
        }
        if (globalElements.notificationsList) {
            globalElements.notificationsList.querySelectorAll('.notification-item.unread').forEach(item => item.classList.remove('unread'));
        }
    } catch (error) { console.error("Erro ao marcar todas como lidas:", error); }
}

window.aceitarSolicitacao = async (amizadeId, notificationId) => {
    //
    try {
        await axios.post(`${backendUrl}/api/amizades/aceitar/${amizadeId}`); //
        handleFriendRequestFeedback(notificationId, 'Pedido aceito!', 'success');
        fetchFriends();
    } catch (error) { handleFriendRequestFeedback(notificationId, 'Erro ao aceitar.', 'error'); }
};

window.recusarSolicitacao = async (amizadeId, notificationId) => {
    //
    try {
        await axios.delete(`${backendUrl}/api/amizades/recusar/${amizadeId}`); //
        handleFriendRequestFeedback(notificationId, 'Pedido recusado.', 'info');
    } catch (error) { handleFriendRequestFeedback(notificationId, 'Erro ao recusar.', 'error'); }
};

function handleFriendRequestFeedback(notificationId, message, type = 'info') {
    //
    const item = document.getElementById(`notification-item-${notificationId}`);
    if (item) {
        const actionsDiv = item.querySelector('.notification-actions-wrapper');
        if (actionsDiv) actionsDiv.innerHTML = `<p class="feedback-text ${type === 'success' ? 'success' : ''}">${message}</p>`;
        setTimeout(() => {
            item.classList.add('removing');
            setTimeout(() => {
                item.remove();
                if (globalElements.notificationsList && globalElements.notificationsList.children.length === 0) {
                    globalElements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
                }
            }, 500);
        }, 2500);
    }
    fetchNotifications();
}

const closeAllMenus = () => {
    document.querySelectorAll(".options-menu, .dropdown-menu").forEach((m) => (m.style.display = "none"));
};

function openEditProfileModal() {
    //
    const elements = globalElements; // usa os elementos globais
    if (!currentUser || !elements.editProfileModal) return;
    elements.editProfilePicPreview.src = currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl;
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
    if (elements.deleteConfirmPassword)
      elements.deleteConfirmPassword.value = "";
    if (elements.deleteAccountModal)
      elements.deleteAccountModal.style.display = "flex";
}

// --- SETUP DE EVENT LISTENERS GLOBAIS ---
function setupGlobalEventListeners() {
    document.body.addEventListener("click", (e) => {
        if (globalElements.notificationsPanel && !globalElements.notificationsPanel.contains(e.target) && !globalElements.notificationsIcon.contains(e.target)) {
            globalElements.notificationsPanel.style.display = 'none';
        }
        closeAllMenus();
    });

    if (globalElements.notificationsIcon) {
        globalElements.notificationsIcon.addEventListener('click', (event) => {
            event.stopPropagation();
            const panel = globalElements.notificationsPanel;
            const isVisible = panel.style.display === 'block';
            panel.style.display = isVisible ? 'none' : 'block';
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
    if (globalElements.editProfileBtn) globalElements.editProfileBtn.addEventListener("click", openEditProfileModal);
    if (globalElements.deleteAccountBtn) globalElements.deleteAccountBtn.addEventListener("click", openDeleteAccountModal);
    if (globalElements.cancelEditProfileBtn) globalElements.cancelEditProfileBtn.addEventListener("click", () => (globalElements.editProfileModal.style.display = "none"));
    if (globalElements.editProfilePicInput) globalElements.editProfilePicInput.addEventListener("change", () => {
        const file = globalElements.editProfilePicInput.files[0];
        if (file) globalElements.editProfilePicPreview.src = URL.createObjectURL(file);
    });
    if (globalElements.editProfileForm) globalElements.editProfileForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        // Lógica de update de foto
        if (globalElements.editProfilePicInput.files[0]) {
            const formData = new FormData();
            formData.append("foto", globalElements.editProfilePicInput.files[0]);
            try {
                const response = await axios.put(`${backendUrl}/usuarios/me/foto`, formData);
                currentUser = response.data;
                updateUIWithUserData(currentUser);
                showNotification("Foto de perfil atualizada!", "success");
            } catch (error) { showNotification("Erro ao atualizar a foto.", "error"); }
        }
        // Lógica de update de dados
        const password = globalElements.editProfilePassword.value;
        if (password && password !== globalElements.editProfilePasswordConfirm.value) {
            showNotification("As novas senhas não coincidem.", "error"); return;
        }
        const updateData = {
            nome: globalElements.editProfileName.value,
            bio: globalElements.editProfileBio.value,
            dataNascimento: globalElements.editProfileDob.value ? new Date(globalElements.editProfileDob.value).toISOString() : null,
            senha: password || null,
        };
        try {
            const response = await axios.put(`${backendUrl}/usuarios/me`, updateData);
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            showNotification("Perfil atualizado com sucesso!", "success");
            globalElements.editProfileModal.style.display = "none";
        } catch (error) { showNotification("Erro ao atualizar o perfil.", "error"); }
    });
    
    // Deletar conta
    if (globalElements.cancelDeleteAccountBtn) globalElements.cancelDeleteAccountBtn.addEventListener("click", () => (globalElements.deleteAccountModal.style.display = "none"));
    if (globalElements.deleteAccountForm) globalElements.deleteAccountForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = globalElements.deleteConfirmPassword.value;
        if (!password) { showNotification("Por favor, digite sua senha para confirmar.", "error"); return; }
        try {
            await axios.post(`${backendUrl}/autenticacao/login`, { email: currentUser.email, senha: password });
            if (confirm("Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita.")) {
                await axios.delete(`${backendUrl}/usuarios/me`);
                alert("Sua conta foi excluída com sucesso.");
                localStorage.clear();
                window.location.href = "login.html";
            }
        } catch (error) { showNotification("Senha incorreta. A conta não foi excluída.", "error"); }
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
        editFilePreviewContainer: document.getElementById("edit-file-preview-container"),
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
    
    // --- FUNÇÕES (Específicas do Feed) ---
    
    async function fetchPublicPosts() {
        //
        try {
            const response = await axios.get(`${backendUrl}/api/chat/publico`);
            feedElements.postsContainer.innerHTML = "";
            const sortedPosts = response.data.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            sortedPosts.forEach((post) => showPublicPost(post));
        } catch (error) {
            console.error("Erro ao buscar postagens:", error);
            feedElements.postsContainer.innerHTML = "<p>Não foi possível carregar o feed.</p>";
        }
    }
    
    function createPostElement(post) {
        //
        const postElement = document.createElement("div");
        postElement.className = "post";
        postElement.id = `post-${post.id}`;
        const autorNome = post.nomeAutor || "Usuário Desconhecido";
        const autorIdDoPost = post.autorId;
        const fotoAutorPath = post.urlFotoAutor;
        const autorAvatar = fotoAutorPath ? (fotoAutorPath.startsWith("http") ? fotoAutorPath : `${backendUrl}/api/arquivos/${fotoAutorPath}`) : defaultAvatarUrl;
        const dataFormatada = new Date(post.dataCriacao).toLocaleString("pt-BR");
        const isAuthor = currentUser && autorIdDoPost === currentUser.id;
        let mediaHtml = "";
        if (post.urlsMidia && post.urlsMidia.length > 0) {
          mediaHtml = `<div class="post-media">${post.urlsMidia.map((url) => {
              const fullMediaUrl = url.startsWith("http") ? url : `${backendUrl}${url}`;
              if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) return `<img src="${fullMediaUrl}" alt="Mídia da postagem">`;
              if (url.match(/\.(mp4|webm|ogg)$/i)) return `<video controls src="${fullMediaUrl}"></video>`;
              return "";
            }).join("")}</div>`;
        }
        const rootComments = (post.comentarios || []).filter((c) => !c.parentId);
        let commentsHtml = rootComments.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao)).map((comment) => renderCommentWithReplies(comment, post.comentarios, post)).join("");
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
                <div class="post-author-details">
                    <div class="post-author-avatar"><img src="${autorAvatar}" alt="${autorNome}" onerror="this.src='${defaultAvatarUrl}';"></div>
                    <div class="post-author-info"><strong>${autorNome}</strong><span>${dataFormatada}</span></div>
                </div>
                ${optionsMenu}
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? "liked" : ""}" onclick="window.toggleLike(event, ${post.id}, null)"><i class="fas fa-heart"></i> <span id="like-count-post-${post.id}">${post.totalCurtidas || 0}</span></button>
                <button class="action-btn" onclick="window.toggleComments(${post.id})"><i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span></button>
            </div>
            <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                <div class="comments-list">${commentsHtml}</div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário..."><button onclick="window.sendComment(${post.id}, null)"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>`;
        return postElement;
    }
    
    function createCommentElement(comment, post) {
        //
        const commentAuthorName = comment.autor?.nome || comment.nomeAutor || "Usuário";
        const commentAuthorAvatar = comment.urlFotoAutor ? `${backendUrl}/api/arquivos/${comment.urlFotoAutor}` : defaultAvatarUrl;
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
        return `
                <div class="comment-container">
                    <div class="comment ${comment.destacado ? "destacado" : ""}" id="comment-${comment.id}">
                        <div class="comment-avatar"><img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}"></div>
                        <div class="comment-body">
                            <span class="comment-author">${commentAuthorName}</span>
                            <p class="comment-content">${comment.conteudo}</p>
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
    
    function renderCommentWithReplies(comment, allComments, post) {
        //
        let commentHtml = createCommentElement(comment, post);
        const replies = allComments.filter((reply) => reply.parentId === comment.id).sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao));
        if (replies.length > 0) {
          commentHtml += `<div class="comment-replies">`;
          replies.forEach((reply) => {
            commentHtml += renderCommentWithReplies(reply, allComments, post);
          });
          commentHtml += `</div>`;
        }
        return commentHtml;
    }

    function showPublicPost(post, prepend = false) {
        //
        const postElement = createPostElement(post);
        prepend ? feedElements.postsContainer.prepend(postElement) : feedElements.postsContainer.appendChild(postElement);
    }

    async function fetchAndReplacePost(postId) {
        //
        try {
            const response = await axios.get(`${backendUrl}/postagem/${postId}`);
            const oldPostElement = document.getElementById(`post-${postId}`);
            if (oldPostElement) {
                const wasCommentsVisible = oldPostElement.querySelector(".comments-section").style.display === "block";
                const newPostElement = createPostElement(response.data);
                if (wasCommentsVisible) newPostElement.querySelector(".comments-section").style.display = "block";
                oldPostElement.replaceWith(newPostElement);
            } else {
                showPublicPost(response.data, true);
            }
        } catch (error) { console.error(`Falha ao recarregar post ${postId}:`, error); }
    }

    function handlePublicFeedUpdate(payload) {
        //
        if (payload.autorAcaoId && currentUser && payload.autorAcaoId == currentUser.id) return;
        const postId = payload.postagem?.id || payload.id || payload.postagemId;
        if (payload.tipo === "remocao" && payload.postagemId) {
            const postElement = document.getElementById(`post-${payload.postagemId}`);
            if (postElement) postElement.remove();
        } else if (postId) {
            fetchAndReplacePost(postId);
        }
    }
    
    // Funções de Ação (Janelas)
    window.openPostMenu = (postId) => { closeAllMenus(); document.getElementById(`post-menu-${postId}`).style.display = "block"; };
    window.openCommentMenu = (commentId) => { closeAllMenus(); document.getElementById(`comment-menu-${commentId}`).style.display = "block"; };
    window.toggleComments = (postId) => {
        const cs = document.getElementById(`comments-section-${postId}`);
        cs.style.display = cs.style.display === "block" ? "none" : "block";
    };
    window.toggleReplyForm = (commentId) => {
        const form = document.getElementById(`reply-form-${commentId}`);
        form.style.display = form.style.display === "flex" ? "none" : "flex";
    };
    window.sendComment = (postId, parentId = null) => {
        const inputId = parentId ? `reply-input-${parentId}` : `comment-input-${postId}`;
        const input = document.getElementById(inputId);
        const content = input.value.trim();
        if (stompClient?.connected && content) {
            stompClient.send(`/app/postagem/${postId}/comentar`, {}, JSON.stringify({ conteudo: content, parentId: parentId }));
            input.value = "";
            if (parentId) document.getElementById(`reply-form-${parentId}`).style.display = "none";
        }
    };
    window.toggleLike = async (event, postagemId, comentarioId = null) => {
        const btn = event.currentTarget;
        const isPost = comentarioId === null;
        const countId = isPost ? `like-count-post-${postagemId}` : `like-count-comment-${comentarioId}`;
        const countSpan = document.getElementById(countId);
        let count = parseInt(countSpan.innerText.trim().replace(/<[^>]*>/g, ''), 10);
        if (isNaN(count)) count = 0;
        
        btn.classList.toggle("liked");
        const isLiked = btn.classList.contains("liked");
        const newCount = isLiked ? count + 1 : count - 1;
        
        if(isPost) countSpan.textContent = newCount;
        else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${newCount}`;
        
        try {
            await axios.post(`${backendUrl}/curtidas/toggle`, { postagemId, comentarioId });
        } catch (error) {
            showNotification("Erro ao processar curtida.", "error");
            btn.classList.toggle("liked");
            if(isPost) countSpan.textContent = count;
            else countSpan.innerHTML = `<i class="fas fa-heart"></i> ${count}`;
        }
    };
    window.deletePost = async (postId) => {
        if (confirm("Tem certeza?")) {
            try {
                await axios.delete(`${backendUrl}/postagem/${postId}`);
                showNotification("Postagem excluída.", "success");
            } catch (error) { showNotification("Erro ao excluir postagem.", "error"); }
        }
    };
    window.deleteComment = async (commentId) => {
        if (confirm("Tem certeza?")) {
            try {
                await axios.delete(`${backendUrl}/comentarios/${commentId}`);
                showNotification("Comentário excluído.", "success");
            } catch (error) { showNotification("Erro ao excluir comentário.", "error"); }
        }
    };
    window.highlightComment = async (commentId) => {
        try {
            await axios.put(`${backendUrl}/comentarios/${commentId}/destacar`);
        } catch (error) { showNotification("Erro ao destacar.", "error"); }
    };

    // Funções de Modal (Edição)
    window.openEditPostModal = async (postId) => {
        //
        const existingMediaContainer = document.getElementById('edit-existing-media-container');
        if (!feedElements.editPostModal || !existingMediaContainer) return;
        selectedFilesForEdit = [];
        urlsParaRemover = [];
        updateEditFilePreview();
        existingMediaContainer.innerHTML = '';
        try {
            const response = await axios.get(`${backendUrl}/postagem/${postId}`);
            const post = response.data;
            feedElements.editPostIdInput.value = post.id;
            feedElements.editPostTextarea.value = post.conteudo;
            post.urlsMidia.forEach(url => {
                const item = document.createElement('div');
                item.className = 'existing-media-item';
                const preview = document.createElement('img');
                preview.src = url;
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.onchange = (e) => {
                    if (e.target.checked) { urlsParaRemover.push(url); item.style.opacity = '0.5'; }
                    else { urlsParaRemover = urlsParaRemover.filter(u => u !== url); item.style.opacity = '1'; }
                };
                item.appendChild(preview);
                item.appendChild(checkbox);
                existingMediaContainer.appendChild(item);
            });
            feedElements.editPostModal.style.display = "flex";
        } catch (error) { showNotification("Erro ao carregar postagem.", "error"); }
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
            let previewElement = file.type.startsWith("image/") ? document.createElement("img") : document.createElement("video");
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
        document.querySelectorAll(".post").forEach(post => {
            const author = post.querySelector(".post-author-info strong").textContent.toLowerCase();
            const content = post.querySelector(".post-content p").textContent.toLowerCase();
            post.style.display = (author.includes(searchTerm) || content.includes(searchTerm)) ? "block" : "none";
        });
    }

    // --- SETUP DE EVENT LISTENERS (Específicos do Feed) ---
    function setupFeedEventListeners() {
        if (searchInput) searchInput.addEventListener("input", filterPosts);
        
        //
        if (feedElements.editPostFileInput) feedElements.editPostFileInput.addEventListener("change", (event) => {
            Array.from(event.target.files).forEach(file => selectedFilesForEdit.push(file));
            updateEditFilePreview();
        });
        if (feedElements.editPostForm) feedElements.editPostForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = e.submitter;
            btn.disabled = true;
            btn.textContent = 'Salvando...';
            try {
                const postId = feedElements.editPostIdInput.value;
                const postagemDTO = { 
                    conteudo: feedElements.editPostTextarea.value,
                    urlsParaRemover: urlsParaRemover 
                };
                const formData = new FormData();
                formData.append("postagem", new Blob([JSON.stringify(postagemDTO)], { type: "application/json" }));
                selectedFilesForEdit.forEach((file) => formData.append("arquivos", file));
                await axios.put(`${backendUrl}/postagem/${postId}`, formData);
                feedElements.editPostModal.style.display = "none";
                showNotification("Postagem editada.", "success");
            } catch (error) {
                showNotification("Não foi possível salvar.", "error");
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar';
            }
        });
        if (feedElements.cancelEditPostBtn) feedElements.cancelEditPostBtn.addEventListener("click", () => (feedElements.editPostModal.style.display = "none"));
        if (feedElements.editCommentForm) feedElements.editCommentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const commentId = feedElements.editCommentIdInput.value;
            const content = feedElements.editCommentTextarea.value;
            try {
                await axios.put(`${backendUrl}/comentarios/${commentId}`, { conteudo: content }, { headers: { "Content-Type": "application/json" } });
                showNotification("Comentário editado.", "success");
                closeAndResetEditCommentModal();
            } catch (error) { showNotification("Não foi possível salvar.", "error"); }
        });
        if (feedElements.cancelEditCommentBtn) feedElements.cancelEditCommentBtn.addEventListener("click", closeAndResetEditCommentModal);
        if (feedElements.postFileInput) feedElements.postFileInput.addEventListener("change", (event) => {
            selectedFilesForPost = Array.from(event.target.files);
            updateFilePreview();
        });
        if (feedElements.publishBtn) feedElements.publishBtn.addEventListener("click", async () => {
            const content = feedElements.postTextarea.value.trim();
            if (!content && selectedFilesForPost.length === 0) return;
            feedElements.publishBtn.disabled = true;
            feedElements.publishBtn.innerHTML = `<i class="fas fa-spinner"></i> Publicando...`;
            const formData = new FormData();
            formData.append("postagem", new Blob([JSON.stringify({ conteudo: content })], { type: "application/json" }));
            selectedFilesForPost.forEach((file) => formData.append("arquivos", file));
            try {
                await axios.post(`${backendUrl}/postagem/upload-mensagem`, formData);
                feedElements.postTextarea.value = "";
                selectedFilesForPost = [];
                feedElements.postFileInput.value = "";
                updateFilePreview();
            } catch (error) {
                showNotification("Erro ao publicar.", "error");
            } finally {
                feedElements.publishBtn.disabled = false;
                feedElements.publishBtn.innerHTML = "Publicar";
            }
        });

        // Espera o WebSocket conectar para carregar o feed e se inscrever
        document.addEventListener('webSocketConnected', (e) => {
            const stompClient = e.detail.stompClient;
            fetchPublicPosts();
            stompClient.subscribe("/topic/publico", (message) => {
                handlePublicFeedUpdate(JSON.parse(message.body));
            });
        });
    }

    // --- INICIA A LÓGICA DO FEED ---
    setupFeedEventListeners();
});