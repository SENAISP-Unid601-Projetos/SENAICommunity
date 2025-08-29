document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E VARIÁVEIS GLOBAIS ---
    const backendUrl = 'http://localhost:8080';
    const jwtToken = localStorage.getItem('token');
    const defaultAvatarUrl = 'assets/images/default-avatar.png'; // ⬅️ CAMINHO PARA SEU ÍCONE PADRÃO
    let stompClient = null;
    let currentUser = null;

    // --- ELEMENTOS DO DOM ---
    const modal = document.getElementById('create-post-modal');
    const openModalBtn = document.getElementById('open-post-modal-btn');
    const openModalInput = document.getElementById('post-creator-input');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const createPostForm = document.getElementById('create-post-form');
    const postsContainer = document.querySelector('.posts-container');
    const logoutBtn = document.getElementById('logout-btn');

    // --- INICIALIZAÇÃO ---
    function init() {
        if (!jwtToken) {
            console.log("Nenhum token encontrado, redirecionando para o login.");
            window.location.href = 'login.html';
            return;
        }
        axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
        loadUserDataAndConnect();
        setupEventListeners();
    }
    
    // --- CARREGAMENTO DE DADOS E CONEXÃO ---
    async function loadUserDataAndConnect() {
        try {
            const response = await axios.get(`${backendUrl}/usuarios/me`);
            currentUser = response.data;
            updateUIWithUserData(currentUser);
            connectWebSocket(); // Conecta ao WebSocket após carregar os dados
        } catch (error) {
            console.error("Erro ao buscar dados do usuário ou conectar:", error);
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        }
    }

    function updateUIWithUserData(user) {
        const userImage = user.urlFotoPerfil ? user.urlFotoPerfil : defaultAvatarUrl;
        
        document.getElementById('topbar-user-name').textContent = user.nome;
        document.getElementById('sidebar-user-name').textContent = user.nome;
        document.getElementById('sidebar-user-title').textContent = user.titulo || 'Membro da Comunidade';

        document.getElementById('topbar-user-img').src = userImage;
        document.getElementById('sidebar-user-img').src = userImage;
        document.getElementById('post-creator-img').src = userImage;
    }
    
    // ✅ FUNÇÃO DE CONEXÃO AJUSTADA
    function connectWebSocket() {
        if (!jwtToken) {
            console.error("Token JWT não encontrado para conexão WebSocket.");
            return;
        }
        
        const socket = new SockJS(`${backendUrl}/ws`);
        stompClient = Stomp.over(socket);
        stompClient.debug = null; // Desativa logs do Stomp para um console mais limpo

        const headers = {
            'Authorization': 'Bearer ' + jwtToken
        };

        stompClient.connect(headers, 
            (frame) => { // Callback de sucesso
                console.log('Conectado ao WebSocket com sucesso:', frame);
                fetchPublicPosts();

                // Inscrição para o feed público
                stompClient.subscribe('/topic/publico', (message) => {
                    const payload = JSON.parse(message.body);
                    handlePublicFeedUpdate(payload);
                });

            }, 
            (error) => { // Callback de erro
                console.error('Erro de conexão WebSocket:', error);
                // A mensagem "Whoops! Lost connection..." geralmente aparece aqui.
                // Isso confirma que a conexão foi negada ou perdida.
            }
        );
    }
    
    // --- MANIPULAÇÃO DO FEED (com avatar padrão) ---
    async function fetchPublicPosts() {
        try {
            const response = await axios.get(`${backendUrl}/postagens`);
            postsContainer.innerHTML = '';
            const posts = response.data;
            posts.forEach(post => showPublicPost(post));
        } catch (error) {
            console.error("Erro ao buscar postagens:", error);
            postsContainer.innerHTML = '<p>Não foi possível carregar o feed.</p>';
        }
    }

    function showPublicPost(post, prepend = false) {
        const postElement = createPostElement(post);
        if (prepend) {
            postsContainer.prepend(postElement);
        } else {
            postsContainer.appendChild(postElement);
        }
    }

    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.id = `post-${post.id}`;

        const dataFormatada = new Date(post.dataCriacao).toLocaleString('pt-BR');
        // ✅ LÓGICA DO AVATAR PADRÃO APLICADA AQUI TAMBÉM
        const autorAvatar = post.autor.urlFotoPerfil ? post.autor.urlFotoPerfil : defaultAvatarUrl;
        
        let mediaHtml = '<div class="post-media">';
        if(post.urlsMidia && post.urlsMidia.length > 0){
            post.urlsMidia.forEach(url => {
                 if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    mediaHtml += `<img src="${url}" alt="Mídia da postagem">`;
                } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    mediaHtml += `<video controls src="${url}"></video>`;
                }
            });
        }
        mediaHtml += '</div>';

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author-avatar">
                    <img src="${autorAvatar}" alt="Avatar de ${post.autor.nome}">
                </div>
                <div class="post-author-info">
                    <strong>${post.autor.nome}</strong>
                    <span>${dataFormatada}</span>
                </div>
            </div>
            <div class="post-content">
                <p>${post.conteudo}</p>
            </div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i> <span>${post.totalCurtidas || 0}</span>
                </button>
                <button class="action-btn">
                    <i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
                </button>
            </div>
            <div class="comments-section">
                 <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário...">
                    <button onclick="sendComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
        return postElement;
    }

    function handlePublicFeedUpdate(payload) {
        const postElement = document.getElementById(`post-${payload.id}`);

        if (payload.tipo === 'remocao') {
            postElement?.remove();
        } else if (payload.tipo === 'edicao') {
             fetchAndReplacePost(payload.id);
        } else { // Nova postagem
            if (!postElement) {
                showPublicPost(payload, true); // Adiciona no topo
            }
        }
    }
    
    async function fetchAndReplacePost(postId) {
         try {
            const response = await axios.get(`${backendUrl}/postagens/${postId}`);
            const updatedPost = response.data;
            
            const oldPostElement = document.getElementById(`post-${postId}`);
            if (oldPostElement) {
                const newPostElement = createPostElement(updatedPost);
                oldPostElement.replaceWith(newPostElement);
            }
        } catch (e) {
            console.error("Falha ao recarregar post:", e);
        }
    }

    function showPublicPost(post, prepend = false) {
        const postElement = createPostElement(post);
        if (prepend) {
            postsContainer.prepend(postElement);
        } else {
            postsContainer.appendChild(postElement);
        }
    }

    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.id = `post-${post.id}`;

        const dataFormatada = new Date(post.dataCriacao).toLocaleString('pt-BR');
        const defaultAvatar = 'https://via.placeholder.com/45';
        
        let mediaHtml = '<div class="post-media">';
        if(post.urlsMidia && post.urlsMidia.length > 0){
            post.urlsMidia.forEach(url => {
                 if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                    mediaHtml += `<img src="${url}" alt="Mídia da postagem">`;
                } else if (url.match(/\.(mp4|webm|ogg)$/i)) {
                    mediaHtml += `<video controls src="${url}"></video>`;
                }
            });
        }
        mediaHtml += '</div>';

        postElement.innerHTML = `
            <div class="post-header">
                <div class="post-author-avatar">
                    <img src="${post.autor.urlFotoPerfil || defaultAvatar}" alt="Avatar de ${post.autor.nome}">
                </div>
                <div class="post-author-info">
                    <strong>${post.autor.nome}</strong>
                    <span>${dataFormatada}</span>
                </div>
                </div>
            <div class="post-content">
                <p>${post.conteudo}</p>
            </div>
            ${mediaHtml}
            <div class="post-actions">
                <button class="action-btn ${post.curtidoPeloUsuario ? 'liked' : ''}" onclick="toggleLike(${post.id})">
                    <i class="fas fa-heart"></i> <span>${post.totalCurtidas}</span>
                </button>
                <button class="action-btn">
                    <i class="fas fa-comment"></i> <span>${post.comentarios?.length || 0}</span>
                </button>
                </div>
            <div class="comments-section">
                 <div class="comment-form">
                    <input type="text" id="comment-input-${post.id}" placeholder="Adicione um comentário...">
                    <button onclick="sendComment(${post.id})"><i class="fas fa-paper-plane"></i></button>
                </div>
                </div>
        `;
        return postElement;
    }

    // --- AÇÕES DO USUÁRIO (POSTAR, COMENTAR, CURTIR) ---
    async function handleCreatePost(event) {
        event.preventDefault();
        const formData = new FormData(createPostForm);
        
        const postData = {
            conteudo: formData.get('conteudo')
        };

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
            toggleModal(false);
            // O novo post aparecerá via WebSocket, não precisa de reload manual
        } catch (error) {
            console.error("Erro ao criar postagem:", error);
            alert("Não foi possível criar a postagem.");
        }
    }
    
    window.sendComment = function(postId) {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        if (stompClient && content) {
            stompClient.send(`/app/postagem/${postId}/comentar`, {}, JSON.stringify({ conteudo: content }));
            input.value = '';
            // O comentário será atualizado via WebSocket, recarregando o post
        }
    }

    window.toggleLike = async function(postId) {
        try {
            await axios.post(`${backendUrl}/curtidas/toggle`, { postagemId: postId });
            // A atualização virá via WebSocket, recarregando o post
        } catch(error) {
            console.error("Erro ao curtir post:", error);
            alert("Ocorreu um erro ao processar sua curtida.");
        }
    }
    
    // --- MANIPULAÇÃO DO MODAL E EVENTOS ---
    function toggleModal(show) {
        modal.style.display = show ? 'flex' : 'none';
    }

    function setupEventListeners() {
        openModalBtn.addEventListener('click', () => toggleModal(true));
        openModalInput.addEventListener('click', () => toggleModal(true));
        closeModalBtn.addEventListener('click', () => toggleModal(false));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                toggleModal(false);
            }
        });
        createPostForm.addEventListener('submit', handleCreatePost);
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
        // Adicionar manipulador para o floating action button (se necessário)
        const mainFloatBtn = document.querySelector('.floating-actions .main-btn');
        mainFloatBtn.addEventListener('click', () => {
             document.querySelector('.floating-actions').classList.toggle('active');
        });
    }
    
    // --- INICIAR APLICAÇÃO ---
    init();
});