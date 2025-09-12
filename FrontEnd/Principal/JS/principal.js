// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    // ==================== CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ====================
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    const defaultAvatarUrl = `${backendUrl}/images/default-avatar.png`;
    let currentUser = null;
    let stompClient = null;

    // --- ELEMENTOS DO DOM ---
    const elements = {
        // UI Geral
        topbarUserName: document.getElementById('topbar-user-name'),
        sidebarUserName: document.getElementById('sidebar-user-name'),
        sidebarUserTitle: document.getElementById('sidebar-user-title'),
        topbarUserImg: document.getElementById('topbar-user-img'),
        sidebarUserImg: document.getElementById('sidebar-user-img'),
        logoutBtn: document.getElementById('logout-btn'),
        userDropdownTrigger: document.querySelector('.user-dropdown .user'),
        notificationCenter: document.querySelector('.notification-center'),

        // Feed e Posts
        postsContainer: document.querySelector('.posts-container'),
        postCreatorSimpleView: document.querySelector('.post-creator-simple'),
        postCreatorExpandedView: document.querySelector('.post-creator-expanded'),
        simpleViewTrigger: document.querySelector('.post-creator-trigger'),
        cancelBtn: document.querySelector('.post-creator-expanded .cancel-btn'),
        publishBtn: document.querySelector('.post-creator-expanded .publish-btn'),
        textarea: document.querySelector('.post-creator-expanded .editor-textarea'),
        mediaPreviewContainer: document.querySelector('.media-preview-container'),
        fileInput: document.getElementById('post-media-input'), // Novo input de arquivo
        photoOptionBtn: document.querySelector('.editor-options [data-type="photo"]'),

        // Modais de Edição de Perfil (adicionados para compatibilidade)
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

        // Modais de Deletar Conta (adicionados para compatibilidade)
        deleteAccountModal: document.getElementById('delete-account-modal'),
        deleteAccountForm: document.getElementById('delete-account-form'),
        deleteConfirmPassword: document.getElementById('delete-confirm-password')
    };

    // ==================== FUNÇÕES DE UI E NOTIFICAÇÕES ====================

    function showNotification(message, type = 'info') {
        if (!elements.notificationCenter) return;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notificationCenter.appendChild(notification);
        setTimeout(() => { notification.classList.add('show'); }, 10);
        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 5000); // tempo de 5s para notificações
    }
    
    // ==================== INICIALIZAÇÃO DA APLICAÇÃO ====================
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
            setupEventListeners();
            connectToWebSocket();
            await loadInitialPosts();
            loadOnlineFriends();
            loadAllWidgets();
        } catch (error) {
            console.error("ERRO CRÍTICO NA INICIALIZAÇÃO:", error);
            showNotification("Sessão expirada. Por favor, faça login novamente.", "error");
            localStorage.removeItem('token');
            setTimeout(() => { window.location.href = 'login.html'; }, 3000);
        }
    }

    function updateUIWithUserData(user) {
        if (!user) return;
        const userImage = user.urlFotoPerfil ? `${backendUrl}${user.urlFotoPerfil}` : defaultAvatarUrl;
        if (elements.topbarUserImg) elements.topbarUserImg.src = userImage;
        if (elements.sidebarUserImg) elements.sidebarUserImg.src = userImage;
        document.querySelectorAll('.post-icon img, .add-comment .avatar-small img, .post-creator-trigger img').forEach(img => img.src = userImage);
    }
    
    // ==================== LÓGICA DO FEED (CRIAÇÃO, EXIBIÇÃO, INTERAÇÕES) ====================

    async function loadInitialPosts() {
        if (!elements.postsContainer) return;
        try {
            const response = await axios.get(`${backendUrl}/api/chat/publico`);
            const posts = response.data.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            elements.postsContainer.innerHTML = '';
            posts.forEach(postData => {
                renderPost(postData);
            });
        } catch (error) {
            console.error("Erro ao carregar posts iniciais:", error);
            showNotification("Não foi possível carregar o feed.", "error");
        }
    }

    function renderPost(postData, prepend = false) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.dataset.id = postData.id;
        postElement.dataset.autorId = postData.autorId;

        const isMyPost = postData.autorId === currentUser.id;
        
        const postImage = postData.urlFotoAutor ? `${backendUrl}/api/arquivos/${postData.urlFotoAutor}` : defaultAvatarUrl;

        const formattedDate = formatTimeAgo(postData.dataCriacao);

        // --- AQUI ESTÁ A CORREÇÃO ---
        const mediaUrl = postData.urlsMidia && postData.urlsMidia.length > 0 ? postData.urlsMidia[0] : null;
        const finalMediaUrl = mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('https')) ? mediaUrl : `${backendUrl}${mediaUrl}`;
        const mediaHTML = finalMediaUrl ? `<div class="post-images"><img src="${finalMediaUrl}" alt="Post image"></div>` : '';
        // --- FIM DA CORREÇÃO ---

        const commentsHTML = postData.comentarios.map(comment => renderComment(comment)).join('');
        const likeCount = postData.totalCurtidas || 0;
        const commentCount = postData.comentarios?.length || 0;
        const isLiked = postData.curtidoPeloUsuario;

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author">
                    <div class="post-icon">
                        <img src="${postImage}" alt="${postData.nomeAutor}">
                    </div>
                    <div class="post-info">
                        <h2><a href="perfil.html?id=${postData.autorId}" class="post-author-link">${postData.nomeAutor}</a></h2>
                        <span>${formattedDate} • <i class="fas fa-globe-americas"></i></span>
                    </div>
                </div>
                <div class="post-options-btn"><i class="fas fa-ellipsis-h"></i></div>
            </div>
            <div class="post-text">${postData.conteudo || ''}</div>
            ${mediaHTML}
            <div class="post-actions">
                <button class="like-btn ${isLiked ? 'liked' : ''}" data-post-id="${postData.id}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-thumbs-up"></i> 
                    <span>Curtir</span> 
                    <span class="count">${likeCount}</span>
                </button>
                <button class="comment-btn">
                    <i class="far fa-comment"></i> 
                    <span>Comentar</span> 
                    <span class="count">${commentCount}</span>
                </button>
                <button class="share-btn">
                    <i class="far fa-share-square"></i> 
                    <span>Compartilhar</span>
                </button>
            </div>
            <div class="post-comments">${commentsHTML}</div>
            <div class="add-comment">
                <div class="avatar-small">
                    <img src="${currentUser.urlFotoPerfil ? `${backendUrl}${currentUser.urlFotoPerfil}` : defaultAvatarUrl}" alt="${currentUser.nome}">
                </div>
                <input type="text" placeholder="Adicione um comentário..." data-post-id="${postData.id}">
            </div>
        `;
        
        if (prepend) {
            elements.postsContainer.prepend(postElement);
        } else {
            elements.postsContainer.appendChild(postElement);
        }

        addPostEvents(postElement);
    }

    function renderComment(commentData) {
        const isMyComment = commentData.autorId === currentUser.id;
        const commentImage = commentData.urlFotoAutor ? `${backendUrl}/api/arquivos/${commentData.urlFotoAutor}` : defaultAvatarUrl;
        const formattedTime = formatTimeAgo(commentData.dataCriacao);
        const isHighlighted = commentData.destacado ? 'highlighted-comment' : '';

        return `
            <div class="comment ${isHighlighted}" data-comment-id="${commentData.id}" data-author-id="${commentData.autorId}">
                <div class="avatar-small">
                    <img src="${commentImage}" alt="${commentData.nomeAutor}">
                </div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author"><a href="perfil.html?id=${commentData.autorId}" class="post-author-link">${commentData.nomeAutor}</a></span>
                        <span class="comment-time">${formattedTime}</span>
                        ${isMyComment ? `<button class="comment-options-btn"><i class="fas fa-ellipsis-h"></i></button>` : ''}
                    </div>
                    <p>${commentData.conteudo}</p>
                </div>
            </div>`;
    }

    function formatTimeAgo(dateString) {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);
        const minute = 60;
        const hour = minute * 60;
        const day = hour * 24;
        const month = day * 30;
        const year = day * 365;

        if (diffInSeconds < minute) return "agora";
        if (diffInSeconds < hour) return `${Math.floor(diffInSeconds / minute)}m`;
        if (diffInSeconds < day) return `${Math.floor(diffInSeconds / hour)}h`;
        if (diffInSeconds < month) return `${Math.floor(diffInSeconds / day)}d`;
        if (diffInSeconds < year) return `${Math.floor(diffInSeconds / year)}a`;
        return `${Math.floor(diffInSeconds / year)}a`;
    }

    // ==================== LÓGICA DE WEBSOCKETS (STOMP.JS) ====================

    function connectToWebSocket() {
        if (stompClient) return;

        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);

        stompClient.connect({ Authorization: `Bearer ${jwtToken}` }, frame => {
            console.log('Conectado ao WebSocket: ' + frame);

            stompClient.subscribe('/topic/publico', message => {
                const payload = JSON.parse(message.body);
                handleWebSocketMessage(payload);
            });
        }, error => {
            console.error('Erro na conexão WebSocket', error);
            showNotification('Falha na conexão em tempo real.', 'error');
            setTimeout(connectToWebSocket, 5000);
        });
    }

    function handleWebSocketMessage(payload) {
        const existingPost = document.querySelector(`.post[data-id="${payload.id}"]`);
        
        // Se a postagem não existir, renderiza-a.
        if (!existingPost) {
            renderPost(payload, true);
            showNotification('Nova postagem no feed!', 'info');
        } else {
            // Lógica para atualizar um post existente com base no 'tipo' de mensagem.
            if (payload.tipo === 'edicao' || payload.tipo === 'remocao') {
                const postagemAtualizada = payload.postagem;
                if(postagemAtualizada) {
                    const postTextEl = existingPost.querySelector('.post-text');
                    postTextEl.textContent = postagemAtualizada.conteudo;
                    // Atualiza a mídia se houver
                    const mediaContainer = existingPost.querySelector('.post-images');
                    if(mediaContainer) {
                        mediaContainer.innerHTML = postagemAtualizada.urlsMidia && postagemAtualizada.urlsMidia.length > 0
                            ? `<img src="${backendUrl}${postagemAtualizada.urlsMidia[0]}" alt="Post image">` : '';
                    }
                    showNotification('Uma postagem foi editada.', 'info');
                } else if (payload.id) { // Caso seja apenas a remoção, sem a postagem completa
                    existingPost.remove();
                    showNotification('Uma postagem foi removida.', 'info');
                }
            } else {
                // Lógica para atualizar curtidas e comentários
                const likesCountEl = existingPost.querySelector('.like-btn .count');
                likesCountEl.textContent = payload.totalCurtidas || 0;
    
                const commentsContainer = existingPost.querySelector('.post-comments');
                if (payload.comentarios) {
                    commentsContainer.innerHTML = payload.comentarios.map(c => renderComment(c)).join('');
                    const commentsCountEl = existingPost.querySelector('.comment-btn .count');
                    commentsCountEl.textContent = payload.comentarios.length || 0;
                }
            }
        }
    }


    // ==================== EVENT LISTENERS E INTERAÇÕES DO FEED ====================
    function setupEventListeners() {
        // Dropdown do usuário
        document.body.addEventListener('click', () => {
            const dropdownMenu = document.querySelector('.user-dropdown .dropdown-menu');
            if (dropdownMenu) dropdownMenu.style.display = 'none';
        });

        if (elements.userDropdownTrigger) {
            elements.userDropdownTrigger.addEventListener('click', (event) => {
                event.stopPropagation();
                const dropdownMenu = elements.userDropdownTrigger.nextElementSibling;
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            });
        }
        
        // Logout
        document.querySelector('.dropdown-menu a[href="login.html"]').addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'login.html';
        });

        // Eventos do modal de criação de post
        if (elements.simpleViewTrigger) elements.simpleViewTrigger.addEventListener('click', openPostCreator);
        if (elements.cancelBtn) elements.cancelBtn.addEventListener('click', closePostCreator);
        if (elements.textarea) elements.textarea.addEventListener('input', () => {
            elements.publishBtn.disabled = !elements.textarea.value.trim();
        });

        // Envio do post
        if (elements.publishBtn) elements.publishBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const content = elements.textarea.value.trim();
            if (!content) return;
            
            const formData = new FormData();
            
            // --- CÓDIGO CORRETO ---
            const postagemDto = {
                conteudo: content,
                projetoId: null,
                urlsParaRemover: null
            };

            formData.append(
              "postagem",
              new Blob([JSON.stringify(postagemDto)], {
                type: "application/json",
              })
            );
            
            if (elements.fileInput && elements.fileInput.files[0]) {
                formData.append('arquivos', elements.fileInput.files[0]);
            }
            
            try {
                await axios.post(`${backendUrl}/postagem/upload-mensagem`, formData);
                showNotification('Postagem criada com sucesso!', 'success');
                closePostCreator();
            } catch (error) {
                console.error('Erro ao criar postagem:', error);
                showNotification('Erro ao criar postagem. Verifique os dados e tente novamente.', 'error');
            }
        });
        
        // Botão de upload de mídia
        if (elements.photoOptionBtn) {
            const mediaInput = document.createElement('input');
            mediaInput.type = 'file';
            mediaInput.id = 'post-media-input';
            mediaInput.accept = 'image/*,video/*';
            mediaInput.style.display = 'none';
            document.body.appendChild(mediaInput);

            elements.photoOptionBtn.addEventListener('click', () => {
                mediaInput.click();
            });

            mediaInput.addEventListener('change', () => {
                const file = mediaInput.files[0];
                if (file) {
                    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
                    const mediaElement = mediaType === 'image' ? document.createElement('img') : document.createElement('video');
                    mediaElement.src = URL.createObjectURL(file);
                    
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-media-btn';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.onclick = () => {
                        elements.mediaPreviewContainer.innerHTML = '';
                        mediaInput.value = '';
                    };

                    elements.mediaPreviewContainer.innerHTML = '';
                    elements.mediaPreviewContainer.appendChild(mediaElement);
                    elements.mediaPreviewContainer.appendChild(removeBtn);
                    openPostCreator();
                }
            });
        }
    }

    // Funções do modal de criação de postagem
    function openPostCreator() {
        elements.postCreatorSimpleView.style.display = 'none';
        elements.postCreatorExpandedView.style.display = 'block';
        elements.textarea.focus();
    }

    function closePostCreator() {
        elements.postCreatorSimpleView.style.display = 'flex';
        elements.postCreatorExpandedView.style.display = 'none';
        elements.textarea.value = '';
        elements.publishBtn.disabled = true;
        if (elements.mediaPreviewContainer) {
            elements.mediaPreviewContainer.innerHTML = '';
        }
        if (elements.fileInput) {
            elements.fileInput.value = '';
        }
    }

    // Funções para lidar com eventos em posts renderizados
    function addPostEvents(postElement) {
        // Lógica para o menu de opções do post
        const optionsBtn = postElement.querySelector('.post-options-btn');
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPostOptionsMenu(postElement, e.currentTarget);
        });

        // Lógica para curtir um post
        const likeBtn = postElement.querySelector('.like-btn');
        likeBtn.addEventListener('click', async () => {
            const postId = likeBtn.dataset.postId;
            try {
                await axios.post(`${backendUrl}/curtidas/toggle`, { postagemId: postId });
                // A UI será atualizada pelo WebSocket
            } catch (error) {
                console.error("Erro ao curtir:", error);
                showNotification('Não foi possível curtir a postagem.', 'error');
            }
        });

        // Lógica para comentar
        const commentInput = postElement.querySelector('.add-comment input');
        commentInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter' && commentInput.value.trim()) {
                const postId = commentInput.dataset.postId;
                const content = commentInput.value.trim();
                try {
                    await axios.post(`${backendUrl}/comentarios`, {
                        postagem: { id: postId },
                        conteudo: content
                    });
                    showNotification('Comentário adicionado!', 'success');
                    commentInput.value = '';
                    // A UI será atualizada pelo WebSocket
                } catch (error) {
                    console.error("Erro ao comentar:", error);
                    showNotification('Não foi possível adicionar o comentário.', 'error');
                }
            }
        });
    }

    // Função para mostrar o menu de opções do post
    function showPostOptionsMenu(postElement, targetButton) {
        document.querySelectorAll('.post-options-menu').forEach(menu => menu.remove());
        const postId = postElement.dataset.id;
        const postAuthorId = postElement.dataset.autorId;
        const isMyPost = postAuthorId == currentUser.id;

        const menu = document.createElement('div');
        menu.className = 'post-options-menu';
        
        let menuHTML = `<button data-action="save"><i class="far fa-bookmark"></i> Salvar</button>`;
        if (isMyPost) {
            menuHTML += `<button data-action="edit"><i class="far fa-edit"></i> Editar</button>
                         <button data-action="delete" class="delete-btn"><i class="far fa-trash-alt"></i> Excluir</button>`;
        }
        menu.innerHTML = menuHTML;
        document.body.appendChild(menu);
        
        const rect = targetButton.getBoundingClientRect();
        menu.style.top = `${rect.bottom + window.scrollY}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;

        menu.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
            if (confirm("Tem certeza que deseja excluir esta postagem?")) {
                try {
                    await axios.delete(`${backendUrl}/postagem/${postId}`);
                    // A UI será atualizada pelo WebSocket
                    showNotification('Postagem excluída com sucesso!', 'success');
                } catch (error) {
                    console.error('Erro ao excluir postagem:', error);
                    showNotification('Erro ao excluir postagem.', 'error');
                }
            }
            menu.remove();
        });
        
        menu.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
            showNotification('Funcionalidade de edição em desenvolvimento.', 'info');
            menu.remove();
        });

        setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 10);
    }

    // ==================== WIDGETS E OUTRAS FUNÇÕES AUXILIARES ====================
    function loadOnlineFriends() {
        const onlineFriendsContainer = document.querySelector('.online-friends');
        if (!onlineFriendsContainer) return;
        const mockFriends = [
            { id: 'miguel', name: "Miguel Piscki", avatar: "https://randomuser.me/api/portraits/men/22.jpg", status: "online" },
            { id: 'senai', name: "Senai", avatar: "https://yt3.googleusercontent.com/wyGnsuVLCBoHStdhQ3Tj7Wr48yb_Oi2e1OmP2Rly99xB6wwe66T64bhCNDZkP5xxNHxF-lsE1A=s900-c-k-c0x00ffffff-no-rj", status: "online" },
            { id: 'vinicius', name: "Vinicius Gallo", avatar: "./img/viniciusGallo.jpg", status: "online" }
        ];
        const friendsHTML = mockFriends.map(friend => `
            <a href="perfil.html?id=${friend.id}" class="friend" title="${friend.name}">
                <div class="friend-avatar ${friend.status}"><img src="${friend.avatar}" alt="${friend.name}"></div>
                <span>${friend.name.split(' ')[0]}</span>
            </a>`).join('');
        onlineFriendsContainer.innerHTML = `<div class="section-header"><h3><i class="fas fa-user-friends"></i> Colegas Online</h3><a href="#" class="see-all">Ver todos</a></div><div class="friends-grid">${friendsHTML}</div>`;
    }

    function loadAllWidgets() {
        const eventsWidget = document.getElementById('upcoming-events-widget');
        if (eventsWidget) {
            const mockEventos = [
                { id: 5, titulo: "Semana da Cibersegurança", data: new Date(2025, 9, 9), formato: "Híbrido" },
                { id: 2, titulo: "Workshop de APIs com Node.js", data: new Date(2025, 9, 15), formato: "Online" },
                { id: 6, titulo: "Construindo seu Portfólio", data: new Date(2025, 10, 12), formato: "Online" }
            ];
            const proximosEventos = mockEventos.filter(e => e.data >= new Date()).sort((a, b) => a.data - b.data).slice(0, 3);
            let eventsHTML = `<div class="widget-header"><h3><i class="fas fa-calendar-star"></i> Próximos Eventos</h3><a href="evento.html" class="see-all">Ver todos</a></div><div class="events-preview-list">`;
            if (proximosEventos.length) {
                proximosEventos.forEach(evento => {
                    const dia = evento.data.getDate();
                    const mes = evento.data.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
                    eventsHTML += `<div class="event-preview-item"><div class="event-preview-date"><span>${dia}</span><span>${mes}</span></div><div class="event-preview-info"><h4>${evento.titulo}</h4><p><i class="fas fa-map-marker-alt"></i> ${evento.formato}</p></div></div>`;
                });
            } else {
                eventsHTML += '<p class="empty-message">Nenhum evento programado.</p>';
            }
            eventsWidget.innerHTML = eventsHTML + '</div>';
        }
    }

    // ==================== INICIALIZAÇÃO ====================
    init();
});