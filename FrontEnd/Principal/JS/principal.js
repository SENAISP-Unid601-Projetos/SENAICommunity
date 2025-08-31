document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    let stompClient = null;
    let currentUser = null;

    // --- ELEMENTOS DO DOM ---
    const postsContainer = document.querySelector('.posts-container');
    const logoutBtn = document.getElementById('logout-btn');
    const modal = document.getElementById('create-post-modal');
    const openModalBtn = document.getElementById('open-post-modal-btn');
    const openModalInput = document.getElementById('post-creator-input');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createPostForm = document.getElementById('create-post-form');

    // --- INICIALIZAÇÃO ---
    async function init() {
        if (!jwtToken) {
            console.log("Nenhum token encontrado, redirecionando para o login.");
            window.location.href = 'login.html';
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;

        try {
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            connectWebSocket();
            setupEventListeners();
        } catch (error) {
            console.error("Erro na inicialização:", error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }
    
    // --- FUNÇÕES DE UI ---
    function updateUIWithUserData(user) {
        const userImage = `${backendUrl}${user.urlFotoPerfil}`;
        
        document.getElementById('topbar-user-name').textContent = user.nome;
        document.getElementById('sidebar-user-name').textContent = user.nome;
        document.getElementById('sidebar-user-title').textContent = user.titulo || 'Membro da Comunidade';

        document.getElementById('topbar-user-img').src = userImage;
        document.getElementById('sidebar-user-img').src = userImage;
        document.getElementById('post-creator-img').src = userImage;
    }

    // --- LÓGICA DO WEBSOCKET E DADOS ---
    function connectWebSocket() {
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null;
        const headers = { 'Authorization': `Bearer ${jwtToken}` };

        stompClient.connect(headers, (frame) => {
            console.log('CONECTADO AO WEBSOCKET COM SUCESSO', frame);
            fetchPublicPosts();

            stompClient.subscribe('/topic/publico', (message) => {
                const payload = JSON.parse(message.body);
                handlePublicFeedUpdate(payload);
            });
        }, (error) => {
            console.error('ERRO DE CONEXÃO WEBSOCKET:', error);
        });
    }
    
    async function fetchPublicPosts() {
        try {
            const response = await axios.get(`${backendUrl}/api/chat/publico`);
            postsContainer.innerHTML = '';
            const sortedPosts = response.data.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
            sortedPosts.forEach(post => showPublicPost(post));
        } catch (error) {
            console.error("Erro ao buscar postagens:", error);
            postsContainer.innerHTML = '<p>Não foi possível carregar o feed.</p>';
        }
    }

    // --- FUNÇÕES DE RENDERIZAÇÃO COMPLETAS ---
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.id = `post-${post.id}`;

        // ✅ LÓGICA DE SEGURANÇA para compatibilidade com a API
        const autorNome = post.autor ? post.autor.nome : (post.nomeAutor || 'Usuário Desconhecido');
        const autorAvatarUrl = post.autor ? post.autor.urlFotoPerfil : '/images/default-avatar.png';
        
        const dataFormatada = new Date(post.dataCriacao).toLocaleString('pt-BR');
        const autorAvatar = `${backendUrl}${autorAvatarUrl}`;

        let mediaHtml = '<div class="post-media">';
        if (post.urlsMidia && post.urlsMidia.length > 0) {
            post.urlsMidia.forEach(url => {
                const fullMediaUrl = url.startsWith('http') ? url : `${backendUrl}${url}`;
                if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    mediaHtml += `<img src="${fullMediaUrl}" alt="Mídia da postagem">`;
                } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    mediaHtml += `<video controls src="${fullMediaUrl}"></video>`;
                }
            });
        }
        mediaHtml += '</div>';

        let commentsHtml = '';
        if (post.comentarios && post.comentarios.length > 0) {
            post.comentarios.sort((a, b) => new Date(a.dataCriacao) - new Date(b.dataCriacao)).forEach(comment => {
                const commentAuthorName = comment.autor ? comment.autor.nome : (comment.nomeAutor || 'Usuário');
                const commentAuthorAvatarUrl = comment.autor ? comment.autor.urlFotoPerfil : '/images/default-avatar.png';
                const commentAuthorAvatar = `${backendUrl}${commentAuthorAvatarUrl}`;
                commentsHtml += `
                    <div class="comment" id="comment-${comment.id}">
                        <div class="comment-avatar">
                            <img src="${commentAuthorAvatar}" alt="Avatar de ${commentAuthorName}">
                        </div>
                        <div class="comment-body">
                            <strong>${commentAuthorName}</strong>
                            <p>${comment.conteudo}</p>
                        </div>
                    </div>
                `;
            });
        }

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author-avatar">
                    <img src="${autorAvatar}" alt="Avatar de ${autorNome}">
                </div>
                <div class="post-author-info">
                    <strong>${autorNome}</strong>
                    <span>${dataFormatada}</span>
                </div>
            </div>
            <div class="post-content"><p>${post.conteudo}</p></div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? 'liked' : ''}" onclick="window.toggleLike(${post.id})">
                    <i class="fas fa-heart"></i> <span id="like-count-${post.id}">${post.totalCurtidas || 0}</span>
                </button>
                <button class="action-btn" onclick="window.toggleComments(${post.id})">
                    <i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-section-${post.id}" style="display: none;">
                <div class="comments-list">${commentsHtml}</div>
                <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário...">
                    <button onclick="window.sendComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        return postElement;
    }

    function showPublicPost(post, prepend = false) {
        const postElement = createPostElement(post);
        if (prepend) {
            postsContainer.prepend(postElement);
        } else {
            postsContainer.appendChild(postElement);
        }
    }
    
    // --- FUNÇÕES DE ATUALIZAÇÃO E INTERAÇÃO ---
    async function fetchAndReplacePost(postId) {
        try {
            const response = await axios.get(`${backendUrl}/postagens/${postId}`); // Ajuste se seu endpoint for outro
            const updatedPost = response.data;
            const oldPostElement = document.getElementById(`post-${postId}`);
            if (oldPostElement) {
                const newPostElement = createPostElement(updatedPost);
                oldPostElement.replaceWith(newPostElement);
            }
        } catch (error) {
            console.error(`Falha ao recarregar post ${postId}:`, error);
        }
    }
    
    function handlePublicFeedUpdate(payload) {
        const postData = payload.postagem || payload;
        if (postData && postData.id) {
            fetchAndReplacePost(postData.id);
        }
    }

    // --- FUNÇÕES GLOBAIS PARA ONCLICK ---
    window.toggleComments = function(postId) {
        const commentsSection = document.getElementById(`comments-section-${postId}`);
        if (commentsSection) {
            const isVisible = commentsSection.style.display === 'block';
            commentsSection.style.display = isVisible ? 'none' : 'block';
        }
    };
    
    window.sendComment = function(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        if (stompClient && stompClient.connected && content) {
            stompClient.send(`/app/postagem/${postId}/comentar`, {}, JSON.stringify({ conteudo: content }));
            input.value = '';
        }
    };

    window.toggleLike = async function(postId) {
        const likeButton = document.querySelector(`#post-${postId} .action-btn`);
        const likeCountSpan = document.getElementById(`like-count-${postId}`);
        if (!likeButton || !likeCountSpan) return;

        const isLiked = likeButton.classList.contains('liked');
        let currentLikes = parseInt(likeCountSpan.textContent, 10);

        // Atualiza a UI imediatamente
        likeButton.classList.toggle('liked');
        likeCountSpan.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;

        try {
            await axios.post(`${backendUrl}/curtidas/toggle`, { postagemId: postId });
        } catch(error) {
            console.error("Erro ao curtir post:", error);
            // Reverte a UI em caso de erro
            likeButton.classList.toggle('liked'); // desfaz a ação visual
            likeCountSpan.textContent = currentLikes; // volta ao número original
            alert("Ocorreu um erro ao processar sua curtida.");
        }
    };

    function setupEventListeners() {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
        
        openModalBtn.addEventListener('click', () => modal.style.display = 'flex');
        openModalInput.addEventListener('click', () => modal.style.display = 'flex');
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        createPostForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(createPostForm);
            const postData = { conteudo: formData.get('conteudo') };
            const blob = new Blob([JSON.stringify(postData)], { type: 'application/json' });
            const finalFormData = new FormData();
            finalFormData.append('postagem', blob);
            const files = document.getElementById('file-input').files;
            for (let i = 0; i < files.length; i++) {
                finalFormData.append('arquivos', files[i]);
            }
            try {
                await axios.post(`${backendUrl}/postagem/upload-mensagem`, finalFormData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                createPostForm.reset();
                modal.style.display = 'none';
            } catch (error) {
                console.error("Erro ao criar postagem:", error);
                alert("Não foi possível criar a postagem.");
            }
        });
    }
    
    // --- PONTO DE ENTRADA ---
    init();
});