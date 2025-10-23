document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    const defaultAvatarUrl = `${backendUrl}/images/default-avatar.jpg`;
    let stompClient = null; 
    let currentUser = null;


    // --- FUNÇÕES DE CONTROLE DE TEMA ---
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

    // --- ELEMENTOS DO DOM ---
    const elements = {
        // Elementos da página de perfil
        profileName: document.getElementById('profile-name'),
        profileTitle: document.getElementById('profile-title'),
        profilePicImg: document.getElementById('profile-pic-img'),
        profileBio: document.getElementById('profile-bio'),
        profileEmail: document.getElementById('profile-email'),
        profileDob: document.getElementById('profile-dob'),
        editProfileBtnPage: document.getElementById('edit-profile-btn-page'),
        notificationCenter: document.querySelector('.notification-center'),

        // Elementos da UI geral (reutilizados)
        topbarUserName: document.getElementById('topbar-user-name'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarUserTitle: document.getElementById('sidebar-user-title'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        sidebarUserImg: document.getElementById('sidebar-user-img'),
        logoutBtn: document.getElementById('logout-btn'),
        userDropdownTrigger: document.querySelector('.user-dropdown .user'),

        // Modais de Conta de Usuário
        editProfileBtn: document.getElementById('edit-profile-btn'),
        deleteAccountBtn: document.getElementById('delete-account-btn'),
        editProfileModal: document.getElementById('edit-profile-modal'),
        editProfileForm: document.getElementById('edit-profile-form'),
        cancelEditProfileBtn: document.getElementById('cancel-edit-profile-btn'),
        editProfilePicInput: document.getElementById('edit-profile-pic-input'),
        editProfilePicPreview: document.getElementById('edit-profile-pic-preview'),
        editProfileName: document.getElementById('edit-profile-name'),
        editProfileBio: document.getElementById('edit-profile-bio'),
        editProfileDob: document.getElementById('edit-profile-dob'),
        editProfilePassword: document.getElementById('edit-profile-password'),
        editProfilePasswordConfirm: document.getElementById('edit-profile-password-confirm'),

        deleteAccountModal: document.getElementById('delete-account-modal'),
        deleteAccountForm: document.getElementById('delete-account-form'),
        cancelDeleteAccountBtn: document.getElementById('cancel-delete-account-btn'),
        deleteConfirmPassword: document.getElementById('delete-confirm-password'),

        notificationsIcon: document.getElementById('notifications-icon'),
        notificationsPanel: document.getElementById('notifications-panel'),
        notificationsList: document.getElementById('notifications-list'),
        notificationsBadge: document.getElementById('notifications-badge'),
        onlineFriendsList: document.getElementById('online-friends-list'),
        connectionsCount: document.getElementById('connections-count')
    };

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!jwtToken) {
            window.location.href = 'login.html';
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        try {
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;

            updateUIWithUserData(currentUser);
            populateProfileData(currentUser);
            connectWebSocket();
            fetchUserConnections(); 
            fetchNotifications()
            setupEventListeners();
            setInitialTheme();
        } catch (error) {
            console.error("ERRO CRÍTICO NA INICIALIZAÇÃO DO PERFIL:", error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }

    // --- NOVA FUNÇÃO PARA BUSCAR CONEXÕES ---
    async function fetchUserConnections() {
        if (!elements.connectionsCount) return;
        try {
            const response = await axios.get(`${backendUrl}/api/amizades/`);
            elements.connectionsCount.textContent = response.data.length;
        } catch (error) {
            console.error("Erro ao buscar conexões:", error);
            elements.connectionsCount.textContent = '0';
        }
    }


    // --- FUNÇÕES DE UI ---

    // Preenche os dados da página de perfil
    function populateProfileData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
        const userDob = user.dataNascimento ? new Date(user.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado';

        if (elements.profileName) elements.profileName.textContent = user.nome;
        if (elements.profileTitle) elements.profileTitle.textContent = user.titulo || 'Membro da Comunidade';
        if (elements.profilePicImg) elements.profilePicImg.src = userImage;
        if (elements.profileBio) elements.profileBio.textContent = user.bio || 'Nenhuma bio informada.';
        if (elements.profileEmail) elements.profileEmail.textContent = user.email;
        if (elements.profileDob) elements.profileDob.textContent = userDob;
    }

    // Preenche os dados do header e sidebar
    function updateUIWithUserData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
        if (elements.topbarUserName) elements.topbarUserName.textContent = user.nome;
        if (elements.sidebarUserName) elements.sidebarUserName.textContent = user.nome;
        if (elements.sidebarUserTitle) elements.sidebarUserTitle.textContent = user.titulo || 'Membro da Comunidade';
        if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
        if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
    }

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
            elements.notificationsBadge.style.display = unreadCount > 0 ? 'flex' : 'none';
            elements.notificationsBadge.textContent = unreadCount;
        }

        if (notifications.length === 0) {
            elements.notificationsList.innerHTML = '<p class="empty-state">Nenhuma notificação.</p>';
            return;
        }

        notifications.forEach(notification => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.id = `notification-item-${notification.id}`;
            if (!notification.lida) item.classList.add('unread');

            const data = new Date(notification.dataCriacao).toLocaleString('pt-BR');
            let actionButtonsHtml = '';
            let iconClass = 'fa-info-circle';

            if (notification.tipo === 'PEDIDO_AMIZADE' && !notification.lida) {
                iconClass = 'fa-user-plus';
                // Os botões de aceitar/recusar precisam ser definidos globalmente ou importados se for usar aqui
                actionButtonsHtml = `
              <div class="notification-actions">
                 <button class="btn btn-sm btn-primary" onclick="window.aceitarSolicitacao(${notification.idReferencia}, ${notification.id})">Aceitar</button>
                 <button class="btn btn-sm btn-secondary" onclick="window.recusarSolicitacao(${notification.idReferencia}, ${notification.id})">Recusar</button>
              </div>
            `;
            }

            item.innerHTML = `
             <a href="amizades.html" class="notification-link" onclick="markNotificationAsRead(event, ${notification.id})">
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

            elements.notificationsList.appendChild(item);
        });
    }

    async function markNotificationAsRead(event, notificationId) { // Adicione 'event'
    if (event) {
        event.preventDefault(); // Adicione esta linha
    }
    const notificationItem = document.getElementById(`notification-item-${notificationId}`);
    if (!notificationItem || !notificationItem.classList.contains('unread')) {
        // Apenas navegue se já estiver lida
        if (event && event.currentTarget) window.location.href = event.currentTarget.href;
        return;
    }
    notificationItem.classList.remove('unread');
    try {
        await axios.post(`${backendUrl}/api/notificacoes/${notificationId}/ler`);
        fetchNotifications();
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        notificationItem.classList.add('unread');
        showNotification('Erro ao atualizar notificação.', 'error');
    } finally {
        // Navegue após a conclusão
        if (event && event.currentTarget) {
            window.location.href = event.currentTarget.href;
        }
    }
}

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        if (elements.notificationCenter) elements.notificationCenter.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => { notification.remove(); }, 300);
        }, 5000);
    }

    function connectWebSocket() {
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; 
        const headers = { Authorization: `Bearer ${jwtToken}` };
        
        stompClient.connect(headers, () => {
            console.log("CONECTADO AO WEBSOCKET (Perfil)");
        }, (error) => {
            console.error("ERRO WEBSOCKET (Perfil):", error);
        });
    }

    // --- LÓGICA DOS MODAIS E MENUS ---

    const closeAllMenus = () => {
        document.querySelectorAll('.options-menu, .dropdown-menu').forEach(m => m.style.display = 'none');
    };

    function openEditProfileModal() {
        if (!currentUser || !elements.editProfileModal) return;
        elements.editProfilePicPreview.src = currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl;
        elements.editProfileName.value = currentUser.nome;
        elements.editProfileBio.value = currentUser.bio || '';
        if (currentUser.dataNascimento) {
            elements.editProfileDob.value = currentUser.dataNascimento.split('T')[0];
        }
        elements.editProfilePassword.value = '';
        elements.editProfilePasswordConfirm.value = '';
        elements.editProfileModal.style.display = 'flex';
    }

    function openDeleteAccountModal() {
        if (elements.deleteConfirmPassword) elements.deleteConfirmPassword.value = '';
        if (elements.deleteAccountModal) elements.deleteAccountModal.style.display = 'flex';
    }

    // --- SETUP DOS EVENT LISTENERS ---
    function setupEventListeners() {
        const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
        document.body.addEventListener('click', closeAllMenus);

        // Listener para abrir o dropdown do usuário
        if (elements.userDropdownTrigger) {
            elements.userDropdownTrigger.addEventListener('click', (event) => {
                event.stopPropagation();
                const menu = elements.userDropdownTrigger.nextElementSibling;
                if (menu && menu.classList.contains('dropdown-menu')) {
                    const isVisible = menu.style.display === 'block';
                    closeAllMenus();
                    if (!isVisible) {
                        menu.style.display = 'block';
                    }
                }
            });
        }

        // Listener para os botões do dropdown e da página
        if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
        if (elements.editProfileBtn) elements.editProfileBtn.addEventListener('click', openEditProfileModal);
        if (elements.editProfileBtnPage) elements.editProfileBtnPage.addEventListener('click', openEditProfileModal); // Botão da página
        if (elements.deleteAccountBtn) elements.deleteAccountBtn.addEventListener('click', openDeleteAccountModal);

        // Listeners do Modal de Edição de Perfil
        if (elements.cancelEditProfileBtn) elements.cancelEditProfileBtn.addEventListener('click', () => elements.editProfileModal.style.display = 'none');
        if (elements.editProfilePicInput) elements.editProfilePicInput.addEventListener('change', () => {
            const file = elements.editProfilePicInput.files[0];
            if (file && elements.editProfilePicPreview) {
                elements.editProfilePicPreview.src = URL.createObjectURL(file);
            }
        });

        if (elements.editProfileForm) elements.editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            let userUpdated = false;

            // 1. Atualiza a foto, se houver uma nova
            if (elements.editProfilePicInput.files[0]) {
                const formData = new FormData();
                formData.append('foto', elements.editProfilePicInput.files[0]);
                try {
                    const response = await axios.put(`${backendUrl}/usuarios/me/foto`, formData);
                    currentUser = response.data; // Atualiza currentUser com a nova URL da foto
                    userUpdated = true;
                    showNotification('Foto de perfil atualizada!', 'success');
                } catch (error) {
                    showNotification('Erro ao atualizar a foto.', 'error');
                    console.error("Erro na foto:", error);
                }
            }

            // 2. Atualiza os dados de texto
            const password = elements.editProfilePassword.value;
            const passwordConfirm = elements.editProfilePasswordConfirm.value;
            if (password && password !== passwordConfirm) {
                showNotification('As novas senhas não coincidem.', 'error');
                return;
            }
            const updateData = {
                nome: elements.editProfileName.value,
                bio: elements.editProfileBio.value,
                dataNascimento: elements.editProfileDob.value ? new Date(elements.editProfileDob.value).toISOString() : null,
                senha: password || null
            };

            try {
                const response = await axios.put(`${backendUrl}/usuarios/me`, updateData);
                currentUser = response.data; // Atualiza currentUser com os novos dados
                userUpdated = true;
            } catch (error) {
                showNotification('Erro ao atualizar o perfil.', 'error');
                console.error("Erro no perfil:", error);
            }

            // 3. Se qualquer atualização foi bem-sucedida, atualiza a UI e fecha o modal
            if (userUpdated) {
                updateUIWithUserData(currentUser);
                populateProfileData(currentUser);
                showNotification('Perfil atualizado com sucesso!', 'success');
                elements.editProfileModal.style.display = 'none';
            }
        });

        // Listeners do Modal de Exclusão de Conta
        if (elements.cancelDeleteAccountBtn) elements.cancelDeleteAccountBtn.addEventListener('click', () => elements.deleteAccountModal.style.display = 'none');
        if (elements.deleteAccountForm) elements.deleteAccountForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = elements.deleteConfirmPassword.value;
            if (!password) {
                showNotification('Por favor, digite sua senha para confirmar.', 'error');
                return;
            }
            try {
                // Passo 1: Verifica a senha tentando fazer login
                await axios.post(`${backendUrl}/autenticacao/login`, { email: currentUser.email, senha: password });

                // Passo 2: Se o login deu certo, a senha está correta
                if (confirm("Você tem ABSOLUTA CERTEZA? Esta ação não pode ser desfeita.")) {
                    await axios.delete(`${backendUrl}/usuarios/me`);
                    alert("Sua conta foi excluída com sucesso.");
                    localStorage.clear();
                    window.location.href = 'login.html';
                }
            } catch (error) {
                showNotification('Senha incorreta. A conta não foi excluída.', 'error');
                console.error("Erro na confirmação de senha:", error);
            }
        });
    }

    // Ponto de entrada da aplicação
    init();
});