document.addEventListener('DOMContentLoaded', () => {
    // ==================== CONFIGURAÇÃO DA API ====================
    const API_BASE_URL = 'http://localhost:8080';
    const token = localStorage.getItem('token');
    
    // Se não houver token, redireciona para a página de login
    if (!token) {
        alert('Você não está logado. Redirecionando para a página de login.');
        window.location.href = '../../login.html'; // Ajuste o caminho conforme necessário
        return;
    }

    // Cria uma instância do Axios com o token de autorização padrão
    const apiClient = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    // Função para decodificar o token JWT e obter informações do usuário
    const getUserInfoFromToken = () => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Assumindo que seu token agora contém 'userId' e 'tipoUsuario'
            return {
                userId: payload.userId,
                userType: payload.tipoUsuario // 'Aluno' ou 'Professor'
            };
        } catch (error) {
            console.error('Erro ao decodificar o token:', error);
            logout(); // Se o token for inválido, desloga
            return null;
        }
    };

    // ==================== ELEMENTOS DO DOM ====================
    // Topo
    const topbarUserName = document.querySelector('.user-dropdown .user span');
    const topbarUserPic = document.querySelector('.user-dropdown .profile-pic img');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Sidebar
    const sidebarAvatarImg = document.querySelector('.sidebar .user-info .avatar img');
    const sidebarUserName = document.querySelector('.sidebar .user-info h2');
    const sidebarUserTitle = document.querySelector('.sidebar .user-info .user-title');

    // Conteúdo principal
    const postsContainer = document.querySelector('.posts-container');
    const postCreatorInput = document.getElementById('post-creator-input');
    const postCreatorAvatar = document.querySelector('.post-creator .avatar-small img');
    
    // Modal
    const createPostModal = document.getElementById('create-post-modal');
    const openModalBtn = document.getElementById('open-post-modal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createPostForm = document.getElementById('create-post-form');


    // ==================== FUNÇÕES DA API ====================

    // Função para carregar e preencher os dados do usuário
    async function loadUserProfile() {
        const userInfo = getUserInfoFromToken();
        if (!userInfo || !userInfo.userType) { // Validação extra
            console.error("Tipo de usuário não encontrado no token.");
            logout();
            return;
        }

        // Backend usa plural (ex: /alunos/{id})
        const endpoint = `/${userInfo.userType.toLowerCase()}s/${userInfo.userId}`;

        try {
            const response = await apiClient.get(endpoint);
            const user = response.data;

            // Preenche os dados nos locais corretos
            const defaultAvatar = 'https://via.placeholder.com/80';
            const userAvatar = user.fotoPerfil || defaultAvatar;

            if (topbarUserName) topbarUserName.textContent = user.nome;
            if (topbarUserPic) topbarUserPic.src = userAvatar;
            
            if (sidebarAvatarImg) sidebarAvatarImg.src = userAvatar;
            if (sidebarUserName) sidebarUserName.textContent = user.nome;
            if (sidebarUserTitle) sidebarUserTitle.textContent = user.curso || user.formacao || 'Membro da Comunidade';
            
            if (postCreatorAvatar) postCreatorAvatar.src = userAvatar;
            if (postCreatorInput) postCreatorInput.placeholder = `Compartilhe seu projeto, ${user.nome.split(' ')[0]}...`;

        } catch (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
            showNotification('Não foi possível carregar seus dados.', 'error');
        }
    }

    // Função para renderizar as postagens no feed
    function renderPosts(posts) {
        postsContainer.innerHTML = ''; // Limpa o feed antes de adicionar os novos posts
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Ainda não há publicações. Que tal criar uma?</p>';
            return;
        }

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'post';
            postElement.dataset.id = post.id;

            // Mídia (imagens/vídeos)
            let mediaHtml = '';
            if (post.arquivosMidia && post.arquivosMidia.length > 0) {
                mediaHtml = '<div class="post-images">'; // Usando a classe existente
                post.arquivosMidia.forEach(media => {
                    mediaHtml += `<img src="${media.url}" alt="Mídia do post">`;
                });
                mediaHtml += '</div>';
            }

            // Tratamento de data
            const postDate = new Date(post.dataCriacao);
            const formattedDate = postDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) + ' às ' + postDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-author">
                        <div class="post-icon">
                            <img src="${post.autor.fotoPerfil || 'https://via.placeholder.com/40'}" alt="${post.autor.nome}">
                        </div>
                        <div class="post-info">
                            <h2>${post.autor.nome}</h2>
                            <span>${formattedDate} • <i class="fas fa-globe-americas"></i></span>
                        </div>
                    </div>
                    <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
                </div>
                <div class="post-text">${post.conteudo}</div>
                ${mediaHtml}
                <div class="post-actions">
                    <button class="like-btn"><i class="far fa-thumbs-up"></i> <span>Curtir</span> <span class="count">0</span></button>
                    <button class="comment-btn"><i class="far fa-comment"></i> <span>Comentar</span> <span class="count">0</span></button>
                    <button class="share-btn"><i class="far fa-share-square"></i> <span>Compartilhar</span></button>
                </div>
            `;
            postsContainer.appendChild(postElement);
            addPostEvents(postElement); // Adiciona os eventos de interação
        });
    }

    // Função para carregar postagens da API
    async function loadPosts() {
        try {
            // ✅ CORREÇÃO AQUI: de '/postagens' para '/postagem'
            const response = await apiClient.get('/postagem');
            const sortedPosts = response.data.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            renderPosts(sortedPosts);
        } catch (error) {
            console.error('Erro ao carregar as postagens:', error);
            postsContainer.innerHTML = '<p class="error-message">Não foi possível carregar o feed.</p>';
        }
    }

    // Função para criar uma nova postagem
    async function handlePostSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        const formData = new FormData();
        const postData = {
            conteudo: form.querySelector('textarea').value
        };

        formData.append('postagem', new Blob([JSON.stringify(postData)], { type: 'application/json' }));
        
        const files = document.getElementById('file-input').files;
        for (let i = 0; i < files.length; i++) {
            formData.append('arquivos', files[i]);
        }

        submitButton.disabled = true;
        submitButton.textContent = 'Publicando...';

        try {
            // ✅ CORREÇÃO AQUI: de '/postagens' para '/postagem'
            await apiClient.post('/postagem', formData);
            showNotification('Postagem criada com sucesso!', 'success');
            form.reset();
            createPostModal.style.display = 'none'; // Fecha o modal
            loadPosts(); // Recarrega o feed
        } catch (error) {
            console.error('Erro ao criar postagem:', error);
            showNotification('Falha ao criar postagem.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Publicar';
        }
    }
    
    // Função de logout
    function logout() {
        localStorage.removeItem('token');
        showNotification('Deslogando...', 'info');
        setTimeout(() => {
            window.location.href = '../../login.html'; // Ajuste o caminho
        }, 1500);
    }

    // ==================== PRESERVAÇÃO DAS SUAS FUNÇÕES ORIGINAIS ====================
    
    // Gerenciamento de tema
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    themeToggle.addEventListener('click', () => {
        const newTheme = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    function updateThemeIcon(theme) {
        themeToggle.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }

    // Menu mobile
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth <= 768) {
        menuToggle.style.display = 'block';
        sidebar.classList.add('mobile-hidden');
    }
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-hidden');
        menuToggle.innerHTML = sidebar.classList.contains('mobile-hidden') ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
    });

    // Dropdown do usuário
    const userDropdown = document.querySelector('.user-dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', () => {
        dropdownMenu.style.display = 'none';
    });
    
    // Interações com posts (like, etc. - mantido como UI-only por enquanto)
    function addPostEvents(postElement) {
        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => {
            likeBtn.classList.toggle('liked');
            const icon = likeBtn.querySelector('i');
            const count = likeBtn.querySelector('.count');
            const isLiked = likeBtn.classList.contains('liked');
            icon.className = isLiked ? 'fas fa-thumbs-up' : 'far fa-thumbs-up';
            // TODO: Fazer chamada à API para registrar a curtida
        });
        // ... (outros eventos como comentário e compartilhamento podem ser adicionados aqui)
    }

    // Notificações
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.querySelector('.notification-center').appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // ==================== INICIALIZAÇÃO E EVENTOS ====================
    
    function init() {
        // Carrega dados da API
        loadUserProfile();
        loadPosts();
        // Conectar WebSocket (opcional, pode ser expandido depois)
        // connectWebSocket();

        // Adiciona eventos
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });

        // Eventos do modal de postagem
        const openPostTriggers = [openModalBtn, postCreatorInput, ...document.querySelectorAll('.post-options .option-btn')];
        openPostTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                createPostModal.style.display = 'flex';
            });
        });
        
        closeModalBtn.addEventListener('click', () => {
            createPostModal.style.display = 'none';
        });

        createPostModal.addEventListener('click', (e) => {
            if (e.target === createPostModal) { // Fecha se clicar fora do conteúdo
                createPostModal.style.display = 'none';
            }
        });

        createPostForm.addEventListener('submit', handlePostSubmit);

        // Mensagem de boas-vindas
        setTimeout(() => {
            const userName = (topbarUserName.textContent || 'usuário').split(' ')[0];
            if(userName && userName !== 'Carregando...') {
                 showNotification(`Bem-vindo de volta, ${userName}!`, 'success');
            }
        }, 2000);
    }
    
    init();
});